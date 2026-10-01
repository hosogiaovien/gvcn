import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Printer,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Trophy,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { rankingService } from '../../services/rankingService';
import { exportService } from '../../services/exportService';
import { Student, Group, CompetitionTransaction, StudentRankItem, GroupRankItem, ClassRoom } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ClassRankingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const isSchoolWideRole =
    ['ADMIN', 'HIEU_TRUONG', 'PHO_HIEU_TRUONG', 'TONG_PHU_TRACH', 'GIAM_THI'].includes(currentUser?.role || '') ||
    sessionStorage.getItem('thidua_admin_acting') === 'true';

  const defaultClassId =
    currentUser?.role === 'GVCN' && currentUser.classId
      ? currentUser.classId
      : sessionStorage.getItem('thidua_selected_class_id') || currentUser?.classId || 'class-9a1';

  const [classId, setClassId] = useState<string>(defaultClassId);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [studentRanks, setStudentRanks] = useState<StudentRankItem[]>([]);
  const [groupRanks, setGroupRanks] = useState<GroupRankItem[]>([]);
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'GROUPS'>('STUDENTS');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);

  const loadData = async () => {
    const [stList, grpList, txList, cls, allCls] = await Promise.all([
      dbService.getStudents(classId),
      dbService.getGroups(classId),
      dbService.getTransactions(classId),
      dbService.getClassById(classId),
      dbService.getClasses(),
    ]);
    setStudents(stList);
    setGroups(grpList);
    setTransactions(txList);
    if (cls) setCurrentClass(cls);
    setClasses(allCls);

    const sRanks = rankingService.calculateStudentRankings(stList, txList);
    setStudentRanks(sRanks);
    setGroupRanks(rankingService.calculateGroupRankings(grpList, sRanks));
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  const handlePrint = () => {
    exportService.printReport();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900">Bảng Xếp Hạng Thi Đua</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              Lớp {currentClass?.name || '9A1'}
            </span>

            {/* Class Switcher for School Leadership, Proctor, and Admin */}
            {isSchoolWideRole && classes.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">
                  {currentUser?.role === 'ADMIN'
                    ? 'Admin chọn lớp:'
                    : currentUser?.role === 'TONG_PHU_TRACH'
                    ? 'TPT kiểm tra lớp:'
                    : currentUser?.role === 'GIAM_THI'
                    ? 'Giám thị chọn lớp:'
                    : 'BGH chọn lớp:'}
                </span>
                <select
                  value={classId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setClassId(newId);
                    sessionStorage.setItem('thidua_selected_class_id', newId);
                  }}
                  className="bg-transparent text-indigo-900 font-black text-xs md:text-sm focus:outline-none cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      Lớp {c.name} (Khối {c.grade}) {c.homeroomTeacherName ? `- GVCN: ${c.homeroomTeacherName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            {currentClass?.homeroomTeacherName ? `GVCN: ${currentClass.homeroomTeacherName} • ` : ''}
            Xếp hạng học sinh và xếp hạng tổ theo thuật toán Tie-Break chuẩn xác
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Mở bảng thống kê thi đua 4 tổ của lớp"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>📊 Thống Kê Theo Tổ</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> In Bảng Xếp Hạng
          </button>
        </div>
      </div>

      {/* Tie Break Explanation Notice */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-indigo-950">Quy tắc phân định thứ hạng (Tie-Break Engine):</div>
          <div className="mt-1 space-x-2 text-[11px] text-indigo-800">
            <span><strong>Ưu tiên 1:</strong> Tổng điểm thi đua cao hơn.</span> &bull;
            <span><strong>Ưu tiên 2:</strong> Nếu bằng điểm, xét tổng điểm trừ ít hơn.</span> &bull;
            <span><strong>Ưu tiên 3:</strong> Nếu vẫn bằng, xét số lần đạt điểm cộng nhiều hơn.</span> &bull;
            <span><strong>Ưu tiên 4:</strong> Đồng hạng hoặc theo thứ tự ABC.</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-bold print:hidden">
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'STUDENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" /> Xếp Hạng Cá Nhân (40 Học Sinh)
        </button>
        <button
          onClick={() => setActiveTab('GROUPS')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'GROUPS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> Xếp Hạng 4 Tổ
        </button>
      </div>

      {/* Print Title Header */}
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-black uppercase">TRƯỜNG TH&amp;THCS BÀN LONG</h2>
        <h3 className="text-lg font-bold">BẢNG XẾP HẠNG THI ĐUA LỚP {currentClass?.name || '9A1'} &bull; NĂM HỌC 2026–2027</h3>
        <p className="text-xs text-slate-500 mt-1">Cập nhật ngày: {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      {/* Content */}
      {activeTab === 'STUDENTS' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider print:bg-white print:border-b-2">
                <tr>
                  <th className="py-3.5 pl-4">Hạng</th>
                  <th className="py-3.5">Mã HS</th>
                  <th className="py-3.5">Họ và tên</th>
                  <th className="py-3.5">Tổ</th>
                  <th className="py-3.5 text-center">Điểm cộng</th>
                  <th className="py-3.5 text-center">Lượt cộng</th>
                  <th className="py-3.5 text-center">Điểm trừ</th>
                  <th className="py-3.5 text-center">Lượt trừ</th>
                  <th className="py-3.5 text-right pr-4">Tổng điểm thi đua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRanks.map((st) => (
                  <tr
                    key={st.studentId}
                    onClick={() => {
                      const found = students.find((s) => s.studentId === st.studentId);
                      if (found) setSelectedStudent(found);
                    }}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 pl-4">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs ${
                          st.rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : st.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : st.rank === 3
                            ? 'bg-amber-800 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        #{st.rank}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-semibold text-slate-600">
                      {st.studentCode}
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-slate-900 hover:text-indigo-600 transition">
                        {st.fullName}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-slate-600">{st.groupName}</td>
                    <td className="py-3 text-center font-bold text-emerald-600">
                      +{st.plusPoints}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono">
                      {st.plusCount}
                    </td>
                    <td className="py-3 text-center font-bold text-rose-600">
                      -{st.minusPoints}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono">
                      {st.minusCount}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="font-black text-sm px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                        {st.totalPoints > 0 ? `+${st.totalPoints}` : st.totalPoints} đ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider print:bg-white print:border-b-2">
              <tr>
                <th className="py-3.5 pl-4">Thứ hạng</th>
                <th className="py-3.5">Tên Tổ</th>
                <th className="py-3.5 text-center">Sĩ số thành viên</th>
                <th className="py-3.5 text-center">Điểm cộng</th>
                <th className="py-3.5 text-center">Điểm trừ</th>
                <th className="py-3.5 text-center">Điểm trung bình / HS</th>
                <th className="py-3.5 text-right pr-4">Tổng điểm thi đua tổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupRanks.map((grp) => (
                <tr key={grp.groupId} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 pl-4">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm ${
                        grp.rank === 1
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : grp.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : grp.rank === 3
                          ? 'bg-amber-800 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{grp.rank}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-slate-900 text-sm">{grp.groupName}</td>
                  <td className="py-3.5 text-center font-semibold text-slate-600">
                    {grp.memberCount} học sinh
                  </td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">
                    +{grp.plusPoints}
                  </td>
                  <td className="py-3.5 text-center font-bold text-rose-600">
                    -{grp.minusPoints}
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold text-indigo-600">
                    {grp.averagePoints} đ
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <span className="font-black text-base px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                      {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student detail modal */}
      <StudentDetailModal
        student={selectedStudent}
        transactions={transactions}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Group Statistics modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={classId}
        className={currentClass?.name || '9A1'}
      />
    </div>
  );
};
