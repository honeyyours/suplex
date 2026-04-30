// 프로젝트 정산 탭 — 공정별 정산 메모 + 견적 vs 실지출 자동 비교
// ★ 핵심 사이클: 견적 → 발주 → 지출 → 공정별 분석 → 정산 메모 → 다음 견적 prefill
//
// 공정별 한 줄 행: [공정명 · 견적 합계 · 실지출 합계 · 차액(±%) · 메모 input]
// 메모는 onBlur 자동 저장 (upsert). 빈 메모로 끝나도 상관 없음.
// 회사 누적 정산 노트는 견적 가이드 드로어(QuoteGuideDrawer)에서 별도 표시.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { settlementApi } from '../api/settlement';
import { simpleQuotesApi } from '../api/simpleQuotes';
import { expensesApi } from '../api/expenses';
import { STANDARD_PHASES, normalizePhase } from '../utils/phases';
import { formatWon } from '../api/quotes';

export default function ProjectSettlement() {
  const { id: projectId } = useParams();

  // 정산 노트 (저장된 메모)
  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ['settlement', 'notes', projectId],
    queryFn: () => settlementApi.list(projectId),
  });
  const savedNotes = useMemo(() => {
    const m = new Map();
    for (const n of (notesData?.notes || [])) m.set(n.phase, n.body || '');
    return m;
  }, [notesData]);

  // 견적 (활성/최신 ACCEPTED 우선)
  const { data: quotesData } = useQuery({
    queryKey: ['simpleQuotes', 'list', projectId],
    queryFn: () => simpleQuotesApi.list(projectId),
  });
  const primaryQuote = useMemo(() => {
    const list = quotesData?.quotes || [];
    return list.find((q) => q.status === 'ACCEPTED') || list[0] || null;
  }, [quotesData]);

  // 견적 라인을 공정별 합계로 집계 (간편 견적 lines)
  const quoteByPhase = useMemo(() => {
    const m = new Map();
    if (!primaryQuote?.lines) return m;
    let currentPhase = null;
    for (const l of primaryQuote.lines) {
      if (l.isGroup && !l.isGroupEnd) {
        const p = normalizePhase(l.itemName);
        currentPhase = p?.label || null;
        continue;
      }
      if (l.isGroup && l.isGroupEnd) { currentPhase = null; continue; }
      if (!l.isGroup) {
        const phase = currentPhase || (normalizePhase(l.itemName)?.label || '기타');
        const total = (Number(l.materialPrice || 0) + Number(l.laborPrice || 0) + Number(l.expensePrice || 0)) * Number(l.quantity || 1);
        m.set(phase, (m.get(phase) || 0) + total);
      }
    }
    return m;
  }, [primaryQuote]);

  // 실지출 — 프로젝트 거래 전체 (workCategory별 합계)
  const { data: expensesData } = useQuery({
    queryKey: ['expenses', 'list', { projectId, type: 'EXPENSE' }],
    queryFn: () => expensesApi.list({ projectId, type: 'EXPENSE' }),
  });
  const expenseByPhase = useMemo(() => {
    const m = new Map();
    for (const e of (expensesData?.expenses || [])) {
      const p = normalizePhase(e.workCategory)?.label || '기타';
      m.set(p, (m.get(p) || 0) + Number(e.amount || 0));
    }
    return m;
  }, [expensesData]);

  // 표시할 공정 = 견적 또는 지출에 등장한 공정 + 표준 25개 (빈 행도 메모 작성 가능)
  const phaseRows = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const p of STANDARD_PHASES) {
      if (p.key === 'OTHER') continue;
      const label = p.label;
      const quote = quoteByPhase.get(label) || 0;
      const actual = expenseByPhase.get(label) || 0;
      const note = savedNotes.get(label) || '';
      // 모든 표준 공정 노출 (메모 작성 가능)
      rows.push({ phase: label, quote, actual, note });
      seen.add(label);
    }
    // 표준 외 공정 (있으면)
    for (const [phase, val] of [...quoteByPhase.entries(), ...expenseByPhase.entries()]) {
      if (!seen.has(phase)) {
        rows.push({
          phase,
          quote: quoteByPhase.get(phase) || 0,
          actual: expenseByPhase.get(phase) || 0,
          note: savedNotes.get(phase) || '',
        });
        seen.add(phase);
      }
    }
    return rows;
  }, [quoteByPhase, expenseByPhase, savedNotes]);

  const totals = useMemo(() => {
    const quote = phaseRows.reduce((s, r) => s + r.quote, 0);
    const actual = phaseRows.reduce((s, r) => s + r.actual, 0);
    return { quote, actual, diff: quote - actual };
  }, [phaseRows]);

  return (
    <div className="space-y-4">
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-sm font-bold text-violet-900">📊 정산 — 견적 vs 실지출</span>
          <span className="text-xs text-violet-700">
            공정별 메모는 <b>견적 가이드</b>에 누적되어 다음 견적 작성 시 자동으로 보입니다 (★ 핵심 사이클)
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
          <SummaryBox label="견적 합계" value={totals.quote} />
          <SummaryBox label="실지출 합계" value={totals.actual} />
          <SummaryBox label="차액 (견적 - 실지출)" value={totals.diff} highlight />
        </div>
        {!primaryQuote && (
          <div className="mt-2 text-xs text-amber-700">⚠ 활성 견적이 없습니다. 견적 합계는 0으로 표시됩니다.</div>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="text-left px-3 py-2 w-32">공정</th>
              <th className="text-right px-3 py-2 w-32">견적 합계</th>
              <th className="text-right px-3 py-2 w-32">실지출</th>
              <th className="text-right px-3 py-2 w-32">차액</th>
              <th className="text-left px-3 py-2">정산 메모 (자동 저장)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {phaseRows.map((r) => (
              <SettlementRow
                key={r.phase}
                projectId={projectId}
                phase={r.phase}
                quote={r.quote}
                actual={r.actual}
                initialNote={r.note}
                onSaved={refetchNotes}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, highlight }) {
  const cls = highlight
    ? (value >= 0 ? 'text-emerald-700' : 'text-rose-700')
    : 'text-navy-800';
  return (
    <div className="bg-white border rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold tabular-nums mt-1 ${cls}`}>
        {value >= 0 ? '+' : ''}{formatWon(value)}원
      </div>
    </div>
  );
}

function SettlementRow({ projectId, phase, quote, actual, initialNote, onSaved }) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNote(initialNote); }, [initialNote]);

  const diff = quote - actual;
  const ratio = quote > 0 ? Math.round((diff / quote) * 100) : null;

  async function commit() {
    if (note === initialNote) return;
    setSaving(true);
    try {
      await settlementApi.upsert(projectId, phase, note);
      onSaved?.();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  }

  const diffCls = diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-gray-400';
  const hasData = quote > 0 || actual > 0;

  return (
    <tr className={hasData ? 'hover:bg-gray-50' : 'opacity-60 hover:bg-gray-50'}>
      <td className="px-3 py-2 font-medium text-gray-800">{phase}</td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-700">{quote ? formatWon(quote) : '—'}</td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-700">{actual ? formatWon(actual) : '—'}</td>
      <td className={`px-3 py-2 text-right tabular-nums font-medium ${diffCls}`}>
        {hasData ? (
          <>
            {diff >= 0 ? '+' : ''}{formatWon(diff)}
            {ratio !== null && <span className="text-xs ml-1 opacity-70">({ratio >= 0 ? '+' : ''}{ratio}%)</span>}
          </>
        ) : '—'}
      </td>
      <td className="px-3 py-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commit}
          placeholder="예: 도배지는 ○○가 단가 좋음 / 다음 견적엔 마진 ↑ 권장"
          className="w-full text-xs border border-transparent hover:border-gray-300 focus:border-navy-400 rounded px-2 py-1 bg-transparent"
        />
        {saving && <span className="ml-2 text-xs text-gray-400">저장중…</span>}
      </td>
    </tr>
  );
}
