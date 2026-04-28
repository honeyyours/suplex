// 공정 컨텍스트 드로어 — 한 공정의 4축(견적·마감재·일정·발주) 통합
// 메모리 핵심결정 "공정=척추" 시각적 구현체. 공정 현황 페이지 행 클릭 시 펼침.
import { useEffect, useMemo, useRef, useState } from 'react';
import { projectsApi } from '../api/projects';
import { formatWon, SIMPLE_QUOTE_STATUS_META } from '../api/simpleQuotes';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

const STATUS_META = {
  UNDECIDED:      { label: '미정',     color: 'bg-gray-100 text-gray-600' },
  REVIEWING:      { label: '검토중',   color: 'bg-amber-100 text-amber-700' },
  CONFIRMED:      { label: '확정',     color: 'bg-emerald-100 text-emerald-700' },
  CHANGED:        { label: '변경됨',   color: 'bg-rose-100 text-rose-700' },
  REUSED:         { label: '재사용',   color: 'bg-sky-100 text-sky-700' },
  NOT_APPLICABLE: { label: '해당없음', color: 'bg-gray-50 text-gray-400' },
};
const PO_STATUS = {
  PENDING:    { label: '대기',     color: 'bg-amber-100 text-amber-700' },
  ORDERED:    { label: '발주완료', color: 'bg-sky-100 text-sky-700' },
  RECEIVED:   { label: '수령',     color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: '취소',     color: 'bg-gray-100 text-gray-400' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WorkContextDrawer({ projectId, phase, open, onClose }) {
  const { displayPhase } = usePhaseLabels();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open || !phase) return;
    let alive = true;
    setLoading(true);
    setData(null);
    projectsApi.phaseDetail(projectId, phase)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { /* noop */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId, phase, open]);

  // 외부 클릭 닫힘 (입력 element는 무시)
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (drawerRef.current && drawerRef.current.contains(e.target)) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.target?.isContentEditable) return;
      onClose?.();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const quoteSubtotal = useMemo(() => {
    if (!data?.quote?.lines) return 0;
    return data.quote.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }, [data]);

  const materialStats = useMemo(() => {
    const items = data?.materials || [];
    const total = items.length;
    const confirmed = items.filter((m) =>
      ['CONFIRMED', 'CHANGED', 'REUSED'].includes(m.status) || m.locked
    ).length;
    return { total, confirmed };
  }, [data]);

  const orderStats = useMemo(() => {
    const orders = data?.purchaseOrders || [];
    const stats = { pending: 0, ordered: 0, received: 0, cancelled: 0 };
    for (const o of orders) {
      const k = (o.status || '').toLowerCase();
      if (stats[k] != null) stats[k]++;
    }
    return stats;
  }, [data]);

  if (!open) return null;

  return (
    <aside ref={drawerRef} className="fixed top-0 right-0 bottom-0 w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col border-l">
      <header className="px-4 py-3 border-b bg-navy-800 text-white flex items-center justify-between">
        <div>
          <div className="text-xs text-navy-100">🦴 공정 컨텍스트</div>
          <div className="text-lg font-bold">{displayPhase(phase)}</div>
        </div>
        <button onClick={onClose} className="text-navy-100 hover:text-white text-xl px-2">×</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-6 text-sm text-gray-400">불러오는 중...</div>}
        {!loading && data && (
          <div className="p-4 space-y-4">
            {/* 견적 */}
            <Section
              title="🪙 견적"
              count={data.quote?.lines?.length || 0}
              meta={data.quote ? `${data.quote.title} · ${SIMPLE_QUOTE_STATUS_META[data.quote.status]?.label || data.quote.status}` : '견적 없음'}
              total={quoteSubtotal}
            >
              {(data.quote?.lines?.length || 0) === 0 ? (
                <Empty>이 공정의 견적 라인이 없습니다.</Empty>
              ) : data.quote.lines.map((l) => (
                <div key={l.id} className="text-xs border rounded p-2 hover:bg-gray-50">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-gray-800 truncate">{l.itemName || '(이름 없음)'}</div>
                    <div className="text-navy-700 font-semibold tabular-nums whitespace-nowrap">{formatWon(Number(l.amount) || 0)}</div>
                  </div>
                  {(l.spec || l.quantity || l.unitPrice) && (
                    <div className="text-gray-500 mt-0.5">
                      {l.spec && <span>{l.spec}</span>}
                      {l.spec && (l.quantity || l.unitPrice) && <span className="mx-1">·</span>}
                      {l.quantity != null && Number(l.quantity) > 0 && (
                        <span>수량 {Number(l.quantity)}{l.unit ? ` ${l.unit}` : ''}</span>
                      )}
                      {Number(l.unitPrice) > 0 && (
                        <span> · 단가 {formatWon(l.unitPrice)}</span>
                      )}
                    </div>
                  )}
                  {l.notes && (
                    <div className="mt-1 text-gray-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 whitespace-pre-line text-[11px]">
                      📝 {l.notes}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* 마감재 */}
            <Section
              title="🪵 마감재"
              count={materialStats.total}
              meta={materialStats.total > 0 ? `${materialStats.confirmed}/${materialStats.total} 확정` : ''}
            >
              {materialStats.total === 0 ? (
                <Empty>이 공정의 마감재가 없습니다.</Empty>
              ) : data.materials.map((m) => {
                const meta = STATUS_META[m.status] || STATUS_META.UNDECIDED;
                return (
                  <div key={m.id} className="text-xs border rounded p-2 hover:bg-gray-50">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-medium text-gray-800 truncate">{m.itemName || '(이름 없음)'}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.color} whitespace-nowrap`}>{meta.label}</span>
                    </div>
                    {(m.brand || m.productName || m.spec) && (
                      <div className="text-gray-500 mt-0.5 truncate">
                        {[m.brand, m.productName, m.modelCode, m.spec].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>

            {/* 일정 */}
            <Section
              title="📅 일정"
              count={data.scheduleEntries?.length || 0}
            >
              {(data.scheduleEntries?.length || 0) === 0 ? (
                <Empty>이 공정의 일정이 없습니다.</Empty>
              ) : data.scheduleEntries.map((s) => (
                <div key={s.id} className="text-xs border rounded p-2 hover:bg-gray-50 flex items-baseline gap-2">
                  <span className="text-navy-700 font-semibold tabular-nums whitespace-nowrap">{fmtDate(s.date)}</span>
                  <span className="flex-1 text-gray-700 truncate">{s.content}</span>
                  {s.isFixed && <span className="text-[10px] px-1 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">픽스</span>}
                </div>
              ))}
            </Section>

            {/* 발주 */}
            <Section
              title="📦 발주"
              count={data.purchaseOrders?.length || 0}
              meta={
                Object.entries(orderStats)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${PO_STATUS[k.toUpperCase()]?.label || k}: ${v}`)
                  .join(' · ')
              }
            >
              {(data.purchaseOrders?.length || 0) === 0 ? (
                <Empty>이 공정의 발주가 없습니다.</Empty>
              ) : data.purchaseOrders.map((po) => {
                const meta = PO_STATUS[po.status] || { label: po.status, color: 'bg-gray-100' };
                return (
                  <div key={po.id} className="text-xs border rounded p-2 hover:bg-gray-50">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-medium text-gray-800 truncate">
                        {po.material?.itemName || '(이름 없음)'}
                        {po.materialChangedAt && <span className="ml-1 text-amber-700">⚠️</span>}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.color} whitespace-nowrap`}>{meta.label}</span>
                    </div>
                    {po.material && (po.material.brand || po.material.productName) && (
                      <div className="text-gray-500 mt-0.5 truncate">
                        {[po.material.brand, po.material.productName, po.material.spec].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>
          </div>
        )}
      </div>

      <footer className="px-4 py-2 border-t bg-gray-50 text-[11px] text-gray-400">
        💡 베타 1차 — 조회 전용. 액션(상태 변경 등)은 정식 출시 시 추가.
      </footer>
    </aside>
  );
}

function Section({ title, count, meta, total, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-sm font-semibold text-navy-800">
          {title} <span className="text-gray-400 font-normal text-xs">({count})</span>
        </div>
        <div className="text-xs text-gray-500">
          {total != null && <span className="font-semibold text-navy-700 tabular-nums mr-2">{formatWon(total)}원</span>}
          {meta}
        </div>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Empty({ children }) {
  return <div className="text-xs text-gray-400 italic px-2 py-2">{children}</div>;
}
