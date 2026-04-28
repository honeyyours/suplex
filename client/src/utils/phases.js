// 표준 공정(척추) — closed 25종 (클라이언트 사본)
// 백엔드 `server/src/services/phases.js`와 매트릭스 일치 유지
// 정책: 메모리 `수플렉스_설계_핵심결정.md` "표준 공정 라이브러리"

export const STANDARD_PHASES = Object.freeze([
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

export const STANDARD_LABELS = STANDARD_PHASES.map((p) => p.label);
const LABEL_TO_PHASE = new Map(STANDARD_PHASES.map((p) => [p.label, p]));
const KEY_TO_PHASE = new Map(STANDARD_PHASES.map((p) => [p.key, p]));

const BUILT_IN_ALIASES = Object.freeze({
  '벽지': '도배', '도배지': '도배', '실크벽지': '도배', '합지': '도배',
  '샤시': '창호·샷시', '샷시': '창호·샷시', '창호': '창호·샷시', '발코니창': '창호·샷시',
  '싱크대': '가구', '주방가구': '가구', '붙박이장': '가구', '인조대리석': '가구', '엔지니어드스톤': '가구',
  '청소': '입주청소', '준공청소': '입주청소', '입주청소': '입주청소',
  '에어컨': '시스템에어컨', '시스템': '시스템에어컨', 'SAC': '시스템에어컨',
  '실리콘': '마무리(점검, 실리콘)', '점검': '마무리(점검, 실리콘)', '하자보수': '마무리(점검, 실리콘)',
  '마루': '마루·장판', '장판': '마루·장판', '데코타일': '마루·장판', '강마루': '마루·장판', '강화마루': '마루·장판',
  '보양': '시작', '자재반입': '시작', '철거공사': '철거',
  '도기': '욕실', '수전': '욕실', '욕실시공': '욕실',
  '거울': '유리·거울', '유리': '유리·거울', '파티션': '유리·거울',
  '난간': '금속', '문틀': '금속',
  '중문': '중문',
  '단열재': '단열', '방수공사': '방수', '미장공사': '미장',
});

// 자유 텍스트 → 표준 phase 객체 또는 OTHER
export function normalizePhase(text) {
  if (!text) return KEY_TO_PHASE.get('OTHER');
  const trimmed = String(text).trim();
  if (!trimmed) return KEY_TO_PHASE.get('OTHER');
  if (LABEL_TO_PHASE.has(trimmed)) return LABEL_TO_PHASE.get(trimmed);
  const aliasLabel = BUILT_IN_ALIASES[trimmed];
  if (aliasLabel) return LABEL_TO_PHASE.get(aliasLabel);
  const lower = trimmed.toLowerCase();
  for (const p of STANDARD_PHASES) {
    if (p.key === 'OTHER') continue;
    const lbl = p.label.toLowerCase();
    if (lower.includes(lbl) || lbl.includes(lower)) return p;
  }
  for (const [aliasKey, label] of Object.entries(BUILT_IN_ALIASES)) {
    if (lower.includes(aliasKey.toLowerCase())) return LABEL_TO_PHASE.get(label);
  }
  return KEY_TO_PHASE.get('OTHER');
}

export function isOther(label) {
  return label === '기타' || label === 'OTHER';
}
