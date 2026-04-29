import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersGlobalApi, purchaseOrdersApi, PO_STATUS_META } from '../api/purchaseOrders';
import { projectsApi } from '../api/projects';
import { companyApi } from '../api/company';
import { useAuth } from '../contexts/AuthContext';

const STATUS_KEYS = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];

export default function Orders({ lockedProjectId = null }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  // 프로젝트 detail 안에서는 lockedProjectId가 강제됨 (셀렉트 숨김)
  const projectIdFilter = lockedProjectId || searchParams.get('projectId') || '';
  // 요약 카드 클릭 시 해당 항목만 보기 (null = 전체)
  // 'pendingModels' | 'urgent' | 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  const [activeFilter, setActiveFilter] = useState(null);
  function toggleFilter(key) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }
  // 선택 복사 — Set으로 ID 관리
  const [selectedIds, setSelectedIds] = useState(new Set());
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAll(orders) {
    setSelectedIds(new Set(orders.map((o) => o.id)));
  }
  function clearSelection() { setSelectedIds(new Set()); }

  function setProjectFilter(pid) {
    const next = new URLSearchParams(searchParams);
    if (pid) next.set('projectId', pid); else next.delete('projectId');
    setSearchParams(next, { replace: true });
  }

  // 선택된 PO들 일괄 상태 변경
  async function bulkChangeStatus(newStatus) {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;
    const meta = PO_STATUS_META[newStatus];
    if (newStatus === 'CANCELLED') {
      if (!confirm(`선택된 ${selected.length}개 항목을 [${meta.label}]로 변경합니다.\n발주 취소 시 연결된 마감재가 다시 미정 상태로 돌아갑니다.\n\n계속할까요?`)) return;
    }
    try {
      await Promise.all(selected.map((o) =>
        purchaseOrdersApi.update(o.projectId, o.id, { status: newStatus })
      ));
      reload();
      clearSelection();
    } catch (e) {
      alert('일괄 변경 실패: ' + (e.response?.data?.error || e.message));
      reload();
    }
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
  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get(),
  });
  const { auth } = useAuth();
  const company = companyData?.company;

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

  // 임박: 데드라인 7일 이내 + 아직 진행중(PENDING/ORDERED)인 항목
  const urgentOrders = useMemo(() =>
    orders.filter((o) =>
      o.daysToDeadline != null && o.daysToDeadline <= 7 && (o.status === 'PENDING' || o.status === 'ORDERED')
    ),
  [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          {!lockedProjectId && <h1 className="text-xl font-bold text-navy-800">발주</h1>}
          <p className="text-xs text-gray-500 mt-0.5">
            마감재 확정 시 자동 등록 · 수량/단가 입력 → 발주 처리 → 수령
          </p>
        </div>
        {!lockedProjectId && (
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
        )}
      </div>

      {/* 통계 카드 자리 — 선택 시 액션바로 토글 (밀림 0, 한눈에 작업) */}
      {selectedIds.size > 0 ? (
        <div className="bg-white border rounded-md px-3 py-2 flex items-center gap-2 flex-wrap text-sm shadow-sm">
          <span className="text-navy-800 font-medium">
            ✓ {selectedIds.size}개
          </span>
          <button
            onClick={async () => {
              const selected = orders.filter((o) => selectedIds.has(o.id));
              const text = formatOrdersForCopy(selected, { company, user: auth?.user });
              try {
                await navigator.clipboard.writeText(text);
              } catch (e) {
                alert('클립보드 복사 실패: ' + e.message);
                return;
              }
              const goOrdered = confirm(
                `${selected.length}개 항목이 클립보드에 복사되었습니다.\n발주처에 카톡으로 붙여넣으세요.\n\n바로 [발주됨]으로 처리하시겠습니까?`,
              );
              if (goOrdered) await bulkChangeStatus('ORDERED');
            }}
            className="text-xs px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            선택 복사
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">변경:</span>
          {STATUS_KEYS.map((s) => {
            const m = PO_STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => bulkChangeStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-full ${m.color} hover:opacity-80`}
                title={`선택된 ${selectedIds.size}개를 ${m.label}로 변경`}
              >
                {m.icon} {m.label}
              </button>
            );
          })}
          <button
            onClick={clearSelection}
            className="ml-auto text-xs px-2 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            ✕ 해제
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            <SummaryCard
              label="모델 확인" icon="⚠️" count={summary.pendingModels} tone="amber" highlight
              active={activeFilter === 'pendingModels'}
              onClick={() => toggleFilter('pendingModels')}
            />
            <SummaryCard
              label="임박" subLabel="D-7 이내" icon="🔥" count={urgentOrders.length} tone="red" highlight
              active={activeFilter === 'urgent'}
              onClick={() => toggleFilter('urgent')}
            />
            <SummaryCard
              label="발주 대기" icon="⏳" count={summary.pending} tone="amber"
              active={activeFilter === 'PENDING'}
              onClick={() => toggleFilter('PENDING')}
            />
            <SummaryCard
              label="발주됨" icon="📦" count={summary.ordered} tone="sky"
              active={activeFilter === 'ORDERED'}
              onClick={() => toggleFilter('ORDERED')}
            />
            <SummaryCard
              label="수령" icon="✅" count={summary.received} tone="emerald"
              active={activeFilter === 'RECEIVED'}
              onClick={() => toggleFilter('RECEIVED')}
            />
            <SummaryCard
              label="취소" icon="⊘" count={summary.cancelled} tone="gray"
              active={activeFilter === 'CANCELLED'}
              onClick={() => toggleFilter('CANCELLED')}
            />
          </div>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="mt-2 text-xs text-navy-700 hover:underline"
            >
              ✕ 전체 보기로 돌아가기
            </button>
          )}
        </div>
      )}

      {/* 모델 확인 필요 섹션 — activeFilter 없거나 'pendingModels'일 때 */}
      {pendingModels.length > 0 && (!activeFilter || activeFilter === 'pendingModels') && (
        <Section title="⚠️ 모델 확인 필요" defaultOpen={activeFilter === 'pendingModels'} count={pendingModels.length}>
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

      {/* 임박 섹션 — activeFilter === 'urgent'일 때만 */}
      {activeFilter === 'urgent' && (
        <Section title="🔥 임박 (D-7 이내)" defaultOpen={true} count={urgentOrders.length}>
          {urgentOrders.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">임박한 발주 항목이 없습니다</div>
          ) : (
            <div className="divide-y">
              {urgentOrders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  onChange={reload}
                  selected={selectedIds.has(o.id)}
                  onToggleSelect={() => toggleSelect(o.id)}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* 발주 status별 섹션 — activeFilter 없거나 해당 status일 때 */}
      {activeFilter !== 'pendingModels' && activeFilter !== 'urgent' && STATUS_KEYS.map((s) => {
        if (activeFilter && activeFilter !== s) return null;
        const list = groups[s] || [];
        if (list.length === 0 && s === 'CANCELLED' && !activeFilter) return null;
        const meta = PO_STATUS_META[s];
        const allSelected = list.length > 0 && list.every((o) => selectedIds.has(o.id));
        return (
          <Section
            key={`${s}-${activeFilter || 'all'}`}
            title={`${meta.icon} ${meta.label}`}
            count={list.length}
            defaultOpen={s === 'PENDING' || activeFilter === s}
            extraAction={list.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (allSelected) {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      list.forEach((o) => next.delete(o.id));
                      return next;
                    });
                  } else {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      list.forEach((o) => next.add(o.id));
                      return next;
                    });
                  }
                }}
                className="text-[11px] text-navy-700 hover:underline ml-2"
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            ) : null}
          >
            {list.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">{meta.label} 항목이 없습니다</div>
            ) : (
              <div className="divide-y">
                {list.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onChange={reload}
                    selected={selectedIds.has(o.id)}
                    onToggleSelect={() => toggleSelect(o.id)}
                  />
                ))}
              </div>
            )}
          </Section>
        );
      })}
    </div>
  );
}

// 선택된 PO들 → 카톡 친화적 텍스트로 정리 (샘플 A 형식)
//
// 안녕하세요, {회사명}입니다.
// 아래 자재 발주 부탁드립니다.
//
// 📍 현장: {프로젝트명}
//    주소: {주소}
// 👤 현장 담당자: {사용자명} {연락처}
// 📅 도착 희망일: ____________
// ⚠️ 현장 특이사항
//    · {줄별 siteNotes}
//
// ────── 발주 항목 ──────
// (한 매입처) 평면 list
// (여러 매입처) ■ 매입처별 묶음
//
// 확인 후 가능 여부 회신 부탁드립니다.
// 감사합니다.
function formatOrdersForCopy(orders, { company, user } = {}) {
  if (orders.length === 0) return '';
  const lines = [];
  const companyName = company?.name || '';
  const userName = user?.name || '';
  const userPhone = user?.phone || company?.phone || '';

  // 인사말
  lines.push(`안녕하세요, ${companyName ? companyName : '저희'}입니다.`);
  lines.push('아래 자재 발주 부탁드립니다.');
  lines.push('');

  // 현장 정보 — 선택된 PO들이 모두 같은 프로젝트일 때만 표시
  const projectIds = new Set(orders.map((o) => o.project?.id).filter(Boolean));
  if (projectIds.size === 1) {
    const p = orders[0].project || {};
    lines.push(`현장: ${p.name || ''}`);
    if (p.siteAddress) lines.push(`주소: ${p.siteAddress}`);
    if (userName || userPhone) {
      lines.push(`현장 담당자: ${[userName, userPhone].filter(Boolean).join(' ')}`);
    }
    lines.push('도착 희망일: ____________');
    if (p.siteNotes && p.siteNotes.trim()) {
      lines.push('현장 특이사항');
      for (const ln of p.siteNotes.split('\n')) {
        const s = ln.trim();
        if (s) lines.push(`  - ${s}`);
      }
    }
    lines.push('');
  }

  // 발주 항목
  lines.push('[발주 항목]');
  const byVendor = new Map();
  for (const o of orders) {
    const v = (o.vendor || '').trim();
    if (!byVendor.has(v)) byVendor.set(v, []);
    byVendor.get(v).push(o);
  }
  const vendors = [...byVendor.keys()];
  // 매입처가 한 종류면 헤더 없이 평면, 둘 이상이면 [매입처명] 헤더로 묶음
  if (vendors.length === 1) {
    for (const o of byVendor.get(vendors[0])) {
      lines.push(formatItemLine(o));
    }
  } else {
    for (const v of vendors) {
      if (v) lines.push(`[${v}]`);
      for (const o of byVendor.get(v)) {
        lines.push(formatItemLine(o));
      }
      lines.push('');
    }
  }
  lines.push('');
  lines.push('확인 후 가능 여부 회신 부탁드립니다.');
  lines.push('감사합니다.');

  return lines.join('\n').trim();
}

function formatItemLine(o) {
  const qty = (o.unit || '').trim();
  const main = qty ? `- ${o.itemName} : ${qty}` : `- ${o.itemName}`;
  return o.spec ? `${main} (${o.spec})` : main;
}

function SummaryCard({ label, subLabel, icon, count, tone, highlight, active, onClick }) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-800 hover:bg-amber-100',
    red: 'bg-rose-50 text-rose-800 hover:bg-rose-100',
    sky: 'bg-sky-50 text-sky-800 hover:bg-sky-100',
    emerald: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
  }[tone] || 'bg-gray-50 text-gray-700 hover:bg-gray-100';
  const activeRing = active ? 'ring-2 ring-navy-700 ring-offset-1' : '';
  const highlightRing = !active && highlight && count > 0
    ? `ring-1 ${tone === 'red' ? 'ring-rose-400' : 'ring-amber-400'}`
    : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border rounded-md transition
        flex flex-col sm:flex-row sm:items-center sm:justify-between
        px-2 py-2 sm:px-2.5 sm:py-1.5
        gap-0.5 sm:gap-2
        ${toneClass} ${activeRing} ${highlightRing}`}
      title={subLabel ? `${label} (${subLabel})` : label}
    >
      <span className="flex items-center gap-1 min-w-0 w-full sm:w-auto">
        <span className="text-sm sm:text-xs flex-shrink-0">{icon}</span>
        <span className="text-[11px] sm:text-[11px] font-medium truncate">{label}</span>
      </span>
      <span className="text-base sm:text-sm font-bold tabular-nums sm:ml-2 self-end sm:self-auto">{count}</span>
    </button>
  );
}

function Section({ title, count, defaultOpen = true, children, extraAction = null }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-gray-50">
        <button onClick={() => setOpen(!open)} className="flex-1 text-left flex items-center">
          <span>{title} <span className="text-xs font-normal text-gray-400 ml-1">({count})</span></span>
          {extraAction}
        </button>
        <button onClick={() => setOpen(!open)} className="text-gray-400 text-xs ml-2">{open ? '▼' : '▶'}</button>
      </div>
      {open && <div className="p-3 border-t">{children}</div>}
    </div>
  );
}

// 마감재 quantity·unit이 PO에 같이 넘어오는데 OrderRow는 unit만 보여줘서
// 사용자가 수량을 못 보는 문제 → 표시 시점에 둘을 합쳐 한 자유 텍스트로 표현.
function formatQtyUnit(q, u) {
  const qNum = Number(q);
  const hasQ = Number.isFinite(qNum) && qNum > 0;
  const hasU = u && String(u).trim();
  if (hasQ && hasU) return `${qNum}${u}`;
  if (hasU) return String(u).trim();
  if (hasQ) return String(qNum);
  return '';
}

function OrderRow({ order, onChange, selected, onToggleSelect }) {
  const [draft, setDraft] = useState({
    unit: formatQtyUnit(order.quantity, order.unit),
    vendor: order.vendor ?? '',
  });
  const [busy, setBusy] = useState(false);

  function setField(k, v) { setDraft((d) => ({ ...d, [k]: v })); }

  async function save() {
    setBusy(true);
    try {
      await purchaseOrdersApi.update(order.projectId, order.id, {
        unit: draft.unit?.trim() || null,
        vendor: draft.vendor?.trim() || null,
      });
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

  const hasMaterialChanged = order.materialChangedAt && order.status !== 'PENDING';

  return (
    <div className="py-2 px-2 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 text-sm hover:bg-gray-50 group">
      <div className="flex items-start gap-3 min-w-0 lg:flex-1 lg:max-w-[460px]">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          className="w-4 h-4 mt-0.5 accent-navy-700 cursor-pointer flex-shrink-0"
          title="선택 복사 대상"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {hasMaterialChanged && (
              <span
                className="text-xs sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 cursor-pointer"
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
                className="text-xs sm:text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >{order.project.name}</Link>
            )}
            {order.deadline && order.daysToDeadline != null && (
              <DeadlineChip days={order.daysToDeadline} deadline={order.deadline} />
            )}
          </div>
          {order.spec && (
            <div className="text-xs text-gray-500 truncate mt-0.5">{order.spec}</div>
          )}
          {order.notes && (
            <div className="text-xs text-amber-700 truncate mt-0.5" title={order.notes}>
              📝 {order.notes}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 lg:flex-shrink-0">
        <input
          value={draft.unit}
          onChange={(e) => setField('unit', e.target.value)}
          onBlur={save}
          placeholder="수량 (예: 12개)"
          className="w-28 text-sm px-2 py-1 border rounded"
        />
        <input
          value={draft.vendor}
          onChange={(e) => setField('vendor', e.target.value)}
          onBlur={save}
          placeholder="매입처"
          className="w-44 text-sm px-2 py-1 border rounded"
        />
        <button
          onClick={remove}
          disabled={busy}
          className="text-xs text-gray-400 hover:text-rose-500 px-1 opacity-0 group-hover:opacity-100"
        >🗑</button>
      </div>
    </div>
  );
}

// 발주 데드라인 칩 — 일정의 시작일에서 D-N 차감해서 자동 계산된 날짜 표시
// daysToDeadline: 음수 = 이미 지남, 0~3 = 위험(빨강), 4~7 = 임박(노랑), 그 외 = 회색
function DeadlineChip({ days, deadline }) {
  let cls = 'bg-gray-100 text-gray-600';
  let prefix = '';
  if (days < 0) { cls = 'bg-rose-100 text-rose-800 font-semibold'; prefix = '⚠ '; }
  else if (days <= 3) { cls = 'bg-rose-100 text-rose-700'; prefix = '🔥 '; }
  else if (days <= 7) { cls = 'bg-amber-100 text-amber-800'; prefix = '⏰ '; }
  const d = new Date(deadline);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const label = days < 0
    ? `${prefix}${Math.abs(days)}일 지남`
    : days === 0
    ? `${prefix}오늘까지`
    : `${prefix}D-${days} (${m}/${day})`;
  return (
    <span
      className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded ${cls}`}
      title={`자재 도착 데드라인: ${m}월 ${day}일 (공정 시작일 - D-N)`}
    >
      {label}
    </span>
  );
}
