import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '../services/employees.service';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const useEmployees = (typeFilter = 'ALL') => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['employees', branchId, typeFilter],
    queryFn: () => employeesService.getEmployees(branchId, typeFilter)
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);
  const branchId = user?.branchId || branch?._id || branch?.id;

  return useMutation({
    mutationFn: (data) => employeesService.addEmployee({ ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      showToast('تمت إضافة الموظف بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء إضافة الموظف', 'error');
    }
  });
};
