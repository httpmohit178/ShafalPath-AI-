import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MargdarshakChat from './components/MargdarshakChat';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import JdMatcher from './pages/JdMatcher';
import Roadmap from './pages/Roadmap';
import MockInterview from './pages/MockInterview';
import DsaRecommender from './pages/DsaRecommender';
import LiveCoding from './pages/LiveCoding';
import Rewards from './pages/Rewards';
import AuthPage from './pages/AuthPage';
import ResumeBuilder from './pages/ResumeBuilder';
import JobBoards from './pages/JobBoards';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading SafalPath...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#FAF8F5]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-8 max-w-5xl w-full mx-auto">
          {user?.demoMode && <div className="demo-mode-banner"><span>OFFLINE PRACTICE</span><p>You are signed in. Some tools are using local practice data while the backend is unavailable; reconnect to sync changes.</p></div>}
          <Outlet />
        </main>
      </div>
      <MargdarshakChat />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume" element={<ResumeAnalyzer />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/jobs" element={<JobBoards />} />
            <Route path="/jd-matcher" element={<JdMatcher />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/interview" element={<MockInterview />} />
            <Route path="/dsa" element={<DsaRecommender />} />
            <Route path="/coding" element={<LiveCoding />} />
            <Route path="/rewards" element={<Rewards />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
