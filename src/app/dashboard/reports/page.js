'use client';

import { useState } from 'react';
import { useReports } from '../../../hooks/useReports';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, getArabicMonthName, formatNumber } from '../../../utils/formatters';
import { exportStyledExcel } from '../../../utils/excelExporter';
import { exportComprehensiveClinicExcel } from '../../../utils/clinicFullExcelExporter';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users, PieChart as PieIcon, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [month, setMonth] = useState(9);
  const [year, setYear] = useState(2026);

  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);

  const { data: report, isLoading } = useReports(month, year);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportComprehensiveClinicExcel({
        month,
        year,
        branch,
        existingReport: report
      });

      showToast('تم تصدير ملف Excel الشامل بنجاح بكافة الشيتات (النزلاء، الدكاترة والتمريض، المشرفين والعمال، المصاريف اليومية، الفواتير، الموظفين، السلف، ملخص الإيرادات والمصاريف)', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تصدير ملف Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">التقارير التحليلية للفرع</h1>
          <p className="text-sm text-zinc-400 mt-1">تقارير ملخصة للأداء المالي وتوزيع المصروفات وحركة المقيمين</p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={isLoading || isExporting}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>جاري تجهيز Excel...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>تصدير ملف Excel الشامل</span>
            </>
          )}
        </button>
      </div>

      {/* Period Filter Controls */}
      <div className="mono-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-white" />
          <span className="text-sm font-bold text-white">تحديد الفترة المالية:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="mono-input text-xs w-48"
          >
            <option value="all">كل الشهور (إجمالي السنة)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getArabicMonthName(m)} ({m})</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mono-input text-xs w-28"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* 3 Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="mono-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">إجمالي الإيرادات</span>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-4">
              {isLoading ? '...' : formatCurrency(report?.totals?.totalRevenue)}
            </div>
          </div>
          {month !== 'all' && !isLoading && (
            <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between items-center">
                <span>إيرادات إقامة الشهر الحالي:</span>
                <span className="font-semibold text-zinc-300 font-mono">{formatCurrency(report?.totals?.currentMonthStay || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>+ صافي إيرادات شهر {report?.totals?.prevMonthName || getArabicMonthName(month === 1 ? 12 : month - 1)}:</span>
                <span className="font-bold font-mono">+{formatCurrency(report?.totals?.previousMonthNet || 0)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mono-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي المصروفات والسلف</span>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-4">
            {isLoading ? '...' : formatCurrency(report?.totals?.totalExpenses)}
          </div>
        </div>

        <div className="mono-card p-6 border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">صافي الإيرادات</span>
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-4">
            {isLoading ? '...' : formatCurrency(report?.totals?.netRevenue)}
          </div>
        </div>

      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Expense Category Breakdown */}
        <div className="mono-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-white" />
              <span>تفاصيل المصروفات حسب التصنيف</span>
            </h3>
            <span className="text-xs text-zinc-400">{month === 'all' ? `إجمالي عام ${year}` : `${getArabicMonthName(month)} ${year}`}</span>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="py-8 text-center text-zinc-500">جاري تجميع المصروفات...</div>
            ) : (
              report?.categoryBreakdown?.map(item => (
                <div key={item.name} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{item.name}</span>
                  <span className="font-black text-white">{formatCurrency(item.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Patient Statistics */}
        <div className="mono-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              <span>إحصائيات النزلاء بالفرع</span>
            </h3>
            <span className="text-xs text-zinc-400">{month === 'all' ? `إجمالي عام ${year}` : `${getArabicMonthName(month)} ${year}`}</span>
          </div>

          <div className="space-y-4 pt-2">

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">النزلاء الحاليون</div>
                <div className="text-xs text-zinc-400 mt-0.5">عدد مقيمي المصحة في الوقت الحالي</div>
              </div>
              <span className="text-2xl font-black text-white">
                {formatNumber(report?.patientStats?.current)}
              </span>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">النزلاء الجدد</div>
                <div className="text-xs text-zinc-400 mt-0.5">دخول جديد في فترة التقرير</div>
              </div>
              <span className="text-2xl font-black text-white">
                {formatNumber(report?.patientStats?.newCount)}
              </span>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">النزلاء الخارجون</div>
                <div className="text-xs text-zinc-400 mt-0.5">تم تسوية حسابهم وتثبيت خروجهم</div>
              </div>
              <span className="text-2xl font-black text-white">
                {formatNumber(report?.patientStats?.exitCount)}
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
