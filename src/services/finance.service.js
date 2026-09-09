import { apiFetch } from './api';

export const financeService = {
  getFinanceData: async (branchId = 'all', filters = {}) => {
    let query = '?';
    if (branchId && branchId !== 'all') {
      query += `branchId=${branchId}&`;
    }
    if (filters.type) {
      query += `type=${filters.type}&`;
    }
    if (filters.category) {
      query += `category=${filters.category}&`;
    }
    if (filters.month && filters.year) {
      query += `month=${filters.month}&year=${filters.year}&`;
    }

    const [res, patientsRes] = await Promise.all([
      apiFetch(`/transactions${query}`),
      apiFetch(`/patients${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] }))
    ]);
    const rawTransactions = res?.data || [];
    const patients = patientsRes?.data || [];
    const summary = res?.summary || { totalIncome: 0, totalExpenses: 0, netIncome: 0 };

    // حساب إجمالي الإيرادات بناءً على صافي الإيرادات لكل مريض/نزيل
    // صافي الإيرادات = قيمة الإقامة - مصاريف النزيل - المتبقي = المدفوع - مصاريف النزيل
    const patientNetRevenueTotal = patients.reduce((sum, p) => {
      const paid    = Number(p.paidAmount   ?? p.paid          ?? 0);
      const expenses = Number(p.totalExpenses ?? p.expensesTotal ?? 0);
      const net = paid - expenses;
      return sum + net;
    }, 0);

    const calculatedTotalIncome = patients.length > 0 ? patientNetRevenueTotal : (summary.totalIncome || 0);
    const calculatedTotalExpenses = summary.totalExpenses || 0;
    const calculatedNetRevenue = calculatedTotalIncome - calculatedTotalExpenses;

    const income = rawTransactions
      .filter(t => t.type === 'income')
      .map(t => {
        let extractedName = t.patientName;
        if (!extractedName && t.description) {
          const match = t.description.match(/-\s*([^(\n]+)/);
          if (match && match[1]) extractedName = match[1].trim();
        }
        return {
          id: t.id || t._id,
          date: t.date,
          patientName: extractedName || 'إيراد إقامة',
          amount: t.amount,
          method: t.description?.includes('كاش') || t.description?.includes('Cash') ? 'كاش' : 'تحويل بانكي',
          notes: t.description || 'إيراد إقامة نزيل'
        };
      });

    const expenses = rawTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        id: t.id || t._id,
        date: t.date,
        category: t.category === 'Employee Advances' ? 'سلف موظفين' : (t.category || 'مصروفات أخرى'),
        description: t.description || 'مصروف فرع',
        amount: t.amount,
        notes: t.description || ''
      }));

    const transactions = rawTransactions.map(t => ({
      id: t.id || t._id,
      kind: t.type === 'income' ? 'إيراد' : 'مصروف',
      title: t.description || (t.type === 'income' ? 'إيراد إقامة' : 'مصروف فرع'),
      category: t.category === 'Employee Advances' ? 'سلف موظفين' : (t.category === 'Accommodation' ? 'إقامة نزلاء' : (t.category || 'عام')),
      amount: t.amount,
      date: t.date
    }));

    const advancesTotal = rawTransactions
      .filter(t => t.type === 'expense' && (t.category === 'Employee Advances' || t.description?.includes('سلفة')))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      income,
      expenses,
      transactions,
      totals: {
        totalIncome: calculatedTotalIncome,
        totalExpenses: calculatedTotalExpenses,
        netRevenue: calculatedNetRevenue,
        advancesTotal
      }
    };
  },

  addExpense: async (expenseData, branchId) => {
    const body = {
      category: expenseData.category || 'Other',
      items: expenseData.items || [],
      totalAmount: Number(expenseData.amount),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      notes: expenseData.notes || expenseData.description || '',
      branchId
    };
    const res = await apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res.data;
  }
};
