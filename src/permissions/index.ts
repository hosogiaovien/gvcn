import { Role, UserProfile } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên (Admin)',
  HIEU_TRUONG: 'Hiệu trưởng',
  PHO_HIEU_TRUONG: 'Phó Hiệu trưởng',
  TONG_PHU_TRACH: 'Tổng phụ trách',
  GIAM_THI: 'Giám thị',
  GVCN: 'Giáo viên chủ nhiệm (GVCN)',
  TO_TRUONG: 'Tổ trưởng',
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200',
  HIEU_TRUONG: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PHO_HIEU_TRUONG: 'bg-purple-100 text-purple-800 border-purple-200',
  TONG_PHU_TRACH: 'bg-amber-100 text-amber-800 border-amber-200',
  GIAM_THI: 'bg-orange-100 text-orange-800 border-orange-200',
  GVCN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  TO_TRUONG: 'bg-sky-100 text-sky-800 border-sky-200',
};

export function canViewAllSchool(role?: Role): boolean {
  if (!role) return false;
  return ['ADMIN', 'HIEU_TRUONG', 'PHO_HIEU_TRUONG', 'TONG_PHU_TRACH', 'GIAM_THI'].includes(role);
}

export function canManageUsers(role?: Role): boolean {
  return role === 'ADMIN';
}

export function canManageClasses(role?: Role): boolean {
  return role === 'ADMIN';
}

export function canEditClass(user?: UserProfile | null, classId?: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canManageStudents(user?: UserProfile | null, classId?: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canScoreForStudent(
  user?: UserProfile | null,
  studentClassId?: string,
  studentGroupId?: string,
  allowGuardScore: boolean = true,
  allowYouthLeaderScore: boolean = true
): boolean {
  if (!user || user.status === 'LOCKED') return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN') return user.classId === studentClassId;
  if (user.role === 'TO_TRUONG') {
    return user.classId === studentClassId && user.groupId === studentGroupId;
  }
  if (user.role === 'GIAM_THI') return allowGuardScore;
  if (user.role === 'TONG_PHU_TRACH') return allowYouthLeaderScore;
  return false;
}

export function canFinalizeSummary(user?: UserProfile | null, classId?: string): boolean {
  if (!user || user.status === 'LOCKED') return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canReopenSummary(user?: UserProfile | null, classId?: string): boolean {
  if (!user || user.status === 'LOCKED') return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canManageCriteria(user?: UserProfile | null, classId?: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canViewAuditLogs(user?: UserProfile | null, classId?: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}

export function canManagePublicShare(user?: UserProfile | null, classId?: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GVCN' && user.classId === classId) return true;
  return false;
}
