import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loungeApi } from '../api/lounge';
import { useAuth } from '../contexts/AuthContext';

const JOB_ROLE_OPTIONS = [
  { value: 'designer', label: '디자이너' },
  { value: 'site', label: '현장팀' },
  { value: 'ops', label: '운영' },
  { value: 'etc', label: '기타' },
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

function jobRoleLabel(role) {
  return JOB_ROLE_OPTIONS.find((o) => o.value === role)?.label || null;
}

export default function Lounge() {
  const { auth, updateMe } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showWrite, setShowWrite] = useState(false);
  const [showMeEdit, setShowMeEdit] = useState(false);
  const navigate = useNavigate();

  // 닉네임 없는 기존 사용자는 입력 강제 (슈퍼어드민도 동일).
  // 회원가입 흐름 변경(2026-05-14) 이전 가입자 호환.
  const needsNickname = !!auth && !auth.user?.nickname;

  const { data: catData } = useQuery({
    queryKey: ['lounge', 'categories'],
    queryFn: () => loungeApi.categories(),
    staleTime: 60_000,
  });
  const { data: meData, refetch: refetchMe } = useQuery({
    queryKey: ['lounge', 'me'],
    queryFn: () => loungeApi.me(),
    staleTime: 5 * 60_000,
  });

  const queryParams = useMemo(() => {
    const p = {};
    if (activeCategory !== 'all') p.category = activeCategory;
    if (search) p.search = search;
    return p;
  }, [activeCategory, search]);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['lounge', 'posts', queryParams],
    queryFn: () => loungeApi.posts(queryParams),
    keepPreviousData: true,
  });

  function applySearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  const categories = catData?.categories || [];
  const isSuperAdmin = meData?.isSuperAdmin;
  const noLoungeAccess = !meData?.isSuperAdmin && (!meData?.membership || meData.membership.status !== 'active');

  if (noLoungeAccess && meData) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold mb-2">라운지 접근 권한이 없습니다</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          라운지는 승인된 회사의 멤버에게 자동으로 부여됩니다. 회사 승인 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  // 닉네임 미설정 사용자는 입력 강제 (모달 외 모든 UI 차단)
  if (needsNickname) {
    return <NicknameSetupModal onSaved={(nickname) => updateMe({ nickname })} />;
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">라운지</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            인테리어 회사 디자이너·현장팀이 모이는 클로즈드 커뮤니티입니다. 거래처 실명 비방·클라이언트 식별 정보·AI 자문 요청 글은 금지됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meData?.membership && (
            <button
              onClick={() => setShowMeEdit(true)}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="내 라운지 프로필"
            >
              {meData.membership.selfLabel || jobRoleLabel(meData.membership.jobRole) || '내 프로필'}
            </button>
          )}
          <button
            onClick={() => setShowWrite(true)}
            className="text-sm px-4 py-2 rounded bg-navy-700 text-white hover:bg-navy-800"
          >
            + 글쓰기
          </button>
        </div>
      </header>

      {/* 검색 */}
      <form onSubmit={applySearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목·본문 검색"
          className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          className="px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          검색
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:underline"
          >
            ✕
          </button>
        )}
      </form>

      {/* 게시판 표 */}
      <div className="border border-gray-200 dark:border-gray-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 w-16 text-center font-medium">번호</th>
              <th className="px-3 py-2 text-left font-medium">제목</th>
              <th className="px-3 py-2 w-32 text-center font-medium hidden sm:table-cell">글쓴이</th>
              <th className="px-3 py-2 w-24 text-center font-medium hidden md:table-cell">작성일</th>
              <th className="px-3 py-2 w-16 text-center font-medium hidden md:table-cell">조회</th>
              <th className="px-3 py-2 w-16 text-center font-medium hidden md:table-cell">추천</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* 공지 — 상단 고정 */}
            {(postsData?.announcements || []).map((p) => (
              <PostRow key={p.id} post={p} categories={categories} isNotice />
            ))}
            {/* 일반 글 */}
            {isLoading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">불러오는 중...</td></tr>
            ) : (postsData?.items?.length || 0) === 0 && (postsData?.announcements?.length || 0) === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">아직 글이 없습니다. 첫 글을 작성해보세요.</td></tr>
            ) : (
              (postsData?.items || []).map((p, idx) => (
                <PostRow
                  key={p.id}
                  post={p}
                  categories={categories}
                  rowNumber={(postsData?.items?.length || 0) - idx}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showWrite && (
        <WriteModal
          categories={categories}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowWrite(false)}
          onCreated={(post) => {
            setShowWrite(false);
            navigate(`/lounge/${post.id}`);
          }}
        />
      )}
      {showMeEdit && meData?.membership && (
        <MeEditModal
          me={meData.membership}
          onClose={() => setShowMeEdit(false)}
          onSaved={() => {
            setShowMeEdit(false);
            refetchMe();
          }}
        />
      )}
    </div>
  );
}

