// 일반회원·미가입자·미승인 회사 대표가 보는 수플렉스 소개 페이지.
// 2026-05-14 v3 — 영업 자료(JTBD/원페이저/추가어필포인트) 기반.
// 디자인: docs/sales 자료 + suplex_intro_v2.html 톤.
// 폴리시:
//  - Hero 우측 미니 UI 일러스트
//  - 베타 "20%" 모바일에도 노출
//  - 4번 솔루션 미니 매트릭스에 행/열 라벨
//  - 마키 60s/70s (index.css 정의)
//  - 푸터에 운영자 정보
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
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
  const { data } = useQuery({
    queryKey: ['intro-feed'],
    queryFn: () => loungeApi.posts({ limit: 30 }),
    staleTime: 60_000,
  });
  const stories = useMemo(
    () => (data?.items || []).filter((p) => p.category === 'free').slice(0, 24),
    [data]
  );
  // 마키 2행 분할 — 홀짝 인덱스로 split, 무한 루프용 복제
  const half = Math.ceil(stories.length / 2);
  const row1 = stories.slice(0, half);
  const row2 = stories.slice(half);

  return (
    <div className="bg-white text-navy-900 -mx-4 -my-4 sm:-mx-6 sm:-my-6">
      {/* === Hero === */}
      <section className="relative intro-grid-bg border-b border-navy-100">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white pointer-events-none"></div>
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-center">
            <div>
              <div className="intro-eyebrow mb-6">
                {auth?.user?.nickname || auth?.user?.name}님, 환영합니다
              </div>
              <h1 className="intro-display text-4xl sm:text-6xl font-extrabold text-navy-900 leading-[1.1]">
                한 사람의 능력이 아니라,<br/>
                <span className="text-navy-600">회사 전체의 능력</span>이<br className="hidden sm:block"/>
                올라갑니다.
              </h1>
              <p className="intro-tight text-base sm:text-lg text-navy-700 leading-relaxed mt-8 max-w-2xl">
                <b className="text-navy-900">인테리어 회사 협업 캘린더</b>.<br/>
                같은 구성원으로 프로젝트 운영 효율을 극대화하고,<br/>
                담당자가 바뀌어도 업무의 본질과 노하우는 회사의 자산으로 남습니다.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-medium text-navy-600">
                <span className="px-3 py-1.5 rounded-full bg-white border border-navy-200">인테리어 회사 전용</span>
                <span className="px-3 py-1.5 rounded-full bg-white border border-navy-200">클로즈드 베타</span>
                <span className="px-3 py-1.5 rounded-full bg-white border border-navy-200">2개월 무료 · 카드등록 X</span>
              </div>
            </div>

            {/* Hero 우측 미니 UI 일러스트 — 공정 현황 매트릭스 미리보기 */}
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* === 페인 4 === */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-2xl mb-12">
          <div className="intro-eyebrow mb-4">Problem</div>
          <h2 className="intro-display text-3xl sm:text-4xl font-bold text-navy-900 leading-tight">이런 적 있으세요?</h2>
          <p className="text-sm sm:text-base text-navy-600 leading-relaxed mt-4">
            엑셀·카톡·종이노트로 운영하면, 기록이 한 곳에 정렬되지 않아 놓치는 정보가 생깁니다.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <PainCard icon={IconPhone} title="현장에서 사무실에 전화">
            "마감재 뭐였지?" "타일 언제 잡았지?" "확정됐어?" 매번 사무실에 전화해서 묻고 계신가요?
          </PainCard>
          <PainCard icon={IconKeyboard} title="십수번 반복 타이핑">
            작업자·자재상 섭외할 때마다 현장 주소·상황·특이사항을 처음부터 다시 타이핑하고 계신가요?
          </PainCard>
          <PainCard icon={IconArchive} title="노하우가 휘발됩니다">
            끝난 프로젝트의 피드백·자재 결정 — 어디에 남겼는지 까먹어서 다음 현장에 반영이 안 되시나요?
          </PainCard>
          <PainCard icon={IconClock} title="데드라인을 사람이 챙기는 구조">
            "오늘까지 발주했어야 했는데" — 사람이 까먹어서 자재가 늦은 적 있으신가요?
          </PainCard>
        </div>
      </section>

      {/* === 해결 4 === */}
      <section className="bg-navy-50/60 border-y border-navy-100">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <div className="intro-eyebrow mb-4">Solution</div>
            <h2 className="intro-display text-3xl sm:text-4xl font-bold text-navy-900 leading-tight">수플렉스가 잡습니다</h2>
            <p className="text-sm sm:text-base text-navy-600 leading-relaxed mt-4">
              현장에서 사무실에 전화하지 마세요. 마감재·일정·발주, 까먹지도 잃지도 않습니다.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SolutionCard number="01" eyebrow="Knowledge" title={<>지난 프로젝트의 노하우가<br/>지금 현장에서 다시 살아납니다</>}>
              <p className="text-sm text-navy-700 leading-relaxed">
                <i className="text-navy-500">"3년 전 그 화이트 강마루, 입주 후 반응이 어땠지?"</i> — 검색 한 번으로 그때의 피드백·자재 결정·고객 반응이 떠오릅니다. 비슷한 사례의 현장이 들어왔을 때 회사가 쌓아온 결정과 결과가 그대로 다음 판단에 쓰입니다.
              </p>
              <p className="text-sm text-navy-700 leading-relaxed mt-3 pt-3 border-t border-navy-100">
                견적·자재·가전 모델은 한 번 입력하면 회사 데이터에 누적되어, 두 번째 같은 자재를 처음부터 만들 필요가 없습니다.
              </p>
            </SolutionCard>

            <SolutionCard number="02" eyebrow="Deadline" title="시스템이 데드라인을 챙깁니다">
              <p className="text-sm text-navy-700 leading-relaxed">
                일정에 "도배"를 입력하면 <b className="text-navy-900">D-14</b>에 "도배 업체 섭외", <b className="text-navy-900">D-5</b>에 "벽면 평탄화·퍼티 마감 점검", <b className="text-navy-900">D-2</b>에 "도배지 검수·본드 도착 확인"이 <b className="text-navy-900">자동으로</b> 체크리스트에 추가됩니다. 사람이 까먹어도 시스템이 까먹지 않습니다.
              </p>
              <p className="text-sm text-navy-700 leading-relaxed mt-3 pt-3 border-t border-navy-100">
                공정·키워드·D-N 룰·체크리스트·견적 가이드까지 — 공통 기준이 회사에 깔려있어 누가 일을 받아도 같은 품질로 굴러갑니다.
              </p>
            </SolutionCard>

            <SolutionCard number="03" eyebrow="Automation" title={<>카톡으로 보낼 텍스트는<br/>시스템이 정리합니다</>}>
              <div className="text-sm text-navy-700 leading-relaxed space-y-2">
                <div><b className="text-navy-900">일정 복사</b> — 키워드 "전기" 한 번 → 4개 현장 일정·주소·특이사항이 카톡 텍스트로 한 번에 복사</div>
                <div><b className="text-navy-900">발주서 자동 작성</b> — 마감재 체크 → 자재상에게 보낼 카톡 텍스트로 변환</div>
                <div><b className="text-navy-900">인건비 정산</b> — 작업자별 [일수×단가+식비+교통비] 자동 합산 → 송금용 카톡 텍스트</div>
              </div>
              <p className="text-sm text-navy-700 leading-relaxed mt-3 pt-3 border-t border-navy-100">
                매번 십수번 반복 타이핑하던 잡일이 <b className="text-navy-900">한 번의 클릭</b>으로 끝납니다.
              </p>
            </SolutionCard>

            <SolutionCard number="04" eyebrow="Overview" title={<>4~10개 현장이<br/>한 화면에서 보입니다</>}>
              <p className="text-sm text-navy-700 leading-relaxed">
                <b className="text-navy-900">공정 현황 통합 뷰</b> — 25공정 × (견적·마감재·일정·발주) 매트릭스. 빠뜨린 항목·임박한 데드라인이 색깔로 강조됩니다. 모바일에서 글씨가 직접 보여 <b className="text-navy-900">사무실에 전화할 일이 사라집니다.</b>
              </p>
              {/* 라벨 포함 미니 매트릭스 */}
              <div className="mt-auto pt-5">
                <MiniMatrix />
              </div>
            </SolutionCard>
          </div>
        </div>
      </section>

      {/* === 견적 피드백 사이클 === */}
      <section className="relative bg-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 intro-dot-bg opacity-60"></div>
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="intro-eyebrow mb-4" style={{ color: '#8da8d2' }}>★ 차별화 핵심</div>
            <h2 className="intro-display text-3xl sm:text-4xl font-bold leading-tight">견적이 점점 똑똑해집니다</h2>
            <p className="text-sm sm:text-base text-navy-200 leading-relaxed mt-4">
              끝난 현장이 다음 견적의 출발점. 회사를 오래 쓸수록 견적 정확도·공종별 단가·이익률이 자연스럽게 정교화됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto">
            <CycleCard num="01" label="견적 작성" />
            <CycleCard num="02" label="발주" />
            <CycleCard num="03" label="실제 지출" />
            <CycleCard num="04" label="공정별 분석" />
            <CycleCard num="05" label="정산 메모" />
            <CycleCard num="06" label="다음 견적 prefill" highlight />
          </div>
          <p className="text-sm text-navy-300 text-center mt-10 max-w-xl mx-auto">
            한 번 짜본 견적은 회사 자산. 지출 데이터가 다시 견적으로 돌아옵니다.
          </p>
        </div>
      </section>

      {/* === 현장의 목소리 (마키 2행) === */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 mb-12">
          <div className="max-w-2xl">
            <div className="intro-eyebrow mb-4">Voices</div>
            <h2 className="intro-display text-3xl sm:text-4xl font-bold text-navy-900 leading-tight">현장의 목소리</h2>
            <p className="text-sm sm:text-base text-navy-600 leading-relaxed mt-4">
              라운지에서 동료들의 이야기를 살펴보세요. <span className="text-navy-400">(마우스를 올리면 멈춥니다)</span>
            </p>
          </div>
        </div>

        {row1.length > 0 && (
          <div className="intro-marquee mb-3">
            <div className="intro-marquee__track">
              {[...row1, ...row1].map((p, i) => (
                <VoiceCard key={`r1-${p.id}-${i}`} post={p} duplicated={i >= row1.length} />
              ))}
            </div>
          </div>
        )}
        {row2.length > 0 && (
          <div className="intro-marquee">
            <div className="intro-marquee__track intro-marquee__track--r">
              {[...row2, ...row2].map((p, i) => (
                <VoiceCard key={`r2-${p.id}-${i}`} post={p} duplicated={i >= row2.length} />
              ))}
            </div>
          </div>
        )}
        {stories.length === 0 && (
          <div className="max-w-5xl mx-auto px-6 text-center text-sm text-navy-400">아직 글이 없습니다.</div>
        )}
      </section>

      {/* === 회사 자산화 === */}
      <section className="bg-navy-50/60 border-y border-navy-100">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="intro-eyebrow mb-4 justify-center" style={{ display: 'inline-flex' }}>Philosophy</div>
          <h2 className="intro-display text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-5">
            회사의 노하우는<br/>회사 안에 남습니다
          </h2>
          <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
            견적 기준·자재 결정·현장 환경·고객 대응 — 한 사람의 머릿속에 흩어져 있던 정보가 회사의 자산으로 누적됩니다.
            담당자가 바뀌어도 다음 사람이 그 자리를 그대로 이어받아 일할 수 있습니다.
          </p>
        </div>
      </section>

      {/* === 베타 혜택 + CTA === */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="bg-navy-900 text-white rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 intro-dot-bg opacity-50"></div>
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 sm:gap-8 items-center px-6 py-8 sm:px-12 sm:py-12">
            <div>
              <div className="intro-eyebrow mb-4" style={{ color: '#8da8d2' }}>Closed Beta</div>
              <h2 className="intro-display text-2xl sm:text-3xl font-bold leading-tight mb-5">평생 20% 할인</h2>
              <ul className="text-sm text-navy-100 leading-relaxed space-y-2">
                <BetaCheck>
                  <b className="text-white">2개월 무료</b> · 결제 정보 등록 X · 카드 등록 X
                </BetaCheck>
                <BetaCheck>"프로 등급" 풀 기능 제공</BetaCheck>
                <BetaCheck>
                  정식 출시 후 <b className="text-white">평생 20% 할인</b> (어느 등급이든 영구 적용)
                </BetaCheck>
                <BetaCheck>JSON 백업으로 락인 없음</BetaCheck>
              </ul>
            </div>
            {/* 20% 디스플레이 — 모바일에서도 노출 (폴리시 #2) */}
            <div className="flex flex-col items-center sm:items-end shrink-0">
              <div className="intro-display text-6xl sm:text-7xl font-extrabold text-white leading-none">
                20<span className="text-2xl sm:text-3xl align-top">%</span>
              </div>
              <div className="text-xs tracking-widest text-navy-300 mt-2">FOREVER</div>
            </div>
          </div>
          <div className="relative px-6 py-4 sm:px-12 border-t border-navy-700 bg-navy-900/40">
            <p className="text-xs text-navy-300">
              카톡·엑셀 다 버리지 마세요. 수플렉스는 <b className="text-navy-100">그 사이에 흩어진 정보만</b> 모아줍니다.
            </p>
          </div>
        </div>

        {/* CTA 2개 */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Link
            to="/lounge"
            className="intro-card-hover block px-7 py-7 bg-white border border-navy-200 rounded-2xl group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
                <IconChat />
              </div>
              <IconArrowRight className="text-navy-300 group-hover:text-navy-700 transition-colors" />
            </div>
            <div className="intro-tight font-bold text-lg text-navy-900 mb-1.5">라운지 둘러보기</div>
            <p className="text-sm text-navy-600 leading-relaxed">
              인테리어 디자이너·현장팀이 모이는 클로즈드 커뮤니티. 스케치업 루비·시공 노하우를 자유롭게.
            </p>
          </Link>
          <a
            href="https://instagram.com/suplex.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="intro-card-hover block px-7 py-7 bg-navy-900 text-white border border-navy-900 rounded-2xl group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-lg bg-navy-800 text-white flex items-center justify-center">
                <IconBuilding />
              </div>
              <IconArrowRight className="text-navy-400 group-hover:text-white transition-colors" />
            </div>
            <div className="intro-tight font-bold text-lg mb-1.5">회사 도입 문의</div>
            <p className="text-sm text-navy-200 leading-relaxed">
              관심 있으신 분들의 연락을 기다립니다.<br/>
              현재 <b className="text-white">클로즈드 베타</b> 준비 중이며,<br/>
              아래로 연락 주시면 순차적으로 안내드리겠습니다.
            </p>
            <div className="mt-3 pt-3 border-t border-navy-700 text-sm text-navy-200 leading-relaxed">
              이메일 <b className="text-white">hello@suplex.kr</b><br/>
              인스타그램 <b className="text-white">@suplex.kr</b>
            </div>
          </a>
        </div>
      </section>

      {/* === 푸터 === */}
      <footer className="border-t border-navy-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-navy-900 text-white flex items-center justify-center font-extrabold text-xs intro-display">S</div>
              <div className="text-sm font-semibold text-navy-900">
                수플렉스 <span className="text-navy-400 font-normal">Suplex</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-500">
              <span>대표 김봉기</span>
              <a href="mailto:hello@suplex.kr" className="hover:text-navy-700">hello@suplex.kr</a>
              <a href="https://instagram.com/suplex.kr" target="_blank" rel="noopener noreferrer" className="hover:text-navy-700">@suplex.kr</a>
              <Link to="/terms" className="hover:text-navy-700">이용약관</Link>
              <Link to="/privacy" className="hover:text-navy-700">개인정보처리방침</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-5 border-t border-navy-50">
            <p className="text-xs text-navy-500">
              {auth?.company
                ? <>현재 <b>{auth.company.name}</b> 베타 승인 대기 중입니다. 빠른 승인은 대표 메일 또는 인스타그램으로 문의해주세요.</>
                : <>현재 일반회원으로 로그인되어 있습니다. 회사 대표로 가입하시려면 대표 메일 또는 인스타그램으로 문의해주세요.</>
              }
            </p>
            <button
              onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }}
              className="text-xs text-navy-400 hover:text-rose-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 컴포넌트 헬퍼 ───────────────────────────────────────────

function PainCard({ icon: Icon, title, children }) {
  return (
    <div className="intro-card-hover px-6 py-6 bg-white border border-navy-100 rounded-xl">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
          <Icon />
        </div>
        <div className="flex-1">
          <h3 className="intro-tight font-bold text-navy-900 mb-1.5">{title}</h3>
          <p className="text-sm text-navy-600 leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}

function SolutionCard({ number, eyebrow, title, children }) {
  return (
    <div className="intro-card-hover bg-white border border-navy-100 rounded-2xl p-7 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm intro-display">
          {number}
        </div>
        <div className="text-xs font-semibold tracking-widest text-navy-500 uppercase">{eyebrow}</div>
      </div>
      <h3 className="intro-tight text-xl font-bold text-navy-900 mb-3 leading-snug">{title}</h3>
      {children}
    </div>
  );
}

function CycleCard({ num, label, highlight = false }) {
  if (highlight) {
    return (
      <div className="bg-white text-navy-900 rounded-lg px-4 py-4 flex items-center gap-3 shadow-lg shadow-black/20">
        <span className="text-xs font-mono text-navy-400">{num}</span>
        <span className="text-sm font-bold">{label}</span>
        <IconRotate className="ml-auto" />
      </div>
    );
  }
  return (
    <div className="bg-navy-800/60 backdrop-blur border border-navy-700 rounded-lg px-4 py-4 flex items-center gap-3">
      <span className="text-xs font-mono text-navy-400">{num}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function VoiceCard({ post, duplicated }) {
  return (
    <Link
      to={duplicated ? '#' : `/lounge/${post.id}`}
      aria-hidden={duplicated ? 'true' : undefined}
      tabIndex={duplicated ? -1 : undefined}
      className="shrink-0 w-[320px] sm:w-[360px] bg-white border border-navy-100 rounded-xl p-5 intro-card-hover block"
    >
      <h3 className="intro-tight font-bold text-[15px] text-navy-900 mb-2 leading-snug">{post.title}</h3>
      <p className="text-xs text-navy-600 leading-relaxed intro-line-clamp-3">{previewBody(post.body)}</p>
      <div className="mt-3 text-[11px] text-navy-400 font-medium">{post.author?.nickname || post.author?.name}</div>
    </Link>
  );
}

function BetaCheck({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg className="shrink-0 mt-0.5 text-navy-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>{children}</span>
    </li>
  );
}

// 4번 솔루션 미니 매트릭스 — 행(공정) · 열(견적/마감재/일정/발주) 라벨 포함 (폴리시 #3)
function MiniMatrix() {
  const rows = ['철거', '전기', '도배', '타일'];
  const cols = ['견적', '마감재', '일정', '발주'];
  // 4x4 셀: 대부분 navy-100, 1개 amber(임박), 1개 red(누락)
  const cells = [
    ['n', 'n', 'd', 'n'],
    ['n', 'n', 'n', 'n'],
    ['n', 'd', 'n', 'a'], // 도배 발주 임박
    ['n', 'r', 'n', 'n'], // 타일 마감재 누락
  ];
  const cellClass = (v) => {
    if (v === 'a') return 'bg-amber-300/80';
    if (v === 'r') return 'bg-red-400/80';
    if (v === 'd') return 'bg-navy-200';
    return 'bg-navy-100';
  };
  return (
    <div>
      {/* 헤더 — 열 라벨 */}
      <div className="grid grid-cols-[40px_1fr] gap-1 mb-1">
        <div></div>
        <div className="grid grid-cols-4 gap-1 text-[9px] font-medium text-navy-500 text-center">
          {cols.map((c) => <div key={c}>{c}</div>)}
        </div>
      </div>
      {rows.map((r, ri) => (
        <div key={r} className="grid grid-cols-[40px_1fr] gap-1 mb-1">
          <div className="text-[10px] font-medium text-navy-600 flex items-center">{r}</div>
          <div className="grid grid-cols-4 gap-1">
            {cells[ri].map((v, ci) => (
              <div key={ci} className={`aspect-square rounded ${cellClass(v)}`} title={
                v === 'a' ? '임박' : v === 'r' ? '누락' : ''
              }></div>
            ))}
          </div>
        </div>
      ))}
      {/* 범례 */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-navy-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-300/80"></span>임박</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400/80"></span>누락</span>
      </div>
    </div>
  );
}

// Hero 우측 미니 모형 UI — 공정 카드 + 체크리스트 미리보기 (폴리시 #1)
function HeroMockup() {
  return (
    <div className="hidden lg:block relative">
      <div className="absolute -inset-4 bg-navy-100/40 rounded-3xl blur-2xl"></div>
      <div className="relative bg-white border border-navy-200 rounded-2xl shadow-xl shadow-navy-900/10 p-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-navy-900 text-white flex items-center justify-center font-extrabold text-[10px] intro-display">S</div>
            <div className="text-xs font-semibold text-navy-900">현장 — 강남 102동</div>
          </div>
          <div className="text-[10px] text-navy-400">D-3</div>
        </div>
        {/* 공정 칩 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-700 text-white font-medium">도배</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-100">전기</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">타일 D-1</span>
        </div>
        {/* 체크리스트 */}
        <div className="space-y-2.5">
          <ChecklistRow done label="D-14 도배 업체 섭외" />
          <ChecklistRow done label="D-5 벽면 평탄화·퍼티 마감" />
          <ChecklistRow label="D-2 도배지 검수·본드 도착" highlight />
          <ChecklistRow label="당일 작업팀 카톡 안내" />
        </div>
        {/* 푸터 */}
        <div className="mt-4 pt-3 border-t border-navy-100 text-[10px] text-navy-500 flex items-center justify-between">
          <span>📎 마감재 4 · 발주 2</span>
          <span className="text-navy-700 font-semibold">한 화면에서</span>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ done, label, highlight }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${done ? 'text-navy-400 line-through' : highlight ? 'text-amber-700 font-semibold' : 'text-navy-700'}`}>
      <span className={`shrink-0 w-4 h-4 rounded border ${done ? 'bg-navy-700 border-navy-700 text-white' : highlight ? 'border-amber-400 bg-amber-50' : 'border-navy-200 bg-white'} flex items-center justify-center`}>
        {done && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}

// ── 아이콘 SVG ───────────────────────────────────────────

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/>
    </svg>
  );
}
function IconKeyboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>
    </svg>
  );
}
function IconArchive() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
    </svg>
  );
}
function IconArrowRight({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function IconRotate({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}
