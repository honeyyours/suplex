import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { formatDateDot } from '../utils/date';

const VARIANTS = {
  IN_PROGRESS: {
    title: '진행중 프로젝트',
    cardBase: 'bg-white border-navy-200 hover:border-navy-400',
    titleColor: 'text-navy-800',
    badge: { color: 'bg-sky-100 text-sky-700', label: '진행중' },
    emptyText: '진행중인 프로젝트가 없습니다',
    getTo: (p) => `/schedule?tab=site&projectId=${p.id}`,
  },
  PLANNED: {
    title: '견적단계 프로젝트',
    cardBase: 'bg-gray-50 border-gray-200 hover:border-amber-400',
    titleColor: 'text-gray-700',
    badge: { color: 'bg-amber-100 text-amber-800', label: '예정' },
    emptyText: '예정 단계 프로젝트가 없습니다',
    getTo: (p) => `/projects/${p.id}`,
  },
};

export default function HomeProjectCards({ status }) {
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'list', { status }],
    queryFn: () => projectsApi.list({ status }),
  });
  const projects = data?.projects || [];
  const loading = isLoading;

  const v = VARIANTS[status];

  const MOBILE_LIMIT = 5;
  const mobileVisible = projects.slice(0, MOBILE_LIMIT);
  const mobileRemaining = projects.length - mobileVisible.length;

  return (
    <section className="bg-white rounded-xl border p-3 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-navy-800 flex items-center gap-2">
          <span>{v.title}</span>
          <span className="text-sm font-normal text-gray-500">({projects.length})</span>
        </h2>
        <Link to="/projects" className="text-xs text-navy-700 hover:underline">
          전체 →
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">불러오는 중...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400">{v.emptyText}</div>
      ) : (
        <>
          {/* 모바일: 한 줄 리스트 (이름 · D-day · 평수) */}
          <ul className="sm:hidden divide-y divide-gray-100">
            {mobileVisible.map((p) => (
              <li key={p.id}>
                <Link
                  to={v.getTo(p)}
                  className="flex items-center gap-2 py-2.5 -mx-1 px-1 hover:bg-gray-50 rounded"
                >
                  <span className={`text-sm font-medium truncate flex-1 min-w-0 ${v.titleColor}`}>
                    {p.name}
                  </span>
                  {p.expectedEndDate && (
                    <span className="text-[11px] shrink-0">
                      <DDayBadge date={p.expectedEndDate} />
                    </span>
                  )}
                  {p.area && (
                    <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                      {Number(p.area)}평
                    </span>
                  )}
                  <span className="text-gray-300 shrink-0">›</span>
                </Link>
              </li>
            ))}
            {mobileRemaining > 0 && (
              <li>
                <Link
                  to="/projects"
                  className="block text-center py-2 text-xs text-gray-500 hover:text-navy-700"
                >
                  +{mobileRemaining}건 더 →
                </Link>
              </li>
            )}
          </ul>

          {/* 데스크톱: 기존 카드 그리드 */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={v.getTo(p)}
                className={`block rounded-lg border p-3 transition ${v.cardBase}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className={`font-semibold text-sm truncate ${v.titleColor}`}>
                    {p.name}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${v.badge.color}`}>
                    {v.badge.label}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate mb-1">
                  {p.customerName} · {p.siteAddress}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                  {p.startDate && (
                    <span>{formatDateDot(p.startDate)}</span>
                  )}
                  {p.expectedEndDate && (
                    <DDayBadge date={p.expectedEndDate} />
                  )}
                  {p.area && (
                    <span>{Number(p.area)}평</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function DDayBadge({ date }) {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) {
    return <span className="text-rose-600">D+{Math.abs(days)} (지연)</span>;
  }
  if (days === 0) {
    return <span className="text-rose-600 font-semibold">D-DAY</span>;
  }
  if (days <= 14) {
    return <span className="text-amber-700 font-semibold">D-{days}</span>;
  }
  return <span>D-{days}</span>;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}
