import { apiFetch } from './api';

export const branchesService = {
  getBranches: async () => {
    const res = await apiFetch('/branches');
    return res.data || [];
  },

  getBranchById: async (id) => {
    const res = await apiFetch(`/branches/${id}`);
    return res.data;
  },

  createBranch: async (branchData, managerData = null) => {
    const body = {
      name: branchData.name,
      address: branchData.address || '',
      phone: branchData.phone || '',
      managerName: managerData?.name,
      managerEmail: managerData?.email,
      managerPassword: managerData?.password
    };
    const res = await apiFetch('/branches', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return { branch: res.data, manager: res.data?.manager };
  },

  updateBranch: async (id, branchData) => {
    const res = await apiFetch(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchData)
    });
    return res.data;
  },

  toggleBranchStatus: async (id) => {
    const res = await apiFetch(`/branches/${id}`);
    const branch = res.data;
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    const updated = await apiFetch(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    return updated.data;
  },

  getBranchPerformance: async () => {
    const now = new Date();
    const res = await apiFetch(`/reports/comparison?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
    return (res.data || []).map(b => ({
      id: b.branchId,
      name: b.branchName,
      status: 'active',
      revenues: b.income,
      expenses: b.expenses,
      netRevenue: b.netIncome,
      activePatients: b.patientsCount,
      totalAdvances: b.advancesTotal
    }));
  }
};
