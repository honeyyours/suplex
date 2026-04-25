// 프로젝트 메모 — Google Keep 패턴
// 상단: 새 메모 작성 폼 (제목 + 내용 + 저장)
// 하단: 메모 카드 grid (데스크탑 3열) — 클릭하면 인라인 편집, hover 시 [복사] [삭제]
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectMemosApi } from '../api/projectMemos';

const SAVE_DELAY = 800;

export default function ProjectMemo() {
  const { id: projectId } = useParams();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 새 메모 작성용 (상단 폼)
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
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
      const { memo } = await projectMemosApi.create(projectId, { title, content });
      setMemos((prev) => [...prev, memo]);
      setDraftTitle('');
      setDraftContent('');
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

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      {/* 상단: 새 메모 작성 폼 (가운데 단일 카드) */}
      <div className="flex justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-3 w-full max-w-md">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="제목 (선택)"
            className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-yellow-800/40 mb-2"
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="메모 작성..."
            rows={4}
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 placeholder:text-yellow-800/40"
          />
          <div className="flex justify-end mt-2">
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

      {/* 하단: 저장된 메모 카드 grid (모바일 1, 태블릿 2, 데스크탑 3열) */}
      {memos.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          아직 저장된 메모가 없습니다. 위에서 작성해 보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memos.map((m) => (
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

// 단일 메모 카드 — 클릭(또는 직접 input/textarea 편집) 시 자동 저장 (디바운스)
function MemoCard({ memo, onUpdate, onRemove }) {
  const [title, setTitle] = useState(memo.title || '');
  const [content, setContent] = useState(memo.content || '');
  const [copied, setCopied] = useState(false);
  const titleTimer = useRef(null);
  const contentTimer = useRef(null);
  const copiedTimer = useRef(null);

  useEffect(() => { setTitle(memo.title || ''); }, [memo.title]);
  useEffect(() => { setContent(memo.content || ''); }, [memo.content]);
  useEffect(() => () => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  function handleTitleChange(v) {
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      onUpdate({ title: v });
    }, SAVE_DELAY);
  }
  function handleContentChange(v) {
    setContent(v);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => {
      onUpdate({ content: v });
    }, SAVE_DELAY);
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

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm hover:shadow-md transition p-3 group">
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="제목 (선택)"
        className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-yellow-800/40 mb-2"
      />
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="메모 작성..."
        rows={Math.min(20, Math.max(3, content.split('\n').length + 1))}
        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 placeholder:text-yellow-800/40"
      />
      <div className="flex items-center justify-end mt-2 text-xs gap-2">
        <button
          onClick={copyAll}
          className={`px-2 py-1 border rounded transition ${copied
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-yellow-300 text-yellow-800 hover:bg-yellow-100 opacity-0 group-hover:opacity-100'
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
  );
}
