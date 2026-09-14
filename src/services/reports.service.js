import { apiFetch, getAuthToken } from './api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const reportsService = {
  getMonthlyReport: async (branchId = 'all', month, year) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    let query = `?month=${m}&year=${y}`;
    if (branchId && branchId !== 'all') {
      query += `&branchId=${branchId}`;
    }
    const res = await apiFetch(`/reports/monthly${query}`);
    const data = res.data || {};

    // Normalise shape to match what the frontend components expect
    return {
      month: m,
      year: y,
      totals: {
        totalRevenue: data.totalIncome || 0,
        totalExpenses: data.totalExpenses || 0,
        netRevenue: data.netIncome || 0,
        totalAdvances: data.employeeMetrics?.advancesTotal || 0,
        totalOutstanding: data.patientMetrics?.outstandingPayments || 0
      },
      categoryBreakdown: Object.entries(data.expenseBreakdown || {})
        .filter(([_, val]) => Number(val) > 0)
        .map(([name, value]) => {
          const categoryTranslations = {
            Advances: 'سلف موظفين',
            PatientExpenses: 'مصاريف نزلاء',
            Food: 'أغذية ومشروبات',
            Medicine: 'أدوية وعلاج',
            Utilities: 'فواتير ومرافق',
            Maintenance: 'صيانة',
            Supplies: 'مستلزمات',
            Other: 'مصروفات أخرى'
          };
          return {
            name: categoryTranslations[name] || name,
            value: Number(value) || 0
          };
        }),
      patientStats: {
        current: data.patientMetrics?.current || 0,
        newCount: data.patientMetrics?.newCount || 0,
        exitCount: data.patientMetrics?.discharged || 0
      }
    };
  },

  getOutstandingPaymentsReport: async (branchId = 'all') => {
    let query = '?';
    if (branchId && branchId !== 'all') {
      query += `branchId=${branchId}&`;
    }
    const res = await apiFetch(`/patients${query}status=current`);
    const patients = res.data || [];

    const outstandingList = patients
      .filter(p => (p.remainingAmount || 0) > 0)
      .map(p => ({
        id: p.id || p._id,
        patientName: p.name,
        branchId: p.branchId,
        stayValue: p.accommodationAmount || 0,
        paid: p.paidAmount || 0,
        remaining: p.remainingAmount || 0,
        entryDate: p.entryDate,
        notes: p.notes
      }));

    const totalRemaining = outstandingList.reduce((sum, item) => sum + item.remaining, 0);
    return { list: outstandingList, totalRemaining };
  },

  getBranchComparison: async (month, year) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const res = await apiFetch(`/reports/comparison?month=${m}&year=${y}`);
    return res.data || [];
  },

  exportToExcel: async (branchId = 'all', month, year) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const token = getAuthToken();

    let query = `?month=${m}&year=${y}`;
    if (branchId && branchId !== 'all') {
      query += `&branchId=${branchId}`;
    }

    const response = await fetch(`${BASE_URL}/reports/excel${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error('فشل تصدير التقرير');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Report_${m}_${y}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};
