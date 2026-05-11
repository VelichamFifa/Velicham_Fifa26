import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const Header: React.FC = () => {
  const { isLoggedIn, user, logout, setUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const didRefreshProfile = useRef(false);

  // Keep the cached user (localStorage) in sync with backend role changes.
  useEffect(() => {
    if (!isLoggedIn || didRefreshProfile.current) return;

    didRefreshProfile.current = true;
    apiService
      .getProfile()
      .then((res) => setUser(res.data))
      .catch(() => {
        // Ignore: auth interceptor will handle 401s.
      });
  }, [isLoggedIn, setUser]);

  return (
    <header className="bg-primary text-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">🏆 Fifa26Predictor</h1>
          </Link>

          {/* Mobile: Show Login/Register or Menu button */}
          <div className="md:hidden flex items-center gap-2">
            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs bg-secondary rounded hover:bg-blue-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs border border-white rounded hover:bg-blue-800 transition"
                >
                  Register
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded hover:bg-blue-800 transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/" className="hover:text-secondary transition">
              Home
            </Link>
            <Link to="/leaderboard" className="hover:text-secondary transition">
              Leaderboard
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="hover:text-secondary transition">
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-secondary font-bold text-yellow-400 transition">
                    Admin
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 hover:text-secondary transition focus:outline-none"
                  >
                    <span className="text-sm font-medium">
                      Hi, {user?.firstName}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          window.location.href = '/';
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm bg-secondary rounded hover:bg-blue-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 text-sm border border-secondary rounded hover:bg-secondary transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-blue-800 space-y-3">
            <Link
              to="/"
              className="block py-2 hover:text-secondary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/leaderboard"
              className="block py-2 hover:text-secondary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 hover:text-secondary transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block py-2 hover:text-secondary font-bold text-yellow-400 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="pt-2 border-t border-blue-800 space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="block text-sm font-bold">
                      Hi, {user?.firstName}
                    </span>
                    <span className="text-[10px] text-blue-300 truncate max-w-[150px]">{user?.email}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="block py-2 hover:text-secondary transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-danger rounded hover:bg-red-600 transition mt-2"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-2 border-t border-blue-800">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 bg-secondary rounded hover:bg-blue-600 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center px-4 py-2 border border-secondary rounded hover:bg-secondary transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
