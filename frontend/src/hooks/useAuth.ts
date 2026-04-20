import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../context/store';

export const useAuth = () => {
  const { user, token, logout } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  const checkAuth = useCallback(async () => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user');
  }, []);

  useEffect(() => {
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  return {
    user,
    isAuthenticated,
    logout,
    checkAuth
  };
};
