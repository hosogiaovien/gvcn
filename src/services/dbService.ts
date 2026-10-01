import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  UserProfile,
  ClassRoom,
  Group,
  Student,
  Criterion,
  CompetitionTransaction,
  WeeklySummary,
  MonthlySummary,
  PublicShareConfig,
  AuditLog,
  SystemSettings,
  School,
  SchoolYear,
  SchoolWeekConfig,
} from '../types';
import {
  INITIAL_SCHOOL,
  INITIAL_SCHOOL_YEAR,
  INITIAL_CLASSES,
  INITIAL_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_CRITERIA,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_PUBLIC_SHARE,
  INITIAL_PUBLIC_SHARES,
  INITIAL_AUDIT_LOGS,
  INITIAL_TRANSACTIONS,
  INITIAL_SCHOOL_WEEKS,
} from './seedData';

// Local storage key for fallback/offline store
const STORAGE_PREFIX = 'thidua_data_';

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
  }
  return defaultVal;
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    // Dispatch custom event for cross-component reactivity
    window.dispatchEvent(new CustomEvent('thidua_store_update', { detail: { key } }));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Memory cache / local store initialized from seed data
let localSchool = getLocal<School>('school', INITIAL_SCHOOL);
let localSchoolYear = getLocal<SchoolYear>('school_year', INITIAL_SCHOOL_YEAR);
let localClasses = getLocal<ClassRoom[]>('classes', INITIAL_CLASSES);
let localGroups = getLocal<Group[]>('groups', INITIAL_GROUPS);
let localStudents = getLocal<Student[]>('students', INITIAL_STUDENTS);
let localCriteria = getLocal<Criterion[]>('criteria', INITIAL_CRITERIA);
let localUsers = getLocal<UserProfile[]>('users', INITIAL_USERS);
let localTransactions = getLocal<CompetitionTransaction[]>('transactions', INITIAL_TRANSACTIONS);
let localWeeklySummaries = getLocal<WeeklySummary[]>('weekly_summaries', []);
let localMonthlySummaries = getLocal<MonthlySummary[]>('monthly_summaries', []);
let localPublicShares = getLocal<PublicShareConfig[]>('public_shares', INITIAL_PUBLIC_SHARES);
let localAuditLogs = getLocal<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
let localSettings = getLocal<SystemSettings>('settings', INITIAL_SETTINGS);
let localSchoolWeeks = getLocal<SchoolWeekConfig[]>('school_weeks', INITIAL_SCHOOL_WEEKS);

// Ensure storage automatically updates to the official 9-class, 387-student roster from excel
const SEED_VERSION_TAG = 'thidua_seed_v9_school_weeks_custom';
try {
  const currentTag = typeof localStorage !== 'undefined' ? localStorage.getItem(SEED_VERSION_TAG) : null;
  if (!currentTag || localStudents.length < 350 || localClasses.length !== 9 || !localPublicShares[0]?.showPoints || localSchoolWeeks.length === 0) {
    localClasses = INITIAL_CLASSES;
    setLocal('classes', localClasses);
    localGroups = INITIAL_GROUPS;
    setLocal('groups', localGroups);
    localSchoolWeeks = INITIAL_SCHOOL_WEEKS;
    setLocal('school_weeks', localSchoolWeeks);
    localStudents = INITIAL_STUDENTS;
    setLocal('students', localStudents);
    localTransactions = INITIAL_TRANSACTIONS;
    setLocal('transactions', localTransactions);
    localPublicShares = INITIAL_PUBLIC_SHARES;
    setLocal('public_shares', localPublicShares);
    localUsers = INITIAL_USERS;
    setLocal('users', localUsers);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SEED_VERSION_TAG, 'true');
    }
  }
} catch (e) {
  console.warn('Storage sync notice:', e);
}

/**
 * Calculates live points (plus, minus, total) from approved transactions for all students
 */
export function computeLiveStudentPoints(students: Student[], transactions: CompetitionTransaction[]): Student[] {
  const pointsMap = new Map<string, { plus: number; minus: number; total: number }>();
  for (const st of students) {
    pointsMap.set(st.studentId, { plus: 0, minus: 0, total: 0 });
  }

  for (const tx of transactions) {
    if (tx.status === 'APPROVED' && pointsMap.has(tx.studentId)) {
      const entry = pointsMap.get(tx.studentId)!;
      const pts = Math.abs(tx.points);
      if (tx.type === 'PLUS') {
        entry.plus += pts;
        entry.total += pts;
      } else {
        entry.minus += pts;
        entry.total -= pts;
      }
    }
  }

  return students.map((st) => {
    const pts = pointsMap.get(st.studentId);
    if (!pts) return st;
    return {
      ...st,
      plusPoints: pts.plus,
      minusPoints: pts.minus,
      totalPoints: pts.total,
    };
  });
}

