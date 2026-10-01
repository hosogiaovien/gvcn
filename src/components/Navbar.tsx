import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronDown,
  User,
  GraduationCap,
  Sparkles,
  School as SchoolIcon,
  KeyRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../permissions';
import { Role, ClassRoom } from '../types';
import { dbService } from '../services/dbService';
import { isFirebaseConfigured, activeConfig } from '../firebase/config';
import { FirebaseSetupModal } from './FirebaseSetupModal';
import { ChangePasswordModal } from './ChangePasswordModal';

interface Props {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<Props> = ({ onToggleSidebar }) => {
  const { currentUser, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGvcnClasses, setShowGvcnClasses] = useState(false);
  const [showGvcnPickerModal, setShowGvcnPickerModal] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      const cls = await dbService.getClasses();
      setClasses(cls);
    };
    loadClasses();
  }, []);

  const availableRoles: Role[] = [
    'ADMIN',
    'HIEU_TRUONG',
    'PHO_HIEU_TRUONG',
    'TONG_PHU_TRACH',
    'GIAM_THI',
    'GVCN',
    'TO_TRUONG',
  ];

  const currentClassObj = classes.find((c) => c.classId === currentUser?.classId);
  const isAdminActing = currentUser?.role === 'ADMIN' || sessionStorage.getItem('thidua_admin_acting') === 'true';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6 shadow-xs">
        {/* Left: Mobile toggle + School brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm md:text-base leading-tight">
                  TH&amp;THCS BÀN LONG
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                  2026–2027
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Hệ Thống Quản Lý Thi Đua Học Đường
              </p>
            </div>
          </div>
        </div>

        {/* Right: DB Status + Role switcher (Admin only) + Change Password + Logout */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Firebase Connection Pill */}
          <button
            onClick={() => setShowFirebaseModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isFirebaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Nhấn để cấu hình Firebase hoặc khởi tạo dữ liệu mẫu"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isFirebaseConfigured ? 'Firebase' : 'Demo Mode'}
            </span>
            {isFirebaseConfigured ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Role Switcher - ONLY FOR ADMIN */}
          {isAdminActing && (
            <div className="relative flex items-center gap-1.5">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition border border-indigo-200 cursor-pointer shadow-2xs"
                title="Chỉ Quản trị viên (Admin) mới có quyền chuyển vai trò"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Admin xem:</span>
                <span className="max-w-[140px] truncate font-black text-indigo-700">
                  {currentUser?.role === 'GVCN'
                    ? `GVCN Lớp ${currentClassObj?.name || '9A1'}`
                    : currentUser?.role
                    ? ROLE_LABELS[currentUser.role]?.split('(')[0]
                    : 'Admin'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Quick Class switcher in navbar if Admin is viewing as GVCN */}
              {currentUser?.role === 'GVCN' && classes.length > 0 && (
                <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-bold text-amber-900">Lớp:</span>
                  <select
                    value={currentUser.classId}
                    onChange={(e) => {
                      switchDemoUser('GVCN', e.target.value);
                      navigate('/gvcn');
                    }}
                    className="bg-transparent font-black text-amber-900 focus:outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.name} {c.homeroomTeacherName ? `- ${c.homeroomTeacherName}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowGvcnPickerModal(true)}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] transition cursor-pointer"
                    title="Mở bảng chọn chi tiết 10 lớp"
                  >
                    Đổi Lớp
                  </button>
                </div>
              )}

              {currentUser?.role !== 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => {
                    switchDemoUser('ADMIN');
                    navigate('/admin');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Trở về tài khoản Quản Trị Viên (Admin)"
                >
                  <span>&larr; Về Admin</span>
                </button>
              )}

              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in max-h-[85vh] overflow-y-auto">
                  <div className="px-3.5 py-2 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 flex items-center justify-between">
                    <span>Quyền Admin: Chuyển đổi vai trò</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Chọn lớp / vai trò</span>
                  </div>

                  {availableRoles.map((r) => {
                    if (r === 'GVCN') {
                      return (
                        <div key={r} className="border-b border-slate-100 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowGvcnPickerModal(true);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                              currentUser?.role === 'GVCN'
                                ? 'font-bold text-indigo-600 bg-indigo-50/50'
                                : 'text-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-indigo-600" />
                              <span>Giáo viên chủ nhiệm (Chọn 1 trong 10 Lớp)</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                              Chọn Lớp &rarr;
                            </span>
                          </button>

                          {/* 10 Classes Grid inside dropdown */}
                          <div className="bg-slate-50 p-2.5 mx-2 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Chọn Lớp Ngay (Admin có đủ quyền GVCN):</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {classes.map((c) => {
                                const isSelected =
                                  currentUser?.role === 'GVCN' && currentUser?.classId === c.classId;
                                return (
                                  <button
                                    key={c.classId}
                                    type="button"
                                    onClick={() => {
                                      switchDemoUser('GVCN', c.classId);
                                      setShowRoleMenu(false);
                                      navigate('/gvcn');
                                    }}
                                    className={`p-2 text-left text-xs rounded-lg transition border flex flex-col cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                                        : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-extrabold">Lớp {c.name}</span>
                                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span
                                      className={`text-[10px] truncate ${
                                        isSelected ? 'text-indigo-100' : 'text-slate-500'
                                      }`}
                                    >
                                      {c.homeroomTeacherName || 'GVCN'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchDemoUser(r);
                          setShowRoleMenu(false);
                          if (r === 'ADMIN') {
                            navigate('/admin');
                          } else {
                            navigate('/school');
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          currentUser?.role === r ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{ROLE_LABELS[r]}</span>
                        {currentUser?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Current User Badge & Actions */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</div>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${
                  currentUser.role ? ROLE_BADGE_COLORS[currentUser.role] : 'bg-slate-100 text-slate-700'
                }`}
                title={currentUser.displayName}
              >
                {currentUser.displayName.charAt(0)}
              </div>

              {/* Nút Đổi Mật Khẩu (Cho mọi vai trò) */}
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                title="Đổi mật khẩu tài khoản của bạn"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Đổi pass</span>
              </button>

              {/* Nút Đăng Xuất */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Setup modal */}
      <FirebaseSetupModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />

      {/* Change Password modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Admin Select GVCN Class Modal */}
      {showGvcnPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Chọn Lớp Chủ Nhiệm Cho Quản Trị Viên (Admin)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Admin sẽ có toàn quyền như Giáo viên chủ nhiệm của lớp đã chọn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGvcnPickerModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="p-4 mx-5 my-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Quyền hạn GVCN bao gồm:</strong> Chấm điểm thi đua nhanh, kiểm tra và duyệt điểm của 4 tổ trưởng, quản lý danh sách học sinh (thêm, sửa, xóa, excel), chốt sổ tổng kết tuần/tháng, và tạo mã QR chia sẻ cho phụ huynh lớp đó.
              </div>
            </div>

            {/* 10 Classes Grid by Grades */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {[6, 7, 8, 9].map((grade) => {
                const gradeClasses = classes.filter((c) => c.grade === grade);
                if (gradeClasses.length === 0) return null;
                return (
                  <div key={grade} className="space-y-2">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      Khối {grade} ({gradeClasses.length} lớp)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {gradeClasses.map((cls) => {
                        const isCurrent =
                          currentUser?.role === 'GVCN' && currentUser.classId === cls.classId;
                        return (
                          <div
                            key={cls.classId}
                            onClick={() => {
                              switchDemoUser('GVCN', cls.classId);
                              setShowGvcnPickerModal(false);
                              navigate('/gvcn');
                            }}
                            className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between group ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                                : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-base font-black ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                                  Lớp {cls.name}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700">
                                    Đang làm GVCN
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 ${isCurrent ? 'text-indigo-100' : 'text-slate-600'}`}>
                                GVCN: <strong>{cls.homeroomTeacherName || 'Chưa phân công'}</strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs ${
                                isCurrent
                                  ? 'bg-white text-indigo-700'
                                  : 'bg-indigo-600 text-white group-hover:bg-indigo-700'
                              }`}
                            >
                              <span>{isCurrent ? 'Đang chọn' : 'Làm GVCN'}</span>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Bạn có thể quay lại quyền Quản Trị Viên (Admin) bất cứ lúc nào qua nút trên thanh điều hướng.
              </span>
              <button
                type="button"
                onClick={() => setShowGvcnPickerModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
