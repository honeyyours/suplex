// 공종별 기본 키워드 매핑.
// 회사 생성 시 또는 수동 seed API 호출 시 PhaseKeywordRule을 채운다.
// 매칭은 longest-first (긴 키워드 우선) — phaseDetect.js 참고.

const ROWS = [
  // 철거
  { phase: '철거', keyword: '철거' },
  { phase: '철거', keyword: '데모' },
  { phase: '철거', keyword: 'demo' },

  // 목공
  { phase: '목공', keyword: '목공' },
  { phase: '목공', keyword: '조적' },
  { phase: '목공', keyword: '아트월' },
  { phase: '목공', keyword: '우물천장' },
  { phase: '목공', keyword: '천장 작업' },

  // 전기
  { phase: '전기', keyword: '전기' },
  { phase: '전기', keyword: '콘센트' },
  { phase: '전기', keyword: '배선' },
  { phase: '전기', keyword: '스위치' },
  { phase: '전기', keyword: '조명 작업' },

  // 설비
  { phase: '설비', keyword: '설비' },
  { phase: '설비', keyword: '배관' },
  { phase: '설비', keyword: '급수' },
  { phase: '설비', keyword: '배수' },
  { phase: '설비', keyword: '보일러' },

  // 타일
  { phase: '타일', keyword: '타일' },
  { phase: '타일', keyword: '메지' },
  { phase: '타일', keyword: '욕실 시공' },

  // 도배
  { phase: '도배', keyword: '도배' },
  { phase: '도배', keyword: '벽지' },

  // 도장
  { phase: '도장', keyword: '도장' },
  { phase: '도장', keyword: '페인트' },
  { phase: '도장', keyword: '베란다 도장' },

  // 필름
  { phase: '필름', keyword: '필름' },
  { phase: '필름', keyword: '시트지' },
  { phase: '필름', keyword: '문선 래핑' },

  // 마루
  { phase: '마루', keyword: '마루' },
  { phase: '마루', keyword: '강마루' },
  { phase: '마루', keyword: '원목마루' },

  // 준공
  { phase: '준공', keyword: '준공' },
  { phase: '준공', keyword: '입주청소' },
  { phase: '준공', keyword: '하자점검' },
  { phase: '준공', keyword: '준공청소' },
];

function buildSeedRows() {
  return ROWS.map((r) => ({
    keyword: r.keyword,
    phase: r.phase,
    active: true,
  }));
}

module.exports = { buildSeedRows };
