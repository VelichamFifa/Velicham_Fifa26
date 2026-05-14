import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-secondary">
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
                  Predict Today
                </Link>
              )}
            </div>
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

      </div>
    </div>
  );
};

export default Home;
