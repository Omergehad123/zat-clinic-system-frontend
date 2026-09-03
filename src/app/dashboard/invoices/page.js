'use client';

import { useInvoices, useDeleteInvoice } from '../../../hooks/useInvoices';
import { useUIStore } from '../../../store/useUIStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { FileText, Plus, ShoppingBag, Edit, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const deleteInvoiceMutation = useDeleteInvoice();
  const openModal = useUIStore(s => s.openModal);

  const handleDelete = (invId) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذه الفاتورة؟')) {
      deleteInvoiceMutation.mutate(invId);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">فواتير المصروفات والمشتريات</h1>
          <p className="text-sm text-zinc-400 mt-1">إنشاء فواتير الأصناف المجمعة مع الحساب الآلي للإجمالي بالمصحة</p>
        </div>

        <button
          onClick={() => openModal('ADD_INVOICE')}
          className="mono-btn-primary text-sm shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + إضافة فاتورة مصروفات
        </button>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500">جاري تحميل فواتير المصروفات...</div>
        ) : invoices?.length === 0 ? (
          <div className="mono-card p-12 text-center text-zinc-500">
            لا توجد فواتير مصروفات مسجلة بالفرع حتى الآن.
          </div>
        ) : (
          invoices?.map(inv => (
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
