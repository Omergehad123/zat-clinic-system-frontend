'use client';

import { useState } from 'react';
import { useAdvances } from '../../../hooks/useAdvances';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Wallet, Search, Filter, Calendar, Plus, UserCheck } from 'lucide-react';

export default function AdvancesPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const { data: advancesData, isLoading } = useAdvances(search, roleFilter, dateFilter);
  const openModal = useUIStore(s => s.openModal);

  const advances = advancesData?.advances || [];
  const totals = advancesData?.totals || { today: 0, month: 0 };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="mono-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي سلف اليوم</span>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(totals.today)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mono-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">إجمالي سلف الشهر</span>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(totals.month)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search & Filters */}
      <div className="mono-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
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

        {/* Date Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mono-input text-xs w-auto dir-ltr"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-zinc-400 hover:text-white underline whitespace-nowrap"
            >
              مسح التاريخ
            </button>
          )}
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الوظيفة:
          </span>

          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setRoleFilter('تمريض')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'تمريض' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            تمريض
          </button>
          <button
            onClick={() => setRoleFilter('مشرف')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'مشرف' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            مشرفون
          </button>
          <button
            onClick={() => setRoleFilter('عامل')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
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
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">جاري تحميل سجل السلف...</td>
                </tr>
              ) : advances?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">لا توجد سلف مسجلة بهذه المحددات.</td>
                </tr>
              ) : (
                advances?.map(adv => (
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
          </table>
        </div>
      </div>

    </div>
  );
}
