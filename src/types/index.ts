export type Role =
  | 'ADMIN'
  | 'HIEU_TRUONG'
  | 'PHO_HIEU_TRUONG'
  | 'TONG_PHU_TRACH'
  | 'GIAM_THI'
  | 'GVCN'
  | 'TO_TRUONG';

export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  role: Role;
  position?: 'TO_TRUONG' | 'TO_PHO'; // Tổ trưởng hoặc Tổ phó
  schoolId: string;
  classId?: string; // Required for GVCN & TO_TRUONG
  groupId?: string; // Required for TO_TRUONG
  status: UserStatus;
  password?: string; // Mật khẩu người dùng thường (không cần email)
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  phone?: string;
  email?: string;
}

export interface School {
  schoolId: string;
  name: string;
  address?: string;
  principalName?: string;
  activeSchoolYearId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolYear {
  schoolYearId: string;
  name: string; // e.g., "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface ClassRoom {
  classId: string;
  schoolId: string;
  schoolYearId: string;
  grade: number; // 6, 7, 8, 9, 10, 11, 12
  name: string; // e.g., "9A1"
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  studentCount?: number;
  totalPoints?: number;
  groupCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  groupId: string;
  classId: string;
  name: string; // e.g., "Tổ 1", "Tổ 2"
  leaderId?: string;
  leaderName?: string;
  deputyId?: string; // Tổ phó
  deputyName?: string; // Tổ phó
  leaderUsername?: string; // Username của tổ trưởng
  deputyUsername?: string; // Username của tổ phó
  memberCount?: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  studentId: string;
  schoolId: string;
  classId: string;
  schoolYearId: string;
  studentCode: string;
  fullName: string;
  gender: 'NAM' | 'NU';
  dateOfBirth?: string;
  groupId: string;
  groupName?: string;
  groupRole?: 'LEADER' | 'DEPUTY' | 'MEMBER'; // Vai trò trong tổ
  status: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED';
  totalPoints?: number;
  plusPoints?: number;
  minusPoints?: number;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

export type CriterionType = 'PLUS' | 'MINUS';

export interface Criterion {
  criterionId: string;
  classId: string; // 'GLOBAL' or specific classId
  name: string;
  type: CriterionType;
  points: number; // positive number (e.g. 2, 5). If MINUS, subtraction is applied
  description?: string;
  category?: 'HOC_TAP' | 'KY_LUAT' | 'CHUYEN_CAN' | 'PHONG_TRAO' | 'KHAC';
  allowGroupLeader: boolean; // Tổ trưởng có được chấm không
  allowGuard: boolean; // Giám thị có được chấm không
  allowYouthLeader: boolean; // Tổng phụ trách có được chấm không
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface CompetitionTransaction {
  transactionId: string;
  batchId?: string;
  schoolId: string;
  schoolYearId: string;
  classId: string;
  studentId: string;
  studentName?: string;
  groupId: string;
  groupName?: string;
  criterionId: string;
  criterionName: string;
  type: CriterionType;
  points: number; // Signed: +2 or -2
  reason?: string;
  note?: string;
  date: string; // YYYY-MM-DD
  weekId: string; // e.g. "2026-W38"
  monthId: string; // e.g. "2026-09"
  semesterId?: string; // "HK1" | "HK2"
  createdBy: string;
  createdByName: string;
  createdByRole: Role;
  createdAt: string;
  status: TransactionStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface StudentRankItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  groupId: string;
  groupName: string;
  totalPoints: number;
  plusPoints: number;
  minusPoints: number;
  plusCount: number;
  minusCount: number;
  rank: number;
}

export interface GroupRankItem {
  groupId: string;
  groupName: string;
  memberCount: number;
  totalPoints: number;
  averagePoints: number;
  plusPoints: number;
  minusPoints: number;
  rank: number;
}

export interface WeeklySummary {
  summaryId: string;
  schoolId: string;
  schoolYearId: string;
  classId: string;
  weekId: string; // e.g. "2026-W38"
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  finalizedByName?: string;
  reopenReason?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  studentRankings: StudentRankItem[];
  groupRankings: GroupRankItem[];
  totalTransactions: number;
  totalPlusPoints: number;
  totalMinusPoints: number;
  netPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  summaryId: string;
  schoolId: string;
  schoolYearId: string;
  classId: string;
  monthId: string; // e.g. "2026-09"
  monthName: string;
  startDate: string;
  endDate: string;
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  studentRankings: StudentRankItem[];
  groupRankings: GroupRankItem[];
  totalPlusPoints: number;
  totalMinusPoints: number;
  netPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicShareConfig {
  shareId: string;
  classId: string;
  schoolId: string;
  schoolYearId: string;
  token: string;
  isActive: boolean;
  showClassRank: boolean;
  showGroupRank: boolean;
  showPoints: boolean;
  showPlusMinus: boolean;
  showHistory: boolean;
  nameDisplayFormat: 'FULL' | 'MASKED' | 'ABBREVIATED'; // "Nguyễn Văn A" vs "Nguyễn V. A"
  showWeekly: boolean;
  showMonthly: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export interface AuditLog {
  logId: string;
  schoolId: string;
  classId?: string;
  userId: string;
  userName: string;
  userRole: Role;
  action:
    | 'login'
    | 'logout'
    | 'createUser'
    | 'updateUser'
    | 'resetPassword'
    | 'changeRole'
    | 'lockUser'
    | 'unlockUser'
    | 'createClass'
    | 'updateStudent'
    | 'createCriterion'
    | 'scoreStudent'
    | 'bulkScore'
    | 'approve'
    | 'reject'
    | 'cancel'
    | 'finalizeWeek'
    | 'reopenWeek'
    | 'finalizeMonth'
    | 'reopenMonth'
    | 'createPublicShare'
    | 'revokePublicShare'
    | 'importStudents'
    | 'resetCompetitionData'
    | 'seedData';
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemSettings {
  schoolId: string;
  schoolName: string;
  activeSchoolYear: string;
  tieBreakOrder: ('minusPoints' | 'plusCount' | 'studentName')[];
  allowGroupLeaderDirectScore: boolean;
  allowGuardScore: boolean;
  allowYouthLeaderScore: boolean;
  startOfWeekDay: number; // 1 = Monday
  updatedAt: string;
  updatedBy: string;
}

export interface SchoolWeekConfig {
  weekId: string; // e.g. "2026-W36"
  weekNumber: number; // 1, 2, 3, 4, ...
  semester: 1 | 2; // Học kỳ 1 hoặc Học kỳ 2
  label: string; // "Tuần 1 (01/09 – 06/09/2026)"
  shortLabel: string; // "Tuần 1"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  isCurrent?: boolean; // Tuần thi đua hiện tại của toàn trường
  isBreak?: boolean; // Nghỉ Tết, nghỉ lễ, tuần không chấm điểm thi đua
  note?: string; // Ghi chú (VD: "Nghỉ Tết Nguyên Đán", "Thi Học Kỳ I", "Khai giảng")
  isActive: boolean; // Áp dụng cho toàn trường
  updatedAt?: string;
  updatedBy?: string;
}

