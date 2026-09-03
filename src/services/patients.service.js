import { apiFetch } from './api';

export const patientsService = {
  getPatients: async (branchIdOrFilters = 'all', search = '', status = 'ALL') => {
    let query = '?';
    if (typeof branchIdOrFilters === 'object' && branchIdOrFilters !== null) {
      const f = branchIdOrFilters;
      if (f.branchId && f.branchId !== 'all') query += `branchId=${f.branchId}&`;
      if (f.status && f.status !== 'ALL') query += `status=${f.status}&`;
      if (f.search) query += `search=${f.search}&`;
    } else {
      if (branchIdOrFilters && branchIdOrFilters !== 'all') query += `branchId=${branchIdOrFilters}&`;
      if (status && status !== 'ALL') query += `status=${status}&`;
      if (search) query += `search=${search}&`;
    }

    const res = await apiFetch(`/patients${query}`);
    return res.data || [];
  },

  getPatientById: async (id) => {
    const res = await apiFetch(`/patients/${id}`);
    return res.data;
  },

  createPatient: async (patientData, branchId) => {
    const body = {
      ...patientData,
      ...(branchId && branchId !== 'all' ? { branchId } : {})
    };
    const res = await apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res.data;
  },

  addPatient: async (patientData, branchId) => {
    return patientsService.createPatient(patientData, branchId);
  },

  updatePatient: async (id, patientData) => {
    const res = await apiFetch(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    });
    return res.data;
  },

  dischargePatient: async (id, exitDate) => {
    const res = await apiFetch(`/patients/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ exitDate })
    });
    return res;
  },

  deletePatient: async (id) => {
    const res = await apiFetch(`/patients/${id}?permanent=true`, {
      method: 'DELETE'
    });
    return res;
  },

  addPayment: async (paymentData) => {
    const res = await apiFetch('/patient-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    return res.data;
  },

  getPayments: async (patientId) => {
    const res = await apiFetch(`/patient-payments?patientId=${patientId}`);
    return res.data || [];
  },

  addPatientExpense: async (expenseData) => {
    const res = await apiFetch('/patient-expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
    return res.data;
  },

  addExpense: async (expenseData) => {
    return patientsService.addPatientExpense(expenseData);
  },

  getExpenses: async (patientId) => {
    const res = await apiFetch(`/patient-expenses?patientId=${patientId}`);
    return res.data || [];
  }
};
