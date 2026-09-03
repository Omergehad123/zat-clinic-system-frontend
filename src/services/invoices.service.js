import { apiFetch } from './api';

export const invoicesService = {
  getInvoices: async (filters = {}) => {
    let query = '?';
    if (filters.branchId && filters.branchId !== 'all') {
      query += `branchId=${filters.branchId}&`;
    }
    if (filters.month && filters.year) {
      query += `month=${filters.month}&year=${filters.year}&`;
    }
    const res = await apiFetch(`/invoices${query}`);
    return res.data || [];
  },

  createInvoice: async (invoiceData) => {
    const res = await apiFetch('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
    return res.data;
  },

  updateInvoice: async (id, invoiceData) => {
    const res = await apiFetch(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData)
    });
    return res.data;
  },

  deleteInvoice: async (id) => {
    const res = await apiFetch(`/invoices/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }
};
