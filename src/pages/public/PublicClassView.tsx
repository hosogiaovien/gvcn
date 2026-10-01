import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  School,
  Award,
  Sparkles,
  Trophy,
  Users,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  UserCheck,
  Info,
  ChevronRight,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  ListFilter,
  GraduationCap,
  Clock,
  Layers,
  BarChart3,
  Filter,
  Eye,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import {
  publicShareService,
  SanitizedPublicViewData,
  SanitizedPublicStudentRankItem,
  PublicTransactionItem,
  formatWeekHumanLabel,
} from '../../services/publicShareService';

interface GroupModalData {
  rank: number;
  groupName: string;
  memberCount: number;
  totalPoints?: number;
  averagePoints?: number;
  plusPoints?: number;
  minusPoints?: number;
}

export const PublicClassView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SanitizedPublicViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Time & Group Filters
  const [selectedWeekScope, setSelectedWeekScope] = useState<string>('ALL'); // 'ALL' or '2026-W39', etc.
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<SanitizedPublicStudentRankItem | null>(null);
  const [selectedGroupModal, setSelectedGroupModal] = useState<GroupModalData | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'RANKINGS' | 'WEEKLY_STATS' | 'STUDENT_LIST' | 'RECENT_LOGS'>('RANKINGS');

  // Student modal states
  const [studentTxFilter, setStudentTxFilter] = useState<'ALL' | 'PLUS' | 'MINUS'>('ALL');
  const [studentViewMode, setStudentViewMode] = useState<'ALL' | 'BY_WEEK'>('BY_WEEK'); // 'ALL' or 'BY_WEEK'

  // Weekly Matrix Filters
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixGroupFilter, setMatrixGroupFilter] = useState('ALL');
  const [matrixSortBy, setMatrixSortBy] = useState<'RANK' | 'NAME' | 'POINTS'>('RANK');

  const loadData = async () => {
    setLoading(true);
    try {
      if (!shareToken) {
        setError(true);
        setLoading(false);
        return;
      }

      const res = await publicShareService.getPublicData(shareToken);
      if (res) {
        setData(res);
        setError(false);
        if (selectedStudent) {
          const updated = res.studentRankings.find((s) => s.studentId === selectedStudent.studentId);
          if (updated) setSelectedStudent(updated);
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shareToken]);

  // Active student rankings based on selected time scope (ALL or specific week)
  const activeStudentRankings = useMemo(() => {
    if (!data) return [];
    if (selectedWeekScope !== 'ALL' && data.weeklyRankingsMap?.[selectedWeekScope]) {
      return data.weeklyRankingsMap[selectedWeekScope].studentRankings;
    }
    return data.studentRankings;
  }, [data, selectedWeekScope]);

  // Active group rankings based on selected time scope
  const activeGroupRankings = useMemo(() => {
    if (!data) return [];
    if (selectedWeekScope !== 'ALL' && data.weeklyRankingsMap?.[selectedWeekScope]) {
      return data.weeklyRankingsMap[selectedWeekScope].groupRankings;
    }
    return data.groupRankings;
  }, [data, selectedWeekScope]);

  const currentScopeLabel = useMemo(() => {
    if (selectedWeekScope === 'ALL') return 'Toàn bộ thời gian (Tổng tích lũy cả năm)';
    const found = data?.availableWeeks?.find((w) => w.weekId === selectedWeekScope);
    return found ? found.label : selectedWeekScope;
  }, [data, selectedWeekScope]);

  // Filter students based on search and group
  const filteredStudents = useMemo(() => {
    return activeStudentRankings.filter((st) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        st.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGroup = groupFilter === 'ALL' || st.groupName === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [activeStudentRankings, searchTerm, groupFilter]);

  // Filter weekly matrix students
  const filteredMatrixStudents = useMemo(() => {
    if (!data?.weeklyMatrix?.students) return [];
    let list = data.weeklyMatrix.students.filter((st) => {
      const matchSearch =
        matrixSearch.trim() === '' ||
        st.displayName.toLowerCase().includes(matrixSearch.toLowerCase());
      const matchGroup = matrixGroupFilter === 'ALL' || st.groupName === matrixGroupFilter;
      return matchSearch && matchGroup;
    });

    if (matrixSortBy === 'NAME') {
      list = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (matrixSortBy === 'POINTS') {
      list = [...list].sort((a, b) => b.allTimeTotalPoints - a.allTimeTotalPoints);
    } else {
      list = [...list].sort((a, b) => a.allTimeRank - b.allTimeRank);
    }
    return list;
  }, [data, matrixSearch, matrixGroupFilter, matrixSortBy]);

  // Handle open group modal
  const handleOpenGroupModal = (grpName: string) => {
    const grp = activeGroupRankings.find((g) => g.groupName === grpName) ||
      data?.groupRankings.find((g) => g.groupName === grpName);
    if (grp) {
      setSelectedGroupModal(grp);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base text-slate-700 font-semibold">Đang tải bảng kết quả thi đua lớp...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cổng Thông Tin Thi Đua Học Sinh</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              Chào mừng quý phụ huynh! Vui lòng chọn lớp bên dưới để theo dõi kết quả thi đua và nền nếp của con:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2">
            {[
              { id: 'class-6a1', name: 'Lớp 6.1 (Khối 6)', token: 'share-6-1-official' },
              { id: 'class-6a2', name: 'Lớp 6.2 (Khối 6)', token: 'share-6-2-official' },
              { id: 'class-7a1', name: 'Lớp 7.1 (Khối 7)', token: 'share-7-1-official' },
              { id: 'class-7a2', name: 'Lớp 7.2 (Khối 7)', token: 'share-7-2-official' },
              { id: 'class-8a1', name: 'Lớp 8.1 (Khối 8)', token: 'share-8-1-official' },
              { id: 'class-8a2', name: 'Lớp 8.2 (Khối 8)', token: 'share-8-2-official' },
              { id: 'class-9a1', name: 'Lớp 9.1 (Khối 9)', token: 'share-9-1-official' },
              { id: 'class-9a2', name: 'Lớp 9.2 (Khối 9)', token: 'share-9-2-official' },
              { id: 'class-9a3', name: 'Lớp 9.3 (Khối 9)', token: 'share-9-3-official' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/public/${c.token}`)}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition flex items-center justify-between border border-indigo-100"
              >
                <span>{c.name}</span>
                <ChevronRight className="w-4 h-4 text-indigo-500" />
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/public/share-9-1-official')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-xs"
            >
              Mở Xem Bảng Thi Đua Lớp 9.1
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans antialiased text-slate-900">
      {/* Top Header Banner */}
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-100 text-xs md:text-sm font-semibold tracking-wide">
              <School className="w-4 h-4 text-indigo-200" />
              <span>{data.schoolName}</span>
              <span>&bull;</span>
              <span>Năm học {data.schoolYear}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Làm mới kết quả"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="mt-3">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-white font-black text-xs md:text-sm uppercase tracking-wider">
              Cổng Thông Tin Phụ Huynh &amp; Học Sinh &bull; Lớp {data.className}
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight text-white">
              BẢNG THEO DÕI THI ĐUA LỚP {data.className}
            </h1>
            <p className="text-white text-base md:text-lg mt-2 max-w-3xl leading-relaxed font-semibold">
              Thông tin minh bạch điểm cộng, điểm trừ, xếp hạng và lý do chi tiết từng hoạt động học tập, rèn luyện nề nếp của học sinh lớp {data.className}.
            </p>
          </div>

          {/* Quick Search for Parent's Child */}
          <div className="mt-5 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-indigo-200 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Nhập họ tên con để xem chi tiết lý do cộng / trừ điểm..."
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-base font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-4 py-3 bg-indigo-900/80 text-white border border-white/20 rounded-xl text-base font-bold focus:outline-none"
            >
              <option value="ALL" className="text-slate-900">Tất cả các tổ</option>
              <option value="Tổ 1" className="text-slate-900">Tổ 1</option>
              <option value="Tổ 2" className="text-slate-900">Tổ 2</option>
              <option value="Tổ 3" className="text-slate-900">Tổ 3</option>
              <option value="Tổ 4" className="text-slate-900">Tổ 4</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 -mt-3 space-y-5">
        {/* Dedicated Week / Time Period Selector Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                Mốc thời gian theo dõi thi đua:
              </span>
              <span className="text-sm md:text-base font-black text-slate-900">
                {currentScopeLabel}
              </span>
            </div>
          </div>

          {/* Quick Week Buttons & Dropdown */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedWeekScope('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 ${
                selectedWeekScope === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📊 Toàn bộ (Tổng)</span>
            </button>

            {data.availableWeeks?.map((w) => {
              const isSelected = selectedWeekScope === w.weekId;
              const isSchoolCurrent = w.isCurrent || w.weekId === data.currentWeekId;
              return (
                <button
                  key={w.weekId}
                  onClick={() => setSelectedWeekScope(w.weekId)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : w.isBreak
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={`${w.label}${w.note ? ` - ${w.note}` : ''}`}
                >
                  <span>{w.isBreak ? '🧧 ' : ''}{w.shortLabel}</span>
                  {isSchoolCurrent && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                        isSelected ? 'bg-amber-300 text-amber-950' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      Hiện tại
                    </span>
                  )}
                  {w.transactionCount > 0 && !w.isBreak && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {w.transactionCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Informational banner when viewing a specific week */}
        {selectedWeekScope !== 'ALL' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Đang xem kết quả thi đua: <strong>{currentScopeLabel}</strong>
                {(() => {
                  const selWeek = data.availableWeeks?.find((w) => w.weekId === selectedWeekScope);
                  if (selWeek?.isBreak) {
                    return (
                      <span className="ml-2 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        🧧 Tuần nghỉ ({selWeek.note || 'Nghỉ Tết/Lễ'}) - không chấm điểm thi đua
                      </span>
                    );
                  }
                  if (selWeek?.note) {
                    return (
                      <span className="ml-2 font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        📌 {selWeek.note}
                      </span>
                    );
                  }
                  return '. Bảng xếp hạng và điểm số bên dưới hiển thị riêng trong tuần này.';
                })()}
              </span>
            </div>
            <button
              onClick={() => setSelectedWeekScope('ALL')}
              className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition text-xs shadow-2xs"
            >
              Xem toàn bộ cả năm &rarr;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('RANKINGS')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm md:text-base transition flex items-center justify-center gap-2 ${
              activeTab === 'RANKINGS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" /> Bảng Xếp Hạng &amp; Tổng Điểm
          </button>
          <button
            onClick={() => setActiveTab('WEEKLY_STATS')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm md:text-base transition flex items-center justify-center gap-2 ${
              activeTab === 'WEEKLY_STATS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Thống Kê Điểm Theo Tuần
          </button>
          <button
            onClick={() => setActiveTab('STUDENT_LIST')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm md:text-base transition flex items-center justify-center gap-2 ${
              activeTab === 'STUDENT_LIST'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> Chi Tiết Học Sinh ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('RECENT_LOGS')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm md:text-base transition flex items-center justify-center gap-2 ${
              activeTab === 'RECENT_LOGS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> Nhật Ký Hoạt Động Chung
          </button>
        </div>

        {/* Tab 1: Rankings & Group Standings */}
        {activeTab === 'RANKINGS' && (
          <div className="space-y-6">
            {/* Group Leaderboard with Interactive Clickable Cards */}
            {data.config.showGroupRank && activeGroupRankings.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg md:text-xl flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" /> Bảng Xếp Hạng Thi Đua Giữa Các Tổ
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 font-medium mt-1 leading-relaxed">
                      Bấm vào bất kỳ tổ nào bên dưới để <strong className="text-indigo-600">xem chi tiết báo cáo thi đua tổ</strong> hoặc <strong className="text-indigo-600">lọc danh sách học sinh</strong>.
                    </p>
                  </div>
                  <span className="text-xs md:text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full w-fit">
                    {activeGroupRankings.length} Tổ thi đua
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {activeGroupRankings.map((grp) => {
                    const isFiltered = groupFilter === grp.groupName;
                    return (
                      <div
                        key={grp.groupName}
                        onClick={() => handleOpenGroupModal(grp.groupName)}
                        className={`p-4 rounded-2xl border transition cursor-pointer text-center relative flex flex-col justify-between group ${
                          isFiltered
                            ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/80 shadow-md'
                            : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white hover:border-indigo-300 shadow-2xs hover:shadow-xs'
                        }`}
                        title={`Bấm để xem chi tiết báo cáo thi đua ${grp.groupName}`}
                      >
                        <div>
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm mb-2 ${
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
                          <div className="font-black text-base md:text-lg text-slate-900 group-hover:text-indigo-700 transition">
                            {grp.groupName}
                          </div>
                          <div className="text-xs md:text-sm text-slate-500 font-semibold mt-0.5">
                            {grp.memberCount} học sinh
                          </div>
                          {data.config.showPoints && grp.totalPoints !== undefined && (
                            <div className="text-lg md:text-xl font-black text-indigo-700 mt-2">
                              {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                            </div>
                          )}
                        </div>

                        {/* Interactive Buttons on Group Card */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGroupModal(grp.groupName);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center gap-1"
                            title="Mở hồ sơ chi tiết tổ"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem tổ</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupFilter(isFiltered ? 'ALL' : grp.groupName);
                            }}
                            className={`px-2 py-1 rounded-lg transition ${
                              isFiltered
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title={isFiltered ? 'Bỏ lọc tổ này' : 'Lọc học sinh tổ này'}
                          >
                            {isFiltered ? 'Đang lọc' : 'Lọc HS'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Student Leaderboard */}
            {data.config.showClassRank && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg md:text-xl flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-indigo-600" /> Bảng Xếp Hạng Cá Nhân
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 font-medium mt-1 leading-relaxed">
                      {groupFilter !== 'ALL' ? (
                        <strong className="text-indigo-600">Đang lọc xem: {groupFilter} &bull; </strong>
                      ) : null}
                      Bấm vào học sinh bất kỳ để xem lịch sử theo tuần &amp; theo tổng
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {groupFilter !== 'ALL' && (
                      <button
                        onClick={() => setGroupFilter('ALL')}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Bỏ lọc {groupFilter} &times;
                      </button>
                    )}
                    <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                      {filteredStudents.length} học sinh
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm md:text-base">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs md:text-sm">
                      <tr>
                        <th className="py-3.5 pl-4 w-16">Hạng</th>
                        <th className="py-3.5">Họ và tên học sinh</th>
                        <th className="py-3.5">Tổ</th>
                        {data.config.showPlusMinus && (
                          <>
                            <th className="py-3.5 text-center text-emerald-700">Điểm cộng (+)</th>
                            <th className="py-3.5 text-center text-rose-700">Điểm trừ (-)</th>
                          </>
                        )}
                        {data.config.showPoints && (
                          <th className="py-3.5 text-center">Tổng điểm</th>
                        )}
                        <th className="py-3.5 text-right pr-4">Lý do chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => (
                        <tr
                          key={st.studentId}
                          onClick={() => setSelectedStudent(st)}
                          className="hover:bg-indigo-50/60 cursor-pointer transition"
                        >
                          <td className="py-3.5 pl-4">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                                st.rank === 1
                                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                                  : st.rank === 2
                                  ? 'bg-slate-300 text-slate-800'
                                  : st.rank === 3
                                  ? 'bg-amber-800 text-white'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {st.rank}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="font-bold text-base md:text-lg text-slate-900 hover:text-indigo-600 transition">
                              {st.displayName}
                            </div>
                            <div className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                              {st.transactions?.length || 0} lần ghi nhận
                            </div>
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700 text-base">{st.groupName}</td>
                          {data.config.showPlusMinus && (
                            <>
                              <td className="py-3.5 text-center font-bold text-emerald-700 text-base">
                                +{st.plusPoints ?? 0}
                              </td>
                              <td className="py-3.5 text-center font-bold text-rose-700 text-base">
                                -{st.minusPoints ?? 0}
                              </td>
                            </>
                          )}
                          {data.config.showPoints && (
                            <td className="py-3.5 text-center">
                              <span className="font-black text-base px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                                {(st.totalPoints ?? 0) > 0 ? `+${st.totalPoints}` : st.totalPoints ?? 0} đ
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 text-right pr-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(st);
                              }}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition inline-flex items-center gap-1 shadow-xs"
                            >
                              <span>Xem lịch sử</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Thống Kê Điểm Theo Tuần (Weekly Score Matrix & Statistics) */}
        {activeTab === 'WEEKLY_STATS' && (
          <div className="space-y-6">
            {/* Group Weekly Comparison Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg md:text-xl flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Bảng Điểm Thi Đua Từng Tuần Của 4 Tổ
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 font-medium mt-1 leading-relaxed">
                    Theo dõi điểm số biến động qua từng tuần của các tổ. Bấm vào tổ để xem danh sách thành viên.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm md:text-base">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs md:text-sm">
                    <tr>
                      <th className="py-3.5 pl-4 w-16">Hạng</th>
                      <th className="py-3.5">Tổ thi đua</th>
                      <th className="py-3.5 text-center">Thành viên</th>
                      {data.weeklyMatrix?.weeks.map((w) => (
                        <th key={w.weekId} className="py-3.5 text-center">
                          {w.shortLabel}
                        </th>
                      ))}
                      <th className="py-3.5 text-center bg-indigo-50/50 text-indigo-900">Tổng điểm</th>
                      <th className="py-3.5 text-right pr-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.weeklyMatrix?.groupWeeklyScores.map((grp) => (
                      <tr
                        key={grp.groupName}
                        onClick={() => handleOpenGroupModal(grp.groupName)}
                        className="hover:bg-indigo-50/60 cursor-pointer transition"
                      >
                        <td className="py-3.5 pl-4">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                              grp.rank === 1
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : grp.rank === 2
                                ? 'bg-slate-300 text-slate-800'
                                : grp.rank === 3
                                ? 'bg-amber-800 text-white'
                                : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            #{grp.rank}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-900 text-base md:text-lg">
                          {grp.groupName}
                        </td>
                        <td className="py-3.5 text-center text-slate-600 font-medium">
                          {grp.memberCount} HS
                        </td>
                        {data.weeklyMatrix?.weeks.map((w) => {
                          const pts = grp.weeklyScores[w.weekId] ?? 0;
                          return (
                            <td key={w.weekId} className="py-3.5 text-center font-bold">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs md:text-sm font-black inline-block ${
                                  pts > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : pts < 0
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {pts > 0 ? `+${pts}` : pts} đ
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3.5 text-center bg-indigo-50/50">
                          <span className="font-black text-base px-3 py-1 rounded-lg bg-indigo-600 text-white">
                            {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGroupModal(grp.groupName);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition"
                          >
                            Chi tiết tổ &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Weekly Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg md:text-xl flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Bảng Thống Kê Điểm Từng Tuần Của Từng Học Sinh
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 font-medium mt-1 leading-relaxed">
                    Theo dõi đầy đủ điểm số từng tuần: Tuần 1, Tuần 2, Tuần 3, Tuần 4... Bấm vào dòng của con để xem chi tiết lý do.
                  </p>
                </div>

                {/* Filter & Sort Controls for Weekly Matrix */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Tìm tên học sinh..."
                      className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <select
                    value={matrixGroupFilter}
                    onChange={(e) => setMatrixGroupFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs md:text-sm font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Tất cả các tổ</option>
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Tổ 3">Tổ 3</option>
                    <option value="Tổ 4">Tổ 4</option>
                  </select>

                  <select
                    value={matrixSortBy}
                    onChange={(e) => setMatrixSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs md:text-sm font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="RANK">Sắp xếp: Thứ hạng</option>
                    <option value="POINTS">Sắp xếp: Điểm cao nhất</option>
                    <option value="NAME">Sắp xếp: Tên A-Z</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm md:text-base">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs md:text-sm">
                    <tr>
                      <th className="py-3.5 pl-4 w-16">Hạng</th>
                      <th className="py-3.5 min-w-[160px]">Họ và tên học sinh</th>
                      <th className="py-3.5 w-20">Tổ</th>
                      {data.weeklyMatrix?.weeks.map((w) => (
                        <th key={w.weekId} className="py-3.5 text-center min-w-[95px]">
                          <div className="font-bold">{w.shortLabel}</div>
                          {w.isBreak && (
                            <span className="text-[9px] text-amber-800 bg-amber-100/90 border border-amber-200 px-1 py-0.2 rounded font-bold block mt-0.5 whitespace-nowrap">
                              🧧 Nghỉ Tết/Lễ
                            </span>
                          )}
                          {w.isCurrent && (
                            <span className="text-[9px] text-indigo-800 bg-indigo-100 border border-indigo-200 px-1 py-0.2 rounded font-black block mt-0.5 whitespace-nowrap">
                              ★ Hiện tại
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="py-3.5 text-center min-w-[110px] bg-indigo-50/60 text-indigo-950">
                        Tổng điểm
                      </th>
                      <th className="py-3.5 text-right pr-4 min-w-[130px]">Lý do chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMatrixStudents.map((st) => {
                      const studentRankItem = activeStudentRankings.find((s) => s.studentId === st.studentId) || {
                        studentId: st.studentId,
                        rank: st.allTimeRank,
                        displayName: st.displayName,
                        groupName: st.groupName,
                        totalPoints: st.allTimeTotalPoints,
                        plusPoints: st.allTimePlusPoints,
                        minusPoints: st.allTimeMinusPoints,
                        transactions: st.allTransactions,
                        allTransactions: st.allTransactions,
                      };

                      return (
                        <tr
                          key={st.studentId}
                          onClick={() => setSelectedStudent(studentRankItem)}
                          className="hover:bg-indigo-50/60 cursor-pointer transition"
                        >
                          <td className="py-3.5 pl-4">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs md:text-sm ${
                                st.allTimeRank === 1
                                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                                  : st.allTimeRank === 2
                                  ? 'bg-slate-300 text-slate-800'
                                  : st.allTimeRank === 3
                                  ? 'bg-amber-800 text-white'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {st.allTimeRank}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="font-bold text-base md:text-lg text-slate-900 hover:text-indigo-600 transition">
                              {st.displayName}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {st.allTransactions?.length || 0} lần ghi nhận
                            </div>
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700 text-base">{st.groupName}</td>
                          {data.weeklyMatrix?.weeks.map((w) => {
                            const pts = st.weeklyScores[w.weekId] ?? 0;
                            const plus = st.weeklyPlus[w.weekId] ?? 0;
                            const minus = st.weeklyMinus[w.weekId] ?? 0;
                            return (
                              <td key={w.weekId} className="py-3.5 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs md:text-sm font-black inline-block ${
                                    pts > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : pts < 0
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                  title={`${w.label}: +${plus} điểm cộng, -${minus} điểm trừ`}
                                >
                                  {pts > 0 ? `+${pts}` : pts} đ
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3.5 text-center bg-indigo-50/60">
                            <span className="font-black text-base px-3 py-1 rounded-lg bg-indigo-600 text-white">
                              {st.allTimeTotalPoints > 0 ? `+${st.allTimeTotalPoints}` : st.allTimeTotalPoints} đ
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(studentRankItem);
                              }}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition inline-flex items-center gap-1 shadow-xs"
                            >
                              <span>Xem lịch sử</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Student Card List (Easy for mobile parents) */}
        {activeTab === 'STUDENT_LIST' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((st) => (
                <div
                  key={st.studentId}
                  onClick={() => setSelectedStudent(st)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 font-black text-base flex items-center justify-center shadow-xs">
                        #{st.rank}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg md:text-xl">{st.displayName}</h3>
                        <p className="text-base font-bold text-slate-700 mt-1">{st.groupName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl md:text-2xl font-black text-indigo-700">
                        {(st.totalPoints ?? 0) > 0 ? `+${st.totalPoints}` : st.totalPoints ?? 0} đ
                      </div>
                      <div className="text-sm font-bold text-slate-500 mt-0.5">
                        Hạng #{st.rank}
                      </div>
                    </div>
                  </div>

                  {/* Summary of plus and minus */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm">
                        +{st.plusPoints || 0} điểm cộng
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-sm">
                        -{st.minusPoints || 0} điểm trừ
                      </span>
                    </div>

                    <span className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 text-sm md:text-base">
                      Xem chi tiết &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Recent Activity Logs */}
        {activeTab === 'RECENT_LOGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Nhật Ký Hoạt Động Thi Đua Gần Đây
            </h3>
            <div className="space-y-3">
              {(data.recentTransactions || []).slice(0, 40).map((tx) => (
                <div
                  key={tx.transactionId}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm transition ${
                    tx.type === 'PLUS'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs ${
                          tx.type === 'PLUS'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {tx.type === 'PLUS' ? `+${Math.abs(tx.points)}` : `-${Math.abs(tx.points)}`}
                      </span>
                      <span className="font-bold text-slate-900">{tx.studentDisplayName}</span>
                      <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {tx.groupName || 'Tổ'}
                      </span>
                      {tx.weekId && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded">
                          {formatWeekHumanLabel(tx.weekId).shortLabel}
                        </span>
                      )}
                      <span className="text-slate-700 font-medium">&bull; {tx.criterionName}</span>
                    </div>
                    {tx.reason && (
                      <p className="text-slate-800 text-xs md:text-sm mt-1.5 italic bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                        &ldquo;{tx.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                    {tx.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-sm md:text-base text-slate-600 space-y-1.5 pt-4">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Hệ thống thi đua học sinh bảo mật &amp; chính xác</span>
          </div>
          <div>Trường TH&amp;THCS BÀN LONG &bull; Năm học 2026–2027 &bull; Lớp {data.className}</div>
        </div>
      </main>

      {/* GROUP DETAIL MODAL: Báo Cáo Chi Tiết Thi Đua Tổ */}
      {selectedGroupModal && (() => {
        const groupMembers = activeStudentRankings.filter((s) => s.groupName === selectedGroupModal.groupName);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 text-white font-black text-base flex items-center justify-center shadow-inner">
                    #{selectedGroupModal.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider">
                        Báo Cáo Thi Đua Tổ
                      </span>
                      <span className="text-white/80 text-xs font-semibold">&bull;</span>
                      <span className="text-white/90 text-xs font-bold">Lớp {data.className}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
                      {selectedGroupModal.groupName}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGroupModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fast Group Switcher Tabs */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                  Chuyển nhanh xem tổ khác:
                </span>
                <div className="flex items-center gap-1.5">
                  {activeGroupRankings.map((g) => (
                    <button
                      key={g.groupName}
                      onClick={() => setSelectedGroupModal(g)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 ${
                        selectedGroupModal.groupName === g.groupName
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{g.groupName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                        #{g.rank}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Summary Stats Cards */}
              <div className="p-5 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
                    <span className="text-xs font-bold text-indigo-800 uppercase block">Thứ hạng</span>
                    <span className="text-2xl font-black text-indigo-900 mt-1 block">
                      Hạng #{selectedGroupModal.rank}
                    </span>
                    <span className="text-xs text-indigo-700 font-medium">Trong {activeGroupRankings.length} tổ</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                    <span className="text-xs font-bold text-emerald-800 uppercase block">Tổng điểm thi đua</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">
                      {selectedGroupModal.totalPoints !== undefined
                        ? (selectedGroupModal.totalPoints > 0
                            ? `+${selectedGroupModal.totalPoints}`
                            : selectedGroupModal.totalPoints)
                        : 0} đ
                    </span>
                    <span className="text-xs text-emerald-700 font-medium">{currentScopeLabel}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-600 uppercase block">Sĩ số thành viên</span>
                    <span className="text-2xl font-black text-slate-800 mt-1 block">
                      {groupMembers.length} HS
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Lớp {data.className}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                    <span className="text-xs font-bold text-amber-800 uppercase block">Điểm trung bình</span>
                    <span className="text-2xl font-black text-amber-900 mt-1 block">
                      {selectedGroupModal.averagePoints ?? 0} đ
                    </span>
                    <span className="text-xs text-amber-700 font-medium">Mỗi học sinh</span>
                  </div>
                </div>

                {/* Member List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Danh Sách Học Sinh Trong {selectedGroupModal.groupName} ({groupMembers.length} em)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Bấm vào học sinh để xem lịch sử
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs sticky top-0">
                        <tr>
                          <th className="py-2.5 pl-4 w-14">Hạng</th>
                          <th className="py-2.5">Họ và tên</th>
                          <th className="py-2.5 text-center text-emerald-700">Điểm cộng (+)</th>
                          <th className="py-2.5 text-center text-rose-700">Điểm trừ (-)</th>
                          <th className="py-2.5 text-center">Tổng điểm</th>
                          <th className="py-2.5 text-right pr-4">Hồ sơ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupMembers.map((st) => (
                          <tr
                            key={st.studentId}
                            onClick={() => {
                              setSelectedGroupModal(null);
                              setSelectedStudent(st);
                            }}
                            className="hover:bg-indigo-50/60 cursor-pointer transition"
                          >
                            <td className="py-2.5 pl-4 font-bold text-slate-700">
                              #{st.rank}
                            </td>
                            <td className="py-2.5 font-bold text-slate-900 hover:text-indigo-600">
                              {st.displayName}
                            </td>
                            <td className="py-2.5 text-center font-bold text-emerald-700">
                              +{st.plusPoints || 0}
                            </td>
                            <td className="py-2.5 text-center font-bold text-rose-700">
                              -{st.minusPoints || 0}
                            </td>
                            <td className="py-2.5 text-center font-black text-indigo-700">
                              {(st.totalPoints ?? 0) > 0 ? `+${st.totalPoints}` : st.totalPoints ?? 0} đ
                            </td>
                            <td className="py-2.5 text-right pr-4">
                              <span className="text-xs font-bold text-indigo-600 hover:underline">
                                Xem &rarr;
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    setGroupFilter(selectedGroupModal.groupName);
                    setSelectedGroupModal(null);
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs md:text-sm font-bold rounded-xl transition"
                >
                  Lọc danh sách học sinh ngoài bảng theo {selectedGroupModal.groupName}
                </button>
                <button
                  onClick={() => setSelectedGroupModal(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs md:text-sm font-bold rounded-xl transition shadow-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETAIL MODAL: Detailed Reason for Plus Points and Minus Points with Group by Week & All */}
      {selectedStudent && (() => {
        const studentTxs =
          selectedStudent.allTransactions && selectedStudent.allTransactions.length > 0
            ? selectedStudent.allTransactions
            : selectedStudent.transactions || [];

        const plusTxs = studentTxs.filter((t) => t.type === 'PLUS');
        const minusTxs = studentTxs.filter((t) => t.type === 'MINUS');
        const plusFromTxs = plusTxs.reduce((acc, t) => acc + Math.abs(t.points), 0);
        const minusFromTxs = minusTxs.reduce((acc, t) => acc + Math.abs(t.points), 0);

        const livePlus =
          selectedStudent.allTimePlusPoints !== undefined && selectedStudent.allTimePlusPoints !== 0
            ? selectedStudent.allTimePlusPoints
            : selectedStudent.plusPoints !== undefined && selectedStudent.plusPoints !== 0
            ? selectedStudent.plusPoints
            : plusFromTxs;

        const liveMinus =
          selectedStudent.allTimeMinusPoints !== undefined && selectedStudent.allTimeMinusPoints !== 0
            ? selectedStudent.allTimeMinusPoints
            : selectedStudent.minusPoints !== undefined && selectedStudent.minusPoints !== 0
            ? selectedStudent.minusPoints
            : minusFromTxs;

        const liveTotal =
          selectedStudent.allTimeTotalPoints !== undefined && selectedStudent.allTimeTotalPoints !== 0
            ? selectedStudent.allTimeTotalPoints
            : selectedStudent.totalPoints !== undefined && selectedStudent.totalPoints !== 0
            ? selectedStudent.totalPoints
            : livePlus - liveMinus;

        // Filter by plus/minus
        const filteredList = studentTxs.filter((tx) => {
          if (studentTxFilter === 'PLUS') return tx.type === 'PLUS';
          if (studentTxFilter === 'MINUS') return tx.type === 'MINUS';
          return true;
        });

        // Group transactions by week for 'BY_WEEK' mode
        const weekGroupsMap = new Map<
          string,
          {
            weekId: string;
            weekLabel: string;
            shortLabel: string;
            txs: PublicTransactionItem[];
            plus: number;
            minus: number;
            total: number;
          }
        >();

        // Pre-populate standard weeks
        data.availableWeeks.forEach((w) => {
          weekGroupsMap.set(w.weekId, {
            weekId: w.weekId,
            weekLabel: w.label,
            shortLabel: w.shortLabel,
            txs: [],
            plus: 0,
            minus: 0,
            total: 0,
          });
        });

        filteredList.forEach((tx) => {
          const wid = tx.weekId || 'OTHER';
          const cur = weekGroupsMap.get(wid) || {
            weekId: wid,
            weekLabel: formatWeekHumanLabel(wid).label,
            shortLabel: formatWeekHumanLabel(wid).shortLabel,
            txs: [],
            plus: 0,
            minus: 0,
            total: 0,
          };
          cur.txs.push(tx);
          if (tx.type === 'PLUS') {
            cur.plus += Math.abs(tx.points);
            cur.total += Math.abs(tx.points);
          } else {
            cur.minus += Math.abs(tx.points);
            cur.total -= Math.abs(tx.points);
          }
          weekGroupsMap.set(wid, cur);
        });

        const sortedWeekGroups = Array.from(weekGroupsMap.values())
          .filter((g) => g.txs.length > 0 || (studentTxFilter === 'ALL' && g.weekId.startsWith('2026-W')))
          .sort((a, b) => b.weekId.localeCompare(a.weekId));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-5xl lg:max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
              {/* Compact top header */}
              <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 text-white font-black text-base flex items-center justify-center shadow-inner">
                    {selectedStudent.displayName.split(' ').pop()?.substring(0, 1) || 'H'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider">
                        Hồ Sơ Thi Đua Học Sinh
                      </span>
                      <span className="text-white/80 text-xs font-semibold">&bull;</span>
                      <span className="text-white/90 text-xs font-bold">{selectedStudent.groupName}</span>
                      <span className="text-white/80 text-xs font-semibold">&bull;</span>
                      <span className="text-white/90 text-xs font-bold">Lớp {data.className}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
                      {selectedStudent.displayName}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Xếp hạng: #{selectedStudent.allTimeRank || selectedStudent.rank}</span>
                  </span>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition"
                    title="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Desktop 2-column layout: Left sidebar for summary, Right for full-height transaction log */}
              <div className="md:flex md:flex-row flex-col flex-1 overflow-hidden min-h-0">
                {/* Left Summary Panel */}
                <div className="md:w-80 lg:w-96 shrink-0 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
                  <div className="space-y-4">
                    {/* Student profile info card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Thứ hạng toàn lớp</span>
                        <span className="font-bold text-sm bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full border border-amber-200">
                          Hạng #{selectedStudent.allTimeRank || selectedStudent.rank} / {activeStudentRankings.length} HS
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">Tổ sinh hoạt:</span>
                        <span className="font-bold text-slate-900">{selectedStudent.groupName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">Lớp học:</span>
                        <span className="font-bold text-slate-900">{data.className}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                        <span className="text-slate-600 font-medium">Tổng lượt chấm:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {studentTxs.length} lần ghi nhận
                        </span>
                      </div>
                    </div>

                    {/* 3 Score Cards - Stacked cleanly with vibrant styling */}
                    <div className="space-y-3">
                      {/* Total Points */}
                      <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Tổng Điểm Tích Lũy
                          </span>
                          <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div
                          className={`text-3xl md:text-4xl font-black mt-1 ${
                            liveTotal > 0 ? 'text-indigo-700' : liveTotal < 0 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {liveTotal > 0 ? `+${liveTotal}` : liveTotal} đ
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          Điểm thi đua tích lũy rèn luyện cả năm
                        </div>
                      </div>

                      {/* Plus Points */}
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                            Tổng Điểm Cộng (+)
                          </span>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            {plusTxs.length} lần
                          </span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-emerald-600 mt-1">
                          +{livePlus} đ
                        </div>
                        <div className="text-xs text-emerald-800/80 font-medium mt-1">
                          Khen thưởng học tập, phong trào &amp; nề nếp
                        </div>
                      </div>

                      {/* Minus Points */}
                      <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                            Tổng Điểm Trừ (-)
                          </span>
                          <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                            {minusTxs.length} lần
                          </span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-rose-600 mt-1">
                          -{liveMinus} đ
                        </div>
                        <div className="text-xs text-rose-800/80 font-medium mt-1">
                          Vi phạm nội quy hoặc chuyên cần
                        </div>
                      </div>
                    </div>

                    {/* Weekly Points Strip inside Student Modal */}
                    {data.weeklyMatrix && (
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          Điểm qua các tuần học:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                          {data.weeklyMatrix.weeks.map((w) => {
                            const matrixRow = data.weeklyMatrix.students.find(
                              (s) => s.studentId === selectedStudent.studentId
                            );
                            const pts = matrixRow?.weeklyScores[w.weekId] ?? 0;
                            return (
                              <div
                                key={w.weekId}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                              >
                                <span className="text-slate-600 font-bold">{w.shortLabel}:</span>
                                <span
                                  className={`font-black ${
                                    pts > 0 ? 'text-emerald-700' : pts < 0 ? 'text-rose-600' : 'text-slate-500'
                                  }`}
                                >
                                  {pts > 0 ? `+${pts}` : pts} đ
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trust Footer */}
                  <div className="text-xs text-slate-500 font-medium bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 leading-relaxed mt-4">
                    Dữ liệu được cập nhật chính thức bởi GVCN lớp {data.className} &bull; Trường TH&amp;THCS BÀN LONG
                  </div>
                </div>

                {/* Right Panel: Transaction Log with Group by Week & All Options */}
                <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
                  {/* Filter toolbar & Mode Toggle (Gom nhóm theo tuần / Xem theo tổng) */}
                  <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 shrink-0">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setStudentViewMode('BY_WEEK')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                          studentViewMode === 'BY_WEEK'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Gom nhóm theo tuần</span>
                      </button>
                      <button
                        onClick={() => setStudentViewMode('ALL')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                          studentViewMode === 'ALL'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Xem theo tổng</span>
                      </button>
                    </div>

                    {/* Sub-filter buttons */}
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setStudentTxFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          studentTxFilter === 'ALL'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tất cả ({studentTxs.length})
                      </button>
                      <button
                        onClick={() => setStudentTxFilter('PLUS')}
                        className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                          studentTxFilter === 'PLUS'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        <span>🟢 Điểm cộng</span>
                        <span>({plusTxs.length})</span>
                      </button>
                      <button
                        onClick={() => setStudentTxFilter('MINUS')}
                        className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                          studentTxFilter === 'MINUS'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-rose-800 hover:bg-rose-50'
                        }`}
                      >
                        <span>🔴 Điểm trừ</span>
                        <span>({minusTxs.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction Cards List - Mode 1: Group By Week */}
                  {studentViewMode === 'BY_WEEK' ? (
                    <div className="p-5 overflow-y-auto flex-1 space-y-5">
                      {sortedWeekGroups.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                          <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-base font-semibold text-slate-600">
                            Không có dữ liệu trong mục này.
                          </p>
                        </div>
                      ) : (
                        sortedWeekGroups.map((group) => (
                          <div
                            key={group.weekId}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                          >
                            {/* Week Group Header with subtotal */}
                            <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                <span className="font-black text-slate-900 text-sm md:text-base">
                                  {group.weekLabel}
                                </span>
                                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {group.txs.length} lần chấm
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold">
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  +{group.plus} cộng
                                </span>
                                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  -{group.minus} trừ
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded font-black text-xs md:text-sm ${
                                    group.total > 0
                                      ? 'bg-indigo-600 text-white'
                                      : group.total < 0
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  Tuần: {group.total > 0 ? `+${group.total}` : group.total} đ
                                </span>
                              </div>
                            </div>

                            {/* Transactions inside this week */}
                            <div className="p-3.5 space-y-2.5 bg-slate-50/30">
                              {group.txs.length === 0 ? (
                                <div className="text-xs text-slate-400 italic py-2 text-center">
                                  Không có phát sinh cộng trừ điểm trong tuần này.
                                </div>
                              ) : (
                                group.txs.map((tx) => (
                                  <div
                                    key={tx.transactionId}
                                    className={`p-3.5 rounded-xl border transition ${
                                      tx.type === 'PLUS'
                                        ? 'bg-white border-emerald-200 hover:border-emerald-300'
                                        : 'bg-white border-rose-200 hover:border-rose-300'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className={`px-2 py-0.5 rounded-md text-xs font-black ${
                                              tx.type === 'PLUS'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-rose-600 text-white'
                                            }`}
                                          >
                                            {tx.type === 'PLUS'
                                              ? `+${Math.abs(tx.points)} ĐIỂM`
                                              : `-${Math.abs(tx.points)} ĐIỂM`}
                                          </span>
                                          <span className="font-bold text-slate-900 text-sm md:text-base">
                                            {tx.criterionName}
                                          </span>
                                        </div>

                                        {/* Reason */}
                                        <div className="mt-2 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed font-medium">
                                          <strong className="text-indigo-950 font-bold block mb-0.5 text-xs uppercase tracking-wider">
                                            {tx.type === 'PLUS'
                                              ? '🌟 Lý do khen thưởng cụ thể:'
                                              : '⚠️ Lý do / Lỗi vi phạm cụ thể:'}
                                          </strong>
                                          &ldquo;{tx.reason || tx.note || 'Theo đúng quy chế tiêu chí thi đua đã ban hành.'}&rdquo;
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 justify-end">
                                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                          {tx.date}
                                        </span>
                                        <div className="text-xs text-slate-500 mt-1 font-semibold">
                                          {tx.createdByName}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Transaction Cards List - Mode 2: Chronological Full List */
                    <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
                      {filteredList.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                          <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-base font-semibold text-slate-600">
                            Chưa có ghi nhận nào trong danh mục này.
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            Các sự kiện cộng hoặc trừ điểm của học sinh sẽ hiển thị chi tiết tại đây.
                          </p>
                        </div>
                      ) : (
                        filteredList.map((tx) => (
                          <div
                            key={tx.transactionId}
                            className={`p-4 rounded-2xl border transition shadow-2xs hover:shadow-xs ${
                              tx.type === 'PLUS'
                                ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                                : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg text-xs md:text-sm font-black ${
                                      tx.type === 'PLUS'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 text-white'
                                    }`}
                                  >
                                    {tx.type === 'PLUS'
                                      ? `+${Math.abs(tx.points)} ĐIỂM`
                                      : `-${Math.abs(tx.points)} ĐIỂM`}
                                  </span>
                                  <span className="font-bold text-slate-900 text-base md:text-lg">
                                    {tx.criterionName}
                                  </span>
                                  {tx.weekId && (
                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                      {formatWeekHumanLabel(tx.weekId).shortLabel}
                                    </span>
                                  )}
                                </div>

                                {/* Concrete Reason display */}
                                <div className="mt-2.5 text-base text-slate-900 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs leading-relaxed font-medium">
                                  <strong className="text-indigo-950 font-bold block mb-1 text-xs uppercase tracking-wider">
                                    {tx.type === 'PLUS'
                                      ? '🌟 Lý do khen thưởng cụ thể:'
                                      : '⚠️ Lý do / Lỗi vi phạm cụ thể:'}
                                  </strong>
                                  &ldquo;{tx.reason || tx.note || 'Theo đúng quy chế tiêu chí thi đua đã ban hành.'}&rdquo;
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs md:text-sm font-bold text-slate-700 flex items-center gap-1 justify-end">
                                  <Calendar className="w-4 h-4 text-indigo-500" />
                                  {tx.date}
                                </span>
                                <div className="text-xs md:text-sm text-slate-600 mt-1 font-semibold">
                                  Người chấm: {tx.createdByName}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Modal Footer of Right Panel */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                      Thông tin được cập nhật chính thức bởi GVCN lớp {data.className}
                    </span>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition shadow-xs"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
