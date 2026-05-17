import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '../api/checklists';
import { photosApi } from '../api/reports';
import { relativeTime } from '../utils/date';
import InputModal from '../components/InputModal';
import ScheduleLinkSheet from '../components/ScheduleLinkSheet';
import { STANDARD_PHASES } from '../utils/phases';
import { useAuth } from '../contexts/AuthContext';
import { appendKakaoFooter } from '../utils/kakaoFooter';

// 작업자 카톡 양식 — 단일·복수 자동 분기. 회사·현장명 컨텍스트 포함.
// 봉기님 제안(2026-05-17): "회사에서 알려드립니다. 현장 [공정] 확인·처리 부탁드립니다." 톤.
function formatItemsForWorker(items, { company, project, plan }) {
  const companyName = company?.name || '저희';
  const projectName = project?.name || '';
  const lines = [];

  if (items.length === 1) {
    const it = items[0];
    const phaseStr = it.phase ? `[${it.phase}] ` : '';
    lines.push(`${companyName}에서 알려드립니다.`);
    if (projectName) lines.push(`${projectName} ${phaseStr}${it.title}`);
    else lines.push(`${phaseStr}${it.title}`);
    if (it.dueDate) {
      const d = new Date(it.dueDate);
      lines.push(`기한: ${d.getMonth() + 1}/${d.getDate()}`);
    }
    if (it.requiresPhoto) lines.push('※ 처리 후 사진 부탁드립니다');
    lines.push('');
    lines.push('확인·처리 부탁드립니다.');
  } else {
    lines.push(`${companyName}에서 알려드립니다.`);
    if (projectName) lines.push(`${projectName} 아래 항목 확인·처리 부탁드립니다.`);
    else lines.push('아래 항목 확인·처리 부탁드립니다.');
    lines.push('');
    items.forEach((it, idx) => {
      const phaseStr = it.phase ? `[${it.phase}] ` : '';
      const extras = [];
      if (it.dueDate) {
        const d = new Date(it.dueDate);
        extras.push(`기한 ${d.getMonth() + 1}/${d.getDate()}`);
      }
      if (it.requiresPhoto) extras.push('사진 필수');
      const tail = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      lines.push(`${idx + 1}. ${phaseStr}${it.title}${tail}`);
    });
    lines.push('');
    lines.push('감사합니다.');
  }
  return appendKakaoFooter(lines.join('\n'), plan);
}

