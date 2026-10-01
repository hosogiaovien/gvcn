import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Award, Download, Printer, GraduationCap } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { summaryService } from '../../services/summaryService';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MonthlySummary, ClassRoom } from '../../types';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';

export const MonthlySummaryPage: React.FC = () => {
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
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const [summaries, cls, allCls] = await Promise.all([
        dbService.getMonthlySummaries(classId),
        dbService.getClassById(classId),
        dbService.getClasses(),
      ]);
      if (cls) setCurrentClass(cls);
      setClasses(allCls);
      const existing = summaries.find((s) => s.monthId === selectedMonth);

      if (existing) {
        setSummary(existing);
      } else {
        const preview = await summaryService.previewMonthlySummary(
          classId,
          schoolId,
          schoolYearId,
          selectedMonth,
          'Tháng 09/2026',
          '2026-09-01',
          '2026-09-30'
        );
        setSummary(preview);
      }
    } catch (e: any) {
      showToast('Lỗi khi tải tổng kết tháng: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData();
  }, [selectedMonth, classId]);

  const handleFinalizeMonth = async () => {
    if (!summary || !currentUser) return;
    try {
      const res = await summaryService.finalizeMonthlySummary(summary, currentUser);
      setSummary(res);
      showToast('Đã chốt sổ snapshot thi đua Tháng 09/2026!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900">Tổng Kết Thi Đua Tháng</h1>
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
            Tổng hợp dữ liệu toàn bộ các tuần trong tháng, xếp hạng thi đua và xu hướng tiến bộ
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
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600"
          >
            <option value="2026-09">Tháng 09 / 2026</option>
            <option value="2026-10">Tháng 10 / 2026</option>
            <option value="2026-11">Tháng 11 / 2026</option>
          </select>

          {!summary?.isFinalized && (
            <button
              onClick={handleFinalizeMonth}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Chốt Sổ Tháng
            </button>
          )}

          <button
            onClick={() => exportService.printReport()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng điểm cộng tháng</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              +{summary.totalPlusPoints} đ
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng điểm trừ tháng</span>
            <div className="text-3xl font-black text-rose-600 mt-1">
              -{summary.totalMinusPoints} đ
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Điểm thực tế cả tháng</span>
            <div className="text-3xl font-black text-indigo-600 mt-1">
              {summary.netPoints > 0 ? `+${summary.netPoints}` : summary.netPoints} đ
            </div>
          </div>
        </div>
      )}

      {/* Month Group Leaderboard */}
      {summary && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Xếp Hạng 4 Tổ Trong Tháng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {summary.groupRankings.map((g) => (
              <div
                key={g.groupId}
                onClick={() => setShowGroupStatsModal(true)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                title="Bấm để xem báo cáo thống kê theo tổ chi tiết"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{g.groupName}</span>
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                      g.rank === 1 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{g.rank}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-indigo-600">
                    {g.totalPoints > 0 ? `+${g.totalPoints}` : g.totalPoints} đ
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Trung bình: {g.averagePoints} đ/HS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Statistics Modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={classId}
        className={currentClass?.name || '9A1'}
      />
    </div>
  );
};
