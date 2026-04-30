import LegalDoc from './LegalDoc';

export default function Terms() {
  return (
    <LegalDoc title="서비스 이용약관" lastUpdated="2026-04-30">
      <p className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3 text-xs text-amber-900 dark:text-amber-200">
        본 약관은 클로즈 베타 단계의 1차 초안이며, 정식 출시 전 법률 자문을 거쳐 갱신될 예정입니다. 정식 출시 시점에 변경 사항은 30일 사전 통지됩니다.
      </p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제1조 (목적)</h2>
      <p>이 약관은 회사(이하 "수플렉스")가 제공하는 인테리어 운영 도구 서비스(이하 "서비스")의 이용에 관한 회사와 이용자(이하 "회원") 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제2조 (정의)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li><b>서비스</b>: 견적·공정일정·마감재·발주·체크리스트·메모·지출관리 등 인테리어 회사 운영을 위한 SaaS 도구 일체</li>
        <li><b>회원</b>: 본 약관에 동의하고 서비스를 이용하는 회사 및 그 소속 사용자 계정</li>
        <li><b>회사 계정</b>: 한 인테리어 회사 단위로 발급되는 데이터 격리 단위</li>
        <li><b>베타</b>: 정식 출시 전 시범 운영 단계로, 무료 제공되며 일부 기능이 미완성일 수 있음</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제3조 (약관의 효력 및 변경)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>본 약관은 회원이 가입 시 동의함으로써 효력이 발생합니다.</li>
        <li>약관 변경 시 시행일로부터 최소 7일 전(회원에게 불리한 변경은 30일 전) 서비스 내 또는 이메일로 통지합니다.</li>
        <li>변경된 약관에 동의하지 않는 회원은 탈퇴할 수 있으며, 통지 후에도 이용을 계속할 경우 변경에 동의한 것으로 봅니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제4조 (회원가입)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>회원은 가입 시 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.</li>
        <li>수플렉스는 허위 정보 기재·약관 위반 이력·베타 승인 정책 부적합 시 가입 신청을 거부하거나 사후 해지할 수 있습니다.</li>
        <li>베타 단계에서는 수플렉스의 승인 후에 서비스를 이용할 수 있습니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제5조 (서비스 제공)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>수플렉스는 24시간 서비스를 제공하기 위해 노력하나, 시스템 점검·장애·천재지변 등의 사유로 일시 중단될 수 있습니다.</li>
        <li>서비스 점검 시 사전 공지하며, 긴급한 경우 사후 공지할 수 있습니다.</li>
        <li>베타 단계에서는 서비스가 무료로 제공됩니다. 정식 출시 시점부터 가격 정책에 따라 유료 전환되며, 사전 30일 이상 통지합니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제6조 (회원의 의무)</h2>
      <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>타인의 계정·비밀번호 도용</li>
        <li>서비스의 안정적 운영을 방해하는 행위</li>
        <li>수플렉스의 사전 동의 없는 영리 목적의 데이터 추출 또는 자동화된 접근</li>
        <li>본 서비스를 이용하여 타인의 권리를 침해하는 행위</li>
        <li>관련 법령 또는 본 약관을 위반하는 행위</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제7조 (데이터의 권리)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>회원이 입력한 모든 데이터(견적·일정·메모·사진·연락처 등)의 권리는 회원에게 있습니다.</li>
        <li>수플렉스는 서비스 제공 목적으로만 회원 데이터를 처리하며, 회원의 명시적 동의 없이 제3자에게 제공하지 않습니다.</li>
        <li>다만 법령에 의한 요청·서비스 제공에 필요한 외부 API(이미지 저장·AI 분석 등)에 한정된 처리위탁은 예외로 합니다(개인정보처리방침 참조).</li>
        <li>사진 데이터는 회원이 언제든지 ZIP 형태로 부분 보관(자가 백업)할 수 있습니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제8조 (지적재산권)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>서비스의 디자인·소스코드·UI·문서 등 일체의 지적재산권은 수플렉스에 귀속됩니다.</li>
        <li>회원이 서비스 내에 입력한 데이터의 지적재산권은 회원에게 있으며, 수플렉스는 서비스 제공에 필요한 범위 내에서만 이를 처리·저장합니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제9조 (서비스 이용 중지 및 해지)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>회원은 언제든지 서비스 이용을 중지하고 탈퇴할 수 있습니다.</li>
        <li>회원이 본 약관을 위반한 경우 수플렉스는 서비스 이용을 일시 또는 영구 제한할 수 있으며, 사전 통지함을 원칙으로 합니다.</li>
        <li>서비스 종료 시 회원 데이터는 개인정보처리방침에 따라 처리됩니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제10조 (책임 제한)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>수플렉스는 천재지변·전쟁·서비스 외부 기관(인터넷·클라우드·외부 API)의 장애 등 불가항력으로 인한 손해에 대해 책임을 지지 않습니다.</li>
        <li>베타 단계에서는 서비스가 무상 제공되므로, 수플렉스의 고의 또는 중대한 과실이 없는 한 회원의 데이터 손실·기회 손실·간접 손해에 대한 배상 책임이 제한됩니다.</li>
        <li>회원이 입력한 데이터의 정확성·합법성에 대한 책임은 회원에게 있습니다.</li>
      </ol>

      <h2 className="text-lg font-semibold text-navy-800 dark:text-white mt-6">제11조 (관할 및 준거법)</h2>
      <p>본 약관에 관한 사항은 대한민국 법령에 따라 해석되고 적용되며, 수플렉스의 본점 소재지 관할 법원을 1심 관할 법원으로 합니다. 양 당사자는 우선 상호 협의로 해결을 도모합니다.</p>

      <p className="mt-6 text-xs text-gray-500">부칙 — 본 약관은 2026-04-30부터 시행됩니다.</p>
    </LegalDoc>
  );
}
