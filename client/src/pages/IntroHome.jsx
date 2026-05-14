// 일반회원·미가입자가 보는 수플렉스 소개 페이지.
// 2026-05-14 도입 — 라운지에서 본 글을 통해 흥미 → 회사 대표 가입 유도 (깔때기 끝).
// 라운지의 free 카테고리 최근 글을 페인 포인트 카드로 동적 노출.
// 봉기님이 라운지에 새 글을 올리면 자동 반영.
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { loungeApi } from '../api/lounge';

function previewBody(body) {
  if (!body) return '';
  // 코드 블록 제거, 마지막 "DO Suplex" 시그니처 제거, 줄바꿈 다듬기
  let s = body.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/DO Suplex.*$/im, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > 100 ? s.slice(0, 100) + '…' : s;
}

export default function IntroHome() {
  const { auth, logout } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['intro-feed'],
    queryFn: () => loungeApi.posts({ limit: 30 }),
    staleTime: 60_000,
  });
  const stories = (data?.items || []).filter((p) => p.category === 'free').slice(0, 24);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10">
      {/* 헤더 */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="text-4xl">👋</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-800 dark:text-navy-200 leading-tight">
          {auth?.user?.nickname || auth?.user?.name}님, 환영합니다
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          인테리어 운영, 이런 순간 익숙하시죠?<br/>
          <b className="text-navy-700 dark:text-navy-300">수플렉스</b>가 어떻게 해결하는지 둘러보세요.
        </p>
      </header>

      {/* 페인 포인트 카드 그리드 — 라운지 free 카테고리 동적 fetch */}
      <section>
        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-500">불러오는 중...</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            아직 소개 글이 없습니다. 라운지에서 만나요.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stories.map((p) => (
              <Link
                key={p.id}
                to={`/lounge/${p.id}`}
                className="block px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-navy-400 dark:hover:border-navy-500 hover:shadow-sm rounded-lg transition group"
              >
                <h3 className="font-bold text-[15px] text-gray-900 dark:text-gray-100 mb-2 leading-snug group-hover:text-navy-800 dark:group-hover:text-navy-300">
                  {p.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {previewBody(p.body)}
                </p>
                <div className="mt-3 text-[11px] text-gray-400 flex items-center gap-2">
                  <span>{p.author?.nickname || p.author?.name}</span>
                  <span>· 💬 {p.commentCount}</span>
                  <span>· ♥ {p.reactionCount}</span>
                  <span className="ml-auto text-navy-600 dark:text-navy-400 opacity-0 group-hover:opacity-100 transition">
                    자세히 →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA 영역 */}
      <section className="grid sm:grid-cols-2 gap-4 pt-4">
        <Link
          to="/lounge"
          className="block px-6 py-5 bg-white dark:bg-gray-900 border-2 border-navy-200 dark:border-navy-800 hover:border-navy-600 dark:hover:border-navy-400 rounded-xl transition group"
        >
          <div className="text-3xl mb-2">💬</div>
          <div className="font-bold text-lg text-navy-800 dark:text-navy-200 mb-1 group-hover:text-navy-900">
            라운지 둘러보기
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            인테리어 디자이너·현장팀이 모이는 클로즈드 커뮤니티.<br/>
            스케치업 루비·시공 노하우·요청사항을 자유롭게.
          </p>
        </Link>

        <a
          href="https://suplex.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-6 py-5 bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-900 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl transition group"
        >
          <div className="text-3xl mb-2">🏢</div>
          <div className="font-bold text-lg text-amber-700 dark:text-amber-400 mb-1 group-hover:text-amber-800">
            회사 대표시라면
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            견적·일정·마감재·지출·인건비 정산까지.<br/>
            현재 클로즈 베타 운영 중 — 가입 안내 받기.
          </p>
        </a>
      </section>

      {/* 푸터 */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 space-y-2">
        <p>
          현재 일반회원으로 로그인되어 있습니다. 회사 대표로 가입하시려면 별도 문의해주세요.
        </p>
        <div className="flex justify-center gap-3 text-xs">
          <Link to="/lounge" className="text-navy-700 hover:underline">라운지</Link>
          <span className="text-gray-300">·</span>
          <button onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }} className="text-gray-500 hover:text-rose-600">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
