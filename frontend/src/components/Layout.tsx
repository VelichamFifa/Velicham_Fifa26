import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuthStore } from '../context/store';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-100">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-28">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-green-200">
            Kerala Election Predictor - Track & Predict Election Results
          </p>
          <p className="text-xs text-green-300 mt-1">
            Built for political forecasting and community engagement
          </p>
        </div>
      </footer>
    </div>
  );
}
