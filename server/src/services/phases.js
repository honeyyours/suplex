// 표준 공정(척추) — closed 25종 (2026-04-28 결정)
// 정책: 회사가 마음대로 추가 X. 자유 텍스트 입력은 normalizePhase로 25개 안에 정규화.
// 매핑 실패는 'OTHER'(기타)로 흡수 — 통합 기능(D-N 룰·자동 발주·AI비서 통합 답변) 미작동.
// 자세한 정책: 메모리 `수플렉스_설계_핵심결정.md`

// 시공 순서 정렬 (D-N 룰·일정 정렬에 활용)
const STANDARD_PHASES = Object.freeze([
  { key: 'START',           label: '시작',                order:  1, hint: '보양·자재반입' },
  { key: 'DEMOLITION',      label: '철거',                order:  2 },
  { key: 'INSULATION',      label: '단열',                order:  3 },
  { key: 'WATERPROOF',      label: '방수',                order:  4 },
  { key: 'PLASTERING',      label: '미장',                order:  5 },
  { key: 'PLUMBING',        label: '설비',                order:  6, hint: '배관·수도' },
  { key: 'ELECTRIC',        label: '전기',                order:  7 },
  { key: 'GAS',             label: '가스',                order:  8 },
  { key: 'FIRE',             label: '소방',                order:  9 },
  { key: 'WINDOW',          label: '창호·샷시',           order: 10 },
  { key: 'INNER_DOOR',      label: '중문',                order: 11 },
  { key: 'CARPENTRY',       label: '목공',                order: 12 },
  { key: 'TILE',            label: '타일',                order: 13, hint: '욕실·바닥·주방 모두' },
  { key: 'BATHROOM',        label: '욕실',                order: 14, hint: '도기·수전 설치' },
  { key: 'METAL',           label: '금속',                order: 15 },
  { key: 'GLASS',           label: '유리·거울',           order: 16 },
  { key: 'WALLPAPER',       label: '도배',                order: 17 },
  { key: 'PAINTING',        label: '도장',                order: 18 },
  { key: 'FILM',            label: '필름',                order: 19 },
  { key: 'FURNITURE',       label: '가구',                order: 20, hint: '싱크대·인조대리석 상판 포함' },
  { key: 'FLOORING',        label: '마루·장판',           order: 21 },
  { key: 'SYSTEM_AC',       label: '시스템에어컨',         order: 22 },
  { key: 'MOVE_IN_CLEAN',   label: '입주청소',             order: 23 },
  { key: 'FINISHING',       label: '마무리(점검, 실리콘)', order: 24 },
  { key: 'OTHER',           label: '기타',                order: 99, hint: '표준 외 — 통합 기능 미작동' },
]);

const STANDARD_LABELS = STANDARD_PHASES.map((p) => p.label);
const LABEL_TO_PHASE = new Map(STANDARD_PHASES.map((p) => [p.label, p]));
const KEY_TO_PHASE = new Map(STANDARD_PHASES.map((p) => [p.key, p]));

// 자주 쓰는 자유 텍스트 → 표준 라벨 별칭 (회사 PhaseKeywordRule이 우선, 이건 fallback)
const BUILT_IN_ALIASES = Object.freeze({
  // 도배
  '벽지': '도배', '도배지': '도배', '실크벽지': '도배', '합지': '도배',
  // 창호
  '샤시': '창호·샷시', '샷시': '창호·샷시', '창호': '창호·샷시', '발코니창': '창호·샷시',
  // 가구
  '싱크대': '가구', '주방가구': '가구', '붙박이장': '가구', '인조대리석': '가구', '엔지니어드스톤': '가구',
  // 청소
  '청소': '입주청소', '준공청소': '입주청소', '입주청소': '입주청소',
  // 가전
  '에어컨': '시스템에어컨', '시스템': '시스템에어컨', 'SAC': '시스템에어컨',
  // 마무리
  '실리콘': '마무리(점검, 실리콘)', '점검': '마무리(점검, 실리콘)', '하자보수': '마무리(점검, 실리콘)',
  // 마루·장판
  '마루': '마루·장판', '장판': '마루·장판', '데코타일': '마루·장판', '강마루': '마루·장판', '강화마루': '마루·장판',
  // 시작·철거
  '보양': '시작', '자재반입': '시작', '철거공사': '철거',
  // 욕실
  '도기': '욕실', '수전': '욕실', '욕실시공': '욕실',
  // 유리·거울
  '거울': '유리·거울', '유리': '유리·거울', '파티션': '유리·거울',
  // 금속
  '난간': '금속', '문틀': '금속',
  // 중문
  '중문': '중문',
  // 단열·방수·미장
  '단열재': '단열', '방수공사': '방수', '미장공사': '미장',
});

// 자유 텍스트 → 표준 phase 객체 또는 OTHER
// (회사 PhaseKeywordRule은 별도 — phaseDetect.js가 우선 적용. 이건 그 fallback)
function normalizePhase(text) {
  if (!text) return KEY_TO_PHASE.get('OTHER');
  const trimmed = String(text).trim();
  if (!trimmed) return KEY_TO_PHASE.get('OTHER');

  // 1) 정확 라벨 일치
  if (LABEL_TO_PHASE.has(trimmed)) return LABEL_TO_PHASE.get(trimmed);

  // 2) 별칭 정확 일치
  const aliasLabel = BUILT_IN_ALIASES[trimmed];
  if (aliasLabel) return LABEL_TO_PHASE.get(aliasLabel);

  // 3) 부분 일치 — 표준 라벨이 텍스트에 포함되거나 그 반대
  const lower = trimmed.toLowerCase();
  for (const p of STANDARD_PHASES) {
    if (p.key === 'OTHER') continue;
    const lbl = p.label.toLowerCase();
    if (lower.includes(lbl) || lbl.includes(lower)) return p;
  }

  // 4) 별칭 부분 일치
  for (const [aliasKey, label] of Object.entries(BUILT_IN_ALIASES)) {
    if (lower.includes(aliasKey.toLowerCase())) return LABEL_TO_PHASE.get(label);
  }

  // 5) 매핑 실패 → 기타
  return KEY_TO_PHASE.get('OTHER');
}

module.exports = {
  STANDARD_PHASES,
  STANDARD_LABELS,
  LABEL_TO_PHASE,
  KEY_TO_PHASE,
  BUILT_IN_ALIASES,
  normalizePhase,
};
