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

    // ─── Optimistic update: patch the cache instantly, no waiting ───────────
    onMutate: async ({ employeeId, day, status, month, year }) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey: ['attendance'] });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueriesData({ queryKey: ['attendance'] });

      // Optimistically update every matching cache entry
      queryClient.setQueriesData({ queryKey: ['attendance'] }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;

        return oldData.map((row) => {
          const rowEmpId = (row.employee?.id || row.employee?._id)?.toString();
          if (rowEmpId !== employeeId?.toString()) return row;

          // Clone attendance map and apply the new status
          const newAttendance = { ...row.attendance };
          if (!status) {
            delete newAttendance[day];
          } else {
            newAttendance[day] = status;
          }

          // Recalculate stats from the updated attendance map
          const vals = Object.values(newAttendance);
          const newStats = {
            present: vals.filter((s) => s === 'حاضر').length,
            absent:  vals.filter((s) => s === 'غائب').length,
            leave:   vals.filter((s) => s === 'إجازة').length,
          };

          return { ...row, attendance: newAttendance, stats: newStats };
        });
      });

      // Return snapshot so onError can roll back
      return { previousData };
    },

    // ─── Rollback on failure ─────────────────────────────────────────────────
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // ─── Sync with server once after mutation settles ────────────────────────
    onSettled: (_data, _err, { month, year }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
