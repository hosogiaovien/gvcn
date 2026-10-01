import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  UserCheck,
  BarChart3,
  Eye,
  Trophy,
  TrendingUp,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { rankingService } from '../../services/rankingService';
import { Student, Group, CompetitionTransaction, GroupRankItem, ClassRoom } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export const GroupLeaderDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const classId = currentUser?.classId || 'class-9a1';
  const groupId = currentUser?.groupId || 'group-1';

  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [members, setMembers] = useState<Student[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [groupObj, setGroupObj] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<CompetitionTransaction[]>([]);
  const [groupRank, setGroupRank] = useState<GroupRankItem | null>(null);
  const [allGroupRanks, setAllGroupRanks] = useState<GroupRankItem[]>([]);

  // Modals
  const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const loadData = async () => {
    const [allStudents, grpList, allTxs, cls] = await Promise.all([
      dbService.getStudents(classId),
      dbService.getGroups(classId),
      dbService.getTransactions(classId),
      dbService.getClassById(classId),
    ]);

    if (cls) setCurrentClass(cls);

    const myMembers = allStudents.filter((s) => s.groupId === groupId);
    const myGroup = grpList.find((g) => g.groupId === groupId) || null;
    const groupTxs = allTxs.filter((t) => t.groupId === groupId);

    setMembers(myMembers);
    setAllGroups(grpList);
    setGroupObj(myGroup);
    setTransactions(groupTxs);
    setAllTransactions(allTxs);

    const sRanks = rankingService.calculateStudentRankings(allStudents, allTxs);
    const gRanks = rankingService.calculateGroupRankings(grpList, sRanks);
    setAllGroupRanks(gRanks);
    const myRank = gRanks.find((g) => g.groupId === groupId) || null;
    setGroupRank(myRank);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [groupId, classId]);

  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <UserCheck className="w-3.5 h-3.5" /> Tổ Trưởng Thi Đua &bull; {groupObj?.name || 'Tổ 1'}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Bàn Làm Việc Tổ Trưởng {groupObj?.name || 'Tổ 1'}
          </h1>
          <p className="text-sky-50 text-sm md:text-base mt-2 font-medium leading-relaxed">
            Lớp {currentClass?.name || '9A1'} &bull; Trường TH&amp;THCS BÀN LONG &bull; Sĩ số tổ: {members.length} học sinh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs md:text-sm rounded-xl border border-white/30 backdrop-blur-md transition flex items-center gap-2 shadow-xs cursor-pointer"
            title="Đổi mật khẩu tài khoản cá nhân của bạn"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>Đổi Mật Khẩu Cá Nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs md:text-sm rounded-xl border border-white/30 backdrop-blur-md transition flex items-center gap-2 shadow-xs cursor-pointer"
            title={`Xem báo cáo phân tích và thống kê thi đua 4 tổ lớp ${currentClass?.name || '9A1'}`}
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>📊 Thống Kê Theo Tổ Của Lớp</span>
          </button>
          <Link
            to="/to-truong/score"
            className="px-4 py-2.5 bg-white text-sky-800 font-bold text-xs md:text-sm rounded-xl shadow-lg hover:bg-sky-50 transition flex items-center gap-1.5 self-start md:self-auto"
          >
            <Flame className="w-4 h-4 text-orange-500" /> Ghi Nhận Thi Đua Tổ
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Thứ hạng của tổ</span>
          <div className="text-3xl font-black text-amber-500 mt-2">
            #{groupRank?.rank || 1}
          </div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Trên tổng số 4 tổ của lớp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng điểm thi đua tổ</span>
          <div className="text-3xl font-black text-sky-600 mt-2">
            {(groupRank?.totalPoints ?? 0) > 0 ? `+${groupRank?.totalPoints}` : groupRank?.totalPoints ?? 0} đ
          </div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">TB: {groupRank?.averagePoints ?? 0} đ/HS</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Thành viên tổ</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{members.length}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Học sinh trong tổ của bạn</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Chờ GVCN duyệt</span>
          <div className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</div>
          <div className="text-sm text-slate-600 font-medium mt-1.5">Lượt ghi nhận đang chờ</div>
        </div>
      </div>

      {/* 4 Groups Overview Section for Class */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Tổng Quát Thi Đua 4 Tổ Lớp {currentClass?.name || '9A1'}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              So sánh thứ hạng, tổng điểm và điểm bình quân giữa các tổ trong lớp
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs md:text-sm rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto border border-indigo-200"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Mở Báo Cáo Thống Kê Chi Tiết &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {allGroupRanks.map((grp) => {
            const isMyGroup = grp.groupId === groupId;
            return (
              <div
                key={grp.groupId}
                onClick={() => setShowGroupStatsModal(true)}
                className={`p-4 rounded-2xl border transition cursor-pointer text-center relative ${
                  isMyGroup
                    ? 'border-sky-500 ring-2 ring-sky-400 bg-sky-50/60 shadow-sm'
                    : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 shadow-2xs'
                }`}
                title="Bấm để xem thống kê toàn diện của tổ này"
              >
                {isMyGroup && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                    Tổ của bạn
                  </span>
                )}
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm mb-1.5 ${
                    grp.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : grp.rank === 2
                      ? 'bg-slate-300 text-slate-800'
                      : grp.rank === 3
                      ? 'bg-amber-800 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  #{grp.rank}
                </span>
                <div className="font-bold text-base text-slate-900">{grp.groupName}</div>
                <div className="text-xs text-slate-600 font-semibold mt-0.5">
                  {grp.memberCount} học sinh &bull; TB: {grp.averagePoints} đ
                </div>
                <div className="text-base font-black text-indigo-700 mt-1.5">
                  {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <span className="text-emerald-600">+{grp.plusPoints}</span> / <span className="text-rose-600">-{grp.minusPoints}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" /> Danh Sách Thành Viên {groupObj?.name || 'Tổ 1'} ({members.length} HS)
            </h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              💡 Bấm vào bất kỳ học sinh nào để xem lịch sử thành tích thi đua, khen thưởng và vi phạm
            </p>
          </div>
          <Link
            to="/to-truong/score"
            className="text-xs md:text-sm text-sky-700 font-bold hover:underline self-start sm:self-auto flex items-center gap-1"
          >
            <Flame className="w-4 h-4 text-orange-500" /> Vào chấm điểm tổ &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {members.map((m, idx) => (
            <div
              key={m.studentId}
              onClick={() => setSelectedStudentForModal(m)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/80 hover:border-sky-300 cursor-pointer transition flex items-center justify-between group"
              title="Bấm để xem toàn bộ thành tích thi đua của học sinh này"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-200 group-hover:bg-sky-200 text-slate-700 group-hover:text-sky-900 font-mono text-xs font-bold flex items-center justify-center transition">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-sm md:text-base group-hover:text-sky-700 transition flex items-center gap-1.5">
                    <span>{m.fullName}</span>
                    {m.fullName === currentUser?.displayName?.split('(')[0].trim() && (
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[11px] font-bold rounded-full">
                        Bạn (Tổ trưởng)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {m.studentCode} {m.dateOfBirth && `&bull; NS: ${m.dateOfBirth}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-black text-sm px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl group-hover:border-sky-300 shadow-2xs">
                  {(m.totalPoints ?? 0) > 0 ? `+${m.totalPoints}` : m.totalPoints ?? 0} đ
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudentForModal(m);
                  }}
                  className="p-1.5 text-slate-400 group-hover:text-sky-600 rounded-lg hover:bg-white transition"
                  title="Xem thành tích chi tiết"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={allTransactions}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
      />

      {/* Group Statistics Modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={classId}
        className={currentClass?.name || '9A1'}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
