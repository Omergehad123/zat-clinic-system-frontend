'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePatients } from '../../../hooks/usePatients';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  LogOut, 
  User, 
  ChevronDown, 
  Pencil, 
  RotateCcw,
  DollarSign, 
  Receipt,
  Calendar,
  Layers,
  Sparkles,
  ChevronUp,
  FolderOpen,
  FolderClosed,
  CheckCircle2,
  Users,
  Clock
} from 'lucide-react';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthDetails(monthKey) {
  // monthKey format: 'YYYY-MM'
  if (!monthKey || typeof monthKey !== 'string') return { titleAr: '', titleEn: '', year: '', monthNum: 1 };
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthNum = parseInt(monthStr, 10);

  const titleAr = `${ARABIC_MONTHS[monthIdx] || ''} ${year}`;
  const titleEn = `${ENGLISH_MONTHS[monthIdx] || ''} ${year}`;
  return { titleAr, titleEn, year, monthNum, monthIdx };
}

function formatDateToKey(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openActionId, setOpenActionId] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Current month key (e.g. '2026-10')
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // State to track open drawers (set of month keys)
  const [openMonths, setOpenMonths] = useState([currentMonthKey]);

  const { data: rawPatients, isLoading } = usePatients(search, statusFilter);
  const openModal = useUIStore(s => s.openModal);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Process and group patients by month
  // A patient belongs to:
  // 1. Their entryDate month (tagged as 'entry' / جديد)
  // 2. Any renewalDate months from timeline or lastRenewalDate (tagged as 'renewal' / تجديد)
  const { monthlyGroups, monthKeys, totalRecordsCount } = useMemo(() => {
    const groups = {};

    // Ensure current month is always present in groups
    if (!groups[currentMonthKey]) {
      groups[currentMonthKey] = [];
    }

    if (!rawPatients || !Array.isArray(rawPatients)) {
      return { 
        monthlyGroups: groups, 
        monthKeys: [currentMonthKey], 
        totalRecordsCount: 0 
      };
    }

    let recordCount = 0;

    rawPatients.forEach(patient => {
      // 1. Entry Month
      const entryKey = formatDateToKey(patient.entryDate || patient.createdAt) || currentMonthKey;
      if (!groups[entryKey]) groups[entryKey] = [];

      // Check if entry belongs to this month
      groups[entryKey].push({
        id: `${patient.id}-entry-${entryKey}`,
        patient,
        eventType: 'entry',
        eventDate: patient.entryDate || patient.createdAt,
        isEntry: true,
        isRenewal: false
      });
      recordCount++;

      // 2. Renewal Months from timeline
      const seenRenewalMonths = new Set();

      if (Array.isArray(patient.timeline)) {
        patient.timeline
          .filter(e => e.type === 'renewal')
          .forEach((renEvent, idx) => {
            const renKey = formatDateToKey(renEvent.date);
            if (renKey) {
              if (!groups[renKey]) groups[renKey] = [];
              // Prevent duplicating in same month
              if (!seenRenewalMonths.has(renKey)) {
                seenRenewalMonths.add(renKey);
                groups[renKey].push({
                  id: `${patient.id}-renewal-${renKey}-${idx}`,
                  patient,
                  eventType: 'renewal',
                  eventDate: renEvent.date,
                  renewalAmount: renEvent.amount,
                  isEntry: false,
                  isRenewal: true,
                  renewalIndex: idx + 1
                });
                recordCount++;
              }
            }
          });
      }

      // Fallback: if lastRenewalDate exists and was not caught in timeline
      const lastRenKey = formatDateToKey(patient.lastRenewalDate || patient.renewalDate);
      if (lastRenKey && !seenRenewalMonths.has(lastRenKey)) {
        if (!groups[lastRenKey]) groups[lastRenKey] = [];
        seenRenewalMonths.add(lastRenKey);
        groups[lastRenKey].push({
          id: `${patient.id}-lastrenewal-${lastRenKey}`,
          patient,
          eventType: 'renewal',
          eventDate: patient.lastRenewalDate || patient.renewalDate,
          isEntry: false,
          isRenewal: true,
          renewalIndex: patient.renewalsCount || 1
        });
        recordCount++;
      }
    });

    // Sort month keys descending (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    // Sort items within each month: entry/renewal date descending
    sortedKeys.forEach(k => {
      groups[k].sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0));
    });

    return {
      monthlyGroups: groups,
      monthKeys: sortedKeys,
      totalRecordsCount: recordCount
    };
  }, [rawPatients, currentMonthKey]);

  // If searching, auto-expand all months that have matching patients
  useEffect(() => {
    if (search.trim()) {
      const activeKeys = monthKeys.filter(k => (monthlyGroups[k] || []).length > 0);
      setOpenMonths(activeKeys);
    }
  }, [search, monthKeys, monthlyGroups]);

  // Close dropdown on outside click, window scroll or resize
  useEffect(() => {
    if (!openActionId) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionId(null);
        setActivePatient(null);
        setMenuPosition(null);
      }
    };

    const handleScrollOrResize = () => {
      setOpenActionId(null);
      setActivePatient(null);
      setMenuPosition(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openActionId]);

  const toggleMonth = (monthKey) => {
    setOpenMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(k => k !== monthKey) 
        : [...prev, monthKey]
    );
  };

  const expandAll = () => {
    setOpenMonths([...monthKeys]);
  };

  const collapseAll = () => {
    setOpenMonths([]);
  };

  const handleAddNewInMonth = (e, monthKey) => {
    e.stopPropagation();
    // Format a default date in this month (today if current month, else 1st of that month)
    let defaultDate = new Date().toISOString().split('T')[0];
    if (monthKey !== currentMonthKey) {
      defaultDate = `${monthKey}-01`;
    }
    openModal('ADD_PATIENT', { defaultDate });
  };

  const toggleActionMenu = (e, patient) => {
    e.stopPropagation();
    if (openActionId === patient.id) {
      setOpenActionId(null);
      setActivePatient(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 208; // w-52
      const menuHeight = 230;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

      let left = rect.right - menuWidth;
      if (left < 10) left = rect.left;
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }

      setMenuPosition({
        top: openUpwards ? rect.top - 6 : rect.bottom + 6,
        left: Math.max(10, left),
        openUpwards
      });
      setOpenActionId(patient.id);
      setActivePatient(patient);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'حالي':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-black">حالي</span>;
      case 'جديد':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500">جديد</span>;
      case 'خرج':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">خرج</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">إدارة النزلاء (سجل الشهور التفاعلي)</h1>
              <p className="text-sm text-zinc-400 mt-0.5">أدراج الشهور المنظمة تلقائياً - يظهر النزيل في شهر دخوله وتجديداته تلقائياً</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('ADD_PATIENT', { defaultDate: new Date().toISOString().split('T')[0] })}
            className="mono-btn-primary text-sm shadow-md flex items-center gap-2 py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نزيل جديد</span>
          </button>
        </div>
      </div>

      {/* Search, Status Filters & Accordion Controls */}
      <div className="mono-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم النزيل في جميع الشهور..."
            className="mono-input pl-4 pr-10 text-sm"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters & Collapse / Expand All */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> الفلترة:
            </span>
            
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              الكل ({rawPatients?.length || 0})
            </button>
            
            <button
              onClick={() => setStatusFilter('حالي')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'حالي' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              حاليون
            </button>

            <button
              onClick={() => setStatusFilter('جديد')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'جديد' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              جدد
            </button>

            <button
              onClick={() => setStatusFilter('خرج')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'خرج' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              تم الخروج
            </button>
          </div>

          {/* Expand / Collapse All Buttons */}
          <div className="flex items-center gap-1 border-r border-zinc-800 pr-2 mr-1">
            <button
              onClick={expandAll}
              title="فتح كل أدراج الشهور"
              className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-md transition-colors flex items-center gap-1"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>فتح الكل</span>
            </button>
            <button
              onClick={collapseAll}
              title="طي كل أدراج الشهور"
              className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-md transition-colors flex items-center gap-1"
            >
              <FolderClosed className="w-3.5 h-3.5" />
              <span>طي الكل</span>
            </button>
          </div>
        </div>

      </div>

      {/* Monthly Drawers (FAQ / Accordion Style) */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="mono-card p-12 text-center text-zinc-500 space-y-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto" />
            <p>جاري تحميل وتنظيم سجل النزلاء عبر الشهور...</p>
          </div>
        ) : monthKeys.length === 0 ? (
          <div className="mono-card p-12 text-center text-zinc-500">
            لا توجد بيانات متاحة حالياً.
          </div>
        ) : (
          monthKeys.map((monthKey) => {
            const isOpen = openMonths.includes(monthKey);
            const isCurrentMonth = monthKey === currentMonthKey;
            const items = monthlyGroups[monthKey] || [];
            const { titleAr, titleEn } = getMonthDetails(monthKey);

            // Month level stats
            const entriesCount = items.filter(i => i.isEntry).length;
            const renewalsCount = items.filter(i => i.isRenewal).length;
            const totalMonthStay = items.reduce((sum, item) => sum + (Number(item.patient.stayValue ?? item.patient.accommodationAmount) || 0), 0);
            const totalMonthPaid = items.reduce((sum, item) => sum + (Number(item.patient.paidAmount ?? item.patient.paid) || 0), 0);
            const totalMonthRemaining = items.reduce((sum, item) => sum + (Number(item.patient.remainingAmount ?? item.patient.remaining) || 0), 0);
            const totalMonthExpenses = items.reduce((sum, item) => sum + (Number(item.patient.totalExpenses ?? item.patient.expensesTotal) || 0), 0);
            const totalMonthNet = items.reduce((sum, item) => {
              const p = item.patient;
              const paid = Number(p.paidAmount ?? p.paid ?? 0);
              const exp = Number(p.totalExpenses ?? p.expensesTotal ?? 0);
              return sum + (paid - exp);
            }, 0);

            return (
              <div 
                key={monthKey} 
                className={`mono-card overflow-hidden transition-all duration-300 border ${
                  isCurrentMonth 
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20' 
                    : isOpen ? 'border-zinc-700 bg-zinc-950/80' : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
                }`}
              >
                {/* Accordion / Drawer Header */}
                <div 
                  onClick={() => toggleMonth(monthKey)}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                    isOpen ? 'bg-zinc-900/60' : 'hover:bg-zinc-900/30'
                  }`}
                >
                  {/* Left (Month Title & Current Badge & Chips) */}
                  <div className="flex flex-wrap items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                      isCurrentMonth 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {titleAr}
                        </h2>
                        <span className="text-xs text-zinc-500 font-mono">({titleEn})</span>

                        {isCurrentMonth && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            الشهر الحالي (افتراضي)
                          </span>
                        )}
                      </div>

                      {/* Summary Badges in Header */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                          إجمالي نزلاء الشهر: <strong className="text-white font-mono">{items.length}</strong>
                        </span>
                        {entriesCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-medium">
                            جدد: <strong className="font-mono">{entriesCount}</strong>
                          </span>
                        )}
                        {renewalsCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-medium">
                            تجديدات: <strong className="font-mono">{renewalsCount}</strong>
                          </span>
                        )}
                        {items.length > 0 && (
                          <>
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                              المحصل (صافي الإيرادات): <strong className="text-emerald-400 font-mono">{formatCurrency(totalMonthNet)}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                              المدفوع: <strong className="text-zinc-200 font-mono">{formatCurrency(totalMonthPaid)}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right (Quick Add in this month + Arrow icon) */}
                  <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-center w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
                    <button
                      onClick={(e) => handleAddNewInMonth(e, monthKey)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all flex items-center gap-1.5 shadow-sm"
                      title={`إضافة نزيل جديد في ${titleAr}`}
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>إضافة نزيل في هذا الشهر</span>
                    </button>

                    <div className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-zinc-800 text-white' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Drawer Body (Table of Patients for this month) */}
                {isOpen && (
                  <div className="border-t border-zinc-800/90 bg-black/40">
                    {items.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 space-y-3">
                        <p className="text-sm">لا يوجد نزلاء مسجلين أو مجددين في هذا الشهر حتى الآن.</p>
                        <button
                          onClick={(e) => handleAddNewInMonth(e, monthKey)}
                          className="mono-btn-primary text-xs mx-auto py-1.5 px-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة أول نزيل لشهر {titleAr}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-w-full">
                        <table className="w-full text-right border-collapse min-w-[980px]">
                          <thead>
                            <tr className="bg-zinc-900/40">
                              <th className="mono-table-th">النزيل</th>
                              <th className="mono-table-th">حالة الشهر</th>
                              <th className="mono-table-th">تاريخ الدخول</th>
                              <th className="mono-table-th">تاريخ التجديد</th>
                              <th className="mono-table-th">تاريخ الخروج</th>
                              <th className="mono-table-th">قيمة الإقامة</th>
                              <th className="mono-table-th">المدفوع</th>
                              <th className="mono-table-th">المتبقي</th>
                              <th className="mono-table-th">صافي الإيرادات</th>
                              <th className="mono-table-th">حالة الإقامة</th>
                              <th className="mono-table-th text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {items.map((item) => {
                              const { patient, isRenewal, isEntry, renewalIndex } = item;
                              let renewalDate = patient.lastRenewalDate || patient.renewalDate;
                              if (!renewalDate && Array.isArray(patient.timeline)) {
                                const ren = patient.timeline.filter(e => e.type === 'renewal');
                                if (ren.length > 0) renewalDate = ren[ren.length - 1].date;
                              }
                              const renewalsCount = patient.renewalsCount || (patient.timeline?.filter(e => e.type === 'renewal')?.length || (renewalDate ? 1 : 0));

                              return (
                                <tr key={item.id} className="hover:bg-zinc-900/60 transition-colors">
                                  {/* Name */}
                                  <td className="mono-table-td font-semibold text-white">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                                        <User className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-white text-sm">{patient.name}</div>
                                        {patient.notes && (
                                          <div className="text-[10px] text-zinc-500 truncate max-w-[180px]" title={patient.notes}>
                                            {patient.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Month Activity Tag */}
                                  <td className="mono-table-td">
                                    {isRenewal ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                                        <span>تجديد إقامة {renewalIndex ? `#${renewalIndex}` : ''}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                        <Sparkles className="w-3 h-3 text-emerald-400" />
                                        <span>دخول جديد</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Entry Date */}
                                  <td className="mono-table-td text-zinc-300">{formatDate(patient.entryDate)}</td>

                                  {/* Renewal Date */}
                                  <td className="mono-table-td">
                                    {renewalDate ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-400 font-semibold">{formatDate(renewalDate)}</span>
                                        {renewalsCount > 1 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded font-mono font-bold">
                                            {renewalsCount}x
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-zinc-600 text-xs">-</span>
                                    )}
                                  </td>

                                  {/* Exit Date */}
                                  <td className="mono-table-td text-zinc-400">
                                    {patient.exitDate ? formatDate(patient.exitDate) : (patient.expectedExitDate ? `متوقع: ${formatDate(patient.expectedExitDate)}` : '-')}
                                  </td>

                                  {/* Stay Value */}
                                  <td className="mono-table-td font-bold text-white">{formatCurrency(patient.stayValue)}</td>

                                  {/* Paid */}
                                  <td className="mono-table-td text-zinc-200">{formatCurrency(patient.paid)}</td>

                                  {/* Remaining */}
                                  <td className={`mono-table-td font-bold ${patient.remaining > 0 ? 'text-white' : 'text-zinc-500'}`}>
                                    {formatCurrency(patient.remaining)}
                                  </td>

                                  {/* Net Revenue */}
                                  <td className="mono-table-td">
                                    <div className="space-y-0.5">
                                      {(() => {
                                        const paid     = Number(patient.paidAmount   ?? patient.paid          ?? 0);
                                        const expenses = Number(patient.totalExpenses ?? patient.expensesTotal ?? 0);
                                        const net      = paid - expenses;
                                        return (
                                          <>
                                            <div className={`font-bold font-mono text-sm ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {formatCurrency(net)}
                                            </div>
                                            {expenses > 0 && (
                                              <div className="text-[10px] text-zinc-500">
                                                مصاريف: {formatCurrency(expenses)}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="mono-table-td">{getStatusBadge(patient.status)}</td>

                                  {/* Actions Button */}
                                  <td className="mono-table-td text-center">
                                    <button
                                      onClick={(e) => toggleActionMenu(e, patient)}
                                      className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm ${
                                        openActionId === patient.id 
                                          ? 'bg-zinc-800 border-zinc-500 text-white' 
                                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-200'
                                      }`}
                                    >
                                      <span>الإجراءات</span>
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openActionId === patient.id ? 'rotate-180' : ''}`} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>

                          {/* Table Footer with exact column totals */}
                          <tfoot className="border-t-2 border-zinc-700 bg-zinc-900/80 font-bold">
                            <tr>
                              <td className="mono-table-td text-white" colSpan={5}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs uppercase tracking-wider text-zinc-300">إجمالي شهر {titleAr}:</span>
                                  <span className="text-xs text-zinc-400 font-mono">({items.length} نزيل)</span>
                                </div>
                              </td>
                              {/* Stay Value Total */}
                              <td className="mono-table-td text-white font-mono text-sm">
                                {formatCurrency(totalMonthStay)}
                              </td>
                              {/* Paid Total */}
                              <td className="mono-table-td text-zinc-200 font-mono text-sm">
                                {formatCurrency(totalMonthPaid)}
                              </td>
                              {/* Remaining Total */}
                              <td className={`mono-table-td font-mono text-sm ${totalMonthRemaining > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                {formatCurrency(totalMonthRemaining)}
                              </td>
                              {/* Net Revenue Total */}
                              <td className="mono-table-td">
                                <div className={`font-mono text-sm ${totalMonthNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {formatCurrency(totalMonthNet)}
                                </div>
                                {totalMonthExpenses > 0 && (
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    مصاريف: {formatCurrency(totalMonthExpenses)}
                                  </div>
                                )}
                              </td>
                              {/* Status & Actions fillers */}
                              <td className="mono-table-td text-zinc-600 text-xs text-center">-</td>
                              <td className="mono-table-td text-zinc-600 text-xs text-center">-</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Menu rendered in Portal outside table DOM */}
      {mounted && openActionId && activePatient && menuPosition && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: menuPosition.openUpwards ? undefined : `${menuPosition.top}px`,
            bottom: menuPosition.openUpwards ? `${window.innerHeight - menuPosition.top}px` : undefined,
            left: `${menuPosition.left}px`,
            zIndex: 99999
          }}
          className="w-52 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl overflow-hidden dir-rtl divide-y divide-zinc-800 animate-fade-in text-right"
        >
          <div className="py-1">
            <Link
              href={`/dashboard/patients/${activePatient.id}`}
              onClick={() => { setOpenActionId(null); setActivePatient(null); setMenuPosition(null); }}
              className="w-full text-right px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>عرض الملف بالتفصيل</span>
            </Link>
            <button
              onClick={() => {
                setOpenActionId(null);
                setActivePatient(null);
                setMenuPosition(null);
                openModal('ADD_PAYMENT', { ...activePatient, patientId: activePatient.id, patientName: activePatient.name });
              }}
              className="w-full text-right px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors font-medium"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>إضافة دفعة سداد</span>
            </button>
            <button
              onClick={() => {
                setOpenActionId(null);
                setActivePatient(null);
                setMenuPosition(null);
                openModal('ADD_PATIENT_EXPENSE', { ...activePatient, patientId: activePatient.id, patientName: activePatient.name });
              }}
              className="w-full text-right px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 transition-colors font-medium"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>إضافة مصروف نزيل</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpenActionId(null);
                setActivePatient(null);
                setMenuPosition(null);
                openModal('RENEW_PATIENT', activePatient);
              }}
              className="w-full text-right px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>تجديد الإقامة (تمديد الحجز)</span>
            </button>

            {activePatient.status !== 'خرج' && activePatient.status !== 'discharged' && (
              <button
                onClick={() => {
                  setOpenActionId(null);
                  setActivePatient(null);
                  setMenuPosition(null);
                  openModal('DISCHARGE_PATIENT', activePatient);
                }}
                className="w-full text-right px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>تسجيل خروج النزيل</span>
              </button>
            )}

            <button
              onClick={() => {
                setOpenActionId(null);
                setActivePatient(null);
                setMenuPosition(null);
                openModal('EDIT_PATIENT', activePatient);
              }}
              className="w-full text-right px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10 flex items-center gap-2 transition-colors font-medium"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>تعديل بيانات النزيل</span>
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
