import React, { useState, useEffect } from 'react';
import {
  Flame,
  PlusCircle,
  MinusCircle,
  Users,
  Calendar,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Student, Criterion, Group, CompetitionTransaction, ClassRoom } from '../../types';

export const CompetitionScoringPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const classId = currentUser?.classId || 'class-9a1';

  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [scoringDate, setScoringDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [criterionTab, setCriterionTab] = useState<'PLUS' | 'MINUS'>('PLUS');

  const loadData = async () => {
    const [stList, grpList, crList, cls] = await Promise.all([
      dbService.getStudents(classId),
      dbService.getGroups(classId),
      dbService.getCriteria(classId),
      dbService.getClassById(classId),
    ]);
    setStudents(stList);
    setGroups(grpList);
    setCriteria(crList.filter((c) => c.active));
    if (cls) setCurrentClass(cls);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  const filteredStudents = students.filter((s) => {
    if (filterGroup === 'ALL') return true;
    return s.groupId === filterGroup;
  });

  const plusCriteria = criteria.filter((c) => c.type === 'PLUS');
  const minusCriteria = criteria.filter((c) => c.type === 'MINUS');

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.studentId));
    }
  };

  const toggleCriterion = (id: string) => {
    setSelectedCriteriaIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Calculate total points preview
  const selectedCriteriaObjs = criteria.filter((c) => selectedCriteriaIds.includes(c.criterionId));
  const totalPointsPreview = selectedCriteriaObjs.reduce(
    (sum, c) => (c.type === 'PLUS' ? sum + c.points : sum - c.points),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh để chấm!', 'error');
      return;
    }
    if (selectedCriteriaIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một tiêu chí thi đua!', 'error');
      return;
    }

    setLoading(true);
    try {
      const isLeader = currentUser?.role === 'TO_TRUONG';
      const settings = await dbService.getSettings();
      // If group leader and direct score not allowed -> PENDING
      const status = isLeader && !settings.allowGroupLeaderDirectScore ? 'PENDING' : 'APPROVED';

      const batchId = `batch-${Date.now()}`;
      const newTransactions: CompetitionTransaction[] = [];

      selectedStudentIds.forEach((sId) => {
        const student = students.find((s) => s.studentId === sId);
        if (!student) return;

        selectedCriteriaObjs.forEach((crit) => {
          const signedPoints = crit.type === 'PLUS' ? crit.points : -crit.points;
          const tx: CompetitionTransaction = {
            transactionId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            batchId,
            schoolId: 'school-ban-long',
            schoolYearId: 'year-2026-2027',
            classId,
            studentId: student.studentId,
            studentName: student.fullName,
            groupId: student.groupId,
            groupName: student.groupName || student.groupId,
            criterionId: crit.criterionId,
            criterionName: crit.name,
            type: crit.type,
            points: signedPoints,
            reason: note.trim() || undefined,
            date: scoringDate,
            weekId: '2026-W38',
            monthId: scoringDate.substring(0, 7),
            createdBy: currentUser?.uid || 'user-gvcn-9a1',
            createdByName: currentUser?.displayName || 'Giáo viên',
            createdByRole: currentUser?.role || 'GVCN',
            createdAt: new Date().toISOString(),
            status,
          };
          newTransactions.push(tx);
        });
      });

      // Optimistic update: Update students immediately in state so points change with 0ms delay
      if (status === 'APPROVED') {
        setStudents((prev) =>
          prev.map((s) => {
            const studentTxs = newTransactions.filter((t) => t.studentId === s.studentId);
            if (studentTxs.length === 0) return s;
            let addedPlus = 0;
            let addedMinus = 0;
            let addedTotal = 0;
            studentTxs.forEach((t) => {
              const pts = Math.abs(t.points);
              if (t.type === 'PLUS') {
                addedPlus += pts;
                addedTotal += pts;
              } else {
                addedMinus += pts;
                addedTotal -= pts;
              }
            });
            return {
              ...s,
              plusPoints: (s.plusPoints || 0) + addedPlus,
              minusPoints: (s.minusPoints || 0) + addedMinus,
              totalPoints: (s.totalPoints || 0) + addedTotal,
            };
          })
        );
      }

      await dbService.batchCreateTransactions(newTransactions);
      await loadData(); // Always refresh to ensure 100% sync

      // Audit log
      await dbService.createAuditLog({
        schoolId: 'school-ban-long',
        classId,
        userId: currentUser?.uid || 'gvcn',
        userName: currentUser?.displayName || 'GVCN',
        userRole: currentUser?.role || 'GVCN',
        action: selectedStudentIds.length > 1 ? 'bulkScore' : 'scoreStudent',
        details: `Chấm ${newTransactions.length} lượt thi đua cho ${selectedStudentIds.length} học sinh ngày ${scoringDate}. Điểm: ${totalPointsPreview}`,
        timestamp: new Date().toISOString(),
      });

      showToast(
        status === 'PENDING'
          ? `Đã gửi ${newTransactions.length} bản ghi thi đua chờ GVCN phê duyệt!`
          : `Đã lưu thành công ${newTransactions.length} bản ghi thi đua! Điểm danh sách học sinh đã tự động cập nhật ngay lập tức.`,
        'success'
      );

      // Reset selection
      setSelectedStudentIds([]);
      setSelectedCriteriaIds([]);
      setNote('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu điểm thi đua', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">Chấm Điểm Thi Đua Lớp</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              Lớp {currentClass?.name || '9A1'}
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
            Hỗ trợ chấm điểm nhanh cho từng cá nhân hoặc chọn hàng loạt nhiều học sinh và nhiều tiêu chí cùng lúc
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={scoringDate}
            onChange={(e) => setScoringDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select Students (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden max-h-[750px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Chọn Học Sinh ({selectedStudentIds.length}/{students.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {selectedStudentIds.length === filteredStudents.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
            </button>
          </div>

          {/* Group filter tabs */}
          <div className="flex border-b border-slate-100 p-2 gap-1.5 overflow-x-auto bg-slate-50/50">
            <button
              type="button"
              onClick={() => setFilterGroup('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterGroup === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Cả lớp ({students.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.groupId}
                type="button"
                onClick={() => setFilterGroup(g.groupId)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterGroup === g.groupId
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Student checkbox list */}
          <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-slate-100">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudentIds.includes(st.studentId);
              return (
                <label
                  key={st.studentId}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                    isSelected ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(st.studentId)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-sm md:text-base text-slate-900">{st.fullName}</div>
                      <div className="text-sm text-slate-600 font-mono mt-0.5">
                        {st.studentCode} &bull; {st.groupName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs md:text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      +{st.plusPoints || 0}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      -{st.minusPoints || 0}
                    </span>
                    <span className="text-xs md:text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md min-w-[44px] text-center">
                      {(st.totalPoints ?? 0) > 0 ? `+${st.totalPoints}` : st.totalPoints ?? 0} đ
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Criteria (7 columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden max-h-[750px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Chọn Tiêu Chí Thi Đua ({selectedCriteriaIds.length})
              </h3>
            </div>

            {/* Plus / Minus selector tabs */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setCriterionTab('PLUS')}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
                  criterionTab === 'PLUS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" /> Điểm Cộng
              </button>
              <button
                type="button"
                onClick={() => setCriterionTab('MINUS')}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
                  criterionTab === 'MINUS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" /> Điểm Trừ
              </button>
            </div>
          </div>

          {/* Criteria list */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {(criterionTab === 'PLUS' ? plusCriteria : minusCriteria).map((cr) => {
              const isSelected = selectedCriteriaIds.includes(cr.criterionId);
              return (
                <label
                  key={cr.criterionId}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    isSelected
                      ? cr.type === 'PLUS'
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCriterion(cr.criterionId)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-sm md:text-base text-slate-900">{cr.name}</div>
                      {cr.description && (
                        <div className="text-xs md:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
                          {cr.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-black text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                      cr.type === 'PLUS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cr.type === 'PLUS' ? `+${cr.points}` : `-${cr.points}`}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Note & Submit Strip */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Ghi chú / Diễn giải cụ thể lý do chấm (tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Kiểm tra miệng 10 điểm, Nhặt được của rơi trả lại..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Total calculation strip */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Tổng điểm cho mỗi học sinh:</span>
                <div
                  className={`text-lg font-black ${
                    totalPointsPreview > 0
                      ? 'text-emerald-600'
                      : totalPointsPreview < 0
                      ? 'text-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  {totalPointsPreview > 0 ? `+${totalPointsPreview}` : totalPointsPreview} điểm
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentIds([]);
                    setSelectedCriteriaIds([]);
                    setNote('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Làm mới
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedStudentIds.length === 0 || selectedCriteriaIds.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Đang lưu...'
                      : `Lưu ${selectedStudentIds.length} học sinh (${selectedStudentIds.length * selectedCriteriaIds.length} bản ghi)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
