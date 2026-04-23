import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { formatDateDot, weeksBetween } from '../utils/date';

const STATUS_META = {
  PLANNED:     { label: '예정',   color: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-sky-100 text-sky-700' },
  ON_HOLD:     { label: '보류',   color: 'bg-gray-200 text-gray-700' },
  COMPLETED:   { label: '완료',   color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:   { label: '취소',   color: 'bg-red-100 text-red-700' },
};

const STATUS_ORDER = ['IN_PROGRESS', 'PLANNED', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

function projectYear(p) {
  const d = p.startDate || p.createdAt;
  return d ? new Date(d).getFullYear() : null;
}

export default function Projects() {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(currentYear); // 'ALL' | number
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PLANNED | IN_PROGRESS | ...
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent | name | start

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'list', {}],
    queryFn: () => projectsApi.list(),
  });
  const projects = data?.projects || [];
  const loading = isLoading;

  const years = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      const y = projectYear(p);
      if (y) set.add(y);
    });
    set.add(currentYear); // 올해는 빈 데이터여도 항상 보이게
    return [...set].sort((a, b) => b - a);
  }, [projects, currentYear]);

  const yearCounts = useMemo(() => {
    const c = { ALL: projects.length };
    for (const y of years) c[y] = 0;
    for (const p of projects) {
      const y = projectYear(p);
      if (y && c[y] !== undefined) c[y]++;
    }
    return c;
  }, [projects, years]);

  // 연도 필터를 적용한 후 상태별 카운트 계산
  const yearScoped = useMemo(() => {
    if (yearFilter === 'ALL') return projects;
    return projects.filter((p) => projectYear(p) === yearFilter);
  }, [projects, yearFilter]);

  const counts = useMemo(() => {
    const c = { ALL: yearScoped.length };
    for (const k of STATUS_ORDER) c[k] = 0;
    for (const p of yearScoped) c[p.status] = (c[p.status] || 0) + 1;
    return c;
  }, [yearScoped]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = yearScoped.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (qq) {
        const hay = `${p.name} ${p.customerName || ''} ${p.siteAddress || ''}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
    if (sortBy === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'start') list.sort((a, b) => {
      const ad = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bd = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bd - ad; // 최신 시작일 우선
    });
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [yearScoped, statusFilter, q, sortBy]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-800">프로젝트</h1>
        <Link
          to="/projects/new"
          className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + 새 프로젝트
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 mr-1">연도</span>
          <FilterChip
            label={`전체 (${yearCounts.ALL})`}
            active={yearFilter === 'ALL'}
            onClick={() => setYearFilter('ALL')}
          />
          {years.map((y) => (
            <FilterChip
              key={y}
              label={`${y}년 (${yearCounts[y] || 0})`}
              active={yearFilter === y}
              onClick={() => setYearFilter(y)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 mr-1">상태</span>
          <FilterChip
            label={`전체 (${counts.ALL})`}
            active={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          />
          {STATUS_ORDER.map((k) => (
            <FilterChip
              key={k}
              label={`${STATUS_META[k].label} (${counts[k] || 0})`}
              active={statusFilter === k}
              colorClass={STATUS_META[k].color}
              onClick={() => setStatusFilter(k)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="프로젝트명·고객명·주소 검색"
            className="flex-1 min-w-[200px] text-sm px-3 py-2 border rounded-md focus:border-navy-700 outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm px-3 py-2 border rounded-md focus:border-navy-700 outline-none"
          >
            <option value="recent">최근 등록순</option>
            <option value="name">이름순</option>
            <option value="start">시작일순</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-sm text-gray-400">불러오는 중...</div>
      )}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 bg-white border rounded-lg">
          <div className="text-gray-400 text-sm mb-3">아직 등록된 프로젝트가 없습니다</div>
          <Link
            to="/projects/new"
            className="inline-block bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-navy-800"
          >
            + 첫 프로젝트 만들기
          </Link>
        </div>
      )}
      {!loading && projects.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-white border rounded-lg text-sm text-gray-400">
          조건에 맞는 프로젝트가 없습니다.
        </div>
      )}

      {filtered.length > 0 && statusFilter === 'ALL' && (
        <div className="space-y-5">
          {STATUS_ORDER.map((status) => {
            const group = filtered.filter((p) => p.status === status);
            if (group.length === 0) return null;
            const meta = STATUS_META[status];
            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm text-gray-500">({group.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && statusFilter !== 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, colorClass }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border ${
        active
          ? 'border-navy-700 bg-navy-700 text-white'
          : `border-gray-200 ${colorClass || 'text-gray-600'} hover:border-navy-300`
      }`}
    >
      {label}
    </button>
  );
}

function ProjectCard({ project: p }) {
  const status = STATUS_META[p.status] || STATUS_META.PLANNED;
  const weeks = weeksBetween(p.startDate, p.expectedEndDate);
  return (
    <Link
      to={`/projects/${p.id}`}
      className="block bg-white border rounded-lg p-4 hover:border-navy-500 hover:shadow-sm transition"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="font-semibold text-navy-800 truncate">{p.name}</div>
        <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {p.customerName && <div>{p.customerName}</div>}
        {p.siteAddress && <div className="truncate">{p.siteAddress}</div>}
        {p.startDate && p.expectedEndDate && (
          <div>
            {formatDateDot(p.startDate)} ~ {formatDateDot(p.expectedEndDate)}
            {weeks && <span className="text-gray-400 ml-1">({weeks}주)</span>}
          </div>
        )}
        {p.area && <div className="text-gray-400">면적 {Number(p.area)}평</div>}
      </div>
    </Link>
  );
}
