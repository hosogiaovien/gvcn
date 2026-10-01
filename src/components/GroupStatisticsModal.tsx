import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  X,
  Search,
  CheckCircle2,
  Calendar,
  Eye,
  BarChart3,
  Printer,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { rankingService } from '../services/rankingService';
import { exportService } from '../services/exportService';
import {
  Student,
  Group,
  CompetitionTransaction,
  GroupRankItem,
  StudentRankItem,
} from '../types';
import { StudentDetailModal } from './StudentDetailModal';

interface Props {
  classId: string;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupStatisticsModal: React.FC<Props> = ({
  classId,
  className = '9A1',
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [groupRanks, setGroupRanks] = useState<GroupRankItem[]>([]);
  const [studentRanks, setStudentRanks] = useState<StudentRankItem[]>([]);
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, grpList, txList] = await Promise.all([
        dbService.getStudents(classId),
        dbService.getGroups(classId),
        dbService.getTransactions(classId),
      ]);

      const effectiveGroups: Group[] =
        grpList && grpList.length > 0
          ? grpList
          : [1, 2, 3, 4].map((num) => ({
              groupId: `group-${classId}-${num}`,
              classId,
              name: `Tổ ${num}`,
              memberCount: 0,
              status: 'ACTIVE' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));

      setStudents(stList);
      setGroups(effectiveGroups);
      setTransactions(txList);

      const approvedTxs = txList.filter((t) => t.status === 'APPROVED');
      const sRanks = rankingService.calculateStudentRankings(stList, approvedTxs);
      const gRanks = rankingService.calculateGroupRankings(effectiveGroups, sRanks);

      setStudentRanks(sRanks);
      setGroupRanks(gRanks);
    } catch (err) {
      console.error('Failed to load group statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveGroupFilter('ALL');
      setSearchTerm('');
      setSelectedStudent(null);
    }
  }, [isOpen, classId]);

  if (!isOpen) return null;

  const totalClassPoints = groupRanks.reduce((sum, g) => sum + g.totalPoints, 0);
  const averageClassPoints =
    students.length > 0 ? (totalClassPoints / students.length).toFixed(1) : '0';

  const bestGroup = groupRanks[0];
  const mostActiveGroup = [...groupRanks].sort((a, b) => b.plusPoints - a.plusPoints)[0];
  const groupNeedImprovement = [...groupRanks].sort((a, b) => b.minusPoints - a.minusPoints)[0];

  // Map student rankings to fast lookup
  const studentRankMap = new Map<string, StudentRankItem>();
  studentRanks.forEach((sr) => studentRankMap.set(sr.studentId, sr));

