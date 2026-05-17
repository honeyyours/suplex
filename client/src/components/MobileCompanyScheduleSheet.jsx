// 팀 캘린더 모바일 바텀시트 — 해당 날짜 일정 자세히 보기 + 수정/삭제/추가.
// 2026-05-17: TeamCalendar 모바일 UX 개선. 셀 탭하면 인라인 입력 대신 이 시트가 뜸.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fromDateKey } from '../utils/date';
import { useEscape } from '../hooks/useEscape';

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
  );
}
function IconPlus({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
  );
}
function IconPencil({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  );
}

export default function MobileCompanyScheduleSheet({
  dateKey,
  entries,
  members,
  projects,
  vendors,
  assigneeFilter,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) {
  useEscape(true, onClose);
  const [content, setContent] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState(
    (assigneeFilter && assigneeFilter !== 'unassigned') ? assigneeFilter : ''
  );
  const [newProjectId, setNewProjectId] = useState('');
  const [newVendorId, setNewVendorId] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const date = fromDateKey(dateKey);
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  const dowLabel = DAY_LABELS[date.getDay()];

  async function handleAdd() {
    const trimmed = content.trim();
    if (!trimmed) return;
    await onAdd({
      content: trimmed,
      assigneeId: newAssigneeId || null,
      projectId: newProjectId || null,
      vendorId: newVendorId || null,
      isPrivate: newPrivate,
    });
    setContent('');
    setNewProjectId('');
    setNewVendorId('');
    setNewPrivate(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[18px] max-h-[88vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-1 px-3 pt-1 pb-3 border-b border-[#eef0f4]">
          <div className="flex-1 font-semibold text-[15px] text-navy-900 tracking-tight">
            {dateLabel} <span className="text-gray-500 font-medium text-[13px] ml-1">{dowLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-500"
            aria-label="닫기"
          ><IconX /></button>
        </div>

        {/* 기존 일정 리스트 */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-1 flex flex-col gap-1.5">
          {entries.length === 0 ? (
            <div className="py-7 text-center text-[13px] text-slate-400">
              이 날짜에 등록된 일정이 없습니다.
            </div>
          ) : (
            entries.map((e) => (
              <EntryItem
                key={e.id}
                entry={e}
                isEditing={editingId === e.id}
                onEdit={() => setEditingId(e.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={async (payload) => {
                  await onUpdate(e.id, payload);
                  setEditingId(null);
                }}
                onDelete={() => onDelete(e.id)}
                members={members}
                projects={projects}
                vendors={vendors}
              />
            ))
          )}
        </div>

        {/* 새 일정 입력 */}
        <div className="border-t border-[#eef0f4] bg-white px-3 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="새 일정 입력"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:border-navy-700 placeholder:text-slate-400"
            />
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="w-[38px] h-[38px] inline-flex items-center justify-center rounded-lg bg-navy-700 text-white disabled:bg-gray-200 disabled:text-gray-300"
              aria-label="추가"
            ><IconPlus /></button>
          </div>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="mt-2 text-[11.5px] text-navy-700 active:text-navy-900"
          >
            {moreOpen ? '간단히 −' : '자세히 +'}
          </button>
          {moreOpen && (
            <div className="mt-2 grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <span className="w-14 flex-shrink-0">담당자</span>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                >
                  <option value="">— 전체/미배정 —</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.nickname || m.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <span className="w-14 flex-shrink-0">프로젝트</span>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                >
                  <option value="">— 없음 —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <span className="w-14 flex-shrink-0">거래처</span>
                <select
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                >
                  <option value="">— 없음 —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPrivate}
                  onChange={(e) => setNewPrivate(e.target.checked)}
                  className="w-3.5 h-3.5 accent-navy-700"
                />
                <span>나만보기</span>
              </label>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up { animation: slide-up 0.18s ease-out; }
        `}</style>
      </div>
    </div>
  );
}

function EntryItem({ entry: e, isEditing, onEdit, onCancelEdit, onSave, onDelete, members, projects, vendors }) {
  const [content, setContent] = useState(e.content);
  const [assigneeId, setAssigneeId] = useState(e.assignee?.userId || '');
  const [projectId, setProjectId] = useState(e.project?.id || '');
  const [vendorId, setVendorId] = useState(e.vendor?.id || '');
  const [isPrivate, setIsPrivate] = useState(!!e.isPrivate);

  if (isEditing) {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 space-y-2">
        <input
          value={content}
          onChange={(ev) => setContent(ev.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px]"
          placeholder="내용"
        />
        <div className="grid grid-cols-1 gap-1.5">
          <label className="flex items-center gap-2 text-[11.5px] text-gray-600">
            <span className="w-14 flex-shrink-0">담당자</span>
            <select
              value={assigneeId}
              onChange={(ev) => setAssigneeId(ev.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-[11.5px]"
            >
              <option value="">— 미배정 —</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.nickname || m.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11.5px] text-gray-600">
            <span className="w-14 flex-shrink-0">프로젝트</span>
            <select
              value={projectId}
              onChange={(ev) => setProjectId(ev.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-[11.5px]"
            >
              <option value="">— 없음 —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11.5px] text-gray-600">
            <span className="w-14 flex-shrink-0">거래처</span>
            <select
              value={vendorId}
              onChange={(ev) => setVendorId(ev.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-[11.5px]"
            >
              <option value="">— 없음 —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11.5px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(ev) => setIsPrivate(ev.target.checked)}
              className="w-3.5 h-3.5 accent-navy-700"
            />
            <span>나만보기</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={onCancelEdit}
            className="text-[12px] px-2.5 py-1 border border-gray-300 rounded text-gray-600"
          >취소</button>
          <button
            onClick={() => onSave({
              content: content.trim(),
              assigneeId: assigneeId || null,
              projectId: projectId || null,
              vendorId: vendorId || null,
              isPrivate,
            })}
            disabled={!content.trim()}
            className="text-[12px] px-3 py-1 rounded bg-navy-700 text-white disabled:bg-gray-300"
          >저장</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-[#eef0f4] rounded-lg p-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[13.5px] text-gray-800">
            {e.isPrivate && <span className="text-[11px] opacity-70" title="나만보기">🔒</span>}
            <span className="truncate">{e.content}</span>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-gray-500">
            {e.project && (
              <Link
                to={`/projects/${e.project.id}/schedule`}
                className="text-navy-700 active:text-navy-900 truncate"
              >🏗 {e.project.name}</Link>
            )}
            {e.vendor && <span className="text-violet-700 truncate">🏢 {e.vendor.name}</span>}
            {e.assignee && (
              <span className="truncate">👤 {e.assignee.nickname || e.assignee.name}</span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 active:text-navy-700 rounded flex-shrink-0"
          aria-label="수정"
        ><IconPencil /></button>
        <button
          onClick={() => {
            if (confirm('이 일정을 삭제할까요?')) onDelete();
          }}
          className="p-1.5 text-slate-300 active:text-rose-500 rounded flex-shrink-0"
          aria-label="삭제"
        ><IconX size={14} /></button>
      </div>
    </div>
  );
}
