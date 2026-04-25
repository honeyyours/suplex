// 공정별 D-N 룰 — 자재가 공정 시작 며칠 전까지 도착해야 하는지
// 키는 마감재의 spaceGroup / 일정의 category와 매칭됨 (정확 일치 + trim, 대소문자 동일 처리는 호출 측에서)
//
// 회사별 커스텀은 Phase 3에서 PhaseDeadlineRule 모델로 도입 예정.
// 그때까지 모든 회사가 이 표준값 사용.
const PHASE_DEADLINE_DAYS = {
  // 인테리어 표준 공정 (자주 쓰이는 그룹명 위주)
  철거: 0,
  '철거 및 폐기물': 0,
  설비: 2,
  가스: 2,
  전기: 1,
  소방: 1,
  목공: 3,
  타일: 2,
  욕실: 2,
  도장: 3,
  필름: 3,
  도배: 2,
  바닥: 3,
  바닥재: 3,
  마감: 2,
  '마감 공사': 2,
  조명: 5,
  // 가전·가구는 실외 발송이 길어서 D-N 더 큼
  가전: 7,
  '가전·가구': 7,
  가구: 7,
  '일반 가구': 5,
  // 공통/기타
  공통: 3,
  창호: 7,
  '공통 (기초/설비)': 3,
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
