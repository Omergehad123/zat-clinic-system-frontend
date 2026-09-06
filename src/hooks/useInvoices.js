import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '../services/invoices.service';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const useInvoices = (filters = {}) => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  const queryFilters = { branchId, ...filters };

  return useQuery({
    queryKey: ['invoices', queryFilters],
    queryFn: () => invoicesService.getInvoices(queryFilters)
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);
  const branchId = user?.branchId || branch?._id || branch?.id;

  return useMutation({
    mutationFn: (data) => invoicesService.createInvoice({ ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('تم إشعار وحفظ فاتورة المصروفات بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء حفظ الفاتورة', 'error');
    }
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: ({ id, data }) => invoicesService.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('تم تعديل الفاتورة بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء تعديل الفاتورة', 'error');
    }
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: (id) => invoicesService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('تم حذف الفاتورة بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء حذف الفاتورة', 'error');
    }
  });
};
