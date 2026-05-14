import { useAuth } from '../contexts/AuthContext';
import PendingApproval from '../pages/PendingApproval';
import IntroHome from '../pages/IntroHome';

// 라운지 외 메뉴를 감싸 차단:
// - 일반회원(회사 없음): IntroHome (수플렉스 소개)
// - 회사 미승인: PendingApproval (베타 준비중)
// 슈퍼어드민은 우회. isAuthChecked 전에는 깜빡임 방지 위해 일단 통과.
export default function BetaGate({ children }) {
  const { auth, isAuthChecked } = useAuth();
  if (isAuthChecked && auth && !auth.isSuperAdmin) {
    if (!auth.company) {
      return <IntroHome />;
    }
    if (
      auth.company.approvalStatus &&
      auth.company.approvalStatus !== 'APPROVED'
    ) {
      return <PendingApproval />;
    }
  }
  return children;
}
