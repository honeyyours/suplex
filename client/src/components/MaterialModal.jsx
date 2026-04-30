import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  materialsApi, STATUS_META, STATUS_OPTIONS, KIND_META,
  FIELD_LABEL,
} from '../api/materials';
import { getFormSchema } from '../utils/materialFormSchemas';
import { relativeTime } from '../utils/date';
import { useEscape } from '../hooks/useEscape';

// 공용부 동일 inherit 가능한 itemName (방1/방2/안방의 바닥재·도배 → 거실에서 가져옴)
const INHERITABLE_FORM_KEYS = new Set(['floor_material', 'wallpaper']);
const INHERIT_SOURCE_SPACE = '거실';

// formSchema 기반 dynamic 폼.
// brand/productName/spec는 schema의 target 지정 필드만 컬럼에 저장,
// 나머지는 customSpec JSON에 저장.

export default function MaterialModal({
  projectId,
  material,
  defaults,
  onClose,
  onSaved,
  onDeleted,
}) {
  useEscape(true, onClose);
  const isEdit = Boolean(material?.id);
  const [tab, setTab] = useState('info');
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // 항목 메타 (편집 불가 — 시드/생성 시 정해짐)
  const meta = isEdit
    ? {
        kind: material.kind,
        spaceGroup: material.spaceGroup,
        subgroup: material.subgroup,
        itemName: material.itemName,
        formKey: material.formKey,
        siteNotes: material.siteNotes,
      }
    : {
        kind: defaults?.kind || 'FINISH',
        spaceGroup: defaults?.spaceGroup || '',
        subgroup: defaults?.subgroup || '',
        itemName: defaults?.itemName || '',
        formKey: defaults?.formKey || null,
        siteNotes: defaults?.siteNotes || '',
      };

  const schema = getFormSchema(meta.formKey);

  // 폼 값 — customSpec + 컬럼(brand/productName/spec) 합쳐서 단일 객체
  const [values, setValues] = useState(() => initValues(material, schema));
  const [status, setStatus] = useState(material?.status || 'UNDECIDED');
  const [checked, setChecked] = useState(material?.checked || false);
  const [purchaseSource, setPurchaseSource] = useState(material?.purchaseSource || '');
  const [memo, setMemo] = useState(material?.memo || '');
  const [inheritFromId, setInheritFromId] = useState(material?.inheritFromMaterialId || null);
  const [adhoc, setAdhoc] = useState({
    spaceGroup: meta.spaceGroup,
    itemName: meta.itemName,
  });

  // 공용부 동일 가능 여부: floor_material / wallpaper + 거실이 아닌 다른 공간
  const canInherit = INHERITABLE_FORM_KEYS.has(meta.formKey) && meta.spaceGroup !== INHERIT_SOURCE_SPACE;

  // 같은 프로젝트의 거실 항목들에서 동일 itemName 찾기
  const { data: allMaterialsData } = useQuery({
    queryKey: ['materials', projectId],
    enabled: canInherit,
  });
  const allMaterials = allMaterialsData?.materials || [];
  const inheritSource = useMemo(() => {
    if (!canInherit) return null;
    return allMaterials.find(
      (m) => m.spaceGroup === INHERIT_SOURCE_SPACE && m.formKey === meta.formKey,
    ) || null;
  }, [canInherit, allMaterials, meta.formKey]);

  const isCreating = !isEdit;
  const isAdHoc = isCreating && !meta.formKey; // 시드 외 직접 추가 (자유 폼)
  const isNotApplicable = status === 'NOT_APPLICABLE';
  const isReused = status === 'REUSED';
  const isInheriting = !!inheritFromId;
  const showFields = !isNotApplicable && !isReused && !isInheriting;

  useEffect(() => {
    if (isEdit && tab === 'history' && !history) {
      materialsApi.history(projectId, material.id)
        .then((r) => setHistory(r.history))
        .catch(() => setHistory([]));
    }
  }, [tab, isEdit, projectId, material?.id, history]);

  function setVal(key, v) {
    setValues((x) => ({ ...x, [key]: v }));
  }

  async function submit() {
    setErr('');
    const sg = (isAdHoc ? adhoc.spaceGroup : meta.spaceGroup).trim();
    const it = (isAdHoc ? adhoc.itemName : meta.itemName).trim();
    if (!sg || !it) {
      setErr('공간/공정 · 항목명은 필수입니다');
      return;
    }
    setBusy(true);
    try {
      // values를 컬럼 / customSpec 으로 분리
      const { brand, productName, spec, customSpec } = splitValues(values, schema);
      const payload = {
        kind: meta.kind,
        spaceGroup: sg,
        subgroup: meta.subgroup || null,
        itemName: it,
        formKey: meta.formKey,
        brand,
        productName,
        spec,
        customSpec,
        siteNotes: meta.siteNotes || null,
        purchaseSource: purchaseSource.trim() || null,
        checked: !!checked,
        status,
        memo: memo.trim() || null,
        inheritFromMaterialId: inheritFromId || null,
      };
      const { material: saved } = isEdit
        ? await materialsApi.update(projectId, material.id, payload)
        : await materialsApi.create(projectId, payload);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || '저장 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm('이 마감재 항목을 삭제할까요?')) return;
    setBusy(true);
    try {
      await materialsApi.remove(projectId, material.id);
      onDeleted?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || '삭제 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-2xl my-8"
      >
        {/* 헤더 */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                <span className={`px-1.5 py-px rounded ${KIND_META[meta.kind]?.color}`}>
                  {KIND_META[meta.kind]?.label}
                </span>
                {meta.spaceGroup && <span>{meta.spaceGroup}</span>}
                {meta.subgroup && <span className="text-gray-400">· {meta.subgroup}</span>}
              </div>
              <h2 className="text-lg font-semibold text-navy-800 mt-1 truncate">
                {meta.itemName || (isCreating ? '새 항목 추가' : '항목 편집')}
              </h2>
              {meta.siteNotes && (
                <div className="text-xs text-gray-500 mt-1.5 italic">
                  💡 {meta.siteNotes}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
        </div>

        {isEdit && (
          <div className="flex border-b px-2">
            {[{ k: 'info', l: '정보' }, { k: 'history', l: '변경 이력' }].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  tab === t.k ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-navy-700'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
        )}

        {tab === 'info' ? (
          <div className="px-5 py-4 space-y-4">
            {/* AdHoc — 시드 밖 직접 추가일 때 공간/항목명 입력 */}
            {isAdHoc && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="공간/공정" required>
                  <input
                    value={adhoc.spaceGroup}
                    onChange={(e) => setAdhoc({ ...adhoc, spaceGroup: e.target.value })}
                    placeholder="예: 거실"
                    className="input"
                  />
                </Field>
                <Field label="항목명" required>
                  <input
                    value={adhoc.itemName}
                    onChange={(e) => setAdhoc({ ...adhoc, itemName: e.target.value })}
                    placeholder="예: 바닥재"
                    className="input"
                  />
                </Field>
              </div>
            )}

            {/* 공용부와 동일 토글 */}
            {canInherit && (
              <div className={`border rounded-md p-3 ${isInheriting ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInheriting}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (!inheritSource) {
                          alert('거실에 같은 항목이 없습니다. 먼저 거실 항목을 입력해주세요.');
                          return;
                        }
                        setInheritFromId(inheritSource.id);
                      } else {
                        setInheritFromId(null);
                      }
                    }}
                    className="w-4 h-4 accent-sky-600"
                  />
                  <span className="text-sm font-medium text-sky-800">🔗 거실(공용부)와 동일</span>
                  {!inheritSource && (
                    <span className="text-xs text-gray-400">— 거실 항목이 아직 없음</span>
                  )}
                </label>
                {isInheriting && inheritSource && (
                  <div className="mt-2 ml-6 text-xs text-gray-600">
                    {inheritSource.brand && <span className="font-bold">{inheritSource.brand} </span>}
                    {inheritSource.productName || '(거실 항목에 자재 미입력)'}
                  </div>
                )}
              </div>
            )}

            {/* 진행 상태 */}
            <Field label="진행 상태">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setStatus(o.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      status === o.key
                        ? 'bg-navy-700 text-white border-navy-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* 본문 필드 — REUSED/NOT_APPLICABLE이면 회색/숨김 */}
            {showFields ? (
              <div className="space-y-3">
                {schema.fields.length === 0 && (
                  <div className="text-sm text-gray-400 italic">입력할 필드가 없습니다</div>
                )}
                {schema.fields.map((f) => (
                  <DynamicField
                    key={f.key}
                    field={f}
                    value={values[f.key] ?? ''}
                    onChange={(v) => setVal(f.key, v)}
                  />
                ))}
              </div>
            ) : isInheriting ? (
              <div className="text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-md p-4 text-center">
                🔗 거실 값을 그대로 사용합니다. 거실 항목이 변경되면 자동 반영됩니다.
              </div>
            ) : (
              <div className="text-sm text-gray-400 bg-gray-50 border rounded-md p-4 text-center">
                {isReused ? '♻️ 재사용 항목 — 모델/스펙 입력 불필요' : '⊘ 해당 없음 — 이 프로젝트엔 적용되지 않음'}
              </div>
            )}

            {/* 매입처 + 메모 + 체크 */}
            {showFields && (
              <>
                <Field label="매입처">
                  <input
                    value={purchaseSource}
                    onChange={(e) => setPurchaseSource(e.target.value)}
                    placeholder="삼성홈센터 / 백스키친 등"
                    className="input"
                  />
                </Field>
                <Field label="비고 / 메모">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={2}
                    className="input resize-y"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>체크(V) — 현장 실물 최종 확인 완료</span>
                </label>
              </>
            )}

            {err && <div className="text-sm text-rose-600">{err}</div>}
          </div>
        ) : (
          <HistoryPanel history={history} />
        )}

        {tab === 'info' && (
          <div className="px-5 py-3 border-t flex items-center justify-between">
            <div>
              {isEdit && (
                <button
                  onClick={remove}
                  disabled={busy}
                  className="text-sm text-rose-600 hover:underline disabled:opacity-50"
                >
                  🗑 삭제
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">취소</button>
              <button
                onClick={submit}
                disabled={busy}
                className="px-5 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
              >
                {busy ? '저장 중...' : isEdit ? '저장' : '추가'}
              </button>
            </div>
          </div>
        )}

        <style>{`
          .input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 7px 10px;
            font-size: 14px;
            outline: none;
            background: white;
          }
          .input:focus {
            border-color: #1e3a66;
            box-shadow: 0 0 0 2px rgba(30, 58, 102, 0.15);
          }
        `}</style>
      </div>
    </div>
  );
}

// 폼 schema에 따라 적절한 input 렌더
function DynamicField({ field, value, onChange }) {
  const { type, label, placeholder, options, unit } = field;
  if (type === 'select') {
    return (
      <Field label={label}>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
          <option value="">선택...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>
    );
  }
  if (type === 'radio') {
    return (
      <Field label={label}>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(value === o ? '' : o)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                value === o
                  ? 'bg-navy-700 text-white border-navy-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >{o}</button>
          ))}
        </div>
      </Field>
    );
  }
  if (type === 'number') {
    return (
      <Field label={`${label}${unit ? ` (${unit})` : ''}`}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input"
        />
      </Field>
    );
  }
  if (type === 'multiline') {
    return (
      <Field label={label}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="input resize-y"
        />
      </Field>
    );
  }
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </Field>
  );
}

// material과 schema에서 폼 초기값 추출 (legacy brand/productName/spec → schema target 필드로 매핑)
function initValues(material, schema) {
  const out = {};
  if (!material) return out;
  const cs = material.customSpec || {};
  for (const f of schema.fields) {
    if (f.target === 'brand') out[f.key] = material.brand ?? '';
    else if (f.target === 'productName') out[f.key] = material.productName ?? '';
    else if (f.target === 'spec') out[f.key] = material.spec ?? '';
    else out[f.key] = cs[f.key] ?? '';
  }
  return out;
}

// 폼 values를 컬럼/customSpec 으로 분리
function splitValues(values, schema) {
  let brand = null, productName = null, spec = null;
  const customSpec = {};
  for (const f of schema.fields) {
    const v = values[f.key];
    const trimmed = typeof v === 'string' ? v.trim() : v;
    const isEmpty = trimmed === '' || trimmed === null || trimmed === undefined;
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
  };
}

function Field({ label, required, full, children }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function HistoryPanel({ history }) {
  if (history === null) return <div className="px-6 py-8 text-sm text-gray-400 text-center">불러오는 중...</div>;
  if (history.length === 0) return <div className="px-6 py-8 text-sm text-gray-400 text-center">변경 이력이 없습니다</div>;
  return (
    <div className="px-6 py-4 max-h-96 overflow-y-auto">
      <div className="divide-y">
        {history.map((h) => {
          const isCreated = h.field === '__created__';
          const label = FIELD_LABEL[h.field] || h.field;
          return (
            <div key={h.id} className="py-3">
              <div className="text-xs text-gray-500 mb-1">
                {h.changedBy?.name} · {relativeTime(h.createdAt)}
              </div>
              {isCreated ? (
                <div className="text-sm">
                  <span className="text-emerald-600 font-medium">생성</span>{' '}
                  <span className="text-navy-800">{h.newValue}</span>
                </div>
              ) : (
                <div className="text-sm">
                  <span className="font-medium text-navy-800">{label}</span>{' '}
                  <span className="text-gray-400 line-through">{renderValue(h.field, h.oldValue)}</span>{' '}
                  →{' '}
                  <span className="text-navy-800">{renderValue(h.field, h.newValue)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderValue(field, v) {
  if (v == null || v === '') return <span className="italic text-gray-300">(없음)</span>;
  if (field === 'status') return STATUS_META[v]?.label || v;
  if (field === 'kind') return KIND_META[v]?.label || v;
  if (field === 'checked' || field === 'installed') return v === 'true' ? 'O' : 'X';
  return String(v);
}
