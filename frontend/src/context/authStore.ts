import { create } from 'zustand';
import { AuthState, User } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user') as string)
    : null,
  isLoggedIn: !!localStorage.getItem('token'),

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isLoggedIn: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
