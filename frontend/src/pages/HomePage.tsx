import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 py-20 sm:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-8 tracking-tight">
            Predict the Pulse of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              God's Own Country
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-green-100 mb-12 leading-relaxed">
            Predict seat shares for UDF, LDF, and NDA, climb the Halaqa leaderboards, and prove your political acumen.
            
           
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-white text-green-900 font-bold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center"
              >
                Go to Dashboard <span className="ml-2">🚀</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white text-green-900 font-bold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center"
                >
                  Start Predicting
                </Link>
                <Link
                  to="/leaderboard"
                  className="px-8 py-4 bg-green-700/30 text-white font-bold rounded-xl hover:bg-green-700/50 transition-all border border-green-400/30 backdrop-blur-md flex items-center justify-center"
                >
                  View Leaderboard <span className="ml-2">🏆</span>
                </Link>
              </>
            )}
          </div>
          <p className="max-w-2xl mx-auto mt-8 text-sm sm:text-base text-green-100 mb-12 leading-relaxed">
            Exclusive Portal for Velicham Halaqa Members !!
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
