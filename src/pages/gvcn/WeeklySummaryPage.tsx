import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Lock,
  Unlock,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  Sparkles,
  FileSpreadsheet,
  X,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { summaryService } from '../../services/summaryService';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { WeeklySummary, StudentRankItem, GroupRankItem, Student, CompetitionTransaction, ClassRoom, SchoolWeekConfig } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';

export const WeeklySummaryPage: React.FC = () => {
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
  const schoolId = 'school-ban-long';
  const schoolYearId = 'year-2026-2027';

  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [weekNumber, setWeekNumber] = useState(4);
  const [startDate, setStartDate] = useState('2026-09-21');
  const [endDate, setEndDate] = useState('2026-09-27');
  const [schoolWeeks, setSchoolWeeks] = useState<SchoolWeekConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeSummary, setActiveSummary] = useState<WeeklySummary | null>(null);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Modals & student details
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const [summaries, stList, txList, cls, allCls, sWeeks] = await Promise.all([
        dbService.getWeeklySummaries(classId),
        dbService.getStudents(classId),
        dbService.getTransactions(classId),
        dbService.getClassById(classId),
        dbService.getClasses(),
        dbService.getSchoolWeeks(),
      ]);
      setStudents(stList);
      setTransactions(txList);
      if (cls) setCurrentClass(cls);
      setClasses(allCls);
      setSchoolWeeks(sWeeks);

      const targetSchoolWeek = sWeeks.find((w) => w.weekNumber === weekNumber);
      const chosenStartDate = targetSchoolWeek?.startDate || startDate;
      const chosenEndDate = targetSchoolWeek?.endDate || endDate;

      const existing = summaries.find((s) => s.weekNumber === weekNumber);

      if (existing) {
        setActiveSummary(existing);
        setStartDate(existing.startDate);
        setEndDate(existing.endDate);
      } else {
        setStartDate(chosenStartDate);
        setEndDate(chosenEndDate);
        const preview = await summaryService.previewWeeklySummary(
          classId,
          schoolId,
          schoolYearId,
          weekNumber,
          targetSchoolWeek?.weekId || `2026-W${weekNumber + 35}`,
          chosenStartDate,
          chosenEndDate
        );
        setActiveSummary(preview);
      }
    } catch (e: any) {
      showToast('Lỗi khi tải tổng kết: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWeekNumber = (num: number) => {
    setWeekNumber(num);
    const target = schoolWeeks.find((w) => w.weekNumber === num);
    if (target) {
      setStartDate(target.startDate);
      setEndDate(target.endDate);
    }
  };

  const handleStudentClick = (st: StudentRankItem) => {
    const found = students.find((s) => s.studentId === st.studentId) || {
      studentId: st.studentId,
      studentCode: st.studentCode,
      fullName: st.fullName,
      schoolId,
      schoolYearId,
      classId,
      groupId: st.groupId,
      groupName: st.groupName,
      status: 'ACTIVE' as const,
      gender: 'NAM' as const,
      totalPoints: st.totalPoints,
      plusPoints: st.plusPoints,
      minusPoints: st.minusPoints,
      createdAt: '',
      updatedAt: '',
    };
    setSelectedStudentForModal(found);
  };

  useEffect(() => {
    loadSummary();
  }, [weekNumber, classId]);

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const preview = await summaryService.previewWeeklySummary(
        classId,
        schoolId,
        schoolYearId,
        weekNumber,
        `2026-W${weekNumber + 35}`,
        startDate,
        endDate
      );
      setActiveSummary(preview);
      showToast('Đã tính toán lại dữ liệu theo mốc thời gian mới!', 'info');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeSummary || !currentUser) return;
    setLoading(true);
    try {
      const finalized = await summaryService.finalizeWeeklySummary(activeSummary, currentUser);
      setActiveSummary(finalized);
      showToast(`Đã chốt và khóa thành công snapshot tổng kết Tuần ${weekNumber}!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReopen = async () => {
    if (!activeSummary || !currentUser) return;
    if (!reopenReason.trim()) {
      showToast('Bắt buộc phải nhập lý do mở lại!', 'error');
      return;
    }
    setLoading(true);
    try {
      const reopened = await summaryService.reopenWeeklySummary(
        activeSummary.summaryId,
        classId,
        reopenReason.trim(),
        currentUser
      );
      if (reopened) {
        setActiveSummary(reopened);
        showToast(`Đã mở lại Tuần ${weekNumber}. Vui lòng cập nhật và chốt lại sau khi sửa!`, 'info');
        setShowReopenModal(false);
        setReopenReason('');
      }
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!activeSummary) return;
    exportService.exportWeeklyRankingsToExcel(activeSummary, currentClass?.name || '9A1');
    showToast('Đã xuất file Excel tổng kết tuần!', 'success');
  };

  const handlePrint = () => {
    exportService.printReport();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900">Tổng Kết Thi Đua Tuần</h1>
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

            {activeSummary?.isFinalized ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Đã chốt sổ (Snapshot)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Bản nháp đang tính toán
              </span>
            )}
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            {currentClass?.homeroomTeacherName ? `GVCN: ${currentClass.homeroomTeacherName} • ` : ''}
            Tự do cấu hình chu kỳ ngày bắt đầu - ngày kết thúc &bull; Khóa dữ liệu và ghi Audit Log an toàn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Mở bảng thống kê thi đua 4 tổ của lớp"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>📊 Thống Kê Theo Tổ</span>
          </button>
          {activeSummary?.isFinalized ? (
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1.5"
            >
              <Unlock className="w-4 h-4" /> Mở lại tuần (Reopen)
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" /> Chốt sổ Tuần {weekNumber}
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> In Báo Cáo
          </button>
        </div>
      </div>

      {/* Cycle Selector Bar */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs font-semibold print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Chọn tuần:</span>
          <select
            value={weekNumber}
            onChange={(e) => handleSelectWeekNumber(Number(e.target.value))}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
          >
            {schoolWeeks.length > 0 ? (
              schoolWeeks.map((w) => (
                <option key={w.weekId} value={w.weekNumber}>
                  Tuần {w.weekNumber}: {w.startDate} đến {w.endDate} {w.isBreak ? '(Nghỉ Tết/Lễ)' : ''} {w.note ? `[${w.note}]` : ''} {w.isCurrent ? '★ (Hiện tại)' : ''}
                </option>
              ))
            ) : (
              [1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600">Từ ngày:</span>
          <input
            type="date"
            disabled={activeSummary?.isFinalized}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-200 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600">Đến ngày:</span>
          <input
            type="date"
            disabled={activeSummary?.isFinalized}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-200 font-semibold"
          />
        </div>

        {!activeSummary?.isFinalized && (
          <button
            type="button"
            onClick={handleRecalculate}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold transition shadow-2xs"
          >
            Tính lại điểm
          </button>
        )}

        {/* Holiday / Break indicator for current selected week */}
        {(() => {
          const currentConfig = schoolWeeks.find((w) => w.weekNumber === weekNumber);
          if (currentConfig?.isBreak) {
            return (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                🧧 Tuần nghỉ lễ/Tết ({currentConfig.note || 'Không tính điểm thi đua'})
              </span>
            );
          }
          if (currentConfig?.isCurrent) {
            return (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                ★ Tuần hiện tại của trường
              </span>
            );
          }
          return null;
        })()}
      </div>

      {/* Snapshot Information banner if finalized */}
      {activeSummary?.isFinalized && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <strong>Tuần này đã được chốt sổ snapshot an toàn.</strong>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Chốt bởi: {activeSummary.finalizedByName} lúc{' '}
                {new Date(activeSummary.finalizedAt || '').toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {activeSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase">Tổng lượt thi đua</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {activeSummary.totalTransactions} lượt
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase">Tổng điểm cộng</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              +{activeSummary.totalPlusPoints} đ
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase">Tổng điểm trừ</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              -{activeSummary.totalMinusPoints} đ
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase">Điểm thực tế tuần</span>
            <div
              className={`text-2xl font-black mt-1 ${
                activeSummary.netPoints >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {activeSummary.netPoints > 0 ? `+${activeSummary.netPoints}` : activeSummary.netPoints} đ
            </div>
          </div>
        </div>
      )}

      {/* Rankings in this week */}
      {activeSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Group rankings (4 columns) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Xếp Hạng 4 Tổ Trong Tuần
            </h3>
            <div className="space-y-2.5">
              {activeSummary.groupRankings.map((g) => (
                <div
                  key={g.groupId}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        g.rank === 1
                          ? 'bg-amber-400 text-amber-950'
                          : g.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : g.rank === 3
                          ? 'bg-amber-800 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {g.rank}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{g.groupName}</div>
                      <div className="text-[10px] text-slate-500">{g.memberCount} HS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">
                      {g.totalPoints > 0 ? `+${g.totalPoints}` : g.totalPoints} đ
                    </div>
                    <div className="text-[10px] text-slate-400">TB: {g.averagePoints} đ/HS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top individual students (7 columns) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Bảng Điểm Cá Nhân Tuần {weekNumber}
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-semibold sticky top-0 bg-white">
                  <tr>
                    <th className="pb-2">Hạng</th>
                    <th className="pb-2">Học sinh</th>
                    <th className="pb-2">Tổ</th>
                    <th className="pb-2 text-center">Cộng</th>
                    <th className="pb-2 text-center">Trừ</th>
                    <th className="pb-2 text-right">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSummary.studentRankings.map((st) => (
                    <tr
                      key={st.studentId}
                      onClick={() => handleStudentClick(st)}
                      className="hover:bg-indigo-50/70 cursor-pointer transition group"
                      title="Bấm để xem chi tiết thành tích thi đua của học sinh này"
                    >
                      <td className="py-2.5 font-bold text-slate-600">#{st.rank}</td>
                      <td className="py-2.5 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        <div className="flex items-center gap-1.5">
                          <span>{st.fullName}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-500 font-medium">{st.groupName}</td>
                      <td className="py-2.5 text-center text-emerald-600 font-bold">
                        +{st.plusPoints}
                      </td>
                      <td className="py-2.5 text-center text-rose-600 font-bold">
                        -{st.minusPoints}
                      </td>
                      <td className="py-2.5 text-right font-black text-indigo-600">
                        {st.totalPoints > 0 ? `+${st.totalPoints}` : st.totalPoints} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Mở Lại Tổng Kết Tuần {weekNumber}
              </h3>
              <button
                onClick={() => setShowReopenModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Theo quy định kiểm toán học đường, bạn bắt buộc phải nhập lý do khi mở lại tuần đã chốt sổ snapshot. Thao tác này sẽ được ghi vào <strong>Audit Log</strong> hệ thống:
            </p>

            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Ví dụ: Bổ sung điểm cộng giải nhì thể thao học sinh Nguyễn Văn A..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReopen}
                disabled={loading || !reopenReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Xác nhận mở lại
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Student detail modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={transactions}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
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
