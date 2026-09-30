import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound, SearchPage } from './pages/Misc';
import { ProjectDetail } from './pages/ProjectDetail';
import { Projects } from './pages/Projects';
import { Register } from './pages/Register';
import { TaskDetail } from './pages/TaskDetail';
import { Team } from './pages/Team';

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-500">Loading your workspace…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
      <Route path="/app" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
      <Route path="/app/projects" element={<RequireAuth><AppLayout><Projects /></AppLayout></RequireAuth>} />
      <Route path="/app/projects/:id" element={<RequireAuth><AppLayout><ProjectDetail /></AppLayout></RequireAuth>} />
      <Route path="/app/tasks/:id" element={<RequireAuth><AppLayout><TaskDetail /></AppLayout></RequireAuth>} />
      <Route path="/app/team" element={<RequireAuth><AppLayout><Team /></AppLayout></RequireAuth>} />
      <Route path="/app/search" element={<RequireAuth><AppLayout><SearchPage /></AppLayout></RequireAuth>} />
      <Route path="*" element={<RequireAuth><AppLayout><NotFound /></AppLayout></RequireAuth>} />
    </Routes>
  );
}
