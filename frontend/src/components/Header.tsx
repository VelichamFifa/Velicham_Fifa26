import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';

export default function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊', private: true },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/admin', label: 'Admin', icon: '🛡️', adminOnly: true }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    window.location.href = '/';
  };

  return (
    <header className="bg-white text-gray-900 border-b border-kerala-blue-100 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/VelichamLogo.png"
              alt="Velicham logo"
              className="h-10 w-10 object-contain transform group-hover:scale-110 transition-transform"
            />
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-xl font-black text-kerala-blue-900 tracking-tight leading-tight">Kerala Assembly Election</h1>
              <p className="text-[8px] sm:text-[10px] text-kerala-blue-600 uppercase tracking-widest font-bold"> 2026 Prediction</p>
            </div>
          </Link>

          {/* Right Side Actions & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks
                .filter(link => {
                  if (link.private && !user) return false;
                  if (link.adminOnly && user?.role !== 'admin') return false;
                  return true;
                })
                .map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-kerala-blue-50 ${isActive(link.path)
                      ? 'bg-kerala-blue-100 text-kerala-blue-800'
                      : 'text-gray-600 hover:text-kerala-blue-700'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>

            <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                >
                  <div className="w-9 h-9 bg-kerala-blue-700 rounded-full flex items-center justify-center border-2 border-kerala-blue-100 text-white text-sm font-bold shadow-sm">
                    {user.First_Name?.[0]}{user.Last_Name?.[0]}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-bold leading-none text-gray-900">{user.First_Name}</p>
                    <p className="text-[10px] text-kerala-blue-600 mt-1 font-semibold uppercase tracking-wider">Account</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-kerala-blue-700 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user.First_Name} {user.Last_Name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.Email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-kerala-blue-50 hover:text-kerala-blue-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-kerala-blue-700 transition-colors"
                >
                  Login
                </Link>

              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-kerala-blue-900 hover:bg-gray-100 transition-colors"
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
        </div>
      </div>

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-kerala-blue-100 animate-in slide-in-from-top duration-200 shadow-2xl relative z-40">
          <div className="px-4 py-6 space-y-1">
            {navLinks
              .filter(link => {
                if (link.private && !user) return false;
                if (link.adminOnly && user?.role !== 'admin') return false;
                return true;
              })
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-4 rounded-xl text-base font-bold transition-all ${isActive(link.path)
                    ? 'bg-kerala-blue-50 text-kerala-blue-800 border-l-4 border-kerala-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-kerala-blue-700'
                    }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}

            {!user && (
              <div className="pt-4 grid grid-cols-2 gap-3 pb-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-xl bg-gray-100 text-gray-700 font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-xl bg-kerala-blue-700 text-white font-bold"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
