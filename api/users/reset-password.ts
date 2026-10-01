import type { Request, Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../lib/firebaseAdmin';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin uid hoặc newPassword' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    if (adminAuth && adminDb) {
      await adminAuth.updateUser(uid, { password: newPassword });

      await adminDb.collection('auditLogs').add({
        schoolId: 'school-ban-long',
        userId: 'admin',
        userName: 'Quản Trị Viên',
        userRole: 'ADMIN',
        action: 'resetPassword',
        details: `Đặt lại mật khẩu cho tài khoản uid: ${uid}`,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
    }

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công (Mô phỏng dev)' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi đặt lại mật khẩu' });
  }
}
