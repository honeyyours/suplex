// 출구정리 추론엔진 (이름 고정 — 메모리 `수플렉스_규칙_출구정리.md` 참조).
//
// 책임: 통장 거래 1건 in → 매칭 후보 (발주·PhasePeriod·자동분류 룰) out, 점수 + 신호 라벨.
// 자동 라벨 절대 X. 후보 1~3개만 제시, 사람이 1-클릭 컨펌.
//
// Step 1 (2026-04-30): PhasePeriod derive — DailyScheduleEntry로부터 (projectId, phaseKey)
// 별로 연속 구간을 묶어 PhasePeriod 배열로 반환.
// Step 2 (2026-04-30): 발주 매칭 후보 — 통장 거래 1건 → PurchaseOrder 후보 점수화.
// 결정론적 룰만 (AI 자동분류 보류 정책 준수).

const prisma = require('../config/prisma');
const { normalizePhase } = require('./phases');

// 디폴트 gap 임계 (일). gap > 임계 → 별도 PhasePeriod.
// 예: 도배 1차 (4/1~4/3) + 도배 2차 (4/15~4/16)
const DEFAULT_GAP_THRESHOLD_DAYS = 5;

// 두 Date 사이의 "캘린더 일자" 차이 (시간/분/초 무시).
function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / ms);
}

/**
 * PhasePeriod 배열 반환.
 * @param {string} projectId
 * @param {object} [options]
 * @param {number} [options.gapThresholdDays=5] gap 초과 시 별도 period로 쪼갬
 * @returns {Promise<Array<{phaseKey: string, phaseLabel: string, start: Date, end: Date, days: number, entryCount: number}>>}
 */
async function getPhasePeriods(projectId, options = {}) {
  const gap = options.gapThresholdDays ?? DEFAULT_GAP_THRESHOLD_DAYS;
  if (!projectId) return [];

  const entries = await prisma.dailyScheduleEntry.findMany({
    where: { projectId, category: { not: null } },
    select: { category: true, date: true },
    orderBy: [{ category: 'asc' }, { date: 'asc' }],
  });
  if (entries.length === 0) return [];

  // (정규화된 phaseKey) → 정렬된 unique 일자 배열
  const byPhase = new Map(); // phaseKey → { phaseLabel, dates: Date[] (오름차순, 중복 제거) }
  for (const e of entries) {
    const phase = normalizePhase(e.category);
    if (!phase) continue;
    let bucket = byPhase.get(phase.key);
    if (!bucket) {
      bucket = { phaseLabel: phase.label, dates: [] };
      byPhase.set(phase.key, bucket);
    }
    const last = bucket.dates[bucket.dates.length - 1];
    if (!last || daysBetween(last, e.date) !== 0) {
      bucket.dates.push(e.date);
    }
  }

  const periods = [];
  for (const [phaseKey, { phaseLabel, dates }] of byPhase.entries()) {
    if (dates.length === 0) continue;

    let start = dates[0];
    let end = dates[0];
    let count = 1;

    for (let i = 1; i < dates.length; i++) {
      const d = dates[i];
      if (daysBetween(end, d) <= gap) {
        end = d;
        count += 1;
      } else {
        periods.push({
          phaseKey,
          phaseLabel,
          start,
          end,
          days: daysBetween(start, end) + 1,
          entryCount: count,
        });
        start = d;
        end = d;
        count = 1;
      }
    }
    periods.push({
      phaseKey,
      phaseLabel,
      start,
      end,
      days: daysBetween(start, end) + 1,
      entryCount: count,
    });
  }

  // 시작일 오름차순. 같은 시작일이면 phaseKey 알파벳.
  periods.sort((a, b) => {
    const t = a.start.getTime() - b.start.getTime();
    if (t !== 0) return t;
    return a.phaseKey.localeCompare(b.phaseKey);
  });
  return periods;
}

/**
 * 특정 일자에 진행 중이던 PhasePeriod들을 반환. 통장 거래 1건의 거래일을 기준으로
 * 매칭 후보 PhasePeriod를 좁힐 때 사용.
 * @param {Array} periods getPhasePeriods 결과
 * @param {Date|string} targetDate
 * @param {object} [options]
 * @param {number} [options.windowDaysBefore=0] 시작 전 N일까지 포함 (자재 선반입)
 * @param {number} [options.windowDaysAfter=0] 종료 후 N일까지 포함 (사후 결제)
 */
function findActivePeriods(periods, targetDate, options = {}) {
  const before = options.windowDaysBefore ?? 0;
  const after = options.windowDaysAfter ?? 0;
  const t = new Date(targetDate);
  return periods.filter((p) => {
    const lo = -before;
    const hi = after;
    const fromStart = daysBetween(p.start, t); // 음수면 시작 전
    const fromEnd = daysBetween(p.end, t); // 양수면 종료 후
    return fromStart >= lo && fromEnd <= hi;
  });
}

// ============================================================
// Step 2: 발주 매칭 후보 — 통장 거래 1건 → PurchaseOrder 후보 점수
// ============================================================

// 거래처명 정규화 — 주식회사·(주)·㈜·유한회사·공백·특수문자 제거 + 소문자.
function normalizeVendorText(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\(주\)|㈜|주식회사|유한회사|\(유\)|㈜/g, '')
    .replace(/[\s\-_·.,()[\]{}/]/g, '')
    .trim();
}

