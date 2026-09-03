import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesService } from '../services/branches.service';
import { usersService } from '../services/users.service';
import { auditLogsService } from '../services/auditLogs.service';
import { financeService } from '../services/finance.service';
import { reportsService } from '../services/reports.service';
import { patientsService } from '../services/patients.service';
import { employeesService } from '../services/employees.service';
import { invoicesService } from '../services/invoices.service';
import { advancesService } from '../services/advances.service';

// --- Branches Hooks ---
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getBranches()
  });
};

export const useBranchDetails = (branchId) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchesService.getBranchById(branchId),
    enabled: !!branchId && branchId !== 'all'
  });
};

export const useBranchPerformance = (filters = {}) => {
  return useQuery({
    queryKey: ['branchPerformance', filters],
    queryFn: () => branchesService.getBranchPerformance(filters)
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchData, managerData }) => branchesService.createBranch(branchData, managerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branchPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branchManagers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchData }) => branchesService.updateBranch(id, branchData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
      queryClient.invalidateQueries({ queryKey: ['branchPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => branchesService.toggleBranchStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branchPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

// --- Users Hooks ---
export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersService.getUsers(filters)
  });
};

export const useBranchManagers = () => {
  return useQuery({
    queryKey: ['branchManagers'],
    queryFn: () => usersService.getBranchManagers()
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branchManagers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }) => usersService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branchManagers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => usersService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branchManagers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }) => usersService.resetPassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
};

// --- Financial Analytics Hooks ---
export const useFinancialAnalytics = (branchId = 'all', filters = {}) => {
  return useQuery({
    queryKey: ['financialAnalytics', branchId, filters],
    queryFn: () => financeService.getFinanceData(branchId, filters)
  });
};

// --- Patients & Analytics Hooks ---
export const usePatients = (branchId = 'all', search = '', status = 'ALL') => {
  return useQuery({
    queryKey: ['patients', branchId, search, status],
    queryFn: () => patientsService.getPatients(branchId, search, status)
  });
};

export const usePatientDetails = (id) => {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getPatientById(id),
    enabled: !!id
  });
};

// --- Employees & Analytics Hooks ---
export const useEmployees = (branchId = 'all', type = 'ALL') => {
  return useQuery({
    queryKey: ['employees', branchId, type],
    queryFn: () => employeesService.getEmployees(branchId, type)
  });
};

export const useEmployeeAnalytics = (branchId = 'all') => {
  return useQuery({
    queryKey: ['employeeAnalytics', branchId],
    queryFn: () => employeesService.getEmployeeAnalytics(branchId)
  });
};

// --- Reports & Invoices Hooks ---
export const useMonthlyReport = (branchId = 'all', month = 9, year = 2026) => {
  return useQuery({
    queryKey: ['monthlyReport', branchId, month, year],
    queryFn: () => reportsService.getMonthlyReport(branchId, month, year)
  });
};

export const useOutstandingPayments = (branchId = 'all') => {
  return useQuery({
    queryKey: ['outstandingPayments', branchId],
    queryFn: () => reportsService.getOutstandingPaymentsReport(branchId)
  });
};

export const useInvoices = (branchId = 'all', filters = {}) => {
  return useQuery({
    queryKey: ['invoices', branchId, filters],
    queryFn: () => invoicesService.getInvoices(branchId, filters)
  });
};

export const useAdvances = (branchId = 'all', search = '', role = 'ALL', date = '') => {
  return useQuery({
    queryKey: ['advances', branchId, search, role, date],
    queryFn: () => advancesService.getAdvances(branchId, search, role, date)
  });
};

// --- Audit Logs Hooks ---
export const useAuditLogs = (filters = {}) => {
  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditLogsService.getAuditLogs(filters)
  });
};
