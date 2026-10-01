import type { Request, Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../lib/firebaseAdmin';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username, password, displayName, role, classId, groupId, schoolId = 'school-ban-long' } = req.body;

    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (username, password, displayName, role)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    if (role === 'GVCN' && !classId) {
      return res.status(400).json({ error: 'GVCN bắt buộc phải được phân công Lớp' });
    }

    if (role === 'TO_TRUONG' && (!classId || !groupId)) {
      return res.status(400).json({ error: 'Tổ trưởng bắt buộc phải được phân công Lớp và Tổ' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const internalEmail = `${cleanUsername}@thidua.school`;

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    if (adminAuth && adminDb) {
      // Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: internalEmail,
        password,
        displayName,
      });

      const userProfile = {
        uid: userRecord.uid,
        username: cleanUsername,
        displayName,
        role,
        schoolId,
        classId: classId || null,
        groupId: groupId || null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: internalEmail,
      };

      await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

      // Audit log
      await adminDb.collection('auditLogs').add({
        schoolId,
        classId: classId || null,
        userId: 'admin',
        userName: 'Quản Trị Viên',
        userRole: 'ADMIN',
        action: 'createUser',
        details: `Tạo tài khoản mới: ${cleanUsername} (${role})`,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({ success: true, user: userProfile });
    }

    // In local dev without Admin SDK credentials, return success object for client sync
    const fallbackProfile = {
      uid: `user-${cleanUsername}-${Date.now()}`,
      username: cleanUsername,
      displayName,
      role,
      schoolId,
      classId: classId || null,
      groupId: groupId || null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: internalEmail,
    };

    return res.status(201).json({
      success: true,
      user: fallbackProfile,
      notice: 'Tạo tài khoản thành công (Admin SDK mock mode)'
    });
  } catch (error: any) {
    console.error('API createUser error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
    }
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống khi tạo người dùng' });
  }
}
