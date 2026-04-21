import { useEffect, useMemo, useState } from 'react';
import { schedulesApi } from '../api/schedules';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel,
} from '../utils/date';
import ScheduleEntry from './ScheduleEntry';
import ScheduleAddForm from './ScheduleAddForm';

export default function ScheduleCalendar({ projectId, project }) {
  const [current, setCurrent] = useState(() => {
    const start = project?.startDate ? new Date(project.startDate) : new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingOn, setAddingOn] = useState(null); // dateKey currently adding
  const [err, setErr] = useState('');

  const grid = useMemo(
    () => calendarGrid(current.getFullYear(), current.getMonth()),
    [current]
  );

  const rangeStart = grid[0];
  const rangeEnd = grid[grid.length - 1];

  async function reload() {
    setLoading(true);
    try {
      const { entries } = await schedulesApi.list(projectId, {
        start: toDateKey(rangeStart),
        end: toDateKey(rangeEnd),
      });
      setEntries(entries);
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.error || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [projectId, current]);

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

  const todayKey = toDateKey(new Date());
  const projStart = project?.startDate ? project.startDate.slice(0, 10) : null;
  const projEnd = project?.expectedEndDate ? project.expectedEndDate.slice(0, 10) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >‹</button>
          <div className="font-semibold text-lg text-navy-800 min-w-24 text-center">
            {formatMonthLabel(current)}
          </div>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >›</button>
          <button
            onClick={() => setCurrent(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="ml-2 text-xs px-2 py-1 text-navy-700 hover:bg-navy-50 rounded"
          >오늘</button>
        </div>
        {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
      </div>

      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 text-xs font-semibold bg-gray-50 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`px-2 py-2 text-center ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((date) => {
            const key = toDateKey(date);
            const dayEntries = byDate[key] || [];
            const isCurrentMonth = date.getMonth() === current.getMonth();
            const isToday = key === todayKey;
            const inProjectRange =
              (!projStart || key >= projStart) && (!projEnd || key <= projEnd);
            const dayOfWeek = date.getDay();

            return (
              <div
                key={key}
                className={`border-r border-b last:border-r-0 min-h-28 flex flex-col ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                } ${!inProjectRange ? 'opacity-60' : ''}`}
              >
                <div className={`flex items-center justify-between px-1.5 py-1 text-xs ${
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1.5' : ''}`}>
                    {date.getDate()}
                  </span>
                  <button
                    onClick={() => setAddingOn(addingOn === key ? null : key)}
                    className="text-gray-400 hover:text-navy-700 text-base leading-none"
                    title="일정 추가"
                  >+</button>
                </div>
                <div className="px-1 pb-1 flex flex-col gap-0.5 flex-1">
                  {dayEntries.map((e) => (
                    <ScheduleEntry
                      key={e.id}
                      entry={e}
                      onUpdate={updateEntry}
                      onDelete={deleteEntry}
                      onToggleConfirm={toggleConfirm}
                    />
                  ))}
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
