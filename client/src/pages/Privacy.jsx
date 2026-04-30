import LegalDoc from './LegalDoc';

export default function Privacy() {
  return (
    <LegalDoc title="개인정보처리방침" lastUpdated="2026-04-30">
      <p className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3 text-xs text-amber-900 dark:text-amber-200">
        본 처리방침은 클로즈 베타 단계의 1차 초안이며, 정식 출시 전 법률 자문을 거쳐 갱신될 예정입니다.
      </p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">1. 수집하는 개인정보 항목</h2>
      <p><b>회원가입 시 (필수)</b>: 이메일 · 비밀번호(단방향 암호화 저장 — bcrypt) · 이름 · 회사명</p>
      <p><b>회원가입 시 (선택)</b>: 연락처 · 회사 사업자등록번호 · 회사 대표자명 · 회사 주소 · 회사 전화 · 회사 이메일</p>
      <p><b>서비스 이용 과정에서 자동 생성·수집</b>: 접속 로그(접속 일시·IP 주소) · 감사 로그(중요 액션 16종 한정) · 회원이 자발적으로 입력한 콘텐츠(견적·메모·일정·사진 등 — 회원의 데이터로 분류)</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">2. 개인정보 수집 및 이용 목적</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>회원 식별 및 로그인 — 이메일·비밀번호</li>
        <li>서비스 제공(견적서 갑지 자동 채우기 등) — 이름·회사 정보</li>
        <li>회원 응대 및 공지 — 이메일·연락처</li>
        <li>부정 이용 방지 및 보안 — IP 주소·접속 로그·감사 로그</li>
        <li>서비스 개선 및 통계 분석 — 이용 기록(개인 식별 정보 분리)</li>
      </ul>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">3. 개인정보 보유 및 이용 기간</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>회원 탈퇴 시점까지 또는 법령상 보관 의무 기간 중 더 긴 기간</li>
        <li>회원 탈퇴 시 모든 개인정보는 즉시 파기됩니다</li>
        <li>부정이용 기록은 정보통신망법에 따라 1년간 보관</li>
        <li>결제 관련 기록은 전자상거래법에 따라 5년간 보관 — 베타 단계에서는 결제가 없어 해당 없음</li>
      </ul>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">4. 개인정보 제3자 제공</h2>
      <p>수플렉스는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 회원이 사전에 동의한 경우 또는 법령에 의한 요청이 있는 경우는 예외로 합니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">5. 개인정보 처리위탁 (해외 이전 포함)</h2>
      <p>서비스 운영을 위해 다음 외부 서비스에 일부 데이터 처리를 위탁합니다. 모두 데이터 보관 위치가 해외(미국)이며, 회원이 가입 시 본 처리방침에 동의함으로써 해외 이전에 동의한 것으로 간주됩니다.</p>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-1.5 text-left">수탁업체</th>
              <th className="px-2 py-1.5 text-left">위탁 업무</th>
              <th className="px-2 py-1.5 text-left">처리 데이터</th>
              <th className="px-2 py-1.5 text-left">보관 위치</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Neon (Postgres)</td><td className="px-2 py-1.5">데이터베이스 호스팅</td><td className="px-2 py-1.5">회원 정보·서비스 데이터 전체</td><td className="px-2 py-1.5">미국 (AWS)</td></tr>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Railway</td><td className="px-2 py-1.5">서버 호스팅</td><td className="px-2 py-1.5">서비스 처리 중 일시 데이터</td><td className="px-2 py-1.5">미국</td></tr>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Vercel</td><td className="px-2 py-1.5">클라이언트 앱 배포·CDN</td><td className="px-2 py-1.5">정적 자산·HTTP 로그</td><td className="px-2 py-1.5">미국 (글로벌 CDN)</td></tr>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Cloudinary</td><td className="px-2 py-1.5">사진 저장·전송</td><td className="px-2 py-1.5">회원이 업로드한 사진</td><td className="px-2 py-1.5">미국</td></tr>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Anthropic (Claude API)</td><td className="px-2 py-1.5">AI 비서 응답 생성</td><td className="px-2 py-1.5">AI비서에 입력된 질문 본문</td><td className="px-2 py-1.5">미국</td></tr>
            <tr className="border-t dark:border-gray-700"><td className="px-2 py-1.5">Resend (정식 출시 후)</td><td className="px-2 py-1.5">이메일 발송</td><td className="px-2 py-1.5">수신자 이메일·메일 본문</td><td className="px-2 py-1.5">미국</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">각 수탁업체와는 데이터 처리 위탁 계약을 체결하여 개인정보 보호 수준을 유지하도록 합니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">6. 회원의 권리</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><b>열람</b> — 본인의 개인정보 조회 (서비스 내 설정 페이지)</li>
        <li><b>수정</b> — 부정확한 정보 수정 (서비스 내 설정 페이지)</li>
        <li><b>삭제</b> — 회원 탈퇴 시 모든 개인정보 즉시 파기</li>
        <li><b>처리 정지</b> — 특정 처리에 대한 정지 요청 (이메일 문의)</li>
      </ul>
      <p>권리 행사는 서비스 내 기능 또는 support@suplex.kr 이메일을 통해 가능합니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">7. 개인정보의 안전성 확보 조치</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><b>기술적</b> — 비밀번호 단방향 암호화(bcrypt), HTTPS 전송, JWT 기반 인증, 세션 무효화 즉시 반영, IP 기반 감사 로그</li>
        <li><b>관리적</b> — 접근 권한 최소화(대표자 외 직원 접근 통제), 외부 수탁업체와의 처리 위탁 계약</li>
        <li><b>물리적</b> — 클라우드 기반이므로 별도 물리적 시설 없음. 클라우드 사업자의 보안 조치에 따름</li>
      </ul>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">8. 쿠키 및 유사 기술</h2>
      <p>본 서비스는 로그인 유지 목적의 인증 토큰을 브라우저 localStorage에 저장합니다. 추적·광고·분석 목적의 제3자 쿠키는 사용하지 않습니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">9. 개인정보 보호책임자</h2>
      <p>이메일: support@suplex.kr — 개인정보 관련 문의·민원은 본 책임자에게 신고할 수 있으며, 신속하게 답변·처리해드립니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">10. 권익 침해 구제 방법</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>개인정보분쟁조정위원회 — 1833-6972 / www.kopico.go.kr</li>
        <li>개인정보침해신고센터 — 118 / privacy.kisa.or.kr</li>
        <li>대검찰청 사이버범죄수사단 — 1301 / www.spo.go.kr</li>
        <li>경찰청 사이버수사국 — 182 / cyberbureau.police.go.kr</li>
      </ul>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">11. 처리방침 변경</h2>
      <p>본 처리방침은 법령·정책 변경에 따라 갱신될 수 있으며, 변경 시 시행일 7일 전(중요 변경은 30일 전) 서비스 내 공지 및 이메일을 통해 통지합니다.</p>

      <p className="mt-6 text-xs text-gray-500">부칙 — 본 처리방침은 2026-04-30부터 시행됩니다.</p>
    </LegalDoc>
  );
}
