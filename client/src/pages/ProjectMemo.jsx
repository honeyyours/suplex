// 프로젝트 메모 — Google Keep 패턴
// 상단: 새 메모 작성 폼 (제목 + 내용 + 저장)
// 하단: 메모 카드 grid — 클릭하면 인라인 편집, 각 카드에 [복사] [삭제]
// 카톡 폭(약 420px) 카드 + 줄별 글자 폭 측정으로 입력 자체를 제한
//   → 사용자가 제한 폭을 넘기면 그 입력은 차단(자동 줄바꿈 X), 줄바꿈은 직접 Enter
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectMemosApi } from '../api/projectMemos';

const SAVE_DELAY = 800;

// 카톡 메시지 풍선 폭에 맞춤. "안녕하세요, 리플레이스 디자인입니다." 한 줄에 들어가는 폭.
const MEMO_WIDTH = 420;
// textarea/input 안쪽 실제 사용 가능 폭 = 카드 폭 - padding - 약간 여유
const MAX_LINE_PX = 388;
// 줄 폭 측정용 폰트 (textarea가 상속하는 sans-serif text-sm 기준)
const MEASURE_FONT = '14px ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

let _measureCanvas = null;
function measureLineWidth(text) {
  if (!_measureCanvas) {
    _measureCanvas = document.createElement('canvas');
    const ctx = _measureCanvas.getContext('2d');
    ctx.font = MEASURE_FONT;
  }
  return _measureCanvas.getContext('2d').measureText(text).width;
}
// 모든 줄이 max 폭 이내면 true
function fitsWidth(text) {
  return text.split('\n').every((line) => measureLineWidth(line) <= MAX_LINE_PX);
}

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

  // 폭 검증 후 setter 호출 — 통과하지 못하면 입력 차단
  const guard = (setter) => (v) => {
    if (fitsWidth(v)) setter(v);
  };

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">
        카톡 메시지 폭에 맞춘 메모장. 줄바꿈은 Enter로 직접 — 자동 줄바꿈 없음, 가로 폭 한도를 넘는 입력은 막힙니다.
      </div>

      {/* 상단: 새 메모 작성 폼 */}
      <div className="flex justify-center">
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-3"
          style={{ width: MEMO_WIDTH }}
        >
          <input
            value={draftTitle}
            onChange={(e) => guard(setDraftTitle)(e.target.value)}
            placeholder="제목 (선택)"
            className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-yellow-800/40 mb-2"
          />
          <textarea
            value={draftContent}
            onChange={(e) => guard(setDraftContent)(e.target.value)}
            wrap="off"
            placeholder="메모 작성..."
            rows={4}
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 placeholder:text-yellow-800/40 whitespace-pre overflow-x-auto"
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

      {/* 하단: 저장된 메모 카드 grid */}
      {memos.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          아직 저장된 메모가 없습니다. 위에서 작성해 보세요.
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center">
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
    if (!fitsWidth(v)) return;
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      onUpdate({ title: v });
    }, SAVE_DELAY);
  }
  function handleContentChange(v) {
    if (!fitsWidth(v)) return;
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
    <div
      className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm hover:shadow-md transition p-3 group"
      style={{ width: MEMO_WIDTH }}
    >
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="제목 (선택)"
        className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-yellow-800/40 mb-2"
      />
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        wrap="off"
        placeholder="메모 작성..."
        rows={Math.min(20, Math.max(3, content.split('\n').length + 1))}
        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-800 placeholder:text-yellow-800/40 whitespace-pre overflow-x-auto"
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
