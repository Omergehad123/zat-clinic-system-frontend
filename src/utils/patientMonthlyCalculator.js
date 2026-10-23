export function formatDateToKey(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Groups patients by month of entry and renewal, calculating exact monthly accommodation (قيمة الإقامة),
 * paid amount, expenses, and remaining for each month drawer.
 * 
 * إجمالي الإيرادات في النظام = مجموع قيمة الإقامة لكافة النزلاء والتجديدات عبر جميع الشهور.
 */
export function buildPatientMonthlyGroups(rawPatients) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const groups = {};

  // Ensure current month is always present in groups
  if (!groups[currentMonthKey]) {
    groups[currentMonthKey] = [];
  }

  if (!rawPatients || !Array.isArray(rawPatients) || rawPatients.length === 0) {
    return {
      monthlyGroups: groups,
      monthKeys: [currentMonthKey],
      totalRecordsCount: 0,
      totals: {
        totalStayValue: 0,
        totalPaid: 0,
        totalExpenses: 0,
        totalRemaining: 0,
        totalNet: 0
      }
    };
  }

  let recordCount = 0;

  rawPatients.forEach(patient => {
    // Authoritative patient financial totals from backend/profile
    const patientStay = Number(patient.accommodationAmount ?? patient.stayValue ?? 0);
    const patientPaid = Number(patient.paidAmount ?? patient.paid ?? 0);
    const patientRem = Number(patient.remainingAmount ?? patient.remaining ?? Math.max(0, patientStay - patientPaid));
    const patientExpenses = Number(patient.totalExpenses ?? patient.expensesTotal ?? 0);

    // Find entry event in timeline
    const entryEvent = Array.isArray(patient.timeline) ? patient.timeline.find(e => e.type === 'entry') : null;
    const renewalEvents = Array.isArray(patient.timeline) ? patient.timeline.filter(e => e.type === 'renewal') : [];
    const sumRenewals = renewalEvents.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    
    let entryStay = 0;
    if (entryEvent && entryEvent.amount) {
      entryStay = Number(entryEvent.amount);
    } else if (sumRenewals > 0) {
      entryStay = Math.max(0, patientStay - sumRenewals);
    } else {
      entryStay = patientStay;
    }

    // Helper to compute month-specific expenses exactly as originally defined
    const calcMonthExpenses = (mKey, fallbackExp) => {
      const mExpenses = Array.isArray(patient.expenses)
        ? patient.expenses.filter(e => formatDateToKey(e.date) === mKey)
        : [];
      return mExpenses.length > 0
        ? mExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        : (fallbackExp !== undefined && fallbackExp !== null ? Number(fallbackExp) : (renewalEvents.length > 0 ? 0 : Number(patient.totalExpenses ?? patient.expensesTotal ?? 0)));
    };

    // 1. Entry Month
    const entryKey = formatDateToKey(patient.entryDate || patient.createdAt) || currentMonthKey;
    if (!groups[entryKey]) groups[entryKey] = [];
    const entryExp = calcMonthExpenses(entryKey, entryEvent?.initialExpenses);

    if (renewalEvents.length === 0) {
      // Single entry patient (no renewals) - entire financials belong to this entry
      groups[entryKey].push({
        id: `${patient.id || patient._id}-entry-${entryKey}`,
        patient,
        eventType: 'entry',
        eventDate: patient.entryDate || patient.createdAt,
        monthKey: entryKey,
        monthStayValue: entryStay,
        monthPaid: patientPaid,
        monthExpenses: entryExp,
        monthRemaining: patientRem,
        monthNet: patientPaid - entryExp,
        isEntry: true,
        isRenewal: false
      });
      recordCount++;
    } else {
      // Patient with renewals
      let unallocatedPaid = patientPaid;
      const isSettled = patientRem <= 0;

      // Entry month allocation
      const entryPaid = isSettled ? entryStay : Math.min(entryStay, unallocatedPaid);
      const entryRemaining = isSettled ? 0 : Math.max(0, entryStay - entryPaid);
      unallocatedPaid = Math.max(0, unallocatedPaid - entryPaid);

      groups[entryKey].push({
        id: `${patient.id || patient._id}-entry-${entryKey}`,
        patient,
        eventType: 'entry',
        eventDate: patient.entryDate || patient.createdAt,
        monthKey: entryKey,
        monthStayValue: entryStay,
        monthPaid: entryPaid,
        monthExpenses: entryExp,
        monthRemaining: entryRemaining,
        monthNet: entryPaid - entryExp,
        isEntry: true,
        isRenewal: false
      });
      recordCount++;

      // 2. Renewal Months from timeline
      const seenRenewalMonths = new Set();
      renewalEvents.forEach((renEvent, idx) => {
        const renKey = formatDateToKey(renEvent.date);
        if (renKey && !seenRenewalMonths.has(renKey)) {
          seenRenewalMonths.add(renKey);
          if (!groups[renKey]) groups[renKey] = [];

          const renStay = Number(renEvent.amount || 0);
          const isLastRenewal = (idx === renewalEvents.length - 1);

          let renPaid = 0;
          let renRemaining = 0;

          if (isSettled) {
            renPaid = renStay;
            renRemaining = 0;
          } else if (isLastRenewal) {
            renRemaining = patientRem;
            renPaid = Math.max(0, renStay - renRemaining);
          } else {
            renPaid = Math.min(renStay, unallocatedPaid);
            renRemaining = Math.max(0, renStay - renPaid);
            unallocatedPaid = Math.max(0, unallocatedPaid - renPaid);
          }

          const renExp = calcMonthExpenses(renKey, renEvent.initialExpenses);

          groups[renKey].push({
            id: `${patient.id || patient._id}-renewal-${renKey}-${idx}`,
            patient,
            eventType: 'renewal',
            eventDate: renEvent.date,
            monthKey: renKey,
            monthStayValue: renStay,
            monthPaid: renPaid,
            monthExpenses: renExp,
            monthRemaining: renRemaining,
            monthNet: renPaid - renExp,
            renewalAmount: renStay,
            isEntry: false,
            isRenewal: true,
            renewalIndex: idx + 1
          });
          recordCount++;
        }
      });

      // Fallback: if lastRenewalDate exists and was not caught in timeline
      const lastRenKey = formatDateToKey(patient.lastRenewalDate || patient.renewalDate);
      if (lastRenKey && !seenRenewalMonths.has(lastRenKey)) {
        if (!groups[lastRenKey]) groups[lastRenKey] = [];
        seenRenewalMonths.add(lastRenKey);
        const fallbackStay = Math.max(0, patientStay - entryStay);
        const renPaid = isSettled ? fallbackStay : Math.max(0, fallbackStay - patientRem);
        const renRemaining = isSettled ? 0 : patientRem;
        const fallbackExp = calcMonthExpenses(lastRenKey, undefined);

        groups[lastRenKey].push({
          id: `${patient.id || patient._id}-lastrenewal-${lastRenKey}`,
          patient,
          eventType: 'renewal',
          eventDate: patient.lastRenewalDate || patient.renewalDate,
          monthKey: lastRenKey,
          monthStayValue: fallbackStay,
          monthPaid: renPaid,
          monthExpenses: fallbackExp,
          monthRemaining: renRemaining,
          monthNet: renPaid - fallbackExp,
          renewalAmount: fallbackStay,
          isEntry: false,
          isRenewal: true,
          renewalIndex: patient.renewalsCount || 1
        });
        recordCount++;
      }
    }
  });

  // Sort month keys descending (newest first)
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // Sort items within each month: entry/renewal date descending
  sortedKeys.forEach(k => {
    groups[k].sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0));
  });

  // Calculate totals across all months
  let totalStayValue = 0;
  let totalPaid = 0;
  let totalExpenses = 0;
  let totalRemaining = 0;

  Object.values(groups).forEach(items => {
    items.forEach(item => {
      totalStayValue += Number(item.monthStayValue || 0);
      totalPaid += Number(item.monthPaid || 0);
      totalExpenses += Number(item.monthExpenses || 0);
      totalRemaining += Number(item.monthRemaining || 0);
    });
  });

  return {
    monthlyGroups: groups,
    monthKeys: sortedKeys,
    totalRecordsCount: recordCount,
    totals: {
      totalStayValue,
      totalPaid,
      totalExpenses,
      totalRemaining,
      totalNet: totalPaid - totalExpenses
    }
  };
}
