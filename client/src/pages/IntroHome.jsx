// 일반회원·미가입자가 보는 수플렉스 소개 페이지.
// 2026-05-14 도입 — 라운지에서 본 글을 통해 흥미 → 회사 대표 가입 유도 (깔때기 끝).
// 컨텐츠는 시간을 두고 봉기님이 채울 예정. 현재는 골격만.
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function IntroHome() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      {/* 헤더 */}
      <header className="text-center space-y-3">
        <div className="text-4xl">👋</div>
        <h1 className="text-3xl font-bold text-navy-800 dark:text-navy-200">
          {auth?.user?.nickname || auth?.user?.name}님, 환영합니다
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          <b>수플렉스</b>는 인테리어 회사 전용 운영 도구입니다.<br/>
          라운지에서 동료들의 이야기·루비·노하우를 둘러보고,<br/>
          회사 대표시라면 견적·일정·마감재까지 전체 기능을 사용해보세요.
        </p>
      </header>

      {/* CTA 카드: 라운지 / 회사 가입 */}
      <div className="grid sm:grid-cols-2 gap-4">
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
      </div>

      {/* 기능 소개 — 4분할 카드 */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          수플렉스가 인테리어 회사에게 주는 가치
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard
            icon="📋"
            title="간편 견적서"
            desc="공정 묶음과 자주 쓰는 항목을 미리 저장. 새 견적은 5분 안에 완성."
          />
          <FeatureCard
            icon="📅"
            title="공정 일정 관리"
            desc="현장팀이 모바일에서 한 줄로 입력. 어드바이스 룰이 D-7·D-14에 자동 알림."
          />
          <FeatureCard
            icon="🧱"
            title="마감재 발주서"
            desc="공정별 마감재 리스트를 그대로 발주서로. 거래처별 자동 그룹."
          />
          <FeatureCard
            icon="💰"
            title="지출·인건비 정산"
            desc="공정별 견적 vs 실지출 비교가 다음 견적의 기준선이 됩니다."
          />
        </div>
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

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="text-2xl mb-1.5">{icon}</div>
      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{title}</div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