function PostRow({ post: p, categories, isNotice = false, rowNumber }) {
  const catLabel = categories.find((c) => c.key === p.category)?.label || p.category;
  const authorName = p.author?.nickname || p.author?.name || '—';
  const dateStr = formatDate(p.createdAt);
  const rowClass = isNotice
    ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
    : 'hover:bg-gray-50 dark:hover:bg-gray-900';
  return (
    <tr className={rowClass}>
      <td className="px-3 py-2 text-center text-xs text-gray-500 tabular-nums">
        {isNotice ? (
          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-semibold">공지</span>
        ) : (
          rowNumber
        )}
      </td>
      <td className="px-3 py-2">
        <Link to={`/lounge/${p.id}`} className="hover:underline text-navy-800 dark:text-navy-200">
          <span className="text-[11px] text-gray-400 mr-1">[{catLabel}]</span>
          <span className={isNotice ? 'font-semibold' : 'font-medium'}>{p.title}</span>
          {p.commentCount > 0 && (
            <span className="ml-1 text-xs text-rose-600 dark:text-rose-400">[{p.commentCount}]</span>
          )}
          {p.attachmentCount > 0 && (
            <span className="ml-1 text-xs text-gray-400">📎</span>
          )}
        </Link>
        {/* 모바일: 메타 정보 한 줄로 노출 */}
        <div className="sm:hidden text-[11px] text-gray-500 mt-0.5">
          {authorName} · {dateStr} · 조회 {p.viewCount || 0} · ♥ {p.reactionCount}
        </div>
      </td>
      <td className="px-3 py-2 text-center text-xs text-gray-700 dark:text-gray-300 hidden sm:table-cell truncate">
        {authorName}
      </td>
      <td className="px-3 py-2 text-center text-xs text-gray-500 tabular-nums hidden md:table-cell">
        {dateStr}
      </td>
      <td className="px-3 py-2 text-center text-xs text-gray-500 tabular-nums hidden md:table-cell">
        {p.viewCount || 0}
      </td>
      <td className="px-3 py-2 text-center text-xs text-gray-500 tabular-nums hidden md:table-cell">
        {p.reactionCount || 0}
      </td>
    </tr>
  );
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  // 같은 날이면 시:분 표시, 아니면 YY.MM.DD
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function WriteModal({ categories, isSuperAdmin, onClose, onCreated }) {
  const [category, setCategory] = useState('free');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showCompanyName, setShowCompanyName] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [images, setImages] = useState([]); // File[]
  const [rubyFiles, setRubyFiles] = useState([]); // File[]
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const availableCategories = categories.filter((c) => !c.staffOnly || isSuperAdmin);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { post } = await loungeApi.createPost(payload);
      // 첨부 업로드 — 글 생성 후 2단계
      if (images.length > 0) {
        setProgress('이미지 업로드 중…');
        await loungeApi.uploadAttachments(post.id, 'image', images);
      }
      if (rubyFiles.length > 0) {
        setProgress('루비 파일 업로드 중…');
        await loungeApi.uploadAttachments(post.id, 'ruby', rubyFiles);
      }
      return post;
    },
    onSuccess: (post) => onCreated(post),
    onError: (e) => {
      setProgress('');
      setError(e.response?.data?.error || e.message);
    },
  });

  function pickImages(e) {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  }
  function pickRuby(e) {
    const files = Array.from(e.target.files || []);
    setRubyFiles((prev) => [...prev, ...files].slice(0, 3));
    e.target.value = '';
  }
  function removeImage(i) { setImages((p) => p.filter((_, idx) => idx !== i)); }
  function removeRuby(i) { setRubyFiles((p) => p.filter((_, idx) => idx !== i)); }

  function submit(e) {
    e.preventDefault();
    setError('');
    setProgress('');
    if (!title.trim()) return setError('제목을 입력해주세요');
    if (!body.trim()) return setError('본문을 입력해주세요');
    mutation.mutate({ category, title, body, showCompanyName, isAnnouncement });
  }

  const isRuby = category === 'ruby';

  return (
    <Modal title="라운지 글쓰기" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-3">
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
          <label className="block text-xs font-medium mb-1">
            본문 {isRuby && <span className="text-gray-500">(코드 블록은 ```ruby ... ```)</span>}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={isRuby ? 14 : 10}
            placeholder={
              isRuby
                ? '스케치업 버전 / 사용법 / 주의사항을 적어주세요.\n\n```ruby\n# 코드 블록 예시\n```'
                : '마크다운 지원'
            }
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 font-mono"
          />
        </div>

        {/* 이미지 첨부 (최대 5개·5MB) */}
        <div>
          <label className="block text-xs font-medium mb-1">이미지 첨부 (최대 5개·5MB)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={pickImages}
            className="text-xs"
          />
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

        {/* 루비 파일 첨부 — 루비 카테고리 + 슈퍼어드민 우대 (모든 사용자도 가능) */}
        {(isRuby || rubyFiles.length > 0) && (
          <div>
            <label className="block text-xs font-medium mb-1">.rb 파일 첨부 (최대 3개·1MB)</label>
            <input
              type="file"
              accept=".rb"
              multiple
              onChange={pickRuby}
              className="text-xs"
            />
            {rubyFiles.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {rubyFiles.map((f, i) => (
                  <li key={i} className="text-xs flex items-center gap-2">
                    <span className="truncate flex-1">📜 {f.name} ({(f.size / 1024).toFixed(0)}KB)</span>
                    <button type="button" onClick={() => removeRuby(i)} className="text-rose-600 hover:underline">제거</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCompanyName}
            onChange={(e) => setShowCompanyName(e.target.checked)}
          />
          내 회사명을 함께 표시
        </label>

        {isSuperAdmin && (
          <label className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded p-2">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(e) => setIsAnnouncement(e.target.checked)}
            />
            <span>📢 <b>공지</b>로 등록 — 모든 카테고리 상단에 핀</span>
          </label>
        )}

        {isRuby && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded p-2">
            ⚠ 사용자가 만든 루비 파일입니다. 사용에 주의해주세요.
          </div>
        )}

        {progress && <div className="text-sm text-navy-700">{progress}</div>}
        {error && <div className="text-sm text-rose-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {mutation.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// 닉네임 미설정 사용자(베타 정책 변경 이전 가입자)에게 강제로 입력시키는 화면.
// 라운지 진입 자체를 막아 활동 전 닉네임 확정 — 본명 노출 방지.
function NicknameSetupModal({ onSaved }) {
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const v = nickname.trim();
    if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(v)) {
      setError('닉네임은 2~20자의 한글·영문·숫자·_·-만 가능합니다');
      return;
    }
    setBusy(true);
    try {
      await onSaved(v);
    } catch (e) {
      setError(e.response?.data?.error || '닉네임 저장 실패');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white dark:bg-gray-900 border rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">✏️</div>
          <h2 className="text-lg font-bold mb-1">라운지에서 사용할 닉네임을 정해주세요</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            라운지·커뮤니티 활동에는 본명 대신 닉네임이 표시됩니다.<br/>
            한 번 정하면 동료들이 알아볼 수 있도록 신중하게 입력해주세요.
          </p>
        </div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임 (2~20자, 한글·영문·숫자·_·-)"
          maxLength={20}
          autoFocus
          className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
        />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button
          type="submit"
          disabled={busy || !nickname.trim()}
          className="w-full px-4 py-2.5 text-sm font-medium rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '저장 중…' : '확인하고 라운지 입장'}
        </button>
      </form>
    </div>
  );
}

function MeEditModal({ me, onClose, onSaved }) {
  const [selfLabel, setSelfLabel] = useState(me.selfLabel || '');
  const [jobRole, setJobRole] = useState(me.jobRole || '');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload) => loungeApi.updateMe(payload),
    onSuccess: () => onSaved(),
    onError: (e) => setError(e.response?.data?.error || e.message),
  });
  function submit(e) {
    e.preventDefault();
    mutation.mutate({ selfLabel: selfLabel.trim() || null, jobRole: jobRole || null });
  }
  return (
    <Modal title="라운지 프로필" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">직군</label>
          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">선택 안 함</option>
            {JOB_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">표시 라벨 (선택, 최대 40자)</label>
          <input
            type="text"
            value={selfLabel}
            onChange={(e) => setSelfLabel(e.target.value)}
            placeholder="예: 디자이너 / 5년차"
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            maxLength={40}
          />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-700">취소</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50">
            {mutation.isPending ? '저장 중...' : '저장'}
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
