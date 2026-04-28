// 공종별 기본 키워드 매핑 — 25개 표준 공정(척추) 기준 (2026-04-28 갱신)
// 회사 생성 시 자동 시드 + 수동 seed API에서 PhaseKeywordRule 채움.
// 매칭은 longest-first (긴 키워드 우선) — phaseDetect.js 참고.
// fallback도 phaseDetect에서 STANDARD_PHASES 라벨·BUILT_IN_ALIASES로 자동 매칭.

const ROWS = [
  // 시작
  { phase: '시작', keyword: '시작' },
  { phase: '시작', keyword: '보양' },
  { phase: '시작', keyword: '자재반입' },

  // 철거
  { phase: '철거', keyword: '철거' },
  { phase: '철거', keyword: '데모' },
  { phase: '철거', keyword: 'demo' },

  // 단열
  { phase: '단열', keyword: '단열' },
  { phase: '단열', keyword: '단열재' },

  // 방수
  { phase: '방수', keyword: '방수' },

  // 미장
  { phase: '미장', keyword: '미장' },

  // 설비
  { phase: '설비', keyword: '설비' },
  { phase: '설비', keyword: '배관' },
  { phase: '설비', keyword: '급수' },
  { phase: '설비', keyword: '배수' },
  { phase: '설비', keyword: '보일러' },

  // 전기
  { phase: '전기', keyword: '전기' },
  { phase: '전기', keyword: '콘센트' },
  { phase: '전기', keyword: '배선' },
  { phase: '전기', keyword: '스위치' },
  { phase: '전기', keyword: '조명' },

  // 가스
  { phase: '가스', keyword: '가스' },

  // 소방
  { phase: '소방', keyword: '소방' },
  { phase: '소방', keyword: '스프링클러' },

  // 창호·샷시
  { phase: '창호·샷시', keyword: '창호' },
  { phase: '창호·샷시', keyword: '샷시' },
  { phase: '창호·샷시', keyword: '샤시' },
  { phase: '창호·샷시', keyword: '발코니창' },

  // 중문
  { phase: '중문', keyword: '중문' },

  // 목공
  { phase: '목공', keyword: '목공' },
  { phase: '목공', keyword: '조적' },
  { phase: '목공', keyword: '아트월' },
  { phase: '목공', keyword: '우물천장' },

  // 타일
  { phase: '타일', keyword: '타일' },
  { phase: '타일', keyword: '메지' },

  // 욕실
  { phase: '욕실', keyword: '욕실' },
  { phase: '욕실', keyword: '도기' },
  { phase: '욕실', keyword: '수전' },

  // 금속
  { phase: '금속', keyword: '금속' },
  { phase: '금속', keyword: '난간' },
  { phase: '금속', keyword: '문틀' },

  // 유리·거울
  { phase: '유리·거울', keyword: '거울' },
  { phase: '유리·거울', keyword: '유리' },
  { phase: '유리·거울', keyword: '파티션' },

  // 도배
  { phase: '도배', keyword: '도배' },
  { phase: '도배', keyword: '도배지' },
  { phase: '도배', keyword: '벽지' },
  { phase: '도배', keyword: '실크벽지' },
  { phase: '도배', keyword: '합지' },

  // 도장
  { phase: '도장', keyword: '도장' },
  { phase: '도장', keyword: '페인트' },

  // 필름
  { phase: '필름', keyword: '필름' },
  { phase: '필름', keyword: '시트지' },

  // 가구
  { phase: '가구', keyword: '가구' },
  { phase: '가구', keyword: '싱크대' },
  { phase: '가구', keyword: '주방가구' },
  { phase: '가구', keyword: '붙박이장' },
  { phase: '가구', keyword: '인조대리석' },

  // 마루·장판
  { phase: '마루·장판', keyword: '마루' },
  { phase: '마루·장판', keyword: '장판' },
  { phase: '마루·장판', keyword: '강마루' },
  { phase: '마루·장판', keyword: '강화마루' },
  { phase: '마루·장판', keyword: '원목마루' },
  { phase: '마루·장판', keyword: '데코타일' },

  // 시스템에어컨
  { phase: '시스템에어컨', keyword: '시스템에어컨' },
  { phase: '시스템에어컨', keyword: '에어컨' },
  { phase: '시스템에어컨', keyword: 'SAC' },

  // 입주청소
  { phase: '입주청소', keyword: '입주청소' },
  { phase: '입주청소', keyword: '준공청소' },
  { phase: '입주청소', keyword: '청소' },

  // 마무리(점검, 실리콘)
  { phase: '마무리(점검, 실리콘)', keyword: '실리콘' },
  { phase: '마무리(점검, 실리콘)', keyword: '점검' },
  { phase: '마무리(점검, 실리콘)', keyword: '하자점검' },
  { phase: '마무리(점검, 실리콘)', keyword: '하자보수' },
  { phase: '마무리(점검, 실리콘)', keyword: '준공' },
];

function buildSeedRows() {
  return ROWS.map((r) => ({
    keyword: r.keyword,
    phase: r.phase,
    active: true,
  }));
}

module.exports = { buildSeedRows };
