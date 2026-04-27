import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 회사의 hideExpenses 토글이 켜져 있으면 지출 관련 라우트 진입을 차단한다.
// 상위 네비/탭에서 이미 숨기지만, 직접 URL 입력이나 북마크 진입을 막기 위한 가드.
export default function ExpensesGate({ children, redirectTo = '/' }) {
  const { auth } = useAuth();
  if (auth?.company?.hideExpenses) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
