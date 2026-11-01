import { apiFetch, getAuthToken } from './api';
import { buildPatientMonthlyGroups, formatDateToKey } from '../utils/patientMonthlyCalculator';
import { getArabicMonthName } from '../utils/formatters';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const categoryTranslations = {
  Advances: 'سلف موظفين',
  PatientExpenses: 'مصاريف نزلاء',
  Food: 'أغذية ومشروبات',
  Medicine: 'أدوية وعلاج',
  Utilities: 'فواتير ومرافق',
  Maintenance: 'صيانة',
  Supplies: 'مستلزمات',
  Other: 'مصروفات أخرى',
  'أكل': 'أغذية ومشروبات',
  'أغذية ومشروبات': 'أغذية ومشروبات',
  'أدوية': 'أدوية وعلاج',
  'أدوية وعلاج': 'أدوية وعلاج',
  'مرافق': 'فواتير ومرافق',
  'فواتير ومرافق': 'فواتير ومرافق',
  'صيانة': 'صيانة',
  'مستلزمات': 'مستلزمات',
  'سلف': 'سلف موظفين',
  'سلف موظفين': 'سلف موظفين',
  'مصاريف نزلاء': 'مصاريف نزلاء',
  'أخرى': 'مصروفات أخرى',
  'مصروفات أخرى': 'مصروفات أخرى'
};

const normalizeCategory = (cat) => {
  if (!cat) return 'مصروفات أخرى';
  if (categoryTranslations[cat]) return categoryTranslations[cat];
  const lower = cat.toLowerCase();
  if (lower.includes('food') || lower.includes('أكل') || lower.includes('طعام') || lower.includes('تغذية')) return 'أغذية ومشروبات';
  if (lower.includes('med') || lower.includes('دواء') || lower.includes('أدوية') || lower.includes('علاج')) return 'أدوية وعلاج';
  if (lower.includes('util') || lower.includes('مرافق') || lower.includes('فاتورة') || lower.includes('كهرباء') || lower.includes('مياه')) return 'فواتير ومرافق';
  if (lower.includes('maint') || lower.includes('صيانة')) return 'صيانة';
  if (lower.includes('suppl') || lower.includes('مستلزم')) return 'مستلزمات';
  if (lower.includes('adv') || lower.includes('سلف')) return 'سلف موظفين';
  if (lower.includes('pat') || lower.includes('نزيل') || lower.includes('نزلاء')) return 'مصاريف نزلاء';
  return cat;
};

