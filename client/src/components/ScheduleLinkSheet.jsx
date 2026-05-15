// 체크리스트 항목을 공정 일정에 연결할 때 일정을 고르는 모달 시트.
// 선택 시 onSelect({ id, date, category, content })로 콜백.
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { categoryClass } from '../utils/date';
import { useEscape } from '../hooks/useEscape';

function fmtDay(dateStr) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

export default function ScheduleLinkSheet({ projectId, onSelect, onClose }) {
  useEscape(onClose);

  // 전체 일정 — 프로젝트 시작~종료 범위 알 수 없으니 넓게 1년 (오늘 -1개월 ~ +11개월)
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 11, 31);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', 'list', projectId, startKey, endKey],
    queryFn: () => schedulesApi.list(projectId, { start: startKey, end: endKey }),
    enabled: !!projectId,
  });
  const entries = (data?.entries || []).slice().sort((a, b) =>
    a.date.localeCompare(b.date) || (a.orderIndex || 0) - (b.orderIndex || 0),
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-navy-800 dark:text-navy-200">📌 공정 일정 선택</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="text-center text-sm text-gray-400 py-8">불러오는 중...</div>
          ) : entries.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">
              등록된 일정이 없습니다.
              <div className="text-xs text-gray-300 mt-1">공정 일정 탭에서 먼저 일정을 등록해주세요.</div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {entries.map((e) => {
                const catColor = categoryClass(e.category);
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => onSelect(e)}
                      className="w-full text-left flex items-center gap-3 py-3 px-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded transition"
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-16 flex-shrink-0">
                        {fmtDay(e.date)}
                      </span>
                      {e.category && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${catColor} flex-shrink-0`}>
                          {e.category}
                        </span>
                      )}
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">
                        {e.content}
                      </span>
                      {e.confirmed && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs flex-shrink-0">✓</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
