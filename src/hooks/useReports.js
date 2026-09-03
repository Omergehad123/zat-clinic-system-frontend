import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';
import { useAuthStore } from '../store/useAuthStore';

export const useReports = (month = 9, year = 2026) => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['reports', branchId, month, year],
    queryFn: () => reportsService.getMonthlyReport(branchId, month, year)
  });
};
