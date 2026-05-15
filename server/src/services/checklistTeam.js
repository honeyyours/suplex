// 체크리스트의 팀 분류 자동 추론.
// 사용처: 체크리스트 생성·수정 시(사용자가 명시 지정 안 한 경우),
//        시스템 룰 자동 시드 시, 그리고 대시보드 분류 검증용.

const ORDER_KEYWORDS = /발주|자재|주문|매입|배송|입고/;
const DESIGN_KEYWORDS = /마감재|샘플|모델|시안|컬러칩|컬러 ?시트|선정|확정/;

// (phase, title) → 'FIELD' | 'DESIGN' | 'ORDER' | 'OTHER'
function inferChecklistTeam({ phase, title }) {
  const p = (phase || '').trim();
  const t = title || '';

  // 명시적 phase 우선
  if (p === '발주') return 'ORDER';
  if (p === '마감재') return 'DESIGN';

  // 키워드 추론
  if (ORDER_KEYWORDS.test(t)) return 'ORDER';
  if (DESIGN_KEYWORDS.test(t)) return 'DESIGN';

  // 표준 25공정에 해당하는 phase 면 현장 (대표적인 것들)
  const FIELD_PHASES = new Set([
    '철거', '설비', '전기', '목공', '필름', '도장', '도배',
    '바닥', '타일', '욕실', '주방', '가구', '조명', '청소',
    '준공', '입주', '미장', '단열', '창호', '석재', '유리',
  ]);
  if (FIELD_PHASES.has(p)) return 'FIELD';

  return 'OTHER';
}

module.exports = { inferChecklistTeam };
