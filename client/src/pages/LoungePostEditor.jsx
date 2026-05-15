// 라운지 글 작성/수정 페이지.
// - postId 파라미터가 있으면 수정 모드, 없으면 새 글 모드.
// - 페이지 라우트(/lounge/new, /lounge/:postId/edit)에서 사용. 모달 X.
// - 작성 모드: 카테고리·제목·본문(TipTap)·첨부(이미지/파일)·회사명 표시·공지(어드민)
// - 수정 모드: 제목·본문·공지(어드민)만. 첨부는 글 화면(LoungePost)에서 관리.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loungeApi } from '../api/lounge';
import { useAuth } from '../contexts/AuthContext';
import LoungeRichEditor, { plainToHtml } from '../components/LoungeRichEditor';

export default function LoungePostEditor() {
  const { postId } = useParams();
  const isEdit = !!postId;
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isSuperAdmin = !!auth?.isSuperAdmin;

  const [category, setCategory] = useState('free');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyEmpty, setBodyEmpty] = useState(true);
  const [initialHtml, setInitialHtml] = useState('');
  const [showCompanyName, setShowCompanyName] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [images, setImages] = useState([]); // File[] — 신규 모드 첨부
  const [files, setFiles] = useState([]);   // File[] — 신규 모드 첨부
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  // 카테고리 메타 (작성 모드에서만 필요)
  const { data: catData } = useQuery({
    queryKey: ['lounge', 'categories'],
    queryFn: () => loungeApi.categories(),
    enabled: !isEdit,
  });
  const categories = useMemo(() => catData?.categories || [], [catData]);
  const availableCategories = categories.filter((c) => !c.staffOnly || isSuperAdmin);

  // 수정 모드: 기존 글 로드
  const { data: postData, isLoading: loadingPost } = useQuery({
    queryKey: ['lounge', 'post', postId],
    queryFn: () => loungeApi.getPost(postId),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !postData?.post) return;
    const p = postData.post;
    setTitle(p.title || '');
    setCategory(p.category || 'free');
    const html = p.bodyFormat === 'html' ? (p.body || '') : plainToHtml(p.body || '');
    setInitialHtml(html);
    setBody(html);
    setBodyEmpty(!html);
    setIsAnnouncement(!!p.isAnnouncement);
    setIsPrivate(!!p.isPrivate);
    setShowCompanyName(!!p.showCompanyName);
  }, [isEdit, postData]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { post } = await loungeApi.createPost(payload);
      if (images.length > 0) {
        setProgress('이미지 업로드 중…');
        await loungeApi.uploadAttachments(post.id, 'image', images);
      }
      if (files.length > 0) {
        setProgress('파일 업로드 중…');
        await loungeApi.uploadAttachments(post.id, 'file', files);
      }
      return post;
    },
    onSuccess: (post) => navigate(`/lounge/${post.id}`),
    onError: (e) => {
      setProgress('');
      setError(e.response?.data?.error || e.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => loungeApi.updatePost(postId, payload),
    onSuccess: () => navigate(`/lounge/${postId}`),
    onError: (e) => setError(e.response?.data?.error || e.message),
  });

  function pickImages(e) {
    const picked = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  }
  function pickFiles(e) {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  }
  function removeImage(i) { setImages((p) => p.filter((_, idx) => idx !== i)); }
  function removeFile(i) { setFiles((p) => p.filter((_, idx) => idx !== i)); }

  function submit(e) {
    e.preventDefault();
    setError('');
    setProgress('');
    if (!title.trim()) return setError('제목을 입력해주세요');
    if (bodyEmpty) return setError('본문을 입력해주세요');
    if (isPrivate && isAnnouncement) {
      return setError('공지 글은 비공개로 등록할 수 없습니다');
    }
    if (isEdit) {
      const payload = { title, body, bodyFormat: 'html', isPrivate };
      if (isSuperAdmin) payload.isAnnouncement = isAnnouncement;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate({
        category,
        title,
        body,
        bodyFormat: 'html',
        showCompanyName,
        isAnnouncement,
        isPrivate,
      });
    }
  }

  function cancel() {
    if (isEdit) navigate(`/lounge/${postId}`);
    else navigate('/lounge');
  }

  if (isEdit && loadingPost) {
    return <div className="text-center py-12 text-sm text-gray-500">불러오는 중...</div>;
  }
  if (isEdit && postData?.post) {
    const p = postData.post;
    const canEdit = isSuperAdmin || p.author?.id === auth?.user?.id;
    if (!canEdit) {
      return (
        <div className="text-center py-12">
          <div className="text-sm text-gray-500">본인 글만 수정할 수 있습니다.</div>
          <Link to={`/lounge/${postId}`} className="text-sm text-navy-700 dark:text-navy-300 hover:underline mt-2 inline-block">
            ← 글로 돌아가기
          </Link>
        </div>
      );
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link to={isEdit ? `/lounge/${postId}` : '/lounge'} className="text-sm text-gray-500 hover:underline">← {isEdit ? '글로 돌아가기' : '라운지'}</Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {isEdit ? '글 수정' : '라운지 글쓰기'}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              >
                {availableCategories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">본문</label>
            <LoungeRichEditor
              key={isEdit ? `edit-${postId}-${initialHtml ? 'ready' : 'pending'}` : 'new'}
              initialHtml={initialHtml}
              onChange={(html, isEmpty) => { setBody(html); setBodyEmpty(isEmpty); }}
              placeholder="툴바로 굵게·제목·리스트, 🖼 이미지, 📺 유튜브를 본문 안에 넣을 수 있습니다."
              minRows={14}
            />
          </div>

          {/* 신규 모드 첨부 — 수정 모드는 글 화면에서 첨부 관리 */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">이미지 첨부 (최대 5개·5MB)</label>
                <input type="file" accept="image/*" multiple onChange={pickImages} className="text-xs" />
                {images.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {images.map((f, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <span className="truncate flex-1">🖼 {f.name} ({(f.size / 1024).toFixed(0)}KB)</span>
                        <button type="button" onClick={() => removeImage(i)} className="text-rose-600 hover:underline">제거</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">파일 첨부 (최대 5개·20MB, 실행파일 제외)</label>
                <input type="file" multiple onChange={pickFiles} className="text-xs" />
                {files.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {files.map((f, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <span className="truncate flex-1">📎 {f.name} ({(f.size / 1024).toFixed(0)}KB)</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-rose-600 hover:underline">제거</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showCompanyName} onChange={(e) => setShowCompanyName(e.target.checked)} />
                내 회사명을 함께 표시
              </label>
            </>
          )}

          <label className="flex items-start gap-2 text-sm bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded p-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => {
                setIsPrivate(e.target.checked);
                if (e.target.checked) setIsAnnouncement(false);
              }}
              className="mt-0.5"
            />
            <span>
              🔒 <b>비공개</b>로 등록
              <span className="block text-xs text-gray-500 mt-0.5">
                작성자 본인과 운영자(슈퍼어드민)만 글·댓글을 열람할 수 있습니다. 1:1 문의·민감한 정보 공유에 사용하세요.
              </span>
            </span>
          </label>

          {isSuperAdmin && (
            <label className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded p-2">
              <input
                type="checkbox"
                checked={isAnnouncement}
                disabled={isPrivate}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
              />
              <span>
                📢 <b>공지</b>로 등록 — 모든 카테고리 상단에 핀
                {isPrivate && <span className="ml-1 text-xs text-gray-500">(비공개와 동시 사용 불가)</span>}
              </span>
            </label>
          )}

          {progress && <div className="text-sm text-navy-700">{progress}</div>}
          {error && <div className="text-sm text-rose-600">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {submitting ? '등록 중...' : isEdit ? '저장' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
