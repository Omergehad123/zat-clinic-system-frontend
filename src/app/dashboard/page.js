'use client';

import { usePatients } from '../../hooks/usePatients';
import { useFinance } from '../../hooks/useFinance';
import { useAdvances } from '../../hooks/useAdvances';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function DashboardOverviewPage() {
  const branch = useAuthStore(s => s.branch);
  const openModal = useUIStore(s => s.openModal);

  const { data: patients, isLoading: loadingPatients } = usePatients();
  const { data: finance, isLoading: loadingFinance } = useFinance();
  const { data: advancesData, isLoading: loadingAdvances } = useAdvances();

  // Metrics computation
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current patients = active residents who have not been discharged
  const currentPatientsCount = patients?.filter(p => 
    p.status !== 'خرج' && p.status !== 'discharged'
  ).length || 0;

  // New patients = entered in current month/year OR explicitly status new/جديد
  const newPatientsCount = patients?.filter(p => {
    if (p.status === 'جديد' || p.status === 'new') return true;
    const entryDate = p.entryDate ? new Date(p.entryDate) : (p.createdAt ? new Date(p.createdAt) : null);
    if (entryDate && !isNaN(entryDate.getTime())) {
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    }
    return false;
  }).length || 0;

  // Discharged patients = status is خرج or discharged
  const dischargedPatientsCount = patients?.filter(p => 
    p.status === 'خرج' || p.status === 'discharged'
  ).length || 0;

  const totalPatientPaid = patients?.reduce((acc, p) => acc + Number(p.paidAmount ?? p.paid ?? 0), 0) || 0;
  const totalRevenue = (finance?.totals?.totalIncome !== undefined && finance?.totals?.totalIncome !== null)
    ? finance.totals.totalIncome
    : (finance?.totals?.totalRevenue || totalPatientPaid);
  const totalExpenses = finance?.totals?.totalExpenses || 0;
  const netRevenue = finance?.totals?.netRevenue || (totalRevenue - totalExpenses);
  const totalAdvances = finance?.totals?.advancesTotal || advancesData?.totals?.month || 0;

  const totalRemaining = patients?.reduce((acc, p) => acc + Number(p.remainingAmount ?? p.remaining ?? 0), 0) || 0;

  // Dynamic Chart Data Preparation
  const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const dynamicTrendMap = {};
  if (finance?.transactions && Array.isArray(finance.transactions)) {
    finance.transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const monthLabel = monthNames[d.getMonth()];
      if (!dynamicTrendMap[monthLabel]) {
        dynamicTrendMap[monthLabel] = { revenue: 0, expense: 0 };
      }
      if (t.kind === 'إيراد' || t.type === 'income') {
        dynamicTrendMap[monthLabel].revenue += Number(t.amount) || 0;
      } else {
        dynamicTrendMap[monthLabel].expense += Number(t.amount) || 0;
      }
    });
  }

  const dynamicTrendList = Object.keys(dynamicTrendMap).map(m => ({
    name: m,
    revenue: dynamicTrendMap[m].revenue,
    expense: dynamicTrendMap[m].expense
  }));

  const trendData = dynamicTrendList.length > 0 ? dynamicTrendList : [
    { name: monthNames[currentMonth], revenue: totalRevenue, expense: totalExpenses }
  ];

  const dynamicCategories = {
    'أكل': 0,
    'أدوية': 0,
    'مرافق': 0,
    'صيانة': 0,
    'مستلزمات': 0,
    'سلف': totalAdvances || 0,
    'أخرى': 0
  };

  if (finance?.expenses && Array.isArray(finance.expenses)) {
    finance.expenses.forEach(exp => {
      const cat = exp.category || '';
      const amt = Number(exp.amount) || 0;
      if (cat.includes('أكل') || cat === 'Food') dynamicCategories['أكل'] += amt;
      else if (cat.includes('أدوية') || cat === 'Medicine') dynamicCategories['أدوية'] += amt;
      else if (cat.includes('مرافق') || cat === 'Utilities') dynamicCategories['مرافق'] += amt;
      else if (cat.includes('صيانة') || cat === 'Maintenance') dynamicCategories['صيانة'] += amt;
      else if (cat.includes('مستلزمات') || cat === 'Supplies') dynamicCategories['مستلزمات'] += amt;
      else if (cat.includes('سلف') || cat === 'Employee Advances') dynamicCategories['سلف'] += amt;
      else dynamicCategories['أخرى'] += amt;
    });
  }

  const categoryData = Object.keys(dynamicCategories).map(key => ({
    name: key,
    amount: dynamicCategories[key]
  }));

  const totalPieSum = currentPatientsCount + newPatientsCount + dischargedPatientsCount;
  const patientPieData = totalPieSum > 0
    ? [
        { name: 'حالي', value: currentPatientsCount, color: '#ffffff' },
        { name: 'جديد', value: newPatientsCount, color: '#a1a1aa' },
        { name: 'خرج', value: dischargedPatientsCount, color: '#3f3f46' }
      ]
    : [
        { name: 'حالي', value: 1, color: '#ffffff' },
        { name: 'جديد', value: 0, color: '#a1a1aa' },
        { name: 'خرج', value: 0, color: '#3f3f46' }
      ];

  const isLoading = loadingPatients || loadingFinance || loadingAdvances;

  return (
    <div className="space-y-8 pb-12">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            نظرة عامة — {branch?.name || 'الفرع الحالي'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            متابعة فورية للنزلاء والتدفقات المالية وسجل العمليات بالفرع
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('ADD_PATIENT')}
            className="mono-btn-primary text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            إضافة نزيل جديد
          </button>
          <button
            onClick={() => openModal('ADD_INVOICE')}
            className="mono-btn-secondary text-sm"
          >
            + إضافة فاتورة
          </button>
        </div>
      </div>

      {/* Section: 8 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">النزلاء الحاليون</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : formatNumber(currentPatientsCount)}
            </span>
            <span className="text-xs text-zinc-400">نزيل بالفرع</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">النزلاء الجدد هذا الشهر</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : formatNumber(newPatientsCount)}
            </span>
            <span className="text-xs text-zinc-400">دخول جديد</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">النزلاء الخارجون هذا الشهر</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <UserMinus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : formatNumber(dischargedPatientsCount)}
            </span>
            <span className="text-xs text-zinc-400">تم الخروج</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي الإيرادات</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {isLoading ? '...' : formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي المصروفات</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {isLoading ? '...' : formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Card 6 */}
        <div className="mono-card p-5 border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">صافي الإيرادات</span>
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {isLoading ? '...' : formatCurrency(netRevenue)}
            </span>
          </div>
        </div>

        {/* Card 7 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">إجمالي السلف</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {isLoading ? '...' : formatCurrency(totalAdvances)}
            </span>
          </div>
        </div>

        {/* Card 8 */}
        <div className="mono-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">المبالغ المتبقية للنزلاء</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {isLoading ? '...' : formatCurrency(totalRemaining)}
            </span>
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart 1: الإيرادات والمصروفات Trend */}
        <div className="mono-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">الإيرادات والمصروفات</h2>
              <p className="text-xs text-zinc-400">مقارنة حركة التدفقات المالية للشهور الأخيرة</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-white rounded-sm inline-block" />
                <span>الإيرادات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-zinc-600 rounded-sm inline-block" />
                <span>المصروفات</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52525b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#52525b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#71717a" tickLine={false} fontSize={12} />
                <YAxis stroke="#71717a" tickLine={false} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`${val} جنيه`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: النزلاء Pie Chart */}
        <div className="mono-card p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold text-white">توزيع النزلاء</h2>
            <p className="text-xs text-zinc-400">حالي / جديد / خرج</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {patientPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-zinc-800">
            <div>
              <div className="font-bold text-white">{currentPatientsCount}</div>
              <div className="text-zinc-400">حالي</div>
            </div>
            <div>
              <div className="font-bold text-zinc-300">{newPatientsCount}</div>
              <div className="text-zinc-400">جديد</div>
            </div>
            <div>
              <div className="font-bold text-zinc-400">{dischargedPatientsCount}</div>
              <div className="text-zinc-400">خرج</div>
            </div>
          </div>
        </div>

        {/* Chart 3: المصروفات حسب التصنيف Bar Chart */}
        <div className="mono-card p-6 lg:col-span-3 space-y-4">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold text-white">المصروفات حسب التصنيف</h2>
            <p className="text-xs text-zinc-400">توزيع المصروفات</p>
          </div>

          <div className="h-56 w-full dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#71717a" tickLine={false} fontSize={12} />
                <YAxis stroke="#71717a" tickLine={false} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`${val} جنيه`, 'المبلغ']}
                />
                <Bar dataKey="amount" fill="#ffffff" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
