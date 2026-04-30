import { useEffect, useRef, useState } from 'react';
import { useEscape } from '../hooks/useEscape';

// 작은 단일 입력 모달. window.prompt() 대체.
// Enter 제출 / ESC 취소 / 자동 포커스 + 기존 값 select / 다크모드 정합.
export default function InputModal({
  title,
  defaultValue = '',
  placeholder = '',
  hint = '',
  confirmLabel = '저장',
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);
  useEscape(true, onCancel);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function submit(e) {
    e.preventDefault();
    onConfirm(value);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:ring-1 dark:ring-white/10 w-full max-w-sm p-5"
      >
        <h3 className="text-base font-semibold text-navy-800 dark:text-navy-200 mb-3">{title}</h3>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 outline-none"
        />
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{hint}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
