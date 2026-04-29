import { categoryClass } from '../utils/date';
import { isOther } from '../utils/phases';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

// 일정 텍스트 표시 — 공정 chip은 항상 좌측 prefix.
// 매칭된 키워드(phaseKeyword 또는 phase 이름 자체)는 본문에서 제거하고 양옆 공백 정리.
// 정책 (2026-04-28):
//   - phase가 '기타'이거나 매칭 없음 → chip 미표시, 자유 텍스트 그대로 (단순 메모)
//   - 모바일: chip만 표시 (잔여 텍스트 hidden). 셀 탭/클릭 시 상세 모달에서 전체 확인
//   - 웹: chip + 잔여 텍스트 같이
export default function PhaseInlineContent({ entry, textClassName = '', chipClassName = '', alwaysShowRemainder = false }) {
  const { displayPhase } = usePhaseLabels();
  const text = entry.content || '';
  const phase = entry.category;

  // phase 매칭 없음 또는 '기타' → 자유 텍스트로 처리
  if (!phase || isOther(phase)) {
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
      <span className={`inline-block text-[9px] sm:text-[10px] px-1 py-0.5 rounded ${catColor} ${chipClassName}`}>
        {displayPhase(phase)}
      </span>
      {/* 잔여 텍스트는 웹에서만 표시 (모바일은 chip만 — 좁은 셀 가독성).
          alwaysShowRemainder=true면 모바일 상세 시트 등에서 강제 노출 */}
      {remainder && (
        <span className={`${alwaysShowRemainder ? '' : 'hidden sm:inline'} truncate ${textClassName}`}>{remainder}</span>
      )}
    </>
  );
}
