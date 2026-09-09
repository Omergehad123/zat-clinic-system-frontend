'use client';

import { useState, useEffect, useRef } from 'react';
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
  MoreVertical 
} from 'lucide-react';

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openActionId, setOpenActionId] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [mounted, setMounted] = useState(false);

  const { data: patients, isLoading } = usePatients(search, statusFilter);
  const openModal = useUIStore(s => s.openModal);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const toggleActionMenu = (e, patient) => {
    e.stopPropagation();
    if (openActionId === patient.id) {
      setOpenActionId(null);
      setActivePatient(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 208; // w-52
      const menuHeight = 220;
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
    <div className="space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة النزلاء (المقيميـن)</h1>
          <p className="text-sm text-zinc-400 mt-1">سجل النزلاء بالفرع وتفاصيل الإقامة والمدفوعات والمستحقات</p>
        </div>

        <button
          onClick={() => openModal('ADD_PATIENT')}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إضافة نزيل جديد
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="mono-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم النزيل..."
            className="mono-input pl-4 pr-10 text-sm"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الفلترة:
          </span>
          
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            الكل ({patients?.length || 0})
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
            جدد هذا الشهر
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

      </div>

      {/* Patients Responsive Table */}
      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-right border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="mono-table-th">الاسم</th>
                <th className="mono-table-th">تاريخ الدخول</th>
                <th className="mono-table-th">تاريخ الخروج</th>
                      <th className="mono-table-th">قيمة الإقامة</th>
                <th className="mono-table-th">المدفوع</th>
                <th className="mono-table-th">المتبقي</th>
                <th className="mono-table-th">صافي الإيرادات</th>
                <th className="mono-table-th">الحالة</th>
                <th className="mono-table-th text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-zinc-500">
                    جاري تحميل بيانات النزلاء...
                  </td>
                </tr>
              ) : patients?.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-zinc-500">
                    لا يوجد نزلاء يطابقون نتائج البحث أو الفلترة.
                  </td>
                </tr>
              ) : (
                patients?.map((patient) => {
                  const isOpen = openActionId === patient.id;
                  return (
                    <tr key={patient.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="mono-table-td font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <span>{patient.name}</span>
                        </div>
                      </td>
                      <td className="mono-table-td text-zinc-300">{formatDate(patient.entryDate)}</td>
                      <td className="mono-table-td text-zinc-400">
                        {patient.exitDate ? formatDate(patient.exitDate) : (patient.expectedExitDate ? `متوقع: ${formatDate(patient.expectedExitDate)}` : '-')}
                      </td>
                      <td className="mono-table-td font-bold text-white">{formatCurrency(patient.stayValue)}</td>
                      <td className="mono-table-td text-zinc-200">{formatCurrency(patient.paid)}</td>
                      <td className={`mono-table-td font-bold ${patient.remaining > 0 ? 'text-white' : 'text-zinc-500'}`}>
                        {formatCurrency(patient.remaining)}
                      </td>
                      <td className="mono-table-td">
                        <div className="space-y-0.5">
                          <div className={`font-bold font-mono text-sm ${
                            (patient.netRevenue ?? (patient.stayValue - (patient.expensesTotal || 0))) >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}>
                            {formatCurrency(patient.netRevenue ?? ((patient.stayValue || 0) - (patient.expensesTotal || 0)))}
                          </div>
                          {(patient.expensesTotal > 0) && (
                            <div className="text-[10px] text-zinc-500">
                              مصاريف: {formatCurrency(patient.expensesTotal)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="mono-table-td">{getStatusBadge(patient.status)}</td>
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
                })
              )}
            </tbody>
          </table>
        </div>
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
            {activePatient.status !== 'خرج' && activePatient.status !== 'discharged' ? (
              <button
                onClick={() => {
                  setOpenActionId(null);
                  setActivePatient(null);
                  setMenuPosition(null);
                  openModal('DISCHARGE_PATIENT', activePatient);
                }}
                className="w-full text-right px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span>تسجيل خروج النزيل</span>
              </button>
            ) : (
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
                <span>تجديد الإقامة (إعادة دخول)</span>
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
