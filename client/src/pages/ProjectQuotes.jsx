import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  quotesApi, WORK_TYPES, WORK_TYPE_LABEL, QUOTE_STATUS_META,
  COST_ROWS, formatWon, parseWon, pricePerPyeong, numberToKorean,
} from '../api/quotes';
import { companyApi } from '../api/company';
import { quoteTemplatesApi } from '../api/quoteTemplates';
import { formatDateDot } from '../utils/date';

export default function ProjectQuotes() {
  const { id: projectId } = useParams();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [company, setCompany] = useState(null);

  async function reload(selectId) {
    setLoading(true);
    try {
      const { quotes } = await quotesApi.list(projectId);
      setQuotes(quotes);
      if (selectId) setActiveId(selectId);
      else if (!activeId && quotes[0]) setActiveId(quotes[0].id);
      else if (activeId && !quotes.find((q) => q.id === activeId)) {
        setActiveId(quotes[0]?.id || null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    companyApi.get().then((d) => setCompany(d.company)).catch(() => {});
    /* eslint-disable-next-line */
  }, [projectId]);

  async function handleCreate() {
    setCreating(true);
    try {
      const { quote } = await quotesApi.create(projectId);
      await reload(quote.id);
    } catch (e) {
      alert('견적 생성 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicate() {
    if (!activeId) return;
    if (!confirm('이 견적을 복제해서 수정본을 만들까요?')) return;
    try {
      const { quote } = await quotesApi.duplicate(projectId, activeId);
      await reload(quote.id);
    } catch (e) {
      alert('복제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleDelete() {
    if (!activeId) return;
    if (!confirm('이 견적을 삭제할까요? (되돌릴 수 없음)')) return;
    try {
      await quotesApi.remove(projectId, activeId);
      await reload();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  if (loading && quotes.length === 0) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-sm mb-4">아직 등록된 견적이 없습니다.</div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-navy-700 hover:bg-navy-800 text-white text-sm px-5 py-2.5 rounded-md disabled:opacity-50"
        >
          {creating ? '생성 중...' : '+ 첫 견적 만들기'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-2 flex-wrap border-b pb-3">
        {quotes.map((q) => {
          const meta = QUOTE_STATUS_META[q.status] || QUOTE_STATUS_META.DRAFT;
          const active = q.id === activeId;
          return (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                active ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{q.title}</span>
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
              <span className="ml-2 text-xs text-gray-500">{formatWon(q.totalFinal)}원</span>
            </button>
          );
        })}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="text-sm px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {creating ? '생성 중...' : '+ 새 견적'}
        </button>
      </div>

      {activeId && (
        <QuoteEditor
          key={activeId}
          projectId={projectId}
          quoteId={activeId}
          company={company}
          onChanged={() => reload(activeId)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ============================================
// QuoteEditor
// ============================================
function QuoteEditor({ projectId, quoteId, company, onChanged, onDuplicate, onDelete }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverOpen, setCoverOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState(new Set());
  const [pickerWorkType, setPickerWorkType] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { quote } = await quotesApi.get(projectId, quoteId);
      setQuote(quote);
      // 라인이 있는 공종은 자동 expand
      const used = new Set(quote.lines.map((l) => l.workType));
      setExpandedTypes(used);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [quoteId]);

  async function patchQuote(payload) {
    try {
      const { quote: updated } = await quotesApi.update(projectId, quoteId, payload);
      setQuote(updated);
      onChanged?.();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
  }

  async function addLine(workType) {
    try {
      const { quote: updated } = await quotesApi.addLine(projectId, quoteId, {
        workType, itemName: '신규 항목', quantity: 1,
      });
      setQuote(updated);
      setExpandedTypes((s) => new Set([...s, workType]));
      onChanged?.();
    } catch (e) { alert('추가 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function patchLine(lineId, payload) {
    try {
      const { quote: updated } = await quotesApi.updateLine(projectId, quoteId, lineId, payload);
      setQuote(updated);
      onChanged?.();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function removeLine(lineId) {
    if (!confirm('이 항목을 삭제할까요?')) return;
    try {
      const { quote: updated } = await quotesApi.removeLine(projectId, quoteId, lineId);
      setQuote(updated);
      onChanged?.();
    } catch (e) { alert('삭제 실패: ' + (e.response?.data?.error || e.message)); }
  }

  async function bulkFromTemplates(workType, items) {
    try {
      const payload = items.map((t) => ({
        workType,
        itemName: t.itemName,
        spec: t.spec,
        unit: t.unit,
        quantity: Number(t.defaultQuantity) || 1,
        materialUnitPrice: Number(t.defaultMaterialPrice) || 0,
        laborUnitPrice: Number(t.defaultLaborPrice) || 0,
        expenseUnitPrice: Number(t.defaultExpensePrice) || 0,
      }));
      const { quote: updated } = await quotesApi.bulkLines(projectId, quoteId, payload);
      setQuote(updated);
      setExpandedTypes((s) => new Set([...s, workType]));
      onChanged?.();
      setPickerWorkType(null);
    } catch (e) { alert('가져오기 실패: ' + (e.response?.data?.error || e.message)); }
  }

  async function importAllTemplates() {
    try {
      const { templates } = await quoteTemplatesApi.list();
      if (templates.length === 0) {
        alert('등록된 템플릿이 없습니다.\n설정 → 견적 항목 템플릿에서 시드하거나 추가하세요.');
        return;
      }
      // 공종별 개수 요약
      const byType = {};
      for (const t of templates) byType[t.workType] = (byType[t.workType] || 0) + 1;
      const summary = Object.entries(byType)
        .map(([k, n]) => `· ${WORK_TYPE_LABEL[k]} ${n}개`)
        .join('\n');
      const ok = confirm(`전체 ${templates.length}개 템플릿을 이 견적에 일괄 추가할까요?\n\n${summary}\n\n(기존 항목은 유지됩니다. 필요없는 건 추가 후 삭제하세요)`);
      if (!ok) return;

      const payload = templates.map((t) => ({
        workType: t.workType,
        itemName: t.itemName,
        spec: t.spec,
        unit: t.unit,
        quantity: Number(t.defaultQuantity) || 1,
        materialUnitPrice: Number(t.defaultMaterialPrice) || 0,
        laborUnitPrice: Number(t.defaultLaborPrice) || 0,
        expenseUnitPrice: Number(t.defaultExpensePrice) || 0,
      }));
      const { quote: updated } = await quotesApi.bulkLines(projectId, quoteId, payload);
      setQuote(updated);
      setExpandedTypes(new Set(Object.keys(byType)));
      onChanged?.();
    } catch (e) { alert('전체 가져오기 실패: ' + (e.response?.data?.error || e.message)); }
  }

  function handlePrint() {
    document.body.classList.add('print-quote');
    const cleanup = () => {
      document.body.classList.remove('print-quote');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 50);
  }

  // ⚠️ 모든 훅은 early return 이전에 호출되어야 함 (Rules of Hooks)
  const linesByType = useMemo(() => {
    const m = new Map();
    for (const w of WORK_TYPES) m.set(w.key, []);
    if (quote) {
      for (const l of quote.lines || []) {
        if (m.has(l.workType)) m.get(l.workType).push(l);
      }
    }
    return m;
  }, [quote]);

  if (loading || !quote) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const meta = QUOTE_STATUS_META[quote.status] || QUOTE_STATUS_META.DRAFT;
  const ppy = pricePerPyeong(quote.totalDirect, quote.area);

  return (
    <div className="space-y-4 quote-printable">
      {/* === 상단 액션바 (인쇄 시 숨김) === */}
      <div className="no-print bg-navy-50/60 border rounded-lg p-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              defaultValue={quote.title}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== quote.title) patchQuote({ title: v });
              }}
              className="text-lg font-bold text-navy-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-navy-700 outline-none px-1"
            />
            <select
              value={quote.status}
              onChange={(e) => patchQuote({ status: e.target.value })}
              className={`text-xs px-2 py-1 rounded border-0 ${meta.color}`}
            >
              {Object.entries(QUOTE_STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            합계 <span className="text-base font-bold text-navy-800 ml-1">{formatWon(quote.totalFinal)}</span> 원
            <span className="text-gray-400 ml-2">(공급가액 {formatWon(quote.totalSupply)} − 절삭 {formatWon(quote.totalRoundOff)})</span>
            {ppy && <span className="ml-3 text-gray-400">평당 {formatWon(ppy)}원</span>}
            <span className="ml-3 text-gray-400">부가세 별도 {formatWon(quote.totalVat)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50">🖨️ 인쇄/PDF</button>
          <button onClick={onDuplicate} className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50">📄 수정본</button>
          <button onClick={onDelete} className="text-sm px-3 py-1.5 border rounded-md text-rose-600 hover:bg-rose-50">삭제</button>
        </div>
      </div>

      {/* === 갑지 (인쇄 첫 페이지 = 항상 표시 / 화면에서는 접기 가능) === */}
      <div className="no-print">
        <button
          onClick={() => setCoverOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-lg text-sm font-semibold text-navy-800 hover:bg-gray-100"
        >
          <span>갑지 (표지) 편집</span>
          <span className="text-xs text-gray-500">{coverOpen ? '접기 ▲' : '펴기 ▼'}</span>
        </button>
        {coverOpen && (
          <div className="bg-white border border-t-0 rounded-b-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Field label="공사명 (PROJECT)" value={quote.projectName} onSave={(v) => patchQuote({ projectName: v })} />
            <Field label="고객명 (TO)" value={quote.customerName} onSave={(v) => patchQuote({ customerName: v })} />
            <Field label="현장 주소" value={quote.siteAddress} onSave={(v) => patchQuote({ siteAddress: v })} />
            <Field label="고객 연락처" value={quote.customerPhone || ''} onSave={(v) => patchQuote({ customerPhone: v || null })} />
            <Field label="유효기간" type="date" value={quote.validUntil ? quote.validUntil.slice(0, 10) : ''} onSave={(v) => patchQuote({ validUntil: v || null })} />
            <Field label="면적 (평)" type="number" step="0.01" value={quote.area || ''} onSave={(v) => patchQuote({ area: v ? Number(v) : null })} />
            <Field label="착공 예정일 (견적서)" type="date" value={quote.constructionStartDate ? quote.constructionStartDate.slice(0, 10) : ''} onSave={(v) => patchQuote({ constructionStartDate: v || null })} />
            <Field label="준공 예정일 (견적서)" type="date" value={quote.constructionEndDate ? quote.constructionEndDate.slice(0, 10) : ''} onSave={(v) => patchQuote({ constructionEndDate: v || null })} />
            <Field label="갑지 비고 (빨간 글씨)" value={quote.notes || ''} full multiline onSave={(v) => patchQuote({ notes: v || null })} />
            <Field label="견적조건 (Terms)" value={quote.terms || ''} full multiline onSave={(v) => patchQuote({ terms: v || null })} />
          </div>
        )}
      </div>

      {/* === 인쇄 전용: 표지 갑지 (PDF 양식 그대로) === */}
      <PrintCover quote={quote} company={company} today={today} />

      {/* === 인쇄 전용: 원가내역서 === */}
      <PrintCostStatement quote={quote} />

      {/* === 인쇄 전용: 공종별 요약 === */}
      <PrintWorkSummary quote={quote} linesByType={linesByType} ppy={ppy} />

      {/* === 직접공사비 (15공종 + 세부 항목) — 화면용 편집 === */}
      <section className="no-print bg-white border rounded-lg overflow-hidden">
        <header className="px-4 py-3 bg-gray-50 border-b text-sm font-semibold text-navy-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span>직접공사비 (편집)</span>
            <button
              onClick={importAllTemplates}
              className="text-xs px-2.5 py-1 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 font-normal"
              title="등록된 모든 공종의 템플릿을 한 번에 추가"
            >
              📋 전체 템플릿 가져오기
            </button>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            (1) {formatWon(quote.totalDirectMaterial)} · (4) {formatWon(quote.totalDirectLabor)} · (7) {formatWon(quote.totalDirectExpense)}
            <span className="ml-3">(14) <b>{formatWon(quote.totalDirect)}</b></span>
          </span>
        </header>
        <div>
          {WORK_TYPES.map((w) => (
            <WorkTypeSection
              key={w.key}
              workType={w.key}
              label={w.label}
              lines={linesByType.get(w.key)}
              expanded={expandedTypes.has(w.key)}
              onToggle={() => setExpandedTypes((s) => {
                const next = new Set(s);
                if (next.has(w.key)) next.delete(w.key); else next.add(w.key);
                return next;
              })}
              onAdd={() => addLine(w.key)}
              onImport={() => setPickerWorkType(w.key)}
              onPatchLine={patchLine}
              onRemoveLine={removeLine}
            />
          ))}
        </div>
      </section>

      {/* === 원가내역서 18행 (편집 + 자동계산) === */}
      <section className="no-print bg-white border rounded-lg overflow-hidden">
        <button
          onClick={() => setCostOpen((v) => !v)}
          className="w-full px-4 py-3 bg-gray-50 border-b text-sm font-semibold text-navy-800 flex items-center justify-between hover:bg-gray-100"
        >
          <span>원가내역서</span>
          <span className="text-xs text-gray-500">{costOpen ? '접기 ▲' : '펴기 ▼'}</span>
        </button>
        {costOpen && <CostStatementEditor quote={quote} onPatch={patchQuote} />}
      </section>

      {pickerWorkType && (
        <TemplatePicker
          workType={pickerWorkType}
          onClose={() => setPickerWorkType(null)}
          onPick={(items) => bulkFromTemplates(pickerWorkType, items)}
        />
      )}
    </div>
  );
}

// ============================================
// 공종별 섹션
// ============================================
function WorkTypeSection({ workType, label, lines, expanded, onToggle, onAdd, onImport, onPatchLine, onRemoveLine }) {
  const subtotal = lines.reduce((s, l) =>
    s + Number(l.materialCost) + Number(l.laborCost) + Number(l.expenseCost), 0);
  const hasLines = lines.length > 0;

  return (
    <div className="border-b last:border-b-0">
      <div
        className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
          hasLines ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
          <span className={`text-sm font-medium ${hasLines ? 'text-navy-800' : 'text-gray-400'}`}>{label}</span>
          {hasLines && (
            <span className="text-xs text-gray-500">({lines.length}건)</span>
          )}
        </div>
        <div className="text-sm tabular-nums text-gray-700">
          {hasLines ? formatWon(subtotal) + '원' : <span className="text-xs text-gray-300">미사용</span>}
        </div>
      </div>
      {expanded && (
        <div className="bg-gray-50/40 px-2 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[1200px]">
              <thead className="text-gray-500">
                <tr className="border-b">
                  <th className="text-left px-2 py-1.5 w-44">항목명</th>
                  <th className="text-left px-2 py-1.5 w-48">규격</th>
                  <th className="text-left px-2 py-1.5 w-16">단위</th>
                  <th className="text-right px-2 py-1.5 w-16">수량</th>
                  <th className="text-right px-2 py-1.5 w-24">재료 단가</th>
                  <th className="text-right px-2 py-1.5 w-28">재료 금액</th>
                  <th className="text-right px-2 py-1.5 w-24">노무 단가</th>
                  <th className="text-right px-2 py-1.5 w-28">노무 금액</th>
                  <th className="text-right px-2 py-1.5 w-24">경비 단가</th>
                  <th className="text-right px-2 py-1.5 w-28">경비 금액</th>
                  <th className="text-right px-2 py-1.5 w-28">합계</th>
                  <th className="text-left px-2 py-1.5">비고</th>
                  <th className="px-1 py-1.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {lines.map((line) => (
                  <LineRow key={line.id} line={line} onPatch={onPatchLine} onRemove={onRemoveLine} />
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-2 py-3 text-center text-gray-400">
                      이 공종에는 아직 항목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              {lines.length > 0 && (
                <tfoot className="bg-emerald-50/60 font-semibold text-navy-800">
                  <tr>
                    <td colSpan={5} className="px-2 py-1.5">소 계</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.materialCost), 0))}</td>
                    <td />
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.laborCost), 0))}</td>
                    <td />
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.expenseCost), 0))}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(subtotal)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="px-2 pt-2 flex gap-3">
            <button
              onClick={onAdd}
              className="text-xs text-navy-700 hover:text-navy-800 hover:underline"
            >
              + 항목 추가
            </button>
            <button
              onClick={onImport}
              className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              📋 템플릿에서 가져오기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 템플릿 picker 모달
// ============================================
function TemplatePicker({ workType, onClose, onPick }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    quoteTemplatesApi.list(workType)
      .then((d) => setTemplates(d.templates))
      .finally(() => setLoading(false));
  }, [workType]);

  function toggle(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === templates.length) setSelected(new Set());
    else setSelected(new Set(templates.map((t) => t.id)));
  }

  function handleSubmit() {
    const items = templates.filter((t) => selected.has(t.id));
    if (items.length === 0) {
      alert('항목을 1개 이상 선택해주세요');
      return;
    }
    onPick(items);
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy-800">
            템플릿에서 가져오기 — <span className="text-navy-600">{WORK_TYPE_LABEL[workType]}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
          {!loading && templates.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              이 공종의 템플릿이 없습니다.<br />
              <span className="text-xs">설정 → 견적 항목 템플릿에서 추가하거나 "PDF 양식 기준 기본 시드"를 실행하세요.</span>
            </div>
          )}
          {!loading && templates.length > 0 && (
            <table className="w-full text-xs">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="px-2 py-1.5 w-8">
                    <input type="checkbox" checked={selected.size === templates.length} onChange={toggleAll} />
                  </th>
                  <th className="text-left px-2 py-1.5">항목</th>
                  <th className="text-left px-2 py-1.5">규격</th>
                  <th className="px-2 py-1.5 w-12">단위</th>
                  <th className="text-right px-2 py-1.5 w-20">재료</th>
                  <th className="text-right px-2 py-1.5 w-20">노무</th>
                  <th className="text-right px-2 py-1.5 w-20">경비</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggle(t.id)}>
                    <td className="px-2 py-1.5 text-center">
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="px-2 py-1.5 text-navy-800">{t.itemName}</td>
                    <td className="px-2 py-1.5 text-gray-500">{t.spec}</td>
                    <td className="px-2 py-1.5 text-center">{t.unit}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultMaterialPrice)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultLaborPrice)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultExpensePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">취소</button>
          <button onClick={handleSubmit} disabled={selected.size === 0} className="text-sm px-5 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50">
            {selected.size}개 추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 라인 행 (인라인 편집)
// ============================================
function LineRow({ line, onPatch, onRemove }) {
  return (
    <tr className="border-b hover:bg-gray-50/60">
      <td className="px-1 py-1"><CellText value={line.itemName} onSave={(v) => onPatch(line.id, { itemName: v })} /></td>
      <td className="px-1 py-1"><CellText value={line.spec || ''} onSave={(v) => onPatch(line.id, { spec: v || null })} /></td>
      <td className="px-1 py-1"><CellText value={line.unit || ''} onSave={(v) => onPatch(line.id, { unit: v || null })} className="w-14" /></td>
      <td className="px-1 py-1"><CellNumber value={line.quantity} onSave={(v) => onPatch(line.id, { quantity: v })} decimals={2} /></td>
      <td className="px-1 py-1"><CellMoney value={line.materialUnitPrice} onSave={(v) => onPatch(line.id, { materialUnitPrice: v })} /></td>
      <td className="px-1 py-1 text-right tabular-nums text-gray-600">{formatWon(line.materialCost)}</td>
      <td className="px-1 py-1"><CellMoney value={line.laborUnitPrice} onSave={(v) => onPatch(line.id, { laborUnitPrice: v })} /></td>
      <td className="px-1 py-1 text-right tabular-nums text-gray-600">{formatWon(line.laborCost)}</td>
      <td className="px-1 py-1"><CellMoney value={line.expenseUnitPrice} onSave={(v) => onPatch(line.id, { expenseUnitPrice: v })} /></td>
      <td className="px-1 py-1 text-right tabular-nums text-gray-600">{formatWon(line.expenseCost)}</td>
      <td className="px-1 py-1 text-right tabular-nums text-navy-800 font-medium">{formatWon(Number(line.materialCost) + Number(line.laborCost) + Number(line.expenseCost))}</td>
      <td className="px-1 py-1"><CellText value={line.notes || ''} onSave={(v) => onPatch(line.id, { notes: v || null })} /></td>
      <td className="px-1 py-1 text-center">
        <button onClick={() => onRemove(line.id)} className="text-gray-300 hover:text-rose-500 text-xs" title="삭제">×</button>
      </td>
    </tr>
  );
}

// ============================================
// 원가내역서 편집기 (18행 + 적용여부 + 비율 인라인)
// ============================================
function CostStatementEditor({ quote, onPatch }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2 w-12">No.</th>
            <th className="text-left px-3 py-2 w-28">구분</th>
            <th className="text-left px-3 py-2 w-40">항목</th>
            <th className="px-3 py-2 w-20">적용</th>
            <th className="px-3 py-2 w-28">비율(%)</th>
            <th className="text-right px-3 py-2 w-40">금액</th>
            <th className="text-left px-3 py-2">비고 (수식)</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {COST_ROWS.map((row) => {
            const isSubtotal = row.auto === 'subtotal' || row.auto === 'fromLines';
            const applyOn = row.apply ? Boolean(quote[row.apply]) : true;
            const rateValue = row.rate ? Number(quote[row.rate]) : null;
            return (
              <tr
                key={row.idx}
                className={
                  row.idx === 14 ? 'bg-emerald-50/60 font-semibold text-navy-800'
                  : isSubtotal ? 'bg-gray-50/60 text-gray-700'
                  : ''
                }
              >
                <td className="px-3 py-2 text-center text-gray-500">({row.idx})</td>
                <td className="px-3 py-2 text-gray-500">{row.section}</td>
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2 text-center">
                  {row.apply ? (
                    <input
                      type="checkbox"
                      checked={applyOn}
                      onChange={(e) => onPatch({ [row.apply]: e.target.checked })}
                    />
                  ) : <span className="text-gray-300 text-xs">자동</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.rate ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={rateValue}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n !== rateValue) onPatch({ [row.rate]: n });
                      }}
                      className="w-20 text-right border rounded px-1.5 py-0.5 text-xs"
                    />
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatWon(quote[row.field])}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {row.formulaText}{row.rate ? `${rateValue}%` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-navy-50 text-navy-800 font-bold border-t-2">
          <tr>
            <td colSpan={5} className="px-3 py-2.5">공급가액</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(quote.totalSupply)}</td>
            <td className="px-3 py-2.5 text-xs font-normal">(14)+(15)+(16)+(17)+(18)</td>
          </tr>
          <tr className="text-gray-700">
            <td colSpan={3} className="px-3 py-2.5">부가가치세</td>
            <td className="px-3 py-2.5 text-center text-xs text-gray-500">별도</td>
            <td className="px-3 py-2.5 text-center">
              <input
                type="number"
                step="0.01"
                defaultValue={Number(quote.rateVat)}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n !== Number(quote.rateVat)) onPatch({ rateVat: n });
                }}
                className="w-20 text-right border rounded px-1.5 py-0.5 text-xs"
              />
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(quote.totalVat)}</td>
            <td className="px-3 py-2.5 text-xs font-normal">공급가액 × {Number(quote.rateVat)}%</td>
          </tr>
          <tr className="text-base">
            <td colSpan={5} className="px-3 py-3">합 계 <span className="text-xs font-normal text-gray-500 ml-2">(10만원 단위 절삭)</span></td>
            <td className="px-3 py-3 text-right tabular-nums">{formatWon(quote.totalFinal)}</td>
            <td className="px-3 py-3 text-xs font-normal text-gray-500">절삭 {formatWon(quote.totalRoundOff)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ============================================
// 셀 컴포넌트들
// ============================================
function CellText({ value, onSave, className = '' }) {
  const [v, setV] = useState(value || '');
  useEffect(() => { setV(value || ''); }, [value]);
  return (
    <input
      type="text"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== (value || '')) onSave(v); }}
      className={`w-full text-xs px-1.5 py-1 border border-transparent hover:border-gray-200 focus:border-navy-700 rounded outline-none ${className}`}
    />
  );
}

function CellNumber({ value, onSave, decimals = 0 }) {
  const [v, setV] = useState(String(value ?? ''));
  useEffect(() => { setV(String(Number(value).toFixed(decimals))); }, [value, decimals]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const n = Number(v);
        if (Number.isFinite(n) && n !== Number(value)) onSave(n);
        else setV(String(Number(value).toFixed(decimals)));
      }}
      className="w-full text-xs px-1.5 py-1 text-right tabular-nums border border-transparent hover:border-gray-200 focus:border-navy-700 rounded outline-none"
    />
  );
}

function CellMoney({ value, onSave }) {
  const [v, setV] = useState(formatWon(value));
  useEffect(() => { setV(formatWon(value)); }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const n = parseWon(v);
        setV(formatWon(n));
        if (n !== Number(value)) onSave(n);
      }}
      className="w-full text-xs px-1.5 py-1 text-right tabular-nums border border-transparent hover:border-gray-200 focus:border-navy-700 rounded outline-none"
    />
  );
}

function Field({ label, value, onSave, type = 'text', step, full = false, multiline = false }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          defaultValue={value}
          rows={3}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== (value || '').toString()) onSave(v);
          }}
          className="w-full text-sm px-3 py-2 border rounded-md focus:border-navy-700 outline-none resize-y"
        />
      ) : (
        <input
          type={type}
          step={step}
          defaultValue={value}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (value || '').toString().trim()) onSave(v);
          }}
          className="w-full text-sm px-3 py-2 border rounded-md focus:border-navy-700 outline-none"
        />
      )}
    </div>
  );
}

