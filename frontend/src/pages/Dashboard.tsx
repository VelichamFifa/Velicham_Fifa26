import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match } from '../types';
import MatchCard from '../components/MatchCard';
import PredictionForm from '../components/PredictionForm';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showPredictionForm, setShowPredictionForm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    loadMatches();
  }, [isLoggedIn, navigate]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllMatches(undefined, 1, 20);
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictClick = (match: Match) => {
    setSelectedMatch(match);
    setShowPredictionForm(true);
  };

  const handlePredictionSuccess = () => {
    setShowPredictionForm(false);
    setSelectedMatch(null);
    loadMatches();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Make predictions on upcoming matches and climb the leaderboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Matches</h3>
          <p className="text-3xl font-bold text-secondary">{matches.filter(m => m.status === 'scheduled').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-1">My Predictions</h3>
          <p className="text-3xl font-bold text-secondary">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-1">Current Rank</h3>
          <p className="text-3xl font-bold text-secondary">-</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">Upcoming Matches</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Loading matches...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onPredictClick={handlePredictClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-600">
                No matches scheduled yet
              </div>
            )}
          </div>
        )}
      </div>

      {showPredictionForm && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PredictionForm
            match={selectedMatch}
            onSuccess={handlePredictionSuccess}
            onClose={() => setShowPredictionForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
