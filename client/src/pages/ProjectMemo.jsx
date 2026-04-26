// 프로젝트 메모 — Google Keep 패턴 + 태그 분류 + 검색·필터
// 상단: 새 메모 작성 폼 (제목 + 내용 + 태그 + 저장)
// 중간: 필터 바 (태그 칩 + 검색)
// 하단: 메모 카드 grid (데스크탑 3열) — 태그별 색상, 클릭 인라인 편집, 자동 저장
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectMemosApi } from '../api/projectMemos';

const SAVE_DELAY = 800;

// 태그 정의 — 일반(default) / 회고 / AS / 피드백
// AI 어드바이스 입력 신호로 사용 — 회고/AS/피드백은 의미 분류, 일반은 그 외 자유 메모.
const TAGS = [
  { value: '일반',   color: 'yellow', bg: 'bg-yellow-50',   border: 'border-yellow-200',   chipBg: 'bg-yellow-100',   chipText: 'text-yellow-800',   placeholderText: 'placeholder:text-yellow-800/40' },
  { value: '회고',   color: 'sky',    bg: 'bg-sky-50',      border: 'border-sky-200',      chipBg: 'bg-sky-100',      chipText: 'text-sky-800',      placeholderText: 'placeholder:text-sky-800/40' },
  { value: 'AS',     color: 'rose',   bg: 'bg-rose-50',     border: 'border-rose-200',     chipBg: 'bg-rose-100',     chipText: 'text-rose-800',     placeholderText: 'placeholder:text-rose-800/40' },
  { value: '피드백', color: 'emerald',bg: 'bg-emerald-50',  border: 'border-emerald-200',  chipBg: 'bg-emerald-100',  chipText: 'text-emerald-800',  placeholderText: 'placeholder:text-emerald-800/40' },
];

function tagStyle(tag) {
  return TAGS.find((t) => t.value === tag) || TAGS[0];
}

