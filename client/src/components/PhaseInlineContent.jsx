import { categoryClass } from '../utils/date';

// 일정 텍스트 표시 — 매칭된 공정 키워드를 inline chip으로 임베드
// 우선순위:
//   1) entry.phaseKeyword(서버가 매칭해 내려준 원본 substring)가 있으면 그 위치를 chip으로
//   2) 없지만 content 안에 entry.category 문자열이 들어있으면 그 위치를 chip으로
//   3) 매칭 못 찾으면 좌측에 작은 chip + 원문 텍스트 (fallback)
export default function PhaseInlineContent({ entry, textClassName = '', chipClassName = '' }) {
  const text = entry.content || '';
  const phase = entry.category;
  const catColor = phase ? categoryClass(phase) : '';

  if (!phase) {
    return <span className={`truncate ${textClassName}`}>{text}</span>;
  }

  let start = -1;
  let len = 0;
  if (entry.phaseKeyword) {
    const idx = text.toLowerCase().indexOf(entry.phaseKeyword.toLowerCase());
    if (idx >= 0) {
      start = idx;
      len = entry.phaseKeyword.length;
    }
  }
  if (start < 0) {
    const idx = text.toLowerCase().indexOf(phase.toLowerCase());
    if (idx >= 0) {
      start = idx;
      len = phase.length;
    }
  }

  if (start < 0) {
    return (
      <>
        <span className={`inline-block text-[10px] px-1 py-0.5 rounded ${catColor} ${chipClassName}`}>
          {phase}
        </span>
        <span className={`truncate ${textClassName}`}>{text}</span>
      </>
    );
  }

  const before = text.slice(0, start);
  const after = text.slice(start + len);
  return (
    <span className={`truncate ${textClassName}`}>
      {before}
      <span className={`inline-block text-[10px] px-1 py-0.5 rounded align-baseline ${catColor} ${chipClassName}`}>
        {phase}
      </span>
      {after}
    </span>
  );
}
