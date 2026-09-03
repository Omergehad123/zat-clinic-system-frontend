import { create } from 'zustand';
import { authService } from '../services/auth.service';

const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return { user: null, branch: null, token: null, isAuthenticated: false };
  }
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const branchStr = localStorage.getItem('branch');
    const user = userStr ? JSON.parse(userStr) : null;
    const branch = branchStr ? JSON.parse(branchStr) : null;
    if (token && user) {
      return { user, branch, token, isAuthenticated: true };
    }
  } catch (e) {
    // ignore JSON parse error
  }
  return { user: null, branch: null, token: null, isAuthenticated: false };
};

const initialState = getInitialAuthState();

export const useAuthStore = create((set, get) => ({
  user: initialState.user,
  branch: initialState.branch,
  token: initialState.token,
  isAuthenticated: initialState.isAuthenticated,

  login: async (email, password) => {
    const response = await authService.login({ email, password });
    
    if (typeof window !== 'undefined') {
      if (response.token) localStorage.setItem('token', response.token);
      if (response.user) localStorage.setItem('user', JSON.stringify(response.user));
      if (response.branch) localStorage.setItem('branch', JSON.stringify(response.branch));
    }

    set({
      user: response.user,
      branch: response.branch || null,
      token: response.token,
      isAuthenticated: true
    });
    return response;
  },

  checkAuth: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!token) {
      get().logout();
      return;
    }
    try {
      const response = await authService.getCurrentUser();
      if (response?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.user));
          if (response.branch) localStorage.setItem('branch', JSON.stringify(response.branch));
        }
        set({
          user: response.user,
          branch: response.branch || get().branch,
          token,
          isAuthenticated: true
        });
      }
    } catch (err) {
      get().logout();
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('branch');
      localStorage.removeItem('clinic_auth_session');
      localStorage.removeItem('super_admin_clinic_auth_session');
    }
    set({
      user: null,
      branch: null,
      token: null,
      isAuthenticated: false
    });
  },

  setUser: (user, branch) => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      if (branch) localStorage.setItem('branch', JSON.stringify(branch));
    }
    set({ user, branch, isAuthenticated: !!user });
  }
}));
