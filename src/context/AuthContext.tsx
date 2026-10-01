import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { dbService } from '../services/dbService';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (role: Role, classId?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'thidua_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as UserProfile;
          // Re-fetch from DB to check status (e.g., if locked)
          const latest = await dbService.getUserByUid(parsed.uid);
          if (latest && latest.status === 'ACTIVE') {
            setCurrentUser(latest);
          } else {
            localStorage.removeItem(CURRENT_USER_KEY);
            setCurrentUser(null);
          }
        } else {
          // No active session: stay logged out so user can sign in via /login
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const internalEmail = `${cleanUsername}@thidua.school`;

      // 1. Validate user existence in system database
      const localUser = await dbService.getUserByUsername(cleanUsername);
      if (!localUser) {
        return { success: false, error: 'Tên đăng nhập không tồn tại. Vui lòng kiểm tra lại!' };
      }

      if (localUser.status === 'LOCKED') {
        return { success: false, error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!' };
      }

      // 2. Validate password
      let isValidPassword = false;
      if (localUser.password) {
        if (localUser.password !== 'password' && localUser.password !== '123456') {
          // Custom personal password set by the user
          isValidPassword = password === localUser.password;
        } else {
          // Default initial passwords
          isValidPassword =
            password === localUser.password ||
            password === '123456' ||
            password === 'password' ||
            password === 'admin';
        }
      } else {
        isValidPassword = password === '123456' || password === 'password' || password === 'admin';
      }

      if (!isValidPassword) {
        return { success: false, error: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }

      // Track admin session for role preview
      if (localUser.role === 'ADMIN') {
        sessionStorage.setItem('thidua_admin_acting', 'true');
      } else {
        sessionStorage.removeItem('thidua_admin_acting');
      }

      // 3. Optional Firebase Auth sync (never blocks local session if remote user is not provisioned)
      if (isFirebaseConfigured && auth && password) {
        try {
          await signInWithEmailAndPassword(auth, internalEmail, password);
        } catch {
          // Firebase Auth user not created yet; safely proceed with system session
        }
      }

      localUser.lastLoginAt = new Date().toISOString();
      await dbService.saveUser(localUser);
      await dbService.createAuditLog({
        schoolId: localUser.schoolId,
        classId: localUser.classId,
        userId: localUser.uid,
        userName: localUser.displayName,
        userRole: localUser.role,
        action: 'login',
        details: `Đăng nhập thành công với tài khoản ${cleanUsername}`,
        timestamp: new Date().toISOString(),
      });

      setCurrentUser(localUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUser));
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await dbService.createAuditLog({
          schoolId: currentUser.schoolId,
          classId: currentUser.classId,
          userId: currentUser.uid,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          action: 'logout',
          details: `Đăng xuất khỏi hệ thống`,
          timestamp: new Date().toISOString(),
        });
      }
      if (isFirebaseConfigured && auth) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      try {
        sessionStorage.clear();
      } catch {}
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  };

  const switchDemoUser = async (role: Role, classId?: string) => {
    const isAdmin =
      currentUser?.role === 'ADMIN' ||
      sessionStorage.getItem('thidua_admin_acting') === 'true';

    if (!isAdmin) {
      console.warn('Chỉ Quản trị viên (Admin) mới có quyền chuyển đổi vai trò');
      return;
    }

    setLoading(true);
    try {
      const users = await dbService.getUsers();
      let targetUser = classId
        ? users.find((u) => u.role === role && u.classId === classId)
        : users.find((u) => u.role === role);

      if (!targetUser && role === 'GVCN' && classId) {
        const cls = await dbService.getClassById(classId);
        targetUser = {
          uid: `user-gvcn-${classId.replace('class-', '')}`,
          username: `gvcn${classId.replace('class-', '')}`,
          displayName: cls?.homeroomTeacherName
            ? `${cls.homeroomTeacherName} (GVCN ${cls.name})`
            : `GVCN Lớp ${cls?.name || classId}`,
          role: 'GVCN',
          schoolId: 'school-ban-long',
          classId: classId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (targetUser) {
        setCurrentUser(targetUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(targetUser));
        window.dispatchEvent(new Event('thidua_store_update'));
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    const latest = await dbService.getUserByUid(currentUser.uid);
    if (latest) {
      setCurrentUser(latest);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(latest));
    }
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập!' };

    // Verify old password
    const userPass = currentUser.password;
    const isOldCorrect =
      userPass && userPass !== 'password' && userPass !== '123456'
        ? oldPassword === userPass
        : [userPass, '123456', 'password', 'admin'].filter(Boolean).includes(oldPassword);

    if (!isOldCorrect) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác!' };
    }
    const cleanNew = newPassword.trim();
    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
    }

    try {
      await dbService.resetUserPassword(currentUser.uid, cleanNew);
      const updatedUser: UserProfile = {
        ...currentUser,
        password: cleanNew,
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      await dbService.createAuditLog({
        schoolId: currentUser.schoolId,
        classId: currentUser.classId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userRole: currentUser.role,
        action: 'resetPassword',
        details: `Người dùng ${currentUser.username} đã tự đổi mật khẩu cá nhân thành công`,
        timestamp: new Date().toISOString(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi đổi mật khẩu' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        switchDemoUser,
        refreshUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
