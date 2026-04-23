import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, rangeGrid, formatDateDot } from '../utils/date';
import ScheduleEntry from './ScheduleEntry';
import InlineScheduleInput from './InlineScheduleInput';
import MobileScheduleSheet from './MobileScheduleSheet';

export default function ScheduleCalendar({ projectId, project }) {
  const queryClient = useQueryClient();
  const [activeCellKey, setActiveCellKey] = useState(null);
  const [mobileSheetKey, setMobileSheetKey] = useState(null);

  const projStartKey = project?.startDate ? project.startDate.slice(0, 10) : null;
  const projEndKey = project?.expectedEndDate ? project.expectedEndDate.slice(0, 10) : null;

  const grid = useMemo(() => {
    if (!projStartKey || !projEndKey) return [];
    return rangeGrid(projStartKey, projEndKey);
  }, [projStartKey, projEndKey]);

  const startKey = grid.length ? toDateKey(grid[0]) : null;
  const endKey = grid.length ? toDateKey(grid[grid.length - 1]) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['schedules', 'project', projectId, startKey, endKey],
    queryFn: () => schedulesApi.list(projectId, { start: startKey, end: endKey }),
    enabled: grid.length > 0,
  });
  const entries = data?.entries || [];
  const loading = isLoading;
  const err = error?.response?.data?.error || (error ? '불러오기 실패' : '');

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['schedules'] });
  }

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
    invalidate();
  }
  function quickAdd(dateKey, content) {
    // 인라인용 — content만 받음. 카테고리/벤더는 추후 ScheduleEntry 편집으로 추가
    addEntry(dateKey, { content }).catch((e) => {
      // 실패해도 silently — 사용자는 이미 다음 셀로 이동
      console.error('quickAdd failed:', e);
    });
  }
  function findNeighborKey(currentKey, direction) {
    const idx = grid.findIndex((d) => toDateKey(d) === currentKey);
    if (idx < 0) return null;
    const step = direction === 'next' ? 1 : -1;
    let target = idx + step;
    while (target >= 0 && target < grid.length) {
      const k = toDateKey(grid[target]);
      if (k >= projStartKey && k <= projEndKey) return k;
      target += step;
    }
    return null;
  }
  const goToCell = useCallback((currentKey, direction) => {
    const k = findNeighborKey(currentKey, direction);
    setActiveCellKey(k);
  }, [grid, projStartKey, projEndKey]);

  function handleCellClick(e, key, inRange) {
    if (!inRange) return;
    if (e.target.closest('button, a, input, select, textarea')) return;
    if (window.innerWidth < 640) {
      setMobileSheetKey(key);
    } else {
      setActiveCellKey(key);
    }
  }

  async function updateEntry(id, payload) {
    await schedulesApi.update(projectId, id, payload);
    invalidate();
  }
  async function deleteEntry(id) {
    await schedulesApi.remove(projectId, id);
    invalidate();
  }
  async function toggleConfirm(id) {
    await schedulesApi.toggleConfirm(projectId, id);
    invalidate();
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
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-gray-400">
            💡 셀 클릭 → 입력 · Enter=같은날 추가 · Tab=다음날
          </span>
          {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
        </div>
      </div>

      {err && <div className="mb-3 text-sm text-red-600 px-2 sm:px-0">{err}</div>}

      {mobileSheetKey && (
        <MobileScheduleSheet
          dateKey={mobileSheetKey}
          entries={byDate[mobileSheetKey] || []}
          onClose={() => setMobileSheetKey(null)}
          onAdd={(payload) => addEntry(mobileSheetKey, payload)}
          onDelete={(id) => deleteEntry(id)}
          onToggleConfirm={(id) => toggleConfirm(id)}
          onNavigate={(direction) => {
            const k = findNeighborKey(mobileSheetKey, direction);
            if (k) setMobileSheetKey(k);
          }}
          canPrev={!!findNeighborKey(mobileSheetKey, 'prev')}
          canNext={!!findNeighborKey(mobileSheetKey, 'next')}
        />
      )}

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

            const isActive = activeCellKey === key;
            return (
              <div
                key={key}
                onClick={(e) => handleCellClick(e, key, inRange)}
                className={`group border-r border-b last:border-r-0 min-h-[68px] sm:min-h-28 flex flex-col overflow-hidden cursor-pointer ${
                  inRange ? 'bg-white' : 'bg-gray-100/70 cursor-default'
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
                      onClick={() => setActiveCellKey(isActive ? null : key)}
                      className="hidden sm:inline-block text-gray-400 hover:text-navy-700 text-base leading-none opacity-0 group-hover:opacity-100 transition"
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
                    <span className="sm:hidden text-[9px] text-gray-400 text-center leading-none">
                      +{dayEntries.length - 3}
                    </span>
                  )}
                  {isActive && inRange && (
                    <InlineScheduleInput
                      onSave={(text) => quickAdd(key, text)}
                      onNavigate={(action) => {
                        if (action === 'next' || action === 'prev') goToCell(key, action);
                        else setActiveCellKey(null);
                      }}
                    />
                  )}
                  {!isActive && inRange && (
                    <button
                      onClick={() => setActiveCellKey(key)}
                      className="hidden sm:block text-[10px] text-gray-300 hover:text-navy-600 hover:bg-navy-50 text-left px-1 py-0.5 rounded mt-auto opacity-0 group-hover:opacity-100 transition"
                    >
                      + 추가
                    </button>
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
