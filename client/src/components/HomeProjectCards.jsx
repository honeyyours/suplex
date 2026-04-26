import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { formatDateDot } from '../utils/date';

const VARIANTS = {
  IN_PROGRESS: {
    title: '진행중 프로젝트',
    icon: '🏗️',
    cardBase: 'bg-white border-navy-200 hover:border-navy-400',
    titleColor: 'text-navy-800',
    badge: { color: 'bg-sky-100 text-sky-700', label: '진행중' },
    emptyText: '진행중인 프로젝트가 없습니다',
  },
  PLANNED: {
    title: '견적단계 프로젝트',
    icon: '📝',
    cardBase: 'bg-gray-50 border-gray-200 hover:border-amber-400',
    titleColor: 'text-gray-700',
    badge: { color: 'bg-amber-100 text-amber-800', label: '예정' },
    emptyText: '예정 단계 프로젝트가 없습니다',
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

  return (
    <section className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
          <span>{v.icon}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className={`block rounded-lg border p-3 transition ${v.cardBase}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className={`font-semibold text-sm truncate ${v.titleColor}`}>
                  {p.name}
                </div>
                <span className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${v.badge.color}`}>
                  {v.badge.label}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate mb-1">
                {p.customerName} · {p.siteAddress}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                {p.startDate && (
                  <span>📅 {formatDateDot(p.startDate)}</span>
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
      )}
    </section>
  );
}

function DDayBadge({ date }) {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) {
    return <span className="text-red-600">D+{Math.abs(days)} (지연)</span>;
  }
  if (days === 0) {
    return <span className="text-red-600 font-semibold">D-DAY</span>;
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