export default function ProjectChecklist({ projectId } = {}) {
  const params = useParams();
  const id = projectId || params.id;
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [newTitle, setNewTitle] = useState('');
  const [newRequiresPhoto, setNewRequiresPhoto] = useState(false);
  const [newKind, setNewKind] = useState('GENERAL'); // 'GENERAL' | 'DUE'
  const [newDueDate, setNewDueDate] = useState('');
  const [newLinkedSchedule, setNewLinkedSchedule] = useState(null); // {id, date, content, category} — DUE 안에서 일정 가져오기 사용
  const [newTeam, setNewTeam] = useState('AUTO'); // 'AUTO' | 'FIELD' | 'DESIGN' | 'ORDER' | 'OTHER'
  const [newPhase, setNewPhase] = useState(''); // 공정 태그 — 비어있으면 자동 추론
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [err, setErr] = useState('');
  const [editingItem, setEditingItem] = useState(null); // prompt() 대체 — 편집 대상
  // 묶음 카톡 복사 — 작업자에게 여러 항목 한 번에 전달
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCopied, setBulkCopied] = useState(false);

  function toggleSelect(itemId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds(new Set());
  }

  async function copyBulk() {
    const selected = items.filter((it) => selectedIds.has(it.id));
    if (selected.length === 0) return;
    const text = formatItemsForWorker(selected, {
      company: auth?.company,
      project: data?.project,
      plan: auth?.company?.plan,
    });
    try {
      await navigator.clipboard.writeText(text);
      setBulkCopied(true);
      setTimeout(() => {
        setBulkCopied(false);
        exitBulkMode();
      }, 1200);
    } catch (e) {
      alert('복사 실패: ' + (e?.message || ''));
    }
  }

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

  const { upcoming, later, done } = useMemo(() => splitChecklistItems(items), [items]);

  async function add() {
    if (!newTitle.trim()) return;
    if (newKind === 'DUE' && !newDueDate && !newLinkedSchedule) {
      setErr('기한 날짜를 선택하거나 일정에서 가져오거나, "일반"으로 바꿔주세요');
      return;
    }
    try {
      let dueDateIso = null;
      let linkedScheduleId = null;
      if (newKind === 'DUE') {
        if (newLinkedSchedule) {
          // 일정에서 가져온 경우: 그 일정의 날짜 + linkedScheduleId
          dueDateIso = new Date(newLinkedSchedule.date).toISOString();
          linkedScheduleId = newLinkedSchedule.id;
        } else if (newDueDate) {
          dueDateIso = new Date(newDueDate).toISOString();
        }
      }
      await checklistsApi.create(id, {
        title: newTitle.trim(),
        requiresPhoto: newRequiresPhoto,
        dueDate: dueDateIso,
        linkedScheduleId,
        ...(newTeam !== 'AUTO' ? { team: newTeam } : {}),
        ...(newPhase ? { phase: newPhase } : {}),
      });
      setNewTitle('');
      setNewRequiresPhoto(false);
      setNewKind('GENERAL');
      setNewDueDate('');
      setNewLinkedSchedule(null);
      setNewTeam('AUTO');
      setNewPhase('');
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

  function edit(item) {
    setEditingItem(item);
  }

  async function handleEditConfirm(newTitleVal) {
    if (!editingItem) return;
    const trimmed = (newTitleVal || '').trim();
    if (!trimmed || trimmed === editingItem.title) {
      setEditingItem(null);
      return;
    }
    await checklistsApi.update(id, editingItem.id, { title: trimmed });
    setEditingItem(null);
    reload();
  }

  return (
    <div>
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
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
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
          <div className="inline-flex rounded border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => { setNewKind('GENERAL'); setNewDueDate(''); setNewLinkedSchedule(null); }}
              className={`px-3 py-1 ${newKind === 'GENERAL' ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              일반
            </button>
            <button
              type="button"
              onClick={() => setNewKind('DUE')}
              className={`px-3 py-1 border-l ${newKind === 'DUE' ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              기한
            </button>
          </div>
          {newKind === 'DUE' && (
            <div className="flex items-center gap-2 flex-wrap">
              {newLinkedSchedule ? (
                <button
                  type="button"
                  onClick={() => setShowLinkSheet(true)}
                  title="다시 선택"
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 border border-navy-200 bg-navy-50 text-navy-700 rounded hover:bg-navy-100"
                >
                  <span className="tabular-nums">
                    {new Date(newLinkedSchedule.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                  </span>
                  {newLinkedSchedule.category && <span>[{newLinkedSchedule.category}]</span>}
                  <span className="truncate max-w-[140px]">{newLinkedSchedule.content}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); setNewLinkedSchedule(null); }}
                    className="ml-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                  >✕</span>
                </button>
              ) : (
                <>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="border rounded-md px-2 py-1 text-sm bg-white"
                  />
                  <span className="text-xs text-gray-400">또는</span>
                  <button
                    type="button"
                    onClick={() => setShowLinkSheet(true)}
                    className="text-xs px-2 py-1 border border-navy-200 text-navy-700 rounded hover:bg-navy-50"
                  >
                    일정에서 선택
                  </button>
                </>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newRequiresPhoto}
              onChange={(e) => setNewRequiresPhoto(e.target.checked)}
              className="w-4 h-4 accent-navy-700"
            />
            사진 첨부 필수
          </label>
          {/* 공정 태그 — 작업자에게 카톡 복사 시 [전기]처럼 표시. 일정·발주 통합 키. */}
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>공정:</span>
            <select
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value)}
              className="border rounded-md px-2 py-1 text-xs bg-white"
              title="작업자에게 전달할 공정 태그 (선택)"
            >
              <option value="">미지정</option>
              {STANDARD_PHASES.filter((p) => p.key !== 'OTHER').map((p) => (
                <option key={p.key} value={p.label}>{p.label}</option>
              ))}
            </select>
          </label>
          {/* 분류 — 홈 '3일 안에 할 일' 카드 노출 분기. 자동은 제목·공종 키워드로 추론. */}
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>분류:</span>
            <select
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              className="border rounded-md px-2 py-1 text-xs bg-white"
              title="홈 '3일 안에 할 일' 카드에 어느 팀이 보게 할지"
            >
              <option value="AUTO">자동 (제목으로 추론)</option>
              <option value="FIELD">현장</option>
              <option value="DESIGN">디자인</option>
              <option value="ORDER">발주 (양쪽)</option>
              <option value="OTHER">기타 (홈 미노출)</option>
            </select>
          </label>
        </div>
        {displayErr && <div className="mt-2 text-sm text-rose-600">{displayErr}</div>}
      </div>

      {/* 작업자 묶음 카톡 복사 — 항목 다중 선택 → 한 번에 카톡 텍스트 생성 */}
      {!bulkMode && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setBulkMode(true)}
            className="text-xs px-3 py-1.5 border border-navy-200 text-navy-700 bg-white rounded hover:bg-navy-50 transition"
          >
            📋 작업자에게 묶음 복사
          </button>
        </div>
      )}
      {bulkMode && (
        <div className="mb-3 px-3 py-2 bg-navy-50 border border-navy-200 rounded text-xs text-navy-700 flex items-center gap-2">
          <span>항목 선택 후 하단 [복사] 버튼을 눌러주세요</span>
        </div>
      )}

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="space-y-4">
        <Column title="해야할 일" count={upcoming.length}>
          {upcoming.length === 0 ? (
            <Empty text="해야할 항목이 없습니다" />
          ) : (
            upcoming.map((i) => (
              <Item
                key={i.id}
                item={i}
                projectId={id}
                onToggle={toggle}
                onDelete={remove}
                onEdit={edit}
                onChange={reload}
                bulkMode={bulkMode}
                bulkSelected={selectedIds.has(i.id)}
                onBulkToggle={() => toggleSelect(i.id)}
                copyContext={{ company: auth?.company, project: data?.project, plan: auth?.company?.plan }}
              />
            ))
          )}
        </Column>

        <Column title="나중에" count={later.length} collapsible defaultOpen={false}>
          {later.length === 0 ? (
            <Empty text="예정된 항목이 없습니다" />
          ) : (
            later.map((i) => (
              <Item
                key={i.id}
                item={i}
                projectId={id}
                onToggle={toggle}
                onDelete={remove}
                onEdit={edit}
                onChange={reload}
                bulkMode={bulkMode}
                bulkSelected={selectedIds.has(i.id)}
                onBulkToggle={() => toggleSelect(i.id)}
                copyContext={{ company: auth?.company, project: data?.project, plan: auth?.company?.plan }}
              />
            ))
          )}
        </Column>

        <Column title="완료된 일" count={done.length} collapsible defaultOpen={false}>
          {done.length === 0 ? (
            <Empty text="완료된 항목이 없습니다" />
          ) : (
            done.map((i) => (
              <Item
                key={i.id}
                item={i}
                projectId={id}
                onToggle={toggle}
                onDelete={remove}
                onEdit={edit}
                onChange={reload}
                bulkMode={bulkMode}
                bulkSelected={selectedIds.has(i.id)}
                onBulkToggle={() => toggleSelect(i.id)}
                copyContext={{ company: auth?.company, project: data?.project, plan: auth?.company?.plan }}
              />
            ))
          )}
        </Column>
      </div>

      {editingItem && (
        <InputModal
          title="항목 수정"
          defaultValue={editingItem.title}
          confirmLabel="저장"
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {showLinkSheet && (
        <ScheduleLinkSheet
          projectId={id}
          onSelect={(entry) => {
            setNewLinkedSchedule(entry);
            setShowLinkSheet(false);
            setErr('');
          }}
          onClose={() => setShowLinkSheet(false)}
        />
      )}

      {/* 묶음 카톡 복사 모드 — 하단 sticky bar */}
      {bulkMode && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] sm:bottom-6 left-1/2 -translate-x-1/2 z-40 shadow-lg rounded-full bg-navy-800 text-white px-4 py-3 flex items-center gap-3 text-sm">
          <span className="font-medium">
            {selectedIds.size === 0 ? '선택된 항목 없음' : `${selectedIds.size}개 선택`}
          </span>
          <button
            type="button"
            onClick={copyBulk}
            disabled={selectedIds.size === 0}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedIds.size === 0
                ? 'bg-navy-700 text-navy-300 cursor-not-allowed'
                : bulkCopied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-navy-800 hover:bg-navy-50'
            }`}
          >
            {bulkCopied ? '✓ 복사됨' : '📋 카톡 복사'}
          </button>
          <button
            type="button"
            onClick={exitBulkMode}
            className="text-navy-200 hover:text-white text-xs px-2"
          >
            취소
          </button>
        </div>
      )}
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

export function Item({
  item, projectId, onToggle, onDelete, onEdit, onChange,
  showProjectChip = false,
  bulkMode = false,
  bulkSelected = false,
  onBulkToggle,
  copyContext,
}) {
  const photos = item.photos || [];
  const showPhotos = item.requiresPhoto || photos.length > 0;
  const [expanded, setExpanded] = useState(item.requiresPhoto && photos.length === 0);
  const [copied, setCopied] = useState(false);
  const auth = useAuth();
  const effProjectId = projectId || item.project?.id;

  async function copyForWorker() {
    const ctx = copyContext || {
      company: auth?.company,
      project: item.project,
      plan: auth?.company?.plan,
    };
    const text = formatItemsForWorker([item], ctx);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      alert('복사 실패: ' + (e?.message || ''));
    }
  }
  return (
    <div
      className={`bg-white border rounded-md p-3 group transition ${item.isDone ? 'opacity-75' : ''} ${bulkMode && bulkSelected ? 'ring-2 ring-navy-500 bg-navy-50' : ''} ${bulkMode ? 'cursor-pointer' : ''}`}
      onClick={bulkMode ? () => onBulkToggle?.() : undefined}
    >
      <div className="flex items-start gap-2">
        {bulkMode ? (
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => onBulkToggle?.()}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-4 h-4 accent-emerald-600 flex-shrink-0"
            title="작업자 카톡 복사용 선택"
          />
        ) : (
          <input
            type="checkbox"
            checked={item.isDone}
            onChange={() => onToggle(item.id)}
            className="mt-0.5 w-4 h-4 accent-navy-700 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${item.isDone ? 'line-through text-gray-500' : 'text-navy-800'}`}>
            {item.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
            {showProjectChip && item.project && (
              <Link
                to={`/projects/${item.project.id}/checklist`}
                className="px-1.5 py-0.5 bg-navy-50 text-navy-700 rounded hover:bg-navy-100"
              >
                {item.project.name}
              </Link>
            )}
            {item.phase && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{item.phase}</span>
            )}
            <TeamChip team={item.team} />
            {item.dueDate && <DueBadge dueDate={item.dueDate} isDone={item.isDone} />}
            {item.requiresPhoto && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">사진 필수</span>
            )}
            {showPhotos && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                사진 {photos.length}장 {expanded ? '▲' : '▼'}
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
        <div className="sm:opacity-0 sm:group-hover:opacity-100 transition flex gap-1 flex-shrink-0">
          <button
            onClick={copyForWorker}
            title="작업자에게 카톡 복사"
            className={`text-xs px-1 transition ${copied ? 'text-emerald-600' : 'text-gray-500 hover:text-navy-700'}`}
          >
            {copied ? '✓' : '📋'}
          </button>
          {onEdit && !item.isDone && (
            <button
              onClick={() => onEdit(item)}
              className="text-xs text-gray-500 hover:text-navy-700 px-1"
            >✎</button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id, effProjectId)}
              className="text-xs text-gray-500 hover:text-rose-600 px-1"
            >✕</button>
          )}
        </div>
      </div>
      {showPhotos && expanded && effProjectId && (
        <ChecklistPhotos projectId={effProjectId} item={item} onChange={onChange} />
      )}
    </div>
  );
}

