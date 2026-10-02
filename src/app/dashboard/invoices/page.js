'use client';

import { useState, useMemo } from 'react';
import { useInvoices, useDeleteInvoice } from '../../../hooks/useInvoices';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { FileText, Plus, ShoppingBag, Edit, Trash2, Calendar, DollarSign, X, Filter, Layers } from 'lucide-react';

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

export default function InvoicesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const { data: rawInvoices = [], isLoading } = useInvoices({});
  
  const deleteInvoiceMutation = useDeleteInvoice();
  const openModal = useUIStore(s => s.openModal);

  // Extract all distinct months available in invoices data
  const availableMonths = useMemo(() => {
    const set = new Set();
    rawInvoices.forEach(inv => {
      if (inv.date) {
        const d = new Date(inv.date);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          set.add(`${y}-${m}`);
        }
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [rawInvoices]);

  // Grand total of all invoices across all months
  const grandTotalAllMonths = useMemo(() => {
    return rawInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [rawInvoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return rawInvoices.filter(inv => {
      // 1. Category filter
      if (categoryFilter !== 'all' && inv.category !== categoryFilter) {
        return false;
      }
      // 2. Month filter
      if (selectedMonth !== 'ALL') {
        if (!inv.date) return false;
        const d = new Date(inv.date);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }
      // 3. Custom Date Range
      if (startDate) {
        if (!inv.date) return false;
        const dStr = new Date(inv.date).toISOString().slice(0, 10);
        if (dStr < startDate) return false;
      }
      if (endDate) {
        if (!inv.date) return false;
        const dStr = new Date(inv.date).toISOString().slice(0, 10);
        if (dStr > endDate) return false;
      }
      return true;
    });
  }, [rawInvoices, categoryFilter, selectedMonth, startDate, endDate]);

  // Total sum of filtered invoices
  const filteredTotal = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [filteredInvoices]);

  const handleDelete = (invId) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذه الفاتورة؟')) {
      deleteInvoiceMutation.mutate(invId);
    }
  };

  const handleQuickDateFilter = (type) => {
    const today = new Date();
    setSelectedMonth('ALL');
    if (type === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'week') {
      const first = new Date(today);
      first.setDate(today.getDate() - 7);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const curKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(curKey);
      setStartDate('');
      setEndDate('');
    } else {
      setSelectedMonth('ALL');
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            فواتير المصروفات والمشتريات
          </h1>
          <p className="text-sm text-zinc-400 mt-1">سجل فواتير الأصناف والمصروفات المجمعة وإجمالي الفواتير بالفرع</p>
        </div>

        <button
          onClick={() => openModal('ADD_INVOICE')}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + إضافة فاتورة مصروفات
        </button>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* 1. Grand Total All Months */}
        <div className="mono-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block mb-1">إجمالي الفواتير (كافة الشهور)</span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(grandTotalAllMonths)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Filtered Period Total */}
        <div className="mono-card p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block mb-1">
              {selectedMonth === 'ALL' && !startDate && !endDate ? 'فواتير الفترة الحالية' : `فواتير (${selectedMonth !== 'ALL' ? formatMonthLabel(selectedMonth) : 'المحددة'})`}
            </span>
            <span className="text-2xl font-black text-white">{formatCurrency(filteredTotal)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Filtered Invoices Count */}
        <div className="mono-card p-5 border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block mb-1">عدد الفواتير</span>
            <span className="text-2xl font-black text-white">{filteredInvoices.length} <span className="text-xs text-zinc-500">فاتورة</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Average Invoice */}
        <div className="mono-card p-5 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block mb-1">متوسط قيمة الفاتورة</span>
            <span className="text-2xl font-black text-purple-300">
              {formatCurrency(filteredInvoices.length ? Math.round(filteredTotal / filteredInvoices.length) : 0)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Date & Category Filter Bar */}
      <div className="mono-card p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>تصفية الفواتير بالشهور والتصنيف</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickDateFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                selectedMonth === 'ALL' && !startDate && !endDate ? 'bg-emerald-500 text-black font-bold border-emerald-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              الكل (كافة الشهور)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('month')}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                selectedMonth !== 'ALL' ? 'bg-emerald-500 text-black font-bold border-emerald-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('week')}
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('today')}
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              اليوم
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Month Selector Filter */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              الشهر:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="mono-input text-xs w-full bg-zinc-900 text-white"
            >
              <option value="ALL">كل الشهور (الإجمالي الشامل)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">من تاريخ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setSelectedMonth('ALL');
              }}
              className="mono-input text-xs w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">إلى تاريخ:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setSelectedMonth('ALL');
              }}
              className="mono-input text-xs w-full"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">التصنيف:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mono-input text-xs w-full"
            >
              <option value="all" className="bg-zinc-900 text-white">كل التصنيفات</option>
              <option value="أكل" className="bg-zinc-900 text-white">أكل</option>
              <option value="أدوية" className="bg-zinc-900 text-white">أدوية</option>
              <option value="مرافق" className="bg-zinc-900 text-white">مرافق</option>
              <option value="صيانة" className="bg-zinc-900 text-white">صيانة</option>
              <option value="مستلزمات" className="bg-zinc-900 text-white">مستلزمات</option>
            </select>
          </div>
        </div>

        {(selectedMonth !== 'ALL' || startDate || endDate || categoryFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            <span>
              الفواتير المصفاة: <strong className="text-white">{filteredInvoices.length}</strong> | الإجمالي: <strong className="text-emerald-400">{formatCurrency(filteredTotal)}</strong>
            </span>
            <button
              onClick={() => { setSelectedMonth('ALL'); setStartDate(''); setEndDate(''); setCategoryFilter('all'); }}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500">جاري تحميل فواتير المصروفات...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="mono-card p-12 text-center text-zinc-500">
            لا توجد فواتير مصروفات مسجلة حسب الفلاتر المحددة.
          </div>
        ) : (
          filteredInvoices.map(inv => (
            <div key={inv.id} className="mono-card p-6 space-y-4">
              
              {/* Invoice Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">فاتورة مصروفات #{inv.id.slice(-6)}</h3>
                    <span className="text-xs text-zinc-400">التصنيف: {inv.category} | التاريخ: {formatDate(inv.date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-xs text-zinc-400 block">إجمالي الفاتورة:</span>
                    <span className="text-xl font-black text-white">{formatCurrency(inv.totalAmount)}</span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
                    <button
                      onClick={() => openModal('EDIT_INVOICE', inv)}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="تعديل الفاتورة"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deleteInvoiceMutation.isPending}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
                      title="حذف الفاتورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice Items Sub-table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <th className="p-2.5">الصنف</th>
                      <th className="p-2.5 text-center">العدد (الكمية)</th>
                      <th className="p-2.5 text-center">سعر الوحدة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
                        <td className="p-2.5 font-bold text-white flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{item.name}</span>
                        </td>
                        <td className="p-2.5 text-center font-medium text-zinc-200">{item.count}</td>
                        <td className="p-2.5 text-center text-zinc-300">{formatCurrency(item.price)}</td>
                        <td className="p-2.5 text-left font-black text-white">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {inv.notes && (
                <div className="text-xs text-zinc-400 pt-1">
                  ملاحظات: {inv.notes}
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}

