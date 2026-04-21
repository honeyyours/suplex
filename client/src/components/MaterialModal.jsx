import { useEffect, useState } from 'react';
import {
  materialsApi, STATUS_META, STATUS_KEYS, KIND_META,
  FIELD_LABEL, formatCurrency,
} from '../api/materials';
import { relativeTime } from '../utils/date';

const BLANK = {
  kind: 'FINISH',
  spaceGroup: '',
  itemName: '',
  brand: '',
  productName: '',
  spec: '',
  siteNotes: '',
  purchaseSource: '',
  checked: false,
  installed: null,   // null = 미설정, true = O, false = X
  size: '',
  remarks: '',
  status: 'UNDECIDED',
  quantity: '',
  unit: '',
  unitPrice: '',
  totalPrice: '',
  memo: '',
};

export default function MaterialModal({
  projectId,
  material,
  defaults,      // { kind, spaceGroup, itemName, siteNotes } for create
  onClose,
  onSaved,
  onDeleted,
}) {
  const isEdit = Boolean(material?.id);
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState(() => buildInitialForm(material, defaults));
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const kind = form.kind;
  const isAppliance = kind === 'APPLIANCE';

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isEdit && tab === 'history' && !history) {
      materialsApi.history(projectId, material.id)
        .then((r) => setHistory(r.history))
        .catch(() => setHistory([]));
    }
  }, [tab, isEdit, projectId, material?.id, history]);

  async function submit() {
    setErr('');
    if (!form.spaceGroup.trim() || !form.itemName.trim()) {
      setErr('공간/공정 · 세부 공정은 필수입니다');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        kind: form.kind,
        spaceGroup: form.spaceGroup.trim(),
        itemName: form.itemName.trim(),
        brand: form.brand.trim() || null,
        productName: form.productName.trim() || null,
        spec: form.spec.trim() || null,
        siteNotes: form.siteNotes.trim() || null,
        purchaseSource: form.purchaseSource.trim() || null,
        checked: !!form.checked,
        installed: form.installed,
        size: form.size.trim() || null,
        remarks: form.remarks.trim() || null,
        status: form.status,
        quantity: form.quantity === '' ? null : Number(form.quantity),
        unit: form.unit.trim() || null,
        unitPrice: form.unitPrice === '' ? null : Number(form.unitPrice),
        totalPrice: form.totalPrice === '' ? null : Number(form.totalPrice),
        memo: form.memo.trim() || null,
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
        className="bg-white rounded-xl w-full max-w-3xl my-8"
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${KIND_META[kind].color}`}>
              {KIND_META[kind].label}
            </span>
            <h2 className="text-lg font-bold text-navy-800">
              {isEdit ? '항목 편집' : '항목 추가'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
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
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="구분">
                <select
                  value={form.kind}
                  onChange={(e) => setField('kind', e.target.value)}
                  className="input"
                >
                  <option value="FINISH">마감재</option>
                  <option value="APPLIANCE">가전·가구</option>
                </select>
              </Field>
              <Field label="상태">
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className="input"
                >
                  {STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>{STATUS_META[k].label}</option>
                  ))}
                </select>
              </Field>
              <Field label="공간/공정" required>
                <input
                  value={form.spaceGroup}
                  onChange={(e) => setField('spaceGroup', e.target.value)}
                  placeholder="예: 거실 / 조명 / 필름 / 욕실(공용)"
                  className="input"
                />
              </Field>
              <Field label="세부 공정 및 항목" required>
                <input
                  value={form.itemName}
                  onChange={(e) => setField('itemName', e.target.value)}
                  placeholder="예: 바닥재, 방문, 싱크대 도어"
                  className="input"
                />
              </Field>

              {!isAppliance ? (
                <>
                  <Field label="브랜드 / 유무">
                    <input
                      value={form.brand}
                      onChange={(e) => setField('brand', e.target.value)}
                      placeholder="영림 / O / 고객구매"
                      className="input"
                    />
                  </Field>
                  <Field label="매입처 (발주)">
                    <input
                      value={form.purchaseSource}
                      onChange={(e) => setField('purchaseSource', e.target.value)}
                      placeholder="삼성홈센터 / 백스키친"
                      className="input"
                    />
                  </Field>
                  <Field label="자재명 및 품번 (색상)" full>
                    <input
                      value={form.productName}
                      onChange={(e) => setField('productName', e.target.value)}
                      placeholder="예: 구정마루 마뷸러스 젠 모로칸 크림"
                      className="input"
                    />
                  </Field>
                  <Field label="규격 / 마감" full>
                    <input
                      value={form.spec}
                      onChange={(e) => setField('spec', e.target.value)}
                      placeholder="예: 600각 포세린 / T5 주백색 / 85인치 기준 타공"
                      className="input"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="설치 유무">
                    <select
                      value={form.installed === null ? '' : form.installed ? 'O' : 'X'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setField('installed', v === '' ? null : v === 'O');
                      }}
                      className="input"
                    >
                      <option value="">미정</option>
                      <option value="O">O (설치)</option>
                      <option value="X">X (미설치)</option>
                    </select>
                  </Field>
                  <Field label="사이즈 (W x D x H)">
                    <input
                      value={form.size}
                      onChange={(e) => setField('size', e.target.value)}
                      placeholder="예: 908 x 930 x 1853"
                      className="input"
                    />
                  </Field>
                  <Field label="제품명 / 모델명" full>
                    <input
                      value={form.productName}
                      onChange={(e) => setField('productName', e.target.value)}
                      placeholder="예: BESPOKE 냉장고 4도어 871L / RF85R9013S8"
                      className="input"
                    />
                  </Field>
                  <Field label="브랜드">
                    <input
                      value={form.brand}
                      onChange={(e) => setField('brand', e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="매입처 (발주)">
                    <input
                      value={form.purchaseSource}
                      onChange={(e) => setField('purchaseSource', e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="비고 (특이사항 / 빌트인 여부)" full>
                    <input
                      value={form.remarks}
                      onChange={(e) => setField('remarks', e.target.value)}
                      placeholder="예: 키친핏, 도어 개폐 방향, 빌트인 여부"
                      className="input"
                    />
                  </Field>
                </>
              )}
            </div>

            <Field label="현장 시공 및 목공/전기 특이사항">
              <textarea
                value={form.siteNotes}
                onChange={(e) => setField('siteNotes', e.target.value)}
                rows={3}
                className="input resize-y"
                placeholder="예: 무몰딩/히든도어 적용 시 올퍼티 작업 필수"
              />
            </Field>

            <div className="grid grid-cols-4 gap-3">
              <Field label="수량">
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  className="input"
                  step="0.01"
                />
              </Field>
              <Field label="단위">
                <input
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                  placeholder="m² / 개 / 롤"
                  className="input"
                />
              </Field>
              <Field label="단가 (원)">
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setField('unitPrice', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="합계 (원)">
                <input
                  type="number"
                  value={form.totalPrice}
                  onChange={(e) => setField('totalPrice', e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="메모">
              <textarea
                value={form.memo}
                onChange={(e) => setField('memo', e.target.value)}
                rows={2}
                className="input resize-y"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.checked}
                onChange={(e) => setField('checked', e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>체크(V) 완료 표시</span>
              <span className="text-xs text-gray-400">— 현장 최종 확인 완료 여부</span>
            </label>

            {err && <div className="text-sm text-red-600">{err}</div>}
          </div>
        ) : (
          <HistoryPanel history={history} />
        )}

        {tab === 'info' && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <div>
              {isEdit && (
                <button
                  onClick={remove}
                  disabled={busy}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
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

function buildInitialForm(material, defaults) {
  if (material) {
    return {
      ...BLANK,
      ...Object.fromEntries(
        Object.keys(BLANK).map((k) => {
          const v = material[k];
          if (k === 'checked') return [k, !!v];
          if (k === 'installed') return [k, v === null || v === undefined ? null : !!v];
          if (v === null || v === undefined) return [k, BLANK[k]];
          return [k, typeof BLANK[k] === 'string' ? String(v) : v];
        })
      ),
    };
  }
  return { ...BLANK, ...(defaults || {}) };
}

function Field({ label, required, full, children }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
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
  if (['quantity', 'unitPrice', 'totalPrice'].includes(field)) return formatCurrency(v);
  return v;
}
