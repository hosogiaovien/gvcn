import type { Request, Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../lib/firebaseAdmin';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      uid,
      displayName,
      username,
      oldUsername,
      role,
      classId,
      groupId,
      status,
      newPassword,
      schoolId = 'school-ban-long',
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Thiếu mã người dùng (uid)' });
    }

    if (!displayName || !role) {
      return res.status(400).json({ error: 'Họ tên và vai trò không được để trống' });
    }

    if (role === 'GVCN' && !classId) {
      return res.status(400).json({ error: 'GVCN bắt buộc phải được phân công Lớp' });
    }

    if (role === 'TO_TRUONG' && (!classId || !groupId)) {
      return res.status(400).json({ error: 'Tổ trưởng bắt buộc phải được phân công Lớp và Tổ' });
    }

    const cleanUsername = username ? username.trim().toLowerCase() : undefined;
    const cleanOldUsername = oldUsername ? oldUsername.trim().toLowerCase() : undefined;

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    if (adminAuth && adminDb) {
      const updateAuthData: any = {
        displayName: displayName.trim(),
      };
      if (status) {
        updateAuthData.disabled = status === 'LOCKED';
      }
      if (newPassword && newPassword.length >= 6) {
        updateAuthData.password = newPassword;
      }

      try {
        await adminAuth.updateUser(uid, updateAuthData);
      } catch (authErr) {
        console.warn('Could not update Firebase Auth user:', authErr);
      }

      const updateData: any = {
        displayName: displayName.trim(),
        role,
        classId: role === 'GVCN' || role === 'TO_TRUONG' ? classId : null,
        groupId: role === 'TO_TRUONG' ? groupId : null,
        schoolId,
        updatedAt: new Date().toISOString(),
      };
      if (cleanUsername) updateData.username = cleanUsername;
      if (status) updateData.status = status;
      if (newPassword) updateData.password = newPassword;

      if (cleanOldUsername && cleanUsername && cleanOldUsername !== cleanUsername) {
        try {
          await adminDb.collection('users').doc(cleanOldUsername).delete();
        } catch (_) {}
      }

      await adminDb.collection('users').doc(uid).set(updateData, { merge: true });

      await adminDb.collection('auditLogs').add({
        schoolId,
        classId: classId || null,
        userId: 'admin',
        userName: 'Quản Trị Viên',
        userRole: 'ADMIN',
        action: 'updateUser',
        details: `Cập nhật thông tin tài khoản: @${cleanUsername || uid} (${displayName} - ${role})`,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, user: { uid, ...updateData } });
    }

    return res.status(200).json({
      success: true,
      user: {
        uid,
        displayName: displayName.trim(),
        username: cleanUsername,
        role,
        classId: role === 'GVCN' || role === 'TO_TRUONG' ? classId : null,
        groupId: role === 'TO_TRUONG' ? groupId : null,
        status: status || 'ACTIVE',
        password: newPassword,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật người dùng' });
  }
}
