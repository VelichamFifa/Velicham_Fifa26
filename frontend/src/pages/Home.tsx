import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">🏆 Velicham Fifa'26 Prediction</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-6 sm:mb-8 px-4">
            Get ready to participate, compete and celebrate with your community!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/leaderboard"
                className="px-6 sm:px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition text-center inline-flex items-center justify-center gap-2"
              >
                <span aria-hidden="true">🏅</span>
                View Leaderboard
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition text-center"
                >
                  Login
                </Link>
              )}
                {isLoggedIn && (
                  <Link
                    to="/dashboard"
                    className="px-6 sm:px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition text-center inline-flex items-center justify-center gap-2"
                  >
                    <span aria-hidden="true">📊</span>
                    View Dashboard
                  </Link>
                )}
            </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">⚽ Make Predictions</h3>
            <p className="text-white/70">
              Predict the scores of upcoming FIFA matches before the deadline and earn points based on accuracy.
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">🏅 Climb Leaderboards</h3>
            <p className="text-white/70">
              Compete individually and with your community. Track daily and all-time rankings.
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">👥 Join Communities</h3>
            <p className="text-white/70">
              Be part of up to 2 communities and help them climb the community leaderboard.
            </p>
          </div>
        </div>

        {/* Scoring Rules */}
        <div className="bg-white/10 border border-white/15 rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white mb-3">📊 Scoring Rules</h3>
          <ul className="text-sm text-white/80 space-y-2">
            <li className="flex items-center gap-2">✅ <span><strong>Correct Result:</strong> 5 points</span></li>
            <li className="flex items-center gap-2">⚽ <span><strong>Correct Team 1 Score:</strong> 2 points</span></li>
            <li className="flex items-center gap-2">⚽ <span><strong>Correct Team 2 Score:</strong> 2 points</span></li>
            <li className="flex items-center gap-2">🎯 <span><strong>Correct Goal Difference:</strong> 1 point</span></li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Home;
