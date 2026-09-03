import { apiFetch } from './api';

export const usersService = {
  getUsers: async (filters = {}) => {
    let query = '?';
    if (filters.branchId && filters.branchId !== 'all') {
      query += `branchId=${filters.branchId}&`;
    }
    const res = await apiFetch(`/users${query}`);
    return res.data || [];
  },

  getBranchManagers: async () => {
    const users = await usersService.getUsers();
    return users.filter(u => u.role === 'branch_manager');
  },

  getUserById: async (id) => {
    const users = await usersService.getUsers();
    const user = users.find(u => u.id === id || u._id === id);
    if (!user) throw new Error('المستخدم غير موجود');
    return user;
  },

  createUser: async (userData) => {
    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return res.data;
  },

  updateUser: async (id, userData) => {
    const res = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return res.data;
  },

  toggleUserStatus: async (id) => {
    const user = await usersService.getUserById(id);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    return res.data;
  },

  resetPassword: async (id, newPassword) => {
    const res = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId: id, newPassword })
    });
    return res;
  }
};
