// 출구정리 추론엔진 (이름 고정 — 메모리 `수플렉스_규칙_출구정리.md` 참조).
//
// 책임: 통장 거래 1건 in → 매칭 후보 (발주·PhasePeriod·자동분류 룰) out, 점수 + 신호 라벨.
// 자동 라벨 절대 X. 후보 1~3개만 제시, 사람이 1-클릭 컨펌.
//
// Step 1 (2026-04-30): PhasePeriod derive — DailyScheduleEntry로부터 (projectId, phaseKey)
// 별로 연속 구간을 묶어 PhasePeriod 배열로 반환. 발주 매칭/카드 좌표 추론은 후속 단계.

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

module.exports = {
  getPhasePeriods,
  findActivePeriods,
  DEFAULT_GAP_THRESHOLD_DAYS,
};