// ============================================
// 인쇄 전용 페이지: 갑지
// ============================================
function PrintCover({ quote, company, today }) {
  return (
    <section className="hidden print:block" style={{ pageBreakAfter: 'always' }}>
      <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-widest">견 적 서</h1>
          <div className="text-base text-gray-600 mt-1">/ ESTIMATE</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-wide">{company?.name || ''}</div>
          {company?.address && <div className="text-xs mt-2">{company.address}</div>}
          {company?.email && <div className="text-xs">E-MAIL : {company.email}</div>}
          {company?.phone && <div className="text-xs">TEL : {company.phone}</div>}
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <tbody>
          <tr><td className="w-32 py-2 text-gray-700">제 출 처 / TO.</td><td className="py-2 font-semibold">{quote.customerName} 고객님</td></tr>
          <tr><td className="py-2 text-gray-700">공 사 명 / PROJECT.</td><td className="py-2 font-semibold">{quote.projectName}</td></tr>
          <tr><td className="py-2 text-gray-700">제출일자 / Date.</td><td className="py-2">{today}</td></tr>
          {(quote.constructionStartDate || quote.constructionEndDate) && (
            <tr>
              <td className="py-2 text-gray-700">공사기간 / Period.</td>
              <td className="py-2">
                {quote.constructionStartDate ? formatDateDot(quote.constructionStartDate) : '미정'}
                <span className="mx-2">~</span>
                {quote.constructionEndDate ? formatDateDot(quote.constructionEndDate) : '미정'}
              </td>
            </tr>
          )}
          <tr><td className="py-2 text-gray-700">금　　　액 / Amount.</td><td className="py-2 font-bold text-base">一金 : {numberToKorean(quote.totalFinal)} [₩{formatWon(quote.totalFinal)}]</td></tr>
        </tbody>
      </table>

      <div className="border-t border-b border-black py-3 mb-6 text-sm">
        별첨 명세와 같이 견적합니다 / We are pleased to submit you our estimate as specified on attached sheet(s).
      </div>

      {quote.notes && (
        <div className="text-sm text-rose-600 mb-6 whitespace-pre-line">{quote.notes}</div>
      )}

      {quote.terms && (
        <div className="text-sm">
          <div className="font-semibold text-gray-700 mb-2">견적조건 / Terms</div>
          <div className="whitespace-pre-line pl-3">{quote.terms}</div>
        </div>
      )}
    </section>
  );
}

