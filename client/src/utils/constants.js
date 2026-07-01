export const ROLES = {
  ADMIN: 'admin',
  SECURITY: 'security',
  EMPLOYEE: 'employee',
  VISITOR: 'visitor',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  security: 'Security',
  employee: 'Employee',
  visitor: 'Visitor',
};

export const APPOINTMENT_STATUSES = ['pending', 'approved', 'rejected', 'completed'];

export const PASS_STATUSES = ['active', 'checked-in', 'checked-out', 'expired'];

export const STAFF_ROLES = ['admin', 'security', 'employee'];

export const STATUS_BADGE_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-slate-200 text-slate-700',
  active: 'bg-blue-100 text-blue-800',
  'checked-in': 'bg-emerald-100 text-emerald-800',
  'checked-out': 'bg-slate-200 text-slate-700',
  expired: 'bg-red-100 text-red-800',
  true: 'bg-red-100 text-red-800',
  false: 'bg-emerald-100 text-emerald-800',
};
