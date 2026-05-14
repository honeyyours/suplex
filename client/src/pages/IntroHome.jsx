// 일반회원·미가입자·미승인 회사 대표가 보는 수플렉스 소개 페이지.
// 2026-05-14 도입 — 영업 자료(JTBD 캔버스 + 원페이저 + 추가 어필포인트.txt) 기반으로
// 페인 4 → 해결 4 → 견적 피드백 사이클 → 라운지 페인 카드(동적) → 베타 혜택 흐름.
// 참고: docs/sales/JTBD캔버스_P1.md (SSOT), docs/sales/원페이저.md
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { loungeApi } from '../api/lounge';

function previewBody(body) {
  if (!body) return '';
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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-16">
      {/* === Hero — JTBD 메인 헤드라인 === */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-2">
          {auth?.user?.nickname || auth?.user?.name}님, 환영합니다
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-navy-800 dark:text-navy-200 leading-tight">
          한 사람의 능력이 아니라,<br/>
          <span className="text-navy-700 dark:text-navy-300">회사 전체의 능력</span>이 올라갑니다.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed pt-2">
          <b className="text-gray-800 dark:text-gray-200">효율로 더 많은 매출을 만드는</b> 인테리어 회사 운영 도구.<br/>
          같은 구성원으로 프로젝트 운영 효율을 극대화하고,<br/>
          담당자가 바뀌어도 업무의 본질과 노하우는 회사의 자산으로 남습니다.
        </p>
      </header>

      {/* === 페인 4 === */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">이런 적 있으세요?</h2>
          <p className="text-sm text-gray-500">
            엑셀·카톡·종이노트로 운영하면, 기록이 한 곳에 정렬되지 않아 놓치는 정보가 생깁니다.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <PainCard
            emoji="📞"
            title="현장에서 사무실에 전화"
            desc='"마감재 뭐였지?" "타일 언제 잡았지?" "확정됐어?" 매번 사무실에 전화해서 묻고 계신가요?'
          />
          <PainCard
            emoji="⌨️"
            title="십수번 반복 타이핑"
            desc="작업자·자재상 섭외할 때마다 현장 주소·상황·특이사항을 처음부터 다시 타이핑하고 계신가요?"
          />
          <PainCard
            emoji="🗂️"
            title="노하우가 휘발됩니다"
            desc="끝난 프로젝트의 피드백·자재 결정 — 어디에 남겼는지 까먹어서 다음 현장에 반영이 안 되시나요?"
          />
          <PainCard
            emoji="⏰"
            title="데드라인을 사람이 챙기는 구조"
            desc='"오늘까지 발주했어야 했는데" — 사람이 까먹어서 자재가 늦은 적 있으신가요?'
          />
        </div>
      </section>

      {/* === 해결 4 === */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">수플렉스가 잡습니다</h2>
          <p className="text-sm text-gray-500">현장에서 사무실에 전화하지 마세요. 마감재·일정·발주, 까먹지도 잃지도 않습니다.</p>
        </div>

        <SolutionBlock
          number="1"
          title="지난 프로젝트의 노하우가 지금 현장에서 다시 살아납니다"
          desc={
            <>
              <i>"3년 전 그 화이트 강마루, 입주 후 반응이 어땠지?"</i> — 검색 한 번으로 그때의 피드백·자재 결정·고객 반응이 떠오릅니다.
              비슷한 사례의 현장이 들어왔을 때 회사가 쌓아온 결정과 결과가 그대로 다음 판단에 쓰입니다.
              <br/><br/>
              견적·자재·가전 모델은 한 번 입력하면 회사 데이터에 누적되어, 두 번째 같은 자재를 처음부터 만들 필요가 없습니다.
            </>
          }
        />

        <SolutionBlock
          number="2"
          title="시스템이 데드라인을 챙깁니다"
          desc={
            <>
              일정에 "도배"를 입력하면 D-3에 "벽지 도착 확인", D-1에 "초벌 풀칠 준비"가 <b>자동으로</b> 체크리스트에 추가됩니다.
              사람이 까먹어도 시스템이 까먹지 않습니다.
              <br/><br/>
              공정·키워드·D-N 룰·체크리스트·견적 가이드까지 — 공통 기준이 회사에 깔려있어 누가 일을 받아도 같은 품질로 굴러갑니다.
            </>
          }
        />

        <SolutionBlock
          number="3"
          title="카톡으로 보낼 텍스트는 시스템이 정리합니다"
          desc={
            <>
              <b>일정 복사</b> — 키워드 "전기" 한 번 → 4개 현장 일정·주소·특이사항이 카톡 텍스트로 한 번에 복사<br/>
              <b>발주서 자동 작성</b> — 마감재 체크 → 자재상에게 보낼 카톡 텍스트로 변환<br/>
              <b>인건비 정산</b> — 작업자별 [일수×단가+식비+교통비] 자동 합산 → 송금용 카톡 텍스트<br/>
              <br/>
              매번 십수번 반복 타이핑하던 잡일이 <b>한 번의 클릭</b>으로 끝납니다.
            </>
          }
        />

        <SolutionBlock
          number="4"
          title="4~10개 현장이 한 화면에서 보입니다"
          desc={
            <>
              <b>공정 현황 통합 뷰</b> — 25공정 × (견적·마감재·일정·발주) 매트릭스. 빠뜨린 항목·임박한 데드라인이 색깔로 강조됩니다.
              모바일에서 글씨가 직접 보여 <b>사무실에 전화할 일이 사라집니다.</b>
            </>
          }
        />
      </section>

      {/* === 차별화 — 견적 피드백 사이클 === */}
      <section className="bg-navy-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-900 rounded-xl px-6 py-8 sm:px-10 sm:py-10 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-xs font-semibold text-navy-700 dark:text-navy-300 tracking-wider">★ 차별화 핵심</div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-navy-100">견적이 점점 똑똑해집니다</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            끝난 현장이 다음 견적의 출발점. 회사를 오래 쓸수록 견적 정확도·공종별 단가·이익률이 자연스럽게 정교화됩니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm pt-2">
          <CycleStep label="견적 작성" />
          <CycleArrow />
          <CycleStep label="발주" />
          <CycleArrow />
          <CycleStep label="실제 지출" />
          <CycleArrow />
          <CycleStep label="공정별 분석" />
          <CycleArrow />
          <CycleStep label="정산 메모" />
          <CycleArrow />
          <CycleStep label="다음 견적 자동 prefill" highlight />
        </div>
        <p className="text-xs text-gray-500 text-center pt-2">
          한 번 짜본 견적은 회사 자산. 지출 데이터가 다시 견적으로 돌아옵니다.
        </p>
      </section>

      {/* === 라운지 페인 카드 (동적) === */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">현장의 목소리</h2>
          <p className="text-sm text-gray-500">라운지에서 동료들의 이야기를 살펴보세요. 클릭하면 자세히 읽을 수 있어요.</p>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">불러오는 중...</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">아직 글이 없습니다.</div>
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

      {/* === 회사 자산화 메시지 === */}
      <section className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          회사의 노하우는 회사 안에 남습니다
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          견적 기준·자재 결정·현장 환경·고객 대응 — 한 사람의 머릿속에 흩어져 있던 정보가 회사의 자산으로 누적됩니다.
          담당자가 바뀌어도 다음 사람이 그 자리를 그대로 이어받아 일할 수 있습니다.
        </p>
      </section>

      {/* === 클로즈 베타 혜택 === */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-6 py-7 sm:px-10 sm:py-8 space-y-3 text-center">
        <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300">클로즈 베타 — 평생 20% 할인</h2>
        <ul className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-1">
          <li>✓ <b>2개월 무료</b> · 결제 정보 등록 X · 카드 등록 X</li>
          <li>✓ "프로 등급" 풀 기능 제공</li>
          <li>✓ 정식 출시 후 <b>평생 20% 할인</b> (어느 등급이든 영구 적용)</li>
          <li>✓ JSON 백업으로 락인 없음</li>
        </ul>
        <p className="text-xs text-gray-500 pt-2">
          카톡·엑셀 다 버리지 마세요. 수플렉스는 <b>그 사이에 흩어진 정보만</b> 모아줍니다.
        </p>
      </section>

      {/* === CTA === */}
      <section className="grid sm:grid-cols-2 gap-4">
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
            스케치업 루비·시공 노하우를 자유롭게.
          </p>
        </Link>

        <a
          href="https://instagram.com/suplex.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-6 py-5 bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-900 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl transition group"
        >
          <div className="text-3xl mb-2">🏢</div>
          <div className="font-bold text-lg text-amber-700 dark:text-amber-400 mb-1 group-hover:text-amber-800">
            회사 도입 문의
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            이메일: <b>hello@suplex.kr</b><br/>
            인스타그램: <b>@suplex.kr</b>
          </p>
        </a>
      </section>

      {/* === 푸터 === */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 space-y-2">
        <p>
          {auth?.company
            ? <>현재 <b>{auth.company.name}</b> 베타 승인 대기 중입니다. 빠른 승인은 대표 메일 또는 인스타그램으로 문의해주세요.</>
            : <>현재 일반회원으로 로그인되어 있습니다. 회사 대표로 가입하시려면 대표 메일 또는 인스타그램으로 문의해주세요.</>
          }
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

function PainCard({ emoji, title, desc }) {
  return (
    <div className="px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">{title}</div>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function SolutionBlock({ number, title, desc }) {
  return (
    <div className="flex gap-4 sm:gap-6">
      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-navy-700 text-white flex items-center justify-center font-bold text-lg">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug">{title}</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function CycleStep({ label, highlight = false }) {
  return (
    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium ${
      highlight
        ? 'bg-navy-700 text-white'
        : 'bg-white dark:bg-gray-900 border border-navy-200 dark:border-navy-800 text-navy-800 dark:text-navy-200'
    }`}>
      {label}
    </span>
  );
}

function CycleArrow() {
  return <span className="text-navy-400 dark:text-navy-600 text-sm">→</span>;
}
