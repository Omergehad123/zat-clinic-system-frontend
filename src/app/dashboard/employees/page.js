'use client';

import { useState } from 'react';
import { useEmployees } from '../../../hooks/useEmployees';
import { useUIStore } from '../../../store/useUIStore';
import { UserCheck, Stethoscope, HeartHandshake, Shield, Wrench, Plus, Filter } from 'lucide-react';

export default function EmployeesPage() {
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data: employees, isLoading } = useEmployees(typeFilter);
  const openModal = useUIStore(s => s.openModal);

  // Resolve role display label from either Arabic (type) or English (role)
  const getTypeLabel = (emp) => {
    const t = emp.type || emp.role || '';
    if (t === 'دكتور' || t === 'doctor') return 'دكتور';
    if (t === 'تمريض' || t === 'nurse') return 'تمريض';
    if (t === 'مشرف' || t === 'supervisor') return 'مشرف';
    if (t === 'عامل' || t === 'worker') return 'عامل';
    return t || '-';
  };

  const getRoleIcon = (label) => {
    switch (label) {
      case 'دكتور': return <Stethoscope className="w-4 h-4 text-white" />;
      case 'تمريض': return <HeartHandshake className="w-4 h-4 text-zinc-300" />;
      case 'مشرف': return <Shield className="w-4 h-4 text-zinc-400" />;
      case 'عامل': return <Wrench className="w-4 h-4 text-zinc-500" />;
      default: return <UserCheck className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الكادر والموظفين</h1>
          <p className="text-sm text-zinc-400 mt-1">سجل الأطباء والتمريض والمشرفين والعمال المسجلين بفرع المصحة</p>
        </div>

        <button
          onClick={() => openModal('ADD_EMPLOYEE')}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إضافة موظف جديد
        </button>
      </div>

      {/* Role Filters */}
      <div className="mono-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الوظيفة:
          </span>

          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              typeFilter === 'ALL' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            كافة الوظائف ({employees?.length || 0})
          </button>

          <button
            onClick={() => setTypeFilter('دكتور')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              typeFilter === 'دكتور' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            الأطباء
          </button>

          <button
            onClick={() => setTypeFilter('تمريض')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              typeFilter === 'تمريض' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            التمريض
          </button>

          <button
            onClick={() => setTypeFilter('مشرف')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              typeFilter === 'مشرف' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            المشرفون
          </button>

          <button
            onClick={() => setTypeFilter('عامل')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              typeFilter === 'عامل' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            العمال
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="mono-table-th">الاسم</th>
                <th className="mono-table-th">الوظيفة</th>
                <th className="mono-table-th">التخصص</th>
                <th className="mono-table-th">الحالة</th>
                <th className="mono-table-th text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">جاري تحميل قائمة الموظفين...</td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-zinc-500">لا يوجد موظفون مضافون لهذه الوظيفة.</td>
                </tr>
              ) : (
                employees?.map(emp => {
                  const typeLabel = getTypeLabel(emp);
                  const statusLabel = emp.status === 'active' ? 'نشط' : (emp.status === 'inactive' ? 'معطل' : emp.status);
                  return (
                    <tr key={emp.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="mono-table-td font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            {getRoleIcon(typeLabel)}
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="mono-table-td">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
                          {typeLabel}
                        </span>
                      </td>
                      <td className="mono-table-td text-zinc-300 font-medium">
                        {typeLabel === 'دكتور' ? (emp.specialization || '-') : '-'}
                      </td>
                      <td className="mono-table-td">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white text-black">
                          {statusLabel}
                        </span>
                      </td>
                      <td className="mono-table-td text-center">
                        <span className="text-xs text-zinc-400">مسجل بالفرع</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
