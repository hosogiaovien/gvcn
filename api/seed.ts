import type { Request, Response } from 'express';
import { getAdminFirestore } from './lib/firebaseAdmin';
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
  INITIAL_TRANSACTIONS,
} from '../src/services/seedData';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return res.status(200).json({
        success: true,
        message: 'Khởi tạo dữ liệu mẫu chế độ Local/Vite dev thành công!',
        studentsCount: INITIAL_STUDENTS.length,
      });
    }

    const batch = adminDb.batch();

    // School & year
    batch.set(adminDb.collection('schools').doc(INITIAL_SCHOOL.schoolId), INITIAL_SCHOOL);
    batch.set(adminDb.collection('schoolYears').doc(INITIAL_SCHOOL_YEAR.schoolYearId), INITIAL_SCHOOL_YEAR);
    batch.set(adminDb.collection('systemSettings').doc(INITIAL_SETTINGS.schoolId), INITIAL_SETTINGS);

    // Classes
    INITIAL_CLASSES.forEach((c) => batch.set(adminDb.collection('classes').doc(c.classId), c));
    // Groups
    INITIAL_GROUPS.forEach((g) => batch.set(adminDb.collection('groups').doc(g.groupId), g));
    // Students
    INITIAL_STUDENTS.forEach((s) => batch.set(adminDb.collection('students').doc(s.studentId), s));
    // Criteria
    INITIAL_CRITERIA.forEach((cr) => batch.set(adminDb.collection('criteria').doc(cr.criterionId), cr));
    // Users
    INITIAL_USERS.forEach((u) => batch.set(adminDb.collection('users').doc(u.uid), u));
    // Transactions
    INITIAL_TRANSACTIONS.forEach((tx) => batch.set(adminDb.collection('competitionTransactions').doc(tx.transactionId), tx));
    // Public share
    batch.set(adminDb.collection('publicShares').doc(INITIAL_PUBLIC_SHARE.shareId), INITIAL_PUBLIC_SHARE);

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'Đã đẩy thành công toàn bộ dữ liệu mẫu vào Cloud Firestore!',
      studentsCount: INITIAL_STUDENTS.length,
      criteriaCount: INITIAL_CRITERIA.length,
      classesCount: INITIAL_CLASSES.length,
    });
  } catch (err: any) {
    console.error('Seed API error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi khởi tạo dữ liệu mẫu' });
  }
}
