import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loungeApi } from '../api/lounge';
import { useAuth } from '../contexts/AuthContext';

const JOB_ROLE_LABEL = {
  designer: '디자이너',
  site: '현장팀',
  ops: '운영',
  etc: '기타',
};

const REPORT_REASONS = [
  { value: 'spam', label: '스팸' },
  { value: 'abuse', label: '비방·명예훼손' },
  { value: 'client_info', label: '클라이언트 식별 정보' },
  { value: 'malicious_code', label: '악성 코드 의심' },
  { value: 'other', label: '기타' },
];

function relTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}일 전`;
  return d.toISOString().slice(0, 10);
}

// 마크다운 코드 블록(```ruby ... ```)을 <pre>로 변환. 그 외는 줄바꿈 보존.
function renderBody(body) {
  if (!body) return null;
  const parts = [];
  let i = 0;
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0;
  let m;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', value: body.slice(last, m.index) });
    }
    parts.push({ type: 'code', lang: m[1] || '', value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < body.length) parts.push({ type: 'text', value: body.slice(last) });

  return parts.map((p, idx) => {
    if (p.type === 'code') {
      return (
        <pre
          key={idx}
          className="my-3 bg-gray-900 text-gray-100 text-xs p-3 rounded overflow-x-auto whitespace-pre"
        >
          {p.lang && <div className="text-[10px] text-gray-400 mb-1">{p.lang}</div>}
          <code>{p.value}</code>
        </pre>
      );
    }
    return (
      <div key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
        {p.value}
      </div>
    );
  });
}

export default function LoungePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const isSuperAdmin = !!auth?.isSuperAdmin;
  const myUserId = auth?.user?.id;

  const [showEdit, setShowEdit] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'post'|'comment', id }
  const [commentBody, setCommentBody] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['lounge', 'post', postId],
    queryFn: () => loungeApi.getPost(postId),
  });

  const post = data?.post;
  const comments = data?.comments || [];

  const reactionMutation = useMutation({
    mutationFn: () => loungeApi.toggleReaction(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lounge', 'post', postId] }),
  });
  const commentMutation = useMutation({
    mutationFn: (body) => loungeApi.addComment(postId, body),
    onSuccess: () => {
      setCommentBody('');
      queryClient.invalidateQueries({ queryKey: ['lounge', 'post', postId] });
    },
  });
  const removePostMutation = useMutation({
    mutationFn: () => loungeApi.removePost(postId),
    onSuccess: () => navigate('/lounge'),
  });
  const removeCommentMutation = useMutation({
    mutationFn: (id) => loungeApi.removeComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lounge', 'post', postId] }),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-sm text-gray-500">불러오는 중...</div>;
  }
  if (error || !post) {
    return (
      <div className="text-center py-12">
        <div className="text-sm text-gray-500">글을 찾을 수 없습니다.</div>
        <Link to="/lounge" className="text-sm text-navy-700 dark:text-navy-300 hover:underline mt-2 inline-block">
          ← 라운지로
        </Link>
      </div>
    );
  }

  const canEdit = isSuperAdmin || post.author?.id === myUserId;

  function submitComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    commentMutation.mutate(commentBody.trim());
  }

  function confirmRemovePost() {
    if (!confirm('이 글을 삭제할까요?')) return;
    removePostMutation.mutate();
  }
  function confirmRemoveComment(id) {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    removeCommentMutation.mutate(id);
  }

  return (
    <div className="space-y-4">
      <Link to="/lounge" className="text-sm text-gray-500 hover:underline">← 라운지</Link>

      <article className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="font-medium text-navy-700 dark:text-navy-300">
            {categoryLabel(post.category)}
          </span>
          {post.tags.map((t) => (
            <span key={t.key} className="text-gray-400">{t.label}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap border-b border-gray-200 dark:border-gray-800 pb-3">
          <span>{post.author?.name}</span>
          {post.author?.jobRole && <span>· {JOB_ROLE_LABEL[post.author.jobRole]}</span>}
          {post.showCompanyName && post.companyName && <span>· {post.companyName}</span>}
          <span>· {relTime(post.createdAt)}</span>
          {canEdit && (
            <span className="ml-auto flex gap-2 text-xs">
              <button onClick={() => setShowEdit(true)} className="text-gray-600 hover:text-navy-700 dark:hover:text-navy-300">수정</button>
              <button onClick={confirmRemovePost} className="text-gray-600 hover:text-rose-600">삭제</button>
            </span>
          )}
        </div>

        <div className="text-sm">{renderBody(post.body)}</div>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => reactionMutation.mutate()}
            disabled={reactionMutation.isPending}
            className={`px-3 py-1.5 rounded border text-sm flex items-center gap-1.5 transition ${
              post.liked
                ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            ♥ {post.reactionCount}
          </button>
          <button
            onClick={() => setReportTarget({ type: 'post', id: post.id })}
            className="ml-auto text-xs text-gray-500 hover:text-rose-600"
          >
            🚩 신고
          </button>
        </div>
      </article>

      {/* 댓글 */}
      <section className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold">댓글 {comments.length}</h3>

        <form onSubmit={submitComment} className="space-y-2">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            placeholder="댓글을 남겨주세요"
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={commentMutation.isPending || !commentBody.trim()}
              className="px-4 py-1.5 text-sm rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {commentMutation.isPending ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </form>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {comments.length === 0 ? (
            <div className="text-sm text-gray-400 py-4">첫 댓글을 남겨보세요.</div>
          ) : (
            comments.map((c) => {
              const canEditComment = isSuperAdmin || c.author?.id === myUserId;
              return (
                <div key={c.id} className="py-3">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{c.author?.name}</span>
                    {c.author?.jobRole && <span>· {JOB_ROLE_LABEL[c.author.jobRole]}</span>}
                    <span>· {relTime(c.createdAt)}</span>
                    <span className="ml-auto flex gap-2">
                      {canEditComment && (
                        <button
                          onClick={() => confirmRemoveComment(c.id)}
                          className="text-gray-500 hover:text-rose-600"
                        >
                          삭제
                        </button>
                      )}
                      <button
                        onClick={() => setReportTarget({ type: 'comment', id: c.id })}
                        className="text-gray-500 hover:text-rose-600"
                      >
                        🚩
                      </button>
                    </span>
                  </div>
                  <div className="text-sm mt-1 whitespace-pre-wrap break-words">{c.body}</div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {showEdit && (
        <EditPostModal
          post={post}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            queryClient.invalidateQueries({ queryKey: ['lounge', 'post', postId] });
          }}
        />
      )}
      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => {
            setReportTarget(null);
            alert('신고가 접수되었습니다.');
          }}
        />
      )}
    </div>
  );
}

