'use client';

import { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id;

  const [activeTab, setActiveTab] = useState('PAYMENTS'); // 'PAYMENTS' | 'EXPENSES' | 'FINANCIAL_LOG'

  const { data: patient, isLoading } = usePatientDetails(patientId);
  const openModal = useUIStore(s => s.openModal);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500">
        جاري تحميل تفاصيل بيانات النزيل والسجل المالي...
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
      id: p.id,
      date: p.date,
      amount: p.amount,
      details: `طريقة الدفع: ${p.method}`,
      notes: p.notes,
      isIncome: true
    })),
    ...(patient.expenses || []).map(e => ({
      type: 'مصروف نزيل',
      id: e.id,
      date: e.date,
      amount: e.amount,
      details: `التصنيف: ${e.category} | ${e.description}`,
      notes: e.notes,
      isIncome: false
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-8 pb-12">

      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button
          onClick={() => router.push('/dashboard/patients')}
          className="mono-btn-secondary text-xs"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى النزلاء
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('EDIT_PATIENT', patient)}
            className="mono-btn-secondary text-xs"
          >
            <Pencil className="w-4 h-4" />
            تعديل البيانات
          </button>
          {patient.status !== 'خرج' && patient.status !== 'discharged' ? (
            <button
              onClick={() => openModal('DISCHARGE_PATIENT', patient)}
              className="mono-btn-danger text-xs"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج النزيل
            </button>
          ) : (
            <button
              onClick={() => openModal('RENEW_PATIENT', patient)}
              className="mono-btn-primary text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              تجديد الإقامة
            </button>
          )}
          <button
            onClick={() => openModal('ADD_PAYMENT', { patientId: patient.id, patientName: patient.name })}
            className="mono-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            إضافة دفعة سداد
          </button>
        </div>
      </div>

      {/* Patient Profile Card & General Info */}
      <div className="mono-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        
        {/* Info Col 1 */}
        <div className="flex items-center gap-4 md:border-l md:border-zinc-800 md:pl-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shrink-0 font-bold text-xl">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{patient.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                patient.status === 'حالي' ? 'bg-white text-black' : (patient.status === 'جديد' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')
              }`}>
                {patient.status}
              </span>
              <span className="text-xs text-zinc-400">كود: #{patient.id}</span>
            </div>
          </div>
        </div>

        {/* Dates Info */}
        <div className="space-y-1 text-sm text-zinc-300 md:border-l md:border-zinc-800 md:pl-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">تاريخ الدخول:</span>
            <span className="font-semibold text-white">{formatDate(patient.entryDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">تاريخ الخروج:</span>
            <span className="font-semibold text-white">
              {patient.exitDate ? formatDate(patient.exitDate) : (patient.expectedExitDate ? `متوقع (${formatDate(patient.expectedExitDate)})` : 'مفتوح')}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2 text-sm text-zinc-300">
          <span className="text-xs font-semibold text-zinc-400 block mb-1">ملاحظات الإقامة:</span>
          <p className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-200">
            {patient.notes || 'لا توجد ملاحظات إضافية على النزيل'}
          </p>
        </div>

      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">قيمة الإقامة الكلية</span>
          <div className="text-xl font-black text-white mt-1.5">
            {formatCurrency(patient.stayValue)}
          </div>
        </div>

        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">المدفوع من الإقامة</span>
          <div className="text-xl font-black text-emerald-400 mt-1.5">
            {formatCurrency(patient.paid)}
          </div>
        </div>

        <div className="mono-card p-4 border-zinc-700">
          <span className="text-xs font-semibold text-zinc-400">المتبقي من الإقامة</span>
          <div className="text-xl font-black text-white mt-1.5">
            {formatCurrency(patient.remaining)}
          </div>
        </div>

        <div className="mono-card p-4">
          <span className="text-xs font-semibold text-zinc-400">صافي الإيرادات</span>
          <div className="text-[10px] text-zinc-500 mt-0.5">قيمة الإقامة − المصاريف</div>
          <div className={`text-xl font-black mt-1.5 ${
            (patient.netRevenue ?? ((patient.stayValue || 0) - (patient.expensesTotal || 0))) >= 0
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}>
            {formatCurrency(patient.netRevenue ?? ((patient.stayValue || 0) - (patient.expensesTotal || 0)))}
          </div>
        </div>

      </div>

      {/* Detail Tabs Header */}
      <div className="border-b border-zinc-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'PAYMENTS' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          سجل المدفوعات ({patient.payments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'EXPENSES' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          مصاريف النزيل ({patient.expenses?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('FINANCIAL_LOG')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'FINANCIAL_LOG' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          السجل المالي الشامل
        </button>
      </div>

      {/* Tab 1: سجل المدفوعات */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">دفوعات سداد الإقامة</h3>
            <button
              onClick={() => openModal('ADD_PAYMENT', { patientId: patient.id, patientName: patient.name })}
              className="mono-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + إضافة دفعة جديد
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
                      <tr key={pay.id} className="hover:bg-zinc-900/60">
                        <td className="mono-table-td text-zinc-300">{formatDate(pay.date)}</td>
                        <td className="mono-table-td font-bold text-white">{formatCurrency(pay.amount)}</td>
                        <td className="mono-table-td">
                          <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
                            {pay.method}
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
              <span className="text-lg font-black text-white font-mono">{formatCurrency(patient.stayValue || 0)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">إجمالي المصاريف:</span>
              <span className="text-lg font-black text-amber-400 font-mono">{formatCurrency(patient.expensesTotal || 0)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">صافي الإيرادات:</span>
              <span className={`text-lg font-black font-mono ${
                (patient.netRevenue ?? ((patient.stayValue || 0) - (patient.expensesTotal || 0))) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}>
                {formatCurrency(patient.netRevenue ?? ((patient.stayValue || 0) - (patient.expensesTotal || 0)))}
              </span>
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
                      <tr key={exp.id} className="hover:bg-zinc-900/60">
                        <td className="mono-table-td text-zinc-300">{formatDate(exp.date)}</td>
                        <td className="mono-table-td font-medium text-white">{exp.description}</td>
                        <td className="mono-table-td">
                          <span className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="mono-table-td font-bold text-white">{formatCurrency(exp.amount)}</td>
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
              combinedLog.map(item => (
                <div key={item.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
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
                    <div className="font-black text-white text-base">{formatCurrency(item.amount)}</div>
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
