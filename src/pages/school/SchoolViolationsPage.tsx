import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Calendar,
  Filter,
  User,
  Search,
  PlusCircle,
  MinusCircle,
  BarChart3,
  Eye,
  School,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { CompetitionTransaction, ClassRoom, Student } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';

export const SchoolViolationsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'MINUS' | 'PLUS'>('MINUS');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);

  const loadData = async () => {
    const [txList, cList, stList] = await Promise.all([
      dbService.getTransactions(),
      dbService.getClasses(),
      dbService.getStudents(),
    ]);
    setTransactions(txList);
    setClasses(cList);
    setStudents(stList);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, []);

  const handleStudentClick = (tx: CompetitionTransaction) => {
    const found = students.find((s) => s.studentId === tx.studentId) || {
      studentId: tx.studentId,
      studentCode: tx.studentId,
      fullName: tx.studentName || 'Học sinh',
      schoolId: 'school-ban-long',
      schoolYearId: 'year-2026-2027',
      classId: tx.classId,
      groupId: tx.groupId || 'group-1',
      groupName: tx.groupName || 'Tổ 1',
      status: 'ACTIVE' as const,
      gender: 'NAM' as const,
      totalPoints: 0,
      plusPoints: 0,
      minusPoints: 0,
      createdAt: '',
      updatedAt: '',
    };
    setSelectedStudentForModal(found);
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (selectedClassId !== 'ALL' && t.classId !== selectedClassId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = t.studentName?.toLowerCase().includes(term);
      const matchCrit = t.criterionName.toLowerCase().includes(term);
      const matchClass = t.classId.toLowerCase().includes(term);
      return matchName || matchCrit || matchClass;
    }
    return true;
  });

  const activeStatsClassId = selectedClassId !== 'ALL' ? selectedClassId : 'class-9a1';
  const activeStatsClassName = classes.find((c) => c.classId === activeStatsClassId)?.name || '9A1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Sổ Theo Dõi Vi Phạm &amp; Khen Thưởng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              Toàn trường
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Dành cho Ban Giám Hiệu, Tổng Phụ Trách Đội và Giám Thị theo dõi nề nếp, chọn lớp và xem thống kê theo tổ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition flex items-center gap-2"
            title={`Xem thống kê theo tổ lớp ${activeStatsClassName}`}
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>📊 Thống Kê Theo Tổ Lớp {activeStatsClassName}</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, lớp hoặc lỗi vi phạm..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        {/* Select Class */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả các lớp</option>
          {classes.map((c) => (
            <option key={c.classId} value={c.classId}>
              Lớp {c.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setFilterType('MINUS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'MINUS' ? 'bg-rose-600 text-white' : 'text-slate-600'
            }`}
          >
            Chỉ vi phạm
          </button>
          <button
            onClick={() => setFilterType('PLUS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'PLUS' ? 'bg-emerald-600 text-white' : 'text-slate-600'
            }`}
          >
            Chỉ khen thưởng
          </button>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="py-3.5 pl-4">Ngày</th>
              <th className="py-3.5">Học sinh</th>
              <th className="py-3.5">Lớp</th>
              <th className="py-3.5">Nội dung ghi nhận</th>
              <th className="py-3.5">Người ghi nhận</th>
              <th className="py-3.5 text-right pr-4">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Không tìm thấy dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.transactionId}
                  onClick={() => handleStudentClick(tx)}
                  className="hover:bg-indigo-50/60 cursor-pointer transition group"
                  title="Bấm để xem toàn bộ thành tích thi đua của học sinh này"
                >
                  <td className="py-3.5 pl-4 font-mono text-slate-500">{tx.date}</td>
                  <td className="py-3.5 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.studentName}</span>
                      <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    {tx.groupName && <div className="text-xs text-slate-400 font-normal">{tx.groupName}</div>}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-800 rounded-lg text-xs">
                      {tx.classId.replace('class-', '').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="font-semibold text-slate-800">{tx.criterionName}</div>
                    {tx.reason && <div className="text-xs text-slate-400 italic mt-0.5">{tx.reason}</div>}
                  </td>
                  <td className="py-3.5 text-slate-600 font-medium">{tx.createdByName}</td>
                  <td className="py-3.5 pr-4 text-right">
                    <span
                      className={`font-black text-xs md:text-sm px-2.5 py-1 rounded-lg ${
                        tx.type === 'PLUS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points} đ
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
        classId={activeStatsClassId}
        className={activeStatsClassName}
      />
    </div>
  );
};
