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
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-green-100 uppercase bg-green-700/50 rounded-full backdrop-blur-sm border border-green-500/30">
            2026 Kerala Assembly Elections
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-8 tracking-tight">
            Predict the Pulse of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              God's Own Country
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-green-100 mb-12 leading-relaxed">
            The ultimate platform for political enthusiasts. Predict seat shares for UDF, LDF, and NDA, climb the community leaderboards, and prove your political acumen.
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
                  Start Predicting <span className="ml-2">🗳️</span>
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
        </div>
      </section>


      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-green-900 rounded-[3rem] p-8 sm:p-16 relative overflow-hidden text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-700/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center relative z-10">4 Steps to Glory</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-white/20">👤</div>
                <h4 className="font-bold text-lg">Register</h4>
                <p className="text-green-200 text-sm">Create your profile and link your community</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-white/20">🗳️</div>
                <h4 className="font-bold text-lg">Predict</h4>
                <p className="text-green-200 text-sm">Enter your seat forecasts for UDF, LDF, and NDA</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-white/20">📊</div>
                <h4 className="font-bold text-lg">Track</h4>
                <p className="text-green-200 text-sm">Follow live updates and community rankings</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-white/20">🏆</div>
                <h4 className="font-bold text-lg">Win</h4>
                <p className="text-green-200 text-sm">Earn points as results match your forecasts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-20 bg-green-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Ready to make your mark?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="px-10 py-4 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition shadow-lg">
                Sign In Now
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
