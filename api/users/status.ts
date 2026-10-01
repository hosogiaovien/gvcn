import type { Request, Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../lib/firebaseAdmin';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { uid, status } = req.body;

    if (!uid || !['ACTIVE', 'LOCKED'].includes(status)) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ (cần uid và status ACTIVE/LOCKED)' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    if (adminAuth && adminDb) {
      // Disable user in Firebase Auth if LOCKED
      await adminAuth.updateUser(uid, {
        disabled: status === 'LOCKED',
      });

      // Update Firestore document
      await adminDb.collection('users').doc(uid).update({
        status,
        updatedAt: new Date().toISOString(),
      });

      // Audit log
      await adminDb.collection('auditLogs').add({
        schoolId: 'school-ban-long',
        userId: 'admin',
        userName: 'Quản Trị Viên',
        userRole: 'ADMIN',
        action: status === 'LOCKED' ? 'lockUser' : 'unlockUser',
        details: `${status === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản uid: ${uid}`,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, status });
    }

    return res.status(200).json({ success: true, status });
  } catch (err: any) {
    console.error('Update user status error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi cập nhật trạng thái người dùng' });
  }
}
