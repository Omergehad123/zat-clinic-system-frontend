import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService } from '../services/patients.service';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const usePatients = (search = '', statusFilter = 'ALL') => {
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const branchId = user?.branchId || branch?._id || branch?.id || 'all';

  return useQuery({
    queryKey: ['patients', branchId, search, statusFilter],
    queryFn: () => patientsService.getPatients(branchId, search, statusFilter)
  });
};

export const usePatientDetails = (patientId) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsService.getPatientById(patientId),
    enabled: !!patientId
  });
};

export const useAddPatient = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const showToast = useUIStore(s => s.showToast);
  const branchId = user?.branchId || branch?._id || branch?.id;

  return useMutation({
    mutationFn: (data) => patientsService.addPatient(data, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      showToast('تمت إضافة النزيل الجديد بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء إضافة النزيل', 'error');
    }
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: (data) => patientsService.addPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      showToast('تم إضافة الدفعة بنجاح', 'success');
    }
  });
};

export const useAddPatientExpense = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: (data) => patientsService.addPatientExpense(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      showToast('تم إضافة مصروف النزيل بنجاح', 'success');
    }
  });
};

export const useDischargePatient = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: ({ patientId, exitDate }) => patientsService.dischargePatient(patientId, exitDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('تم تسجيل خروج النزيل بنجاح', 'success');
    }
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore(s => s.showToast);

  return useMutation({
    mutationFn: (patientId) => patientsService.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      showToast('تم حذف النزيل نهائياً بنجاح', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'حدث خطأ أثناء حذف النزيل', 'error');
    }
  });
};
