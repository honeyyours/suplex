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
function getDeadlineDays(phaseName) {
  if (!phaseName) return DEFAULT_DEADLINE_DAYS;
  const key = String(phaseName).trim();
  if (PHASE_DEADLINE_DAYS[key] != null) return PHASE_DEADLINE_DAYS[key];
  // 부분 매칭 — "목공 공사" 같이 변형되어도 잡음
  for (const k of Object.keys(PHASE_DEADLINE_DAYS)) {
    if (key.includes(k) || k.includes(key)) return PHASE_DEADLINE_DAYS[k];
  }
  return DEFAULT_DEADLINE_DAYS;
}

module.exports = { PHASE_DEADLINE_DAYS, DEFAULT_DEADLINE_DAYS, getDeadlineDays };
