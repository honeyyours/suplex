import { useAuth } from '../contexts/AuthContext';
import PendingApproval from '../pages/PendingApproval';

// 라운지 외 메뉴를 감싸 미승인 회사면 베타 준비중 페이지 표시.
// 슈퍼어드민은 우회. isAuthChecked 전에는 깜빡임 방지 위해 일단 통과.
export default function BetaGate({ children }) {
  const { auth, isAuthChecked } = useAuth();
  if (
    isAuthChecked &&
    auth &&
    !auth.isSuperAdmin &&
    auth.company?.approvalStatus &&
    auth.company.approvalStatus !== 'APPROVED'
  ) {
    return <PendingApproval />;
  }
  return children;
}
