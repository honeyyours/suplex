import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 로그인 가드만. 베타 승인은 BetaGate에서 라우트별로 분기 (2026-05-14 정책 변경).
// 미승인 사용자도 내부에 진입 가능 — 라운지는 통과, 다른 메뉴는 BetaGate가 PendingApproval 표시.
export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}
