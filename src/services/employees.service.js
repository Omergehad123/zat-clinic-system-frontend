import { apiFetch } from './api';

export const employeesService = {
  getEmployees: async (branchIdOrFilters = 'all', role = 'ALL') => {
    let query = '?';
    if (typeof branchIdOrFilters === 'object' && branchIdOrFilters !== null) {
      const f = branchIdOrFilters;
      if (f.branchId && f.branchId !== 'all') query += `branchId=${f.branchId}&`;
      if (f.role && f.role !== 'ALL') query += `role=${f.role}&`;
      if (f.status) query += `status=${f.status}&`;
    } else {
      if (branchIdOrFilters && branchIdOrFilters !== 'all') query += `branchId=${branchIdOrFilters}&`;
      if (role && role !== 'ALL') query += `role=${role}&`;
    }
    const res = await apiFetch(`/employees${query}`);
    return res.data || [];
  },

  getEmployeeById: async (id) => {
    const res = await apiFetch(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (employeeData) => {
    const res = await apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
    return res.data;
  },

  addEmployee: async (employeeData) => {
    return employeesService.createEmployee(employeeData);
  },

  updateEmployee: async (id, employeeData) => {
    const res = await apiFetch(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
    return res.data;
  },

  toggleEmployeeStatus: async (id) => {
    const res = await apiFetch(`/employees/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  getEmployeeAnalytics: async (branchId = 'all') => {
    const employees = await employeesService.getEmployees(branchId);
    const total = employees.length;
    const doctors = employees.filter(e => e.role === 'doctor').length;
    const nurses = employees.filter(e => e.role === 'nurse').length;
    const supervisors = employees.filter(e => e.role === 'supervisor').length;
    const workers = employees.filter(e => e.role === 'worker').length;

    return {
      total,
      roleDistribution: { doctors, nurses, supervisors, workers }
    };
  }
};
