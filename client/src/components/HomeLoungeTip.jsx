import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { loungeApi } from '../api/lounge';

const JOB_ROLE_LABEL = {
  designer: '디자이너',
  site: '현장팀',
  ops: '운영',
  etc: '기타',
};

const DISMISS_KEY = 'suplex_lounge_tip_dismissed_until';

// 홈 "오늘의 팁" 카드 — 라운지 사용 팁 1개를 큐레이션 노출.
// 24시간 닫기(localStorage). 라운지 멤버 아닌 사용자는 자동 스킵 (403 응답 시).
export default function HomeLoungeTip() {
  const [hidden, setHidden] = useState(() => {
    try {
      const until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return Date.now() < until;
    } catch {
      return false;
    }
  });

  const { data, error } = useQuery({
    queryKey: ['lounge', 'home-pinned'],
    queryFn: () => loungeApi.homePinned(),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: !hidden,
  });

  // 라운지 접근 권한이 없으면(403) 카드 자체를 노출 안 함
  if (error?.response?.status === 403 || hidden) return null;
  const post = data?.post;
  if (!post) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
  }

  return (
    <Link
      to={`/lounge/${post.id}`}
      className="block border border-navy-200 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-950/30 rounded-lg p-4 hover:bg-navy-50 dark:hover:bg-navy-950/50 transition"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">💡</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-navy-700 dark:text-navy-300 mb-0.5 flex items-center gap-2">
            <span>오늘의 팁 · 라운지</span>
            {post.author?.jobRole && (
              <span className="text-gray-500">{JOB_ROLE_LABEL[post.author.jobRole]}</span>
            )}
            <span className="text-gray-400">· {post.author?.name}</span>
          </div>
          <div className="font-semibold truncate">{post.title}</div>
          {post.preview && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {post.preview}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
          className="text-gray-400 hover:text-gray-600 text-xs px-2"
          title="24시간 숨김"
        >
          ✕
        </button>
      </div>
    </Link>
  );
}
