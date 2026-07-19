import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { trackPageView } from './services/appInsights';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaderboardPage from './pages/Leaderboard';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import MyPredictions from './pages/MyPredictions';
import AdminDashboard from './pages/AdminDashboard';
import CommunityMembers from './pages/CommunityMembers';
import Contact from './pages/Contact';
import Communities from './pages/Communities';
import WinnersPage from './pages/Winners';

import GroupLeaderboardPage from './pages/GroupLeaderboardPage';
import Round32LeaderboardPage from './pages/Round32LeaderboardPage';
import R16LeaderboardPage from './pages/R16LeaderboardPage';
import QuarterLeaderboardPage from './pages/QuarterLeaderboardPage';
import SemifinalLeaderboardPage from './pages/SemifinalLeaderboardPage';
function RouteTelemetry() {
  const location = useLocation();
  const lastTrackedPathRef = useRef<string>('');

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    if (path === lastTrackedPathRef.current) {
      return;
    }

    lastTrackedPathRef.current = path;
    trackPageView(location.pathname || 'unknown', window.location.href);
  }, [location.pathname, location.search, location.hash]);

  return null;
}


function App() {
  return (
    <Router>
      <RouteTelemetry />
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0c1a1a 100%)' }}>
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/my-predictions" element={<MyPredictions />} />
            <Route path="/community/:communityId/members" element={<CommunityMembers />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/winners" element={<WinnersPage />} />
            <Route path="/group-stages" element={<GroupLeaderboardPage />} />
            <Route path="/round-32" element={<Round32LeaderboardPage />} />
            <Route path="/round-16" element={<R16LeaderboardPage />} />
            <Route path="/quarter-leaderboard" element={<QuarterLeaderboardPage />} />
            <Route path="/semifinal-leaderboard" element={<SemifinalLeaderboardPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
