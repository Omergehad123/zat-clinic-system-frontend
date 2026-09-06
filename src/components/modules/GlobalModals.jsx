'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useAddPatient, useAddPayment, useAddPatientExpense, useDischargePatient, useDeletePatient, useUpdatePatient } from '../../hooks/usePatients';
import { useAddEmployee } from '../../hooks/useEmployees';
import { useEmployees } from '../../hooks/useEmployees';
import { useAddAdvance } from '../../hooks/useAdvances';
import { useCreateInvoice, useUpdateInvoice } from '../../hooks/useInvoices';
import { useAddExpense } from '../../hooks/useFinance';
import { formatCurrency } from '../../utils/formatters';
import { X, Plus, Trash2, Calculator, LogOut, CheckCircle, AlertTriangle, Pencil, RotateCcw } from 'lucide-react';

export default function GlobalModals() {
  const { activeModal, modalData, closeModal } = useUIStore();

  const addPatientMutation = useAddPatient();
  const updatePatientMutation = useUpdatePatient();
  const addPaymentMutation = useAddPayment();
  const addPatientExpenseMutation = useAddPatientExpense();
  const dischargePatientMutation = useDischargePatient();
  const deletePatientMutation = useDeletePatient();
  const addEmployeeMutation = useAddEmployee();
  const addAdvanceMutation = useAddAdvance();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const addExpenseMutation = useAddExpense();

  const { data: employeesList } = useEmployees();

  // --- Form 1: Add Patient State ---
  const [patName, setPatName] = useState('');
  const [patEntryDate, setPatEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [patExpectedExit, setPatExpectedExit] = useState('');
  const [patStayValue, setPatStayValue] = useState('');
  const [patFirstPayment, setPatFirstPayment] = useState('');
  const [patInitialExpenses, setPatInitialExpenses] = useState('');
  const [patNotes, setPatNotes] = useState('');

  // Auto calculated values for Add Patient
  const calculatedPatRemaining = Math.max(0, (Number(patStayValue) || 0) - (Number(patFirstPayment) || 0));
  // صافي الإيرادات = قيمة الإقامة - المصاريف
  const calculatedNetRevenue = (Number(patStayValue) || 0) - (Number(patInitialExpenses) || 0);

  // --- Form 2: Add Employee State ---
  const [empType, setEmpType] = useState('دكتور');
  const [empName, setEmpName] = useState('');
  const [empSpec, setEmpSpec] = useState('');

  // --- Form 3: Add Advance State ---
  const [advEmpId, setAdvEmpId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advNotes, setAdvNotes] = useState('');

  // --- Form 4: Add Invoice State ---
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invCategory, setInvCategory] = useState('أكل');
  const [invNotes, setInvNotes] = useState('');
  const [invItems, setInvItems] = useState([
    { name: 'أكل وجبات', count: 10, price: 20 },
    { name: 'مياه معدنية', count: 5, price: 10 }
  ]);

  // Invoice dynamic sum calculation
  const calculatedInvoiceTotal = invItems.reduce(
    (sum, item) => sum + ((Number(item.count) || 0) * (Number(item.price) || 0)), 0
  );

  // --- Form 5: Add Payment State ---
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('كاش');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // --- Form 6: Patient Expense State ---
  const [pexDesc, setPexDesc] = useState('');
  const [pexCategory, setPexCategory] = useState('أدوية');
  const [pexAmount, setPexAmount] = useState('');
  const [pexDate, setPexDate] = useState(new Date().toISOString().split('T')[0]);
  const [pexNotes, setPexNotes] = useState('');

  // --- Form 7: Direct Expense State ---
  const [expCategory, setExpCategory] = useState('أكل');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Discharge state
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);

  // Renew Patient State
  const [renewEntryDate, setRenewEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewExpectedExit, setRenewExpectedExit] = useState('');
  const [renewStayValue, setRenewStayValue] = useState('');
  const [renewFirstPayment, setRenewFirstPayment] = useState('');
  const [renewExpenseDeposit, setRenewExpenseDeposit] = useState('');
  const [renewNotes, setRenewNotes] = useState('');

  // Reset/Prefill helper
  useEffect(() => {
    if (!activeModal) return;
    if (activeModal === 'ADD_PATIENT') {
      setPatName('');
      setPatStayValue('');
      setPatFirstPayment('');
      setPatInitialExpenses('');
      setPatNotes('');
    }
    if (activeModal === 'EDIT_PATIENT' && modalData) {
      setPatName(modalData.name || '');
      setPatEntryDate(
        modalData.entryDate
          ? new Date(modalData.entryDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPatExpectedExit(
        modalData.exitDate
          ? new Date(modalData.exitDate).toISOString().split('T')[0]
          : (modalData.expectedExitDate ? new Date(modalData.expectedExitDate).toISOString().split('T')[0] : '')
      );
      setPatStayValue(modalData.stayValue ?? modalData.accommodationAmount ?? '');
      setPatExpenseDeposit(modalData.expenseDeposit ?? modalData.expensesDeposit ?? '');
      setPatNotes(modalData.notes || '');
    }
    if (activeModal === 'RENEW_PATIENT' && modalData) {
      setRenewEntryDate(new Date().toISOString().split('T')[0]);
      setRenewExpectedExit('');
      setRenewStayValue(modalData.stayValue ?? modalData.accommodationAmount ?? '');
      setRenewFirstPayment('');
      setRenewExpenseDeposit('');
      setRenewNotes('');
    }
    if (activeModal === 'ADD_EMPLOYEE') {
      setEmpName('');
      setEmpSpec('');
    }
    if (activeModal === 'EDIT_INVOICE' && modalData) {
      setInvDate(modalData.date ? new Date(modalData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setInvCategory(modalData.category || 'أكل');
      setInvNotes(modalData.notes || '');
      setInvItems(
        modalData.items && modalData.items.length > 0
          ? modalData.items.map(i => ({
              name: i.name || i.itemName || '',
              count: i.count ?? i.quantity ?? 1,
              price: i.price ?? i.unitPrice ?? 0
            }))
          : [{ name: '', count: 1, price: 0 }]
      );
    }
  }, [activeModal, modalData]);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-fade-in my-8 text-right dir-rtl">
        
        {/* Close Button Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <h2 className="text-lg font-bold text-white">
            {activeModal === 'ADD_PATIENT' && 'إضافة نزيل جديد'}
            {activeModal === 'EDIT_PATIENT' && `تعديل بيانات النزيل: ${modalData?.name}`}
            {activeModal === 'RENEW_PATIENT' && `تجديد إقامة النزيل: ${modalData?.name}`}
            {activeModal === 'ADD_EMPLOYEE' && 'إضافة موظف جديد'}
            {activeModal === 'ADD_ADVANCE' && 'إضافة سلفة موظف'}
            {activeModal === 'ADD_INVOICE' && 'إضافة فاتورة مصروفات (أصناف)'}
            {activeModal === 'EDIT_INVOICE' && `تعديل فاتورة مصروفات #${modalData?.id?.slice(-6)}`}
            {activeModal === 'ADD_PAYMENT' && `إضافة دفعة سداد: ${modalData?.patientName}`}
            {activeModal === 'ADD_PATIENT_EXPENSE' && `إضافة مصروف نزيل: ${modalData?.patientName}`}
            {activeModal === 'ADD_EXPENSE' && 'إضافة مصروف مباشر بالفرع'}
            {activeModal === 'DISCHARGE_PATIENT' && `تسجيل خروج النزيل: ${modalData?.name}`}
            {activeModal === 'DELETE_PATIENT' && `تأكيد حذف النزيل: ${modalData?.name}`}
          </h2>
          <button
            onClick={closeModal}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Switch */}

        {/* 1. ADD PATIENT MODAL */}
        {activeModal === 'ADD_PATIENT' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPatientMutation.mutate({
                name: patName,
                entryDate: patEntryDate,
                expectedExitDate: patExpectedExit,
                accommodationAmount: Number(patStayValue),
                firstPayment: Number(patFirstPayment) || 0,
                initialExpenses: Number(patInitialExpenses) || 0,
                stayValue: patStayValue,
                notes: patNotes
              }, { onSuccess: closeModal });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم النزيل *</label>
              <input
                type="text"
                required
                value={patName}
                onChange={(e) => setPatName(e.target.value)}
                placeholder="الاسم الثلاثي أو الرباعي للنزيل"
                className="mono-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الدخول *</label>
                <input
                  type="date"
                  required
                  value={patEntryDate}
                  onChange={(e) => setPatEntryDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الخروج المتوقع</label>
                <input
                  type="date"
                  value={patExpectedExit}
                  onChange={(e) => setPatExpectedExit(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">قيمة الإقامة (جنيه) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={patStayValue}
                  onChange={(e) => setPatStayValue(e.target.value)}
                  placeholder="25000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الدفعة الأولى (جنيه)</label>
                <input
                  type="number"
                  min="0"
                  value={patFirstPayment}
                  onChange={(e) => setPatFirstPayment(e.target.value)}
                  placeholder="10000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
            </div>

            {/* Calculated Remaining Auto Display Box */}
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Calculator className="w-4 h-4 text-white" />
                <span>المبلغ المتبقي من الإقامة:</span>
              </div>
              <div className="text-base font-black text-white">
                {formatCurrency(calculatedPatRemaining)}
              </div>
            </div>

            {/* Initial Patient Expenses Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                مصاريف النزيل (جنيه)
              </label>
              <input
                type="number"
                min="0"
                value={patInitialExpenses}
                onChange={(e) => setPatInitialExpenses(e.target.value)}
                placeholder="مثال: 500 أو 2000"
                className="mono-input text-sm dir-ltr"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                المصاريف الشخصية للنزيل (أدوية، مستلزمات، إلخ) — تُخصم من قيمة الإقامة لحساب صافي الإيرادات
              </p>
            </div>

            {/* Net Revenue Preview */}
            {(Number(patStayValue) > 0 || Number(patInitialExpenses) > 0) && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                calculatedNetRevenue >= 0
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
              }`}>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="font-semibold">صافي الإيرادات المتوقع:</span>
                  <span className="text-zinc-500 text-[11px]">(قيمة الإقامة − المصاريف)</span>
                </div>
                <div className={`text-base font-black ${
                  calculatedNetRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(calculatedNetRevenue)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات</label>
              <textarea
                value={patNotes}
                onChange={(e) => setPatNotes(e.target.value)}
                placeholder="حالة النزيل، الطبيب المتابع، توصيات..."
                className="mono-input text-xs h-20"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={addPatientMutation.isPending} className="mono-btn-primary text-xs">
                {addPatientMutation.isPending ? 'جاري الحفظ...' : 'حفظ النزيل'}
              </button>
            </div>
          </form>
        )}

        {/* 1.5. EDIT PATIENT MODAL */}
        {activeModal === 'EDIT_PATIENT' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePatientMutation.mutate(
                {
                  id: modalData?.id || modalData?._id,
                  data: {
                    name: patName,
                    entryDate: patEntryDate,
                    expectedExitDate: patExpectedExit,
                    stayValue: patStayValue,
                    expenseDeposit: Number(patExpenseDeposit) || 0,
                    notes: patNotes
                  }
                },
                { onSuccess: closeModal }
              );
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم النزيل *</label>
              <input
                type="text"
                required
                value={patName}
                onChange={(e) => setPatName(e.target.value)}
                placeholder="الاسم الثلاثي أو الرباعي للنزيل"
                className="mono-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الدخول *</label>
                <input
                  type="date"
                  required
                  value={patEntryDate}
                  onChange={(e) => setPatEntryDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الخروج المتوقع</label>
                <input
                  type="date"
                  value={patExpectedExit}
                  onChange={(e) => setPatExpectedExit(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">قيمة الإقامة (جنيه) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={patStayValue}
                  onChange={(e) => setPatStayValue(e.target.value)}
                  placeholder="10000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">وديعة مصاريف النزيل (جنيه)</label>
                <input
                  type="number"
                  min="0"
                  value={patExpenseDeposit}
                  onChange={(e) => setPatExpenseDeposit(e.target.value)}
                  placeholder="1000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات الإقامة والملف الطبي/الإداري</label>
              <textarea
                rows="3"
                value={patNotes}
                onChange={(e) => setPatNotes(e.target.value)}
                placeholder="أي تفاصيل خاصة بالحالة أو شروط الإقامة..."
                className="mono-input text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={updatePatientMutation.isPending} className="mono-btn-primary text-xs">
                {updatePatientMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        )}

        {/* 1.6. RENEW PATIENT MODAL */}
        {activeModal === 'RENEW_PATIENT' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const patientId = modalData?.id || modalData?._id;
              updatePatientMutation.mutate(
                {
                  id: patientId,
                  data: {
                    status: 'current',
                    entryDate: renewEntryDate,
                    exitDate: renewExpectedExit || null,
                    accommodationAmount: Number(renewStayValue) || 0,
                    expenseDeposit: renewExpenseDeposit !== '' ? Number(renewExpenseDeposit) : (modalData?.expenseDeposit || 0),
                    notes: renewNotes
                      ? `${modalData?.notes || ''}\n[تجديد إقامة بتاريخ ${renewEntryDate}]: ${renewNotes}`
                      : (modalData?.notes || '')
                  }
                },
                {
                  onSuccess: () => {
                    if (Number(renewFirstPayment) > 0) {
                      addPaymentMutation.mutate({
                        patientId,
                        amount: Number(renewFirstPayment),
                        paymentMethod: 'كاش',
                        date: renewEntryDate,
                        notes: 'دفعة أولى عند تجديد الإقامة'
                      });
                    }
                    closeModal();
                  }
                }
              );
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم النزيل</label>
              <input
                type="text"
                disabled
                value={modalData?.name || ''}
                className="mono-input text-sm opacity-70 bg-zinc-950 text-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الدخول الجديد *</label>
                <input
                  type="date"
                  required
                  value={renewEntryDate}
                  onChange={(e) => setRenewEntryDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الخروج المتوقع</label>
                <input
                  type="date"
                  value={renewExpectedExit}
                  onChange={(e) => setRenewExpectedExit(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">قيمة الإقامة (جنيه) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={renewStayValue}
                  onChange={(e) => setRenewStayValue(e.target.value)}
                  placeholder="10000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">دفعة أولى (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  value={renewFirstPayment}
                  onChange={(e) => setRenewFirstPayment(e.target.value)}
                  placeholder="0"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">وديعة مصاريف (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  value={renewExpenseDeposit}
                  onChange={(e) => setRenewExpenseDeposit(e.target.value)}
                  placeholder="0"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات التجديد</label>
              <textarea
                rows="3"
                value={renewNotes}
                onChange={(e) => setRenewNotes(e.target.value)}
                placeholder="سبب التجديد أو ملاحظات الاتفاق الجديد..."
                className="mono-input text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={updatePatientMutation.isPending} className="mono-btn-primary text-xs flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                {updatePatientMutation.isPending ? 'جاري التجديد...' : 'تأكيد تجديد الإقامة'}
              </button>
            </div>
          </form>
        )}

        {/* 2. ADD EMPLOYEE MODAL */}
        {activeModal === 'ADD_EMPLOYEE' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addEmployeeMutation.mutate({
                name: empName,
                type: empType,
                role: empType === 'دكتور' ? 'doctor' : (empType === 'تمريض' ? 'nurse' : (empType === 'مشرف' ? 'supervisor' : 'worker')),
                specialization: empSpec
              }, { onSuccess: closeModal });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الوظيفة *</label>
              <select
                value={empType}
                onChange={(e) => setEmpType(e.target.value)}
                className="mono-input text-sm"
              >
                <option value="دكتور">دكتور</option>
                <option value="تمريض">تمريض</option>
                <option value="مشرف">مشرف</option>
                <option value="عامل">عامل</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم الموظف *</label>
              <input
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="الاسم الكامل"
                className="mono-input text-sm"
              />
            </div>

            {empType === 'دكتور' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التخصص (اختياري)</label>
                <input
                  type="text"
                  value={empSpec}
                  onChange={(e) => setEmpSpec(e.target.value)}
                  placeholder="مثال: أمراض باطنة، مخ وأعصاب، علاج طبيعي"
                  className="mono-input text-sm"
                />
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={addEmployeeMutation.isPending} className="mono-btn-primary text-xs">
                {addEmployeeMutation.isPending ? 'جاري الحفظ...' : 'حفظ الموظف'}
              </button>
            </div>
          </form>
        )}

        {/* 3. ADD ADVANCE MODAL */}
        {activeModal === 'ADD_ADVANCE' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addAdvanceMutation.mutate({
                employeeId: advEmpId,
                amount: advAmount,
                date: advDate,
                notes: advNotes
              }, { onSuccess: closeModal });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اختر الموظف *</label>
              <select
                required
                value={advEmpId}
                onChange={(e) => setAdvEmpId(e.target.value)}
                className="mono-input text-sm"
              >
                <option value="">-- اختر الموظف --</option>
                {employeesList?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">مبلغ السلفة (جنيه) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="1000"
                  className="mono-input text-sm dir-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات</label>
              <input
                type="text"
                value={advNotes}
                onChange={(e) => setAdvNotes(e.target.value)}
                placeholder="سبب السلفة..."
                className="mono-input text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={addAdvanceMutation.isPending} className="mono-btn-primary text-xs">
                {addAdvanceMutation.isPending ? 'جاري الحفظ...' : 'حفظ السلفة'}
              </button>
            </div>
          </form>
        )}

        {/* 4. ADD / EDIT EXPENSE INVOICE MODAL */}
        {(activeModal === 'ADD_INVOICE' || activeModal === 'EDIT_INVOICE') && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const payload = {
                date: invDate,
                category: invCategory,
                notes: invNotes,
                items: invItems
              };

              if (activeModal === 'EDIT_INVOICE') {
                updateInvoiceMutation.mutate({
                  id: modalData.id,
                  data: payload
                }, {
                  onSuccess: closeModal
                });
              } else {
                createInvoiceMutation.mutate(payload, {
                  onSuccess: () => {
                    setInvNotes('');
                    setInvItems([{ name: '', count: 1, price: 0 }]);
                    closeModal();
                  }
                });
              }
            }}
            className="space-y-4 max-h-[80vh] overflow-y-auto pl-1"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التصنيف الرئيسي *</label>
                <select
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="mono-input text-sm"
                >
                  <option value="أكل">أكل</option>
                  <option value="أدوية">أدوية</option>
                  <option value="مرافق">مرافق</option>
                  <option value="صيانة">صيانة</option>
                  <option value="مستلزمات">مستلزمات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>

            {/* Dynamic Items Builder */}
            <div className="space-y-3 border-t border-b border-zinc-800 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">جدول أصناف الفاتورة:</span>
                <button
                  type="button"
                  onClick={() => setInvItems([...invItems, { name: '', count: 1, price: 0 }])}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + صنف جديد
                </button>
              </div>

              {invItems.map((item, index) => {
                const itemSubTotal = (Number(item.count) || 0) * (Number(item.price) || 0);
                return (
                  <div key={index} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        required
                        placeholder="اسم الصنف (مثال: أكل وجبات)"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...invItems];
                          updated[index].name = e.target.value;
                          setInvItems(updated);
                        }}
                        className="mono-input text-xs flex-1"
                      />
                      {invItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setInvItems(invItems.filter((_, i) => i !== index))}
                          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center text-xs">
                      <div>
                        <span className="text-zinc-500 block mb-0.5">العدد</span>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.count}
                          onChange={(e) => {
                            const updated = [...invItems];
                            updated[index].count = e.target.value;
                            setInvItems(updated);
                          }}
                          className="mono-input text-xs text-center dir-ltr"
                        />
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">السعر</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.price}
                          onChange={(e) => {
                            const updated = [...invItems];
                            updated[index].price = e.target.value;
                            setInvItems(updated);
                          }}
                          className="mono-input text-xs text-center dir-ltr"
                        />
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">الإجمالي</span>
                        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center font-bold text-white">
                          {itemSubTotal} ج
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculated Grand Total */}
            <div className="p-3 bg-white text-black rounded-xl flex items-center justify-between font-extrabold">
              <span>إجمالي الفاتورة النهائي:</span>
              <span className="text-lg">{formatCurrency(calculatedInvoiceTotal)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات الفاتورة</label>
              <input
                type="text"
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
                placeholder="بيان الفاتورة..."
                className="mono-input text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                className="mono-btn-primary text-xs"
              >
                {activeModal === 'EDIT_INVOICE'
                  ? (updateInvoiceMutation.isPending ? 'جاري التعديل...' : 'حفظ التعديلات')
                  : (createInvoiceMutation.isPending ? 'جاري الحفظ...' : 'إصدار الفاتورة')}
              </button>
            </div>
          </form>
        )}

        {/* 5. ADD PAYMENT MODAL */}
        {activeModal === 'ADD_PAYMENT' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPaymentMutation.mutate({
                patientId: modalData?.patientId,
                amount: payAmount,
                method: payMethod,
                date: payDate,
                notes: payNotes
              }, { onSuccess: closeModal });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">المبلغ (جنيه) *</label>
              <input
                type="number"
                required
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="5000"
                className="mono-input text-sm dir-ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">طريقة الدفع *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mono-input text-sm"
                >
                  <option value="كاش">كاش</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="فيزا">فيزا / كارت</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الدفع *</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ملاحظات</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="الدفعة الثانية..."
                className="mono-input text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={addPaymentMutation.isPending} className="mono-btn-primary text-xs">
                {addPaymentMutation.isPending ? 'جاري التسجيل...' : 'حفظ الدفعة'}
              </button>
            </div>
          </form>
        )}

        {/* 6. ADD PATIENT EXPENSE MODAL */}
        {activeModal === 'ADD_PATIENT_EXPENSE' && (() => {
          const deposit = Number(modalData?.expenseDeposit || modalData?.expensesDeposit || 0);
          const totalSpent = Number(modalData?.expensesTotal || modalData?.totalExpenses || 0);
          const currentRemaining = deposit - totalSpent;
          const remainingAfter = currentRemaining - (Number(pexAmount) || 0);

          return (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPatientExpenseMutation.mutate({
                  patientId: modalData?.patientId || modalData?.id || modalData?._id,
                  description: pexDesc,
                  category: pexCategory,
                  amount: Number(pexAmount),
                  date: pexDate,
                  notes: pexNotes
                }, { onSuccess: closeModal });
              }}
              className="space-y-4"
            >
              {/* Patient info & Expense Balance Card */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">اسم النزيل:</span>
                  <span className="font-bold text-white">{modalData?.patientName || modalData?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">وديعة المصاريف:</span>
                    <span className="font-bold text-white font-mono">{formatCurrency(deposit)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">المنصرف حتى الآن:</span>
                    <span className="font-bold text-amber-400 font-mono">{formatCurrency(totalSpent)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-900">
                  <span className="text-zinc-300 font-semibold">الرصيد المتبقي الحالي:</span>
                  <span className={`font-black font-mono text-sm ${currentRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(currentRemaining)}
                  </span>
                </div>

                {Number(pexAmount) > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80 bg-zinc-900/50 p-2 rounded-lg">
                    <span className="text-white font-bold">المتبقي بعد هذا المصروف:</span>
                    <span className={`font-black font-mono text-sm ${remainingAfter >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(remainingAfter)}
                      {remainingAfter < 0 && ' (تجاوز الوديعة)'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  value={pexDesc}
                  onChange={(e) => setPexDesc(e.target.value)}
                  placeholder="شراء علاج خاص، تحاليل طبية، طلبات كافتيريا..."
                  className="mono-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التصنيف *</label>
                  <select
                    value={pexCategory}
                    onChange={(e) => setPexCategory(e.target.value)}
                    className="mono-input text-sm"
                  >
                    <option value="أدوية">أدوية</option>
                    <option value="مستلزمات">مستلزمات</option>
                    <option value="تحاليل وأشعة">تحاليل وأشعة</option>
                    <option value="كافتيريا ومشتريات">كافتيريا ومشتريات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">المبلغ (جنيه) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pexAmount}
                    onChange={(e) => setPexAmount(e.target.value)}
                    placeholder="500"
                    className="mono-input text-sm dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={pexDate}
                  onChange={(e) => setPexDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
                <button type="submit" disabled={addPatientExpenseMutation.isPending} className="mono-btn-primary text-xs">
                  {addPatientExpenseMutation.isPending ? 'جاري التسجيل...' : 'تسجيل وخصم المصروف'}
                </button>
              </div>
            </form>
          );
        })()}

        {/* 7. ADD DIRECT EXPENSE MODAL */}
        {activeModal === 'ADD_EXPENSE' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addExpenseMutation.mutate({
                category: expCategory,
                description: expDesc,
                amount: expAmount,
                date: expDate
              }, { onSuccess: closeModal });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التصنيف *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="mono-input text-sm"
              >
                <option value="أكل">أكل</option>
                <option value="أدوية">أدوية</option>
                <option value="مرافق">مرافق (كهرباء، مياه)</option>
                <option value="صيانة">صيانة</option>
                <option value="مستلزمات">مستلزمات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">البيان والتفاصيل *</label>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="مثال: فاتورة كهرباء الفرع"
                className="mono-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">المبلغ (جنيه) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="2500"
                  className="mono-input text-sm dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="mono-input text-xs dir-ltr"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button type="submit" disabled={addExpenseMutation.isPending} className="mono-btn-primary text-xs">
                {addExpenseMutation.isPending ? 'جاري التسجيل...' : 'حفظ المصروف'}
              </button>
            </div>
          </form>
        )}

        {/* 8. DISCHARGE PATIENT CONFIRMATION MODAL */}
        {activeModal === 'DISCHARGE_PATIENT' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              هل أنت تأكيد من تسوية وتسجيل خروج النزيل <strong className="text-white">{modalData?.name}</strong>؟
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">تاريخ الخروج *</label>
              <input
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                className="mono-input text-xs dir-ltr"
              />
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 space-y-1">
              <div>المبلغ المتبقي غير المسدد: <strong className="text-white">{formatCurrency(modalData?.remaining)}</strong></div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button
                type="button"
                disabled={dischargePatientMutation.isPending}
                onClick={() => {
                  dischargePatientMutation.mutate({
                    patientId: modalData?.id,
                    exitDate: dischargeDate
                  }, { onSuccess: closeModal });
                }}
                className="mono-btn-danger text-xs"
              >
                {dischargePatientMutation.isPending ? 'جاري التنفيذ...' : 'تأكيد تسجيل الخروج'}
              </button>
            </div>
          </div>
        )}

        {/* 9. DELETE PATIENT CONFIRMATION MODAL */}
        {activeModal === 'DELETE_PATIENT' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-1 text-sm">تحذير حذف نهائي!</strong>
                هل أنت متأكد من حذف النزيل <strong className="text-white">{modalData?.name}</strong> نهائياً من النظام؟ سيتم مسح السجل وجميع الدفعات والمصروفات المرتبطة به.
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="mono-btn-secondary text-xs">إلغاء</button>
              <button
                type="button"
                disabled={deletePatientMutation.isPending}
                onClick={() => {
                  deletePatientMutation.mutate(modalData?.id || modalData?._id, { onSuccess: closeModal });
                }}
                className="mono-btn-danger text-xs"
              >
                {deletePatientMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
