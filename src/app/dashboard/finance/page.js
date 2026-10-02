'use client';

import { useState } from 'react';
import { useFinance } from '../../../hooks/useFinance';
import { usePatients } from '../../../hooks/usePatients';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Plus, ArrowUpLeft, ArrowDownRight, RefreshCw } from 'lucide-react';

function formatDateToKey(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function calculateAllMonthsFinancials(patientsList) {
  if (!patientsList || !Array.isArray(patientsList) || patientsList.length === 0) {
    return { totalPaid: 0, totalPatientExpenses: 0 };
  }
  
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const groups = {};

  patientsList.forEach(patient => {
    // 1. Entry Month
    const entryKey = formatDateToKey(patient.entryDate || patient.createdAt) || currentMonthKey;
    if (!groups[entryKey]) groups[entryKey] = [];
    groups[entryKey].push(patient);

    // 2. Renewal Months from timeline
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

    // Fallback: lastRenewalDate
    const lastRenKey = formatDateToKey(patient.lastRenewalDate || patient.renewalDate);
    if (lastRenKey && !seenRenewalMonths.has(lastRenKey)) {
      seenRenewalMonths.add(lastRenKey);
      if (!groups[lastRenKey]) groups[lastRenKey] = [];
      groups[lastRenKey].push(patient);
    }
  });

  let totalPaid = 0;
  let totalPatientExpenses = 0;
  Object.values(groups).forEach(items => {
    items.forEach(p => {
      totalPaid += Number(p.paidAmount ?? p.paid ?? 0);
      totalPatientExpenses += Number(p.totalExpenses ?? p.expensesTotal ?? 0);
    });
  });

  return { totalPaid, totalPatientExpenses };
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('INCOME'); // 'INCOME' | 'EXPENSES' | 'TRANSACTIONS'

  const { data: finance, isLoading: loadingFinance, refetch: refetchFinance } = useFinance();
  const { data: patients, isLoading: loadingPatients, refetch: refetchPatients } = usePatients();
  const openModal = useUIStore(s => s.openModal);

  // إجمالي الإيرادات = مجموع عمود "المدفوع" في كافة الشهور (دخول جديد + تجديدات)
  const { totalPaid: allMonthsPaid, totalPatientExpenses: allMonthsPatientExpenses } = calculateAllMonthsFinancials(patients);
  const totalIncome = allMonthsPaid > 0 ? allMonthsPaid : (finance?.totals?.totalIncome || 0);

  // إجمالي المصروفات والسلف = مجموع الفواتير + مجموع السلف + مجموع مصاريف النزلاء بكافة الشهور
  const invoicesTotal = Number(finance?.totals?.invoicesTotal || 0);
  const advancesTotal = Number(finance?.totals?.advancesTotal || 0);
  const totalExpenses = (invoicesTotal > 0 || advancesTotal > 0 || allMonthsPatientExpenses > 0)
    ? (invoicesTotal + advancesTotal + allMonthsPatientExpenses)
    : (finance?.totals?.totalExpenses || 0);

  const netRevenue = totalIncome - totalExpenses;

  const totals = {
    totalIncome,
    totalExpenses,
    netRevenue,
    advancesTotal
  };

  const incomeList = finance?.income || [];
  const expenseList = finance?.expenses || [];
  const transactions = finance?.transactions || [];
  const isLoading = loadingFinance || loadingPatients;

  const handleRefresh = () => {
    refetchFinance();
    refetchPatients();
  };

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
            onClick={handleRefresh}
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
          className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'INCOME' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
          الإيرادات ({incomeList.length})
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'EXPENSES' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
          المصروفات ({expenseList.length})
        </button>

        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'TRANSACTIONS' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${tx.kind === 'إيراد' ? 'bg-white text-black' : 'bg-zinc-800 text-white'
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
