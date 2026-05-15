// 회사 전체(또는 status별) 프로젝트의 체크리스트 통합 뷰.
// 항목 표시는 ProjectChecklist의 Item을 재사용 — 양식 일관성.
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '../api/checklists';
import {
  splitChecklistItems,
  Item as ChecklistItem,
} from '../pages/ProjectChecklist';

export default function AggregateChecklist({ projectIds }) {
  const queryClient = useQueryClient();
  const [filterProject, setFilterProject] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['checklists', 'all'],
    queryFn: () => checklistsApi.listAll(),
  });
  const allItems = data?.items || [];
  const items = useMemo(() => {
    if (!projectIds) return allItems;
    const set = new Set(projectIds);
    return allItems.filter((i) => i.project && set.has(i.project.id));
  }, [allItems, projectIds]);

  async function toggle(itemId, ctx) {
    // ChecklistItem의 onToggle은 (itemId)만 넘김 — item에서 projectId 추출 필요
    const item = items.find((i) => i.id === itemId);
    const pid = item?.project?.id;
    if (!pid) return;
    try {
      await checklistsApi.toggle(pid, itemId);
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    } catch (e) {
      alert(e.response?.data?.error || '처리 실패');
    }
  }

  async function remove(itemId, projectId) {
    if (!projectId) return;
    if (!confirm('이 항목을 삭제할까요?')) return;
    try {
      await checklistsApi.remove(projectId, itemId);
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    } catch (e) {
      alert(e.response?.data?.error || '삭제 실패');
    }
  }

  function reload() {
    queryClient.invalidateQueries({ queryKey: ['checklists'] });
  }

  const projects = useMemo(() => {
    const m = {};
    items.forEach((i) => {
      if (i.project) m[i.project.id] = i.project.name;
    });
    return m;
  }, [items]);

  const filtered = filterProject
    ? items.filter((i) => i.project?.id === filterProject)
    : items;

  const { upcoming, later, done } = useMemo(() => splitChecklistItems(filtered), [filtered]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-gray-600">
          총 {filtered.length}건 · 진행 {upcoming.length + later.length} · 완료 {done.length}
        </div>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="">모든 프로젝트</option>
          {Object.entries(projects).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="space-y-4">
        <Column title="해야할 일" count={upcoming.length}>
          {upcoming.length === 0 ? (
            <Empty text="해야할 항목이 없습니다" />
          ) : (
            upcoming.map((i) => (
              <ChecklistItem
                key={i.id}
                item={i}
                onToggle={toggle}
                onDelete={remove}
                onChange={reload}
                showProjectChip
              />
            ))
          )}
        </Column>
        <Column title="나중에" count={later.length} collapsible defaultOpen={false}>
          {later.length === 0 ? (
            <Empty text="예정된 항목이 없습니다" />
          ) : (
            later.map((i) => (
              <ChecklistItem
                key={i.id}
                item={i}
                onToggle={toggle}
                onDelete={remove}
                onChange={reload}
                showProjectChip
              />
            ))
          )}
        </Column>
        <Column title="완료된 일" count={done.length} collapsible defaultOpen={false}>
          {done.length === 0 ? (
            <Empty text="완료된 항목이 없습니다" />
          ) : (
            done.map((i) => (
              <ChecklistItem
                key={i.id}
                item={i}
                onToggle={toggle}
                onDelete={remove}
                onChange={reload}
                showProjectChip
              />
            ))
          )}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, count, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const header = (
    <>
      <span>{title} ({count})</span>
      {collapsible && <span className="ml-auto text-gray-400 text-xs">{open ? '▼' : '▶'}</span>}
    </>
  );
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full text-sm font-semibold text-gray-700 flex items-center gap-2 ${open ? 'mb-3' : ''}`}
        >
          {header}
        </button>
      ) : (
        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          {header}
        </div>
      )}
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center text-sm text-gray-400 py-8">{text}</div>;
}
