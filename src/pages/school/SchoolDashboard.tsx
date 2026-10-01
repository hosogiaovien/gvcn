import React, { useState, useEffect } from 'react';
import {
  School,
  Award,
  ShieldAlert,
  Users,
  TrendingUp,
  BarChart3,
  Filter,
  Calendar,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Flame,
  Eye,
  Trophy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { exportService } from '../../services/exportService';
import { rankingService } from '../../services/rankingService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ClassRoom, CompetitionTransaction, Criterion, Student, Group, GroupRankItem } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';

export const SchoolDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

  // Selected Class to view by Higher-Ups (Hiệu trưởng, BGH, Giám thị, TPT)
  const [selectedClassId, setSelectedClassId] = useState<string>('class-9a1');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classGroups, setClassGroups] = useState<Group[]>([]);
  const [classGroupRanks, setClassGroupRanks] = useState<GroupRankItem[]>([]);
  const [classTxs, setClassTxs] = useState<CompetitionTransaction[]>([]);
  const [classGroupFilter, setClassGroupFilter] = useState<string>('ALL');

  // Modals
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Proctor quick score state
  const [showProctorModal, setShowProctorModal] = useState(false);
  const [targetClassId, setTargetClassId] = useState('class-9a1');
  const [proctorStudents, setProctorStudents] = useState<Student[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCriterionId, setSelectedCriterionId] = useState('');
  const [note, setNote] = useState('');
  const [scoring, setScoring] = useState(false);

  const loadData = async () => {
    const [clsList, txList] = await Promise.all([
      dbService.getClasses(),
      dbService.getTransactions(),
    ]);
    setClasses(clsList);
    setTransactions(txList);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
      if (selectedClassId) {
        loadSelectedClassData(selectedClassId);
      }
    };
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [selectedClassId]);

  // Load detailed class data whenever selectedClassId changes
  const loadSelectedClassData = async (cId: string) => {
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
      console.error('Error loading class details:', e);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadSelectedClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadStudentsForProctor = async (cid: string) => {
    const [stList, crList] = await Promise.all([
      dbService.getStudents(cid),
      dbService.getCriteria(cid),
    ]);
    setProctorStudents(stList);
    setCriteria(crList.filter((c) => c.active && (currentUser?.role === 'GIAM_THI' ? c.allowGuard : c.allowYouthLeader)));
  };

  useEffect(() => {
    if (showProctorModal) {
      loadStudentsForProctor(targetClassId);
    }
  }, [showProctorModal, targetClassId]);

  const filteredClasses = classes.filter((c) => {
    if (selectedGrade === 'ALL') return true;
    return c.grade.toString() === selectedGrade;
  });

  // Calculate sorted class leaderboard
  const classLeaderboard = [...filteredClasses].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  const totalSchoolStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const totalViolations = transactions.filter((t) => t.type === 'MINUS').length;

  const currentClassObj = classes.find((c) => c.classId === selectedClassId) || classes[0];

  const handleProctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCriterionId) {
      showToast('Vui lòng chọn học sinh và tiêu chí!', 'error');
      return;
    }

    setScoring(true);
    try {
      const student = proctorStudents.find((s) => s.studentId === selectedStudentId)!;
      const crit = criteria.find((c) => c.criterionId === selectedCriterionId)!;
      const signedPoints = crit.type === 'PLUS' ? crit.points : -crit.points;

      const newTx: CompetitionTransaction = {
        transactionId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: 'school-ban-long',
        schoolYearId: 'year-2026-2027',
        classId: targetClassId,
        studentId: student.studentId,
        studentName: student.fullName,
        groupId: student.groupId,
        groupName: student.groupName || 'Tổ',
        criterionId: crit.criterionId,
        criterionName: crit.name,
        type: crit.type,
        points: signedPoints,
        reason: note.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
        weekId: '2026-W38',
        monthId: new Date().toISOString().substring(0, 7),
        createdBy: currentUser?.uid || 'user-giamthi',
        createdByName: currentUser?.displayName || 'Giám thị',
        createdByRole: currentUser?.role || 'GIAM_THI',
        createdAt: new Date().toISOString(),
        status: 'APPROVED',
      };

      await dbService.createTransaction(newTx);
      await loadData();
      if (selectedClassId === targetClassId) {
        await loadSelectedClassData(selectedClassId);
      }

      showToast(`Đã ghi nhận ${crit.name} (${signedPoints} điểm) cho học sinh ${student.fullName}!`, 'success');
      setShowProctorModal(false);
      setSelectedStudentId('');
      setSelectedCriterionId('');
      setNote('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-2">
            <School className="w-3.5 h-3.5 text-indigo-400" /> TH&amp;THCS BÀN LONG &bull; Năm Học 2026–2027
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Tổng Quan Thi Đua Toàn Trường
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-1.5 font-medium leading-relaxed">
            Không gian theo dõi dành cho Ban Giám Hiệu, Tổng Phụ Trách Đội và Đội Ngũ Giám Thị
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(currentUser?.role === 'GIAM_THI' || currentUser?.role === 'TONG_PHU_TRACH' || currentUser?.role === 'ADMIN') && (
            <button
              onClick={() => setShowProctorModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> Ghi Nhận Nề Nếp / Vi Phạm
            </button>
          )}
          <button
            onClick={() => exportService.printReport()}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs md:text-sm rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> In Báo Cáo
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Quy mô trường</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{classes.length} Lớp</div>
          <div className="text-sm text-slate-600 font-medium mt-1">Khối 6, 7, 8, 9</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng học sinh</span>
          <div className="text-3xl font-black text-indigo-600 mt-2">{totalSchoolStudents}</div>
          <div className="text-sm text-slate-600 font-medium mt-1">Học sinh toàn trường</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Lượt vi phạm ghi nhận</span>
          <div className="text-3xl font-black text-rose-600 mt-2">{totalViolations}</div>
          <div className="text-sm text-slate-600 font-medium mt-1">Toàn bộ các lớp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Lớp dẫn đầu thi đua</span>
          <div className="text-3xl font-black text-amber-500 mt-2">
            {classLeaderboard[0]?.name || '9A1'}
          </div>
          <div className="text-sm text-slate-600 font-medium mt-1">
            {classLeaderboard[0]?.totalPoints || 135} điểm thi đua
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: CLASS DETAILED VIEW & GROUP STATISTICS (For Higher-Ups)          */}
      {/* ========================================================================= */}
      <div id="class-detail-section" className="bg-white rounded-3xl border border-indigo-200 shadow-md p-5 md:p-6 space-y-6">
        {/* Class Selector Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs md:text-sm font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Bảng Theo Dõi Chi Tiết Từng Lớp Học
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Đang Xem Lớp {currentClassObj?.name || '9A1'}</span>
              <span className="text-sm md:text-base font-bold text-slate-500">
                (Khối {currentClassObj?.grade || 9} &bull; GVCN: {currentClassObj?.homeroomTeacherName || 'Cô Lê Thị Mai'})
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold text-slate-700">Chọn lớp xem:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm md:text-base font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
              >
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    Lớp {cls.name} (Khối {cls.grade}) - {cls.homeroomTeacherName || 'GVCN'}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>
                  Danh Sách Học Sinh Lớp {currentClassObj?.name}
                  {classGroupFilter !== 'ALL' && ` (${classGroups.find((g) => g.groupId === classGroupFilter)?.name})`}
                </span>
                <span className="text-xs md:text-sm font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {classStudents.filter((s) => classGroupFilter === 'ALL' || s.groupId === classGroupFilter).length} HS
                </span>
              </h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                💡 Bấm vào bất kỳ học sinh nào bên dưới để xem toàn bộ thành tích thi đua, chi tiết khen thưởng và vi phạm
              </p>
            </div>

            {classGroupFilter !== 'ALL' && (
              <button
                onClick={() => setClassGroupFilter('ALL')}
                className="text-xs md:text-sm font-bold text-indigo-600 hover:underline self-start sm:self-auto"
              >
                &larr; Xem lại tất cả 4 tổ
              </button>
            )}
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
                  {(() => {
                    const displayed = classStudents
                      .filter((s) => classGroupFilter === 'ALL' || s.groupId === classGroupFilter)
                      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

                    if (displayed.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            Không có học sinh nào.
                          </td>
                        </tr>
                      );
                    }

                    return displayed.map((st, idx) => (
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
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs md:text-sm font-bold transition inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem thành tích</span>
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Filters by Grade */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs md:text-sm font-semibold">
        <span className="text-slate-600 flex items-center gap-1">
          <Filter className="w-4 h-4 text-indigo-600" /> Lọc bảng xếp hạng toàn trường theo khối:
        </span>
        <div className="flex gap-1.5">
          {['ALL', '6', '7', '8', '9'].map((gr) => (
            <button
              key={gr}
              onClick={() => setSelectedGrade(gr)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                selectedGrade === gr
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {gr === 'ALL' ? 'Tất cả khối' : `Khối ${gr}`}
            </button>
          ))}
        </div>
      </div>

      {/* Class Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Bảng Xếp Hạng Thi Đua Toàn Trường
          </h3>
          <span className="text-xs md:text-sm text-slate-500 font-semibold">{filteredClasses.length} lớp học</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 pl-4">Hạng</th>
                <th className="py-3.5">Lớp</th>
                <th className="py-3.5">Khối</th>
                <th className="py-3.5">Giáo viên chủ nhiệm</th>
                <th className="py-3.5 text-center">Sĩ số</th>
                <th className="py-3.5 text-center">Tổng điểm</th>
                <th className="py-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classLeaderboard.map((cls, idx) => {
                const isCurrent = cls.classId === selectedClassId;
                return (
                  <tr
                    key={cls.classId}
                    onClick={() => {
                      setSelectedClassId(cls.classId);
                      const el = document.getElementById('class-detail-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`hover:bg-indigo-50/50 cursor-pointer transition ${
                      isCurrent ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-4">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-800 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 text-sm md:text-base">
                      {cls.name} {isCurrent && <span className="text-xs text-indigo-600 font-bold ml-1">(Đang xem)</span>}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-600">Khối {cls.grade}</td>
                    <td className="py-3.5 text-slate-700 font-medium">{cls.homeroomTeacherName || 'Chưa phân công'}</td>
                    <td className="py-3.5 text-center font-mono font-semibold">{cls.studentCount || 40} HS</td>
                    <td className="py-3.5 text-center">
                      <span className="font-black text-sm md:text-base px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                        {cls.totalPoints || 100} đ
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClassId(cls.classId);
                          const el = document.getElementById('class-detail-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-bold transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>Xem chi tiết &amp; Thống kê tổ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proctor Violation Recording Modal */}
      {showProctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base md:text-lg mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" /> Ghi Nhận Nề Nếp &amp; Vi Phạm (Giám Thị / TPT)
            </h3>
            <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">
              Điểm số được áp dụng trực tiếp theo quy định, không cho phép nhập điểm tùy tiện.
            </p>

            <form onSubmit={handleProctorSubmit} className="space-y-3 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn lớp học:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      Lớp {c.name} (Khối {c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn học sinh:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Chọn học sinh vi phạm --</option>
                  {proctorStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.fullName} ({s.studentCode} - {s.groupName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu chí vi phạm:</label>
                <select
                  value={selectedCriterionId}
                  onChange={(e) => setSelectedCriterionId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Chọn tiêu chí xử lý --</option>
                  {criteria.map((cr) => (
                    <option key={cr.criterionId} value={cr.criterionId}>
                      {cr.name} ({cr.type === 'PLUS' ? `+${cr.points}` : `-${cr.points}`} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diễn giải / Ghi chú:</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Đi muộn 7h20, không mang khăn quàng..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProctorModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={scoring || !selectedStudentId || !selectedCriterionId}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm"
                >
                  {scoring ? 'Đang lưu...' : 'Ghi nhận vi phạm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Statistics Modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={selectedClassId}
        className={currentClassObj?.name || '9A1'}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={classTxs}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
      />
    </div>
  );
};
