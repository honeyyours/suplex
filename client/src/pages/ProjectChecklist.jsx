import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi, CATEGORY_META, CATEGORY_KEYS } from '../api/checklists';
import { checklistTemplatesApi, projectChecklistsApi } from '../api/checklistTemplates';
import { photosApi } from '../api/reports';
import { relativeTime } from '../utils/date';

export default function ProjectChecklist({ projectId } = {}) {
  const params = useParams();
  const id = projectId || params.id;
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newRequiresPhoto, setNewRequiresPhoto] = useState(false);
  const [err, setErr] = useState('');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

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
        requiresPhoto: newRequiresPhoto,
      });
      setNewTitle('');
      setNewCategory('GENERAL');
      setNewRequiresPhoto(false);
      reload();
    } catch (e) {
      setErr(e.response?.data?.error || '추가 실패');
    }
  }

  async function toggle(itemId) {
    try {
      await checklistsApi.toggle(id, itemId);
      reload();
    } catch (e) {
      const msg = e.response?.data?.error || '처리 실패';
      alert(msg);
    }
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
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setTemplatePickerOpen(true)}
            className="text-xs px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
          >
            📋 템플릿에서 가져오기
          </button>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
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
            placeholder="새 항목 (예: 철거 전/후 사진)"
            className="flex-1 min-w-[160px] border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          />
          <button
            onClick={add}
            className="px-4 bg-navy-700 text-white rounded-md text-sm hover:bg-navy-800"
          >
            추가
          </button>
        </div>
        <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={newRequiresPhoto}
            onChange={(e) => setNewRequiresPhoto(e.target.checked)}
            className="w-4 h-4 accent-navy-700"
          />
          📷 사진 첨부 필수 (사진 없으면 완료 체크 불가)
        </label>
        {displayErr && <div className="mt-2 text-sm text-red-600">{displayErr}</div>}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title="해야할 일" count={todo.length} icon="⬜">
          {todo.length === 0 ? (
            <Empty text="모두 처리됐습니다" />
          ) : (
            todo.map((i) => (
              <Item key={i.id} item={i} projectId={id} onToggle={toggle} onDelete={remove} onEdit={edit} onChange={reload} />
            ))
          )}
        </Column>

        <Column title="완료된 일" count={done.length} icon="✅" collapsible defaultOpen={false}>
          {done.length === 0 ? (
            <Empty text="완료된 항목이 없습니다" />
          ) : (
            done.map((i) => (
              <Item key={i.id} item={i} projectId={id} onToggle={toggle} onDelete={remove} onEdit={edit} onChange={reload} />
            ))
          )}
        </Column>
      </div>

      {templatePickerOpen && (
        <TemplatePicker
          projectId={id}
          existingTemplateIds={items.map((i) => i.sourceTemplateId).filter(Boolean)}
          onClose={() => setTemplatePickerOpen(false)}
          onAdded={() => { setTemplatePickerOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function TemplatePicker({ projectId, existingTemplateIds, onClose, onAdded }) {
  const [templates, setTemplates] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const existingSet = useMemo(() => new Set(existingTemplateIds), [existingTemplateIds]);

  useEffect(() => {
    checklistTemplatesApi.list({ active: true })
      .then(({ templates }) => setTemplates(templates))
      .catch(() => setTemplates([]));
  }, []);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAllVisible(list) {
    const next = new Set(selected);
    for (const t of list) if (!existingSet.has(t.id)) next.add(t.id);
    setSelected(next);
  }

  async function add() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await projectChecklistsApi.fromTemplates(projectId, [...selected]);
      const msg = res.skipped
        ? `${res.created}개 추가됨 (이미 있는 ${res.skipped}개는 스킵)`
        : `${res.created}개 추가됨`;
      alert(`✅ ${msg}`);
      onAdded();
    } catch (e) {
      alert('추가 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const g = {};
    for (const t of templates || []) {
      const key = t.phase || '(공종 없음)';
      (g[key] ||= []).push(t);
    }
    return g;
  }, [templates]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold text-navy-800">📋 체크리스트 템플릿에서 가져오기</div>
          <button onClick={onClose} className="text-gray-400 px-2">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {templates === null && <div className="text-sm text-gray-400">불러오는 중...</div>}
          {templates && templates.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">
              등록된 템플릿이 없습니다. 설정 → 체크리스트 템플릿에서 추가하세요.
            </div>
          )}
          {templates && templates.length > 0 && Object.entries(grouped).map(([phase, list]) => (
            <div key={phase}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-semibold text-gray-700">{phase}</div>
                <button
                  onClick={() => selectAllVisible(list)}
                  className="text-[11px] text-navy-700 hover:underline"
                >
                  이 공종 전체 선택
                </button>
              </div>
              <div className="space-y-1">
                {list.map((t) => {
                  const already = existingSet.has(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-2 px-2 py-1.5 border rounded text-sm ${already ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={already}
                        checked={selected.has(t.id)}
                        onChange={() => toggle(t.id)}
                        className="w-4 h-4 accent-navy-700"
                      />
                      <span className="flex-1">{t.title}</span>
                      {t.requiresPhoto && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">📷</span>
                      )}
                      {already && <span className="text-[10px] text-gray-400">이미 있음</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border rounded">취소</button>
          <button
            onClick={add}
            disabled={selected.size === 0 || busy}
            className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
          >
            {busy ? '추가 중...' : `${selected.size}개 추가`}
          </button>
        </div>
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

function Item({ item, projectId, onToggle, onDelete, onEdit, onChange }) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META.GENERAL;
  const photos = item.photos || [];
  const showPhotos = item.requiresPhoto || photos.length > 0;
  const [expanded, setExpanded] = useState(item.requiresPhoto && photos.length === 0);
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
          <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
            <span className={`px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
            {item.phase && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{item.phase}</span>
            )}
            {item.dueDate && (
              <span className="px-1.5 py-0.5 rounded bg-navy-50 text-navy-700">
                📅 {new Date(item.dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </span>
            )}
            {item.requiresPhoto && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">📷 사진 필수</span>
            )}
            {showPhotos && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                📷 {photos.length}장 {expanded ? '▲' : '▼'}
              </button>
            )}
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
      {showPhotos && expanded && (
        <ChecklistPhotos projectId={projectId} item={item} onChange={onChange} />
      )}
    </div>
  );
}

function ChecklistPhotos({ projectId, item, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const photos = item.photos || [];

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      await photosApi.upload(projectId, {
        source: 'CHECKLIST',
        sourceId: item.id,
        files,
      });
      onChange();
    } catch (err) {
      const msg = err.response?.data?.error || '사진 업로드 실패';
      const hint = err.response?.data?.hint;
      alert(`${msg}${hint ? '\n\n' + hint : ''}`);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function removePhoto(photoId) {
    if (!confirm('이 사진을 삭제할까요?')) return;
    try {
      await photosApi.remove(projectId, photoId);
      onChange();
    } catch (err) {
      alert(err.response?.data?.error || '삭제 실패');
    }
  }

  return (
    <div className="mt-2 pl-6 flex flex-wrap gap-1.5">
      {photos.map((p) => (
        <div key={p.id} className="relative w-16 h-16 rounded overflow-hidden border">
          <a href={p.url} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
          </a>
          <button
            type="button"
            onClick={() => removePhoto(p.id)}
            className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] w-4 h-4 rounded-full leading-none"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-16 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-[10px] text-gray-400 hover:border-navy-500 hover:text-navy-600 disabled:opacity-50"
      >
        {busy ? (
          <span>업로드중</span>
        ) : (
          <>
            <span className="text-lg leading-none">+</span>
            <span>사진</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        className="hidden"
      />
    </div>
  );
}
