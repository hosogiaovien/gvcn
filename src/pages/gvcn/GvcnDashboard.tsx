import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Flame,
  CheckSquare,
  BarChart3,
  QrCode,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Calendar,
  KeyRound,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { rankingService } from '../../services/rankingService';
import {
  Student,
  Group,
  CompetitionTransaction,
  StudentRankItem,
  GroupRankItem,
  ClassRoom,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { QRCodeModal } from '../../components/QRCodeModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export const GvcnDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>(currentUser?.classId || 'class-9a1');

  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [studentRanks, setStudentRanks] = useState<StudentRankItem[]>([]);
  const [groupRanks, setGroupRanks] = useState<GroupRankItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [classShareToken, setClassShareToken] = useState('tk_9a1_banlong_2026x98q');

  const loadData = async () => {
    const [allCls, cls, stList, grpList, txList, shareConfig] = await Promise.all([
      dbService.getClasses(),
      dbService.getClassById(classId),
      dbService.getStudents(classId),
      dbService.getGroups(classId),
      dbService.getTransactions(classId),
      dbService.getPublicShareByClassId(classId),
    ]);

    setClasses(allCls);
    if (cls) setCurrentClass(cls);
    setStudents(stList);
    setGroups(grpList);
    setTransactions(txList);

    const sRanks = rankingService.calculateStudentRankings(stList, txList);
    setStudentRanks(sRanks);
    setGroupRanks(rankingService.calculateGroupRankings(grpList, sRanks));

    if (shareConfig) {
      setClassShareToken(shareConfig.token);
      setShareUrl(`${window.location.origin}/public/${shareConfig.token}`);
    } else {
      const fallbackToken = `tk_${cls?.name.toLowerCase() || '9a1'}_banlong_2026`;
      setClassShareToken(fallbackToken);
      setShareUrl(`${window.location.origin}/public/${fallbackToken}`);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  useEffect(() => {
    if (currentUser?.role === 'GVCN' && currentUser.classId && classId !== currentUser.classId) {
      setClassId(currentUser.classId);
    }
  }, [currentUser]);

  const pendingApprovals = transactions.filter((t) => t.status === 'PENDING');
  const todayDate = new Date().toISOString().split('T')[0];
  const todayViolations = transactions.filter((t) => t.date === todayDate && t.type === 'MINUS');
  const topStudents = studentRanks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> GVCN &bull; Lớp {currentClass?.name || '9A1'}
              </span>
              {currentUser?.role === 'ADMIN' && classes.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition">
                  <span className="text-amber-300 font-bold">Admin - Đổi Lớp:</span>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId} className="text-slate-900">
                        Lớp {c.name} ({c.homeroomTeacherName || 'GVCN'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Bảng Điều Khiển Thi Đua Lớp {currentClass?.name || '9A1'}
            </h1>
            <p className="text-indigo-100 text-sm md:text-base mt-2 max-w-2xl font-medium leading-relaxed">
              {currentClass?.homeroomTeacherName ? `GVCN: ${currentClass.homeroomTeacherName} • ` : ''}
              Năm học 2026–2027 &bull; Trường TH&amp;THCS BÀN LONG &bull; Sĩ số: {students.length} học sinh (4 tổ thi đua)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Đổi mật khẩu tài khoản cá nhân của bạn"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Đổi Pass</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGroupStatsModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
              title="Mở bảng báo cáo thống kê thi đua 4 tổ của lớp"
            >
              <BarChart3 className="w-4 h-4 text-white" />
              <span>📊 Thống Kê Theo Tổ</span>
            </button>
            <Link
              to="/gvcn/competition"
              className="px-4 py-2.5 bg-white text-indigo-700 font-bold text-xs rounded-xl shadow-lg hover:bg-indigo-50 transition flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-orange-500" /> Chấm Thi Đua Ngay
            </Link>
            <button
              onClick={() => setShowQR(true)}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title={`Xem mã QR riêng của lớp ${currentClass?.name || '9A1'}`}
            >
              <QrCode className="w-4 h-4 text-amber-300" /> Mã QR Lớp {currentClass?.name || '9A1'}
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sĩ số lớp</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{students.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">4 tổ &bull; 100% chuyên cần</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duyệt điểm</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">{pendingApprovals.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">
            {pendingApprovals.length > 0 ? (
              <Link to="/gvcn/approvals" className="text-indigo-600 font-semibold hover:underline">
                Duyệt {pendingApprovals.length} yêu cầu ngay &rarr;
              </Link>
            ) : (
              'Không có yêu cầu chờ'
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vi phạm hôm nay</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">{todayViolations.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Lượt ghi nhận trong ngày</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng lượt chấm</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{transactions.length}</div>
          <div className="text-sm text-emerald-700 font-semibold mt-1.5">Đang cập nhật thời gian thực</div>
        </div>
      </div>

      {/* Main Grid: Group Leaderboard & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Group Leaderboard */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Bảng Xếp Hạng 4 Tổ
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGroupStatsModal(true)}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                title="Mở phân tích thống kê 4 tổ"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Thống kê tổ
              </button>
              <span className="text-slate-300">&bull;</span>
              <Link to="/gvcn/groups" className="text-xs text-slate-500 font-semibold hover:underline">
                Chi tiết
              </Link>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {groupRanks.map((grp) => (
              <div
                key={grp.groupId}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      grp.rank === 1
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : grp.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : grp.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{grp.rank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{grp.groupName}</div>
                    <div className="text-xs text-slate-500 font-medium">{grp.memberCount} thành viên</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-slate-900">
                    {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                  </div>
                  <div className="text-xs text-slate-500 font-medium">TB: {grp.averagePoints} đ/HS</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle & Right: Top Students */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> Top Học Sinh Xuất Sắc Tuần Này
            </h3>
            <Link to="/gvcn/ranking" className="text-xs text-indigo-600 font-semibold hover:underline">
              Xem toàn bộ 40 HS &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Hạng</th>
                  <th className="pb-3">Học sinh</th>
                  <th className="pb-3">Tổ</th>
                  <th className="pb-3 text-center">Điểm cộng</th>
                  <th className="pb-3 text-center">Điểm trừ</th>
                  <th className="pb-3 text-right pr-2">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topStudents.map((st) => (
                  <tr
                    key={st.studentId}
                    onClick={() => {
                      const found = students.find((s) => s.studentId === st.studentId);
                      if (found) setSelectedStudent(found);
                    }}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 pl-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                          st.rank === 1
                            ? 'bg-amber-100 text-amber-800'
                            : st.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : st.rank === 3
                            ? 'bg-amber-800/20 text-amber-900'
                            : 'text-slate-500'
                        }`}
                      >
                        {st.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900 hover:text-indigo-600 transition">
                        {st.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.studentCode}</div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{st.groupName}</td>
                    <td className="py-3 text-center text-emerald-600 font-bold">+{st.plusPoints}</td>
                    <td className="py-3 text-center text-rose-600 font-bold">-{st.minusPoints}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                        {st.totalPoints > 0 ? `+${st.totalPoints}` : st.totalPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> Hoạt Động Thi Đua Gần Đây
          </h3>
          <Link to="/gvcn/competition" className="text-xs text-indigo-600 font-semibold hover:underline">
            Vào sổ chấm
          </Link>
        </div>

        <div className="space-y-2.5">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.transactionId}
              onClick={() => {
                const found = students.find((s) => s.studentId === tx.studentId);
                if (found) setSelectedStudent(found);
              }}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/60 cursor-pointer transition flex items-center justify-between text-xs group"
              title="Bấm để xem chi tiết thi đua của học sinh này"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    tx.type === 'PLUS' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {tx.studentName}
                  </span>{' '}
                  <span className="text-slate-500">({tx.groupName})</span> &bull;{' '}
                  <span className="text-slate-700">{tx.criterionName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    tx.type === 'PLUS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {tx.points > 0 ? `+${tx.points}` : tx.points}
                </span>
                <span className="text-slate-400 text-[11px]">{tx.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student detail modal */}
      <StudentDetailModal
        student={selectedStudent}
        transactions={transactions}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Group statistics modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={classId}
        className={currentClass?.name || '9A1'}
      />

      {/* QR Code modal */}
      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        token={classShareToken}
        className={currentClass?.name || '9A1'}
        shareUrl={shareUrl || `${window.location.origin}/public/${classShareToken}`}
      />

      {/* Change Password modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
