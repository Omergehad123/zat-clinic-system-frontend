import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancesService } from '../services/advances.service';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const useAdvances = (search = '', roleFilter = 'ALL', dateFilter = '') => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['advances', branchId, search, roleFilter, dateFilter],
    queryFn: () => advancesService.getAdvances(branchId, search, roleFilter, dateFilter)
  });
};

export const useAddAdvance = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);
  const branchId = user?.branchId || branch?._id || branch?.id;

  return useMutation({
    mutationFn: (data) => advancesService.addAdvance({ ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      showToast('تم تسجيل السلفة بنجاح', 'success');
    }
  });
};
