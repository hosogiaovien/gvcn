import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  School,
  GraduationCap,
  Award,
  FileSpreadsheet,
  Settings,
  History,
  ShieldAlert,
  BarChart3,
  CheckSquare,
  QrCode,
  Flame,
  CheckCircle,
  FolderTree,
  UserCheck,
  X,
  ExternalLink,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../permissions';
import { ChangePasswordModal } from './ChangePasswordModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const role = currentUser?.role || 'GVCN';
  const classShort = currentUser?.classId ? currentUser.classId.replace('class-', '') : '9a1';
  const publicShareLink =
    classShort === '9a1'
      ? '/public/tk_9a1_banlong_2026x98q'
      : `/public/tk_${classShort}_banlong_2026`;

  // Navigation items grouped by role
  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Dashboard Quản Trị', icon: LayoutDashboard, end: true },
          { to: '/admin/users', label: 'Quản Lý Người Dùng', icon: Users },
          { to: '/admin/weeks', label: 'Cấu Hình Tuần Toàn Trường', icon: Calendar },
          { to: '/admin/classes', label: 'Quản Lý Khối & Lớp', icon: School },
          { to: '/admin/students', label: 'Học Sinh Toàn Trường', icon: GraduationCap },
          { to: '/admin/criteria', label: 'Tiêu Chí Thi Đua', icon: Award },
          { to: '/admin/audit', label: 'Nhật Ký Hệ Thống (Audit)', icon: History },
          { to: '/admin/settings', label: 'Cấu Hình & Tie-Break', icon: Settings },
        ];

      case 'HIEU_TRUONG':
      case 'PHO_HIEU_TRUONG':
        return [
          { to: '/school', label: 'Tổng Quan Toàn Trường', icon: LayoutDashboard, end: true },
          { to: '/school/ranking', label: 'Xếp Hạng Các Lớp', icon: Award },
          { to: '/school/classes', label: 'Danh Sách Lớp & HS', icon: School },
          { to: '/school/violations', label: 'Thống Kê Vi Phạm', icon: ShieldAlert },
          { to: '/school/summaries', label: 'Tổng Kết Tuần / Tháng', icon: BarChart3 },
          { to: '/school/reports', label: 'Báo Cáo & In Ấn', icon: FileSpreadsheet },
        ];

      case 'TONG_PHU_TRACH':
        return [
          { to: '/school', label: 'Bàn Làm Việc TPT', icon: LayoutDashboard, end: true },
          { to: '/school/ranking', label: 'Bảng Thi Đua Toàn Trường', icon: Award },
          { to: '/school/violations', label: 'Ghi Nhận & Vi Phạm', icon: ShieldAlert },
          { to: '/school/classes', label: 'Kiểm Tra Các Lớp', icon: School },
          { to: '/school/summaries', label: 'Tổng Kết Thi Đua', icon: BarChart3 },
        ];

      case 'GIAM_THI':
        return [
          { to: '/school', label: 'Tổng Quan Nề Nếp', icon: LayoutDashboard, end: true },
          { to: '/school/violations', label: 'Ghi Nhận Vi Phạm Học Sinh', icon: ShieldAlert },
          { to: '/school/classes', label: 'Tra Cứu Học Sinh', icon: GraduationCap },
          { to: '/school/ranking', label: 'Theo Dõi Xếp Hạng', icon: Award },
        ];

      case 'GVCN':
        return [
          { to: '/gvcn', label: `Tổng Quan Lớp ${classShort.toUpperCase()}`, icon: LayoutDashboard, end: true },
          { to: '/gvcn/competition', label: 'Chấm Thi Đua Nhanh', icon: Flame },
          { to: '/gvcn/students', label: `Danh Sách Học Sinh (${classShort.toUpperCase()})`, icon: GraduationCap },
          { to: '/gvcn/groups', label: 'Quản Lý 4 Tổ', icon: FolderTree },
          { to: '/gvcn/ranking', label: 'Bảng Xếp Hạng Lớp', icon: Award },
          { to: '/gvcn/approvals', label: 'Duyệt Điểm Tổ Trưởng', icon: CheckSquare },
          { to: '/gvcn/weekly', label: 'Tổng Kết Tuần (Snapshot)', icon: BarChart3 },
          { to: '/gvcn/monthly', label: 'Tổng Kết Tháng', icon: Calendar },
          { to: '/gvcn/criteria', label: 'Tiêu Chí Lớp', icon: Settings },
          { to: '/gvcn/share', label: 'Mã QR & Link Phụ Huynh', icon: QrCode },
        ];

      case 'TO_TRUONG':
        return [
          { to: '/to-truong', label: 'Bàn Làm Việc Tổ Trưởng', icon: LayoutDashboard, end: true },
          { to: '/to-truong/score', label: 'Ghi Nhận Điểm / Vi Phạm', icon: Flame },
          { to: '/to-truong/members', label: 'Thành Viên Trong Tổ', icon: Users },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand / User Badge */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              TĐ
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wide">THI ĐUA LỚP</div>
              <div className="text-[11px] text-indigo-400 font-medium">Bản Quyền Học Đường</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Banner */}
        <div className="p-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
            Không gian làm việc
          </div>
          <div className="font-bold text-xs text-white truncate">
            {currentUser?.displayName || 'Khách'}
          </div>
          <div className="mt-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                role ? ROLE_BADGE_COLORS[role] : 'bg-slate-700 text-slate-300'
              }`}
            >
              {role ? ROLE_LABELS[role] : 'Chưa đăng nhập'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
            Menu chức năng
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Parent Portal quick link button for specific class */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {role === 'GVCN' && (
            <NavLink
              to={publicShareLink}
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-700/50 text-xs font-medium transition group cursor-pointer"
              title={`Mở Cổng Phụ Huynh lớp ${classShort.toUpperCase()}`}
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Link PH Lớp {classShort.toUpperCase()}</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </NavLink>
          )}
          {role === 'ADMIN' && (
            <NavLink
              to="/gvcn/share"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-700/50 text-xs font-medium transition group cursor-pointer"
              title="Xem danh sách mã QR & link phụ huynh 10 lớp"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Mã QR &amp; Link 10 Lớp</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </NavLink>
          )}

          {/* User profile & Actions */}
          {currentUser && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 text-xs">
                <div className="truncate mr-2">
                  <div className="font-bold text-white truncate text-[11px]">{currentUser.displayName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition shrink-0 cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nút Đổi mật khẩu cá nhân cho mọi vai trò */}
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Đổi Mật Khẩu Cá Nhân</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
