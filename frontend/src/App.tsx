import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

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


function App() {
  return (
    <Router>
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
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
