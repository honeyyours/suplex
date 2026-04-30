import { Fragment, memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
import { toCSV, downloadFile, detectCsvHeader, normalizeDate, readSpreadsheetFile } from '../utils/csv';
import VendorAutocomplete from '../components/VendorAutocomplete';
import InlineCombobox from '../components/InlineCombobox';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, F } from '../utils/features';

const VIEW_LIST    = 'list';
const VIEW_PROJECT = 'project';
const VIEW_VENDOR  = 'vendor';
const VIEW_PNL     = 'pnl';
const VIEW_RULES   = 'rules';

export default function Expenses() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || 'ALL';
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const canViewPnl = hasFeature(auth, F.EXPENSES_VIEW_PNL);

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
  // adding: 인라인 신규 입력 행 표시 토글 (모달 X)
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
  // 표시 행 제한 — fiber tree 부담 줄여 입력 lag 제거. 그 이상은 필터·검색으로 좁힘.
  const PAGE_SIZE = 50;
  const displayedExpenses = useMemo(() => expenses.slice(0, PAGE_SIZE), [expenses]);
  // 입력 우선순위 높이고 리스트 업데이트 deferred — 입력 중 cascade re-render 방지
  const deferredExpenses = useDeferredValue(displayedExpenses);
  const loading = listLoading || summaryLoading;

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list', {}],
    queryFn: () => projectsApi.list(),
  });
  const projects = projectsData?.projects || [];

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['expenses'] });
  }

  // 인라인 편집 — invalidate 대신 cache 직접 patch (입력 중 깜빡임 방지).
  // summary는 invalidate 안 함 — 다음 페이지 이동·필터 변경 시 자연 갱신.
  const handleInlinePatch = useCallback(async (id, patch) => {
    const { expense } = await expensesApi.update(id, patch);
    queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
      if (!old) return old;
      return {
        ...old,
        expenses: old.expenses.map((e) => e.id === id ? { ...e, ...expense } : e),
      };
    });
  }, [queryClient, queryParams]);

  const handleInlineRemove = useCallback(async (id) => {
    if (!confirm('이 거래를 삭제할까요?')) return;
    await expensesApi.remove(id);
    queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
      if (!old) return old;
      return { ...old, expenses: old.expenses.filter((e) => e.id !== id) };
    });
  }, [queryClient, queryParams]);

  const handleInlineBulkRemove = useCallback(async (ids) => {
    if (!confirm(`${ids.length}건을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await Promise.all(ids.map((id) => expensesApi.remove(id)));
    const idSet = new Set(ids);
    queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
      if (!old) return old;
      return { ...old, expenses: old.expenses.filter((e) => !idSet.has(e.id)) };
    });
  }, [queryClient, queryParams]);

  // 인라인 신규 거래 — optimistic update로 저장 즉시 UI 반영, 서버 응답은 백그라운드.
  // projects/accountCodes에서 join 정보 미리 채워 ListRow가 즉시 정상 표시.
  const handleAddSave = useCallback((payload) => {
    const tempId = '__temp_' + Date.now() + Math.random().toString(36).slice(2, 6);
    const proj = payload.projectId ? projects.find((p) => p.id === payload.projectId) : null;
    const ac = payload.accountCodeId ? accountCodes.find((c) => c.id === payload.accountCodeId) : null;
    const optimistic = {
      id: tempId,
      ...payload,
      project: proj ? { id: proj.id, name: proj.name, siteCode: proj.siteCode || null } : null,
      accountCode: ac ? { id: ac.id, code: ac.code, groupName: ac.groupName || null } : null,
      vendorEntity: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // 즉시 cache 추가 + 행 닫음 — 사용자에겐 0ms 응답
    queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
      if (!old) return old;
      return { ...old, expenses: [optimistic, ...old.expenses] };
    });
    setAdding(false);
    // 서버 응답 백그라운드 처리 — 성공 시 실제 expense로 교체, 실패 시 rollback
    return expensesApi.create(payload).then(({ expense }) => {
      queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
        if (!old) return old;
        return { ...old, expenses: old.expenses.map((e) => e.id === tempId ? expense : e) };
      });
    }).catch((err) => {
      queryClient.setQueryData(['expenses', 'list', queryParams], (old) => {
        if (!old) return old;
        return { ...old, expenses: old.expenses.filter((e) => e.id !== tempId) };
      });
      alert('저장 실패: ' + (err.response?.data?.error || err.message));
    });
  }, [queryClient, queryParams, projects, accountCodes]);

  const handleAddCancel = useCallback(() => setAdding(false), []);

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
      // .xls/.xlsx (신한·국민 등) / .csv 자동 분기
      const allRows = await readSpreadsheetFile(file);
      if (!allRows || allRows.length < 2) { alert('파일에 데이터가 없습니다'); return; }
      // 헤더 자동 탐지 — 신한 등 상단에 메타(계좌번호·기간·총건수) 있는 케이스 대응
      const detected = detectCsvHeader(allRows);
      const rows = [detected.header, ...detected.dataRows];
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
          <button onClick={() => fileInputRef.current?.click()} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50">📤 통장 가져오기 (.xls/.xlsx/.csv)</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
            className="hidden"
          />
          <button onClick={() => setAdding(true)} className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md">+ 거래 추가</button>
        </div>
      </div>

      {summary && view !== VIEW_RULES && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="이번 달 지출" total={summary.thisMonth.total} count={summary.thisMonth.count} highlight />
          <SummaryCard label="전월 지출" total={summary.prevMonth.total} count={summary.prevMonth.count}
            sub={diffLabel(summary.thisMonth.total, summary.prevMonth.total)} />
          <SummaryCard label="이번 달 매출" total={summary.thisMonthIncome.total} count={summary.thisMonthIncome.count} income />
          <SummaryCard label="누적 지출" total={summary.allTime.total} count={summary.allTime.count} />
        </div>
      )}

      {view !== VIEW_RULES && summary?.byGroup && summary.byGroup.length > 0 && (
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
          {canViewPnl && (
            <ViewTab active={view === VIEW_PNL}     onClick={() => setView(VIEW_PNL)}     label="💰 프로젝트 손익" />
          )}
          <div className="ml-auto" />
          <ViewTab active={view === VIEW_RULES}    onClick={() => setView(VIEW_RULES)}    label="🏷️ 자동분류 룰" />
        </div>

        {view !== VIEW_PNL && view !== VIEW_RULES && (
          <FilterBar
            projects={projects}
            accountCodes={accountCodes}
            accountGroups={accountGroups}
            filters={filters}
            onChange={setFilters}
          />
        )}

        <div className="border-t">
          {loading && expenses.length === 0 && view !== VIEW_RULES && <div className="p-6 text-sm text-gray-400">불러오는 중...</div>}
          {view === VIEW_LIST && (!loading || expenses.length > 0) && (
            <ListView
              expenses={deferredExpenses}
              totalCount={expenses.length}
              pageSize={PAGE_SIZE}
              total={totalFiltered}
              projects={projects}
              accountCodes={accountCodes}
              adding={adding}
              onAddCancel={handleAddCancel}
              onAddSave={handleAddSave}
              onEdit={setEditing}
              onPatch={handleInlinePatch}
              onRemove={handleInlineRemove}
              onBulkRemove={handleInlineBulkRemove}
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
          {view === VIEW_RULES && (
            <RulesManager accountCodes={accountCodes} />
          )}
        </div>
      </div>

      {/* 새 거래 추가는 인라인 행. 기존 거래 편집(description 클릭)만 모달. */}
      {editing && (
        <ExpenseModal
          expense={editing}
          projects={projects}
          accountCodes={accountCodes}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
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

const ListView = memo(function ListView({ expenses, totalCount, pageSize, total, projects, accountCodes, adding, onAddSave, onAddCancel, onEdit, onPatch, onRemove, onBulkRemove }) {
  const [selected, setSelected] = useState(() => new Set());
  // ListView 안에서 메모이즈 — NewRow와 ListRow가 같은 ref 공유
  const accountOptions = useMemo(
    () => accountCodes.map((c) => ({ id: c.id, label: c.code, hint: c.groupName })),
    [accountCodes]
  );
  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name, hint: p.siteCode || '' })),
    [projects]
  );
  // 거래 목록이 바뀌면 (필터 변경 등) 선택 초기화 — 사라진 id 청소
  useEffect(() => {
    const validIds = new Set(expenses.map((e) => e.id));
    setSelected((prev) => {
      const next = new Set();
      for (const id of prev) if (validIds.has(id)) next.add(id);
      return next;
    });
  }, [expenses]);

  if (expenses.length === 0) {
    return <div className="p-12 text-center text-sm text-gray-400">조건에 맞는 거래가 없습니다.</div>;
  }

  const allSelected = selected.size > 0 && selected.size === expenses.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(expenses.map((e) => e.id)));
  }
  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="px-4 py-2 bg-navy-50 border-b border-navy-200 text-sm flex items-center gap-3 sticky top-0 z-10">
          <span className="font-medium text-navy-800">{selected.size}건 선택됨</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-600 hover:underline"
          >선택 해제</button>
          <div className="ml-auto">
            <button
              onClick={() => onBulkRemove([...selected]).then(() => setSelected(new Set()))}
              className="text-xs px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700"
            >🗑️ {selected.size}건 삭제</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} title="전체 선택" />
              </th>
              <th className="text-left px-3 py-2 w-24">날짜</th>
              <th className="text-left px-3 py-2 w-16">종류</th>
              <th className="text-left px-3 py-2">내역</th>
              <th className="text-left px-3 py-2 w-40">메모</th>
              <th className="text-right px-3 py-2 w-32">금액</th>
              <th className="text-left px-3 py-2 w-44">계정과목</th>
              <th className="text-left px-3 py-2 w-36">프로젝트</th>
              <th className="text-left px-3 py-2 w-28">공종</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {adding && (
              <NewRow
                projects={projects}
                accountOptions={accountOptions}
                projectOptions={projectOptions}
                onSave={onAddSave}
                onCancel={onAddCancel}
              />
            )}
            {expenses.map((e) => (
              <ListRow
                key={e.id}
                expense={e}
                selected={selected.has(e.id)}
                onToggleSelect={() => toggleOne(e.id)}
                projects={projects}
                accountCodes={accountCodes}
                onEdit={onEdit}
                onPatch={onPatch}
                onRemove={onRemove}
              />
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-navy-800">
            <tr>
              <td colSpan={5} className="px-3 py-2.5">필터 합계 ({expenses.length}건)</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{formatWon(total)}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
      {totalCount > pageSize && (
        <div className="px-5 py-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
          전체 <b>{totalCount.toLocaleString('ko-KR')}건</b> 중 최근 <b>{pageSize}건</b> 표시 — 더 보려면 위 필터(프로젝트·계정과목·날짜·검색) 사용
        </div>
      )}
    </div>
  );
});

// 거래 1행 — 메모·금액·계정과목·프로젝트·공종 인라인 편집. 변경 시 자동 PATCH.
// memo로 감싸서 다른 행 변경에 의한 불필요한 re-render 차단 (입력 중 깜빡임 방지).
const ListRow = memo(function ListRow({ expense: e, selected, onToggleSelect, projects, accountCodes, onEdit, onPatch, onRemove }) {
  const [memoVal, setMemo] = useState(e.memo || '');
  const [amount, setAmount] = useState(String(e.amount));
  const [accountCodeId, setAccountCodeId] = useState(e.accountCodeId || '');
  const [projectId, setProjectId] = useState(e.projectId || '');
  const [workCategory, setWorkCategory] = useState(e.workCategory || '');
  // options ref 안정화 — InlineCombobox에 새 배열 전달되어 내부 useMemo가 매번 재계산되는 것 방지
  const accountOptions = useMemo(
    () => accountCodes.map((c) => ({ id: c.id, label: c.code, hint: c.groupName })),
    [accountCodes]
  );
  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name, hint: p.siteCode || '' })),
    [projects]
  );
  // expense 새 데이터로 동기화 (다른 행 변경·필터 갱신 후)
  useEffect(() => { setMemo(e.memo || ''); }, [e.id, e.memo]);
  useEffect(() => { setAmount(String(e.amount)); }, [e.id, e.amount]);
  useEffect(() => { setAccountCodeId(e.accountCodeId || ''); }, [e.id, e.accountCodeId]);
  useEffect(() => { setProjectId(e.projectId || ''); }, [e.id, e.projectId]);
  useEffect(() => { setWorkCategory(e.workCategory || ''); }, [e.id, e.workCategory]);

  function commitField(field, value, savedValue) {
    if ((value || '') === (savedValue || '')) return;
    onPatch(e.id, { [field]: value || null });
  }
  function commitAmount() {
    const n = Number(String(amount).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(n) || n === Number(e.amount)) return;
    onPatch(e.id, { amount: n });
  }

  const t = EXPENSE_TYPE_META[e.type] || EXPENSE_TYPE_META.EXPENSE;
  const rowClass = selected ? 'bg-navy-50' : 'hover:bg-gray-50';
  // 모든 td content를 h-6 wrapper로 감싸 NewRow와 행 높이 일치.
  const inputCls = 'w-full h-6 text-xs border border-transparent hover:border-gray-300 focus:border-navy-400 rounded px-1 bg-transparent';
  const cellWrap = 'flex items-center h-6';
  return (
    <tr className={`${rowClass} align-middle`}>
      <td className="px-3 py-1.5 text-center"><div className={`${cellWrap} justify-center`}><input type="checkbox" checked={selected} onChange={onToggleSelect} /></div></td>
      <td className="px-3 py-1.5"><div className={`${cellWrap} tabular-nums text-gray-600 text-xs`}>{String(e.date).slice(0, 10)}</div></td>
      <td className="px-3 py-1.5">
        <div className={cellWrap}>
          <span className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded border ${t.color}`}>{t.label}</span>
        </div>
      </td>
      <td className="px-3 py-1.5">
        <div className={cellWrap}>
          <button onClick={() => onEdit(e)} className="text-navy-800 hover:underline text-left text-xs truncate w-full">
            {e.description || e.vendor || <span className="text-gray-400">(설명 없음)</span>}
          </button>
        </div>
      </td>
      <td className="px-3 py-1.5">
        <input
          value={memoVal}
          onChange={(ev) => setMemo(ev.target.value)}
          onBlur={() => commitField('memo', memoVal, e.memo)}
          placeholder="—"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="text"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          onBlur={commitAmount}
          className={`${inputCls} text-right tabular-nums font-medium ${e.type === 'INCOME' ? 'text-emerald-700' : ''}`}
        />
      </td>
      <td className="px-3 py-1.5 text-xs">
        <InlineCombobox
          value={accountCodeId}
          options={accountOptions}
          onChange={(id) => { setAccountCodeId(id || ''); commitField('accountCodeId', id || '', e.accountCodeId); }}
          placeholder="검색…"
          emptyLabel="(미분류)"
          inputClassName={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <InlineCombobox
          value={projectId}
          options={projectOptions}
          onChange={(id) => { setProjectId(id || ''); commitField('projectId', id || '', e.projectId); }}
          placeholder="검색…"
          emptyLabel="(미지정)"
          inputClassName={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          value={workCategory}
          onChange={(ev) => setWorkCategory(ev.target.value)}
          onBlur={() => commitField('workCategory', workCategory, e.workCategory)}
          placeholder="—"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5 text-center">
        <div className={`${cellWrap} justify-center`}>
          <button onClick={() => onRemove(e.id)} className="text-gray-300 hover:text-rose-500 text-xs" title="삭제">×</button>
        </div>
      </td>
    </tr>
  );
});

// 신규 거래 입력 행 — 인라인 (모달 X). 외부 클릭 시 자동 저장.
// 입력 중 끊김 방지를 위해 형식 단순화 (2026-04-30):
//   - 자동분류는 명시 버튼 클릭 시에만 (디바운스 useEffect 제거 = 입력 중 작업 0)
//   - outside click handler는 formRef로 최신 값 추적 (deps = onSave/onCancel만)
function NewRow({ projects, accountOptions, projectOptions, onSave, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [memoVal, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [accountCodeId, setAccountCodeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [workCategory, setWorkCategory] = useState('');
  const [classifying, setClassifying] = useState(false);
  const rowRef = useRef(null);
  const busyRef = useRef(false);
  // 입력값을 ref로 추적 — useEffect deps 변동 줄여 outside click 리스너 한 번만 등록
  const formRef = useRef({});
  formRef.current = { date, type, description, memoVal, amount, accountCodeId, projectId, workCategory };

  // 자동분류 — 사용자가 🏷️ 버튼 클릭 시에만 classify API 호출
  async function applyClassify() {
    const desc = description.trim();
    if (!desc) return;
    setClassifying(true);
    try {
      const { results } = await expenseRulesApi.classify([desc]);
      const g = results?.[0];
      if (!g) return;
      if (g.accountCodeId) setAccountCodeId(g.accountCodeId);
      if (g.workCategory) setWorkCategory(g.workCategory);
      if (g.siteCode) {
        const proj = projects.find((p) => p.siteCode === g.siteCode);
        if (proj) setProjectId(proj.id);
      }
    } catch (e) { /* noop */ } finally { setClassifying(false); }
  }

  // 행 밖 클릭 시 자동 저장 — 마운트 1회만 등록.
  useEffect(() => {
    function onDoc(e) {
      if (!rowRef.current) return;
      if (rowRef.current.contains(e.target)) return;
      if (busyRef.current) return;
      const f = formRef.current;
      const desc = f.description.trim();
      if (desc) {
        const num = Number(String(f.amount).replace(/[^\d.-]/g, ''));
        busyRef.current = true;
        const result = onSave({
          date: f.date,
          type: f.type,
          amount: Number.isFinite(num) ? num : 0,
          description: desc,
          vendor: desc,
          memo: f.memoVal.trim() || null,
          accountCodeId: f.accountCodeId || null,
          projectId: f.projectId || null,
          workCategory: f.workCategory.trim() || null,
        });
        if (result && typeof result.catch === 'function') {
          result.catch((err) => {
            alert('저장 실패: ' + (err.response?.data?.error || err.message));
            busyRef.current = false;
          });
        }
      } else {
        onCancel();
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onSave, onCancel]);

  function handleKey(e) {
    if (e.key === 'Escape') onCancel();
  }

  // ListRow 인풋 스타일과 매칭. 명시 h-6 (24px)로 행 높이 강제 일치.
  const inputCls = 'w-full h-6 text-xs border border-transparent hover:border-gray-300 focus:border-navy-400 rounded px-1 bg-transparent';

  return (
    <tr ref={rowRef} className="bg-amber-50/60 align-middle" onKeyDown={handleKey}>
      <td className="px-3 py-1.5 text-center text-xs text-amber-700 font-medium">+</td>
      <td className="px-3 py-1.5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls}
        >
          {EXPENSE_TYPE_KEYS.map((k) => <option key={k} value={k}>{EXPENSE_TYPE_META[k].label}</option>)}
        </select>
      </td>
      <td className="px-3 py-1.5">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="거래처명·내역"
          className={inputCls}
          autoFocus
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          value={memoVal}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="자재·세부"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className={`${inputCls} text-right tabular-nums font-medium`}
        />
      </td>
      <td className="px-3 py-1.5">
        <InlineCombobox
          value={accountCodeId}
          options={accountOptions}
          onChange={(id) => setAccountCodeId(id || '')}
          placeholder="검색…"
          emptyLabel="(미분류)"
          inputClassName={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <InlineCombobox
          value={projectId}
          options={projectOptions}
          onChange={(id) => setProjectId(id || '')}
          placeholder="검색…"
          emptyLabel="(미지정)"
          inputClassName={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          value={workCategory}
          onChange={(e) => setWorkCategory(e.target.value)}
          placeholder="—"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5 text-center">
        <button
          type="button"
          onClick={applyClassify}
          disabled={!description.trim() || classifying}
          className="text-[10px] px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="자동분류 룰 적용 — 클릭 시 계정과목·공종·현장 채움"
        >{classifying ? '…' : '🏷️'}</button>
      </td>
    </tr>
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
    memo: expense?.memo || '',
    paymentMethod: expense?.paymentMethod || '',
    purchaseOrderId: expense?.purchaseOrderId || null,
  }));
  const [busy, setBusy] = useState(false);
  const [classifyHint, setClassifyHint] = useState(null); // 자동분류 룰 매칭 결과
  const [poCandidates, setPoCandidates] = useState(null);  // 발주 매칭 후보
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name, hint: p.siteCode || '' })),
    [projects]
  );
  const accountOptions = useMemo(
    () => accountCodes.map((c) => ({ id: c.id, label: c.code, hint: c.groupName })),
    [accountCodes]
  );

  // 자동분류 룰 미리보기 — vendor 또는 description 변경 시 키워드 매칭 호출 (debounce)
  useEffect(() => {
    const text = [form.vendor, form.description].filter(Boolean).join(' ').trim();
    if (!text || form.accountCodeId) { setClassifyHint(null); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { results } = await expenseRulesApi.classify([text]);
        if (!alive) return;
        const g = results?.[0];
        setClassifyHint(g || null);
      } catch (e) { /* noop */ }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [form.vendor, form.description, form.accountCodeId]);

  // 발주 매칭 후보 — 거래처/금액/날짜 충분하면 (수동 호출)
  async function searchPoCandidates() {
    const amount = Number(form.amount);
    if (!amount || !form.date) { alert('금액·날짜 입력 후 검색해주세요'); return; }
    setSearchingCandidates(true);
    try {
      const vendorText = form.vendor || form.description || '';
      const { candidates } = await expensesApi.inferenceCandidates({
        amount, date: form.date, vendorText, projectId: form.projectId || undefined,
      });
      setPoCandidates(candidates);
    } catch (e) {
      alert('후보 검색 실패: ' + (e.response?.data?.error || e.message));
    } finally { setSearchingCandidates(false); }
  }

  function applyPoCandidate(c) {
    const po = c.purchaseOrder;
    setForm((p) => ({
      ...p,
      purchaseOrderId: po.id,
      projectId: po.projectId || p.projectId,
    }));
    setPoCandidates(null);
  }

  function applyClassifyHint() {
    if (!classifyHint) return;
    setForm((p) => ({
      ...p,
      accountCodeId: classifyHint.accountCodeId || p.accountCodeId,
      workCategory: classifyHint.workCategory || p.workCategory,
    }));
    // siteCode → projectId 매핑
    if (classifyHint.siteCode) {
      const proj = projects.find((p) => p.siteCode === classifyHint.siteCode);
      if (proj) setForm((p) => ({ ...p, projectId: proj.id }));
    }
    setClassifyHint(null);
  }

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
        memo: form.memo.trim() || null,
        paymentMethod: form.paymentMethod || null,
        purchaseOrderId: form.purchaseOrderId || null,
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
            <InlineCombobox
              value={form.projectId}
              options={projectOptions}
              onChange={(id) => set('projectId', id || '')}
              placeholder="현장 검색…"
              emptyLabel="(현장 미지정 — 본사/대표)"
              inputClassName="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            />
          </Field>
          <Field label="계정과목">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <InlineCombobox
                  value={form.accountCodeId}
                  options={accountOptions}
                  onChange={(id) => set('accountCodeId', id || '')}
                  placeholder="계정과목 검색…"
                  emptyLabel="(미분류)"
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                />
              </div>
              <button
                type="button"
                onClick={applyClassifyHint}
                disabled={!classifyHint}
                title={classifyHint ? `룰 매칭: '${classifyHint.keyword}'` : '거래처/내역 입력 후 룰 매칭 시 활성화'}
                className="text-xs px-3 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >🏷️ 자동분류 적용</button>
            </div>
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
          <Field label="메모 (자재 종류·기타 보강)">
            <input value={form.memo} onChange={(e) => set('memo', e.target.value)} placeholder="예: 데코타일, 도배지" className="input" />
          </Field>

          {/* 출구정리 추론엔진 — 발주 매칭 후보 */}
          <div className="border-t pt-3">
            {form.purchaseOrderId ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs flex items-center justify-between">
                <span className="text-emerald-800">🔗 발주에 연결됨</span>
                <button
                  type="button"
                  onClick={() => set('purchaseOrderId', null)}
                  className="text-rose-600 hover:underline"
                >연결 해제</button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={searchPoCandidates}
                  disabled={searchingCandidates}
                  className="text-xs px-3 py-1.5 border border-violet-300 text-violet-700 rounded hover:bg-violet-50 disabled:opacity-50"
                >
                  {searchingCandidates ? '검색 중…' : '✨ 발주 매칭 후보 검색'}
                </button>
                <span className="text-xs text-gray-400 ml-2">금액·날짜·거래처 입력 후 클릭</span>
                {poCandidates && poCandidates.length === 0 && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 border rounded p-2">
                    매칭되는 발주 없음 (점수 30점 미만).
                    <button
                      type="button"
                      onClick={() => setPoCandidates(null)}
                      className="ml-2 text-gray-400 hover:underline"
                    >닫기</button>
                  </div>
                )}
                {poCandidates && poCandidates.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-violet-800">출구정리 추론엔진 — 후보 {poCandidates.length}건 (1-클릭 컨펌)</div>
                    {poCandidates.map((c) => {
                      const po = c.purchaseOrder;
                      const proj = projects.find((p) => p.id === po.projectId);
                      return (
                        <button
                          key={po.id}
                          type="button"
                          onClick={() => applyPoCandidate(c)}
                          className="w-full text-left bg-white border border-violet-200 rounded px-3 py-1.5 hover:bg-violet-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-navy-800 text-sm">{po.itemName}</span>
                              {po.spec && <span className="text-gray-500 text-xs ml-2">{po.spec}</span>}
                              {po.vendorEntity?.name && <span className="text-gray-500 text-xs ml-2">@ {po.vendorEntity.name}</span>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="tabular-nums text-navy-700 text-sm font-medium">{formatWon(po.totalPrice || 0)}</div>
                              <div className="text-gray-400 text-[10px]">{po.expectedDate ? String(po.expectedDate).slice(0, 10) : ''}</div>
                            </div>
                            <div className="shrink-0 text-violet-700 font-bold tabular-nums text-sm">{c.score}점</div>
                          </div>
                          {proj && <div className="text-gray-500 text-[10px] mt-0.5">현장: {proj.name}</div>}
                          {c.alreadyLinked && <div className="text-amber-600 text-[10px] mt-0.5">⚠ 이미 다른 거래에 연결됨 (분할 결제 가능)</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
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

  // 우선순위 기반 추측 — names 배열 순서대로 시도. 1순위가 모든 헤더에 없을 때만 2순위.
  // 신한 케이스: header에 '적요'와 '내용' 둘 다 있어도 '내용'(거래처) 우선.
  const guess = (names) => {
    for (const name of names) {
      for (let i = 0; i < header.length; i++) {
        if (header[i] && header[i].includes(name)) return i;
      }
    }
    return -1;
  };
  const [mapping, setMapping] = useState({
    date:        guess(['거래일자', '일자', '날짜', 'Date']),
    amount:      guess(['출금액', '출금', '지출']),
    inAmt:       guess(['입금액', '입금']),
    vendor:      guess(['거래처', '받는', '이체처', '의뢰인']),
    description: guess(['내용', '거래내용', '메모', '비고', '적요']),  // 신한: '내용'=거래처, '적요'=거래유형 — 내용 우선
  });

  const [perRow, setPerRow] = useState(() =>
    dataRows.map(() => ({ projectId: '', accountCodeId: '', workCategory: '', memo: '', type: 'EXPENSE', skip: false, candidates: null }))
  );
  const [classifying, setClassifying] = useState(false);
  const [inferringIdx, setInferringIdx] = useState(null);
  const [busy, setBusy] = useState(false);

  // 날짜 범위 필터 — 데이터에서 min/max 자동 추출 후 사용자 조정
  const dateBounds = useMemo(() => {
    const ds = [];
    for (const r of dataRows) {
      const d = normalizeDate((r[mapping.date] ?? '').toString().trim());
      if (d) ds.push(d);
    }
    ds.sort();
    return { min: ds[0] || '', max: ds[ds.length - 1] || '' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping.date]);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  function isOutOfRange(i) {
    if (!dateFilter.from && !dateFilter.to) return false;
    const d = normalizeDate((dataRows[i][mapping.date] ?? '').toString().trim());
    if (!d) return false;
    if (dateFilter.from && d < dateFilter.from) return true;
    if (dateFilter.to && d > dateFilter.to) return true;
    return false;
  }
  function effectiveSkip(i) { return perRow[i].skip || isOutOfRange(i); }

  const eligibleCount = dataRows.filter((_, i) => !effectiveSkip(i)).length;
  const allEligibleSelected = dataRows.length > 0
    && dataRows.every((_, i) => isOutOfRange(i) || !perRow[i].skip);

  function toggleSelectAll() {
    const next = !allEligibleSelected;
    setPerRow((arr) => arr.map((r, i) => isOutOfRange(i) ? r : { ...r, skip: next }));
  }

  // 자동 준비 — 모달 mount 1회: 마지막 거래일 자동 필터 + 중복 자동 스킵 + 자동분류
  const [prepInfo, setPrepInfo] = useState(null); // { lastDate, dupCount, total }
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { lastDate, fingerprints } = await expensesApi.importPrep();
        if (!alive) return;
        const fpSet = new Set(fingerprints || []);

        // 행 fingerprint 계산
        function rowFp(i) {
          const r = dataRows[i];
          const date = normalizeDate(getCell(r, mapping.date));
          const outAmt = getCellNum(r, mapping.amount);
          const inAmt = getCellNum(r, mapping.inAmt);
          const amount = Math.max(Math.abs(outAmt || 0), Math.abs(inAmt || 0));
          const desc = getCell(r, mapping.description);
          const vendorText = getCell(r, mapping.vendor) || desc;
          return `${date}|${amount}|${desc}|${vendorText}`;
        }

        // 1) 마지막 거래일이 있으면 그 날부터로 from 자동 세팅
        if (lastDate) {
          setDateFilter({ from: lastDate, to: '' });
        }

        // 2) 중복인 행 + 매출(INCOME) 행은 skip 자동 체크
        let dupCount = 0;
        let incomeCount = 0;
        setPerRow((arr) => arr.map((row, i) => {
          const r = dataRows[i];
          const inAmt = getCellNum(r, mapping.inAmt);
          const isIncome = inAmt && inAmt > 0;
          let next = row;
          if (isIncome) { incomeCount++; next = { ...next, skip: true, isIncome: true }; }
          if (fpSet.has(rowFp(i))) { dupCount++; next = { ...next, skip: true, isDuplicate: true }; }
          return next;
        }));

        setPrepInfo({ lastDate, dupCount, incomeCount, total: dataRows.length });

        // 3) 자동분류 자동 트리거
        await autoClassify();
      } catch (e) {
        // 실패해도 모달은 동작 — 수동 진행 가능
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 출구정리 추론엔진 후보 조회 — 1건. mapping·dataRows 기준으로 prepare.
  async function loadInferenceCandidates(i) {
    const r = dataRows[i];
    const out = getCellNum(r, mapping.amount);
    const inn = getCellNum(r, mapping.inAmt);
    const amount = Math.max(Math.abs(out || 0), Math.abs(inn || 0));
    const date = normalizeDate(getCell(r, mapping.date));
    const vendorText = [getCell(r, mapping.vendor), getCell(r, mapping.description)].filter(Boolean).join(' ');
    if (!amount || !date) {
      alert('금액·날짜 매핑을 먼저 확인해주세요.');
      return;
    }
    setInferringIdx(i);
    try {
      const { candidates } = await expensesApi.inferenceCandidates({
        amount, date, vendorText,
        projectId: perRow[i].projectId || undefined,
      });
      setPerRow((arr) => arr.map((x, idx) => idx === i ? { ...x, candidates } : x));
    } catch (e) {
      alert('추론엔진 호출 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setInferringIdx(null);
    }
  }

  function applyCandidate(i, cand) {
    setPerRow((arr) => arr.map((x, idx) => {
      if (idx !== i) return x;
      const po = cand.purchaseOrder;
      return {
        ...x,
        projectId: po.projectId || x.projectId,
        workCategory: x.workCategory || (po.itemName ? po.itemName.split('·').pop().trim() : x.workCategory),
        candidates: null,  // 컨펌 후 후보 카드 닫기
        purchaseOrderId: po.id,
      };
    }));
  }

  async function save() {
    const items = [];
    const errors = [];
    for (let i = 0; i < dataRows.length; i++) {
      if (effectiveSkip(i)) continue;
      const r = dataRows[i];
      const outAmt = getCellNum(r, mapping.amount);
      const inAmt = getCellNum(r, mapping.inAmt);
      const amount = Math.max(Math.abs(outAmt || 0), Math.abs(inAmt || 0));
      if (amount === 0) continue;
      const date = normalizeDate(getCell(r, mapping.date));
      if (!date) { errors.push(`${i + 1}행: 날짜 인식 실패 ("${getCell(r, mapping.date)}")`); continue; }
      const vendorText = getCell(r, mapping.vendor) || getCell(r, mapping.description) || null;
      items.push({
        projectId: perRow[i].projectId || null,
        type: inAmt && inAmt > 0 ? 'INCOME' : (perRow[i].type || 'EXPENSE'),
        date,
        amount,
        vendor: vendorText,
        accountCodeId: perRow[i].accountCodeId || null,
        workCategory: perRow[i].workCategory || null,
        description: getCell(r, mapping.description) || null,
        memo: perRow[i].memo || null,
        purchaseOrderId: perRow[i].purchaseOrderId || null,
        importedFrom: '통장 가져오기',
        rawText: r.join(' | '),
      });
    }
    if (errors.length > 0) {
      alert('일부 행에 문제가 있습니다:\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...외 ${errors.length - 5}건` : ''));
      return;
    }
    if (items.length === 0) { alert('가져올 행이 없습니다'); return; }
    if (!confirm(`${items.length}건을 추가합니다. 기존 거래와 같은 (날짜·금액·내역·거래처) 조합은 자동 스킵됩니다. 계속할까요?`)) return;
    setBusy(true);
    try {
      const { created, skippedDuplicates = 0, total = items.length } = await expensesApi.bulk(items);
      let msg = `✅ ${created}건 추가됨`;
      if (skippedDuplicates > 0) msg += `\n🔁 ${skippedDuplicates}건 중복 스킵 (기존 거래 보존, 덮어쓰기 X)`;
      if (created + skippedDuplicates !== total) msg += `\n⚠ ${total - created - skippedDuplicates}건 처리 실패`;
      alert(msg);
      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">통장 가져오기 — {dataRows.length}행</h2>
          {prepInfo ? (
            <div className="text-xs text-gray-600 mt-1 bg-emerald-50 border border-emerald-200 rounded p-2 leading-relaxed">
              {prepInfo.lastDate ? (
                <>📅 마지막 거래일 <b>{prepInfo.lastDate}</b> 이후로 자동 필터 · </>
              ) : (
                <>📅 첫 가져오기 (기존 거래 없음) · </>
              )}
              🔁 중복 <b>{prepInfo.dupCount}</b>건 · 💰 매출 <b>{prepInfo.incomeCount || 0}</b>건 자동 스킵 · 🏷️ 자동분류 완료
              <br /><span className="text-gray-500">지출만 가져옵니다. 전체 불러오기 버튼만 누르시면 됩니다.</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">자동 준비 중… (마지막 거래일 감지·중복 검사·매출 스킵·자동분류)</div>
          )}
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

        {/* 날짜 범위 필터 — 데이터 기간 자동 표시, 사용자 조정 가능 */}
        <div className="px-6 py-2 border-b bg-sky-50 text-xs flex items-center gap-2 flex-wrap">
          <span className="text-gray-700 font-medium">📅 날짜 범위:</span>
          <input
            type="date"
            value={dateFilter.from}
            onChange={(e) => setDateFilter((d) => ({ ...d, from: e.target.value }))}
            className="text-xs border rounded px-2 py-1 bg-white"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={dateFilter.to}
            onChange={(e) => setDateFilter((d) => ({ ...d, to: e.target.value }))}
            className="text-xs border rounded px-2 py-1 bg-white"
          />
          {(dateFilter.from || dateFilter.to) && (
            <button onClick={() => setDateFilter({ from: '', to: '' })} className="text-xs px-2 py-1 border rounded hover:bg-white">초기화</button>
          )}
          <span className="text-gray-500 ml-2">파일 기간: {dateBounds.min || '?'} ~ {dateBounds.max || '?'}</span>
          <span className="ml-auto text-gray-700 font-medium">대상 {eligibleCount} / 전체 {dataRows.length}</span>
        </div>

        <div className="px-6 py-2 border-b bg-amber-50 text-xs flex items-center gap-2 flex-wrap">
          <button
            onClick={autoClassify}
            disabled={classifying}
            className="text-xs px-3 py-1 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-50"
          >
            {classifying ? '분류 중...' : '🏷️ 자동분류 적용'}
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
                <th className="px-2 py-1.5 w-10">
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleSelectAll}
                    title="전체 선택/해제 (날짜 범위 안)"
                  />
                </th>
                <th className="text-left px-2 py-1.5 w-20">날짜</th>
                <th className="text-right px-2 py-1.5 w-24">금액</th>
                <th className="text-left px-2 py-1.5">내역</th>
                <th className="px-2 py-1.5 w-32">메모</th>
                <th className="px-2 py-1.5 w-44">프로젝트</th>
                <th className="px-2 py-1.5 w-44">계정과목</th>
                <th className="px-2 py-1.5 w-24">공종</th>
                <th className="px-2 py-1.5 w-20">발주 매칭</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dataRows.map((r, i) => {
                const out = getCellNum(r, mapping.amount);
                const inn = getCellNum(r, mapping.inAmt);
                const amt = Math.max(Math.abs(out || 0), Math.abs(inn || 0));
                const dateRaw = getCell(r, mapping.date);
                const skipped = effectiveSkip(i);
                const outOfRange = isOutOfRange(i);
                const isIncome = inn && inn > 0;
                const cands = perRow[i].candidates;
                const linkedPo = perRow[i].purchaseOrderId;
                const rowClass = outOfRange
                  ? 'opacity-30 bg-gray-50'
                  : (skipped ? 'opacity-40' : 'hover:bg-gray-50');
                return (
                  <Fragment key={i}>
                  <tr className={rowClass} title={outOfRange ? '날짜 범위 밖 — 자동 스킵' : undefined}>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={!perRow[i].skip}
                        onChange={(e) => setRow(i, 'skip', !e.target.checked)}
                        disabled={outOfRange}
                      />
                    </td>
                    <td className="px-2 py-1">{dateRaw}</td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {amt ? <span className={isIncome ? 'text-emerald-700' : ''}>{isIncome && '+'}{formatWon(amt)}</span> : <span className="text-rose-500">없음</span>}
                    </td>
                    <td className="px-2 py-1 text-gray-700 truncate max-w-xs">
                      {getCell(r, mapping.description)} {getCell(r, mapping.vendor) && <span className="text-gray-400">· {getCell(r, mapping.vendor)}</span>}
                      {perRow[i].isDuplicate && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🔁 기존 거래</span>}
                      {perRow[i].isIncome && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">💰 매출</span>}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={perRow[i].memo}
                        onChange={(e) => setRow(i, 'memo', e.target.value)}
                        disabled={skipped}
                        placeholder="자재·세부"
                        className="w-full text-xs border rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-2 py-1">
                      {skipped ? (
                        <span className="text-xs text-gray-400">{projects.find((p) => p.id === perRow[i].projectId)?.name || '(미지정)'}</span>
                      ) : (
                        <InlineCombobox
                          value={perRow[i].projectId}
                          options={projects.map((p) => ({ id: p.id, label: p.name, hint: p.siteCode || '' }))}
                          onChange={(id) => setRow(i, 'projectId', id || '')}
                          placeholder="검색…"
                          emptyLabel="(미지정)"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {skipped ? (
                        <span className="text-xs text-gray-400">{accountCodes.find((c) => c.id === perRow[i].accountCodeId)?.code || '(미분류)'}</span>
                      ) : (
                        <InlineCombobox
                          value={perRow[i].accountCodeId}
                          options={accountCodes.map((c) => ({ id: c.id, label: c.code, hint: c.groupName }))}
                          onChange={(id) => setRow(i, 'accountCodeId', id || '')}
                          placeholder="검색…"
                          emptyLabel="(미분류)"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <input value={perRow[i].workCategory} onChange={(e) => setRow(i, 'workCategory', e.target.value)} disabled={skipped} className="w-full text-xs border rounded px-1 py-0.5" />
                    </td>
                    <td className="px-2 py-1 text-center">
                      {linkedPo ? (
                        <span className="text-xs text-emerald-700" title="발주에 연결됨">🔗 연결</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => loadInferenceCandidates(i)}
                          disabled={skipped || inferringIdx === i || amt === 0}
                          className="text-xs px-2 py-0.5 border border-violet-300 text-violet-700 rounded hover:bg-violet-50 disabled:opacity-40"
                        >
                          {inferringIdx === i ? '검색…' : '✨ 후보'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {cands && cands.length > 0 && (
                    <tr key={`${i}-cands`} className="bg-violet-50/40">
                      <td colSpan={9} className="px-3 py-2">
                        <div className="text-xs text-violet-800 mb-1">
                          출구정리 추론엔진 — 발주 매칭 후보 {cands.length}건 (1-클릭 컨펌)
                        </div>
                        <div className="space-y-1">
                          {cands.map((c) => {
                            const po = c.purchaseOrder;
                            const proj = projects.find((p) => p.id === po.projectId);
                            return (
                              <button
                                key={po.id}
                                type="button"
                                onClick={() => applyCandidate(i, c)}
                                className="w-full text-left bg-white border border-violet-200 rounded px-3 py-1.5 hover:bg-violet-50"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-navy-800">{po.itemName}</span>
                                    {po.spec && <span className="text-gray-500 ml-2">{po.spec}</span>}
                                    {po.vendorEntity?.name && <span className="text-gray-500 ml-2">@ {po.vendorEntity.name}</span>}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="tabular-nums text-navy-700 font-medium">{formatWon(po.totalPrice || 0)}</div>
                                    <div className="text-gray-400 text-[10px]">{po.expectedDate ? String(po.expectedDate).slice(0, 10) : ''}</div>
                                  </div>
                                  <div className="shrink-0 text-violet-700 font-bold tabular-nums">{c.score}점</div>
                                </div>
                                {proj && <div className="text-gray-500 text-[10px] mt-0.5">현장: {proj.name}</div>}
                                <div className="text-gray-400 text-[10px] mt-0.5">
                                  거래처 {c.signals.vendor} / 금액 {c.signals.amount} / 날짜 {c.signals.date} / 현장 {c.signals.project} / 상태 {c.signals.statusBoost > 0 ? `+${c.signals.statusBoost}` : c.signals.statusBoost}
                                  {c.alreadyLinked && <span className="ml-2 text-amber-600">⚠ 이미 다른 거래에 연결됨 (분할 결제 가능)</span>}
                                </div>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setPerRow((arr) => arr.map((x, idx) => idx === i ? { ...x, candidates: null } : x))}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            ✕ 후보 닫기
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {cands && cands.length === 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-3 py-1.5 text-xs text-gray-500">
                        매칭되는 발주 후보 없음 (점수 30점 이상 없음)
                        <button
                          type="button"
                          onClick={() => setPerRow((arr) => arr.map((x, idx) => idx === i ? { ...x, candidates: null } : x))}
                          className="ml-2 text-gray-400 hover:underline"
                        >✕</button>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">취소</button>
          <button onClick={save} disabled={busy} className="text-sm px-5 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50">
            {busy ? '저장 중...' : `📥 전체 불러오기 (${eligibleCount}건)`}
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

// ============================================================
// 자동분류 룰 관리 — 출구정리 추론엔진 워크플로 첫 단계
// (은행 CSV import → 자동분류기 통과 → 출구정리 추론엔진 후보 제시)
// ============================================================
function RulesManager({ accountCodes }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // rule 객체 또는 null
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { rules } = await expenseRulesApi.list({ activeOnly: false });
      setRules(rules || []);
    } catch (e) {
      alert('룰 목록 로드 실패: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(rule) {
    try {
      await expenseRulesApi.update(rule.id, { active: !rule.active });
      load();
    } catch (e) { alert('변경 실패: ' + (e.response?.data?.error || e.message)); }
  }

  async function remove(rule) {
    if (!confirm(`'${rule.keyword}' 룰을 삭제할까요?`)) return;
    try {
      await expenseRulesApi.remove(rule.id);
      load();
    } catch (e) { alert('삭제 실패: ' + (e.response?.data?.error || e.message)); }
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 leading-relaxed mb-4">
        💡 <b>자동분류 룰</b>은 통장 CSV 가져오기 시 거래 텍스트(거래처·내역)에 키워드가 포함되면 자동으로 계정과목·현장·공종을 라벨링합니다. 우선순위가 높을수록 먼저 매칭되며, 같은 우선순위에선 긴 키워드부터.
        <br />반복 지출(공과금·임대료·통신비 등)을 등록해두면 매번 손으로 분류하지 않아도 됩니다.
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">총 {rules.length}개 룰 · 활성 {rules.filter((r) => r.active).length}개</div>
        <button
          onClick={() => setAdding(true)}
          className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
        >
          + 룰 추가
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">키워드</th>
              <th className="px-3 py-2 text-left">계정과목</th>
              <th className="px-3 py-2 text-left">현장약칭</th>
              <th className="px-3 py-2 text-left">공종</th>
              <th className="px-3 py-2 text-right">우선순위</th>
              <th className="px-3 py-2 text-center">활성</th>
              <th className="px-3 py-2 text-right w-28">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                등록된 룰이 없습니다. 위 "+ 룰 추가"로 첫 룰을 등록해보세요.
              </td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className={`border-t hover:bg-gray-50 ${!r.active ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">{r.keyword}</td>
                  <td className="px-3 py-2">
                    {r.accountCode ? (
                      <span className={`text-xs px-2 py-0.5 rounded ${accountColor(r.accountCode.groupName)}`}>
                        {r.accountCode.code}
                      </span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{r.siteCode || <span className="text-gray-300">-</span>}</td>
                  <td className="px-3 py-2 text-gray-600">{r.workCategory || <span className="text-gray-300">-</span>}</td>
                  <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{r.priority}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`text-xs px-2 py-0.5 rounded border ${
                        r.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                      title="클릭하여 토글"
                    >
                      {r.active ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button
                      onClick={() => setEditing(r)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >수정</button>
                    <button
                      onClick={() => remove(r)}
                      className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                    >삭제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(adding || editing) && (
        <RuleModal
          rule={editing}
          accountCodes={accountCodes}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function RuleModal({ rule, accountCodes, onClose, onSaved }) {
  const isEdit = !!rule;
  const [form, setForm] = useState({
    keyword: rule?.keyword || '',
    accountCodeId: rule?.accountCodeId || '',
    siteCode: rule?.siteCode || '',
    workCategory: rule?.workCategory || '',
    priority: rule?.priority ?? 0,
    active: rule?.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.keyword.trim()) { alert('키워드는 필수입니다'); return; }
    const payload = {
      keyword: form.keyword.trim(),
      accountCodeId: form.accountCodeId || null,
      siteCode: form.siteCode.trim() || null,
      workCategory: form.workCategory.trim() || null,
      priority: Number(form.priority) || 0,
      active: form.active,
    };
    setBusy(true);
    try {
      if (isEdit) await expenseRulesApi.update(rule.id, payload);
      else await expenseRulesApi.create(payload);
      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-navy-800">{isEdit ? '룰 수정' : '룰 추가'}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="키워드 *">
            <input
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              placeholder='예: "한국전력공사", "S-OIL", "강남102"'
              className="input"
              autoFocus
            />
            <div className="text-xs text-gray-500 mt-1">거래처 또는 내역에 이 키워드가 포함되면 매칭됩니다 (대소문자 무시)</div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="계정과목">
              <select
                value={form.accountCodeId}
                onChange={(e) => setForm({ ...form, accountCodeId: e.target.value })}
                className="input"
              >
                <option value="">(미지정)</option>
                {accountCodes.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}{c.groupName ? ` (${c.groupName})` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="우선순위">
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                placeholder="0"
                className="input"
              />
              <div className="text-xs text-gray-500 mt-1">높을수록 먼저 매칭. 디폴트 0</div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="현장약칭 (선택)">
              <input
                value={form.siteCode}
                onChange={(e) => setForm({ ...form, siteCode: e.target.value })}
                placeholder='예: "강남102"'
                className="input"
              />
            </Field>
            <Field label="공종 (선택)">
              <input
                value={form.workCategory}
                onChange={(e) => setForm({ ...form, workCategory: e.target.value })}
                placeholder='예: "도배"'
                className="input"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4"
            />
            활성 (체크 해제 시 매칭에서 제외)
          </label>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
          >
            {busy ? '저장중...' : (isEdit ? '저장' : '추가')}
          </button>
        </div>
      </div>
    </div>
  );
}