// ============================================
// 인쇄 전용 페이지: 원가내역서
// ============================================
function PrintCostStatement({ quote }) {
  return (
    <section className="hidden print:block" style={{ pageBreakAfter: 'always' }}>
      <h2 className="text-center text-xl font-bold underline mb-4">원 가 내 역 서</h2>
      <div className="text-sm mb-2">[ 공사명 : {quote.projectName} ]</div>
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1.5 w-12"></th>
            <th className="border px-2 py-1.5 w-24">구분</th>
            <th className="border px-2 py-1.5 text-left">항목</th>
            <th className="border px-2 py-1.5 w-32 text-right">금액</th>
            <th className="border px-2 py-1.5 w-20">구성비</th>
            <th className="border px-2 py-1.5 w-40 text-left">비고</th>
          </tr>
        </thead>
        <tbody>
          {COST_ROWS.map((row) => {
            const applyOn = row.apply ? Boolean(quote[row.apply]) : true;
            const amount = quote[row.field];
            const showAmount = row.auto === 'fromLines' || row.auto === 'subtotal' || (applyOn && Number(amount) > 0);
            return (
              <tr key={row.idx} className={row.idx === 14 ? 'font-semibold bg-gray-50' : ''}>
                <td className="border px-2 py-1.5 text-center">({row.idx})</td>
                <td className="border px-2 py-1.5 text-center">{['재료비','노무비','경비'].includes(row.section) ? row.section : ''}</td>
                <td className="border px-2 py-1.5">{row.label}</td>
                <td className="border px-2 py-1.5 text-right tabular-nums">{showAmount ? formatWon(amount) : ''}</td>
                <td className="border px-2 py-1.5 text-right tabular-nums"></td>
                <td className="border px-2 py-1.5 text-xs">{row.formulaText}{row.rate ? `${Number(quote[row.rate])}%` : ''}</td>
              </tr>
            );
          })}
          <tr className="bg-gray-50">
            <td colSpan={2} className="border px-2 py-1.5 text-center">공급가액</td>
            <td className="border px-2 py-1.5"></td>
            <td className="border px-2 py-1.5 text-right tabular-nums font-semibold">{formatWon(quote.totalSupply)}</td>
            <td className="border px-2 py-1.5"></td>
            <td className="border px-2 py-1.5 text-xs">(14)+(15)+(16)+(17)+(18)</td>
          </tr>
          <tr>
            <td colSpan={2} className="border px-2 py-1.5 text-center">부가가치세</td>
            <td className="border px-2 py-1.5"></td>
            <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(quote.totalVat)}</td>
            <td className="border px-2 py-1.5"></td>
            <td className="border px-2 py-1.5 text-xs">별도</td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={2} className="border px-2 py-2 text-center">합　계</td>
            <td className="border px-2 py-2"></td>
            <td className="border px-2 py-2 text-right tabular-nums text-base">{formatWon(quote.totalFinal)}</td>
            <td className="border px-2 py-2 text-right tabular-nums text-xs">{formatWon(quote.totalRoundOff)}</td>
            <td className="border px-2 py-2 text-xs font-normal">절삭</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

// ============================================
// 인쇄 전용 페이지: 공종별 요약 + 세부
// ============================================
function PrintWorkSummary({ quote, linesByType, ppy }) {
  const usedTypes = WORK_TYPES.filter((w) => linesByType.get(w.key).length > 0);
  return (
    <>
      {/* 요약 */}
      <section className="hidden print:block" style={{ pageBreakAfter: 'always' }}>
        <div className="text-sm mb-3">{quote.projectName}</div>
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1.5 w-10">No.</th>
              <th className="border px-2 py-1.5 text-left">공 종</th>
              <th className="border px-2 py-1.5 w-32">규 격</th>
              <th className="border px-2 py-1.5 w-12">단위</th>
              <th className="border px-2 py-1.5 w-16">수량</th>
              <th className="border px-2 py-1.5 w-32 text-right">재료비</th>
              <th className="border px-2 py-1.5 w-32 text-right">노무비</th>
              <th className="border px-2 py-1.5 w-32 text-right">경비</th>
              <th className="border px-2 py-1.5 w-36 text-right">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-bold bg-gray-50"><td colSpan={9} className="border px-2 py-1.5">A. 직접공사비 [ INTERIOR WORK ] / 실내인테리어</td></tr>
            {usedTypes.map((w, i) => {
              const lines = linesByType.get(w.key);
              const m = lines.reduce((s, l) => s + Number(l.materialCost), 0);
              const lc = lines.reduce((s, l) => s + Number(l.laborCost), 0);
              const e = lines.reduce((s, l) => s + Number(l.expenseCost), 0);
              return (
                <tr key={w.key}>
                  <td className="border px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border px-2 py-1.5">{w.label}</td>
                  <td className="border px-2 py-1.5"></td>
                  <td className="border px-2 py-1.5 text-center">식</td>
                  <td className="border px-2 py-1.5 text-right">1.00</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{m > 0 ? formatWon(m) : '-'}</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{lc > 0 ? formatWon(lc) : '-'}</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{e > 0 ? formatWon(e) : '-'}</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(m + lc + e)}</td>
                </tr>
              );
            })}
            {ppy && (
              <tr className="bg-emerald-50">
                <td colSpan={8} className="border px-2 py-1.5 text-right text-rose-600">인테리어공사 총계 (평당: {formatWon(ppy)}원)</td>
                <td className="border px-2 py-1.5 text-right tabular-nums font-bold">{formatWon(quote.totalDirect)}</td>
              </tr>
            )}
            <tr className="bg-emerald-100 font-bold">
              <td className="border px-2 py-1.5">　</td>
              <td className="border px-2 py-1.5">직접공사비 계</td>
              <td colSpan={3} className="border px-2 py-1.5"></td>
              <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(quote.totalDirectMaterial)}</td>
              <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(quote.totalDirectLabor)}</td>
              <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(quote.totalDirectExpense)}</td>
              <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(quote.totalDirect)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 세부 */}
      <section className="hidden print:block">
        {usedTypes.map((w, i) => {
          const lines = linesByType.get(w.key);
          const subtotal = lines.reduce((s, l) =>
            s + Number(l.materialCost) + Number(l.laborCost) + Number(l.expenseCost), 0);
          return (
            <div key={w.key} style={{ pageBreakInside: 'avoid', marginBottom: '14mm' }}>
              <div className="font-bold text-sm mb-2">{i + 1}. [{w.label}]</div>
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-1.5 py-1 text-left">항목</th>
                    <th className="border px-1.5 py-1 text-left w-32">규격</th>
                    <th className="border px-1.5 py-1 w-10">단위</th>
                    <th className="border px-1.5 py-1 w-12">수량</th>
                    <th className="border px-1.5 py-1 w-20 text-right">재료단가</th>
                    <th className="border px-1.5 py-1 w-24 text-right">재료금액</th>
                    <th className="border px-1.5 py-1 w-20 text-right">노무단가</th>
                    <th className="border px-1.5 py-1 w-24 text-right">노무금액</th>
                    <th className="border px-1.5 py-1 w-20 text-right">경비단가</th>
                    <th className="border px-1.5 py-1 w-24 text-right">경비금액</th>
                    <th className="border px-1.5 py-1 w-24 text-right">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="border px-1.5 py-1">{l.itemName}</td>
                      <td className="border px-1.5 py-1">{l.spec}</td>
                      <td className="border px-1.5 py-1 text-center">{l.unit}</td>
                      <td className="border px-1.5 py-1 text-right">{Number(l.quantity).toLocaleString('ko-KR')}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.materialUnitPrice) > 0 ? formatWon(l.materialUnitPrice) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.materialCost) > 0 ? formatWon(l.materialCost) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.laborUnitPrice) > 0 ? formatWon(l.laborUnitPrice) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.laborCost) > 0 ? formatWon(l.laborCost) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.expenseUnitPrice) > 0 ? formatWon(l.expenseUnitPrice) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{Number(l.expenseCost) > 0 ? formatWon(l.expenseCost) : '-'}</td>
                      <td className="border px-1.5 py-1 text-right tabular-nums">{formatWon(Number(l.materialCost) + Number(l.laborCost) + Number(l.expenseCost))}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 font-semibold">
                    <td colSpan={5} className="border px-1.5 py-1">소 계</td>
                    <td className="border px-1.5 py-1 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.materialCost), 0))}</td>
                    <td className="border px-1.5 py-1"></td>
                    <td className="border px-1.5 py-1 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.laborCost), 0))}</td>
                    <td className="border px-1.5 py-1"></td>
                    <td className="border px-1.5 py-1 text-right tabular-nums">{formatWon(lines.reduce((s, l) => s + Number(l.expenseCost), 0))}</td>
                    <td className="border px-1.5 py-1 text-right tabular-nums">{formatWon(subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
    </>
  );
}
