// 공종별 표준 사진 체크리스트 템플릿 — phase는 일정 카테고리(철거/목공/전기/...)와 매칭
// 회사 생성 시 또는 수동 seed API 호출 시 이 데이터로 ChecklistTemplate을 채운다.

const ROWS = [
  // 철거
  { phase: '철거', title: '철거 전 전체 사진 (공간별)', requiresPhoto: true },
  { phase: '철거', title: '철거 후 전체 사진 (공간별)', requiresPhoto: true },
  { phase: '철거', title: '폐기물 반출 완료 확인',       requiresPhoto: true },

  // 목공
  { phase: '목공', title: '목공 작업 전 사진',           requiresPhoto: true },
  { phase: '목공', title: '천장/우물천장 골조 사진',     requiresPhoto: true },
  { phase: '목공', title: '아트월/가벽 시공 사진',       requiresPhoto: true },
  { phase: '목공', title: '목공 작업 완료 사진',         requiresPhoto: true },

  // 전기
  { phase: '전기', title: '전기 배선 사진 (천장/벽)',     requiresPhoto: true },
  { phase: '전기', title: '스위치/콘센트 위치 확인',      requiresPhoto: true },
  { phase: '전기', title: '배전반 사진',                  requiresPhoto: true },

  // 설비
  { phase: '설비', title: '급배수 배관 사진',            requiresPhoto: true },
  { phase: '설비', title: '난방 분배기 사진',            requiresPhoto: true },

  // 타일
  { phase: '타일', title: '타일 시공 전 바탕 면 사진',   requiresPhoto: true },
  { phase: '타일', title: '타일 시공 완료 사진',         requiresPhoto: true },
  { phase: '타일', title: '메지/줄눈 마감 확인',         requiresPhoto: true },

  // 도배
  { phase: '도배', title: '도배 전 벽 면 사진',          requiresPhoto: true },
  { phase: '도배', title: '도배 완료 사진',              requiresPhoto: true },

  // 도장
  { phase: '도장', title: '도장 전 면 처리 사진',        requiresPhoto: true },
  { phase: '도장', title: '도장 완료 사진',              requiresPhoto: true },

  // 필름
  { phase: '필름', title: '필름 시공 전 사진',           requiresPhoto: true },
  { phase: '필름', title: '필름 시공 완료 사진',         requiresPhoto: true },

  // 마루
  { phase: '마루', title: '마루 시공 전 바닥 사진',      requiresPhoto: true },
  { phase: '마루', title: '마루 시공 완료 사진',         requiresPhoto: true },

  // 준공
  { phase: '준공', title: '준공 청소 완료 사진',         requiresPhoto: true },
  { phase: '준공', title: '준공 전체 공간별 사진',       requiresPhoto: true },
  { phase: '준공', title: '하자 점검 (지정 항목)',       requiresPhoto: false },
];

function buildSeedRows() {
  return ROWS.map((r, idx) => ({
    title: r.title,
    category: 'GENERAL',
    phase: r.phase,
    requiresPhoto: r.requiresPhoto,
    orderIndex: idx,
    active: true,
  }));
}

module.exports = { buildSeedRows };
