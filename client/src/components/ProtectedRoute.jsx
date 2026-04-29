import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PendingApproval from '../pages/PendingApproval';

export default function ProtectedRoute({ children }) {
  const { auth, isAuthChecked } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  // 베타 진입 통제 — 회사가 APPROVED 외이면 PendingApproval로 차단.
  // 슈퍼어드민은 우회. isAuthChecked 전에는 깜빡임 방지 위해 일단 통과 (me 응답 후 결정).
  if (
    isAuthChecked &&
    !auth.isSuperAdmin &&
    auth.company?.approvalStatus &&
    auth.company.approvalStatus !== 'APPROVED'
  ) {
    return <PendingApproval />;
  }
  return children;
}
