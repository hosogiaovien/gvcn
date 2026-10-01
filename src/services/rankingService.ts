import {
  Student,
  CompetitionTransaction,
  StudentRankItem,
  GroupRankItem,
  Group,
} from '../types';

export interface RankingOptions {
  startDate?: string;
  endDate?: string;
  weekId?: string;
  monthId?: string;
}

export const rankingService = {
  /**
   * Calculate student rankings for a class based on active students and transactions
   */
  calculateStudentRankings(
    students: Student[],
    transactions: CompetitionTransaction[],
    options?: RankingOptions
  ): StudentRankItem[] {
    // Filter approved transactions in date/week/month scope
    const validTxs = transactions.filter((tx) => {
      if (tx.status !== 'APPROVED') return false;
      if (options?.startDate && tx.date < options.startDate) return false;
      if (options?.endDate && tx.date > options.endDate) return false;
      if (options?.weekId && tx.weekId !== options.weekId) return false;
      if (options?.monthId && tx.monthId !== options.monthId) return false;
      return true;
    });

    // Map each student's points and counts
    const studentMap = new Map<
      string,
      {
        student: Student;
        plusPoints: number;
        minusPoints: number;
        plusCount: number;
        minusCount: number;
      }
    >();

    students.forEach((st) => {
      studentMap.set(st.studentId, {
        student: st,
        plusPoints: 0,
        minusPoints: 0,
        plusCount: 0,
        minusCount: 0,
      });
    });

    validTxs.forEach((tx) => {
      const entry = studentMap.get(tx.studentId);
      if (entry) {
        if (tx.type === 'PLUS') {
          entry.plusPoints += Math.abs(tx.points);
          entry.plusCount += 1;
        } else {
          entry.minusPoints += Math.abs(tx.points);
          entry.minusCount += 1;
        }
      }
    });

    // Base score is 100 or start at 0? In Vietnamese school competition, standard base is 0 with net points, or +10. Let's calculate netPoints = plusPoints - minusPoints
    const items: (StudentRankItem & { sortVal: number })[] = Array.from(studentMap.values()).map(
      ({ student, plusPoints, minusPoints, plusCount, minusCount }) => {
        let finalPlus = plusPoints;
        let finalMinus = minusPoints;
        let finalTotal = plusPoints - minusPoints;

        // If no transactions in this specific scope, fallback to student's initial/accumulated points if present
        if (!options?.startDate && !options?.endDate && !options?.weekId && !options?.monthId) {
          if (plusCount === 0 && minusCount === 0 && (student.totalPoints || student.plusPoints || student.minusPoints)) {
            finalPlus = student.plusPoints || (student.totalPoints && student.totalPoints > 0 ? student.totalPoints : 0);
            finalMinus = student.minusPoints || (student.totalPoints && student.totalPoints < 0 ? Math.abs(student.totalPoints) : 0);
            finalTotal = student.totalPoints ?? (finalPlus - finalMinus);
          }
        }

        return {
          studentId: student.studentId,
          studentCode: student.studentCode,
          fullName: student.fullName,
          groupId: student.groupId,
          groupName: student.groupName || 'Tổ',
          totalPoints: finalTotal,
          plusPoints: finalPlus,
          minusPoints: finalMinus,
          plusCount,
          minusCount,
          rank: 0,
          sortVal: finalTotal,
        };
      }
    );

    // Multi-level sorting:
    // 1. Total Points descending
    // 2. Minus points ascending (fewer minus points is better)
    // 3. Plus count descending (more plus occurrences is better)
    // 4. Alphabetical Vietnamese full name ascending
    items.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (a.minusPoints !== b.minusPoints) {
        return a.minusPoints - b.minusPoints; // less minus is better
      }
      if (b.plusCount !== a.plusCount) {
        return b.plusCount - a.plusCount; // more plus is better
      }
      return a.fullName.localeCompare(b.fullName, 'vi');
    });

    // Assign rank with tie-break handling (if points, minusPoints, plusCount are identical -> same rank)
    let currentRank = 1;
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        const prev = items[i - 1];
        const curr = items[i];
        const isTie =
          curr.totalPoints === prev.totalPoints &&
          curr.minusPoints === prev.minusPoints &&
          curr.plusCount === prev.plusCount;
        if (!isTie) {
          currentRank = i + 1;
        }
      }
      items[i].rank = currentRank;
    }

    return items;
  },

  /**
   * Calculate group rankings from student rankings
   */
  calculateGroupRankings(groups: Group[], studentRankings: StudentRankItem[]): GroupRankItem[] {
    // If groups array is empty, default to 4 standard groups (Tổ 1, 2, 3, 4)
    const effectiveGroups: Group[] =
      groups && groups.length > 0
        ? groups
        : [1, 2, 3, 4].map((num) => ({
            groupId: `group-${num}`,
            classId: '',
            name: `Tổ ${num}`,
            leaderName: '',
            memberCount: 0,
            status: 'ACTIVE' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

    const groupMap = new Map<
      string,
      {
        group: Group;
        totalPoints: number;
        plusPoints: number;
        minusPoints: number;
        memberCount: number;
      }
    >();

    effectiveGroups.forEach((g) => {
      groupMap.set(g.groupId, {
        group: g,
        totalPoints: 0,
        plusPoints: 0,
        minusPoints: 0,
        memberCount: 0,
      });
    });

    studentRankings.forEach((st) => {
      // 1. Exact match on groupId
      let entry = groupMap.get(st.groupId);

      // 2. Match by exact group name
      if (!entry) {
        entry = Array.from(groupMap.values()).find(
          (e) => e.group.name.trim() === (st.groupName || '').trim() || e.group.groupId === st.groupId
        );
      }

      // 3. Match by group number (1..4)
      if (!entry) {
        const numMatch = (st.groupName || '').match(/[1-4]$/) || (st.groupId || '').match(/[1-4]$/);
        if (numMatch) {
          const num = numMatch[0];
          entry = Array.from(groupMap.values()).find(
            (e) =>
              e.group.name.includes(num) ||
              e.group.groupId.endsWith(`-${num}`) ||
              e.group.groupId.endsWith(`_${num}`)
          );
        }
      }

      if (entry) {
        entry.totalPoints += st.totalPoints;
        entry.plusPoints += st.plusPoints;
        entry.minusPoints += st.minusPoints;
        entry.memberCount += 1;
      }
    });

    const items: GroupRankItem[] = Array.from(groupMap.values()).map(
      ({ group, totalPoints, plusPoints, minusPoints, memberCount }) => {
        const avg = memberCount > 0 ? Math.round((totalPoints / memberCount) * 10) / 10 : 0;
        return {
          groupId: group.groupId,
          groupName: group.name,
          memberCount,
          totalPoints,
          averagePoints: avg,
          plusPoints,
          minusPoints,
          rank: 0,
        };
      }
    );

    // Sort groups by total points descending, then fewer minus points
    items.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (a.minusPoints !== b.minusPoints) {
        return a.minusPoints - b.minusPoints;
      }
      return b.plusPoints - a.plusPoints;
    });

    // Assign ranks
    let rank = 1;
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && items[i].totalPoints !== items[i - 1].totalPoints) {
        rank = i + 1;
      }
      items[i].rank = rank;
    }

    return items;
  },
};
