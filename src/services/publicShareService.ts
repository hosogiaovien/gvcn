import { PublicShareConfig, StudentRankItem, GroupRankItem, Group, Student, CompetitionTransaction } from '../types';
import { dbService } from './dbService';
import { rankingService } from './rankingService';

export interface PublicTransactionItem {
  transactionId: string;
  studentId: string;
  studentDisplayName: string;
  groupName?: string;
  type: 'PLUS' | 'MINUS';
  points: number; // Signed: +2 or -2
  criterionName: string;
  reason?: string;
  note?: string;
  date: string;
  weekId?: string;
  monthId?: string;
  createdByName: string;
}

export interface SanitizedPublicStudentRankItem {
  studentId: string;
  rank: number;
  displayName: string;
  groupName: string;
  totalPoints?: number;
  plusPoints?: number;
  minusPoints?: number;
  transactions?: PublicTransactionItem[];
  allTransactions?: PublicTransactionItem[];
  allTimeTotalPoints?: number;
  allTimePlusPoints?: number;
  allTimeMinusPoints?: number;
  allTimeRank?: number;
  weeklyPoints?: Record<
    string,
    {
      weekId: string;
      weekNumber: number;
      totalPoints: number;
      plusPoints: number;
      minusPoints: number;
      rank?: number;
    }
  >;
}

export interface PublicWeekItem {
  weekId: string;
  weekNumber: number;
  label: string; // e.g. "Tuần 4 (21/09 - 27/09/2026)"
  shortLabel: string; // e.g. "Tuần 4"
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isBreak?: boolean;
  note?: string;
  transactionCount: number;
}

export interface WeeklyRankingBundle {
  weekId: string;
  weekLabel: string;
  studentRankings: SanitizedPublicStudentRankItem[];
  groupRankings: {
    rank: number;
    groupName: string;
    memberCount: number;
    totalPoints?: number;
    averagePoints?: number;
    plusPoints?: number;
    minusPoints?: number;
  }[];
}

export interface StudentWeeklyMatrixRow {
  studentId: string;
  displayName: string;
  groupName: string;
  allTimeRank: number;
  allTimeTotalPoints: number;
  allTimePlusPoints: number;
  allTimeMinusPoints: number;
  weeklyScores: Record<string, number>;
  weeklyPlus: Record<string, number>;
  weeklyMinus: Record<string, number>;
  weeklyRanks: Record<string, number>;
  allTransactions: PublicTransactionItem[];
}

export interface GroupWeeklyMatrixRow {
  groupName: string;
  rank: number;
  memberCount: number;
  totalPoints: number;
  weeklyScores: Record<string, number>;
}

export interface SanitizedPublicViewData {
  classId: string;
  className: string;
  grade: number;
  schoolName: string;
  schoolYear: string;
  config: {
    showClassRank: boolean;
    showGroupRank: boolean;
    showPoints: boolean;
    showPlusMinus: boolean;
    nameDisplayFormat: 'FULL' | 'MASKED' | 'ABBREVIATED';
    showWeekly: boolean;
    showMonthly: boolean;
  };
  studentRankings: SanitizedPublicStudentRankItem[];
  groupRankings: {
    rank: number;
    groupName: string;
    memberCount: number;
    totalPoints?: number;
    averagePoints?: number;
    plusPoints?: number;
    minusPoints?: number;
  }[];
  availableWeeks: PublicWeekItem[];
  weeklyRankingsMap: Record<string, WeeklyRankingBundle>;
  weeklyMatrix: {
    weeks: PublicWeekItem[];
    students: StudentWeeklyMatrixRow[];
    groupWeeklyScores: GroupWeeklyMatrixRow[];
  };
  currentWeekId?: string;
  recentTransactions?: PublicTransactionItem[];
  latestUpdate: string;
  availableClasses?: { classId: string; name: string; grade: number; token: string; homeroomTeacherName?: string }[];
}

export function formatWeekHumanLabel(weekId: string, minDate?: string, maxDate?: string): { label: string; shortLabel: string; weekNum: number } {
  const weekMap: Record<string, { weekNum: number; shortLabel: string; label: string }> = {
    '2026-W36': { weekNum: 1, shortLabel: 'Tuần 1', label: 'Tuần 1 (01/09 – 06/09/2026)' },
    '2026-W37': { weekNum: 2, shortLabel: 'Tuần 2', label: 'Tuần 2 (07/09 – 13/09/2026)' },
    '2026-W38': { weekNum: 3, shortLabel: 'Tuần 3', label: 'Tuần 3 (14/09 – 20/09/2026)' },
    '2026-W39': { weekNum: 4, shortLabel: 'Tuần 4', label: 'Tuần 4 (21/09 – 27/09/2026)' },
    '2026-W40': { weekNum: 5, shortLabel: 'Tuần 5', label: 'Tuần 5 (28/09 – 04/10/2026)' },
    '2026-W41': { weekNum: 6, shortLabel: 'Tuần 6', label: 'Tuần 6 (05/10 – 11/10/2026)' },
  };

  if (weekMap[weekId]) return weekMap[weekId];

  const match = weekId.match(/W(\d+)/);
  const rawNum = match ? parseInt(match[1], 10) : 1;
  const schoolWeek = rawNum >= 36 ? rawNum - 35 : rawNum + 17;
  const dateRange = minDate && maxDate ? ` (${minDate} đến ${maxDate})` : ` (${weekId})`;

  return {
    weekNum: schoolWeek,
    shortLabel: `Tuần ${schoolWeek}`,
    label: `Tuần ${schoolWeek}${dateRange}`,
  };
}

