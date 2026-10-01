import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  ListFilter,
  Layers,
} from 'lucide-react';
import { Student, CompetitionTransaction } from '../types';
import { formatWeekHumanLabel } from '../services/publicShareService';

interface Props {
  student: Student | null;
  transactions: CompetitionTransaction[];
  isOpen: boolean;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<Props> = ({
  student,
  transactions,
  isOpen,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'PLUS' | 'MINUS'>('ALL');
  const [viewGrouping, setViewGrouping] = useState<'ALL' | 'BY_WEEK'>('ALL');

  if (!isOpen || !student) return null;

  const studentTxs = transactions.filter(
    (t) =>
      t.studentId === student.studentId ||
      (t.studentName && t.studentName.trim().toLowerCase() === student.fullName.trim().toLowerCase())
  );

  const plusTxs = studentTxs.filter((t) => t.type === 'PLUS' && t.status === 'APPROVED');
  const minusTxs = studentTxs.filter((t) => t.type === 'MINUS' && t.status === 'APPROVED');

  const plusFromTxs = plusTxs.reduce((acc, t) => acc + Math.abs(t.points), 0);
  const minusFromTxs = minusTxs.reduce((acc, t) => acc + Math.abs(t.points), 0);

  const plusPoints = plusFromTxs > 0 ? plusFromTxs : student.plusPoints || 0;
  const minusPoints = minusFromTxs > 0 ? minusFromTxs : student.minusPoints || 0;
  const netPoints =
    plusFromTxs > 0 || minusFromTxs > 0
      ? plusFromTxs - minusFromTxs
      : student.totalPoints ?? (plusPoints - minusPoints);

  const filteredTxs = studentTxs.filter((t) => {
    if (filterType === 'PLUS') return t.type === 'PLUS';
    if (filterType === 'MINUS') return t.type === 'MINUS';
    return true;
  });

  // Group transactions by week for 'BY_WEEK' mode
  const weekGroupsMap = new Map<
    string,
    {
      weekId: string;
      weekLabel: string;
      txs: CompetitionTransaction[];
      plus: number;
      minus: number;
      total: number;
    }
  >();

  filteredTxs.forEach((tx) => {
    const wid = tx.weekId || 'OTHER';
    const cur = weekGroupsMap.get(wid) || {
      weekId: wid,
      weekLabel: formatWeekHumanLabel(wid).label,
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

  const sortedWeekGroups = Array.from(weekGroupsMap.values()).sort((a, b) =>
    b.weekId.localeCompare(a.weekId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl lg:max-w-6xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Compact, elegant top header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 text-white font-black text-base flex items-center justify-center shadow-inner">
              {student.fullName.split(' ').pop()?.substring(0, 1) || 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider">
                  Hồ Sơ Thi Đua Cá Nhân
                </span>
                <span className="text-white/80 text-xs font-semibold">&bull;</span>
                <span className="text-white/90 text-xs font-bold">{student.groupName || student.groupId}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
                {student.fullName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Dữ liệu chính thức</span>
            </span>
            <button
              onClick={onClose}
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
              {/* Student info card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Mã học sinh</span>
                  <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg">
                    {student.studentCode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Tổ sinh hoạt:</span>
                  <span className="font-bold text-slate-900">{student.groupName || student.groupId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Giới tính:</span>
                  <span className="font-semibold text-slate-800">{student.gender === 'NAM' ? 'Nam' : 'Nữ'}</span>
                </div>
                {student.dateOfBirth && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Ngày sinh:</span>
                    <span className="font-semibold text-slate-800">{student.dateOfBirth}</span>
                  </div>
                )}
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
                      Tổng Điểm Thi Đua
                    </span>
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div
                    className={`text-3xl md:text-4xl font-black mt-1 ${
                      netPoints > 0 ? 'text-indigo-700' : netPoints < 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {netPoints > 0 ? `+${netPoints}` : netPoints} đ
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Điểm thi đua tích lũy rèn luyện
                  </div>
                </div>

                {/* Plus Points */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-emerald-600" /> Tổng Điểm Cộng (+)
                    </span>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {plusTxs.length} lần
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-emerald-600 mt-1">
                    +{plusPoints} đ
                  </div>
                  <div className="text-xs text-emerald-800/80 font-medium mt-1">
                    Khen thưởng học tập, phong trào &amp; nề nếp
                  </div>
                </div>

                {/* Minus Points */}
                <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                      <MinusCircle className="w-4 h-4 text-rose-600" /> Tổng Điểm Trừ (-)
                    </span>
                    <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                      {minusTxs.length} lần
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-rose-600 mt-1">
                    -{minusPoints} đ
                  </div>
                  <div className="text-xs text-rose-800/80 font-medium mt-1">
                    Vi phạm nội quy, chuyên cần hoặc kỷ luật
                  </div>
                </div>
              </div>
            </div>

            {/* School Note */}
            <div className="text-xs text-slate-500 font-medium bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
              Trường TH&amp;THCS BÀN LONG &bull; Hệ thống tính điểm thi đua tự động bảo mật &amp; minh bạch.
            </div>
          </div>

          {/* Right Panel: Transaction Log with Filter Bar and Group-by-Week */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
            {/* Filter toolbar & Mode Toggle */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 shrink-0">
              {/* Grouping mode buttons */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewGrouping('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    viewGrouping === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Xem theo tổng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('BY_WEEK')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    viewGrouping === 'BY_WEEK'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Gom nhóm theo tuần</span>
                </button>
              </div>

              {/* Sub-filters (Tất cả, Điểm cộng, Điểm trừ) */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({studentTxs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('PLUS')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    filterType === 'PLUS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span>🟢 Điểm cộng</span>
                  <span>({plusTxs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('MINUS')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    filterType === 'MINUS'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  <span>🔴 Điểm trừ</span>
                  <span>({minusTxs.length})</span>
                </button>
              </div>
            </div>

            {/* Transaction cards list */}
            {viewGrouping === 'BY_WEEK' ? (
              /* Mode 1: Group By Week */
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {sortedWeekGroups.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-base font-semibold text-slate-600">
                      Chưa có ghi nhận thi đua nào trong mục này.
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
                        {group.txs.map((tx) => (
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
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Mode 2: Chronological Full List */
              <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
                {filteredTxs.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-base font-semibold text-slate-600">
                      Chưa có ghi nhận thi đua nào trong mục này.
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Các sự kiện cộng hoặc trừ điểm của học sinh sẽ hiển thị đầy đủ tại đây.
                    </p>
                  </div>
                ) : (
                  filteredTxs.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className={`p-4 rounded-2xl border transition shadow-2xs hover:shadow-xs ${
                        tx.type === 'PLUS'
                          ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                          : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              tx.type === 'PLUS'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {tx.type === 'PLUS' ? (
                              <PlusCircle className="w-5 h-5" />
                            ) : (
                              <MinusCircle className="w-5 h-5" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg font-black text-xs md:text-sm ${
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

                              {tx.status === 'PENDING' && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Chờ GVCN duyệt
                                </span>
                              )}
                            </div>

                            {/* Reason / Note box */}
                            <div className="mt-2.5 text-base text-slate-900 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs leading-relaxed font-medium">
                              <strong className="text-slate-900 block text-xs font-bold uppercase tracking-wider mb-1">
                                {tx.type === 'PLUS' ? '🌟 Lý do khen thưởng cụ thể:' : '⚠️ Lý do vi phạm cụ thể:'}
                              </strong>
                              &ldquo;{tx.reason || tx.note || 'Thực hiện theo đúng quy chế thi đua.'}&rdquo;
                            </div>

                            <div className="text-xs md:text-sm text-slate-600 flex flex-wrap items-center gap-3 mt-2 font-semibold">
                              <span className="flex items-center gap-1 text-slate-700">
                                <Calendar className="w-4 h-4 text-indigo-600" /> {tx.date}
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1 text-slate-700">
                                <User className="w-4 h-4 text-indigo-600" /> Người chấm: {tx.createdByName || 'Giáo viên'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bottom bar of right panel */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Ghi nhận chuẩn xác theo ngày và tiêu chí thi đua
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
