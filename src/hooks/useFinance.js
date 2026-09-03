import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const useFinance = () => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['finance', branchId],
    queryFn: () => financeService.getFinanceData(branchId)
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);
  const branchId = user?.branchId || branch?._id || branch?.id;

  return useMutation({
    mutationFn: (data) => financeService.addExpense({ ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('تم تسجيل المصروف بنجاح', 'success');
    }
  });
};
