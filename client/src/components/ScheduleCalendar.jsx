import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { schedulesApi } from '../api/schedules';
import { toDateKey, rangeGrid, formatDateDot } from '../utils/date';
import ScheduleEntry from './ScheduleEntry';
import ScheduleAddForm from './ScheduleAddForm';

export default function ScheduleCalendar({ projectId, project }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingOn, setAddingOn] = useState(null);
  const [err, setErr] = useState('');

  const projStartKey = project?.startDate ? project.startDate.slice(0, 10) : null;
  const projEndKey = project?.expectedEndDate ? project.expectedEndDate.slice(0, 10) : null;

  const grid = useMemo(() => {
    if (!projStartKey || !projEndKey) return [];
    return rangeGrid(projStartKey, projEndKey);
  }, [projStartKey, projEndKey]);

  async function reload() {
    if (!grid.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { entries } = await schedulesApi.list(projectId, {
        start: toDateKey(grid[0]),
        end: toDateKey(grid[grid.length - 1]),
      });
      setEntries(entries);
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.error || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [projectId, projStartKey, projEndKey]);

  const byDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const key = e.date.slice(0, 10);
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [entries]);

  async function addEntry(dateKey, payload) {
    await schedulesApi.create(projectId, { date: dateKey, ...payload });
    reload();
  }
  async function updateEntry(id, payload) {
    await schedulesApi.update(projectId, id, payload);
    reload();
  }
  async function deleteEntry(id) {
    await schedulesApi.remove(projectId, id);
    reload();
  }
  async function toggleConfirm(id) {
    await schedulesApi.toggleConfirm(projectId, id);
    reload();
  }

  // 시작/마감 미설정 시 안내
  if (!projStartKey || !projEndKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <div className="text-3xl mb-2">📅</div>
        <div className="font-semibold text-amber-900 mb-1">프로젝트 기간을 먼저 설정해주세요</div>
        <div className="text-sm text-amber-700 mb-4">
          시작일과 마감일을 설정하면 그 범위만큼 캘린더가 표시됩니다.
        </div>
        <Link
          to={`/projects/${projectId}`}
          className="inline-block text-sm px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
        >
          프로젝트 정보 수정 →
        </Link>
      </div>
    );
  }

  const todayKey = toDateKey(new Date());
  const totalDays = Math.round((new Date(projEndKey) - new Date(projStartKey)) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 px-2 sm:px-0">
        <div className="text-sm text-navy-700">
          <span className="font-semibold">{formatDateDot(projStartKey)}</span>
          <span className="mx-2 text-gray-400">~</span>
          <span className="font-semibold">{formatDateDot(projEndKey)}</span>
          <span className="ml-2 text-xs text-gray-500">(총 {totalDays}일)</span>
        </div>
        {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
      </div>

      {err && <div className="mb-3 text-sm text-red-600 px-2 sm:px-0">{err}</div>}

      <div className="border-y sm:border sm:rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 text-[10px] sm:text-xs font-semibold bg-gray-50 border-b sticky top-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`px-1 sm:px-2 py-1 sm:py-2 text-center ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((date) => {
            const key = toDateKey(date);
            const dayEntries = byDate[key] || [];
            const inRange = key >= projStartKey && key <= projEndKey;
            const isToday = key === todayKey;
            const dayOfWeek = date.getDay();

            return (
              <div
                key={key}
                className={`border-r border-b last:border-r-0 min-h-[68px] sm:min-h-28 flex flex-col overflow-hidden ${
                  inRange ? 'bg-white' : 'bg-gray-100/70'
                }`}
              >
                <div className={`flex items-center justify-between px-1 py-0.5 sm:px-1.5 sm:py-1 text-[10px] sm:text-xs flex-shrink-0 ${
                  !inRange ? 'text-gray-300' :
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1 sm:px-1.5' : ''}`}>
                    {date.getDate()}
                  </span>
                  {inRange && (
                    <button
                      onClick={() => setAddingOn(addingOn === key ? null : key)}
                      className="hidden sm:inline-block text-gray-400 hover:text-navy-700 text-base leading-none"
                      title="일정 추가"
                    >+</button>
                  )}
                </div>
                <div className="px-0.5 sm:px-1 pb-0.5 sm:pb-1 flex flex-col gap-px sm:gap-0.5 flex-1 overflow-hidden [&>div:nth-child(n+4)]:hidden sm:[&>div:nth-child(n+4)]:flex">
                  {dayEntries.map((e) => (
                    <ScheduleEntry
                      key={e.id}
                      entry={e}
                      onUpdate={updateEntry}
                      onDelete={deleteEntry}
                      onToggleConfirm={toggleConfirm}
                    />
                  ))}
                  {dayEntries.length > 3 && (
                    <span className="sm:hidden text-[8px] text-gray-400 text-center leading-none">
                      +{dayEntries.length - 3}
                    </span>
                  )}
                  {addingOn === key && (
                    <ScheduleAddForm
                      onSubmit={(payload) => addEntry(key, payload)}
                      onCancel={() => setAddingOn(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