export const reportsService = {
  getMonthlyReport: async (branchId = 'all', month, year) => {
    const isAllMonths = month === 'all' || month === 'ALL' || month === 0 || month === '0' || !month;
    const m = isAllMonths ? null : Number(month);
    const y = Number(year) || new Date().getFullYear();
    const monthKey = !isAllMonths ? `${y}-${String(m).padStart(2, '0')}` : null;

    const bQuery = branchId && branchId !== 'all' ? `?branchId=${branchId}` : '';

    const [patientsRes, invoicesRes, advancesRes, patientExpensesRes, transactionsRes] = await Promise.all([
      apiFetch(`/patients${bQuery}`).catch(() => ({ data: [] })),
      apiFetch(`/invoices${bQuery}`).catch(() => ({ data: [] })),
      apiFetch(`/advances${bQuery}`).catch(() => ({ data: [] })),
      apiFetch(`/patient-expenses${bQuery}`).catch(() => ({ data: [] })),
      apiFetch(`/transactions${bQuery}`).catch(() => ({ data: [] }))
    ]);

    const patients = patientsRes?.data || (Array.isArray(patientsRes) ? patientsRes : []);
    const invoices = invoicesRes?.data || (Array.isArray(invoicesRes) ? invoicesRes : []);
    const advances = advancesRes?.data || advancesRes?.advances || (Array.isArray(advancesRes) ? advancesRes : []);
    const patientExpenses = patientExpensesRes?.data || (Array.isArray(patientExpensesRes) ? patientExpensesRes : []);
    const transactions = transactionsRes?.data || (Array.isArray(transactionsRes) ? transactionsRes : []);

    const monthlyGroupsData = buildPatientMonthlyGroups(patients);
    const { monthlyGroups, totals: overallTotals } = monthlyGroupsData;

    let totalRevenue = 0;
    let monthPatientExpenses = 0;
    let newCount = 0;
    let renewalsCount = 0;
    let exitCount = 0;

    if (isAllMonths) {
      totalRevenue = overallTotals.totalStayValue;
      monthPatientExpenses = overallTotals.totalExpenses;
      newCount = Object.values(monthlyGroups).reduce((s, items) => s + items.filter(i => i.isEntry).length, 0);
      renewalsCount = Object.values(monthlyGroups).reduce((s, items) => s + items.filter(i => i.isRenewal).length, 0);
      exitCount = patients.filter(p => p.status === 'خرج' || p.status === 'discharged').length;
    } else {
      const items = monthlyGroups[monthKey] || [];
      totalRevenue = items.reduce((sum, item) => sum + Number(item.monthStayValue || 0), 0);
      monthPatientExpenses = items.reduce((sum, item) => sum + Number(item.monthExpenses || 0), 0);
      newCount = items.filter(i => i.isEntry).length;
      renewalsCount = items.filter(i => i.isRenewal).length;
      exitCount = patients.filter(p => {
        const isDischarged = p.status === 'خرج' || p.status === 'discharged';
        if (!isDischarged) return false;
        const dKey = formatDateToKey(p.dischargeDate || p.updatedAt || p.exitDate);
        return dKey === monthKey;
      }).length;
    }

    // Invoices for period
    const filteredInvoices = invoices.filter(inv => {
      if (!inv.date) return false;
      const key = formatDateToKey(inv.date);
      if (isAllMonths) {
        return !y || key?.startsWith(`${y}-`);
      }
      return key === monthKey;
    });
    const invoicesTotal = filteredInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);

    // Advances for period
    const filteredAdvances = advances.filter(adv => {
      if (!adv.date) return false;
      const key = formatDateToKey(adv.date);
      if (isAllMonths) {
        return !y || key?.startsWith(`${y}-`);
      }
      return key === monthKey;
    });
    const advancesTotal = filteredAdvances.reduce((s, adv) => s + Number(adv.amount || 0), 0);

    // Direct transactions for period
    const filteredDirectExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (!t.date) return false;
      const key = formatDateToKey(t.date);
      if (!isAllMonths && key !== monthKey) return false;
      if (isAllMonths && y && !key?.startsWith(`${y}-`)) return false;
      const cat = t.category || '';
      return !t.invoiceId && !t.employeeId && !t.patientId && cat !== 'Employee Advances' && cat !== 'PatientExpense' && !cat.includes('سلف') && !cat.includes('مصاريف');
    });
    const directExpensesTotal = filteredDirectExpenses.reduce((s, t) => s + Number(t.amount || 0), 0);

    const totalExpenses = invoicesTotal + advancesTotal + monthPatientExpenses + directExpensesTotal;

    // Helper to calculate standalone financials for any monthKey (YYYY-MM)
    const calcMonthFin = (mKey) => {
      const items = monthlyGroups[mKey] || [];
      const rev = items.reduce((sum, item) => sum + Number(item.monthStayValue || 0), 0);
      const patExp = items.reduce((sum, item) => sum + Number(item.monthExpenses || 0), 0);

      const invTotal = invoices.filter(inv => {
        if (!inv.date) return false;
        return formatDateToKey(inv.date) === mKey;
      }).reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);

      const advTotal = advances.filter(adv => {
        if (!adv.date) return false;
        return formatDateToKey(adv.date) === mKey;
      }).reduce((s, adv) => s + Number(adv.amount || 0), 0);

      const dirTotal = transactions.filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        if (formatDateToKey(t.date) !== mKey) return false;
        const cat = t.category || '';
        return !t.invoiceId && !t.employeeId && !t.patientId && cat !== 'Employee Advances' && cat !== 'PatientExpense' && !cat.includes('سلف') && !cat.includes('مصاريف');
      }).reduce((s, t) => s + Number(t.amount || 0), 0);

      const totalExp = invTotal + advTotal + patExp + dirTotal;
      return {
        revenue: rev,
        expenses: totalExp,
        net: rev - totalExp
      };
    };

    let previousMonthNet = 0;
    let prevMonth = null;
    let prevYear = null;
    let currentMonthStay = totalRevenue;
    let effectiveTotalRevenue = totalRevenue;
    let netRevenue = totalRevenue - totalExpenses;

    if (!isAllMonths) {
      prevMonth = m - 1;
      prevYear = y;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      // Collect all month keys to find earliest recorded month
      const allKeys = new Set();
      Object.keys(monthlyGroups).forEach(k => allKeys.add(k));
      invoices.forEach(i => { const k = formatDateToKey(i.date); if (k) allKeys.add(k); });
      advances.forEach(a => { const k = formatDateToKey(a.date); if (k) allKeys.add(k); });
      transactions.forEach(t => { const k = formatDateToKey(t.date); if (k) allKeys.add(k); });

      const validKeys = [...allKeys].filter(k => k && /^\d{4}-\d{2}$/.test(k)).sort();
      const startKey = (validKeys[0] && validKeys[0] < monthKey) ? validKeys[0] : monthKey;

      const getConsecutiveMonthKeys = (sKey, eKey) => {
        if (!sKey || !eKey) return [];
        if (sKey > eKey) return [eKey];
        const keys = [];
        let [curY, curM] = sKey.split('-').map(Number);
        const [endY, endM] = eKey.split('-').map(Number);
        while (curY < endY || (curY === endY && curM <= endM)) {
          keys.push(`${curY}-${String(curM).padStart(2, '0')}`);
          curM++;
          if (curM > 12) { curM = 1; curY++; }
        }
        return keys;
      };

      const consecutiveKeys = getConsecutiveMonthKeys(startKey, monthKey);
      let runningNet = 0;

      consecutiveKeys.forEach(k => {
        const fin = calcMonthFin(k);
        const prevNet = runningNet;
        const effRev = fin.revenue + prevNet;
        const finNet = effRev - fin.expenses;
        runningNet = finNet;

        if (k === monthKey) {
          currentMonthStay = fin.revenue;
          previousMonthNet = prevNet;
          effectiveTotalRevenue = effRev;
          netRevenue = finNet;
        }
      });
    }

    // Categories breakdown
    const categoryMap = {};
    if (advancesTotal > 0) {
      categoryMap['سلف موظفين'] = advancesTotal;
    }
    if (monthPatientExpenses > 0) {
      categoryMap['مصاريف نزلاء'] = monthPatientExpenses;
    }
    filteredInvoices.forEach(inv => {
      const catName = normalizeCategory(inv.category);
      categoryMap[catName] = (categoryMap[catName] || 0) + Number(inv.totalAmount || 0);
    });
    filteredDirectExpenses.forEach(t => {
      const catName = normalizeCategory(t.category);
      categoryMap[catName] = (categoryMap[catName] || 0) + Number(t.amount || 0);
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const currentPatientsCount = patients.filter(p => p.status === 'حالي' || p.status === 'جديد' || p.status === 'current').length;

    return {
      month: isAllMonths ? 'all' : m,
      year: y,
      totals: {
        currentMonthStay,
        previousMonthNet,
        totalRevenue: effectiveTotalRevenue,
        totalExpenses,
        netRevenue,
        prevMonth,
        prevYear,
        prevMonthName: !isAllMonths ? getArabicMonthName(prevMonth) : null,
        totalAdvances: advancesTotal,
        totalOutstanding: patients.reduce((s, p) => s + Math.max(0, Number(p.remainingAmount ?? p.remaining ?? 0)), 0)
      },
      categoryBreakdown,
      patientStats: {
        current: currentPatientsCount,
        newCount,
        exitCount,
        renewalsCount
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
