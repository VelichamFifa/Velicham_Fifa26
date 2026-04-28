import { useAuthStore } from '../context/authStore';

export const useAuth = () => {
  const { isLoggedIn, token, user, login, logout, setUser } = useAuthStore();

  return {
    isLoggedIn,
    token,
    user,
    login,
    logout,
    setUser,
  };
};
