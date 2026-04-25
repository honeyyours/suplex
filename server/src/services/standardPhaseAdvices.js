// 인테리어 표준 공정 어드바이스 — 회사가 처음 시드할 때 16개 기본값
// 트리거: 일정 entry 생성/수정 시 (entry.date - daysBefore) 날짜에 ProjectChecklist 자동 생성
const STANDARD_ADVICES = [
  { phase: '철거', daysBefore: 3,  title: '관리실 협의 — 보양/엘리베이터/소음 시간', category: '관리실 협의' },
  { phase: '철거', daysBefore: 1,  title: '입구·복도·엘리베이터 보양 작업',          category: '안전' },
  { phase: '설비', daysBefore: 3,  title: '분배기 위치 확인 / 가스 차단 일정 협의',  category: '관리실 협의' },
  { phase: '전기', daysBefore: 1,  title: '도면 최종 점검 — 콘센트/스위치 위치',     category: '사전 준비' },
  { phase: '목공', daysBefore: 7,  title: '합판·각재 발주 확인',                     category: '자재' },
  { phase: '목공', daysBefore: 1,  title: '도면 최종 점검 + 자재 적치 위치 확보',    category: '사전 준비' },
  { phase: '타일', daysBefore: 3,  title: '타일 색상/사이즈 최종 확정 + 본드/메지 준비', category: '자재' },
  { phase: '도배', daysBefore: 2,  title: '도배지 검수, 본드/풀 도착 확인',          category: '자재' },
  { phase: '도배', daysBefore: 1,  title: '벽면 보수 / 퍼티 마감 점검',              category: '사전 준비' },
  { phase: '욕실', daysBefore: 3,  title: '방수 시공 일정 / 도기·수전 모델 최종 확정', category: '자재' },
  { phase: '도장', daysBefore: 3,  title: '도장 색상 컨펌 + 시너 환기 계획',         category: '안전' },
  { phase: '필름', daysBefore: 2,  title: '필름 도착 확인 + 기존 실리콘 제거 준비',  category: '사전 준비' },
  { phase: '가구', daysBefore: 7,  title: '가구 도면 최종 발주 + 사이즈 재확인',     category: '자재' },
  { phase: '가전', daysBefore: 7,  title: '가전 모델 사이즈 최종 확정 + 빌트인 타공 도면', category: '자재' },
  { phase: '입주', daysBefore: 7,  title: '청소 업체 예약 + 입주 전 사진 점검 일정', category: '사전 준비' },
  { phase: '입주', daysBefore: 1,  title: '잔손 리스트 확정 + 전기·가스 검침',       category: '사전 준비' },
];

module.exports = { STANDARD_ADVICES };
