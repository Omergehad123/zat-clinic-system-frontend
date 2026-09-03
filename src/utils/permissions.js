export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_MANAGER: 'branch_manager',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  SUPERVISOR: 'supervisor',
  WORKER: 'worker'
};

export const ROLE_LABELS = {
  super_admin: 'مدير النظام',
  branch_manager: 'مدير فرع',
  receptionist: 'استقبال',
  accountant: 'محاسب',
  doctor: 'دكتور',
  nurse: 'تمريض',
  supervisor: 'مشرف',
  worker: 'عامل'
};

export const NAVIGATION_PERMISSIONS = {
  dashboard: ['super_admin', 'branch_manager', 'receptionist', 'accountant', 'doctor', 'nurse', 'supervisor'],
  branches: ['super_admin'],
  users: ['super_admin', 'branch_manager'],
  patients: ['super_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse'],
  employees: ['super_admin', 'branch_manager'],
  attendance: ['super_admin', 'branch_manager', 'receptionist', 'supervisor'],
  advances: ['super_admin', 'branch_manager', 'accountant'],
  finance: ['super_admin', 'branch_manager', 'accountant'],
  invoices: ['super_admin', 'branch_manager', 'accountant'],
  reports: ['super_admin', 'branch_manager', 'accountant'],
  'audit-logs': ['super_admin']
};

export const hasRole = (user, allowedRoles = []) => {
  if (!user || !user.role) return false;
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
};

export const hasPermission = (user, permissionKey) => {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.BRANCH_MANAGER) return true;
  if (!user.permissions) return false;
  return !!user.permissions[permissionKey];
};