export default function ProjectMemo() {
  const { id: projectId } = useParams();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 / 검색
  const [filterTag, setFilterTag] = useState('전체'); // '전체' | '일반' | '회고' | 'AS' | '피드백'
  const [searchQ, setSearchQ] = useState('');

  // 새 메모 작성용 (상단 폼)
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTag, setDraftTag] = useState('일반');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { memos } = await projectMemosApi.list(projectId);
      setMemos(memos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [projectId]);

  async function handleCreate() {
    const title = draftTitle.trim();
    const content = draftContent;
    if (!title && !content.trim()) return;
    setCreating(true);
    try {
      const { memo } = await projectMemosApi.create(projectId, { title, content, tag: draftTag });
      setMemos((prev) => [...prev, memo]);
      setDraftTitle('');
      setDraftContent('');
      setDraftTag('일반');
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id, patch) {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    try {
      await projectMemosApi.update(projectId, id, patch);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemove(id) {
    if (!confirm('이 메모를 삭제할까요?')) return;
    try {
      await projectMemosApi.remove(projectId, id);
      setMemos((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 클라이언트측 필터·검색 — 회사 메모 양이 적을 때는 클라이언트 필터링이 즉각적이고 충분
  const filteredMemos = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return memos.filter((m) => {
      if (filterTag !== '전체') {
        const mTag = m.tag || '일반';
        if (mTag !== filterTag) return false;
      }
      if (q) {
        const hay = `${m.title || ''}\n${m.content || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memos, filterTag, searchQ]);

  // 태그별 카운트
  const tagCounts = useMemo(() => {
    const c = { 전체: memos.length };
    for (const t of TAGS) c[t.value] = 0;
    for (const m of memos) {
      const k = m.tag || '일반';
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [memos]);

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  const draftStyle = tagStyle(draftTag);

  return (
    <div className="space-y-4">
      {/* 상단: 새 메모 작성 폼 */}
      <div className="flex justify-center">
        <div className={`${draftStyle.bg} ${draftStyle.border} border rounded-lg shadow-sm p-3 w-full max-w-md`}>
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="제목 (선택)"
            className={`w-full bg-transparent outline-none text-sm font-bold text-gray-800 ${draftStyle.placeholderText} mb-2`}
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="메모 작성..."
            rows={4}
            className={`w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 ${draftStyle.placeholderText}`}
          />
          <div className="flex items-center justify-between mt-2 gap-2">
            <TagSelect value={draftTag} onChange={setDraftTag} />
            <button
              onClick={handleCreate}
              disabled={creating || (!draftTitle.trim() && !draftContent.trim())}
              className="text-xs px-3 py-1 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <FilterChip label="전체" count={tagCounts['전체']} active={filterTag === '전체'} onClick={() => setFilterTag('전체')} />
        {TAGS.map((t) => (
          <FilterChip
            key={t.value}
            label={t.value}
            count={tagCounts[t.value] || 0}
            active={filterTag === t.value}
            chipBg={t.chipBg}
            chipText={t.chipText}
            onClick={() => setFilterTag(t.value)}
          />
        ))}
        <div className="flex-1 min-w-[160px]">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="검색 (제목/본문)"
            className="w-full text-sm px-3 py-1.5 border rounded outline-none focus:border-navy-500"
          />
        </div>
      </div>

      {/* 카드 grid */}
      {filteredMemos.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          {memos.length === 0 ? '아직 저장된 메모가 없습니다. 위에서 작성해 보세요.' : '조건에 맞는 메모가 없습니다.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemos.map((m) => (
            <MemoCard
              key={m.id}
              memo={m}
              onUpdate={(patch) => handleUpdate(m.id, patch)}
              onRemove={() => handleRemove(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, count, active, chipBg, chipText, onClick }) {
  const base = 'text-xs px-2.5 py-1 rounded-full border transition';
  if (active) {
    return (
      <button onClick={onClick} className={`${base} bg-navy-700 text-white border-navy-700`}>
        {label} <span className="opacity-70">({count})</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${chipBg || 'bg-white'} ${chipText || 'text-gray-700'} border-gray-200 hover:border-navy-400`}>
      {label} <span className="opacity-60">({count})</span>
    </button>
  );
}

function TagSelect({ value, onChange }) {
  const s = tagStyle(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded border ${s.chipBg} ${s.chipText} border-transparent outline-none cursor-pointer`}
    >
      {TAGS.map((t) => (
        <option key={t.value} value={t.value}>{t.value}</option>
      ))}
    </select>
  );
}

// 단일 메모 카드 — 클릭 시 자동 저장 (디바운스), 태그별 색상 적용
function MemoCard({ memo, onUpdate, onRemove }) {
  const [title, setTitle] = useState(memo.title || '');
  const [content, setContent] = useState(memo.content || '');
  const [tag, setTag] = useState(memo.tag || '일반');
  const [copied, setCopied] = useState(false);
  const titleTimer = useRef(null);
  const contentTimer = useRef(null);
  const copiedTimer = useRef(null);

  useEffect(() => { setTitle(memo.title || ''); }, [memo.title]);
  useEffect(() => { setContent(memo.content || ''); }, [memo.content]);
  useEffect(() => { setTag(memo.tag || '일반'); }, [memo.tag]);
  useEffect(() => () => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  function handleTitleChange(v) {
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => onUpdate({ title: v }), SAVE_DELAY);
  }
  function handleContentChange(v) {
    setContent(v);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => onUpdate({ content: v }), SAVE_DELAY);
  }
  function handleTagChange(v) {
    setTag(v);
    onUpdate({ tag: v });
  }

  async function copyAll() {
    const out = title ? `${title}\n${content}` : content;
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  const s = tagStyle(tag);

  return (
    <div className={`${s.bg} ${s.border} border rounded-lg shadow-sm hover:shadow-md transition p-3 group`}>
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="제목 (선택)"
        className={`w-full bg-transparent outline-none text-sm font-bold text-gray-800 ${s.placeholderText} mb-2`}
      />
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="메모 작성..."
        rows={Math.min(20, Math.max(3, content.split('\n').length + 1))}
        className={`w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 ${s.placeholderText}`}
      />
      <div className="flex items-center justify-between mt-2 text-xs gap-2">
        <TagSelect value={tag} onChange={handleTagChange} />
        <div className="flex items-center gap-2">
          <button
            onClick={copyAll}
            className={`px-2 py-1 border rounded transition ${copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : `border-gray-300 text-gray-700 hover:bg-white opacity-0 group-hover:opacity-100`
            }`}
          >
            {copied ? '✓ 복사됨' : '전체 복사'}
          </button>
          <button
            onClick={onRemove}
            className="px-2 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
