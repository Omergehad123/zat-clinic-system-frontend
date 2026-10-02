'use client';

import { useState, useMemo } from 'react';
import { useAdvances } from '../../../hooks/useAdvances';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Wallet, Search, Filter, Calendar, Plus, UserCheck, Layers } from 'lucide-react';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function formatMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${ARABIC_MONTHS[idx] || m} ${y}`;
}

export default function AdvancesPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const { data: rawAdvancesData, isLoading } = useAdvances('', 'ALL', '');
  const openModal = useUIStore(s => s.openModal);

  const allAdvances = rawAdvancesData?.advances || [];

  // Extract all distinct months available in advances data
  const availableMonths = useMemo(() => {
    const set = new Set();
    allAdvances.forEach(a => {
      if (a.date) {
        const d = new Date(a.date);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          set.add(`${y}-${m}`);
        }
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allAdvances]);

  // Grand total of all advances across all months
  const grandTotalAllMonths = useMemo(() => {
    return allAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  }, [allAdvances]);

  // Today's advances total
  const todayTotal = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allAdvances
      .filter(a => a.date && new Date(a.date).toISOString().split('T')[0] === todayStr)
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);
  }, [allAdvances]);

  // Filtered advances
  const filteredAdvances = useMemo(() => {
    return allAdvances.filter(a => {
      // 1. Search filter
      if (search && !a.employeeName?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // 2. Role filter
      if (roleFilter !== 'ALL') {
        const roleMap = { 'تمريض': 'nurse', 'مشرف': 'supervisor', 'عامل': 'worker', 'دكتور': 'doctor' };
        const englishRole = roleMap[roleFilter] || roleFilter;
        if (a.role !== englishRole && a.employeeType !== roleFilter) {
          return false;
        }
      }
      // 3. Month filter
      if (selectedMonth !== 'ALL') {
        if (!a.date) return false;
        const d = new Date(a.date);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }
      // 4. Specific Date filter
      if (dateFilter) {
        if (!a.date) return false;
        const d = new Date(a.date);
        if (d.toISOString().slice(0, 10) !== dateFilter) return false;
      }
      return true;
    });
  }, [allAdvances, search, roleFilter, selectedMonth, dateFilter]);

  // Total for currently filtered view
  const filteredTotal = useMemo(() => {
    return filteredAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  }, [filteredAdvances]);

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة سلف الموظفين</h1>
          <p className="text-sm text-zinc-400 mt-1">تسجيل متابعة سلف الكادر والتراكم المالي اليومي والشهري</p>
        </div>

        <button
          onClick={() => openModal('ADD_ADVANCE')}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إضافة سلفة جديدة
        </button>
      </div>

      {/* Summary Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1. Grand Total All Months */}
        <div className="mono-card p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي السلف (كافة الشهور)</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(grandTotalAllMonths)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Selected Period / Month Total */}
        <div className="mono-card p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-xs font-semibold text-zinc-400">
              {selectedMonth === 'ALL' ? 'إجمالي السلف المعروضة' : `سلف شهر (${formatMonthLabel(selectedMonth)})`}
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(filteredTotal)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Today's Total */}
        <div className="mono-card p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي سلف اليوم</span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {formatCurrency(todayTotal)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search & Filters */}
      <div className="mono-card p-4 space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم الموظف..."
              className="mono-input pl-4 pr-10 text-sm"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Month Selector Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              الشهر:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setDateFilter('');
              }}
              className="mono-input text-xs w-full md:w-48 bg-zinc-900 text-white"
            >
              <option value="ALL">كل الشهور (الإجمالي الشامل)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setSelectedMonth('ALL');
              }}
              className="mono-input text-xs w-auto dir-ltr"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-zinc-400 hover:text-white underline whitespace-nowrap"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pt-2 border-t border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الوظيفة:
          </span>

          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setRoleFilter('تمريض')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'تمريض' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            تمريض
          </button>
          <button
            onClick={() => setRoleFilter('مشرف')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'مشرف' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            مشرفون
          </button>
          <button
            onClick={() => setRoleFilter('عامل')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'عامل' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            عمال
          </button>
        </div>

      </div>

      {/* Advances Table */}
      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="mono-table-th">التاريخ</th>
                <th className="mono-table-th">الموظف</th>
                <th className="mono-table-th">الوظيفة</th>
                <th className="mono-table-th">المبلغ</th>
                <th className="mono-table-th">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">جاري تحميل سجل السلف...</td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">لا توجد سلف مسجلة بهذه المحددات.</td>
                </tr>
              ) : (
                filteredAdvances.map(adv => (
                  <tr key={adv.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="mono-table-td text-zinc-300">{formatDate(adv.date)}</td>
                    <td className="mono-table-td font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <span>{adv.employeeName}</span>
                      </div>
                    </td>
                    <td className="mono-table-td">
                      <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {adv.employeeType}
                      </span>
                    </td>
                    <td className="mono-table-td font-black text-white">{formatCurrency(adv.amount)}</td>
                    <td className="mono-table-td text-zinc-400">{adv.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredAdvances.length > 0 && (
              <tfoot className="border-t-2 border-zinc-700 bg-zinc-900/80 font-bold">
                <tr>
                  <td colSpan={3} className="mono-table-td text-zinc-300">
                    الإجمالي ({filteredAdvances.length} سلفة):
                  </td>
                  <td className="mono-table-td font-black text-emerald-400 font-mono text-sm">
                    {formatCurrency(filteredTotal)}
                  </td>
                  <td className="mono-table-td text-zinc-500">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
}
