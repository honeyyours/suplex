import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TeamManagement from './pages/TeamManagement';
import Settings from './pages/Settings';

import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import ProjectQuotes from './pages/ProjectQuotes';
import Expenses from './pages/Expenses';
import AIBookkeeper from './pages/AIBookkeeper';
import ProjectSchedule from './pages/ProjectSchedule';
import ProjectMaterials from './pages/ProjectMaterials';
import ProjectChecklist from './pages/ProjectChecklist';
import ProjectReports from './pages/ProjectReports';
import ProjectExpenses from './pages/ProjectExpenses';

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
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/ai-bookkeeper" element={<AIBookkeeper />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<NewProject />} />

        <Route path="/projects/:id" element={<ProjectDetail />}>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="quotes" element={<ProjectQuotes />} />
          <Route path="schedule" element={<ProjectSchedule />} />
          <Route path="materials" element={<ProjectMaterials />} />
          <Route path="checklist" element={<ProjectChecklist />} />
          <Route path="reports" element={<ProjectReports />} />
          <Route path="expenses" element={<ProjectExpenses />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