function categoryLabel(key) {
  const map = {
    knowhow: '공정·시공 노하우',
    usage: '수플렉스 사용 팁',
    ruby: '스케치업 루비',
    free: '자유잡담',
    jobs: '구인구직',
    notice: '공지',
  };
  return map[key] || key;
}

function EditPostModal({ post, onClose, onSaved }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body || '');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload) => loungeApi.updatePost(post.id, payload),
    onSuccess: () => onSaved(),
    onError: (e) => setError(e.response?.data?.error || e.message),
  });
  function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return setError('제목·본문을 입력해주세요');
    mutation.mutate({ title, body });
  }
  return (
    <Modal title="글 수정" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
          maxLength={200}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 font-mono"
        />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-700">취소</button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {mutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReportModal({ target, onClose, onSubmitted }) {
  const [reason, setReason] = useState('abuse');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload) =>
      target.type === 'post'
        ? loungeApi.reportPost(target.id, payload)
        : loungeApi.reportComment(target.id, payload),
    onSuccess: () => onSubmitted(),
    onError: (e) => setError(e.response?.data?.error || e.message),
  });
  function submit(e) {
    e.preventDefault();
    mutation.mutate({ reason, detail: detail.trim() || null });
  }
  return (
    <Modal title={`${target.type === 'post' ? '글' : '댓글'} 신고`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">사유</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">상세 (선택)</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-700">취소</button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {mutation.isPending ? '접수 중...' : '신고'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, size = 'md', children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 pb-12 px-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
