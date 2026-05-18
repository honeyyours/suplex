import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BetaGate from './components/BetaGate';
import FeatureGate from './components/FeatureGate';
import { F } from './utils/features';
import { useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import CrewSignup from './pages/CrewSignup';
import CrewInviteAccept from './pages/CrewInviteAccept';
import InviteAccept from './pages/InviteAccept';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import TeamCalendar from './pages/TeamCalendar';
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
import LoungePostEditor from './pages/LoungePostEditor';
import IntroHome from './pages/IntroHome';

// 홈 라우트 분기:
// - 시공팀(CREW): 일정 화면을 첫 화면으로 (2026-05-17 봉기님 결정 — NAV 일정·라운지만)
// - 일반회원(회사 없음) + 회사 미승인: IntroHome
// - 회사 승인·슈퍼어드민: Dashboard
function HomeRoute() {
  const { auth, isAuthChecked } = useAuth();
  if (isAuthChecked && auth && !auth.isSuperAdmin) {
    if (auth.user?.accountType === 'CREW') return <Navigate to="/schedule" replace />;
    if (!auth.company) return <IntroHome />;
    if (
      auth.company.approvalStatus &&
      auth.company.approvalStatus !== 'APPROVED'
    ) {
      return <IntroHome />;
    }
  }
  return <Dashboard />;
}

// 시공팀이 회사 전용 메뉴에 직접 URL 접근 시 /schedule로 리다이렉트 (NAV 축소 정합).
function CrewGate({ children }) {
  const { auth } = useAuth();
  if (auth?.user?.accountType === 'CREW') return <Navigate to="/schedule" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/crew/signup" element={<CrewSignup />} />
      <Route path="/crew/invite/:token" element={<CrewInviteAccept />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/lounge/new" element={<LoungePostEditor />} />
        <Route path="/lounge/:postId/edit" element={<LoungePostEditor />} />
        <Route path="/lounge/:postId" element={<LoungePost />} />

        {/* 어드민 — 슈퍼어드민 전용이므로 BetaGate 불필요 (어드민 자체가 isSuperAdmin 체크) */}
        <Route path="/admin" element={<Admin />} />

        {/* 홈 — 미승인은 /lounge로 자동, 승인은 Dashboard */}
        <Route path="/" element={<HomeRoute />} />

        {/* 그 외 메뉴는 미승인이면 BetaGate가 베타 준비중 화면으로 차단.
            시공팀(CREW)은 NAV가 일정·라운지만이라 그 외 메뉴 직접 URL 접근 시 CrewGate가 /schedule로 리다이렉트. */}
        <Route path="/schedule" element={<BetaGate><Schedule /></BetaGate>} />
        <Route path="/team-calendar" element={<CrewGate><BetaGate><TeamCalendar /></BetaGate></CrewGate>} />
        <Route path="/expenses" element={<CrewGate><BetaGate><FeatureGate feature={F.EXPENSES_VIEW}><Expenses /></FeatureGate></BetaGate></CrewGate>} />
        <Route path="/orders" element={<CrewGate><BetaGate><Orders /></BetaGate></CrewGate>} />
        <Route path="/ai-assistant" element={<CrewGate><BetaGate><FeatureGate feature={F.AI_ASSISTANT}><AIAssistant /></FeatureGate></BetaGate></CrewGate>} />
        <Route path="/team" element={<CrewGate><BetaGate><TeamManagement /></BetaGate></CrewGate>} />
        <Route path="/settings" element={<BetaGate><Settings /></BetaGate>} />

        <Route path="/projects" element={<CrewGate><BetaGate><Projects /></BetaGate></CrewGate>} />
        <Route path="/projects/new" element={<CrewGate><BetaGate><NewProject /></BetaGate></CrewGate>} />

        <Route path="/projects/:id" element={<CrewGate><BetaGate><ProjectDetail /></BetaGate></CrewGate>}>
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
