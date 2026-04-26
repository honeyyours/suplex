// 인테리어 표준 공정 어드바이스 — 회사가 처음 시드할 때 기본값
// 트리거: 일정 entry 생성/수정 시 (entry.date - daysBefore) 날짜에 ProjectChecklist 자동 생성
//
// 두 종류가 통합되어 있음 (옛 ChecklistTemplate + PhaseAdvice):
//   1) requiresPhoto=true + daysBefore=0    → 시공 사진 증거 (옛 ChecklistTemplate)
//   2) requiresPhoto=false + daysBefore>0   → 사전 액션 아이템 (옛 PhaseAdvice)
const STANDARD_ADVICES = [
  // ===== 사전 어드바이스 (D-N) =====
  { phase: '철거', daysBefore: 3,  title: '관리실 협의 — 보양/엘리베이터/소음 시간', category: '관리실 협의', requiresPhoto: false },
  { phase: '철거', daysBefore: 1,  title: '입구·복도·엘리베이터 보양 작업',          category: '안전',       requiresPhoto: false },
  { phase: '설비', daysBefore: 3,  title: '분배기 위치 확인 / 가스 차단 일정 협의',  category: '관리실 협의', requiresPhoto: false },
  { phase: '전기', daysBefore: 1,  title: '도면 최종 점검 — 콘센트/스위치 위치',     category: '사전 준비',  requiresPhoto: false },
  { phase: '목공', daysBefore: 7,  title: '합판·각재 발주 확인',                     category: '자재',       requiresPhoto: false },
  { phase: '목공', daysBefore: 1,  title: '도면 최종 점검 + 자재 적치 위치 확보',    category: '사전 준비',  requiresPhoto: false },
  { phase: '타일', daysBefore: 3,  title: '타일 색상/사이즈 최종 확정 + 본드/메지 준비', category: '자재',    requiresPhoto: false },
  { phase: '도배', daysBefore: 2,  title: '도배지 검수, 본드/풀 도착 확인',          category: '자재',       requiresPhoto: false },
  { phase: '도배', daysBefore: 1,  title: '벽면 보수 / 퍼티 마감 점검',              category: '사전 준비',  requiresPhoto: false },
  { phase: '도장', daysBefore: 3,  title: '도장 색상 컨펌 + 시너 환기 계획',         category: '안전',       requiresPhoto: false },
  { phase: '필름', daysBefore: 2,  title: '필름 도착 확인 + 기존 실리콘 제거 준비',  category: '사전 준비',  requiresPhoto: false },
  { phase: '준공', daysBefore: 7,  title: '청소 업체 예약 + 입주 전 사진 점검 일정', category: '사전 준비',  requiresPhoto: false },
  { phase: '준공', daysBefore: 1,  title: '잔손 리스트 확정 + 전기·가스 검침',       category: '사전 준비',  requiresPhoto: false },

  // ===== 시공 사진 증거 (옛 ChecklistTemplate) — daysBefore=0, requiresPhoto=true =====
  // 철거
  { phase: '철거', daysBefore: 0,  title: '철거 전 전체 사진 (공간별)',  category: '사진', requiresPhoto: true },
  { phase: '철거', daysBefore: 0,  title: '철거 후 전체 사진 (공간별)',  category: '사진', requiresPhoto: true },
  { phase: '철거', daysBefore: 0,  title: '폐기물 반출 완료 확인',         category: '사진', requiresPhoto: true },
  // 목공
  { phase: '목공', daysBefore: 0,  title: '목공 작업 전 사진',             category: '사진', requiresPhoto: true },
  { phase: '목공', daysBefore: 0,  title: '천장/우물천장 골조 사진',       category: '사진', requiresPhoto: true },
  { phase: '목공', daysBefore: 0,  title: '아트월/가벽 시공 사진',         category: '사진', requiresPhoto: true },
  { phase: '목공', daysBefore: 0,  title: '목공 작업 완료 사진',           category: '사진', requiresPhoto: true },
  // 전기
  { phase: '전기', daysBefore: 0,  title: '전기 배선 사진 (천장/벽)',      category: '사진', requiresPhoto: true },
  { phase: '전기', daysBefore: 0,  title: '스위치/콘센트 위치 확인',       category: '사진', requiresPhoto: true },
  { phase: '전기', daysBefore: 0,  title: '배전반 사진',                   category: '사진', requiresPhoto: true },
  // 설비
  { phase: '설비', daysBefore: 0,  title: '급배수 배관 사진',              category: '사진', requiresPhoto: true },
  { phase: '설비', daysBefore: 0,  title: '난방 분배기 사진',              category: '사진', requiresPhoto: true },
  // 타일
  { phase: '타일', daysBefore: 0,  title: '타일 시공 전 바탕 면 사진',     category: '사진', requiresPhoto: true },
  { phase: '타일', daysBefore: 0,  title: '타일 시공 완료 사진',           category: '사진', requiresPhoto: true },
  { phase: '타일', daysBefore: 0,  title: '메지/줄눈 마감 확인',           category: '사진', requiresPhoto: true },
  // 도배
  { phase: '도배', daysBefore: 0,  title: '도배 전 벽 면 사진',            category: '사진', requiresPhoto: true },
  { phase: '도배', daysBefore: 0,  title: '도배 완료 사진',                category: '사진', requiresPhoto: true },
  // 도장
  { phase: '도장', daysBefore: 0,  title: '도장 전 면 처리 사진',          category: '사진', requiresPhoto: true },
  { phase: '도장', daysBefore: 0,  title: '도장 완료 사진',                category: '사진', requiresPhoto: true },
  // 필름
  { phase: '필름', daysBefore: 0,  title: '필름 시공 전 사진',             category: '사진', requiresPhoto: true },
  { phase: '필름', daysBefore: 0,  title: '필름 시공 완료 사진',           category: '사진', requiresPhoto: true },
  // 마루
  { phase: '마루', daysBefore: 0,  title: '마루 시공 전 바닥 사진',        category: '사진', requiresPhoto: true },
  { phase: '마루', daysBefore: 0,  title: '마루 시공 완료 사진',           category: '사진', requiresPhoto: true },
  // 준공
  { phase: '준공', daysBefore: 0,  title: '준공 청소 완료 사진',           category: '사진', requiresPhoto: true },
  { phase: '준공', daysBefore: 0,  title: '준공 전체 공간별 사진',         category: '사진', requiresPhoto: true },
];

module.exports = { STANDARD_ADVICES };
