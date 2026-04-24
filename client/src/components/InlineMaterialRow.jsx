import { useEffect, useRef, useState } from 'react';
import { STATUS_META, KIND_META } from '../api/materials';
import { getFormSchema } from '../utils/materialFormSchemas';
import StatusPickerPopover from './StatusPickerPopover';

// 인라인 행 — 기본은 표시만, 펼침 시 그 자리에서 가로 grid 폼.
// 자동 debounce 저장. 키보드 네비.

const SAVE_DELAY = 1000;

export default function InlineMaterialRow({
  material,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onSave,           // (patch) => Promise
  onStatusChange,   // (status) => Promise
  onTabExitForward, // 마지막 필드에서 Tab → 다음 행 펼침 요청
  onTabExitBackward,
  onDelete,         // () => void
  onShowHistory,
}) {
  const status = STATUS_META[material.status] || STATUS_META.UNDECIDED;
  const kind = KIND_META[material.kind] || KIND_META.FINISH;
  const schema = getFormSchema(material.formKey);
  const isNA = material.status === 'NOT_APPLICABLE';
  const isReused = material.status === 'REUSED';
  const isInheriting = !!material.inheritFromMaterialId && !!material.inheritFrom;
  const showFields = !isNA && !isReused && !isInheriting;
  const muted = isNA;
  const [picker, setPicker] = useState(null);

  // 자재명 영역 — schema 기반 라벨+값 칩
  const src = isInheriting ? material.inheritFrom : material;
  const summaryChips = buildSummaryChips(src, schema);
  const hasMaterial = summaryChips.length > 0;

  return (
    <div
      role="row"
      data-material-id={material.id}
      onClick={(e) => {
        if (e.target.closest('[data-no-row-click]')) return;
        onSelect();
        if (!isExpanded) onToggleExpand();
      }}
      className={`border-b cursor-pointer transition ${
        muted ? 'opacity-50' : ''
      } ${
        isExpanded ? 'bg-navy-50/40' : isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* 표시 행 */}
      <div className="px-2 py-2 grid grid-cols-[20px_1fr_auto] sm:grid-cols-[20px_minmax(140px,200px)_1fr_auto] items-center gap-3 text-sm">
        {/* 체크 */}
        <span className="flex items-center justify-center">
          {material.checked ? (
            <span className="w-4 h-4 bg-emerald-500 text-white rounded-sm flex items-center justify-center text-[10px]">✓</span>
          ) : (
            <span className="w-4 h-4 border border-gray-300 rounded-sm" />
          )}
        </span>

        {/* 항목명 + kind 태그 + 시공노트 */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-gray-800 truncate">{material.itemName}</span>
            <span className={`text-[9px] font-semibold px-1.5 py-px rounded ${kind.color}`}>
              {kind.label}
            </span>
          </div>
          {material.siteNotes && (
            <div className="text-[11px] text-gray-500 truncate mt-0.5">{material.siteNotes}</div>
          )}
        </div>

        {/* 자재명 셀 — 라벨+값 칩 풀 표시 */}
        <div className="hidden sm:block min-w-0">
          {isReused || isNA ? (
            <span className="text-xs text-gray-400 italic">{isReused ? '♻️ 재사용' : '⊘ 해당 없음'}</span>
          ) : hasMaterial ? (
            <div className="flex flex-wrap gap-1 items-center">
              {isInheriting && <span className="text-[10px] flex-shrink-0">🔗</span>}
              {summaryChips.map((c, i) => (
                <span
                  key={i}
                  className={`inline-flex items-stretch overflow-hidden rounded-md border text-sm ${
                    isInheriting ? 'border-sky-300' : 'border-gray-300'
                  }`}
                >
                  <span className={`px-2.5 py-1 font-medium ${
                    isInheriting ? 'bg-sky-200 text-sky-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {c.label}
                  </span>
                  <span className={`px-3 py-1 font-semibold ${
                    isInheriting ? 'bg-sky-50 text-sky-900' : 'bg-gray-50 text-gray-900'
                  }`}>
                    {c.value}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">🔍 자재명 입력... (Enter)</span>
          )}
        </div>

        {/* 상태 pill — 클릭 시 4-옵션 팝오버 */}
        <button
          type="button"
          data-no-row-click
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setPicker({ x: rect.right, y: rect.bottom + 4 });
          }}
          title="클릭해서 변경 (또는 1/2/3/4 키)"
          className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap hover:ring-2 hover:ring-navy-300 transition ${status.color}`}
        >
          {status.short || status.label}
        </button>
        {picker && (
          <StatusPickerPopover
            x={picker.x}
            y={picker.y}
            current={material.status}
            onPick={(s) => { setPicker(null); onStatusChange(s); }}
            onClose={() => setPicker(null)}
          />
        )}
      </div>

      {/* 펼침 영역 — 가로 grid */}
      {isExpanded && (
        <ExpandedEditor
          material={material}
          schema={schema}
          showFields={showFields}
          isInheriting={isInheriting}
          isReused={isReused}
          isNA={isNA}
          onSave={onSave}
          onStatusChange={onStatusChange}
          onTabExitForward={onTabExitForward}
          onTabExitBackward={onTabExitBackward}
          onClose={() => onToggleExpand()}
          onDelete={onDelete}
          onShowHistory={onShowHistory}
        />
      )}
    </div>
  );
}

function ExpandedEditor({
  material, schema, showFields, isInheriting, isReused, isNA,
  onSave, onClose, onDelete, onShowHistory,
  onTabExitForward, onTabExitBackward,
}) {
  // 모든 필드 = schema fields + 매입처 + 비고
  const allFields = [
    ...schema.fields,
    { key: '__purchaseSource__', label: '매입처', type: 'text', target: '__purchaseSource__' },
    { key: '__memo__', label: '비고', type: 'text', target: '__memo__' },
  ];

  const inputRefs = useRef([]);
  const [draft, setDraft] = useState(() => buildDraft(material, schema));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const timerRef = useRef(null);
  const flashTimerRef = useRef(null);
  // 외부 unmount 시 pending 저장 flush를 위한 ref들
  const pendingDraftRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const schemaRef = useRef(schema);
  useEffect(() => { onSaveRef.current = onSave; });
  useEffect(() => { schemaRef.current = schema; });

  // 펼침 직후 첫 input focus + unmount 시 pending 저장 flush
  useEffect(() => {
    const first = inputRefs.current.find((r) => r);
    if (first) requestAnimationFrame(() => first.focus());
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      // 펜딩 변경 있으면 fire-and-forget 저장
      if (pendingDraftRef.current) {
        const patch = computePatch(pendingDraftRef.current, schemaRef.current);
        onSaveRef.current(patch).catch((e) => console.error('flush save failed:', e));
        pendingDraftRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(key, value) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    pendingDraftRef.current = next;
    scheduleSave(next);
  }

  function scheduleSave(next) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(next), SAVE_DELAY);
  }

  async function persist(next) {
    setSaving(true);
    try {
      const patch = computePatch(next, schema);
      await onSave(patch);
      pendingDraftRef.current = null;
      setSavedFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  // pending 저장 즉시 flush (펼침 닫힐 때)
  async function flushAndClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      await persist(draft);
    }
    onClose();
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Escape') {
      e.preventDefault();
      flushAndClose();
    } else if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault();
          flushAndClose();
          onTabExitBackward?.();
        }
      } else {
        if (idx === inputRefs.current.length - 1) {
          e.preventDefault();
          flushAndClose();
          onTabExitForward?.();
        }
      }
    } else if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      // Enter — 다음 필드 (textarea 제외)
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
      else { flushAndClose(); onTabExitForward?.(); }
    }
  }

  if (!showFields) {
    return (
      <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500 flex items-center justify-between">
        <span>
          {isInheriting && '🔗 거실 값 사용 중'}
          {isReused && '♻️ 재사용 — 모델/스펙 입력 불필요'}
          {isNA && '⊘ 해당 없음 — 적용되지 않음'}
        </span>
        <FooterActions
          saving={saving}
          savedFlash={savedFlash}
          onShowHistory={onShowHistory}
          onDelete={onDelete}
          onClose={flushAndClose}
        />
      </div>
    );
  }

  return (
    <div
      data-no-row-click
      onClick={(e) => e.stopPropagation()}
      className="px-3 py-3 border-t bg-white"
    >
      {/* 가로 grid 폼 */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
        {allFields.map((f, idx) => {
          const value = draft[f.key] ?? '';
          return (
            <CellField
              key={f.key}
              field={f}
              value={value}
              onChange={(v) => update(f.key, v)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              inputRef={(el) => { inputRefs.current[idx] = el; }}
            />
          );
        })}
      </div>

      <FooterActions
        saving={saving}
        savedFlash={savedFlash}
        onShowHistory={onShowHistory}
        onDelete={onDelete}
        onClose={flushAndClose}
      />
    </div>
  );
}

function FooterActions({ saving, savedFlash, onShowHistory, onDelete, onClose }) {
  return (
    <div className="flex items-center justify-between text-[11px] text-gray-500">
      <div className="flex items-center gap-3">
        {saving && <span className="text-amber-600">저장 중...</span>}
        {!saving && savedFlash && <span className="text-emerald-600">✓ 저장됨</span>}
        {!saving && !savedFlash && <span className="text-gray-400">자동 저장 · Tab 이동 · Esc 닫기</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-no-row-click
          onClick={(e) => { e.stopPropagation(); onShowHistory?.(); }}
          className="text-gray-500 hover:text-navy-700 hover:underline"
        >📜 이력 (H)</button>
        <button
          type="button"
          data-no-row-click
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="text-red-500 hover:underline"
        >🗑 삭제 (Del)</button>
        <button
          type="button"
          data-no-row-click
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-gray-500 hover:text-navy-700"
        >닫기 (Esc)</button>
      </div>
    </div>
  );
}

function CellField({ field, value, onChange, onKeyDown, inputRef }) {
  const { type, label, placeholder, options, unit, key } = field;
  const labelEl = (
    <span className="block text-[10px] font-medium text-gray-500 mb-0.5">
      {label}{unit ? ` (${unit})` : ''}
    </span>
  );

  if (type === 'select') {
    return (
      <label className="block">
        {labelEl}
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full text-xs px-2 py-1.5 border rounded bg-white"
        >
          <option value=""></option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (type === 'radio') {
    return (
      <label className="block">
        {labelEl}
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full text-xs px-2 py-1.5 border rounded bg-white"
        >
          <option value=""></option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (type === 'number') {
    return (
      <label className="block">
        {labelEl}
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full text-xs px-2 py-1.5 border rounded"
        />
      </label>
    );
  }
  if (type === 'multiline') {
    return (
      <label className="block col-span-full">
        {labelEl}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // textarea에선 Enter/Tab 행이동 X (들여쓰기/줄바꿈 보존)
            if (e.key === 'Escape') onKeyDown(e);
          }}
          placeholder={placeholder}
          rows={2}
          className="w-full text-xs px-2 py-1.5 border rounded resize-y"
        />
      </label>
    );
  }
  return (
    <label className="block">
      {labelEl}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full text-xs px-2 py-1.5 border rounded"
      />
    </label>
  );
}

// row 표시용 라벨+값 칩 — schema 순서대로 채워진 필드만
function buildSummaryChips(material, schema) {
  const cs = material.customSpec || {};
  const out = [];
  for (const f of schema.fields) {
    let value;
    if (f.target === 'brand') value = material.brand;
    else if (f.target === 'productName') value = material.productName;
    else if (f.target === 'spec') value = material.spec;
    else value = cs[f.key];
    if (!value) continue;
    out.push({ label: f.label, value: String(value) });
  }
  return out;
}

// material → form draft (key→value)
function buildDraft(material, schema) {
  const out = {};
  const cs = material.customSpec || {};
  for (const f of schema.fields) {
    if (f.target === 'brand') out[f.key] = material.brand ?? '';
    else if (f.target === 'productName') out[f.key] = material.productName ?? '';
    else if (f.target === 'spec') out[f.key] = material.spec ?? '';
    else out[f.key] = cs[f.key] ?? '';
  }
  out.__purchaseSource__ = material.purchaseSource ?? '';
  out.__memo__ = material.memo ?? '';
  return out;
}

// draft → patch (PATCH /materials/:id 페이로드)
function computePatch(draft, schema) {
  let brand = null, productName = null, spec = null;
  const customSpec = {};
  for (const f of schema.fields) {
    const v = draft[f.key];
    const trimmed = typeof v === 'string' ? v.trim() : v;
    const isEmpty = trimmed === '' || trimmed == null;
    if (f.target === 'brand') brand = isEmpty ? null : String(trimmed);
    else if (f.target === 'productName') productName = isEmpty ? null : String(trimmed);
    else if (f.target === 'spec') spec = isEmpty ? null : String(trimmed);
    else if (!isEmpty) customSpec[f.key] = trimmed;
  }
  return {
    brand,
    productName,
    spec,
    customSpec: Object.keys(customSpec).length > 0 ? customSpec : null,
    purchaseSource: (draft.__purchaseSource__ || '').trim() || null,
    memo: (draft.__memo__ || '').trim() || null,
  };
}
