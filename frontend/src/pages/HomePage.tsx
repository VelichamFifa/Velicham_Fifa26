import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  return (
    <div className="flex-1 flex flex-col bg-kerala-blue-50">
      {/* Hero Section */}
      <section className="flex-1 relative overflow-hidden bg-gradient-to-br from-kerala-blue-800 via-kerala-blue-700 to-kerala-blue-700 flex items-center py-10 sm:py-16">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse "></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="text-xs font-black text-white uppercase tracking-widest">Kerala Assembly Election 2026 </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Predict the Pulse of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kerala-blue-300 to-kerala-blue-400">
              God's Own Country
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-green-100 mb-8 leading-relaxed">
            Predict seat shares for UDF, LDF, and NDA, climb the Halaqa leaderboards, and prove your political acumen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-white text-kerala-blue-900 font-bold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center"
              >
                Go to Dashboard <span className="ml-2">🚀</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white text-kerala-blue-900 font-bold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center"
                >
                  Start Predicting
                </Link>
                <Link
                  to="/leaderboard"
                  className="px-8 py-4 bg-kerala-blue-700/30 text-white font-bold rounded-xl hover:bg-kerala-blue-700/50 transition-all border border-kerala-blue-400/30 backdrop-blur-md flex items-center justify-center"
                >
                  View Leaderboard <span className="ml-2">🏆</span>
                </Link>
              </>
            )}
          </div>
          <p className="max-w-2xl mx-auto mt-6 text-sm text-kerala-blue-100 mb-4 leading-relaxed font-bold">
            Exclusive Portal for Velicham Halaqa Members !!
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
