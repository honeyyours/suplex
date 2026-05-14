import { useState, useEffect, useRef } from 'react';
import { formatWon, parseWon } from '../api/quotes';

// 천 단위 콤마가 입력 중·후 모두 적용되는 공통 금액 입력.
// - value: 숫자 (raw) 또는 빈 문자열 ''
// - onChange(n: number): 변경 즉시 호출 (raw number 전달)
// - allowNegative: 음수 허용
// - allowEmpty: true면 비웠을 때 onChange('') 전달 (지출 등 미입력 의미 보존용). 기본 false → 0
export default function MoneyInput({
  value,
  onChange,
  allowNegative = false,
  allowEmpty = false,
  className = '',
  placeholder,
  min,
  max,
  disabled,
  readOnly,
  onBlur,
  onFocus,
  ...rest
}) {
  const isEmpty = value === '' || value === null || value === undefined;
  const [text, setText] = useState(isEmpty ? '' : formatWon(value));
  const focusedRef = useRef(false);

  // 외부 value 변경 시 동기화 (포커스 중이 아닐 때만)
  useEffect(() => {
    if (focusedRef.current) return;
    if (value === '' || value === null || value === undefined) {
      setText('');
    } else {
      setText(formatWon(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // 빈 입력
    if (raw === '' || raw === '-') {
      setText(raw === '-' && allowNegative ? '-' : '');
      if (allowEmpty) onChange?.('');
      else onChange?.(0);
      return;
    }
    const n = parseWon(raw);
    let final = n;
    if (!allowNegative && final < 0) final = 0;
    if (min != null && final < Number(min)) final = Number(min);
    if (max != null && final > Number(max)) final = Number(max);
    setText(formatWon(final));
    onChange?.(final);
  };

  const handleFocus = (e) => {
    focusedRef.current = true;
    e.target.select();
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    focusedRef.current = false;
    if (isEmpty && allowEmpty) {
      setText('');
    } else {
      const n = parseWon(text);
      setText(formatWon(n));
    }
    onBlur?.(e);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`text-right tabular-nums ${className}`}
      {...rest}
    />
  );
}
