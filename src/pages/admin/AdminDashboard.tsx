import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  School,
  GraduationCap,
  Sparkles,
  Database,
  Lock,
  History,
  Settings,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Award,
  Trophy,
  Eye,
  Search,
  Filter,
  TrendingUp,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { rankingService } from '../../services/rankingService';
import { useNotification } from '../../context/NotificationContext';
import { UserProfile, ClassRoom, Student, CompetitionTransaction, Group, GroupRankItem } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { AdminResetModal } from '../../components/AdminResetModal';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [seeding, setSeeding] = useState(false);

  // Class Selection for Admin
  const [selectedClassId, setSelectedClassId] = useState<string>('class-9a1');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classGroups, setClassGroups] = useState<Group[]>([]);
  const [classGroupRanks, setClassGroupRanks] = useState<GroupRankItem[]>([]);
  const [classTxs, setClassTxs] = useState<CompetitionTransaction[]>([]);
  const [classGroupFilter, setClassGroupFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const loadData = async () => {
    const [uList, cList, sList, tList] = await Promise.all([
      dbService.getUsers(),
      dbService.getClasses(),
      dbService.getStudents(),
      dbService.getTransactions(),
    ]);
    setUsers(uList);
    setClasses(cList);
    setStudents(sList);
    setTransactions(tList);
  };

  const loadClassData = async (cId: string) => {
    try {
      const [stList, grpList, txList] = await Promise.all([
        dbService.getStudents(cId),
        dbService.getGroups(cId),
        dbService.getTransactions(cId),
      ]);
      setClassStudents(stList);
      setClassGroups(grpList);
      setClassTxs(txList);

      const sRanks = rankingService.calculateStudentRankings(stList, txList);
      const gRanks = rankingService.calculateGroupRankings(grpList, sRanks);
      setClassGroupRanks(gRanks);
    } catch (e) {
      console.error('Error loading class data for admin:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
      if (selectedClassId) {
        loadClassData(selectedClassId);
      }
    };
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const lockedUsersCount = users.filter((u) => u.status === 'LOCKED').length;
  const currentClassObj = classes.find((c) => c.classId === selectedClassId) || {
    name: '9A1',
    grade: 9,
    classId: 'class-9a1',
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await dbService.seedAllToFirestore();
      if (res.success) {
        showToast(`Đã đẩy thành công ${res.count} dữ liệu vào Cloud Firestore!`, 'success');
        await loadData();
        if (selectedClassId) await loadClassData(selectedClassId);
      } else {
        showToast(res.error || 'Lỗi khi khởi tạo', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const filteredClassStudents = classStudents
    .filter((s) => {
      if (classGroupFilter !== 'ALL' && s.groupId !== classGroupFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return s.fullName.toLowerCase().includes(term) || s.studentCode.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-indigo-800 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" /> Quyền Quản Trị Hệ Thống (ADMIN)
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Trung Tâm Quản Trị Toàn Diện
          </h1>
          <p className="text-rose-100 text-xs md:text-sm mt-1">
            Quản lý tài khoản, phân quyền 7 vai trò, giám sát thi đua từng lớp &amp; xem báo cáo theo tổ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 bg-white text-rose-800 font-bold text-xs rounded-xl shadow-lg hover:bg-rose-50 transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Quản Lý Người Dùng
          </Link>
          <Link
            to="/admin/weeks"
            className="px-4 py-2.5 bg-indigo-900/90 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl border border-indigo-300/30 shadow-lg transition flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-indigo-300" /> Cấu Hình Tuần Trường
          </Link>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-950 text-white font-bold text-xs rounded-xl border border-rose-400/40 transition flex items-center gap-1.5 shadow-sm"
            title="Reset điểm thi đua về 0 theo lớp và khoảng thời gian"
          >
            <RotateCcw className="w-4 h-4 text-rose-300" />
            <span>Reset Điểm Thi Đua</span>
          </button>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-4 py-2.5 bg-rose-900/60 hover:bg-rose-900/80 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{seeding ? 'Đang đẩy dữ liệu...' : 'Đẩy Seed vào Firestore'}</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng tài khoản</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{users.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Đủ 7 vai trò hệ thống</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tài khoản bị khóa</span>
          <div className="text-3xl font-black text-rose-600 mt-2">{lockedUsersCount}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">
            {lockedUsersCount > 0 ? 'Cần kiểm tra' : 'Tất cả đang hoạt động'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng lớp &amp; khối</span>
          <div className="text-3xl font-black text-indigo-600 mt-2">{classes.length} Lớp</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Khối 6, 7, 8, 9</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng lượt thi đua</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">{transactions.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Bản ghi trong cơ sở dữ liệu</div>
        </div>
      </div>

      {/* Role Distribution Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Phân Bố Tài Khoản Theo Vai Trò (RBAC)
          </h3>
          <Link to="/admin/users" className="text-xs text-indigo-600 font-semibold hover:underline">
            Quản lý chi tiết &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
          {[
            { role: 'ADMIN', label: 'Admin', count: users.filter((u) => u.role === 'ADMIN').length, color: 'bg-red-50 text-red-700 border-red-200' },
            { role: 'HIEU_TRUONG', label: 'Hiệu trưởng', count: users.filter((u) => u.role === 'HIEU_TRUONG').length, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { role: 'PHO_HIEU_TRUONG', label: 'Phó HT', count: users.filter((u) => u.role === 'PHO_HIEU_TRUONG').length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { role: 'TONG_PHU_TRACH', label: 'Tổng PT', count: users.filter((u) => u.role === 'TONG_PHU_TRACH').length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { role: 'GIAM_THI', label: 'Giám thị', count: users.filter((u) => u.role === 'GIAM_THI').length, color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { role: 'GVCN', label: 'GVCN', count: users.filter((u) => u.role === 'GVCN').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { role: 'TO_TRUONG', label: 'Tổ trưởng', count: users.filter((u) => u.role === 'TO_TRUONG').length, color: 'bg-sky-50 text-sky-700 border-sky-200' },
          ].map((item) => (
            <div key={item.role} className={`p-3 rounded-xl border ${item.color}`}>
              <div className="text-2xl font-black">{item.count}</div>
              <div className="text-[11px] font-bold mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CLASS SELECTION & GROUP OVERVIEW SECTION FOR ADMIN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-7 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase mb-2">
              <School className="w-3.5 h-3.5" /> Giám Sát Chi Tiết Thi Đua Theo Lớp
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Xem Thi Đua Lớp: <span className="text-indigo-600">{currentClassObj?.name}</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
              Admin có thể chọn bất kỳ lớp nào trong trường để xem tổng quát 4 tổ và bấm vào từng học sinh để xem thành tích
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase hidden sm:inline">Chọn lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setClassGroupFilter('ALL');
                }}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none cursor-pointer shadow-2xs"
              >
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    Lớp {c.name} (Khối {c.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTON "THỐNG KÊ THEO TỔ" */}
            <button
              type="button"
              onClick={() => setShowGroupStatsModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-md transition flex items-center gap-2"
              title="Mở bảng thống kê thi đua tổng quát 4 tổ của lớp này"
            >
              <BarChart3 className="w-4 h-4 text-amber-300" />
              <span>📊 Thống Kê Theo Tổ Của Lớp</span>
            </button>
          </div>
        </div>

        {/* 4 Groups Preview of the selected class */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Tổng Quát 4 Tổ Thi Đua Lớp {currentClassObj?.name}
            </h3>
            <button
              onClick={() => setShowGroupStatsModal(true)}
              className="text-xs md:text-sm text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Xem báo cáo phân tích tổ chi tiết &rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {classGroupRanks.map((grp) => {
              const isSelected = classGroupFilter === grp.groupId;
              return (
                <div
                  key={grp.groupId}
                  onClick={() => setClassGroupFilter(isSelected ? 'ALL' : grp.groupId)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-center ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/50 shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm mb-1.5 ${
                      grp.rank === 1
                        ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                        : grp.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : grp.rank === 3
                        ? 'bg-amber-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{grp.rank}
                  </span>
                  <div className="font-bold text-base md:text-lg text-slate-900">{grp.groupName}</div>
                  <div className="text-xs md:text-sm text-slate-600 font-semibold mt-0.5">
                    {grp.memberCount} học sinh &bull; TB: {grp.averagePoints} đ
                  </div>
                  <div className="text-base md:text-lg font-black text-indigo-700 mt-1.5">
                    {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                  </div>
                  <div className="text-[11px] font-bold text-indigo-600 mt-1">
                    {isSelected ? 'Đang lọc học sinh' : 'Bấm để lọc học sinh'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Table of Selected Class */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>
                  Danh Sách Học Sinh Lớp {currentClassObj?.name}
                  {classGroupFilter !== 'ALL' && ` (${classGroups.find((g) => g.groupId === classGroupFilter)?.name})`}
                </span>
                <span className="text-xs md:text-sm font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {filteredClassStudents.length} HS
                </span>
              </h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                💡 Bấm vào bất kỳ học sinh nào bên dưới để xem toàn bộ thành tích thi đua, chi tiết khen thưởng và vi phạm
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none w-44 sm:w-56"
                />
              </div>

              {classGroupFilter !== 'ALL' && (
                <button
                  onClick={() => setClassGroupFilter('ALL')}
                  className="text-xs md:text-sm font-bold text-indigo-600 hover:underline"
                >
                  &larr; Tất cả 4 tổ
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm md:text-base">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs md:text-sm">
                  <tr>
                    <th className="py-3.5 pl-4 w-14">Hạng</th>
                    <th className="py-3.5 w-24">Mã HS</th>
                    <th className="py-3.5">Họ và tên học sinh</th>
                    <th className="py-3.5 w-24">Tổ</th>
                    <th className="py-3.5 text-center text-emerald-700 w-28">Điểm cộng (+)</th>
                    <th className="py-3.5 text-center text-rose-700 w-28">Điểm trừ (-)</th>
                    <th className="py-3.5 text-center w-28">Tổng điểm</th>
                    <th className="py-3.5 text-right pr-4 w-32">Thành tích</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClassStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        Không có học sinh nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredClassStudents.map((st, idx) => (
                      <tr
                        key={st.studentId}
                        onClick={() => setSelectedStudentForModal(st)}
                        className="hover:bg-indigo-50/60 cursor-pointer transition"
                        title="Bấm để xem toàn bộ thành tích thi đua của học sinh này"
                      >
                        <td className="py-3.5 pl-4">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                              idx === 0
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-800 text-white'
                                : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-xs md:text-sm text-slate-600 font-semibold">
                          {st.studentCode}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-slate-900 text-base hover:text-indigo-600 transition flex items-center gap-2">
                            <span>{st.fullName}</span>
                            {st.groupRole === 'LEADER' && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Tổ trưởng
                              </span>
                            )}
                          </div>
                          {st.dateOfBirth && (
                            <div className="text-xs text-slate-500 font-medium">
                              NS: {st.dateOfBirth} &bull; {st.gender === 'NAM' ? 'Nam' : 'Nữ'}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs md:text-sm rounded-lg">
                            {st.groupName || st.groupId}
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-emerald-700 text-sm md:text-base">
                          +{st.plusPoints || 0}
                        </td>
                        <td className="py-3.5 text-center font-bold text-rose-700 text-sm md:text-base">
                          -{st.minusPoints || 0}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-sm md:text-base">
                            {(st.totalPoints ?? 0) > 0 ? `+${st.totalPoints}` : st.totalPoints ?? 0} đ
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentForModal(st);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs md:text-sm transition flex items-center gap-1.5 ml-auto border border-indigo-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={classTxs}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
      />

      {/* Group Statistics Modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={selectedClassId}
        className={currentClassObj?.name || '9A1'}
      />

      {/* Admin Reset Modal */}
      <AdminResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        initialClassId={selectedClassId}
        onSuccess={() => {
          loadData();
          if (selectedClassId) loadClassData(selectedClassId);
        }}
      />
    </div>
  );
};
