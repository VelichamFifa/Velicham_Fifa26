import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';

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
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-600">
          Velicham North America - Fifa Prediction 2026. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
