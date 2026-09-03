'use client';

import { useState } from 'react';
import { useFinance } from '../../../hooks/useFinance';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Plus, ArrowUpLeft, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('INCOME'); // 'INCOME' | 'EXPENSES' | 'TRANSACTIONS'

  const { data: finance, isLoading, refetch } = useFinance();
  const openModal = useUIStore(s => s.openModal);

  const totals = finance?.totals || { totalIncome: 0, totalExpenses: 0, netRevenue: 0, advancesTotal: 0 };
  const incomeList = finance?.income || [];
  const expenseList = finance?.expenses || [];
  const transactions = finance?.transactions || [];

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الشؤون المالية والحسابات</h1>
          <p className="text-sm text-zinc-400 mt-1">متابعة الإيرادات والمصروفات وحركة الخزينة والتحصيلات بالفرع</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('ADD_EXPENSE')}
            className="mono-btn-primary text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            إضافة مصروف مباشر
          </button>
          <button
            onClick={() => refetch()}
            className="mono-btn-secondary p-2.5"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي الإيرادات</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrency(totals.totalIncome)}
          </div>
        </div>

        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي المصروفات والسلف</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrency(totals.totalExpenses)}
          </div>
        </div>

        <div className="mono-card p-5 border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">صافي الإيرادات بالفرع</span>
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrency(totals.netRevenue)}
          </div>
        </div>

        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي سلف الموظفين</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrency(totals.advancesTotal)}
          </div>
        </div>

      </div>

      {/* Tabs Control */}
      <div className="border-b border-zinc-800 flex items-center gap-6">
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'INCOME' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          الإيرادات ({incomeList.length})
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'EXPENSES' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          المصروفات ({expenseList.length})
        </button>

        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'TRANSACTIONS' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          الحركات المالية الشاملة ({transactions.length})
        </button>
      </div>

      {/* Tab 1: الإيرادات */}
      {activeTab === 'INCOME' && (
        <div className="mono-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr>
                  <th className="mono-table-th">التاريخ</th>
                  <th className="mono-table-th">النزيل</th>
                  <th className="mono-table-th">المبلغ</th>
                  <th className="mono-table-th">طريقة الدفع</th>
                  <th className="mono-table-th">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">جاري تحميل سجل الإيرادات...</td>
                  </tr>
                ) : incomeList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">لا توجد إيرادات مسجلة.</td>
                  </tr>
                ) : (
                  incomeList.map(inc => (
                    <tr key={inc.id} className="hover:bg-zinc-900/60">
                      <td className="mono-table-td text-zinc-300">{formatDate(inc.date)}</td>
                      <td className="mono-table-td font-bold text-white">{inc.patientName}</td>
                      <td className="mono-table-td font-black text-white">{formatCurrency(inc.amount)}</td>
                      <td className="mono-table-td">
                        <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
                          {inc.method}
                        </span>
                      </td>
                      <td className="mono-table-td text-zinc-400">{inc.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: المصروفات */}
      {activeTab === 'EXPENSES' && (
        <div className="mono-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr>
                  <th className="mono-table-th">التاريخ</th>
                  <th className="mono-table-th">التصنيف</th>
                  <th className="mono-table-th">البيان</th>
                  <th className="mono-table-th">المبلغ</th>
                  <th className="mono-table-th">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">جاري تحميل سجل المصروفات...</td>
                  </tr>
                ) : expenseList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">لا توجد مصروفات مسجلة.</td>
                  </tr>
                ) : (
                  expenseList.map(exp => (
                    <tr key={exp.id} className="hover:bg-zinc-900/60">
                      <td className="mono-table-td text-zinc-300">{formatDate(exp.date)}</td>
                      <td className="mono-table-td">
                        <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="mono-table-td font-medium text-white">{exp.description}</td>
                      <td className="mono-table-td font-black text-white">{formatCurrency(exp.amount)}</td>
                      <td className="mono-table-td text-zinc-400">{exp.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: الحركات المالية الشاملة */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="mono-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white mb-2">سجل كشف الحركات المالية المجمعة بالفرع</h3>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center py-8 text-zinc-500">جاري تحميل الحركات...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-zinc-500">لا توجد حركات مالية مسجلة</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      tx.kind === 'إيراد' ? 'bg-white text-black' : 'bg-zinc-800 text-white'
                    }`}>
                      {tx.kind === 'إيراد' ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4 text-zinc-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{tx.title}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">التصنيف: {tx.category}</div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-black text-white text-base">
                      {tx.kind === 'إيراد' ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                    </div>
                    <div className="text-xs text-zinc-500">{formatDate(tx.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
