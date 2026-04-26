import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi, EXPENSE_TYPE_META, EXPENSE_TYPE_KEYS,
  PAYMENT_METHOD_META, PAYMENT_METHOD_KEYS,
} from '../api/expenses';
import { accountCodesApi, accountColor } from '../api/accountCodes';
import { expenseRulesApi } from '../api/expenseRules';
import { projectsApi } from '../api/projects';
import { formatWon } from '../api/quotes';
import { toCSV, parseCSV, downloadFile, readFileAsText } from '../utils/csv';
import VendorAutocomplete from '../components/VendorAutocomplete';

const VIEW_LIST    = 'list';
const VIEW_PROJECT = 'project';
const VIEW_VENDOR  = 'vendor';
const VIEW_PNL     = 'pnl';

export default function Expenses() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || 'ALL';
  const queryClient = useQueryClient();

  const [accountCodes, setAccountCodes] = useState([]);
  const [view, setView] = useState(VIEW_LIST);
  const [filters, setFilters] = useState({
    projectId: initialProjectId,
    accountCodeId: 'ALL',
    accountGroup: 'ALL',
    type: 'EXPENSE', // 기본 지출만
    dateFrom: '',
    dateTo: '',
    q: '',
  });
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const queryParams = useMemo(() => {
    const p = {};
    if (filters.projectId !== 'ALL') p.projectId = filters.projectId;
    if (filters.accountCodeId !== 'ALL') p.accountCodeId = filters.accountCodeId;
    if (filters.accountGroup !== 'ALL') p.accountGroup = filters.accountGroup;
    if (filters.type !== 'ALL') p.type = filters.type;
    if (filters.dateFrom) p.dateFrom = filters.dateFrom;
    if (filters.dateTo) p.dateTo = filters.dateTo;
    if (filters.q.trim()) p.q = filters.q.trim();
    return p;
  }, [filters]);

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['expenses', 'list', queryParams],
    queryFn: () => expensesApi.list(queryParams),
  });
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['expenses', 'summary'],
    queryFn: () => expensesApi.summary(),
  });
  const expenses = listData?.expenses || [];
  const loading = listLoading || summaryLoading;

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list', {}],
    queryFn: () => projectsApi.list(),
  });
  const projects = projectsData?.projects || [];

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['expenses'] });
  }

  useEffect(() => {
    accountCodesApi.list().then((r) => setAccountCodes(r.codes || []));
  }, []);

  const totalFiltered = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  );

  const accountGroups = useMemo(() => {
    const set = new Set();
    for (const c of accountCodes) if (c.groupName) set.add(c.groupName);
    return [...set];
  }, [accountCodes]);

  function handleExport() {
    if (expenses.length === 0) {
      alert('내보낼 거래가 없습니다');
      return;
    }
    const header = ['날짜', '종류', '프로젝트', '계정과목', '공종', '거래처', '내역', '금액', '결제수단'];
    const rows = [header];
    for (const e of expenses) {
      rows.push([
        e.date ? String(e.date).slice(0, 10) : '',
        EXPENSE_TYPE_META[e.type]?.label || e.type,
        e.project?.name || '(미지정)',
        e.accountCode?.code || '',
        e.workCategory || '',
        e.vendor || '',
        e.description || '',
        Number(e.amount),
        PAYMENT_METHOD_META[e.paymentMethod]?.label || '',
      ]);
    }
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(`suplex_expenses_${today}.csv`, toCSV(rows));
  }

  async function handleImportFile(file) {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      if (rows.length < 2) { alert('CSV에 데이터가 없습니다'); return; }
      setImporting({ rows, projects, accountCodes });
    } catch (e) {
      alert('파일 읽기 실패: ' + e.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-800">지출관리</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExport} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50">📥 CSV 내보내기 ({expenses.length})</button>
          <button onClick={() => fileInputRef.current?.click()} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50">📤 CSV 가져오기</button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(e) => handleImportFile(e.target.files?.[0])} className="hidden" />
          <button onClick={() => setAdding(true)} className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md">+ 거래 추가</button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="이번 달 지출" total={summary.thisMonth.total} count={summary.thisMonth.count} highlight />
          <SummaryCard label="전월 지출" total={summary.prevMonth.total} count={summary.prevMonth.count}
            sub={diffLabel(summary.thisMonth.total, summary.prevMonth.total)} />
          <SummaryCard label="이번 달 매출" total={summary.thisMonthIncome.total} count={summary.thisMonthIncome.count} income />
          <SummaryCard label="누적 지출" total={summary.allTime.total} count={summary.allTime.count} />
        </div>
      )}

      {summary?.byGroup && summary.byGroup.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-2">계정 그룹별 누적 지출</div>
          <div className="flex gap-2 flex-wrap">
            {summary.byGroup.map((g) => (
              <button
                key={g.group_name || 'none'}
                onClick={() => setFilters({ ...filters, accountGroup: g.group_name || 'ALL' })}
                className={`text-xs px-3 py-1.5 rounded-full border ${accountColor(g.group_name)}`}
              >
                {g.group_name || '(미지정)'} <span className="font-semibold ml-1">{formatWon(g.total)}원</span>
                <span className="ml-1 opacity-70">({g.count}건)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex border-b text-sm">
          <ViewTab active={view === VIEW_LIST}    onClick={() => setView(VIEW_LIST)}    label="📋 리스트" />
          <ViewTab active={view === VIEW_PROJECT} onClick={() => setView(VIEW_PROJECT)} label="🏗️ 프로젝트별" />
          <ViewTab active={view === VIEW_VENDOR}  onClick={() => setView(VIEW_VENDOR)}  label="🏢 거래처별" />
          <ViewTab active={view === VIEW_PNL}     onClick={() => setView(VIEW_PNL)}     label="💰 프로젝트 손익" />
        </div>

        {view !== VIEW_PNL && (
          <FilterBar
            projects={projects}
            accountCodes={accountCodes}
            accountGroups={accountGroups}
            filters={filters}
            onChange={setFilters}
          />
        )}

        <div className="border-t">
          {loading && <div className="p-6 text-sm text-gray-400">불러오는 중...</div>}
          {!loading && view === VIEW_LIST && (
            <ListView
              expenses={expenses}
              total={totalFiltered}
              onEdit={setEditing}
              onRemove={async (id) => {
                if (!confirm('이 거래를 삭제할까요?')) return;
                await expensesApi.remove(id);
                reload();
              }}
            />
          )}
          {!loading && view === VIEW_PROJECT && (
            <GroupedView expenses={expenses} groupBy="project" />
          )}
          {!loading && view === VIEW_VENDOR && (
            <GroupedView expenses={expenses} groupBy="vendor" />
          )}
          {!loading && view === VIEW_PNL && summary && (
            <PnLTable pnl={summary.pnl} onChanged={reload} />
          )}
        </div>
      </div>

      {(adding || editing) && (
        <ExpenseModal
          expense={editing}
          projects={projects}
          accountCodes={accountCodes}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); reload(); }}
        />
      )}
      {importing && (
        <ImportModal
          rows={importing.rows}
          projects={importing.projects}
          accountCodes={importing.accountCodes}
          onClose={() => setImporting(false)}
          onSaved={() => { setImporting(false); reload(); }}
        />
      )}
    </div>
  );
}

