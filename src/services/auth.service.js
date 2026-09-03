import { apiFetch } from './api';

export const authService = {
  login: async ({ email, password }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  },

  getCurrentUser: async () => {
    const data = await apiFetch('/auth/me');
    return data;
  },

  resetPassword: async ({ userId, newPassword }) => {
    const data = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword })
    });
    return data;
  }
};
