import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../context/store';

export const useAuth = () => {
  const { user, token, verifyToken, logout, fetchProfile } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  const checkAuth = useCallback(async () => {
    const isValid = await verifyToken();
    if (isValid) {
      await fetchProfile();
    }
    return isValid;
  }, [verifyToken, fetchProfile]);

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
