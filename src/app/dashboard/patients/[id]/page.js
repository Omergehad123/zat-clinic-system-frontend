'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePatientDetails } from '../../../../hooks/usePatients';
import { useUIStore } from '../../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import { 
  ArrowRight, 
  User, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Plus, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  FileText,
  DollarSign,
  Pencil,
  RotateCcw,
  History,
  Filter,
  LogIn,
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id;

  // Active Main Tab: 'TIMELINE' | 'PAYMENTS' | 'EXPENSES' | 'FINANCIAL_LOG'
  const [activeTab, setActiveTab] = useState('TIMELINE');
  // Timeline Filter Sub-category: 'ALL' | 'STAY' | 'PAYMENTS' | 'EXPENSES'
  const [timelineFilter, setTimelineFilter] = useState('ALL');
  // Sort direction: 'DESC' (newest first) | 'ASC' (oldest first)
  const [timelineSortOrder, setTimelineSortOrder] = useState('DESC');

  const { data: patient, isLoading } = usePatientDetails(patientId);
  const openModal = useUIStore(s => s.openModal);

  // Unified Timeline Events Builder
  const unifiedTimelineEvents = useMemo(() => {
    if (!patient) return [];

    const events = [];

    // 1. Stored DB Timeline events
    const rawTimeline = Array.isArray(patient.timeline) ? patient.timeline : [];
    let hasEntry = false;
    let hasDischarge = false;

    rawTimeline.forEach((ev) => {
      if (ev.type === 'entry') hasEntry = true;
      if (ev.type === 'discharge') hasDischarge = true;

      events.push({
        id: ev._id || ev.id || `tl-${Math.random()}`,
        type: ev.type || 'custom',
        category: (ev.type === 'payment') ? 'PAYMENTS' : (ev.type === 'expense') ? 'EXPENSES' : 'STAY',
        title: ev.title || (ev.type === 'renewal' ? 'تجديد الإقامة' : ev.type === 'entry' ? 'دخول أولي' : 'حركة إقامة'),
        date: ev.date || ev.createdAt,
        amount: ev.amount || 0,
        periodStart: ev.periodStart,
        periodEnd: ev.periodEnd,
        details: ev.details || ev.notes || '',
        isManual: true
      });
    });

    // 2. Synthesize baseline Entry if not present
    if (!hasEntry && patient.entryDate) {
      events.push({
        id: `synth-entry-${patient.id}`,
        type: 'entry',
        category: 'STAY',
        title: 'دخول أولي / تسجيل الحجز',
        date: patient.entryDate,
        amount: patient.stayValue || patient.accommodationAmount || 0,
        periodStart: patient.entryDate,
        periodEnd: patient.exitDate || patient.expectedExitDate,
        details: patient.notes || 'تسجيل دخول النزيل لأول مرة بالمركز',
        isManual: false
      });
    }

    // 3. Synthesize baseline Discharge if discharged and not recorded
    if (!hasDischarge && (patient.status === 'خرج' || patient.status === 'discharged') && patient.exitDate) {
      events.push({
        id: `synth-discharge-${patient.id}`,
        type: 'discharge',
        category: 'STAY',
        title: 'تسجيل خروج النزيل',
        date: patient.exitDate,
        amount: 0,
        details: 'تم إنهاء الإقامة وتسجيل الخروج بنجاح',
        isManual: false
      });
    }

    // 4. Merge all patient payments into timeline
    (patient.payments || []).forEach((pay) => {
      // Avoid duplicate if payment was already recorded in timeline array
      const exists = events.some(e => e.type === 'payment' && new Date(e.date).getTime() === new Date(pay.date).getTime() && Number(e.amount) === Number(pay.amount));
      if (!exists) {
        events.push({
          id: pay._id || pay.id || `pay-${Math.random()}`,
          type: 'payment',
          category: 'PAYMENTS',
          title: 'دفعة سداد إقامة',
          date: pay.date,
          amount: pay.amount,
          details: `طريقة الدفع: ${pay.paymentMethod || pay.method || 'كاش'}${pay.notes ? ` - ${pay.notes}` : ''}`,
          isIncome: true
        });
      }
    });

    // 5. Merge all patient expenses into timeline
    (patient.expenses || []).forEach((exp) => {
      const exists = events.some(e => e.type === 'expense' && new Date(e.date).getTime() === new Date(exp.date).getTime() && Number(e.amount) === Number(exp.amount));
      if (!exists) {
        events.push({
          id: exp._id || exp.id || `exp-${Math.random()}`,
          type: 'expense',
          category: 'EXPENSES',
          title: `مصروف نزيل (${exp.category || 'شخصي'})`,
          date: exp.date,
          amount: exp.amount,
          details: `${exp.description || 'مصروفات علاج/مستلزمات'}${exp.notes ? ` - ${exp.notes}` : ''}`,
          isIncome: false
        });
      }
    });

    // Sort by date
    return events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return timelineSortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });
  }, [patient, timelineSortOrder]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return unifiedTimelineEvents;
    return unifiedTimelineEvents.filter(ev => ev.category === timelineFilter);
  }, [unifiedTimelineEvents, timelineFilter]);

  // Timeline Metrics
  const timelineStats = useMemo(() => {
    if (!patient) return { renewalsCount: 0, totalDays: 0 };
    const renewals = unifiedTimelineEvents.filter(e => e.type === 'renewal');
    
    const entryTime = patient.entryDate ? new Date(patient.entryDate).getTime() : Date.now();
    const endTime = patient.exitDate && (patient.status === 'خرج' || patient.status === 'discharged') 
      ? new Date(patient.exitDate).getTime() 
      : Date.now();
    const days = Math.max(1, Math.ceil((endTime - entryTime) / (1000 * 60 * 60 * 24)));

    return {
      renewalsCount: renewals.length,
      totalDays: days
    };
  }, [patient, unifiedTimelineEvents]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500">
        جاري تحميل تفاصيل بيانات النزيل والجدول الزمني...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">النزيل غير موجود</h2>
        <button onClick={() => router.push('/dashboard/patients')} className="mono-btn-secondary">
          العودة لقائمة النزلاء
        </button>
      </div>
    );
  }

  // Combined complete financial log sorted by date
  const combinedLog = [
    ...(patient.payments || []).map(p => ({
      type: 'إيراد - دفعة',
      id: p.id || p._id,
      date: p.date,
      amount: p.amount,
      details: `طريقة الدفع: ${p.paymentMethod || p.method || 'كاش'}`,
      notes: p.notes,
      isIncome: true
    })),
    ...(patient.expenses || []).map(e => ({
      type: 'مصروف نزيل',
      id: e.id || e._id,
      date: e.date,
      amount: e.amount,
      details: `التصنيف: ${e.category} | ${e.description}`,
      notes: e.notes,
      isIncome: false
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-8 pb-12">

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <button
          onClick={() => router.push('/dashboard/patients')}
          className="mono-btn-secondary text-xs self-start sm:self-auto"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى النزلاء
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openModal('EDIT_PATIENT', patient)}
            className="mono-btn-secondary text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            تعديل البيانات
          </button>

          {/* Renewal Button - Always Available At Any Time */}
          <button
            onClick={() => openModal('RENEW_PATIENT', patient)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            تجديد الإقامة (تمديد الحجز)
          </button>

          {patient.status !== 'خرج' && patient.status !== 'discharged' && (
            <button
              onClick={() => openModal('DISCHARGE_PATIENT', patient)}
              className="mono-btn-danger text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              تسجيل خروج النزيل
            </button>
          )}

          <button
            onClick={() => openModal('ADD_PAYMENT', { ...patient, patientId: patient.id, patientName: patient.name })}
            className="mono-btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة دفعة سداد
          </button>
        </div>
      </div>

      {/* Patient Profile Header Card */}
      <div className="mono-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        
        {/* Info Col 1 */}
        <div className="flex items-center gap-4 md:border-l md:border-zinc-800 md:pl-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shrink-0 font-bold text-xl shadow-inner">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                patient.status === 'حالي' ? 'bg-white text-black' : (patient.status === 'جديد' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')
              }`}>
                {patient.status}
              </span>
              <span className="text-xs text-zinc-400 font-mono">#{patient.id?.slice(-6) || patient._id?.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Dates Info */}
        <div className="space-y-1.5 text-sm text-zinc-300 md:border-l md:border-zinc-800 md:pl-6">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">تاريخ أول دخول:</span>
            <span className="font-semibold text-white">{formatDate(patient.entryDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">تاريخ الخروج:</span>
            <span className="font-semibold text-white">
              {patient.exitDate ? formatDate(patient.exitDate) : (patient.expectedExitDate ? `متوقع (${formatDate(patient.expectedExitDate)})` : 'مفتوح / مستمر')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-zinc-400">التجديدات:</span>
            <span className="font-semibold text-emerald-400">{timelineStats.renewalsCount} مرات</span>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2 text-sm text-zinc-300">
          <span className="text-xs font-semibold text-zinc-400 block mb-1">ملاحظات الإقامة والملف:</span>
          <p className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line">
            {patient.notes || 'لا توجد ملاحظات إضافية على ملف النزيل.'}
          </p>
        </div>

      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">قيمة الإقامة الكلية</span>
          <div className="text-xl font-black text-white mt-1.5 font-mono">
            {formatCurrency(patient.stayValue ?? patient.accommodationAmount)}
          </div>
        </div>

        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">المدفوع من الإقامة</span>
          <div className="text-xl font-black text-emerald-400 mt-1.5 font-mono">
            {formatCurrency(patient.paid ?? patient.paidAmount)}
          </div>
        </div>

        <div className="mono-card p-4 border-zinc-700">
          <span className="text-xs font-semibold text-zinc-400">المتبقي من الإقامة</span>
          <div className="text-xl font-black text-white mt-1.5 font-mono">
            {formatCurrency(patient.remaining ?? patient.remainingAmount)}
          </div>
        </div>

        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">صافي الإيرادات</span>
          <div className="text-[10px] text-zinc-500 mt-0.5">المدفوع − مصاريف النزيل</div>
          {(() => {
            const paid     = Number(patient.paidAmount   ?? patient.paid          ?? 0);
            const expenses = Number(patient.totalExpenses ?? patient.expensesTotal ?? 0);
            const net      = paid - expenses;
            return (
              <div className={`text-xl font-black mt-1.5 font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(net)}
              </div>
            );
          })()}
        </div>

      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-zinc-800 flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TIMELINE' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>الجدول الزمني للإقامة (Timeline)</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {unifiedTimelineEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PAYMENTS' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <span>سجل المدفوعات ({patient.payments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'EXPENSES' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4 text-zinc-400" />
          <span>مصاريف النزيل ({patient.expenses?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('FINANCIAL_LOG')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FINANCIAL_LOG' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-zinc-400" />
          <span>السجل المالي الشامل</span>
        </button>
      </div>

      {/* Tab 0: الجدول الزمني للإقامة (TIMELINE) */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">

          {/* Timeline Summary & Filter Controls */}
          <div className="mono-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/90 border-zinc-800">
            
            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>أول دخول:</span>
                <strong className="text-white">{formatDate(patient.entryDate)}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>مدة الإقامة الكلية:</span>
                <strong className="text-white">{timelineStats.totalDays} يوم</strong>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>مرات التجديد:</span>
                <strong className="text-white">{timelineStats.renewalsCount}</strong>
              </div>
            </div>

            {/* Filter Chips & Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> تصفية:
              </span>

              <button
                onClick={() => setTimelineFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timelineFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                الكل ({unifiedTimelineEvents.length})
              </button>

              <button
                onClick={() => setTimelineFilter('STAY')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timelineFilter === 'STAY' ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                حركات الإقامة (دخول/تجديد/خروج)
              </button>

              <button
                onClick={() => setTimelineFilter('PAYMENTS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timelineFilter === 'PAYMENTS' ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                المدفوعات
              </button>

              <button
                onClick={() => setTimelineFilter('EXPENSES')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timelineFilter === 'EXPENSES' ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                المصاريف
              </button>

              <button
                onClick={() => setTimelineSortOrder(s => s === 'DESC' ? 'ASC' : 'DESC')}
                className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 flex items-center gap-1"
                title="تغيير الترتيب الزمني"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{timelineSortOrder === 'DESC' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
              </button>

              <button
                onClick={() => openModal('RENEW_PATIENT', patient)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 flex items-center gap-1.5 mr-auto md:mr-2 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                تجديد الإقامة الآن
              </button>
            </div>

          </div>

          {/* Vertical Timeline Track */}
          <div className="mono-card p-6">
            {filteredTimeline.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                لا توجد أحداث مطابقة في الجدول الزمني
              </div>
            ) : (
              <div className="relative pr-6 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800 space-y-8">
                {filteredTimeline.map((item, idx) => {
                  let badgeStyle = {
                    bg: 'bg-zinc-900 border-zinc-700 text-zinc-300',
                    dotBg: 'bg-zinc-600',
                    icon: History
                  };

                  if (item.type === 'entry') {
                    badgeStyle = {
                      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      dotBg: 'bg-emerald-500',
                      icon: LogIn
                    };
                  } else if (item.type === 'renewal') {
                    badgeStyle = {
                      bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                      dotBg: 'bg-cyan-500',
                      icon: RotateCcw
                    };
                  } else if (item.type === 'discharge') {
                    badgeStyle = {
                      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                      dotBg: 'bg-rose-500',
                      icon: LogOut
                    };
                  } else if (item.type === 'payment') {
                    badgeStyle = {
                      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      dotBg: 'bg-emerald-500',
                      icon: DollarSign
                    };
                  } else if (item.type === 'expense') {
                    badgeStyle = {
                      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                      dotBg: 'bg-amber-500',
                      icon: Receipt
                    };
                  }

                  const IconComp = badgeStyle.icon;

                  return (
                    <div key={item.id || idx} className="relative group">
                      
                      {/* Timeline Circle Anchor */}
                      <div className={`absolute -right-[31px] top-1.5 w-6 h-6 rounded-full border-2 border-zinc-900 ${badgeStyle.dotBg} flex items-center justify-center text-black shadow-md z-10`}>
                        <IconComp className="w-3 h-3 text-black stroke-[3]" />
                      </div>

                      {/* Event Card Content */}
                      <div className="bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all shadow-sm space-y-2.5">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${badgeStyle.bg}`}>
                              <IconComp className="w-3.5 h-3.5" />
                              {item.title}
                            </span>

                            {item.amount > 0 && (
                              <span className="font-mono font-bold text-sm text-white bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                                {formatCurrency(item.amount)}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="font-semibold text-zinc-300">{formatDate(item.date)}</span>
                          </div>
                        </div>

                        {/* Period Span if applicable */}
                        {(item.periodStart || item.periodEnd) && (
                          <div className="text-xs text-zinc-400 flex items-center gap-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-850">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>فترة الإقامة:</span>
                            <span className="text-white font-medium">
                              من {formatDate(item.periodStart || item.date)} {item.periodEnd ? `إلى ${formatDate(item.periodEnd)}` : '(مفتوحة)'}
                            </span>
                          </div>
                        )}

                        {/* Details / Notes */}
                        {item.details && (
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                            {item.details}
                          </p>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 1: سجل المدفوعات */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">دفوعات سداد الإقامة</h3>
            <button
              onClick={() => openModal('ADD_PAYMENT', { ...patient, patientId: patient.id, patientName: patient.name })}
              className="mono-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + إضافة دفعة جديدة
            </button>
          </div>

          <div className="mono-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="mono-table-th">التاريخ</th>
                    <th className="mono-table-th">المبلغ</th>
                    <th className="mono-table-th">طريقة الدفع</th>
                    <th className="mono-table-th">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.payments?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-zinc-500">لا يوجد مدفوعات مسجلة بعد</td>
                    </tr>
                  ) : (
                    patient.payments?.map(pay => (
                      <tr key={pay.id || pay._id} className="hover:bg-zinc-900/60">
                        <td className="mono-table-td text-zinc-300">{formatDate(pay.date)}</td>
                        <td className="mono-table-td font-bold text-white font-mono">{formatCurrency(pay.amount)}</td>
                        <td className="mono-table-td">
                          <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
                            {pay.paymentMethod || pay.method || 'كاش'}
                          </span>
                        </td>
                        <td className="mono-table-td text-zinc-400">{pay.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: مصاريف النزيل */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          
          {/* Expenses Balance Overview Box */}
          <div className="mono-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/60 border-zinc-800">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">قيمة الإقامة:</span>
              <span className="text-lg font-black text-white font-mono">{formatCurrency(patient.stayValue || patient.accommodationAmount || 0)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">إجمالي المصاريف:</span>
              <span className="text-lg font-black text-amber-400 font-mono">{formatCurrency(patient.expensesTotal || patient.totalExpenses || 0)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">صافي الإيرادات:</span>
              {(() => {
                const paid     = Number(patient.paidAmount   ?? patient.paid          ?? 0);
                const expenses = Number(patient.totalExpenses ?? patient.expensesTotal ?? 0);
                const net      = paid - expenses;
                return (
                  <span className={`text-lg font-black font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(net)}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">سجل مصاريف العلاج والمستلزمات للنزيل</h3>
            <button
              onClick={() => openModal('ADD_PATIENT_EXPENSE', { ...patient, patientId: patient.id, patientName: patient.name })}
              className="mono-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + إضافة مصروف نزيل
            </button>
          </div>

          <div className="mono-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="mono-table-th">التاريخ</th>
                    <th className="mono-table-th">البيان</th>
                    <th className="mono-table-th">التصنيف</th>
                    <th className="mono-table-th">المبلغ</th>
                    <th className="mono-table-th">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.expenses?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-zinc-500">لا توجد مصاريف مسجلة لهذا النزيل</td>
                    </tr>
                  ) : (
                    patient.expenses?.map(exp => (
                      <tr key={exp.id || exp._id} className="hover:bg-zinc-900/60">
                        <td className="mono-table-td text-zinc-300">{formatDate(exp.date)}</td>
                        <td className="mono-table-td font-medium text-white">{exp.description}</td>
                        <td className="mono-table-td">
                          <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="mono-table-td font-bold text-white font-mono">{formatCurrency(exp.amount)}</td>
                        <td className="mono-table-td text-zinc-400">{exp.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: السجل المالي الشامل */}
      {activeTab === 'FINANCIAL_LOG' && (
        <div className="mono-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white mb-2">السجل المالي الشامل للنزيل</h3>
          
          <div className="space-y-3">
            {combinedLog.length === 0 ? (
              <p className="text-center py-8 text-zinc-500">السجل المالي فارغ</p>
            ) : (
              combinedLog.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      item.isIncome ? 'bg-white text-black' : 'bg-zinc-800 text-white'
                    }`}>
                      {item.isIncome ? '+' : '-'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{item.type}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{item.details} {item.notes ? `(${item.notes})` : ''}</div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-black text-white text-base font-mono">{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-zinc-500">{formatDate(item.date)}</div>
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
