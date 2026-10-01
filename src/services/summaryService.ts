import {
  WeeklySummary,
  MonthlySummary,
  CompetitionTransaction,
  Student,
  Group,
  UserProfile,
} from '../types';
import { dbService } from './dbService';
import { rankingService } from './rankingService';

export const summaryService = {
  /**
   * Preview weekly summary calculation before finalizing
   */
  async previewWeeklySummary(
    classId: string,
    schoolId: string,
    schoolYearId: string,
    weekNumber: number,
    weekId: string,
    startDate: string,
    endDate: string
  ): Promise<WeeklySummary> {
    const students = await dbService.getStudents(classId);
    const groups = await dbService.getGroups(classId);
    const transactions = await dbService.getTransactions(classId);

    const studentRankings = rankingService.calculateStudentRankings(students, transactions, {
      startDate,
      endDate,
    });

    const groupRankings = rankingService.calculateGroupRankings(groups, studentRankings);

    // Calculate aggregated metrics
    let totalPlus = 0;
    let totalMinus = 0;
    let count = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'APPROVED' && tx.date >= startDate && tx.date <= endDate) {
        count++;
        if (tx.type === 'PLUS') totalPlus += Math.abs(tx.points);
        else totalMinus += Math.abs(tx.points);
      }
    });

    const summaryId = `summary-${classId}-${weekId}`;

    return {
      summaryId,
      schoolId,
      schoolYearId,
      classId,
      weekId,
      weekNumber,
      startDate,
      endDate,
      isFinalized: false,
      studentRankings,
      groupRankings,
      totalTransactions: count,
      totalPlusPoints: totalPlus,
      totalMinusPoints: totalMinus,
      netPoints: totalPlus - totalMinus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Finalize and lock a weekly snapshot
   */
  async finalizeWeeklySummary(
    summary: WeeklySummary,
    currentUser: UserProfile
  ): Promise<WeeklySummary> {
    const finalized: WeeklySummary = {
      ...summary,
      isFinalized: true,
      finalizedAt: new Date().toISOString(),
      finalizedBy: currentUser.uid,
      finalizedByName: currentUser.displayName,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveWeeklySummary(finalized);

    // Audit log
    await dbService.createAuditLog({
      schoolId: summary.schoolId,
      classId: summary.classId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      action: 'finalizeWeek',
      details: `Chốt tổng kết Tuần ${summary.weekNumber} (${summary.startDate} đến ${summary.endDate}) cho lớp ${summary.classId}. Tổng điểm: ${summary.netPoints}`,
      timestamp: new Date().toISOString(),
    });

    return finalized;
  },

  /**
   * Reopen a finalized week with mandatory reason
   */
  async reopenWeeklySummary(
    summaryId: string,
    classId: string,
    reason: string,
    currentUser: UserProfile
  ): Promise<WeeklySummary | null> {
    const list = await dbService.getWeeklySummaries(classId);
    const summary = list.find((s) => s.summaryId === summaryId);
    if (!summary) return null;

    summary.isFinalized = false;
    summary.reopenReason = reason;
    summary.reopenedAt = new Date().toISOString();
    summary.reopenedBy = currentUser.uid;
    summary.updatedAt = new Date().toISOString();

    await dbService.saveWeeklySummary(summary);

    // Audit log
    await dbService.createAuditLog({
      schoolId: summary.schoolId,
      classId: summary.classId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      action: 'reopenWeek',
      details: `Mở lại tổng kết Tuần ${summary.weekNumber} lớp ${classId}. Lý do: "${reason}"`,
      timestamp: new Date().toISOString(),
    });

    return summary;
  },

  /**
   * Preview and finalize monthly summary
   */
  async previewMonthlySummary(
    classId: string,
    schoolId: string,
    schoolYearId: string,
    monthId: string, // YYYY-MM
    monthName: string,
    startDate: string,
    endDate: string
  ): Promise<MonthlySummary> {
    const students = await dbService.getStudents(classId);
    const groups = await dbService.getGroups(classId);
    const transactions = await dbService.getTransactions(classId);

    const studentRankings = rankingService.calculateStudentRankings(students, transactions, {
      startDate,
      endDate,
    });
    const groupRankings = rankingService.calculateGroupRankings(groups, studentRankings);

    let totalPlus = 0;
    let totalMinus = 0;
    transactions.forEach((tx) => {
      if (tx.status === 'APPROVED' && tx.date >= startDate && tx.date <= endDate) {
        if (tx.type === 'PLUS') totalPlus += Math.abs(tx.points);
        else totalMinus += Math.abs(tx.points);
      }
    });

    const summaryId = `monthly-${classId}-${monthId}`;

    return {
      summaryId,
      schoolId,
      schoolYearId,
      classId,
      monthId,
      monthName,
      startDate,
      endDate,
      isFinalized: false,
      studentRankings,
      groupRankings,
      totalPlusPoints: totalPlus,
      totalMinusPoints: totalMinus,
      netPoints: totalPlus - totalMinus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async finalizeMonthlySummary(
    summary: MonthlySummary,
    currentUser: UserProfile
  ): Promise<MonthlySummary> {
    const finalized: MonthlySummary = {
      ...summary,
      isFinalized: true,
      finalizedAt: new Date().toISOString(),
      finalizedBy: currentUser.uid,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveMonthlySummary(finalized);

    await dbService.createAuditLog({
      schoolId: summary.schoolId,
      classId: summary.classId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      action: 'finalizeMonth',
      details: `Chốt tổng kết Tháng ${summary.monthName} lớp ${summary.classId}. Tổng điểm: ${summary.netPoints}`,
      timestamp: new Date().toISOString(),
    });

    return finalized;
  },
};
