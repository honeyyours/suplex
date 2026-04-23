import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi, CATEGORY_META } from '../api/checklists';
import { relativeTime } from '../utils/date';

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
  const loading = isLoading;

  async function toggle(projectId, itemId) {
    try {
      await checklistsApi.toggle(projectId, itemId);
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    } catch (e) {
      alert(e.response?.data?.error || '처리 실패');
    }
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

  const todo = filtered.filter((i) => !i.isDone);
  const done = filtered
    .filter((i) => i.isDone)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          총 {filtered.length}건 · 진행 {todo.length} · 완료 {done.length}
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

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title="해야할 일" count={todo.length} icon="⬜">
          {todo.length === 0 ? (
            <Empty text="진행 중인 항목이 없습니다" />
          ) : (
            todo.map((i) => <Item key={i.id} item={i} onToggle={toggle} />)
          )}
        </Column>
        <Column title="완료된 일" count={done.length} icon="✅" collapsible defaultOpen={false}>
          {done.length === 0 ? (
            <Empty text="완료된 항목이 없습니다" />
          ) : (
            done.map((i) => <Item key={i.id} item={i} onToggle={toggle} />)
          )}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, count, icon, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const header = (
    <>
      <span>{icon}</span>
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

function Item({ item, onToggle }) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META.GENERAL;
  return (
    <div className={`bg-white border rounded-md p-3 ${item.isDone ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={() => onToggle(item.project.id, item.id)}
          className="mt-0.5 w-4 h-4 accent-navy-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${item.isDone ? 'line-through text-gray-500' : 'text-navy-800'}`}>
            {item.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
            <span className={`px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
            {item.requiresPhoto && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                📷 {(item.photos || []).length}장 {item.photos?.length ? '' : '필요'}
              </span>
            )}
            {item.project && (
              <Link
                to={`/projects/${item.project.id}/checklist`}
                className="px-1.5 py-0.5 bg-navy-50 text-navy-700 rounded hover:bg-navy-100"
              >
                {item.project.name}
              </Link>
            )}
            <span className="text-gray-500">
              {item.isDone && item.completedAt
                ? `완료 ${relativeTime(item.completedAt)}`
                : `등록 ${relativeTime(item.createdAt)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
