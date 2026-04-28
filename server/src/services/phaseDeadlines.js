// 공정별 D-N 룰 — 자재가 공정 시작 며칠 전까지 도착해야 하는지
// 키는 표준 25개 phase 라벨과 일치 (services/phases.js의 STANDARD_PHASES 라벨과 동일).
// 회사가 PhaseDeadlineRule로 자유롭게 덮어쓸 수 있음 — 여기는 시드 + fallback.
// '기타'는 통합 기능 미작동 영역이므로 D-N 룰 X (DEFAULT_DEADLINE_DAYS로 흡수).
const PHASE_DEADLINE_DAYS = {
  시작: 0,
  철거: 0,
  단열: 1,
  방수: 1,
  미장: 1,
  설비: 2,
  전기: 1,
  가스: 2,
  소방: 1,
  '창호·샷시': 14, // 제작·납기 길어 보통 2주
  중문: 7,         // 주문 제작
  목공: 3,
  타일: 3,
  욕실: 5,         // 도기·수전 발송
  금속: 7,         // 제작
  '유리·거울': 7,  // 제작
  도배: 2,
  도장: 2,
  필름: 3,
  가구: 14,        // 싱크대·붙박이 제작 보통 2주
  '마루·장판': 3,
  시스템에어컨: 7, // 실외기·실내기 발송
  입주청소: 0,
  '마무리(점검, 실리콘)': 0,
};

const DEFAULT_DEADLINE_DAYS = 3;

// spaceGroup/category 텍스트로 D-N 일수 조회. 정확 일치 우선, 부분 포함도 허용.
// companyRules가 주어지면 회사 룰 우선 (있는 phase만), 없으면 코드 상수 fallback.
//   companyRules: Map<phase, daysBefore> — DB에서 fetch 후 전달
function getDeadlineDays(phaseName, companyRules = null) {
  if (!phaseName) return DEFAULT_DEADLINE_DAYS;
  const key = String(phaseName).trim();

  // 1) 회사 룰 우선 (정확 일치 → 부분 매칭)
  if (companyRules && companyRules.size > 0) {
    if (companyRules.has(key)) return companyRules.get(key);
    for (const [k, v] of companyRules) {
      if (key.includes(k) || k.includes(key)) return v;
    }
  }
  // 2) 코드 상수 (정확 일치 → 부분 매칭)
  if (PHASE_DEADLINE_DAYS[key] != null) return PHASE_DEADLINE_DAYS[key];
  for (const k of Object.keys(PHASE_DEADLINE_DAYS)) {
    if (key.includes(k) || k.includes(key)) return PHASE_DEADLINE_DAYS[k];
  }
  return DEFAULT_DEADLINE_DAYS;
}

// 회사 룰을 DB에서 fetch (active=true만) → Map 반환
async function fetchCompanyDeadlineRules(prisma, companyId) {
  if (!companyId) return new Map();
  const rules = await prisma.phaseDeadlineRule.findMany({
    where: { companyId, active: true },
    select: { phase: true, daysBefore: true },
  });
  const map = new Map();
  for (const r of rules) map.set(r.phase, r.daysBefore);
  return map;
}

// ============================================
// 데드라인 계산 헬퍼 — PO와 Material 양쪽에서 재사용
// ============================================

// 프로젝트 IDs를 받아 각 프로젝트의 카테고리별 가장 빠른 (오늘 이후) 일정 시작일 매핑
async function fetchEarliestByCategory(prisma, projectIds) {
  if (!projectIds || projectIds.length === 0) return new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entries = await prisma.dailyScheduleEntry.findMany({
    where: { projectId: { in: projectIds }, date: { gte: today } },
    orderBy: { date: 'asc' },
    select: { projectId: true, date: true, category: true },
  });
  const map = new Map(); // projectId → Map(category → earliestDate)
  for (const e of entries) {
    if (!e.category) continue;
    const cat = String(e.category).trim();
    if (!cat) continue;
    if (!map.has(e.projectId)) map.set(e.projectId, new Map());
    const inner = map.get(e.projectId);
    if (!inner.has(cat)) inner.set(cat, e.date);
  }
  return map;
}

// spaceGroup → 매칭되는 가장 빠른 일정 시작일 (정확 일치 → 부분 포함 폴백)
function findEarliestForGroup(map, projectId, group) {
  const inner = map.get(projectId);
  if (!inner) return null;
  const g = String(group || '').trim();
  if (!g) return null;
  if (inner.has(g)) return inner.get(g);
  for (const [cat, date] of inner) {
    if (cat.includes(g) || g.includes(cat)) return date;
  }
  return null;
}

// 시작일 + group → { deadline, daysToDeadline }. companyRules는 fetchCompanyDeadlineRules 결과
function buildDeadline(earliest, group, today, companyRules = null) {
  if (!earliest) return { deadline: null, daysToDeadline: null };
  const t = today || (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const dn = getDeadlineDays(group, companyRules);
  const deadline = new Date(earliest);
  deadline.setDate(deadline.getDate() - dn);
  deadline.setHours(0, 0, 0, 0);
  const diffMs = deadline.getTime() - t.getTime();
  const daysToDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { deadline: deadline.toISOString(), daysToDeadline };
}

module.exports = {
  PHASE_DEADLINE_DAYS,
  DEFAULT_DEADLINE_DAYS,
  getDeadlineDays,
  fetchEarliestByCategory,
  findEarliestForGroup,
  buildDeadline,
  fetchCompanyDeadlineRules,
};