// 두 텍스트의 겹침 강도 (0~1).
// - 정규화 후 동일 → 1
// - 한쪽이 다른 쪽을 포함 (>=2자) → 0.7
// - 공통 토큰(>=2자) 있음 → 0.4
// - 그 외 → 0
function vendorOverlap(a, b) {
  const na = normalizeVendorText(a);
  const nb = normalizeVendorText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.length >= 2 && nb.length >= 2 && (na.includes(nb) || nb.includes(na))) return 0.7;
  // 토큰 기반 — 원문(소문자)에서 공백·특수문자로 split
  const tokenize = (s) => String(s).toLowerCase().split(/[\s\-_·.,()[\]{}/]+/).filter((t) => t.length >= 2);
  const ta = new Set(tokenize(a));
  const tb = tokenize(b);
  for (const t of tb) {
    if (ta.has(t)) return 0.4;
  }
  return 0;
}

// 두 일자 절대 차이.
function absDays(a, b) {
  if (!a || !b) return Infinity;
  return Math.abs(daysBetween(new Date(a), new Date(b)));
}

const STATUS_BOOST = {
  ORDERED: 5,
  RECEIVED: 5,
  PENDING: 3,
  CANCELLED: -100, // 사실상 제외
};

// PurchaseOrder의 매칭 금액 — totalPrice 우선, 없으면 quantity * unitPrice.
function poAmount(po) {
  if (po.totalPrice != null) return Number(po.totalPrice);
  if (po.quantity != null && po.unitPrice != null) {
    return Number(po.quantity) * Number(po.unitPrice);
  }
  return null;
}

/**
 * 통장 거래 1건에 대해 발주 매칭 후보를 점수화해서 반환.
 * @param {object} txn 통장 거래 — { amount, date, vendorText, projectId? }
 * @param {string} companyId 회사 ID (소속 프로젝트의 발주만 조회)
 * @param {object} [options]
 * @param {number} [options.minScore=30] 이 점수 미만 후보 제외
 * @param {number} [options.limit=5] 반환 최대 개수
 * @param {boolean} [options.includeAlreadyLinked=true] 이미 다른 Expense에 연결된 PO도 포함 (분할 결제 케이스)
 * @returns {Promise<Array<{purchaseOrder: object, score: number, signals: object}>>}
 */
async function findPurchaseOrderCandidates(txn, companyId, options = {}) {
  const minScore = options.minScore ?? 30;
  const limit = options.limit ?? 5;
  if (!companyId) return [];

  const amount = Number(txn.amount);
  if (!Number.isFinite(amount) || amount <= 0) return [];
  const txnDate = txn.date ? new Date(txn.date) : null;

  const where = {
    project: { companyId },
    status: { not: 'CANCELLED' },
  };
  if (txn.projectId) where.projectId = txn.projectId;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, siteAddress: true } },
      vendorEntity: { select: { id: true, name: true, category: true } },
      expenses: { select: { id: true } },
    },
    take: 500, // 안전 상한
  });

  const candidates = [];
  for (const po of orders) {
    const signals = {
      vendor: 0,        // 0~40
      amount: 0,        // 0~30
      date: 0,          // 0~15
      project: 0,       // 0~10
      statusBoost: 0,   // -100~5
    };

    // 거래처
    const vendorOverlapVendor = vendorOverlap(txn.vendorText || '', po.vendor || '');
    const vendorOverlapEntity = vendorOverlap(txn.vendorText || '', po.vendorEntity?.name || '');
    const vendorBest = Math.max(vendorOverlapVendor, vendorOverlapEntity);
    signals.vendor = Math.round(vendorBest * 40);

    // 금액
    const a = poAmount(po);
    if (a != null && a > 0) {
      const diff = Math.abs(amount - a) / a;
      if (diff < 0.001) signals.amount = 30;
      else if (diff <= 0.01) signals.amount = 25;
      else if (diff <= 0.05) signals.amount = 15;
      else if (diff <= 0.10) signals.amount = 5;
    }

    // 날짜 — expectedDate 기준 (없으면 orderedAt 또는 receivedAt)
    const refDate = po.expectedDate || po.orderedAt || po.receivedAt;
    if (txnDate && refDate) {
      const d = absDays(refDate, txnDate);
      if (d === 0) signals.date = 15;
      else if (d <= 3) signals.date = 10;
      else if (d <= 7) signals.date = 5;
      else if (d <= 14) signals.date = 2;
    }

    // 현장 (txn.projectId 일치)
    if (txn.projectId && po.projectId === txn.projectId) signals.project = 10;

    // 상태 가산
    signals.statusBoost = STATUS_BOOST[po.status] ?? 0;

    const score =
      signals.vendor +
      signals.amount +
      signals.date +
      signals.project +
      signals.statusBoost;

    if (score < minScore) continue;

    candidates.push({
      purchaseOrder: po,
      score,
      signals,
      alreadyLinked: po.expenses.length > 0,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

module.exports = {
  getPhasePeriods,
  findActivePeriods,
  findPurchaseOrderCandidates,
  normalizeVendorText,
  vendorOverlap,
  DEFAULT_GAP_THRESHOLD_DAYS,
};
