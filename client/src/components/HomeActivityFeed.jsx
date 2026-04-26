import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activityApi, ACTIVITY_META } from '../api/activity';
import { relativeTime } from '../utils/date';

export default function HomeActivityFeed({ days = 7, limit = 20 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'list', { days, limit }],
    queryFn: () => activityApi.list({ days, limit }),
  });
  const items = data?.items || [];
  const loading = isLoading;

  return (
    <section className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
          <span>📰</span>
          <span>최근 활동</span>
          <span className="text-sm font-normal text-gray-500">(지난 {days}일)</span>
        </h2>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          최근 {days}일 동안 활동이 없습니다
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-2">
          {items.map((it) => {
            const meta = ACTIVITY_META[it.kind] || { label: '', icon: '·', color: 'bg-gray-100 text-gray-700' };
            const inner = (
              <div className="flex items-start gap-2 px-2 py-2 rounded hover:bg-gray-50 transition">
                <span className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 mt-0.5 ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-navy-800 break-words">
                    {it.message}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {it.project && (
                      <span className="text-navy-600 truncate">{it.project.name}</span>
                    )}
                    {it.by && <span>· {it.by}</span>}
                    <span>· {relativeTime(it.when)}</span>
                  </div>
                </div>
              </div>
            );
            const wrap = it.link ? (
              <Link key={it.id} to={it.link} className="block break-inside-avoid">{inner}</Link>
            ) : (
              <div key={it.id} className="break-inside-avoid">{inner}</div>
            );
            return wrap;
          })}
        </div>
      )}
    </section>
  );
}
