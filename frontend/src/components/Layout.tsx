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
    <div className="flex flex-col bg-gradient-to-br from-kerala-blue-50 to-kerala-blue-100">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-28">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-kerala-blue-700 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-kerala-blue-200">
            Velicham North America - Kerala Assembly Election Prediction 2026. All rights reserved.
          </p>

        </div>
      </footer>
    </div>
  );
}