  // Filtered and sorted students list
  const displayStudents = students.filter((s) => {
    // 1. Group filter
    if (activeGroupFilter !== 'ALL') {
      const grp = groups.find((g) => g.groupId === activeGroupFilter);
      const isDirect = s.groupId === activeGroupFilter;
      const isNameMatch = grp && (s.groupName === grp.name || s.groupId === grp.groupId);
      const numMatch = activeGroupFilter.match(/[1-4]$/);
      const isNumMatch = numMatch
        ? s.groupName === `Tổ ${numMatch[0]}` ||
          s.groupId?.endsWith(`-${numMatch[0]}`) ||
          s.groupId === `group-${numMatch[0]}`
        : false;
      if (!isDirect && !isNameMatch && !isNumMatch) return false;
    }

    // 2. Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(term);
      const matchCode = (s.studentCode || '').toLowerCase().includes(term);
      if (!matchName && !matchCode) return false;
    }

    return true;
  });

  const sortedStudents = [...displayStudents].sort((a, b) => {
    const bPts = studentRankMap.get(b.studentId)?.totalPoints ?? b.totalPoints ?? 0;
    const aPts = studentRankMap.get(a.studentId)?.totalPoints ?? a.totalPoints ?? 0;
    return bPts - aPts;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl xl:max-w-[1400px] w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Compact, elegant top Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shadow-inner shrink-0">
              <BarChart3 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider text-amber-200">
                  Thống Kê Thi Đua 4 Tổ &bull; Lớp {className}
                </span>
                <span className="text-white/80 text-xs hidden sm:inline">&bull;</span>
                <span className="text-white/90 text-xs font-semibold hidden sm:inline">
                  {students.length} Học Sinh &bull; 4 Tổ
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white tracking-tight mt-0.5">
                Bảng Báo Cáo Thi Đua 4 Tổ Lớp {className}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick class overview pills on desktop */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white border border-white/15">
              <span>Tổng điểm: {totalClassPoints > 0 ? `+${totalClassPoints}` : totalClassPoints} đ</span>
              <span>&bull;</span>
              <span>TB: {averageClassPoints} đ/HS</span>
            </div>

            <button
              onClick={() => exportService.printReport()}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1.5"
              title="In báo cáo thống kê theo tổ"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">In Báo Cáo</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container covering 4 cards + filter bar + table */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3.5 bg-slate-50/60 min-h-0">
          {/* Master 4-Group Overview Row: Ultra-Compact & Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {groupRanks.map((grp) => {
              const grpObj = groups.find((g) => g.groupId === grp.groupId || g.name === grp.groupName);
              const grpStudents = students.filter((s) => {
                if (s.groupId === grp.groupId) return true;
                if (s.groupName && s.groupName.trim() === grp.groupName.trim()) return true;
                if (grpObj && (s.groupName === grpObj.name || s.groupId === grpObj.groupId)) return true;
                const numMatch = (grp.groupName || grp.groupId).match(/[1-4]$/);
                if (numMatch) {
                  const num = numMatch[0];
                  if (s.groupName === `Tổ ${num}` || s.groupId?.endsWith(`-${num}`) || s.groupId === `group-${num}`) return true;
                }
                return false;
              });

              const topStudentInGroup = [...grpStudents].sort((a, b) => {
                const bPts = studentRankMap.get(b.studentId)?.totalPoints ?? b.totalPoints ?? 0;
                const aPts = studentRankMap.get(a.studentId)?.totalPoints ?? a.totalPoints ?? 0;
                return bPts - aPts;
              })[0];

              const isSelected = activeGroupFilter === grp.groupId;
              const isBest = grp.rank === 1;
              const isMostPlus = mostActiveGroup && mostActiveGroup.groupId === grp.groupId && grp.plusPoints > 0;
              const isMostMinus = groupNeedImprovement && groupNeedImprovement.groupId === grp.groupId && grp.minusPoints > 0;

              return (
                <div
                  key={grp.groupId}
                  onClick={() => setActiveGroupFilter(grp.groupId === activeGroupFilter ? 'ALL' : grp.groupId)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div>
                    {/* Header line: rank badge, highlights chip, member count */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-black text-xs ${
                            grp.rank === 1
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                              : grp.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : grp.rank === 3
                              ? 'bg-amber-800 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{grp.rank}
                        </span>

                        <h3 className="font-black text-slate-900 text-base">{grp.groupName}</h3>

                        {isBest && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                            Dẫn đầu
                          </span>
                        )}
                        {!isBest && isMostPlus && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Khen nhiều
                          </span>
                        )}
                        {!isBest && !isMostPlus && isMostMinus && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                            Nhắc nhở
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                        {grp.memberCount} HS
                      </span>
                    </div>

                    {/* Score and breakdown */}
                    <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500 font-bold uppercase">Tổng điểm: </span>
                        <span className="text-lg md:text-xl font-black text-indigo-700">
                          {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        TB: {grp.averagePoints} đ/HS
                      </div>
                    </div>

                    {/* Breakdown plus / minus pills */}
                    <div className="mt-1.5 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700">+{grp.plusPoints} khen</span>
                      <span className="text-rose-700">-{grp.minusPoints} phạt</span>
                      {grpObj?.leaderName && (
                        <span className="text-slate-500 truncate max-w-[90px] font-normal" title={`Tổ trưởng: ${grpObj.leaderName}`}>
                          TT: <strong className="text-slate-700 font-semibold">{grpObj.leaderName}</strong>
                        </span>
                      )}
                    </div>

                    {topStudentInGroup && (
                      <div className="mt-1.5 text-[11px] text-indigo-950 bg-indigo-50/90 px-2 py-0.5 rounded-lg font-medium truncate">
                        🌟 {topStudentInGroup.fullName} ({topStudentInGroup.totalPoints ?? 0}đ)
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 pt-1 text-center text-xs font-bold text-indigo-600 flex items-center justify-center gap-1">
                    <span>{isSelected ? '✓ Đang lọc tổ này' : 'Bấm để lọc theo tổ >'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Toolbar & Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveGroupFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeGroupFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả 4 tổ ({students.length} HS)
              </button>
              {groupRanks.map((grp) => (
                <button
                  type="button"
                  key={grp.groupId}
                  onClick={() => setActiveGroupFilter(grp.groupId)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeGroupFilter === grp.groupId
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {grp.groupName} ({grp.memberCount})
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveGroupFilter('CHART')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  activeGroupFilter === 'CHART'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Biểu Đồ So Sánh
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm tên hoặc mã học sinh..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Main Content: Guaranteed Height Table or Comparison Chart */}
          {activeGroupFilter === 'CHART' ? (
            /* Comparison Chart View */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Biểu Đồ So Sánh Điểm Thi Đua 4 Tổ Lớp {className}
              </h3>

              <div className="space-y-4">
                {groupRanks.map((grp) => {
                  const maxPts = Math.max(...groupRanks.map((g) => Math.abs(g.totalPoints)), 1);
                  const pct = Math.max(10, Math.min(100, Math.round((Math.abs(grp.totalPoints) / maxPts) * 100)));

                  return (
                    <div key={grp.groupId} className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-sm md:text-base font-bold">
                        <span className="text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 text-xs flex items-center justify-center font-black">
                            #{grp.rank}
                          </span>
                          <span className="text-base font-black">{grp.groupName}</span>
                          <span className="text-xs text-slate-500 font-semibold">({grp.memberCount} học sinh)</span>
                        </span>
                        <div className="text-right">
                          <span className="text-indigo-700 font-black text-lg">
                            {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                          </span>
                          <span className="text-xs text-slate-500 ml-2 font-semibold">
                            (TB: {grp.averagePoints} đ/HS)
                          </span>
                        </div>
                      </div>

                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex mt-2 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            grp.rank === 1
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : grp.rank === 2
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                              : grp.rank === 3
                              ? 'bg-gradient-to-r from-sky-400 to-sky-500'
                              : 'bg-gradient-to-r from-slate-400 to-slate-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
                        <span className="text-emerald-700">Điểm khen thưởng: +{grp.plusPoints} đ</span>
                        <span className="text-rose-700">Điểm vi phạm nề nếp: -{grp.minusPoints} đ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Student List Table - Guaranteed Minimum Height & Clean Rows */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden min-h-[380px]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>
                    {activeGroupFilter === 'ALL'
                      ? `Danh Sách Toàn Bộ Học Sinh Lớp ${className}`
                      : `Danh Sách Học Sinh ${groups.find((g) => g.groupId === activeGroupFilter)?.name || ''}`}
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {sortedStudents.length} / {students.length} học sinh
                  </span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg hidden sm:inline">
                  💡 Bấm vào học sinh để xem toàn bộ lịch sử thi đua
                </span>
              </div>

              {/* Table with Sticky Header and Smooth Scroll */}
              <div className="overflow-x-auto min-h-[320px] max-h-[560px] overflow-y-auto">
                <table className="w-full text-left text-sm md:text-base border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-xs md:text-sm z-10 border-b border-slate-200 shadow-2xs">
                    <tr>
                      <th className="py-3 pl-4 w-16">Hạng</th>
                      <th className="py-3 w-28">Mã HS</th>
                      <th className="py-3">Họ và tên học sinh</th>
                      <th className="py-3 w-24">Tổ</th>
                      <th className="py-3 text-center text-emerald-700 w-32">Điểm cộng (+)</th>
                      <th className="py-3 text-center text-rose-700 w-32">Điểm trừ (-)</th>
                      <th className="py-3 text-center w-32">Tổng điểm</th>
                      <th className="py-3 text-right pr-4 w-28">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sortedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 font-medium">
                          {searchTerm
                            ? `Không tìm thấy học sinh nào khớp với từ khóa "${searchTerm}".`
                            : 'Không có học sinh nào trong tổ này.'}
                        </td>
                      </tr>
                    ) : (
                      sortedStudents.map((st, idx) => {
                        const rankInfo = studentRankMap.get(st.studentId);
                        const displayRank = rankInfo?.rank || idx + 1;
                        const livePlus = rankInfo ? rankInfo.plusPoints : st.plusPoints || 0;
                        const liveMinus = rankInfo ? rankInfo.minusPoints : st.minusPoints || 0;
                        const liveTotal = rankInfo ? rankInfo.totalPoints : st.totalPoints ?? (livePlus - liveMinus);

                        return (
                          <tr
                            key={st.studentId}
                            onClick={() => setSelectedStudent(st)}
                            className="hover:bg-indigo-50/70 cursor-pointer transition border-b border-slate-100"
                            title="Bấm để xem chi tiết lịch sử khen thưởng và vi phạm của học sinh này"
                          >
                            <td className="py-3 pl-4">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                                  displayRank === 1
                                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                                    : displayRank === 2
                                    ? 'bg-slate-300 text-slate-800'
                                    : displayRank === 3
                                    ? 'bg-amber-800 text-white'
                                    : 'text-slate-600 bg-slate-100'
                                }`}
                              >
                                {displayRank}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-xs md:text-sm text-slate-600 font-semibold">
                              {st.studentCode}
                            </td>
                            <td className="py-3">
                              <div className="font-bold text-slate-900 text-base hover:text-indigo-600 transition flex items-center gap-2">
                                <span>{st.fullName}</span>
                                {st.groupRole === 'LEADER' && (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Tổ trưởng
                                  </span>
                                )}
                                {st.groupRole === 'DEPUTY' && (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                    Tổ phó
                                  </span>
                                )}
                              </div>
                              {st.dateOfBirth && (
                                <div className="text-xs text-slate-500 font-medium">
                                  NS: {st.dateOfBirth} &bull; {st.gender === 'NAM' ? 'Nam' : 'Nữ'}
                                </div>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs md:text-sm rounded-lg">
                                {st.groupName || st.groupId}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold text-emerald-700 text-sm md:text-base">
                              +{livePlus}
                            </td>
                            <td className="py-3 text-center font-bold text-rose-700 text-sm md:text-base">
                              -{liveMinus}
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`px-3 py-1 font-black rounded-lg text-sm md:text-base ${
                                  liveTotal > 0
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : liveTotal < 0
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {liveTotal > 0 ? `+${liveTotal}` : liveTotal} đ
                              </span>
                            </td>
                            <td className="py-3 text-right pr-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(st);
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs md:text-sm font-bold transition inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lý do</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs md:text-sm text-slate-600 font-medium">
            Dữ liệu tổng hợp thi đua theo tổ chuẩn Tie-Break &bull; Trường TH&amp;THCS BÀN LONG
          </span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Nested Student Detail Modal for viewing full achievement record */}
      <StudentDetailModal
        student={selectedStudent}
        transactions={transactions}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};
