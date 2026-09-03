'use client';

import { useState } from 'react';
import { useAttendance, useUpdateAttendance } from '../../../hooks/useAttendance';
import { getArabicMonthName, formatNumber } from '../../../utils/formatters';
import { Calendar, Filter, Check, X as XIcon, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AttendancePage() {
  const [month, setMonth] = useState(9); // September default
  const [year, setYear] = useState(2026);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data: attendanceData, isLoading } = useAttendance(month, year, typeFilter);
  const updateAttendanceMutation = useUpdateAttendance();

  const daysInMonth = new Date(year, month, 0).getDate() || 30;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleCellClick = (employeeId, day, currentStatus) => {
    // Cycle: (empty) → حاضر → غائب → إجازة → (empty/null)
    let nextStatus;
    if (!currentStatus || currentStatus === 'غير محدد') nextStatus = 'حاضر';
    else if (currentStatus === 'حاضر') nextStatus = 'غائب';
    else if (currentStatus === 'غائب') nextStatus = 'إجازة';
    else nextStatus = null; // reset back to empty

    updateAttendanceMutation.mutate({
      employeeId,
      day,
      status: nextStatus,
      month,
      year
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'حاضر':
        return 'bg-emerald-500 text-white font-bold border-emerald-400';
      case 'غائب':
        return 'bg-zinc-700 text-rose-400 font-semibold border-zinc-600';
      case 'إجازة':
        return 'bg-zinc-800 text-amber-300 border-zinc-600';
      default:
        // Empty / not set — neutral gray, no content
        return 'bg-zinc-900 border-zinc-800 text-zinc-700';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'حاضر') return 'ح';
    if (status === 'غائب') return 'غ';
    if (status === 'إجازة') return 'ج';
    return ''; // empty cell for unset
  };

  // Aggregated totals across all employees for this month
  const totalPresent = attendanceData?.reduce((acc, row) => acc + (row.stats?.present || 0), 0) || 0;
  const totalAbsent = attendanceData?.reduce((acc, row) => acc + (row.stats?.absent || 0), 0) || 0;
  const totalLeave = attendanceData?.reduce((acc, row) => acc + (row.stats?.leave || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">سجل الحضور والغياب الشهري</h1>
          <p className="text-sm text-zinc-400 mt-1">جدول تسجيل حضور الموظفين بالفرع يوم بيوم والإحصائيات الشهرية</p>
        </div>

        {/* Quick Month Selector Controls */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <button
            onClick={() => setMonth(m => m === 1 ? 12 : m - 1)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white px-2">
            {getArabicMonthName(month)} {year}
          </span>
          <button
            onClick={() => setMonth(m => m === 12 ? 1 : m + 1)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
            title="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="mono-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي أيام الحضور</span>
            <div className="text-2xl font-black text-white mt-1">{formatNumber(totalPresent)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="mono-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي أيام الغياب</span>
            <div className="text-2xl font-black text-white mt-1">{formatNumber(totalAbsent)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold">
            <XIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="mono-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي أيام الإجازات</span>
            <div className="text-2xl font-black text-white mt-1">{formatNumber(totalLeave)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls & Role Filter */}
      <div className="mono-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الفلترة حسب الكادر:
          </span>

          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setTypeFilter('دكتور')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'دكتور' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            أطباء
          </button>
          <button
            onClick={() => setTypeFilter('تمريض')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'تمريض' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            تمريض
          </button>
          <button
            onClick={() => setTypeFilter('مشرف')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'مشرف' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            مشرفون
          </button>
          <button
            onClick={() => setTypeFilter('عامل')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'عامل' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            عمال
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          * اضغط على أي خانة يوم لتغيير الحالة فوراً (حاضر / غائب / إجازة)
        </div>
      </div>

      {/* Monthly Matrix Grid Table */}
      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr>
                <th className="mono-table-th text-right sticky right-0 z-20 bg-zinc-950 min-w-[160px]">الموظف</th>
                <th className="mono-table-th min-w-[70px]">الوظيفة</th>
                {daysArray.map(d => (
                  <th key={d} className="mono-table-th w-9 min-w-[36px] text-center p-1.5">
                    {d}
                  </th>
                ))}
                <th className="mono-table-th min-w-[60px] bg-zinc-900">حضور</th>
                <th className="mono-table-th min-w-[60px] bg-zinc-900">غياب</th>
                <th className="mono-table-th min-w-[60px] bg-zinc-900">إجازة</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={daysInMonth + 5} className="py-12 text-zinc-500 text-center">
                    جاري تحميل سجل الحضور...
                  </td>
                </tr>
              ) : attendanceData?.map(({ employee, attendance, stats }) => (
                <tr key={employee.id} className="hover:bg-zinc-900/40 border-b border-zinc-800">
                  
                  {/* Sticky Employee Name */}
                  <td className="mono-table-td text-right font-bold text-white sticky right-0 bg-zinc-900 z-10 py-2">
                    {employee.name}
                  </td>
                  
                  <td className="mono-table-td text-zinc-400 py-2">
                    {employee.type}
                  </td>

                  {/* Days cells */}
                  {daysArray.map(d => {
                    // null/undefined = not recorded yet (gray empty default)
                    const status = attendance[d] || null;
                    return (
                      <td key={d} className="p-1 border border-zinc-800/60">
                        <button
                          onClick={() => handleCellClick(employee.id, d, status)}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center text-[10px] transition-transform active:scale-95 ${getStatusStyle(status)}`}
                          title={`اليوم ${d}: ${status || 'لم يسجل بعد'} — اضغط للتسجيل`}
                        >
                          {getStatusLabel(status)}
                        </button>
                      </td>
                    );
                  })}

                  {/* Employee Stats */}
                  <td className="mono-table-td font-black text-white bg-zinc-900/80">{stats.present}</td>
                  <td className="mono-table-td font-semibold text-zinc-400 bg-zinc-900/80">{stats.absent}</td>
                  <td className="mono-table-td font-semibold text-zinc-300 bg-zinc-900/80">{stats.leave}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
