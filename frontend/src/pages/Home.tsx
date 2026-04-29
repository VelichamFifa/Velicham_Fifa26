import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-secondary">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">🏆 Fifa26Predictor</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-6 sm:mb-8 px-4">
            Predict football match results, compete with friends, and win glory!
          </p>

          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/register"
                className="px-6 sm:px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition text-center"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 sm:px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition text-center"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">⚽ Make Predictions</h3>
            <p className="text-gray-600">
              Predict the scores of upcoming FIFA matches before the deadline and earn points based on accuracy.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">🏅 Climb Leaderboards</h3>
            <p className="text-gray-600">
              Compete individually and with your community. Track daily and all-time rankings.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">👥 Join Communities</h3>
            <p className="text-gray-600">
              Be part of up to 2 communities and help them climb the community leaderboard.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="font-bold text-primary mb-2">1. Sign Up</h3>
              <p className="text-gray-600 text-sm">Register and select up to 2 communities</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold text-primary mb-2">2. Predict</h3>
              <p className="text-gray-600 text-sm">Submit your score predictions before the match</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚽</span>
              </div>
              <h3 className="font-bold text-primary mb-2">3. Watch</h3>
              <p className="text-gray-600 text-sm">Follow the matches and see how you performed</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-bold text-primary mb-2">4. Rank</h3>
              <p className="text-gray-600 text-sm">Earn points and climb the leaderboards</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Scoring System</h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="font-bold text-lg text-primary mb-4">Points Calculation</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <span className="text-gray-700"><strong>5 points</strong> - Correct match result (win/loss/draw)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">⚽</span>
                  <span className="text-gray-700"><strong>2 points</strong> - Correct Team 1 score</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">⚽</span>
                  <span className="text-gray-700"><strong>2 points</strong> - Correct Team 2 score</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <span className="text-gray-700"><strong>1 point</strong> - Correct goal difference</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-primary mb-4">Example</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                <p><strong>Match:</strong> Brazil (2) vs Germany (1)</p>
                <p><strong>Your Prediction:</strong> Brazil (2) vs Germany (1)</p>
                <p className="border-t pt-2">
                  ✅ Correct Result: 5 pts<br/>
                  ✅ Brazil Score: 2 pts<br/>
                  ✅ Germany Score: 2 pts<br/>
                  ✅ Goal Difference: 1 pt<br/>
                  <strong className="block mt-2 text-secondary">Total: 10 points!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
