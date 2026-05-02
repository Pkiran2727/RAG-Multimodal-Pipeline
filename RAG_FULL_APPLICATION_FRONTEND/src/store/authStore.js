import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!sessionStorage.getItem('token'),
  
  login: async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const { data } = await api.post('/auth/login', formData);
      sessionStorage.setItem('token', data.access_token);
      set({ isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  },
  
  logout: () => {
    sessionStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
}));
