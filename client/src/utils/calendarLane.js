// 캘린더 lane 시스템 — 같은 주에서 같은 프로젝트는 같은 행에 정렬되도록
// 셀이 달라도 행 위치를 미리 잡아 가로 흐름이 깨지지 않게 한다.
import { toDateKey } from './date';

// week: Date[], byDate: { 'YYYY-MM-DD': entry[] } → { laneStart: Map<projId, lane>, totalLanes }
export function buildLaneInfo(week, byDate) {
  const projFirstSeen = new Map();   // projId -> 그 주에서 처음 등장한 요일 index
  const projMaxPerDay = new Map();   // projId -> 하루 최대 동시 건수
  week.forEach((d, dayIdx) => {
    const key = toDateKey(d);
    const dayEntries = byDate[key] || [];
    const countPerProj = new Map();
    for (const e of dayEntries) {
      const pid = e.project?.id || '__none__';
      countPerProj.set(pid, (countPerProj.get(pid) || 0) + 1);
      if (!projFirstSeen.has(pid)) projFirstSeen.set(pid, dayIdx);
    }
    countPerProj.forEach((cnt, pid) => {
      projMaxPerDay.set(pid, Math.max(projMaxPerDay.get(pid) || 0, cnt));
    });
  });
  // 첫 등장 순서대로 lane 할당 (한 프로젝트가 여러 lane을 차지할 수도 있음 = 하루 동시 N건)
  const projOrder = [...projFirstSeen.keys()].sort(
    (a, b) => projFirstSeen.get(a) - projFirstSeen.get(b)
  );
  const laneStart = new Map();
  let cursor = 0;
  for (const pid of projOrder) {
    laneStart.set(pid, cursor);
    cursor += projMaxPerDay.get(pid);
  }
  return { laneStart, totalLanes: cursor };
}

// info와 그 날의 entry 배열을 받아 slots 배열을 반환 (null = 빈 lane)
export function assignSlots(info, dayEntries) {
  if (!info || info.totalLanes === 0) return [];
  const slots = Array(info.totalLanes).fill(null);
  const consumed = new Map();
  for (const e of dayEntries) {
    const pid = e.project?.id || '__none__';
    const start = info.laneStart.get(pid) ?? 0;
    const offset = consumed.get(pid) || 0;
    slots[start + offset] = e;
    consumed.set(pid, offset + 1);
  }
  return slots;
}
