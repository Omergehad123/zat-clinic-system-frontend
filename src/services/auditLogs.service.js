import { apiFetch } from './api';

export const auditLogsService = {
  getAuditLogs: async (filters = {}) => {
    let query = '?';
    if (filters.branchId && filters.branchId !== 'all') {
      query += `branchId=${filters.branchId}&`;
    }
    if (filters.entity) {
      query += `entity=${filters.entity}&`;
    }
    if (filters.action) {
      query += `action=${filters.action}&`;
    }
    const res = await apiFetch(`/audit-logs${query}`);
    return res.data || [];
  }
};