// 분류 칩 — 홈 '3일 안에 할 일' 카드 노출 분기와 동일 색상 톤
function TeamChip({ team }) {
  if (!team || team === 'OTHER') return null;
  const map = {
    FIELD:  { label: '현장', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    DESIGN: { label: '디자인', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    ORDER:  { label: '발주', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  };
  const m = map[team];
  if (!m) return null;
  return <span className={`px-1.5 py-0.5 rounded border ${m.cls}`}>{m.label}</span>;
}

// 기한 배지 — D-N + 날짜 텍스트, 긴급도는 색으로 구분
function DueBadge({ dueDate, isDone }) {
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  const md = `${d.getMonth() + 1}/${d.getDate()}`;

  let cls = 'bg-navy-50 text-navy-700';
  let prefix = `D-${diffDays}`;
  if (isDone) {
    cls = 'bg-gray-100 text-gray-500';
    prefix = '';
  } else if (diffDays < 0) {
    cls = 'bg-rose-100 text-rose-700 font-semibold';
    prefix = `${Math.abs(diffDays)}일 지남`;
  } else if (diffDays === 0) {
    cls = 'bg-rose-100 text-rose-700 font-semibold';
    prefix = '오늘 마감';
  } else if (diffDays <= 7) {
    cls = 'bg-amber-100 text-amber-800 font-medium';
  }

  return (
    <span className={`px-1.5 py-0.5 rounded tabular-nums ${cls}`}>
      {prefix ? `${prefix} · ${md}` : `마감 ${md}`}
    </span>
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
            className="absolute top-0.5 right-0.5 bg-black/60 text-white text-xs sm:text-[10px] w-4 h-4 rounded-full leading-none"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-16 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-xs sm:text-[10px] text-gray-400 hover:border-navy-500 hover:text-navy-600 disabled:opacity-50"
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

// 항목을 3섹션으로 분할: 해야할 일(dueDate 없음 OR 7일 이내) / 나중에(7일 초과) / 완료
export function splitChecklistItems(items) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() + 7);
  cutoff.setHours(23, 59, 59, 999);

  const upcoming = [];
  const later = [];
  const done = [];

  for (const i of items) {
    if (i.isDone) { done.push(i); continue; }
    if (!i.dueDate) { upcoming.push(i); continue; }
    const d = new Date(i.dueDate);
    if (d <= cutoff) upcoming.push(i);
    else later.push(i);
  }

  // 정렬: upcoming은 dueDate 오름차순(과거 → 가까운 미래), null은 마지막
  upcoming.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  later.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  done.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return { upcoming, later, done };
}