export const publicShareService = {
  /**
   * Generate a cryptographically secure random token
   */
  generateSecureToken(): string {
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Format full name according to privacy display settings
   */
  formatDisplayName(fullName: string, format: 'FULL' | 'MASKED' | 'ABBREVIATED'): string {
    if (format === 'FULL') return fullName;
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;

    if (format === 'ABBREVIATED') {
      const first = parts[0];
      const last = parts[parts.length - 1];
      const middle = parts.slice(1, -1).map((p) => `${p[0]}.`).join(' ');
      return middle ? `${first} ${middle} ${last}` : `${first} ${last}`;
    }

    if (format === 'MASKED') {
      const first = parts[0];
      const last = parts[parts.length - 1];
      return `${first} *** ${last}`;
    }

    return fullName;
  },

  /**
   * Fetch sanitized public data for parents via token
   */
  async getPublicData(token: string): Promise<SanitizedPublicViewData | null> {
    const shareConfig = await dbService.getPublicShareByToken(token);
    if (!shareConfig || !shareConfig.isActive) return null;

    if (shareConfig.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
      return null;
    }

    const classInfo = await dbService.getClassById(shareConfig.classId);
    if (!classInfo) return null;

    const school = await dbService.getSchool();
    const students = await dbService.getStudents(shareConfig.classId);
    const groups = await dbService.getGroups(shareConfig.classId);
    const allTxs = await dbService.getTransactions(shareConfig.classId);

    // Filter only approved transactions
    const approvedTxs = allTxs.filter((t) => t.status === 'APPROVED');

    // Map transactions per student with formatted display name
    const studentMap = new Map(students.map((s) => [s.studentId, s]));

    const publicTransactions: PublicTransactionItem[] = approvedTxs.map((tx) => {
      const st = studentMap.get(tx.studentId);
      const stName = st?.fullName || tx.studentName || 'Học sinh';
      return {
        transactionId: tx.transactionId,
        studentId: tx.studentId,
        studentDisplayName: this.formatDisplayName(stName, shareConfig.nameDisplayFormat),
        groupName: tx.groupName,
        type: tx.type,
        points: tx.points,
        criterionName: tx.criterionName,
        reason: tx.reason || tx.note || '',
        note: tx.note,
        date: tx.date,
        weekId: tx.weekId,
        monthId: tx.monthId,
        createdByName: tx.createdByName || 'Giáo viên',
      };
    });

    // 1. Load official school-wide week configuration set by Admin
    const officialSchoolWeeks = await dbService.getSchoolWeeks();
    const currentSchoolWeek = officialSchoolWeeks.find((w) => w.isCurrent);
    const activeWeeks = officialSchoolWeeks.filter((w) => w.isActive !== false);

    const weekMap = new Map<string, { count: number; minDate: string; maxDate: string }>();
    approvedTxs.forEach((t) => {
      if (!t.weekId) return;
      const cur = weekMap.get(t.weekId) || { count: 0, minDate: t.date, maxDate: t.date };
      cur.count += 1;
      if (t.date < cur.minDate) cur.minDate = t.date;
      if (t.date > cur.maxDate) cur.maxDate = t.date;
      weekMap.set(t.weekId, cur);
    });

    const availableWeeks: PublicWeekItem[] = activeWeeks.map((sw) => {
      const txMeta = weekMap.get(sw.weekId);
      return {
        weekId: sw.weekId,
        weekNumber: sw.weekNumber,
        label: sw.label,
        shortLabel: sw.shortLabel,
        startDate: sw.startDate,
        endDate: sw.endDate,
        isCurrent: sw.isCurrent,
        isBreak: sw.isBreak,
        note: sw.note,
        transactionCount: txMeta?.count || 0,
      };
    });

    // Also include any extra weekId from approved transactions that might not be in official list
    weekMap.forEach((meta, wid) => {
      if (!availableWeeks.some((w) => w.weekId === wid)) {
        const info = formatWeekHumanLabel(wid, meta.minDate, meta.maxDate);
        availableWeeks.push({
          weekId: wid,
          weekNumber: info.weekNum,
          label: info.label,
          shortLabel: info.shortLabel,
          startDate: meta.minDate,
          endDate: meta.maxDate,
          transactionCount: meta.count,
        });
      }
    });

    // Sort: latest week first (or current week first)
    availableWeeks.sort((a, b) => b.weekId.localeCompare(a.weekId));

    // 2. Calculate All-time / Cumulative Rankings
    const allTimeStudentRanks = rankingService.calculateStudentRankings(students, approvedTxs);
    const allTimeGroupRanks = rankingService.calculateGroupRankings(groups, allTimeStudentRanks);

    // Precalculate weekly rankings per week
    const weeklyRankingsMap: Record<string, WeeklyRankingBundle> = {};
    const studentWeeklyScoresMap = new Map<
      string,
      Record<
        string,
        {
          weekId: string;
          weekNumber: number;
          totalPoints: number;
          plusPoints: number;
          minusPoints: number;
          rank?: number;
        }
      >
    >();

    // Initialize map for all students
    allTimeStudentRanks.forEach((s) => {
      studentWeeklyScoresMap.set(s.studentId, {});
    });

    availableWeeks.forEach((w) => {
      const weekApprovedTxs = approvedTxs.filter((t) => t.weekId === w.weekId);
      const weekStudentRanks = rankingService.calculateStudentRankings(students, weekApprovedTxs, {
        weekId: w.weekId,
      });
      const weekGroupRanks = rankingService.calculateGroupRankings(groups, weekStudentRanks);

      weekStudentRanks.forEach((ws) => {
        const map = studentWeeklyScoresMap.get(ws.studentId);
        if (map) {
          map[w.weekId] = {
            weekId: w.weekId,
            weekNumber: w.weekNumber,
            totalPoints: ws.totalPoints,
            plusPoints: ws.plusPoints,
            minusPoints: ws.minusPoints,
            rank: ws.rank,
          };
        }
      });

      const sanitizedWeekStudents: SanitizedPublicStudentRankItem[] = weekStudentRanks.map((s) => {
        const studentWeekTxs = publicTransactions.filter(
          (tx) => tx.studentId === s.studentId && tx.weekId === w.weekId
        );
        const studentAllTxs = publicTransactions.filter((tx) => tx.studentId === s.studentId);
        const allTimeItem = allTimeStudentRanks.find((at) => at.studentId === s.studentId);

        return {
          studentId: s.studentId,
          rank: s.rank,
          displayName: this.formatDisplayName(s.fullName, shareConfig.nameDisplayFormat),
          groupName: s.groupName,
          totalPoints: shareConfig.showPoints ? s.totalPoints : undefined,
          plusPoints: shareConfig.showPlusMinus ? s.plusPoints : undefined,
          minusPoints: shareConfig.showPlusMinus ? s.minusPoints : undefined,
          transactions: studentWeekTxs,
          allTransactions: studentAllTxs,
          allTimeRank: allTimeItem?.rank,
          allTimeTotalPoints: shareConfig.showPoints ? allTimeItem?.totalPoints : undefined,
          allTimePlusPoints: shareConfig.showPlusMinus ? allTimeItem?.plusPoints : undefined,
          allTimeMinusPoints: shareConfig.showPlusMinus ? allTimeItem?.minusPoints : undefined,
          weeklyPoints: studentWeeklyScoresMap.get(s.studentId) || {},
        };
      });

      const sanitizedWeekGroups = weekGroupRanks.map((g) => ({
        rank: g.rank,
        groupName: g.groupName,
        memberCount: g.memberCount,
        totalPoints: shareConfig.showPoints ? g.totalPoints : undefined,
        averagePoints: shareConfig.showPoints ? g.averagePoints : undefined,
        plusPoints: shareConfig.showPlusMinus ? g.plusPoints : undefined,
        minusPoints: shareConfig.showPlusMinus ? g.minusPoints : undefined,
      }));

      weeklyRankingsMap[w.weekId] = {
        weekId: w.weekId,
        weekLabel: w.label,
        studentRankings: sanitizedWeekStudents,
        groupRankings: sanitizedWeekGroups,
      };
    });

    const sanitizedAllTimeStudents: SanitizedPublicStudentRankItem[] = allTimeStudentRanks.map((s) => {
      const studentTxs = publicTransactions.filter((tx) => tx.studentId === s.studentId);
      return {
        studentId: s.studentId,
        rank: s.rank,
        displayName: this.formatDisplayName(s.fullName, shareConfig.nameDisplayFormat),
        groupName: s.groupName,
        totalPoints: shareConfig.showPoints ? s.totalPoints : undefined,
        plusPoints: shareConfig.showPlusMinus ? s.plusPoints : undefined,
        minusPoints: shareConfig.showPlusMinus ? s.minusPoints : undefined,
        transactions: studentTxs,
        allTransactions: studentTxs,
        allTimeRank: s.rank,
        allTimeTotalPoints: shareConfig.showPoints ? s.totalPoints : undefined,
        allTimePlusPoints: shareConfig.showPlusMinus ? s.plusPoints : undefined,
        allTimeMinusPoints: shareConfig.showPlusMinus ? s.minusPoints : undefined,
        weeklyPoints: studentWeeklyScoresMap.get(s.studentId) || {},
      };
    });

    const sanitizedAllTimeGroups = allTimeGroupRanks.map((g) => ({
      rank: g.rank,
      groupName: g.groupName,
      memberCount: g.memberCount,
      totalPoints: shareConfig.showPoints ? g.totalPoints : undefined,
      averagePoints: shareConfig.showPoints ? g.averagePoints : undefined,
      plusPoints: shareConfig.showPlusMinus ? g.plusPoints : undefined,
      minusPoints: shareConfig.showPlusMinus ? g.minusPoints : undefined,
    }));

    // 4. Build comprehensive weekly matrix for Tab "Thống Kê Điểm Theo Tuần"
    const sortedWeeksAsc = [...availableWeeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const weeklyMatrix = {
      weeks: sortedWeeksAsc,
      students: allTimeStudentRanks.map((s) => {
        const studentAllTxs = publicTransactions.filter((tx) => tx.studentId === s.studentId);
        const weeklyScores: Record<string, number> = {};
        const weeklyPlus: Record<string, number> = {};
        const weeklyMinus: Record<string, number> = {};
        const weeklyRanks: Record<string, number> = {};

        sortedWeeksAsc.forEach((w) => {
          const wBundle = weeklyRankingsMap[w.weekId];
          const stInWeek = wBundle?.studentRankings.find((ws) => ws.studentId === s.studentId);
          weeklyScores[w.weekId] = stInWeek?.totalPoints ?? 0;
          weeklyPlus[w.weekId] = stInWeek?.plusPoints ?? 0;
          weeklyMinus[w.weekId] = stInWeek?.minusPoints ?? 0;
          weeklyRanks[w.weekId] = stInWeek?.rank ?? 0;
        });

        return {
          studentId: s.studentId,
          displayName: this.formatDisplayName(s.fullName, shareConfig.nameDisplayFormat),
          groupName: s.groupName,
          allTimeRank: s.rank,
          allTimeTotalPoints: shareConfig.showPoints ? s.totalPoints : 0,
          allTimePlusPoints: shareConfig.showPlusMinus ? s.plusPoints : 0,
          allTimeMinusPoints: shareConfig.showPlusMinus ? s.minusPoints : 0,
          weeklyScores,
          weeklyPlus,
          weeklyMinus,
          weeklyRanks,
          allTransactions: studentAllTxs,
        };
      }),
      groupWeeklyScores: allTimeGroupRanks.map((g) => {
        const weeklyScores: Record<string, number> = {};
        sortedWeeksAsc.forEach((w) => {
          const bundle = weeklyRankingsMap[w.weekId];
          const grpInWeek = bundle?.groupRankings.find((gr) => gr.groupName === g.groupName);
          weeklyScores[w.weekId] = grpInWeek?.totalPoints ?? 0;
        });
        return {
          groupName: g.groupName,
          rank: g.rank,
          memberCount: g.memberCount,
          totalPoints: g.totalPoints ?? 0,
          weeklyScores,
        };
      }),
    };

    const allClasses = await dbService.getClasses();
    const availableClasses = await Promise.all(
      allClasses.map(async (c) => {
        const share = await dbService.getPublicShareByClassId(c.classId);
        return {
          classId: c.classId,
          name: c.name,
          grade: c.grade,
          token: share?.token || c.classId,
          homeroomTeacherName: c.homeroomTeacherName,
        };
      })
    );

    return {
      classId: classInfo.classId,
      className: classInfo.name,
      grade: classInfo.grade,
      schoolName: school.name,
      schoolYear: '2026–2027',
      config: {
        showClassRank: shareConfig.showClassRank,
        showGroupRank: shareConfig.showGroupRank,
        showPoints: shareConfig.showPoints,
        showPlusMinus: shareConfig.showPlusMinus,
        nameDisplayFormat: shareConfig.nameDisplayFormat,
        showWeekly: shareConfig.showWeekly,
        showMonthly: shareConfig.showMonthly,
      },
      studentRankings: sanitizedAllTimeStudents,
      groupRankings: sanitizedAllTimeGroups,
      availableWeeks,
      weeklyRankingsMap,
      weeklyMatrix,
      currentWeekId: currentSchoolWeek?.weekId || '2026-W39',
      recentTransactions: publicTransactions.slice(0, 80),
      latestUpdate: shareConfig.updatedAt,
      availableClasses,
    };
  },
};
