import { categoryClass } from '../utils/date';

// 일정 텍스트 표시 — 공정 chip은 항상 좌측 prefix.
// 매칭된 키워드(phaseKeyword 또는 phase 이름 자체)는 본문에서 제거하고 양옆 공백 정리.
// 매칭 못 찾으면 chip 만 prefix로 두고 본문은 원문 그대로.
export default function PhaseInlineContent({ entry, textClassName = '', chipClassName = '' }) {
  const text = entry.content || '';
  const phase = entry.category;

  if (!phase) {
    return <span className={`truncate ${textClassName}`}>{text}</span>;
  }

  const catColor = categoryClass(phase);

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

  let remainder = text;
  if (start >= 0) {
    remainder = (text.slice(0, start) + text.slice(start + len)).replace(/\s+/g, ' ').trim();
  }

  return (
    <>
      <span className={`inline-block text-[10px] px-1 py-0.5 rounded ${catColor} ${chipClassName}`}>
        {phase}
      </span>
      {remainder && <span className={`truncate ${textClassName}`}>{remainder}</span>}
    </>
  );
}
