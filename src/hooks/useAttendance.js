import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance.service';
import { useAuthStore } from '../store/useAuthStore';

export const useAttendance = (month = 9, year = 2026, typeFilter = 'ALL') => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['attendance', branchId, month, year, typeFilter],
    queryFn: () => attendanceService.getAttendance(branchId, month, year, typeFilter)
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, day, status, month, year }) =>
      attendanceService.updateAttendance(employeeId, day, status, month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
};
