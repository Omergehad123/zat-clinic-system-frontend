import { apiFetch } from './api';

export const advancesService = {
  getAdvances: async (branchIdOrFilters = 'all', search = '', role = 'ALL', date = '') => {
    let query = '?';
    if (typeof branchIdOrFilters === 'object' && branchIdOrFilters !== null) {
      const f = branchIdOrFilters;
      if (f.branchId && f.branchId !== 'all') query += `branchId=${f.branchId}&`;
      if (f.employeeId) query += `employeeId=${f.employeeId}&`;
      if (f.month && f.year) query += `month=${f.month}&year=${f.year}&`;
    } else {
      if (branchIdOrFilters && branchIdOrFilters !== 'all') query += `branchId=${branchIdOrFilters}&`;
    }

    const res = await apiFetch(`/advances${query}`);
    let advances = res.data || [];

    // Client-side filter by search
    if (search) {
      advances = advances.filter(a => a.employeeName?.includes(search));
    }

    // Client-side filter by role (Arabic)
    if (role && role !== 'ALL') {
      const roleMap = { 'دكتور': 'doctor', 'تمريض': 'nurse', 'مشرف': 'supervisor', 'عامل': 'worker' };
      const englishRole = roleMap[role] || role;
      advances = advances.filter(a => a.role === englishRole || a.employeeType === role);
    }

    // Client-side filter by date
    if (date) {
      advances = advances.filter(a => {
        const d = new Date(a.date);
        return d.toISOString().slice(0, 10) === date;
      });
    }

    const totalToday = advances
      .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
      .reduce((s, a) => s + (a.amount || 0), 0);
    const totalMonth = advances.reduce((s, a) => s + (a.amount || 0), 0);

    return {
      advances,
      totalAmount: res.totalAmount || 0,
      roleTotals: res.roleTotals || {},
      totals: { today: totalToday, month: totalMonth }
    };
  },

  createAdvance: async (advanceData) => {
    const res = await apiFetch('/advances', {
      method: 'POST',
      body: JSON.stringify(advanceData)
    });
    return res.data;
  },

  addAdvance: async (advanceData) => {
    return advancesService.createAdvance(advanceData);
  }
};
