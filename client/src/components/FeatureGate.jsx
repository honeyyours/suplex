import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccess } from '../utils/features';

// 기능 가드 — feature 미허용 시 redirect 또는 fallback 렌더
// 사용 예: <FeatureGate feature={F.EXPENSES_VIEW}><Expenses /></FeatureGate>
export default function FeatureGate({ feature, children, redirectTo = '/', fallback = null }) {
  const { auth } = useAuth();
  if (!canAccess(auth, feature)) {
    if (fallback !== null) return fallback;
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
