import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BetaGate from './components/BetaGate';
import FeatureGate from './components/FeatureGate';
import { F } from './utils/features';
import { useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import InviteAccept from './pages/InviteAccept';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import TeamManagement from './pages/TeamManagement';
import Settings from './pages/Settings';

import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import ProjectQuotes from './pages/ProjectQuotes';
import ProjectSimpleQuotes from './pages/ProjectSimpleQuotes';
import Expenses from './pages/Expenses';
import Orders from './pages/Orders';
import AIAssistant from './pages/AIAssistant';
import ProjectSchedule from './pages/ProjectSchedule';
import ProjectMaterialsSimple from './pages/ProjectMaterialsSimple';
import ProjectOrders from './pages/ProjectOrders';
import ProjectChecklist from './pages/ProjectChecklist';
import ProjectReports from './pages/ProjectReports';
import ProjectExpenses from './pages/ProjectExpenses';
import ProjectMemo from './pages/ProjectMemo';
import ProjectSettlement from './pages/ProjectSettlement';
import ProjectQuoteConsultations from './pages/ProjectQuoteConsultations';
import ProjectProcessOverview from './pages/ProjectProcessOverview';
import ProjectUtilities from './pages/ProjectUtilities';
import Lounge from './pages/Lounge';
import LoungePost from './pages/LoungePost';
import IntroHome from './pages/IntroHome';

// 홈 라우트 분기:
// - 일반회원(회사 없음): IntroHome (수플렉스 소개·CTA)
// - 회사 미승인: /lounge로 (베타 깔때기)
// - 회사 승인·슈퍼어드민: Dashboard
function HomeRoute() {
  const { auth, isAuthChecked } = useAuth();
  if (isAuthChecked && auth && !auth.isSuperAdmin) {
    if (!auth.company) {
      return <IntroHome />;
    }
    if (
      auth.company.approvalStatus &&
      auth.company.approvalStatus !== 'APPROVED'
    ) {
      return <Navigate to="/lounge" replace />;
    }
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* 라운지 — 베타 진입 통제 우회. 미승인 회사도 자유롭게 접근/활동 */}
        <Route path="/lounge" element={<Lounge />} />
        <Route path="/lounge/:postId" element={<LoungePost />} />

        {/* 어드민 — 슈퍼어드민 전용이므로 BetaGate 불필요 (어드민 자체가 isSuperAdmin 체크) */}
        <Route path="/admin" element={<Admin />} />

        {/* 홈 — 미승인은 /lounge로 자동, 승인은 Dashboard */}
        <Route path="/" element={<HomeRoute />} />

        {/* 그 외 메뉴는 미승인이면 BetaGate가 베타 준비중 화면으로 차단 */}
        <Route path="/schedule" element={<BetaGate><Schedule /></BetaGate>} />
        <Route path="/expenses" element={<BetaGate><FeatureGate feature={F.EXPENSES_VIEW}><Expenses /></FeatureGate></BetaGate>} />
        <Route path="/orders" element={<BetaGate><Orders /></BetaGate>} />
        <Route path="/ai-assistant" element={<BetaGate><FeatureGate feature={F.AI_ASSISTANT}><AIAssistant /></FeatureGate></BetaGate>} />
        <Route path="/team" element={<BetaGate><TeamManagement /></BetaGate>} />
        <Route path="/settings" element={<BetaGate><Settings /></BetaGate>} />

        <Route path="/projects" element={<BetaGate><Projects /></BetaGate>} />
        <Route path="/projects/new" element={<BetaGate><NewProject /></BetaGate>} />

        <Route path="/projects/:id" element={<BetaGate><ProjectDetail /></BetaGate>}>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="quotes" element={<ProjectSimpleQuotes />} />
          <Route path="quotes-detail" element={<ProjectQuotes />} />
          <Route path="quote-consultations" element={<ProjectQuoteConsultations />} />
          <Route path="schedule" element={<ProjectSchedule />} />
          <Route path="materials" element={<ProjectMaterialsSimple />} />
          <Route path="orders" element={<ProjectOrders />} />
          <Route path="memo" element={<ProjectMemo />} />
          <Route path="process" element={<ProjectProcessOverview />} />
          <Route path="checklist" element={<ProjectChecklist />} />
          <Route path="reports" element={<ProjectReports />} />
          <Route path="expenses" element={<FeatureGate feature={F.EXPENSES_VIEW} redirectTo="schedule"><ProjectExpenses /></FeatureGate>} />
          <Route path="settlement" element={<FeatureGate feature={F.EXPENSES_VIEW} redirectTo="schedule"><ProjectSettlement /></FeatureGate>} />
          <Route path="tools" element={<ProjectUtilities />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
