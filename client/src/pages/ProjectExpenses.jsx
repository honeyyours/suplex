import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { purchaseOrdersApi, PO_STATUS_META } from '../api/purchaseOrders';
import { expensesApi, EXPENSE_TYPE_META, EXPENSE_TYPE_KEYS, PAYMENT_METHOD_META, PAYMENT_METHOD_KEYS } from '../api/expenses';
import { accountCodesApi, accountColor } from '../api/accountCodes';
import { formatWon } from '../api/quotes';
import VendorAutocomplete from '../components/VendorAutocomplete';

const STATUS_KEYS = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];
const ALL_TAB = 'ALL';

export default function ProjectExpenses() {
  const { id: projectId } = useParams();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [accountCodes, setAccountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(ALL_TAB);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [{ orders }, { expenses }] = await Promise.all([
        purchaseOrdersApi.list(projectId),
        expensesApi.list({ projectId }),
      ]);
      setOrders(orders);
      setExpenses(expenses);
    } finally { setLoading(false); }
  }
  useEffect(() => {
    reload();
    accountCodesApi.list().then((r) => setAccountCodes(r.codes || []));
    /* eslint-disable-next-line */
  }, [projectId]);

  const totals = useMemo(() => {
    let exp = 0, inc = 0;
    for (const e of expenses) {
      if (e.type === 'INCOME') inc += Number(e.amount || 0);
      else if (e.type === 'EXPENSE') exp += Number(e.amount || 0);
    }
    return { expense: exp, income: inc };
  }, [expenses]);

  const counts = useMemo(() => {
    const c = { ALL: orders.length };
    for (const k of STATUS_KEYS) c[k] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = tab === ALL_TAB ? orders : orders.filter((o) => o.status === tab);
  const changedCount = orders.filter((o) => o.materialChangedAt).length;

  async function changeStatus(id, status) {
    try { await purchaseOrdersApi.update(projectId, id, { status }); reload(); }
    catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function acknowledge(id) {
    try { await purchaseOrdersApi.acknowledge(projectId, id); reload(); }
    catch (e) { alert('확인 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function removeOrder(id) {
    if (!confirm('이 발주를 삭제할까요?')) return;
    try { await purchaseOrdersApi.remove(projectId, id); reload(); }
    catch (e) { alert('삭제 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function removeExpense(id) {
    if (!confirm('이 거래를 삭제할까요?')) return;
    try { await expensesApi.remove(id); reload(); }
    catch (e) { alert('삭제 실패: ' + (e.response?.data?.error || e.message)); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-600">현장 거래 합계</div>
            <div className="flex items-baseline gap-4 mt-1">
              <span>
                <span className="text-xs text-gray-500">지출</span>
                <span className="text-xl font-bold text-emerald-800 tabular-nums ml-1">{formatWon(totals.expense)}</span>
              </span>
              {totals.income > 0 && (
                <span>
                  <span className="text-xs text-gray-500">매출</span>
                  <span className="text-xl font-bold text-navy-800 tabular-nums ml-1">+{formatWon(totals.income)}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">총 {expenses.length}건</div>
          </div>
          <div className="flex gap-2">
            <Link to={`/expenses?projectId=${projectId}`} className="text-sm px-3 py-1.5 border rounded hover:bg-white">전체 지출 보기 →</Link>
            <button onClick={() => setQuickAdd(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm px-4 py-1.5 rounded">+ 거래 빠른 입력</button>
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="mt-3 border-t border-emerald-200 pt-3">
            <table className="w-full text-xs">
              <tbody>
                {expenses.slice(0, 5).map((e) => {
                  const t = EXPENSE_TYPE_META[e.type] || EXPENSE_TYPE_META.EXPENSE;
                  return (
                    <tr key={e.id} className="border-b border-emerald-100/60 last:border-b-0">
                      <td className="py-1.5 w-20 text-gray-600 tabular-nums">{String(e.date).slice(0, 10)}</td>
                      <td className="py-1.5 w-12"><span className={`px-1.5 py-0.5 rounded border text-[10px] ${t.color}`}>{t.label}</span></td>
                      <td className="py-1.5 w-32"><span className={`px-1.5 py-0.5 rounded ${accountColor(e.accountCode?.groupName)}`}>{e.accountCode?.code || '미분류'}</span></td>
                      <td className="py-1.5 text-gray-700 truncate max-w-xs">{e.description || e.vendor || ''}</td>
                      <td className={`py-1.5 text-right tabular-nums font-medium ${e.type === 'INCOME' ? 'text-emerald-700' : ''}`}>
                        {e.type === 'INCOME' ? '+' : ''}{formatWon(e.amount)}
                      </td>
                      <td className="py-1.5 text-right w-8">
                        <button onClick={() => removeExpense(e.id)} className="text-gray-300 hover:text-red-500" title="삭제">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expenses.length > 5 && (
              <div className="text-xs text-gray-500 mt-2 text-right">최근 5건만. 전체 {expenses.length}건은 "전체 지출 보기 →"</div>
            )}
          </div>
        )}
      </div>

      {/* === 발주 예정 === */}
      <div className="bg-navy-50/60 border rounded-lg p-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-500 mb-1">발주 예정 (마감재 확정 시 자동 생성)</div>
            <div className="text-base font-medium text-navy-800">
              총 {orders.length}건 · 대기 {counts.PENDING || 0} · 발주완료 {counts.ORDERED || 0} · 수령 {counts.RECEIVED || 0}
            </div>
            {changedCount > 0 && (
              <div className="text-xs text-orange-700 mt-0.5 font-medium">⚠️ 마감재 변경 {changedCount}건 (확인 필요)</div>
            )}
          </div>
          <button onClick={() => setAdding(true)} className="text-sm px-4 py-1.5 border rounded hover:bg-white">+ 즉흥 발주 추가</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex border-b text-sm">
          <TabBtn active={tab === ALL_TAB} onClick={() => setTab(ALL_TAB)} label={`전체 (${counts.ALL || 0})`} />
          {STATUS_KEYS.map((k) => {
            const meta = PO_STATUS_META[k];
            return <TabBtn key={k} active={tab === k} onClick={() => setTab(k)} label={`${meta.icon} ${meta.label} (${counts[k] || 0})`} />;
          })}
        </div>

        {loading && <div className="p-6 text-sm text-gray-400">불러오는 중...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-400">
            {tab === ALL_TAB ? '아직 발주가 없습니다.' : `${PO_STATUS_META[tab]?.label} 상태 없음.`}
            <br /><span className="text-xs">마감재 탭에서 항목을 "확정"으로 바꾸면 자동 생성됩니다.</span>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">항목</th>
                  <th className="text-left px-3 py-2 w-44">규격/제품</th>
                  <th className="text-left px-3 py-2 w-28">거래처</th>
                  <th className="text-right px-3 py-2 w-20">수량</th>
                  <th className="text-right px-3 py-2 w-28">단가</th>
                  <th className="text-right px-3 py-2 w-32">합계</th>
                  <th className="px-3 py-2 w-32">상태</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((o) => (
                  <OrderRow key={o.id} order={o}
                    onEdit={() => setEditing(o)}
                    onChangeStatus={(s) => changeStatus(o.id, s)}
                    onAcknowledge={() => acknowledge(o.id)}
                    onRemove={() => removeOrder(o.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <OrderModal projectId={projectId} order={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {adding && <OrderModal projectId={projectId} order={null} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      {quickAdd && <QuickExpenseModal projectId={projectId} accountCodes={accountCodes} onClose={() => setQuickAdd(false)} onSaved={() => { setQuickAdd(false); reload(); }} />}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 font-medium border-b-2 ${active ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-navy-700'}`}>
      {label}
    </button>
  );
}

function OrderRow({ order, onEdit, onChangeStatus, onAcknowledge, onRemove }) {
  const meta = PO_STATUS_META[order.status] || PO_STATUS_META.PENDING;
  const linked = !!order.materialId;
  const changed = !!order.materialChangedAt;
  return (
    <tr className={`hover:bg-gray-50 ${changed ? 'bg-orange-50/60' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {changed && <span title="마감재 변경됨" className="text-orange-600 text-xs">⚠️</span>}
          <button onClick={onEdit} className="text-navy-800 font-medium hover:underline text-left">{order.itemName}</button>
          {linked ? <span className="text-xs text-gray-400">🔗</span> : <span className="text-xs text-gray-300" title="즉흥">📝</span>}
        </div>
        {order.notes && <div className="text-xs text-gray-500 mt-0.5">{order.notes}</div>}
      </td>
      <td className="px-3 py-2 text-xs text-gray-600 truncate">{order.spec}</td>
      <td className="px-3 py-2 text-xs text-gray-600">{order.vendor}</td>
      <td className="px-3 py-2 text-right tabular-nums text-xs">{order.quantity != null ? `${Number(order.quantity)} ${order.unit || ''}` : <span className="text-gray-300">—</span>}</td>
      <td className="px-3 py-2 text-right tabular-nums text-xs">{order.unitPrice != null ? formatWon(order.unitPrice) : <span className="text-gray-300">—</span>}</td>
      <td className="px-3 py-2 text-right tabular-nums font-medium text-navy-800">{order.totalPrice != null ? formatWon(order.totalPrice) : <span className="text-gray-300">—</span>}</td>
      <td className="px-3 py-2">
        <select value={order.status} onChange={(e) => onChangeStatus(e.target.value)} className={`text-xs px-2 py-1 rounded border-0 ${meta.color}`}>
          {Object.entries(PO_STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 text-right text-xs whitespace-nowrap">
        {changed && <button onClick={onAcknowledge} className="text-orange-700 hover:underline mr-2">확인</button>}
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500" title="삭제">×</button>
      </td>
    </tr>
  );
}

function QuickExpenseModal({ projectId, accountCodes, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'EXPENSE',
    date: new Date().toISOString().slice(0, 10),
    amount: '', vendor: '', vendorId: null, accountCodeId: '', workCategory: '', description: '', paymentMethod: '',
  });
  const [busy, setBusy] = useState(false);
  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.amount || isNaN(Number(form.amount))) { alert('금액'); return; }
    setBusy(true);
    try {
      await expensesApi.create({
        projectId, type: form.type, date: form.date,
        amount: Number(form.amount),
        accountCodeId: form.accountCodeId || null,
        workCategory: form.workCategory.trim() || null,
        vendor: form.vendor.trim() || null,
        vendorId: form.vendorId || null,
        description: form.description.trim() || null,
        paymentMethod: form.paymentMethod || null,
      });
      onSaved();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
    finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">현장 거래 빠른 입력</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="종류">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
                {EXPENSE_TYPE_KEYS.map((k) => <option key={k} value={k}>{EXPENSE_TYPE_META[k].label}</option>)}
              </select>
            </Field>
            <Field label="날짜" required>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input" />
            </Field>
            <Field label="금액 (원)" required>
              <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="계정과목">
            <select value={form.accountCodeId} onChange={(e) => set('accountCodeId', e.target.value)} className="input">
              <option value="">(미분류)</option>
              {accountCodes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="공종">
              <input value={form.workCategory} onChange={(e) => set('workCategory', e.target.value)} placeholder="전기/조명공사" className="input" />
            </Field>
            <Field label="결제수단">
              <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className="input">
                <option value="">선택</option>
                {PAYMENT_METHOD_KEYS.map((k) => <option key={k} value={k}>{PAYMENT_METHOD_META[k].label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="거래처">
            <VendorAutocomplete
              value={{ id: form.vendorId, name: form.vendor }}
              onChange={({ vendorId, vendorName }) => {
                setForm((p) => ({ ...p, vendorId: vendorId || null, vendor: vendorName || '' }));
              }}
              category={form.workCategory || undefined}
              placeholder="협력업체 선택 또는 직접 입력"
            />
          </Field>
          <Field label="내역(적요)"><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="input resize-y" /></Field>
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">취소</button>
          <button onClick={save} disabled={busy} className="text-sm px-5 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800 disabled:opacity-50">{busy ? '저장 중...' : '저장'}</button>
        </div>
        <ModalStyles />
      </div>
    </div>
  );
}

function OrderModal({ projectId, order, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    itemName: order?.itemName || '', spec: order?.spec || '',
    vendor: order?.vendor || '',
    vendorId: order?.vendorEntity?.id || order?.vendorId || null,
    quantity: order?.quantity != null ? String(order.quantity) : '',
    unit: order?.unit || '',
    unitPrice: order?.unitPrice != null ? String(order.unitPrice) : '',
    totalPrice: order?.totalPrice != null ? String(order.totalPrice) : '',
    expectedDate: order?.expectedDate ? String(order.expectedDate).slice(0, 10) : '',
    notes: order?.notes || '', status: order?.status || 'PENDING',
  }));
  const [busy, setBusy] = useState(false);
  const linked = !!order?.materialId;
  const isNew = !order;
  function autoCompute(next) {
    const q = Number(next.quantity), u = Number(next.unitPrice);
    if (Number.isFinite(q) && Number.isFinite(u) && q > 0 && u > 0) next.totalPrice = String(Math.round(q * u));
    return next;
  }
  function setField(k, v) { setForm((p) => { const n = { ...p, [k]: v }; if (k === 'quantity' || k === 'unitPrice') return autoCompute(n); return n; }); }
  async function save() {
    if (!form.itemName.trim()) { alert('항목명'); return; }
    setBusy(true);
    try {
      const payload = {
        itemName: form.itemName.trim(), spec: form.spec.trim() || null,
        vendor: form.vendor.trim() || null,
        vendorId: form.vendorId || null,
        quantity: form.quantity ? Number(form.quantity) : null, unit: form.unit.trim() || null,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null, totalPrice: form.totalPrice ? Number(form.totalPrice) : null,
        expectedDate: form.expectedDate || null, notes: form.notes.trim() || null, status: form.status,
      };
      if (isNew) await purchaseOrdersApi.create(projectId, payload);
      else await purchaseOrdersApi.update(projectId, order.id, payload);
      onSaved();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
    finally { setBusy(false); }
  }
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-2xl my-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">{isNew ? '즉흥 발주 추가' : '발주 항목 편집'}{linked && <span className="ml-2 text-xs text-gray-500">🔗 마감재 연동</span>}</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <Field label="항목명" required><input value={form.itemName} onChange={(e) => setField('itemName', e.target.value)} className="input" /></Field>
          <Field label="규격/제품"><input value={form.spec} onChange={(e) => setField('spec', e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="거래처">
              <VendorAutocomplete
                value={{ id: form.vendorId, name: form.vendor }}
                onChange={({ vendorId, vendorName }) => {
                  setForm((p) => ({ ...p, vendorId: vendorId || null, vendor: vendorName || '' }));
                }}
                placeholder="협력업체 선택 또는 직접 입력"
              />
            </Field>
            <Field label="발주 예정일"><input type="date" value={form.expectedDate} onChange={(e) => setField('expectedDate', e.target.value)} className="input" /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Field label="수량"><input type="number" step="0.01" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} className="input" /></Field>
            <Field label="단위"><input value={form.unit} onChange={(e) => setField('unit', e.target.value)} className="input" /></Field>
            <Field label="단가"><input type="number" value={form.unitPrice} onChange={(e) => setField('unitPrice', e.target.value)} className="input" /></Field>
            <Field label="합계"><input type="number" value={form.totalPrice} onChange={(e) => setField('totalPrice', e.target.value)} className="input" /></Field>
          </div>
          <Field label="비고"><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} className="input resize-y" /></Field>
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">취소</button>
          <button onClick={save} disabled={busy} className="text-sm px-5 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50">{busy ? '저장 중...' : '저장'}</button>
        </div>
        <ModalStyles />
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>{children}</label>;
}

function ModalStyles() {
  return <style>{`
    .input { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-size: 14px; outline: none; }
    .input:focus { border-color: #1e3a66; box-shadow: 0 0 0 2px rgba(30, 58, 102, 0.15); }
  `}</style>;
}
