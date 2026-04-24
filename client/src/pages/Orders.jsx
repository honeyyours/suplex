import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersGlobalApi, purchaseOrdersApi, PO_STATUS_META } from '../api/purchaseOrders';
import { projectsApi } from '../api/projects';

const STATUS_KEYS = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];

export default function Orders() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') || '';

  function setProjectFilter(pid) {
    const next = new URLSearchParams(searchParams);
    if (pid) next.set('projectId', pid); else next.delete('projectId');
    setSearchParams(next, { replace: true });
  }

  const { data: ordersData } = useQuery({
    queryKey: ['orders', projectIdFilter],
    queryFn: () => ordersGlobalApi.list(projectIdFilter ? { projectId: projectIdFilter } : {}),
  });
  const { data: pendingModelsData } = useQuery({
    queryKey: ['orders', 'pending-models', projectIdFilter],
    queryFn: () => ordersGlobalApi.pendingModels(projectIdFilter ? { projectId: projectIdFilter } : {}),
  });
  const { data: summaryData } = useQuery({
    queryKey: ['orders', 'summary', projectIdFilter],
    queryFn: () => ordersGlobalApi.summary(projectIdFilter ? { projectId: projectIdFilter } : {}),
  });
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const orders = ordersData?.orders || [];
  const pendingModels = pendingModelsData?.materials || [];
  const summary = summaryData || { pending: 0, ordered: 0, received: 0, cancelled: 0, pendingModels: 0 };
  const projects = projectsData?.projects || [];

  function reload() {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }

  // status 별 그룹핑
  const groups = useMemo(() => {
    const m = { PENDING: [], ORDERED: [], RECEIVED: [], CANCELLED: [] };
    for (const o of orders) (m[o.status] || (m[o.status] = [])).push(o);
    return m;
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-800">발주</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            마감재 확정 시 자동 등록 · 수량/단가 입력 → 발주 처리 → 수령
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projectIdFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1.5 bg-white"
          >
            <option value="">모든 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SummaryCard label="⚠️ 모델 확인 필요" count={summary.pendingModels} tone="amber" highlight />
        <SummaryCard label="⏳ 발주 대기" count={summary.pending} tone="amber" />
        <SummaryCard label="📦 발주됨" count={summary.ordered} tone="sky" />
        <SummaryCard label="✅ 수령" count={summary.received} tone="emerald" />
        <SummaryCard label="⊘ 취소" count={summary.cancelled} tone="gray" />
      </div>

      {/* 모델 확인 필요 섹션 */}
      {pendingModels.length > 0 && (
        <Section title="⚠️ 모델 확인 필요" defaultOpen={false} count={pendingModels.length}>
          <p className="text-xs text-gray-500 mb-2">
            마감재 모델이 미정이라 아직 발주에 들어오지 못한 항목들. 마감재 탭에서 모델을 확정하세요.
          </p>
          <div className="divide-y">
            {pendingModels.map((m) => (
              <Link
                key={m.id}
                to={`/projects/${m.projectId}/materials`}
                className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-gray-50"
              >
                <span className="text-xs text-gray-500 w-32 truncate">{m.project?.name}</span>
                <span className="font-medium text-gray-800 flex-1 truncate">
                  {m.spaceGroup} · {m.itemName}
                </span>
                <span className="text-xs text-amber-700">→ 모델 확정하러 가기</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* 발주 status별 섹션 */}
      {STATUS_KEYS.map((s) => {
        const list = groups[s] || [];
        if (list.length === 0 && s === 'CANCELLED') return null;
        const meta = PO_STATUS_META[s];
        return (
          <Section
            key={s}
            title={`${meta.icon} ${meta.label}`}
            count={list.length}
            defaultOpen={s === 'PENDING'}
          >
            {list.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">{meta.label} 항목이 없습니다</div>
            ) : (
              <div className="divide-y">
                {list.map((o) => (
                  <OrderRow key={o.id} order={o} onChange={reload} />
                ))}
              </div>
            )}
          </Section>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, count, tone, highlight }) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    gray: 'bg-gray-50 text-gray-700',
  }[tone] || 'bg-gray-50 text-gray-700';
  return (
    <div className={`border rounded-md p-3 ${toneClass} ${highlight && count > 0 ? 'ring-2 ring-amber-400' : ''}`}>
      <div className="text-[11px] font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{count}</div>
    </div>
  );
}

function Section({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-gray-50"
      >
        <span>{title} <span className="text-xs font-normal text-gray-400 ml-1">({count})</span></span>
        <span className="text-gray-400 text-xs">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="p-3 border-t">{children}</div>}
    </div>
  );
}

function OrderRow({ order, onChange }) {
  const meta = PO_STATUS_META[order.status];
  const [draft, setDraft] = useState({
    quantity: order.quantity ?? '',
    unit: order.unit ?? '',
    unitPrice: order.unitPrice ?? '',
    vendor: order.vendor ?? '',
  });
  const [busy, setBusy] = useState(false);

  function setField(k, v) { setDraft((d) => ({ ...d, [k]: v })); }

  async function save() {
    setBusy(true);
    try {
      const qty = draft.quantity === '' ? null : Number(draft.quantity);
      const price = draft.unitPrice === '' ? null : Number(draft.unitPrice);
      const total = qty != null && price != null ? qty * price : null;
      await purchaseOrdersApi.update(order.projectId, order.id, {
        quantity: qty,
        unit: draft.unit?.trim() || null,
        unitPrice: price,
        totalPrice: total,
        vendor: draft.vendor?.trim() || null,
      });
      onChange();
    } finally { setBusy(false); }
  }

  async function changeStatus(s) {
    setBusy(true);
    try {
      await purchaseOrdersApi.update(order.projectId, order.id, { status: s });
      onChange();
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm('이 발주 항목을 삭제할까요?')) return;
    setBusy(true);
    try {
      await purchaseOrdersApi.remove(order.projectId, order.id);
      onChange();
    } finally { setBusy(false); }
  }

  const total = (Number(draft.quantity) || 0) * (Number(draft.unitPrice) || 0);
  const hasMaterialChanged = order.materialChangedAt && order.status !== 'PENDING';

  return (
    <div className="py-2 px-2 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 text-sm hover:bg-gray-50 group">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {hasMaterialChanged && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 cursor-pointer"
              title="마감재가 변경됨 — 클릭하여 확인"
              onClick={async () => {
                await purchaseOrdersApi.acknowledge(order.projectId, order.id);
                onChange();
              }}
            >⚠️ 마감재 변경됨</span>
          )}
          <span className="font-semibold text-gray-900 truncate">{order.itemName}</span>
          {order.project && (
            <Link
              to={`/projects/${order.project.id}/materials`}
              className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >{order.project.name}</Link>
          )}
        </div>
        {order.spec && (
          <div className="text-xs text-gray-500 truncate mt-0.5">{order.spec}</div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="number"
          value={draft.quantity}
          onChange={(e) => setField('quantity', e.target.value)}
          onBlur={save}
          placeholder="수량"
          className="w-16 text-sm px-2 py-1 border rounded"
        />
        <input
          value={draft.unit}
          onChange={(e) => setField('unit', e.target.value)}
          onBlur={save}
          placeholder="단위"
          className="w-14 text-sm px-2 py-1 border rounded"
        />
        <span className="text-gray-300">×</span>
        <input
          type="number"
          value={draft.unitPrice}
          onChange={(e) => setField('unitPrice', e.target.value)}
          onBlur={save}
          placeholder="단가"
          className="w-24 text-sm px-2 py-1 border rounded"
        />
        <span className="text-xs text-gray-500 w-24 text-right tabular-nums">
          = {total > 0 ? `${total.toLocaleString()}원` : '—'}
        </span>
        <input
          value={draft.vendor}
          onChange={(e) => setField('vendor', e.target.value)}
          onBlur={save}
          placeholder="매입처"
          className="w-28 text-sm px-2 py-1 border rounded"
        />
        <select
          value={order.status}
          onChange={(e) => changeStatus(e.target.value)}
          disabled={busy}
          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${meta.color}`}
        >
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{PO_STATUS_META[s].icon} {PO_STATUS_META[s].label}</option>
          ))}
        </select>
        <button
          onClick={remove}
          disabled={busy}
          className="text-xs text-gray-400 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100"
        >🗑</button>
      </div>
    </div>
  );
}