// Ensure initial memory cache has live points synced
localStudents = computeLiveStudentPoints(localStudents, localTransactions);
setLocal('students', localStudents);

export const dbService = {
  // --- SYSTEM & SCHOOL ---
  async getSchool(): Promise<School> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'schools', 'school-ban-long'));
        if (snap.exists()) return snap.data() as School;
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localSchool;
  },

  async getSchoolYear(): Promise<SchoolYear> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'schoolYears', 'year-2026-2027'));
        if (snap.exists()) return snap.data() as SchoolYear;
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localSchoolYear;
  },

  async getSettings(): Promise<SystemSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'systemSettings', 'school-ban-long'));
        if (snap.exists()) return snap.data() as SystemSettings;
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localSettings;
  },

  async updateSettings(settings: Partial<SystemSettings>, updatedBy: string): Promise<SystemSettings> {
    const updated: SystemSettings = {
      ...localSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    localSettings = updated;
    setLocal('settings', updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'systemSettings', updated.schoolId), updated, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
    return updated;
  },

  // --- CLASSES ---
  async getClasses(): Promise<ClassRoom[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as ClassRoom);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localClasses;
  },

  async getClassById(classId: string): Promise<ClassRoom | undefined> {
    const classes = await this.getClasses();
    return classes.find((c) => c.classId === classId);
  },

  async saveClass(classData: ClassRoom): Promise<void> {
    const idx = localClasses.findIndex((c) => c.classId === classData.classId);
    if (idx >= 0) {
      localClasses[idx] = classData;
    } else {
      localClasses.push(classData);
    }
    setLocal('classes', localClasses);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'classes', classData.classId), classData, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  // --- GROUPS ---
  async getGroups(classId: string): Promise<Group[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'groups'), where('classId', '==', classId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Group);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localGroups.filter((g) => g.classId === classId);
  },

  async saveGroup(group: Group): Promise<void> {
    const idx = localGroups.findIndex((g) => g.groupId === group.groupId);
    if (idx >= 0) {
      localGroups[idx] = group;
    } else {
      localGroups.push(group);
    }
    setLocal('groups', localGroups);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'groups', group.groupId), group, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  // --- STUDENTS ---
  async getStudents(classId?: string): Promise<Student[]> {
    let rawList: Student[] = [];
    if (isFirebaseConfigured && db) {
      try {
        let q = collection(db, 'students');
        const snap = classId
          ? await getDocs(query(q, where('classId', '==', classId)))
          : await getDocs(q);
        if (!snap.empty) {
          rawList = snap.docs.map((d) => d.data() as Student);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    if (rawList.length === 0) {
      rawList = classId ? localStudents.filter((s) => s.classId === classId) : localStudents;
    }
    // Always compute live points directly from transactions for 100% real-time accuracy
    const txs = await this.getTransactions(classId);
    return computeLiveStudentPoints(rawList, txs);
  },

  syncStudentPoints(classId?: string): Student[] {
    localStudents = computeLiveStudentPoints(localStudents, localTransactions);
    setLocal('students', localStudents);
    return classId ? localStudents.filter((s) => s.classId === classId) : localStudents;
  },

  async getStudentById(studentId: string): Promise<Student | undefined> {
    const students = await this.getStudents();
    return students.find((s) => s.studentId === studentId);
  },

  async saveStudent(student: Student): Promise<void> {
    const idx = localStudents.findIndex((s) => s.studentId === student.studentId);
    if (idx >= 0) {
      localStudents[idx] = student;
    } else {
      localStudents.push(student);
    }
    setLocal('students', localStudents);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'students', student.studentId), student, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    localStudents = localStudents.filter((s) => s.studentId !== studentId);
    setLocal('students', localStudents);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (e) {
        console.warn('Firestore delete error:', e);
      }
    }
  },

  async deleteStudentsBatch(studentIds: string[]): Promise<void> {
    const idSet = new Set(studentIds);
    localStudents = localStudents.filter((s) => !idSet.has(s.studentId));
    setLocal('students', localStudents);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        studentIds.forEach((id) => {
          batch.delete(doc(db!, 'students', id));
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore delete batch error:', e);
      }
    }
  },

  async deleteAllStudentsOfClass(classId: string): Promise<void> {
    const toDelete = localStudents.filter((s) => s.classId === classId);
    localStudents = localStudents.filter((s) => s.classId !== classId);
    setLocal('students', localStudents);

    if (isFirebaseConfigured && db && toDelete.length > 0) {
      try {
        const batch = writeBatch(db);
        toDelete.forEach((s) => {
          batch.delete(doc(db!, 'students', s.studentId));
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore delete all students error:', e);
      }
    }
  },

  async batchSaveStudents(students: Student[]): Promise<void> {
    students.forEach((st) => {
      const idx = localStudents.findIndex((s) => s.studentId === st.studentId);
      if (idx >= 0) {
        localStudents[idx] = st;
      } else {
        localStudents.push(st);
      }
    });
    setLocal('students', localStudents);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        students.forEach((s) => {
          batch.set(doc(db!, 'students', s.studentId), s, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch write error:', e);
      }
    }
  },

  // --- CRITERIA ---
  async getCriteria(classId?: string): Promise<Criterion[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'criteria'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Criterion);
          return classId
            ? list.filter((c) => c.classId === 'GLOBAL' || c.classId === classId)
            : list;
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return classId
      ? localCriteria.filter((c) => c.classId === 'GLOBAL' || c.classId === classId)
      : localCriteria;
  },

  async saveCriterion(criterion: Criterion): Promise<void> {
    const idx = localCriteria.findIndex((c) => c.criterionId === criterion.criterionId);
    if (idx >= 0) {
      localCriteria[idx] = criterion;
    } else {
      localCriteria.push(criterion);
    }
    setLocal('criteria', localCriteria);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'criteria', criterion.criterionId), criterion, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  async deleteCriterion(criterionId: string): Promise<void> {
    localCriteria = localCriteria.filter((c) => c.criterionId !== criterionId);
    setLocal('criteria', localCriteria);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'criteria', criterionId));
      } catch (e) {
        console.warn('Firestore delete error:', e);
      }
    }
  },

  // --- USERS ---
  async getUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as UserProfile);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localUsers;
  },

  async getUserByUid(uid: string): Promise<UserProfile | undefined> {
    const users = await this.getUsers();
    return users.find((u) => u.uid === uid);
  },

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    const users = await this.getUsers();
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  async saveUser(user: UserProfile): Promise<void> {
    const idx = localUsers.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) {
      localUsers[idx] = user;
    } else {
      localUsers.push(user);
    }
    setLocal('users', localUsers);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.uid), user, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  async updateUserStatus(uid: string, status: 'ACTIVE' | 'LOCKED'): Promise<void> {
    const user = await this.getUserByUid(uid);
    if (user) {
      user.status = status;
      user.updatedAt = new Date().toISOString();
      await this.saveUser(user);
    }
  },

  async resetUserPassword(uid: string, newPassword: string): Promise<void> {
    const user = await this.getUserByUid(uid);
    if (user) {
      user.password = newPassword;
      user.updatedAt = new Date().toISOString();
      await this.saveUser(user);
    }
  },

  async deleteUser(uid: string): Promise<void> {
    localUsers = localUsers.filter((u) => u.uid !== uid);
    setLocal('users', localUsers);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.warn('Firestore delete user error:', e);
      }
    }
  },

  async changeUsername(
    uid: string,
    oldUsername: string,
    newUsername: string,
    updatedProfile: Partial<UserProfile>
  ): Promise<UserProfile> {
    const cleanNew = newUsername.trim().toLowerCase();
    const cleanOld = oldUsername.trim().toLowerCase();

    // Check if new username is already taken by someone else
    const duplicate = localUsers.find(
      (u) => u.username.toLowerCase() === cleanNew && u.uid !== uid
    );
    if (duplicate) {
      throw new Error(`Tên đăng nhập @${cleanNew} đã được sử dụng bởi tài khoản khác!`);
    }

    // Find user
    const existingIndex = localUsers.findIndex(
      (u) => u.uid === uid || u.username.toLowerCase() === cleanOld
    );
    const existingUser = existingIndex >= 0 ? localUsers[existingIndex] : await this.getUserByUid(uid);

    if (!existingUser) {
      throw new Error('Không tìm thấy tài khoản để cập nhật');
    }

    const updatedUser: UserProfile = {
      ...existingUser,
      ...updatedProfile,
      username: cleanNew,
      updatedAt: new Date().toISOString(),
    };

    // Remove any user matching old uid or old username to completely purge old record
    localUsers = localUsers.filter((u) => u.uid !== uid && u.username.toLowerCase() !== cleanOld);
    localUsers.push(updatedUser);
    setLocal('users', localUsers);

    if (isFirebaseConfigured && db) {
      try {
        if (cleanOld !== cleanNew) {
          try {
            await deleteDoc(doc(db, 'users', cleanOld));
          } catch (_) {}
        }
        await setDoc(doc(db, 'users', updatedUser.uid), updatedUser, { merge: true });
      } catch (e) {
        console.warn('Firestore write error in changeUsername:', e);
      }
    }

    return updatedUser;
  },

  // --- SCHOOL WEEKS CONFIGURATION (CẤU HÌNH TUẦN HỌC TOÀN TRƯỜNG) ---
  async getSchoolWeeks(): Promise<SchoolWeekConfig[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'schoolWeeks'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as SchoolWeekConfig);
          return list.sort((a, b) => a.weekNumber - b.weekNumber);
        }
      } catch (e) {
        console.warn('Firestore read error on schoolWeeks, using local:', e);
      }
    }
    return localSchoolWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
  },

  async saveSchoolWeek(week: SchoolWeekConfig): Promise<void> {
    const idx = localSchoolWeeks.findIndex((w) => w.weekId === week.weekId);
    if (idx >= 0) {
      localSchoolWeeks[idx] = week;
    } else {
      localSchoolWeeks.push(week);
    }
    setLocal('school_weeks', localSchoolWeeks);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'schoolWeeks', week.weekId), week, { merge: true });
      } catch (e) {
        console.warn('Firestore write error on schoolWeeks:', e);
      }
    }
  },

  async saveAllSchoolWeeks(weeks: SchoolWeekConfig[]): Promise<void> {
    localSchoolWeeks = weeks;
    setLocal('school_weeks', localSchoolWeeks);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        weeks.forEach((w) => {
          batch.set(doc(db!, 'schoolWeeks', w.weekId), w, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch error on schoolWeeks:', e);
      }
    }
  },

  async deleteSchoolWeek(weekId: string): Promise<void> {
    localSchoolWeeks = localSchoolWeeks.filter((w) => w.weekId !== weekId);
    setLocal('school_weeks', localSchoolWeeks);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'schoolWeeks', weekId));
      } catch (e) {
        console.warn('Firestore delete error on schoolWeeks:', e);
      }
    }
  },

  async setCurrentSchoolWeek(weekId: string): Promise<void> {
    localSchoolWeeks = localSchoolWeeks.map((w) => ({
      ...w,
      isCurrent: w.weekId === weekId,
      updatedAt: new Date().toISOString(),
    }));
    setLocal('school_weeks', localSchoolWeeks);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        localSchoolWeeks.forEach((w) => {
          batch.set(doc(db!, 'schoolWeeks', w.weekId), { isCurrent: w.weekId === weekId }, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore error in setCurrentSchoolWeek:', e);
      }
    }
  },

  async getCurrentSchoolWeek(): Promise<SchoolWeekConfig | undefined> {
    const weeks = await this.getSchoolWeeks();
    return weeks.find((w) => w.isCurrent) || weeks.find((w) => w.isActive && !w.isBreak) || weeks[0];
  },

  async resetSchoolWeeksToDefault(): Promise<SchoolWeekConfig[]> {
    localSchoolWeeks = INITIAL_SCHOOL_WEEKS;
    setLocal('school_weeks', localSchoolWeeks);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        INITIAL_SCHOOL_WEEKS.forEach((w) => {
          batch.set(doc(db!, 'schoolWeeks', w.weekId), w, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch reset error on schoolWeeks:', e);
      }
    }
    return localSchoolWeeks;
  },


  // --- COMPETITION TRANSACTIONS ---
  async getTransactions(classId?: string, limitCount = 500): Promise<CompetitionTransaction[]> {
    if (isFirebaseConfigured && db) {
      try {
        let q = classId
          ? query(collection(db, 'competitionTransactions'), where('classId', '==', classId), limit(limitCount))
          : query(collection(db, 'competitionTransactions'), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as CompetitionTransaction);
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    const filtered = classId ? localTransactions.filter((t) => t.classId === classId) : localTransactions;
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createTransaction(tx: CompetitionTransaction): Promise<void> {
    localTransactions.unshift(tx);
    setLocal('transactions', localTransactions);

    // Sync student live points immediately & notify all components
    this.syncStudentPoints(tx.classId);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'competitionTransactions', tx.transactionId), tx);
        if (tx.status === 'APPROVED') {
          const updatedSt = localStudents.find((s) => s.studentId === tx.studentId);
          if (updatedSt) {
            await setDoc(doc(db, 'students', tx.studentId), updatedSt, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  async batchCreateTransactions(txs: CompetitionTransaction[]): Promise<void> {
    localTransactions = [...txs, ...localTransactions];
    setLocal('transactions', localTransactions);

    // Sync student live points immediately & notify all components
    this.syncStudentPoints(txs[0]?.classId);

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        txs.forEach((tx) => {
          batch.set(doc(db!, 'competitionTransactions', tx.transactionId), tx);
        });
        const affectedIds = new Set(txs.map((t) => t.studentId));
        affectedIds.forEach((sId) => {
          const st = localStudents.find((s) => s.studentId === sId);
          if (st) {
            batch.set(doc(db!, 'students', sId), st, { merge: true });
          }
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch write error:', e);
      }
    }
  },

  async updateTransactionStatus(
    txId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    approvedBy?: string,
    approvedByName?: string,
    rejectReason?: string
  ): Promise<void> {
    const idx = localTransactions.findIndex((t) => t.transactionId === txId);
    if (idx >= 0) {
      localTransactions[idx].status = status;
      if (status === 'APPROVED') {
        localTransactions[idx].approvedBy = approvedBy;
        localTransactions[idx].approvedByName = approvedByName;
        localTransactions[idx].approvedAt = new Date().toISOString();
      } else if (status === 'REJECTED') {
        localTransactions[idx].rejectReason = rejectReason;
      } else if (status === 'CANCELLED') {
        localTransactions[idx].cancelledAt = new Date().toISOString();
        localTransactions[idx].cancelledBy = approvedBy;
      }
      setLocal('transactions', localTransactions);
      // Sync student live points immediately & notify all components
      this.syncStudentPoints();
    }

    if (isFirebaseConfigured && db) {
      try {
        const updateData: any = { status };
        if (status === 'APPROVED') {
          updateData.approvedBy = approvedBy;
          updateData.approvedByName = approvedByName;
          updateData.approvedAt = new Date().toISOString();
        } else if (status === 'REJECTED') {
          updateData.rejectReason = rejectReason;
        } else if (status === 'CANCELLED') {
          updateData.cancelledAt = new Date().toISOString();
          updateData.cancelledBy = approvedBy;
        }
        await updateDoc(doc(db, 'competitionTransactions', txId), updateData);
      } catch (e) {
        console.warn('Firestore update error:', e);
      }
    }
  },

  // --- SUMMARIES ---
  async getWeeklySummaries(classId: string): Promise<WeeklySummary[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'weeklySummaries'), where('classId', '==', classId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as WeeklySummary);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localWeeklySummaries.filter((s) => s.classId === classId);
  },

  async saveWeeklySummary(summary: WeeklySummary): Promise<void> {
    const idx = localWeeklySummaries.findIndex((s) => s.summaryId === summary.summaryId);
    if (idx >= 0) {
      localWeeklySummaries[idx] = summary;
    } else {
      localWeeklySummaries.push(summary);
    }
    setLocal('weekly_summaries', localWeeklySummaries);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'weeklySummaries', summary.summaryId), summary, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  async getMonthlySummaries(classId: string): Promise<MonthlySummary[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'monthlySummaries'), where('classId', '==', classId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as MonthlySummary);
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    return localMonthlySummaries.filter((s) => s.classId === classId);
  },

  async saveMonthlySummary(summary: MonthlySummary): Promise<void> {
    const idx = localMonthlySummaries.findIndex((s) => s.summaryId === summary.summaryId);
    if (idx >= 0) {
      localMonthlySummaries[idx] = summary;
    } else {
      localMonthlySummaries.push(summary);
    }
    setLocal('monthly_summaries', localMonthlySummaries);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'monthlySummaries', summary.summaryId), summary, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  // --- PUBLIC SHARES ---
  async getPublicShareByToken(token?: string): Promise<PublicShareConfig | undefined> {
    if (!token) {
      return localPublicShares.find((p) => p.classId === 'class-9a1' && p.isActive) || localPublicShares[0];
    }
    const clean = token.trim();

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'publicShares'), where('token', '==', clean), where('isActive', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as PublicShareConfig;
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }

    // 1. Direct match on token
    let found = localPublicShares.find((p) => p.token === clean && p.isActive);
    if (found) return found;

    // 2. Case-insensitive token match
    found = localPublicShares.find((p) => p.token.toLowerCase() === clean.toLowerCase() && p.isActive);
    if (found) return found;

    // 3. Match by classId (e.g. 'class-9a1', 'class-6a1')
    found = localPublicShares.find((p) => p.classId.toLowerCase() === clean.toLowerCase() && p.isActive);
    if (found) return found;

    // 4. Match by short class name (e.g. '9a1', '9A1', '6a2', '6A2')
    const matchedClass = localClasses.find(
      (c) =>
        c.name.toLowerCase() === clean.toLowerCase() ||
        c.classId.toLowerCase() === clean.toLowerCase() ||
        c.classId.replace('class-', '').toLowerCase() === clean.replace('class-', '').toLowerCase()
    );
    if (matchedClass) {
      found = localPublicShares.find((p) => p.classId === matchedClass.classId && p.isActive);
      if (found) return found;
      // Auto-generate active share for this class
      const newShare: PublicShareConfig = {
        shareId: `share-${matchedClass.classId}-active`,
        classId: matchedClass.classId,
        schoolId: matchedClass.schoolId,
        schoolYearId: matchedClass.schoolYearId,
        token: `tk_${matchedClass.name.toLowerCase()}_banlong_2026`,
        isActive: true,
        showClassRank: true,
        showGroupRank: true,
        showPoints: true,
        showPlusMinus: true,
        showHistory: true,
        nameDisplayFormat: 'FULL',
        showWeekly: true,
        showMonthly: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByName: `${matchedClass.homeroomTeacherName || 'GVCN'} (GVCN)`,
      };
      await this.savePublicShare(newShare);
      return newShare;
    }

    // 5. Fallback: return default 9A1 share so parents never encounter a broken page
    return localPublicShares.find((p) => p.classId === 'class-9a1' && p.isActive) || localPublicShares[0];
  },

  async getPublicShareByClassId(classId: string): Promise<PublicShareConfig | undefined> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'publicShares'), where('classId', '==', classId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as PublicShareConfig;
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    let found = localPublicShares.find((p) => p.classId === classId);
    if (!found) {
      const cls = localClasses.find((c) => c.classId === classId);
      if (cls) {
        found = {
          shareId: `share-${classId}-active`,
          classId: classId,
          schoolId: cls.schoolId,
          schoolYearId: cls.schoolYearId,
          token: `tk_${cls.name.toLowerCase()}_banlong_2026`,
          isActive: true,
          showClassRank: true,
          showGroupRank: true,
          showPoints: true,
          showPlusMinus: true,
          showHistory: true,
          nameDisplayFormat: 'FULL',
          showWeekly: true,
          showMonthly: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdByName: `${cls.homeroomTeacherName || 'GVCN'} (GVCN)`,
        };
        await this.savePublicShare(found);
      }
    }
    return found;
  },

  async savePublicShare(share: PublicShareConfig): Promise<void> {
    const idx = localPublicShares.findIndex((p) => p.shareId === share.shareId);
    if (idx >= 0) {
      localPublicShares[idx] = share;
    } else {
      localPublicShares.push(share);
    }
    setLocal('public_shares', localPublicShares);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'publicShares', share.shareId), share, { merge: true });
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(classId?: string, limitCount = 100): Promise<AuditLog[]> {
    if (isFirebaseConfigured && db) {
      try {
        let q = classId
          ? query(collection(db, 'auditLogs'), where('classId', '==', classId), limit(limitCount))
          : query(collection(db, 'auditLogs'), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as AuditLog);
          return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (e) {
        console.warn('Firestore read error, using local:', e);
      }
    }
    const filtered = classId ? localAuditLogs.filter((l) => l.classId === classId) : localAuditLogs;
    return [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createAuditLog(log: Omit<AuditLog, 'logId'>): Promise<void> {
    const fullLog: AuditLog = {
      ...log,
      logId: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    localAuditLogs.unshift(fullLog);
    if (localAuditLogs.length > 500) localAuditLogs.pop();
    setLocal('audit_logs', localAuditLogs);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'auditLogs', fullLog.logId), fullLog);
      } catch (e) {
        console.warn('Firestore write error:', e);
      }
    }
  },

  // --- SEED TO REAL FIRESTORE ---
  async seedAllToFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isFirebaseConfigured || !db) {
      return { success: false, count: 0, error: 'Firebase chưa được kết nối! Vui lòng cấu hình Firebase.' };
    }
    try {
      const batch = writeBatch(db);

      // School & settings
      batch.set(doc(db, 'schools', INITIAL_SCHOOL.schoolId), INITIAL_SCHOOL);
      batch.set(doc(db, 'schoolYears', INITIAL_SCHOOL_YEAR.schoolYearId), INITIAL_SCHOOL_YEAR);
      batch.set(doc(db, 'systemSettings', INITIAL_SETTINGS.schoolId), INITIAL_SETTINGS);

      // Classes
      INITIAL_CLASSES.forEach((c) => batch.set(doc(db!, 'classes', c.classId), c));
      // Groups
      INITIAL_GROUPS.forEach((g) => batch.set(doc(db!, 'groups', g.groupId), g));
      // Students
      INITIAL_STUDENTS.forEach((s) => batch.set(doc(db!, 'students', s.studentId), s));
      // Criteria
      INITIAL_CRITERIA.forEach((cr) => batch.set(doc(db!, 'criteria', cr.criterionId), cr));
      // Users
      INITIAL_USERS.forEach((u) => batch.set(doc(db!, 'users', u.uid), u));
      // Transactions
      INITIAL_TRANSACTIONS.forEach((tx) => batch.set(doc(db!, 'competitionTransactions', tx.transactionId), tx));
      // Public Share
      batch.set(doc(db, 'publicShares', INITIAL_PUBLIC_SHARE.shareId), INITIAL_PUBLIC_SHARE);

      await batch.commit();
      return { success: true, count: INITIAL_STUDENTS.length + INITIAL_CRITERIA.length + INITIAL_CLASSES.length };
    } catch (err: any) {
      console.error('Error seeding to Firestore:', err);
      return { success: false, count: 0, error: err?.message || 'Có lỗi xảy ra khi đẩy dữ liệu vào Firestore' };
    }
  },

  // --- ADMIN RESET THI ĐUA DATA (XOÁ SẠCH TRONG DATA VÀ ĐƯA VỀ 0) ---
  async resetCompetitionData(options: {
    classId: string; // 'ALL' or specific classId
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    resetAllTime?: boolean;
    adminUserId: string;
    adminUserName: string;
  }): Promise<{ deletedTransactionsCount: number; affectedStudentsCount: number; affectedClassesCount: number }> {
    const { classId, startDate, endDate, resetAllTime, adminUserId, adminUserName } = options;

    // Filter transactions to remove
    const toDeleteIds = new Set<string>();
    const affectedStudentIds = new Set<string>();
    const affectedClassIds = new Set<string>();

    localTransactions.forEach((tx) => {
      const matchClass = classId === 'ALL' || tx.classId === classId;
      if (!matchClass) return;

      let matchTime = true;
      if (!resetAllTime) {
        if (startDate && tx.date < startDate) matchTime = false;
        if (endDate && tx.date > endDate) matchTime = false;
      }

      if (matchTime) {
        toDeleteIds.add(tx.transactionId);
        affectedStudentIds.add(tx.studentId);
        affectedClassIds.add(tx.classId);
      }
    });

    const deletedTransactionsCount = toDeleteIds.size;

    // 1. Remove deleted transactions from localTransactions
    localTransactions = localTransactions.filter((tx) => !toDeleteIds.has(tx.transactionId));
    setLocal('transactions', localTransactions);

    // 2. Also remove from Firestore if connected
    if (isFirebaseConfigured && db && deletedTransactionsCount > 0) {
      try {
        const batch = writeBatch(db);
        let batchCount = 0;
        for (const txId of toDeleteIds) {
          batch.delete(doc(db, 'competitionTransactions', txId));
          batchCount++;
          if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0;
          }
        }
        if (batchCount > 0) {
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firestore transaction delete notice:', e);
      }
    }

    // 3. Recalculate live points for affected students
    const targetStudents =
      classId === 'ALL'
        ? localStudents
        : localStudents.filter((s) => s.classId === classId);

    // Build live score map from remaining approved transactions
    const remainingScoreMap = new Map<string, { plus: number; minus: number; total: number }>();
    localTransactions.forEach((tx) => {
      if (tx.status === 'APPROVED') {
        if (!remainingScoreMap.has(tx.studentId)) {
          remainingScoreMap.set(tx.studentId, { plus: 0, minus: 0, total: 0 });
        }
        const entry = remainingScoreMap.get(tx.studentId)!;
        const pts = Math.abs(tx.points);
        if (tx.type === 'PLUS') {
          entry.plus += pts;
          entry.total += pts;
        } else {
          entry.minus += pts;
          entry.total -= pts;
        }
      }
    });

    targetStudents.forEach((st) => {
      const live = remainingScoreMap.get(st.studentId);
      if (live) {
        st.plusPoints = live.plus;
        st.minusPoints = live.minus;
        st.totalPoints = live.total;
      } else {
        // If no transactions remain for this student, reset everything to 0
        st.plusPoints = 0;
        st.minusPoints = 0;
        st.totalPoints = 0;
      }
      st.updatedAt = new Date().toISOString();
    });

    setLocal('students', localStudents);

    // 4. Recalculate class totalPoints
    localClasses.forEach((cls) => {
      if (classId === 'ALL' || cls.classId === classId) {
        const cStudents = localStudents.filter((s) => s.classId === cls.classId);
        cls.totalPoints = cStudents.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
        cls.updatedAt = new Date().toISOString();
      }
    });
    setLocal('classes', localClasses);

    // 5. Clean up any weekly summaries that were finalized or stored during this period
    if (resetAllTime) {
      localWeeklySummaries = localWeeklySummaries.filter(
        (ws) => classId !== 'ALL' && ws.classId !== classId
      );
      localMonthlySummaries = localMonthlySummaries.filter(
        (ms) => classId !== 'ALL' && ms.classId !== classId
      );
    } else {
      localWeeklySummaries = localWeeklySummaries.filter((ws) => {
        if (classId !== 'ALL' && ws.classId !== classId) return true;
        if (startDate && ws.endDate < startDate) return true;
        if (endDate && ws.startDate > endDate) return true;
        return false;
      });
      localMonthlySummaries = localMonthlySummaries.filter((ms) => {
        if (classId !== 'ALL' && ms.classId !== classId) return true;
        if (startDate && ms.endDate < startDate) return true;
        if (endDate && ms.startDate > endDate) return true;
        return false;
      });
    }
    setLocal('weekly_summaries', localWeeklySummaries);
    setLocal('monthly_summaries', localMonthlySummaries);

    // 6. Audit Log
    const targetClassName =
      classId === 'ALL'
        ? 'Tất cả các lớp toàn trường'
        : localClasses.find((c) => c.classId === classId)?.name || classId;

    const timeRangeStr = resetAllTime
      ? 'toàn bộ thời gian từ trước đến nay'
      : `khoảng thời gian từ ${startDate || 'bắt đầu'} đến ${endDate || 'hiện tại'}`;

    await this.createAuditLog({
      schoolId: 'school-ban-long',
      classId: classId === 'ALL' ? undefined : classId,
      userId: adminUserId,
      userName: adminUserName,
      userRole: 'ADMIN',
      action: 'resetCompetitionData',
      details: `Admin reset điểm thi đua lớp ${targetClassName} (${timeRangeStr}). Đã xóa hoàn toàn ${deletedTransactionsCount} lượt ghi nhận điểm và đưa điểm học sinh về 0.`,
      timestamp: new Date().toISOString(),
    });

    // Notify all open UI
    window.dispatchEvent(new CustomEvent('thidua_store_update', { detail: { key: 'transactions' } }));

    return {
      deletedTransactionsCount,
      affectedStudentsCount: targetStudents.length,
      affectedClassesCount: classId === 'ALL' ? localClasses.length : 1,
    };
  },
};
