import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, categoryClass } from '../utils/date';

/**
 * 캘린더 셀 안에서 엑셀처럼 빠르게 일정을 추가하는 인풋.
 *
 * 키보드:
 *  - Enter      → 저장 후 같은 셀 유지 (다음 항목 입력 가능)
 *  - Tab        → 저장 후 오른쪽 날짜로 이동
 *  - Shift+Tab  → 저장 후 왼쪽 날짜로 이동
 *  - Esc        → 저장 없이 닫기
 *  - blur       → 텍스트 있으면 자동 저장
 *
 * 상단에 빠른 공종 칩 — 클릭 시 즉시 (content=공종, category=공종)으로 저장.
 *
 * Props:
 *  - onSave: (content: string, category?: string) => void
 *  - onNavigate: (action: 'next'|'prev'|'esc') => void
 */
export default function InlineScheduleInput({ onSave, onNavigate }) {
  const [text, setText] = useState('');
  const handledRef = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function commit(direction) {
    handledRef.current = true;
    const trimmed = text.trim();
    if (trimmed) {
      onSave(trimmed);
      setText('');
    }
    if (direction === 'stay') {
      // 같은 셀 유지 — 다시 포커스 (텍스트만 비움)
      handledRef.current = false;
      requestAnimationFrame(() => ref.current?.focus());
    } else {
      onNavigate(direction);
    }
  }

  function pickCategory(cat) {
    handledRef.current = false;
    onSave(cat, cat);
    requestAnimationFrame(() => ref.current?.focus());
  }

  function handleKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handledRef.current = true;
      onNavigate('esc');
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit('stay');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commit('down');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commit('up');
    } else if (e.key === 'ArrowRight') {
      // 커서가 끝에 있을 때만 셀 이동
      if (e.target.selectionStart === e.target.value.length) {
        e.preventDefault();
        commit('next');
      }
    } else if (e.key === 'ArrowLeft') {
      // 커서가 처음에 있을 때만 셀 이동
      if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
        e.preventDefault();
        commit('prev');
      }
    }
  }

  function handleBlur() {
    if (handledRef.current) return;
    const trimmed = text.trim();
    if (trimmed) onSave(trimmed);
    onNavigate('esc');
  }

  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap gap-0.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickCategory(c)}
            title={`${c} 일정 추가`}
            className={`text-[9px] leading-none px-1 py-0.5 rounded ${categoryClass(c)} hover:opacity-80`}
          >{c}</button>
        ))}
      </div>
      <input
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder="입력 후 Enter"
        className="w-full text-[11px] border border-navy-500 rounded px-1 py-0.5 outline-none ring-1 ring-navy-500 bg-white"
      />
    </div>
  );
}
