// 팀 캘린더 — 회사 자체 운영 일정 + 견적미팅·사무실미팅 (2026-05-17 신설)
// 봉기님 합의: 프로젝트와 분리된 별도 메뉴. 연관 프로젝트 있으면 프로젝트 일정에도 자동 노출.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companySchedulesApi } from '../api/companySchedules';
import { projectsApi } from '../api/projects';
import { vendorsApi } from '../api/vendors';
import { STANDARD_PHASES } from '../utils/phases';
import { toDateKey } from '../utils/date';

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];

function monthRange(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: toDateKey(from), to: toDateKey(to) };
}

function fmtDate(d) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()} (${KOR_DOW[dt.getDay()]})`;
}

export default function TeamCalendar() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));

  const range = useMemo(() => monthRange(cursor.y, cursor.m), [cursor]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-schedules', range.from, range.to],
    queryFn: () => companySchedulesApi.list(range),
  });
  const entries = data?.entries || [];

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'team-calendar'],
    queryFn: () => projectsApi.list(),
  });
  const projects = projectsData?.projects || projectsData?.items || [];
  // 진행중·예정만 보여줘서 셀렉트 짧게 — 완료·취소·수주실패는 숨김
  const activeProjects = projects.filter((p) =>
    ['PLANNED', 'IN_PROGRESS', 'ON_HOLD'].includes(p.status)
  );

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'team-calendar'],
    queryFn: () => vendorsApi.list(),
  });
  const vendors = vendorsData?.vendors || vendorsData?.items || [];

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['company-schedules'] });
  }

  // 입력 폼 상태
  const [form, setForm] = useState({
    date: toDateKey(today),
    content: '',
    projectId: '',
    category: '',
    vendorId: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e?.preventDefault?.();
    if (!form.content.trim()) {
      setErr('내용을 입력해주세요');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      await companySchedulesApi.create({
        date: form.date,
        content: form.content.trim(),
        projectId: form.projectId || null,
        category: form.category || null,
        vendorId: form.vendorId || null,
      });
      setForm({ ...form, content: '', projectId: '', category: '', vendorId: '' });
      reload();
    } catch (e) {
      setErr(e.response?.data?.error || '추가 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('이 일정을 삭제할까요?')) return;
    try {
      await companySchedulesApi.remove(id);
      reload();
    } catch (e) {
      alert(e.response?.data?.error || '삭제 실패');
    }
  }

  // 날짜별 그룹
  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [entries]);

  function shiftMonth(delta) {
    setCursor((c) => {
      const next = new Date(c.y, c.m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200">팀 캘린더</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            회사 자체 일정 · 견적미팅 · 사무실미팅. 연관 프로젝트를 연결하면 프로젝트 일정에도 함께 노출됩니다.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md">
          <button
            onClick={() => shiftMonth(-1)}
            className="px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-l-md"
          >‹</button>
          <span className="px-3 py-1.5 text-sm font-medium tabular-nums">
            {cursor.y}년 {cursor.m + 1}월
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-r-md"
          >›</button>
        </div>
      </div>

      {/* 새 일정 입력 폼 */}
      <form
        onSubmit={submit}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_180px] gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
            required
          />
          <input
            type="text"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="예: 김부장님 디자인 미팅, 가산점 답사, 직원 회식"
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-60"
          >
            {busy ? '추가 중...' : '+ 일정 추가'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-1.5">
            <span>연관 프로젝트:</span>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900 min-w-[140px]"
              title="선택 시 해당 프로젝트 일정에도 함께 노출됩니다"
            >
              <option value="">— 없음 —</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span>공정:</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900"
            >
              <option value="">미지정</option>
              {STANDARD_PHASES.filter((p) => p.key !== 'OTHER').map((p) => (
                <option key={p.key} value={p.label}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span>거래처:</span>
            <select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900 min-w-[120px]"
            >
              <option value="">— 없음 —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </label>
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
      </form>

      {/* 일정 리스트 */}
      {isLoading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {error && <div className="text-sm text-rose-600">불러오기 실패</div>}
      {!isLoading && groupedByDate.length === 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 border-dashed rounded-lg py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          이 달에 등록된 회사 일정이 없습니다
        </div>
      )}

      <div className="space-y-2">
        {groupedByDate.map(([dateKey, list]) => (
          <div key={dateKey} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
            <div className="text-sm font-semibold text-navy-700 dark:text-navy-200 mb-2">
              {fmtDate(dateKey)}
            </div>
            <div className="space-y-1.5">
              {list.map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-sm group">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 dark:text-gray-200">{e.content}</span>
                    <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] flex-wrap">
                      {e.category && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {e.category}
                        </span>
                      )}
                      {e.vendor && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                          {e.vendor.name}
                        </span>
                      )}
                      {e.project && (
                        <Link
                          to={`/projects/${e.project.id}/schedule`}
                          className="px-1.5 py-0.5 rounded bg-navy-50 dark:bg-navy-900/40 text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-900/60"
                        >
                          {e.project.name}
                        </Link>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    className="sm:opacity-0 sm:group-hover:opacity-100 transition text-xs text-gray-400 hover:text-rose-600 px-1"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
