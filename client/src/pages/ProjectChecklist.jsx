import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi, CATEGORY_META, CATEGORY_KEYS } from '../api/checklists';
import { relativeTime } from '../utils/date';

export default function ProjectChecklist({ projectId } = {}) {
  const params = useParams();
  const id = projectId || params.id;
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [err, setErr] = useState('');

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['checklists', 'project', id],
    queryFn: () => checklistsApi.list(id),
    enabled: !!id,
  });
  const items = data?.items || [];
  const loading = isLoading;
  const displayErr = err || (queryError ? (queryError.response?.data?.error || '불러오기 실패') : '');

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['checklists'] });
  }

  const { todo, done } = useMemo(() => {
    const t = items.filter((i) => !i.isDone);
    const d = items.filter((i) => i.isDone)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return { todo: t, done: d };
  }, [items]);

  async function add() {
    if (!newTitle.trim()) return;
    try {
      await checklistsApi.create(id, {
        title: newTitle.trim(),
        category: newCategory,
      });
      setNewTitle('');
      setNewCategory('GENERAL');
      reload();
    } catch (e) {
      setErr(e.response?.data?.error || '추가 실패');
    }
  }

  async function toggle(itemId) {
    await checklistsApi.toggle(id, itemId);
    reload();
  }

  async function remove(itemId) {
    if (!confirm('이 항목을 삭제할까요?')) return;
    await checklistsApi.remove(id, itemId);
    reload();
  }

  async function edit(item) {
    const newTitleVal = prompt('항목 수정:', item.title);
    if (!newTitleVal || newTitleVal.trim() === item.title) return;
    await checklistsApi.update(id, item.id, { title: newTitleVal.trim() });
    reload();
  }

  return (
    <div>
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border rounded-md px-2 py-2 text-sm bg-white"
          >
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>{CATEGORY_META[k].label}</option>
            ))}
          </select>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="새 항목 (예: 주방 타일 색상 확인)"
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          />
          <button
            onClick={add}
            className="px-4 bg-navy-700 text-white rounded-md text-sm hover:bg-navy-800"
          >
            추가
          </button>
        </div>
        {displayErr && <div className="mt-2 text-sm text-red-600">{displayErr}</div>}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title="해야할 일" count={todo.length} icon="⬜">
          {todo.length === 0 ? (
            <Empty text="모두 처리됐습니다" />
          ) : (
            todo.map((i) => (
              <Item key={i.id} item={i} onToggle={toggle} onDelete={remove} onEdit={edit} />
            ))
          )}
        </Column>

        <Column title="완료된 일" count={done.length} icon="✅" collapsible defaultOpen={false}>
          {done.length === 0 ? (
            <Empty text="완료된 항목이 없습니다" />
          ) : (
            done.map((i) => (
              <Item key={i.id} item={i} onToggle={toggle} onDelete={remove} onEdit={edit} />
            ))
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

function Item({ item, onToggle, onDelete, onEdit }) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META.GENERAL;
  return (
    <div className={`bg-white border rounded-md p-3 group ${item.isDone ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={() => onToggle(item.id)}
          className="mt-0.5 w-4 h-4 accent-navy-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${item.isDone ? 'line-through text-gray-500' : 'text-navy-800'}`}>
            {item.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px]">
            <span className={`px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
            <span className="text-gray-500">
              {item.isDone && item.completedAt
                ? `완료 ${relativeTime(item.completedAt)}`
                : `등록 ${relativeTime(item.createdAt)}`}
              {item.isDone && item.completedBy && ` · ${item.completedBy.name}`}
            </span>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
          {!item.isDone && (
            <button
              onClick={() => onEdit(item)}
              className="text-xs text-gray-500 hover:text-navy-700 px-1"
            >✎</button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-gray-500 hover:text-red-600 px-1"
          >✕</button>
        </div>
      </div>
    </div>
  );
}
