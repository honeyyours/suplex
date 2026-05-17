import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { crewApi } from '../api/vendors';

// 시공팀(CREW) 전용 홈 — 가입 직후·로그인 후 도착하는 1차 화면. (2026-05-17)
// Step 2: placeholder + 본인 정보. Step 3: 거래 회사 매핑 목록 표시.
// 모바일 우선·카톡과 결이 비슷한 가벼움. 회사 NAV 일절 노출 X.
// 후속 Step: 다중 회사 통합 캘린더 본격 구현.
export default function CrewHome() {
  const { auth, logout } = useAuth();
  const user = auth?.user;

  const [me, setMe] = useState({ companies: [], totalVendors: 0, loading: true });

  useEffect(() => {
    let alive = true;
    crewApi.me()
      .then((data) => { if (alive) setMe({ ...data, loading: false }); })
      .catch(() => { if (alive) setMe((p) => ({ ...p, loading: false })); });
    return () => { alive = false; };
  }, []);

  const hasCompanies = me.companies.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <span className="font-bold text-navy-800 dark:text-navy-200">수플렉스 시공팀</span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <section className="bg-white dark:bg-slate-900 rounded-lg p-5 shadow-sm dark:ring-1 dark:ring-white/5">
          <div className="text-xs text-gray-500 mb-1">반갑습니다</div>
          <div className="text-lg font-bold text-navy-800 dark:text-navy-200">
            {user?.name || '시공팀'} 님
          </div>
          {user?.nickname && (
            <div className="text-sm text-gray-500 mt-0.5">@{user.nickname}</div>
          )}
        </section>

        {/* 거래 회사 목록 — 회사별로 묶음 (목공팀이면 한 회사에 Vendor 3개 가능) */}
        {me.loading ? (
          <section className="bg-white dark:bg-slate-900 rounded-lg p-5 text-center text-gray-400 text-sm">
            거래 회사 불러오는 중...
          </section>
        ) : hasCompanies ? (
          <section className="bg-white dark:bg-slate-900 rounded-lg p-5 shadow-sm dark:ring-1 dark:ring-white/5">
            <div className="text-sm font-semibold mb-3">
              거래 회사 <span className="text-gray-400">({me.companies.length})</span>
            </div>
            <ul className="space-y-3">
              {me.companies.map((c) => (
                <li key={c.companyId} className="border border-gray-200 dark:border-slate-700 rounded p-3">
                  <div className="font-semibold text-navy-800 dark:text-navy-200">{c.companyName}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1.5">
                    {c.vendors.map((v) => (
                      <span
                        key={v.id}
                        className="inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
                      >
                        {v.category}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              위 회사들이 잡은 일정은 곧 한 화면에서 통합 확인하실 수 있습니다 (준비 중).
            </p>
          </section>
        ) : (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="font-semibold text-amber-900 mb-2">아직 거래 회사가 없습니다</div>
            <div className="text-sm text-amber-900 leading-relaxed space-y-2">
              <p>
                거래하는 인테리어 회사가 수플렉스에서 시공팀으로 초대하면,
                잡힌 일정이 이 화면에 모입니다.
              </p>
              <p className="text-xs text-amber-800">
                회사가 여러 곳이어도 한 화면에서 통합 확인하실 수 있습니다.
                더블 부킹 알림도 함께 작동합니다 (준비 중).
              </p>
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-slate-900 rounded-lg p-5 shadow-sm dark:ring-1 dark:ring-white/5">
          <div className="text-sm font-semibold mb-3">계정 정보</div>
          <div className="space-y-2 text-sm">
            <Row label="이메일" value={user?.email} />
            <Row label="이름" value={user?.name} />
            <Row label="닉네임" value={user?.nickname || '-'} />
            <Row label="계정 종류" value="시공팀 (무료)" />
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-slate-900/60 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-5">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">다음 단계 (준비 중)</div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed list-disc pl-5 space-y-1">
            <li>거래 회사가 잡은 일정 통합 캘린더</li>
            <li>더블 부킹 즉시 알림</li>
            <li>인건비 정산 영수증 보관</li>
            <li>일정 1-탭 확정/미확정 응답</li>
          </ul>
        </section>

        <p className="text-center text-xs text-gray-500 pt-4">
          인테리어 회사 대표신가요?{' '}
          <Link to="/signup" className="text-navy-700 hover:underline">회사 대표로 가입</Link>
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 truncate">{value}</span>
    </div>
  );
}
