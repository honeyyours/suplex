import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ExpensesGate from './components/ExpensesGate';

import Login from './pages/Login';
import Signup from './pages/Signup';
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
import AIBookkeeper from './pages/AIBookkeeper';
import ProjectSchedule from './pages/ProjectSchedule';
import ProjectMaterials from './pages/ProjectMaterials';
import ProjectMaterialsSimple from './pages/ProjectMaterialsSimple';
import ProjectOrders from './pages/ProjectOrders';
import ProjectChecklist from './pages/ProjectChecklist';
import ProjectReports from './pages/ProjectReports';
import ProjectExpenses from './pages/ProjectExpenses';
import ProjectMemo from './pages/ProjectMemo';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/expenses" element={<ExpensesGate><Expenses /></ExpensesGate>} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/ai-bookkeeper" element={<ExpensesGate><AIBookkeeper /></ExpensesGate>} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<NewProject />} />

        <Route path="/projects/:id" element={<ProjectDetail />}>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="quotes" element={<ProjectSimpleQuotes />} />
          <Route path="quotes-detail" element={<ProjectQuotes />} />
          <Route path="schedule" element={<ProjectSchedule />} />
          <Route path="materials" element={<ProjectMaterialsSimple />} />
          <Route path="materials-advanced" element={<ProjectMaterials />} />
          <Route path="orders" element={<ProjectOrders />} />
          <Route path="memo" element={<ProjectMemo />} />
          <Route path="checklist" element={<ProjectChecklist />} />
          <Route path="reports" element={<ProjectReports />} />
          <Route path="expenses" element={<ExpensesGate redirectTo="schedule"><ProjectExpenses /></ExpensesGate>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