function diffLabel(thisV, prev) {
  if (!prev) return '';
  const diff = thisV - prev;
  const pct = Math.round((diff / prev) * 100);
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${formatWon(diff)} (${sign}${pct}%)`;
}

function SummaryCard({ label, total, count, sub, highlight, income }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${
      highlight ? 'border-navy-400 ring-1 ring-navy-100' :
      income ? 'border-emerald-300 ring-1 ring-emerald-100' : ''
    }`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-1 ${income ? 'text-emerald-700' : 'text-navy-800'}`}>
        {formatWon(total)}<span className="text-xs text-gray-400 font-normal ml-1">원</span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{count}건{sub && <span className="ml-2">· {sub}</span>}</div>
    </div>
  );
}

function ViewTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium border-b-2 ${
        active ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-navy-700'
      }`}
    >
      {label}
    </button>
  );
}

function FilterBar({ projects, accountCodes, accountGroups, filters, onChange }) {
  function set(k, v) { onChange({ ...filters, [k]: v }); }
  return (
    <div className="px-4 py-3 bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
      <select value={filters.projectId} onChange={(e) => set('projectId', e.target.value)} className="px-2 py-1.5 border rounded bg-white">
        <option value="ALL">모든 프로젝트</option>
        <option value="NONE">현장 미지정 (본사/대표)</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={filters.type} onChange={(e) => set('type', e.target.value)} className="px-2 py-1.5 border rounded bg-white">
        <option value="ALL">모든 거래</option>
        {EXPENSE_TYPE_KEYS.map((k) => <option key={k} value={k}>{EXPENSE_TYPE_META[k].label}만</option>)}
      </select>
      <select value={filters.accountGroup} onChange={(e) => set('accountGroup', e.target.value)} className="px-2 py-1.5 border rounded bg-white">
        <option value="ALL">모든 계정 그룹</option>
        {accountGroups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <select value={filters.accountCodeId} onChange={(e) => set('accountCodeId', e.target.value)} className="px-2 py-1.5 border rounded bg-white">
        <option value="ALL">모든 계정과목</option>
        <option value="NONE">계정 미지정</option>
        {accountCodes
          .filter((c) => filters.accountGroup === 'ALL' || c.groupName === filters.accountGroup)
          .map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
      <input type="date" value={filters.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} className="px-2 py-1.5 border rounded bg-white" />
      <input type="date" value={filters.dateTo} onChange={(e) => set('dateTo', e.target.value)} className="px-2 py-1.5 border rounded bg-white" />
      <input type="text" value={filters.q} onChange={(e) => set('q', e.target.value)} placeholder="검색 (내역·거래처)" className="md:col-span-2 px-2 py-1.5 border rounded bg-white" />
    </div>
  );
}

function ListView({ expenses, total, onEdit, onRemove }) {
  if (expenses.length === 0) {
    return <div className="p-12 text-center text-sm text-gray-400">조건에 맞는 거래가 없습니다.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th className="text-left px-3 py-2 w-24">날짜</th>
            <th className="text-left px-3 py-2 w-16">종류</th>
            <th className="text-left px-3 py-2 w-36">프로젝트</th>
            <th className="text-left px-3 py-2 w-44">계정과목</th>
            <th className="text-left px-3 py-2 w-28">공종</th>
            <th className="text-left px-3 py-2">내역</th>
            <th className="text-right px-3 py-2 w-32">금액</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {expenses.map((e) => {
            const t = EXPENSE_TYPE_META[e.type] || EXPENSE_TYPE_META.EXPENSE;
            return (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 tabular-nums text-gray-600 text-xs">{String(e.date).slice(0, 10)}</td>
                <td className="px-3 py-1.5"><span className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded border ${t.color}`}>{t.label}</span></td>
                <td className="px-3 py-1.5">
                  {e.project ? (
                    <Link to={`/projects/${e.project.id}/expenses`} className="text-navy-700 hover:underline text-xs">{e.project.name}</Link>
                  ) : <span className="text-gray-400 text-xs">미지정</span>}
                </td>
                <td className="px-3 py-1.5 text-xs">
                  {e.accountCode ? (
                    <span className={`px-1.5 py-0.5 rounded ${accountColor(e.accountCode.groupName)}`}>{e.accountCode.code}</span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-1.5 text-xs text-gray-600">{e.workCategory || ''}</td>
                <td className="px-3 py-1.5">
                  <button onClick={() => onEdit(e)} className="text-navy-800 hover:underline text-left text-xs">{e.description || e.vendor || <span className="text-gray-400">(설명 없음)</span>}</button>
                </td>
                <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${e.type === 'INCOME' ? 'text-emerald-700' : ''}`}>
                  {e.type === 'INCOME' ? '+' : e.type === 'TRANSFER' ? '↔' : ''}{formatWon(e.amount)}
                </td>
                <td className="px-3 py-1.5 text-center">
                  <button onClick={() => onRemove(e.id)} className="text-gray-300 hover:text-rose-500 text-xs" title="삭제">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 font-semibold text-navy-800">
          <tr>
            <td colSpan={6} className="px-3 py-2.5">필터 합계 ({expenses.length}건)</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function GroupedView({ expenses, groupBy }) {
  const groups = useMemo(() => {
    const m = new Map();
    for (const e of expenses) {
      const key = groupBy === 'project'
        ? (e.project?.name || '(현장 미지정)')
        : (e.vendor || e.description || '(거래처 미입력)');
      if (!m.has(key)) m.set(key, { items: [], total: 0 });
      m.get(key).items.push(e);
      m.get(key).total += Number(e.amount || 0);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [expenses, groupBy]);

  if (groups.length === 0) {
    return <div className="p-12 text-center text-sm text-gray-400">조건에 맞는 거래가 없습니다.</div>;
  }

  return (
    <div className="divide-y">
      {groups.map(([key, g]) => (
        <details key={key} className="px-4 py-3" open>
          <summary className="flex items-center justify-between cursor-pointer">
            <div className="font-semibold text-navy-800">{key} <span className="text-xs text-gray-500 font-normal ml-2">{g.items.length}건</span></div>
            <div className="tabular-nums text-navy-800 font-medium">{formatWon(g.total)} 원</div>
          </summary>
          <table className="w-full text-xs mt-2">
            <tbody>
              {g.items.map((e) => (
                <tr key={e.id} className="border-b last:border-b-0">
                  <td className="py-1 w-24 text-gray-500 tabular-nums">{String(e.date).slice(0, 10)}</td>
                  <td className="py-1 w-32"><span className={`px-1.5 py-0.5 rounded ${accountColor(e.accountCode?.groupName)}`}>{e.accountCode?.code || '미분류'}</span></td>
                  <td className="py-1 text-gray-700">{e.description || e.vendor || ''}</td>
                  <td className="py-1 text-right tabular-nums w-28">{formatWon(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
    </div>
  );
}

function PnLTable({ pnl, onChanged }) {
  const sumContract = pnl.reduce((s, p) => s + Number(p.contractAmount || 0), 0);
  const sumExpense = pnl.reduce((s, p) => s + Number(p.totalExpense || 0), 0);
  const sumProfit = sumContract - sumExpense;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">현장명</th>
            <th className="text-left px-3 py-2 w-24">코드</th>
            <th className="text-left px-3 py-2 w-20">상태</th>
            <th className="text-right px-3 py-2 w-36">계약 금액 <span className="text-gray-400 font-normal">✏️</span></th>
            <th className="text-right px-3 py-2 w-32">총 지출</th>
            <th className="text-right px-3 py-2 w-32">수익</th>
            <th className="text-right px-3 py-2 w-20">수익률</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pnl.map((p) => {
            const profitColor = p.profit >= 0 ? 'text-emerald-700' : 'text-rose-600';
            return (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link to={`/projects/${p.id}/expenses`} className="text-navy-700 hover:underline">{p.name}</Link>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 font-mono">{p.siteCode || ''}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{p.status}</td>
                <td className="px-3 py-2">
                  <ContractAmountCell project={p} onSaved={onChanged} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatWon(p.totalExpense)}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${profitColor}`}>
                  {p.contractAmount > 0 ? formatWon(p.profit) : <span className="text-gray-300">—</span>}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${profitColor}`}>
                  {p.margin != null ? `${p.margin.toFixed(1)}%` : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            );
          })}
          {pnl.length === 0 && (
            <tr><td colSpan={7} className="text-center py-8 text-gray-400">프로젝트가 없습니다.</td></tr>
          )}
        </tbody>
        {pnl.length > 0 && (
          <tfoot className="bg-gray-50 font-semibold text-navy-800">
            <tr>
              <td colSpan={3} className="px-3 py-2.5">합계 ({pnl.length}개)</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(sumContract)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(sumExpense)}</td>
              <td className={`px-3 py-2.5 text-right tabular-nums ${sumProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatWon(sumProfit)}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function ContractAmountCell({ project, onSaved }) {
  const [value, setValue] = useState(project.contractAmount > 0 ? formatWon(project.contractAmount) : '');
  const [busy, setBusy] = useState(false);

  // 외부 prop이 바뀌면 동기화
  useEffect(() => {
    setValue(project.contractAmount > 0 ? formatWon(project.contractAmount) : '');
  }, [project.contractAmount, project.id]);

  async function save() {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const newAmount = cleaned === '' ? null : Number(cleaned);
    const oldAmount = project.contractAmount > 0 ? Number(project.contractAmount) : null;
    if (newAmount === oldAmount) {
      setValue(newAmount ? formatWon(newAmount) : '');
      return;
    }
    if (newAmount != null && (!Number.isFinite(newAmount) || newAmount < 0)) {
      setValue(oldAmount ? formatWon(oldAmount) : '');
      alert('숫자만 입력 가능');
      return;
    }
    setBusy(true);
    try {
      await projectsApi.update(project.id, { contractAmount: newAmount });
      onSaved?.();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
      setValue(oldAmount ? formatWon(oldAmount) : '');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        disabled={busy}
        placeholder="—"
        className="w-full text-right tabular-nums px-2 py-1 border border-transparent hover:border-gray-300 focus:border-navy-700 rounded outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />
      {busy && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs sm:text-[10px] text-gray-400">저장중</span>
      )}
    </div>
  );
}

// ============================================
// 거래 추가/편집 모달
// ============================================
function ExpenseModal({ expense, projects, accountCodes, onClose, onSaved }) {
  const isNew = !expense;
  const [form, setForm] = useState(() => ({
    projectId: expense?.projectId || '',
    type: expense?.type || 'EXPENSE',
    date: expense?.date ? String(expense.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    amount: expense?.amount != null ? String(expense.amount) : '',
    accountCodeId: expense?.accountCodeId || '',
    workCategory: expense?.workCategory || '',
    vendor: expense?.vendor || '',
    vendorId: expense?.vendorEntity?.id || expense?.vendorId || null,
    description: expense?.description || '',
    paymentMethod: expense?.paymentMethod || '',
  }));
  const [busy, setBusy] = useState(false);
  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.amount || isNaN(Number(form.amount))) { alert('금액을 입력해주세요'); return; }
    if (!form.date) { alert('날짜를 입력해주세요'); return; }
    setBusy(true);
    try {
      const payload = {
        projectId: form.projectId || null,
        type: form.type,
        date: form.date,
        amount: Number(form.amount),
        accountCodeId: form.accountCodeId || null,
        workCategory: form.workCategory.trim() || null,
        vendor: form.vendor.trim() || null,
        vendorId: form.vendorId || null,
        description: form.description.trim() || null,
        paymentMethod: form.paymentMethod || null,
      };
      if (isNew) await expensesApi.create(payload);
      else await expensesApi.update(expense.id, payload);
      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">{isNew ? '거래 추가' : '거래 편집'}</h2>
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
              <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="50000" className="input" />
            </Field>
          </div>
          <Field label="프로젝트">
            <select value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className="input">
              <option value="">(현장 미지정 — 본사/대표)</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.siteCode && ` (${p.siteCode})`}</option>)}
            </select>
          </Field>
          <Field label="계정과목">
            <select value={form.accountCodeId} onChange={(e) => set('accountCodeId', e.target.value)} className="input">
              <option value="">(미분류)</option>
              {accountCodes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="공종 (선택)">
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
              placeholder="OO자재상사 — 등록된 협력업체 선택 또는 직접 입력"
              category={form.workCategory || undefined}
            />
          </Field>
          <Field label="내역(적요)">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="장판 자재 입금" className="input resize-y" />
          </Field>
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

// ============================================
// CSV 가져오기 (자동분류 적용)
// ============================================
function ImportModal({ rows, projects, accountCodes, onClose, onSaved }) {
  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const guess = (names) => {
    for (let i = 0; i < header.length; i++) {
      const h = header[i];
      if (names.some((n) => h.includes(n))) return i;
    }
    return -1;
  };
  const [mapping, setMapping] = useState({
    date:        guess(['일자', '날짜', 'Date']),
    amount:      guess(['금액', '출금', '지출', 'Amount', '출금액']),
    inAmt:       guess(['입금', '입금액']),
    vendor:      guess(['거래처', '받는']),
    description: guess(['내용', '메모', '적요', '비고']),
  });

  const [perRow, setPerRow] = useState(() =>
    dataRows.map(() => ({ projectId: '', accountCodeId: '', workCategory: '', type: 'EXPENSE', skip: false }))
  );
  const [classifying, setClassifying] = useState(false);
  const [busy, setBusy] = useState(false);

  // 자동분류 (룰 적용 — 클릭 트리거)
  async function autoClassify() {
    setClassifying(true);
    try {
      const texts = dataRows.map((r) => {
        const desc = mapping.description >= 0 ? (r[mapping.description] || '') : '';
        const vendor = mapping.vendor >= 0 ? (r[mapping.vendor] || '') : '';
        return [desc, vendor].filter(Boolean).join(' ');
      });
      const { results } = await expenseRulesApi.classify(texts);
      // siteCode → projectId 매핑
      const siteToProject = {};
      for (const p of projects) if (p.siteCode) siteToProject[p.siteCode] = p.id;
      setPerRow((prev) => prev.map((r, i) => {
        const g = results[i];
        if (!g) return r;
        return {
          ...r,
          projectId: r.projectId || siteToProject[g.siteCode] || '',
          accountCodeId: r.accountCodeId || g.accountCodeId || '',
          workCategory: r.workCategory || g.workCategory || '',
        };
      }));
    } catch (e) {
      alert('자동분류 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setClassifying(false);
    }
  }

  function setRow(i, k, v) {
    setPerRow((arr) => arr.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }
  function bulkSetAcct(id) {
    setPerRow((arr) => arr.map((r) => r.skip ? r : { ...r, accountCodeId: id }));
  }
  function bulkSetProject(pid) {
    setPerRow((arr) => arr.map((r) => r.skip ? r : { ...r, projectId: pid }));
  }

  function getCellNum(row, idx) {
    if (idx < 0) return null;
    const v = row[idx];
    if (!v) return null;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  function getCell(row, idx) {
    if (idx < 0) return '';
    return (row[idx] || '').trim();
  }

  async function save() {
    const items = [];
    for (let i = 0; i < dataRows.length; i++) {
      if (perRow[i].skip) continue;
      const r = dataRows[i];
      const outAmt = getCellNum(r, mapping.amount);
      const inAmt = getCellNum(r, mapping.inAmt);
      const amount = Math.max(Math.abs(outAmt || 0), Math.abs(inAmt || 0));
      if (amount === 0) continue;
      const dateRaw = getCell(r, mapping.date);
      const date = dateRaw.replace(/[./]/g, '-').slice(0, 10);
      items.push({
        projectId: perRow[i].projectId || null,
        type: inAmt && inAmt > 0 ? 'INCOME' : (perRow[i].type || 'EXPENSE'),
        date,
        amount,
        vendor: getCell(r, mapping.vendor) || null,
        accountCodeId: perRow[i].accountCodeId || null,
        workCategory: perRow[i].workCategory || null,
        description: getCell(r, mapping.description) || null,
        importedFrom: '통장 CSV',
        rawText: r.join(' | '),
      });
    }
    if (items.length === 0) { alert('가져올 행이 없습니다'); return; }
    if (!confirm(`${items.length}건을 추가합니다. 계속할까요?`)) return;
    setBusy(true);
    try {
      const { created } = await expensesApi.bulk(items);
      alert(`✅ ${created}건 추가됨`);
      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">CSV 가져오기 — {dataRows.length}행</h2>
          <div className="text-xs text-gray-500 mt-1">컬럼 매핑 자동 추측됨. "🔮 자동분류" 클릭하면 키워드 룰 적용.</div>
        </div>

        <div className="px-6 py-3 border-b bg-gray-50 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {[
            ['date', '날짜'], ['amount', '출금액'], ['inAmt', '입금액'], ['vendor', '거래처'], ['description', '내역'],
          ].map(([k, label]) => (
            <div key={k}>
              <div className="text-gray-500 mb-0.5">{label} 컬럼</div>
              <select
                value={mapping[k]}
                onChange={(e) => setMapping((m) => ({ ...m, [k]: Number(e.target.value) }))}
                className="w-full text-xs border rounded px-2 py-1 bg-white"
              >
                <option value={-1}>(없음)</option>
                {header.map((h, i) => <option key={i} value={i}>{h || `컬럼 ${i + 1}`}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="px-6 py-2 border-b bg-amber-50 text-xs flex items-center gap-2 flex-wrap">
          <button
            onClick={autoClassify}
            disabled={classifying}
            className="text-xs px-3 py-1 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-50"
          >
            {classifying ? '분류 중...' : '🔮 자동분류 적용'}
          </button>
          <span className="text-gray-600 ml-2">일괄 적용:</span>
          <select onChange={(e) => bulkSetProject(e.target.value)} className="text-xs border rounded px-2 py-1 bg-white" defaultValue="">
            <option value="" disabled>모든 행 → 프로젝트</option>
            <option value="">(현장 미지정)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select onChange={(e) => bulkSetAcct(e.target.value)} className="text-xs border rounded px-2 py-1 bg-white" defaultValue="">
            <option value="" disabled>모든 행 → 계정과목</option>
            {accountCodes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 w-10">스킵</th>
                <th className="text-left px-2 py-1.5 w-20">날짜</th>
                <th className="text-right px-2 py-1.5 w-24">금액</th>
                <th className="text-left px-2 py-1.5">내역</th>
                <th className="px-2 py-1.5 w-44">프로젝트</th>
                <th className="px-2 py-1.5 w-44">계정과목</th>
                <th className="px-2 py-1.5 w-24">공종</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dataRows.map((r, i) => {
                const out = getCellNum(r, mapping.amount);
                const inn = getCellNum(r, mapping.inAmt);
                const amt = Math.max(Math.abs(out || 0), Math.abs(inn || 0));
                const dateRaw = getCell(r, mapping.date);
                const skipped = perRow[i].skip;
                const isIncome = inn && inn > 0;
                return (
                  <tr key={i} className={skipped ? 'opacity-40' : 'hover:bg-gray-50'}>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" checked={skipped} onChange={(e) => setRow(i, 'skip', e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">{dateRaw}</td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {amt ? <span className={isIncome ? 'text-emerald-700' : ''}>{isIncome && '+'}{formatWon(amt)}</span> : <span className="text-rose-500">없음</span>}
                    </td>
                    <td className="px-2 py-1 text-gray-700 truncate max-w-xs">{getCell(r, mapping.description)} {getCell(r, mapping.vendor) && <span className="text-gray-400">· {getCell(r, mapping.vendor)}</span>}</td>
                    <td className="px-2 py-1">
                      <select value={perRow[i].projectId} onChange={(e) => setRow(i, 'projectId', e.target.value)} disabled={skipped} className="w-full text-xs border rounded px-1 py-0.5">
                        <option value="">(미지정)</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select value={perRow[i].accountCodeId} onChange={(e) => setRow(i, 'accountCodeId', e.target.value)} disabled={skipped} className="w-full text-xs border rounded px-1 py-0.5">
                        <option value="">(미분류)</option>
                        {accountCodes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input value={perRow[i].workCategory} onChange={(e) => setRow(i, 'workCategory', e.target.value)} disabled={skipped} className="w-full text-xs border rounded px-1 py-0.5" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">취소</button>
          <button onClick={save} disabled={busy} className="text-sm px-5 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50">
            {busy ? '저장 중...' : `${dataRows.filter((_, i) => !perRow[i].skip).length}건 가져오기`}
          </button>
        </div>
        <ModalStyles />
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</span>
      {children}
    </label>
  );
}

function ModalStyles() {
  return (
    <style>{`
      .input {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
      }
      .input:focus {
        border-color: #1e3a66;
        box-shadow: 0 0 0 2px rgba(30, 58, 102, 0.15);
      }
    `}</style>
  );
}
