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

    const [res, patientsRes, paymentsRes, invoicesRes, advancesRes, patientExpensesRes] = await Promise.all([
      apiFetch(`/transactions${query}`),
      apiFetch(`/patients${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] })),
      apiFetch(`/patient-payments${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] })),
      apiFetch(`/invoices${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] })),
      apiFetch(`/advances${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] })),
      apiFetch(`/patient-expenses${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`).catch(() => ({ data: [] }))
    ]);
    const rawTransactions = res?.data || [];
    const patients = patientsRes?.data || [];
    const patientPayments = paymentsRes?.data || [];
    const invoices = invoicesRes?.data || (Array.isArray(invoicesRes) ? invoicesRes : []);
    const advances = advancesRes?.data || advancesRes?.advances || (Array.isArray(advancesRes) ? advancesRes : []);
    const patientExpenses = patientExpensesRes?.data || (Array.isArray(patientExpensesRes) ? patientExpensesRes : []);
    const summary = res?.summary || { totalIncome: 0, totalExpenses: 0, netIncome: 0 };

    // 1. حساب إجمالي الإيرادات ومصاريف النزلاء عبر كافة أدراج الشهور (دخول جديد + تجديدات)
    let calculatedTotalIncome = 0;
    let calculatedTotalPatientExpenses = 0;

    const patientMap = new Map();
    patients.forEach(p => {
      const pid = (p.id || p._id || '').toString();
      if (pid) patientMap.set(pid, p);
    });

    if (patients.length > 0) {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const groups = {};

      const formatDateToKey = (dateInput) => {
        if (!dateInput) return null;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      };

      patients.forEach(patient => {
        const entryKey = formatDateToKey(patient.entryDate || patient.createdAt) || currentMonthKey;
        if (!groups[entryKey]) groups[entryKey] = [];
        groups[entryKey].push(patient);

        const seenRenewalMonths = new Set();
        if (Array.isArray(patient.timeline)) {
          patient.timeline
            .filter(e => e.type === 'renewal')
            .forEach((renEvent) => {
              const renKey = formatDateToKey(renEvent.date);
              if (renKey && !seenRenewalMonths.has(renKey)) {
                seenRenewalMonths.add(renKey);
                if (!groups[renKey]) groups[renKey] = [];
                groups[renKey].push(patient);
              }
            });
        }

        const lastRenKey = formatDateToKey(patient.lastRenewalDate || patient.renewalDate);
        if (lastRenKey && !seenRenewalMonths.has(lastRenKey)) {
          seenRenewalMonths.add(lastRenKey);
          if (!groups[lastRenKey]) groups[lastRenKey] = [];
          groups[lastRenKey].push(patient);
        }
      });

      Object.values(groups).forEach(items => {
        items.forEach(p => {
          calculatedTotalIncome += Number(p.paidAmount ?? p.paid ?? 0);
          calculatedTotalPatientExpenses += Number(p.totalExpenses ?? p.expensesTotal ?? 0);
        });
      });
    } else {
      calculatedTotalIncome = summary.totalIncome || 0;
    }

    // 2. حساب إجمالي المصروفات والسلف = مجموع الفواتير + مجموع السلف + مجموع مصاريف النزلاء بكافة الشهور + المصروفات المباشرة
    const totalInvoicesSum = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalAdvancesSum = advances.reduce((sum, adv) => sum + Number(adv.amount || 0), 0);
    const totalPatientExpensesSum = calculatedTotalPatientExpenses > 0
      ? calculatedTotalPatientExpenses
      : (patientExpenses.length > 0
          ? patientExpenses.reduce((sum, pe) => sum + Number(pe.amount || 0), 0)
          : patients.reduce((sum, p) => sum + Number(p.totalExpenses ?? p.expensesTotal ?? 0), 0));

    // المصروفات المباشرة الأخرى من جدول المعاملات
    const directOtherExpensesSum = rawTransactions
      .filter(t => t.type === 'expense' && !t.invoiceId && !t.employeeId && !t.patientId && t.category !== 'Employee Advances' && t.category !== 'PatientExpense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const calculatedTotalExpenses = totalInvoicesSum + totalAdvancesSum + totalPatientExpensesSum + directOtherExpensesSum;
    const calculatedNetRevenue = calculatedTotalIncome - calculatedTotalExpenses;

    // دمج الإيرادات الشاملة (دفعات النزلاء + حركات الإيراد + تجديدات الإقامة)
    const incomeMap = new Map();

    // أ) سجلات الدفعات الرسمية (PatientPayment)
    patientPayments.forEach(p => {
      const pid = (p.patientId?.id || p.patientId?._id || p.patientId || '').toString();
      const pObj = patientMap.get(pid);
      const name = p.patientName || p.patientId?.name || pObj?.name || 'إيراد نزيل';
      const id = (p.id || p._id || '').toString();
      incomeMap.set(`pay_${id}`, {
        id: `pay_${id}`,
        date: p.date,
        patientName: name,
        amount: Number(p.amount || 0),
        method: p.paymentMethod || 'كاش',
        notes: p.notes || 'دفعة إقامة / تجديد'
      });
    });

    // ب) حركات الإيراد المباشرة من Transactions
    rawTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const id = (t.id || t._id || '').toString();
        let extractedName = t.patientName;
        if (!extractedName && t.patientId) {
          const pid = (t.patientId._id || t.patientId).toString();
          extractedName = patientMap.get(pid)?.name;
        }
        if (!extractedName && t.description) {
          const match = t.description.match(/-\s*([^(\n]+)/);
          if (match && match[1]) extractedName = match[1].trim();
        }
        const key = `tx_${id}`;
        // تجنب التكرار إذا كان مرتبطاً بـ patientPayment مسجل مسبقاً
        const isDuplicate = Array.from(incomeMap.values()).some(
          inc => inc.patientName === (extractedName || 'إيراد إقامة') && Math.abs(Number(inc.amount) - Number(t.amount)) < 0.01 && (inc.date && t.date && inc.date.toString().slice(0,10) === t.date.toString().slice(0,10))
        );
        if (!isDuplicate) {
          incomeMap.set(key, {
            id: key,
            date: t.date,
            patientName: extractedName || 'إيراد إقامة',
            amount: Number(t.amount || 0),
            method: t.description?.includes('كاش') || t.description?.includes('Cash') ? 'كاش' : 'تحويل بانكي',
            notes: t.description || 'إيراد إقامة نزيل'
          });
        }
      });

    // ج) التحقق من النزلاء والتجديدات للتأكد من ظهور كل دفعة تجديد أو دخول
    patients.forEach(patient => {
      const pName = patient.name;
      const pid = (patient.id || patient._id || '').toString();

      // فحص الـ timeline لأي تجديدات أو دفعات
      if (Array.isArray(patient.timeline)) {
        patient.timeline.forEach((event, idx) => {
          if (event.type === 'renewal' || event.type === 'payment') {
            const evAmt = Number(event.amount || 0);
            if (evAmt > 0) {
              const evDate = event.date || patient.createdAt;
              const datePrefix = evDate ? new Date(evDate).toISOString().slice(0, 10) : '';
              const alreadyExists = Array.from(incomeMap.values()).some(
                inc => inc.patientName === pName && Math.abs(Number(inc.amount) - evAmt) < 0.01 && inc.date && inc.date.toString().slice(0, 10) === datePrefix
              );
              if (!alreadyExists) {
                const eventKey = `ren_${pid}_${idx}`;
                incomeMap.set(eventKey, {
                  id: eventKey,
                  date: evDate,
                  patientName: pName,
                  amount: evAmt,
                  method: 'كاش',
                  notes: event.details || event.title || (event.type === 'renewal' ? 'تجديد إقامة' : 'دفعة سداد إقامة')
                });
              }
            }
          }
        });
      }

      // إذا كان للنزيل مدفوعات ولم تظهر في السجلات
      const paidAmt = Number(patient.paidAmount ?? patient.paid ?? 0);
      if (paidAmt > 0) {
        const hasPatientIncome = Array.from(incomeMap.values()).some(inc => inc.patientName === pName);
        if (!hasPatientIncome) {
          const entryKey = `entry_${pid}`;
          incomeMap.set(entryKey, {
            id: entryKey,
            date: patient.entryDate || patient.createdAt,
            patientName: pName,
            amount: paidAmt,
            method: 'كاش',
            notes: `دفعة إقامة - ${pName}`
          });
        }
      }
    });

    const income = Array.from(incomeMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // دمج سجل المصروفات الشامل
    const expenseMap = new Map();

    // أ) فواتير المشتريات والمصروفات
    invoices.forEach(inv => {
      const id = `inv_${inv.id || inv._id}`;
      expenseMap.set(id, {
        id,
        date: inv.date,
        category: inv.category || 'فاتورة مشتريات',
        description: `فاتورة #${inv.invoiceNumber || ''} - ${inv.supplierName || inv.category || 'مشتريات'}`,
        amount: Number(inv.totalAmount || 0),
        notes: inv.notes || ''
      });
    });

    // ب) سلف الموظفين
    advances.forEach(adv => {
      const id = `adv_${adv.id || adv._id}`;
      expenseMap.set(id, {
        id,
        date: adv.date,
        category: 'سلف موظفين',
        description: `سلفة: ${adv.employeeName || 'موظف'} (${adv.employeeType || adv.role || ''})`,
        amount: Number(adv.amount || 0),
        notes: adv.notes || ''
      });
    });

    // ج) مصاريف النزلاء من سجلات PatientExpense
    patientExpenses.forEach(pe => {
      const id = `pe_${pe.id || pe._id}`;
      const pid = (pe.patientId?.id || pe.patientId?._id || pe.patientId || '').toString();
      const pName = pe.patientName || pe.patientId?.name || patientMap.get(pid)?.name || 'نزيل';
      expenseMap.set(id, {
        id,
        date: pe.date,
        category: 'مصاريف نزلاء',
        description: `مصروف نزيل: ${pName} (${pe.description || 'أدوية ومستلزمات'})`,
        amount: Number(pe.amount || 0),
        notes: pe.notes || pe.description || ''
      });
    });

    // د) مصاريف النزلاء المسجلة في ملفات النزلاء
    patients.forEach(patient => {
      const pName = patient.name;
      const pid = (patient.id || patient._id || '').toString();

      if (Array.isArray(patient.timeline)) {
        patient.timeline.forEach((event, idx) => {
          if (event.type === 'expense') {
            const evAmt = Number(event.amount || 0);
            if (evAmt > 0) {
              const evDate = event.date || patient.createdAt;
              const datePrefix = evDate ? new Date(evDate).toISOString().slice(0, 10) : '';
              const alreadyExists = Array.from(expenseMap.values()).some(
                exp => exp.category === 'مصاريف نزلاء' && Math.abs(Number(exp.amount) - evAmt) < 0.01 && exp.date && exp.date.toString().slice(0, 10) === datePrefix
              );
              if (!alreadyExists) {
                const eventKey = `pexp_${pid}_${idx}`;
                expenseMap.set(eventKey, {
                  id: eventKey,
                  date: evDate,
                  category: 'مصاريف نزلاء',
                  description: `مصروف نزيل: ${pName} (${event.title || event.details || 'مصاريف شخصية'})`,
                  amount: evAmt,
                  notes: event.details || ''
                });
              }
            }
          }
        });
      }

      const pExpTotal = Number(patient.totalExpenses ?? patient.expensesTotal ?? 0);
      if (pExpTotal > 0) {
        const hasPatientExpense = Array.from(expenseMap.values()).some(
          exp => exp.description.includes(pName) && exp.category === 'مصاريف نزلاء'
        );
        if (!hasPatientExpense) {
          const expKey = `pexp_total_${pid}`;
          expenseMap.set(expKey, {
            id: expKey,
            date: patient.entryDate || patient.createdAt,
            category: 'مصاريف نزلاء',
            description: `مصاريف نزيل: ${pName}`,
            amount: pExpTotal,
            notes: `إجمالي مصاريف النزيل بالفرع`
          });
        }
      }
    });

    // هـ) أي مصروفات أخرى من سجل Transactions
    rawTransactions
      .filter(t => t.type === 'expense' && !expenseMap.has(`inv_${t.invoiceId}`) && !expenseMap.has(`adv_${t.employeeId}`))
      .forEach(t => {
        const id = `tx_${t.id || t._id}`;
        if (!expenseMap.has(id)) {
          expenseMap.set(id, {
            id,
            date: t.date,
            category: t.category === 'Employee Advances' ? 'سلف موظفين' : (t.category || 'مصروفات أخرى'),
            description: t.description || 'مصروف فرع',
            amount: Number(t.amount || 0),
            notes: t.description || ''
          });
        }
      });

    const expenses = Array.from(expenseMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // بناء الحركات المالية الشاملة المدمجة (إيرادات + مصروفات مرتبة زمنياً)
    const combinedTransactions = [
      ...income.map(inc => ({
        id: `tx_inc_${inc.id}`,
        kind: 'إيراد',
        title: inc.notes || `دفعة إقامة - ${inc.patientName}`,
        category: 'إقامة نزلاء',
        amount: inc.amount,
        date: inc.date
      })),
      ...expenses.map(exp => ({
        id: `tx_exp_${exp.id}`,
        kind: 'مصروف',
        title: exp.description,
        category: exp.category,
        amount: exp.amount,
        date: exp.date
      }))
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      income,
      expenses,
      transactions: combinedTransactions,
      totals: {
        totalIncome: calculatedTotalIncome,
        totalExpenses: calculatedTotalExpenses,
        netRevenue: calculatedNetRevenue,
        advancesTotal: totalAdvancesSum,
        invoicesTotal: totalInvoicesSum,
        patientExpensesTotal: totalPatientExpensesSum
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
