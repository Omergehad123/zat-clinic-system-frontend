import { apiFetch } from './api';

export const attendanceService = {
  /**
   * Get attendance records for a branch, optionally filtered by month/year.
   * Returns per-employee rows with a map of day→status for the given month.
   */
  getAttendance: async (branchId, month, year, typeFilter = 'ALL') => {
    let query = '?';
    if (branchId && branchId !== 'all') {
      query += `branchId=${branchId}&`;
    }
    if (month && year) {
      query += `month=${month}&year=${year}&`;
    }

    // Fetch employees for the branch first
    let empQuery = `?status=active`;
    if (branchId && branchId !== 'all') {
      empQuery += `&branchId=${branchId}`;
    }
    const empRes = await apiFetch(`/employees${empQuery}`);
    let employees = empRes.data || [];

    // Map Arabic type filter to English role for matching
    const roleMap = { 'دكتور': 'doctor', 'تمريض': 'nurse', 'مشرف': 'supervisor', 'عامل': 'worker' };
    if (typeFilter && typeFilter !== 'ALL') {
      const englishRole = roleMap[typeFilter] || typeFilter;
      employees = employees.filter(e => e.role === englishRole || e.type === typeFilter);
    }

    // Fetch attendance records
    const attRes = await apiFetch(`/attendance${query}`);
    const records = attRes.data || [];

    // Calculate days in month
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

    return employees.map(emp => {
      // Build day map — only populate days that have an actual DB record
      const days = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const rec = records.find(r => {
          const recEmpId = r.employeeId ? r.employeeId.toString() : null;
          const empId = (emp.id || emp._id).toString();
          if (recEmpId !== empId) return false;
          const recDate = new Date(r.date);
          return recDate.getDate() === d;
        });

        if (rec) {
          // Map backend statuses to Arabic display
          const statusMap = { present: 'حاضر', absent: 'غائب', leave: 'إجازة' };
          days[d] = statusMap[rec.status] || rec.status;
        }
        // No else — leave days[d] undefined so the UI shows an empty gray cell
      }

      // Stats only count days that have actual records
      const daysArr = Object.values(days);
      return {
        employee: emp,
        attendance: days,
        stats: {
          present: daysArr.filter(s => s === 'حاضر').length,
          absent: daysArr.filter(s => s === 'غائب').length,
          leave: daysArr.filter(s => s === 'إجازة').length
        }
      };
    });
  },

  /**
   * Update a single employee's attendance for a specific day.
   */
  updateAttendance: async (employeeId, day, statusAr, month, year) => {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    date.setHours(12, 0, 0, 0);

    // null means "reset" — delete the record via DELETE endpoint
    if (!statusAr || statusAr === null) {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          status: 'delete',
          date: date.toISOString()
        })
      });
      return true;
    }

    // Map Arabic status back to English enum
    const statusMap = { 'حاضر': 'present', 'غائب': 'absent', 'إجازة': 'leave' };
    const status = statusMap[statusAr] || statusAr;

    await apiFetch('/attendance', {
      method: 'POST',
      body: JSON.stringify({
        employeeId,
        status,
        date: date.toISOString()
      })
    });

    return true;
  },

  /**
   * Submit bulk attendance records for multiple employees on a date.
   */
  bulkUpdateAttendance: async (records, date) => {
    const statusMap = { 'حاضر': 'present', 'غائب': 'absent', 'إجازة': 'leave' };
    const mappedRecords = records.map(r => ({
      ...r,
      status: statusMap[r.status] || r.status
    }));

    const res = await apiFetch('/attendance', {
      method: 'POST',
      body: JSON.stringify({ records: mappedRecords, date })
    });

    return res;
  }
};
