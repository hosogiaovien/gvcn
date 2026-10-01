import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Lock,
  Unlock,
  Key,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserProfile, Role, UserStatus, ClassRoom, Group } from '../../types';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../permissions';

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Edit user state
  const [showEditModal, setShowEditModal] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Role>('GVCN');
  const [editClassId, setEditClassId] = useState('class-9a1');
  const [editGroupId, setEditGroupId] = useState('group-1');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create user form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('GVCN');
  const [selectedClassId, setSelectedClassId] = useState('class-9a1');
  const [selectedGroupId, setSelectedGroupId] = useState('group-1');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [uList, cList, gList] = await Promise.all([
      dbService.getUsers(),
      dbService.getClasses(),
      dbService.getGroups('class-9a1'),
    ]);
    setUsers(uList);
    setClasses(cList);
    setGroups(gList);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (currentUser && currentUser.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Mật khẩu phải có tối thiểu 6 ký tự!', 'error');
      return;
    }

    if (selectedRole === 'GVCN' && !selectedClassId) {
      showToast('GVCN bắt buộc phải được chọn Lớp!', 'error');
      return;
    }

    if (selectedRole === 'TO_TRUONG' && (!selectedClassId || !selectedGroupId)) {
      showToast('Tổ trưởng bắt buộc phải được chọn Lớp và Tổ!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Call backend API /api/users
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: fullName.trim(),
          username: username.trim().toLowerCase(),
          password,
          role: selectedRole,
          classId: selectedRole === 'GVCN' || selectedRole === 'TO_TRUONG' ? selectedClassId : null,
          groupId: selectedRole === 'TO_TRUONG' ? selectedGroupId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tạo người dùng');
      }

      // Also save into dbService
      if (data.user) {
        await dbService.saveUser(data.user);
      }

      await loadData();
      showToast(`Đã tạo tài khoản @${username} (${ROLE_LABELS[selectedRole]}) thành công!`, 'success');
      setShowCreateModal(false);
      // Reset form
      setFullName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo tài khoản', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (user: UserProfile) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      // Call API
      await fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, status: nextStatus }),
      });

      await dbService.updateUserStatus(user.uid, nextStatus);
      await loadData();
      showToast(
        `Đã ${nextStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản @${user.username}!`,
        nextStatus === 'LOCKED' ? 'info' : 'success'
      );
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!showResetModal || !newPassword) return;
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: showResetModal.uid, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đổi mật khẩu');

      showToast(`Đã đặt lại mật khẩu mới cho tài khoản @${showResetModal.username}!`, 'success');
      setShowResetModal(null);
      setNewPassword('');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setShowEditModal(user);
    setEditFullName(user.displayName);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditClassId(user.classId || 'class-9a1');
    setEditGroupId(user.groupId || 'group-1');
    setEditStatus(user.status);
    setEditNewPassword('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    if (!editFullName.trim()) {
      showToast('Họ tên người dùng không được để trống!', 'error');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase();
    if (!cleanUsername) {
      showToast('Tên đăng nhập (Username) không được để trống!', 'error');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      showToast('Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu gạch dưới, gạch ngang hoặc dấu chấm!', 'error');
      return;
    }

    // Check if new username is already used by another user
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.uid !== showEditModal.uid
    );
    if (duplicate) {
      showToast(`Tên đăng nhập @${cleanUsername} đã được sử dụng bởi tài khoản khác (${duplicate.displayName})!`, 'error');
      return;
    }

    if (editRole === 'GVCN' && !editClassId) {
      showToast('GVCN bắt buộc phải chọn Lớp!', 'error');
      return;
    }

    if (editRole === 'TO_TRUONG' && (!editClassId || !editGroupId)) {
      showToast('Tổ trưởng bắt buộc phải chọn Lớp và Tổ!', 'error');
      return;
    }

    if (editNewPassword && editNewPassword.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const isUsernameChanged = cleanUsername !== showEditModal.username.toLowerCase();

      // 1. Call API /api/users/update
      try {
        await fetch('/api/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: showEditModal.uid,
            displayName: editFullName.trim(),
            username: cleanUsername,
            oldUsername: showEditModal.username,
            role: editRole,
            classId: editRole === 'GVCN' || editRole === 'TO_TRUONG' ? editClassId : null,
            groupId: editRole === 'TO_TRUONG' ? editGroupId : null,
            status: editStatus,
            newPassword: editNewPassword.trim() || undefined,
          }),
        });
      } catch (apiErr) {
        console.warn('API update error, continuing with local DB:', apiErr);
      }

      if (isUsernameChanged) {
        // Purge old username record and update with new username
        await dbService.changeUsername(showEditModal.uid, showEditModal.username, cleanUsername, {
          displayName: editFullName.trim(),
          role: editRole,
          classId: editRole === 'GVCN' || editRole === 'TO_TRUONG' ? editClassId : undefined,
          groupId: editRole === 'TO_TRUONG' ? editGroupId : undefined,
          status: editStatus,
          password: editNewPassword.trim() || showEditModal.password,
        });
        showToast(
          `Đã đổi Username thành công: @${showEditModal.username} ➔ @${cleanUsername} (đã xóa bản ghi user cũ)!`,
          'success'
        );
      } else {
        const updatedUser: UserProfile = {
          ...showEditModal,
          displayName: editFullName.trim(),
          username: cleanUsername,
          role: editRole,
          classId: editRole === 'GVCN' || editRole === 'TO_TRUONG' ? editClassId : undefined,
          groupId: editRole === 'TO_TRUONG' ? editGroupId : undefined,
          status: editStatus,
          password: editNewPassword.trim() || showEditModal.password,
          updatedAt: new Date().toISOString(),
        };

        await dbService.saveUser(updatedUser);
        showToast(`Đã cập nhật thông tin tài khoản @${cleanUsername} thành công!`, 'success');
      }

      await loadData();
      setShowEditModal(null);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu thông tin người dùng', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Quản Lý Người Dùng &amp; Tài Khoản</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {users.length} tài khoản
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Quản lý tài khoản, cấp quyền theo vai trò (RBAC), khóa / mở khóa và đặt lại mật khẩu an toàn
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Tạo Tài Khoản Mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên hoặc username..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
        >
          <option value="ALL">Tất cả vai trò ({users.length})</option>
          <option value="ADMIN">Quản trị viên (Admin)</option>
          <option value="HIEU_TRUONG">Hiệu trưởng</option>
          <option value="PHO_HIEU_TRUONG">Phó Hiệu trưởng</option>
          <option value="TONG_PHU_TRACH">Tổng phụ trách</option>
          <option value="GIAM_THI">Giám thị</option>
          <option value="GVCN">Giáo viên chủ nhiệm</option>
          <option value="TO_TRUONG">Tổ trưởng</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 pl-4">Họ và tên</th>
                <th className="py-3.5">Username</th>
                <th className="py-3.5">Vai trò</th>
                <th className="py-3.5">Lớp phân công</th>
                <th className="py-3.5">Tổ</th>
                <th className="py-3.5 text-center">Trạng thái</th>
                <th className="py-3.5 text-right pr-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 pl-4">
                    <span className="font-bold text-slate-900 text-sm">{u.displayName}</span>
                  </td>
                  <td className="py-3.5 font-mono text-indigo-700 font-bold">@{u.username}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                        ROLE_BADGE_COLORS[u.role]
                      }`}
                    >
                      {ROLE_LABELS[u.role]?.split('(')[0]}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-600 font-medium">
                    {u.classId ? u.classId.replace('class-', '').toUpperCase() : '-'}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {u.groupId ? u.groupId.replace('group-', 'Tổ ') : '-'}
                  </td>
                  <td className="py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hoạt động
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" /> Bị khóa
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 shadow-2xs"
                        title="Sửa thông tin tài khoản người dùng"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => setShowResetModal(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Đặt lại mật khẩu"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLock(u)}
                        className={`p-1.5 rounded-lg transition ${
                          u.status === 'ACTIVE'
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {u.status === 'ACTIVE' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Tạo Tài Khoản Người Dùng Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Họ và tên người dùng *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Thầy Trần Quốc Tuấn..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: tuantq hoặc gvcn9a2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Vai trò (Role) *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="HIEU_TRUONG">Hiệu trưởng</option>
                  <option value="PHO_HIEU_TRUONG">Phó Hiệu trưởng</option>
                  <option value="TONG_PHU_TRACH">Tổng phụ trách</option>
                  <option value="GIAM_THI">Giám thị</option>
                  <option value="GVCN">Giáo viên chủ nhiệm (GVCN)</option>
                  <option value="TO_TRUONG">Tổ trưởng</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              {/* Class requirement for GVCN & TO_TRUONG */}
              {(selectedRole === 'GVCN' || selectedRole === 'TO_TRUONG') && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Lớp phân công (Bắt buộc) *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        Lớp {c.name} (Khối {c.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group requirement for TO_TRUONG */}
              {selectedRole === 'TO_TRUONG' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tổ phân công (Bắt buộc) *
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={`group-${selectedClassId}-${num}`}>
                        Tổ {num}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" /> Đặt Lại Mật Khẩu
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Tài khoản: <strong>@{showResetModal.username}</strong> ({showResetModal.displayName})
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetModal(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmResetPassword}
                disabled={newPassword.length < 6}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Lưu mật khẩu mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" /> Sửa Thông Tin Tài Khoản: @{showEditModal.username}
              </h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Họ và tên người dùng *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 uppercase">
                      Tên đăng nhập (Username) *
                    </label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Admin sửa
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Nhập username..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                    {editUsername.toLowerCase() !== showEditModal.username.toLowerCase() ? (
                      <span className="text-amber-700 font-semibold">
                        ⚠️ Đổi sang @{editUsername.toLowerCase()} &amp; tự động xóa user cũ khỏi data.
                      </span>
                    ) : (
                      'Cho phép Admin đổi username tự do. Khi đổi sẽ tự xóa user cũ.'
                    )}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="ACTIVE">Hoạt động (Active)</option>
                    <option value="LOCKED">Bị khóa (Locked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Vai trò phân quyền *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="GVCN">Giáo viên chủ nhiệm (GVCN)</option>
                  <option value="TO_TRUONG">Tổ trưởng (Học sinh)</option>
                  <option value="TONG_PHU_TRACH">Tổng phụ trách</option>
                  <option value="GIAM_THI">Giám thị</option>
                  <option value="PHO_HIEU_TRUONG">Phó Hiệu trưởng</option>
                  <option value="HIEU_TRUONG">Hiệu trưởng</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              {/* Class requirement for GVCN or TO_TRUONG */}
              {(editRole === 'GVCN' || editRole === 'TO_TRUONG') && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Lớp phân công (Bắt buộc) *
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        Lớp {c.name} (Khối {c.grade}) {c.homeroomTeacherName ? `- GVCN: ${c.homeroomTeacherName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group requirement for TO_TRUONG */}
              {editRole === 'TO_TRUONG' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tổ phân công (Bắt buộc) *
                  </label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={`group-${editClassId}-${num}`}>
                        Tổ {num}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional password update */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Đổi mật khẩu mới (Tùy chọn)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Để trống nếu không muốn đổi mật khẩu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
