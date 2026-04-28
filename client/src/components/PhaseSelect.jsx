// 표준 공정 선택 — closed 25종 드롭다운 + 자유 입력 시 자동 정규화 미리보기
// 정책: 메모리 `수플렉스_설계_핵심결정.md` "표준 공정 라이브러리"
import { useEffect, useMemo, useRef, useState } from 'react';
import { STANDARD_PHASES, normalizePhase, isOther } from '../utils/phases';

// props:
//   value         — 현재 phase 라벨 (예: '도배')
//   onChange      — (normalizedLabel) => void  (변경 시 정규화된 라벨 전달)
//   placeholder   — 드롭다운 placeholder
//   allowFreeText — true면 "직접 입력" 모드 토글 가능 (기본 true)
//   className     — 추가 클래스
export default function PhaseSelect({
  value = '',
  onChange,
  placeholder = '공정 선택',
  allowFreeText = true,
  className = '',
  autoFocus = false,
}) {
  const [mode, setMode] = useState('select'); // 'select' | 'free'
  const [freeText, setFreeText] = useState(value || '');
  const inputRef = useRef(null);

  // value가 바뀌면 freeText 동기화 (외부 변경 반영)
  useEffect(() => {
    setFreeText(value || '');
  }, [value]);

  // 자유 입력 시 자동 정규화 미리보기
  const preview = useMemo(() => {
    if (mode !== 'free' || !freeText.trim()) return null;
    return normalizePhase(freeText);
  }, [freeText, mode]);

  function handleSelectChange(e) {
    const v = e.target.value;
    if (v === '__free__') {
      setMode('free');
      setFreeText(value || '');
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    onChange?.(v);
  }

  function commitFreeText() {
    const normalized = normalizePhase(freeText);
    onChange?.(normalized.label);
    setMode('select');
  }

  if (mode === 'free') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitFreeText(); }
              if (e.key === 'Escape') { setMode('select'); }
            }}
            placeholder="자유 입력 (예: 벽지, 샤시, 에어컨)"
            autoFocus
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
          <button
            type="button"
            onClick={commitFreeText}
            className="px-3 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800"
          >저장</button>
          <button
            type="button"
            onClick={() => { setFreeText(value || ''); setMode('select'); }}
            className="px-3 py-2 text-sm border rounded"
          >취소</button>
        </div>
        {preview && (
          <div className={`text-xs px-2 py-1 rounded border ${
            isOther(preview.label)
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {isOther(preview.label) ? (
              <>
                ⚠️ <b>{preview.label}</b>로 저장됩니다 — 표준 공정 외라 통합 기능(D-N 룰·자동 발주·AI비서 통합 답변)이 작동하지 않습니다
              </>
            ) : (
              <>
                ✓ <b>{preview.label}</b>로 자동 저장됩니다
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={handleSelectChange}
      autoFocus={autoFocus}
      className={`px-3 py-2 border rounded text-sm ${className}`}
    >
      <option value="">{placeholder}</option>
      {STANDARD_PHASES.map((p) => (
        <option key={p.key} value={p.label}>
          {p.label}{p.hint ? ` — ${p.hint}` : ''}
        </option>
      ))}
      {allowFreeText && (
        <option value="__free__">✏️ 직접 입력 (자동 정규화)</option>
      )}
    </select>
  );
}

// "기타" 표시용 작은 배지 — 그룹/라인 라벨 옆에 표시
export function OtherBadge({ phase }) {
  if (!isOther(phase)) return null;
  return (
    <span
      title="표준 공정 외 — 통합 기능(D-N 룰·자동 발주·AI비서 통합) 미작동"
      className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded"
    >
      ⚠️ 기타
    </span>
  );
}
