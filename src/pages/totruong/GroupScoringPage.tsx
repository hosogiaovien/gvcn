import React, { useState, useEffect } from 'react';
import {
  Flame,
  PlusCircle,
  MinusCircle,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { useNotification } from '../../context/NotificationContext';
import { Student, Criterion, CompetitionTransaction } from '../../types';

export const GroupScoringPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const classId = currentUser?.classId || 'class-9a1';
  const groupId = currentUser?.groupId || 'group-1';

  const [members, setMembers] = useState<Student[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCriterionId, setSelectedCriterionId] = useState('');
  const [scoringDate, setScoringDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'PLUS' | 'MINUS'>('PLUS');

  const loadData = async () => {
    const [allStudents, allCriteria] = await Promise.all([
      dbService.getStudents(classId),
      dbService.getCriteria(classId),
    ]);

    setMembers(allStudents.filter((s) => s.groupId === groupId));
    // Filter criteria allowed for group leader
    setCriteria(allCriteria.filter((c) => c.active && c.allowGroupLeader));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [groupId, classId]);

  const filteredCriteria = criteria.filter((c) => c.type === tab);
  const selectedStudent = members.find((m) => m.studentId === selectedStudentId);
  const selectedCriterion = criteria.find((c) => c.criterionId === selectedCriterionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCriterionId) {
      showToast('Vui lòng chọn học sinh và tiêu chí!', 'error');
      return;
    }

    setLoading(true);
    try {
      const student = members.find((m) => m.studentId === selectedStudentId)!;
      const crit = criteria.find((c) => c.criterionId === selectedCriterionId)!;
      const signedPoints = crit.type === 'PLUS' ? crit.points : -crit.points;

      const settings = await dbService.getSettings();
      const status = settings.allowGroupLeaderDirectScore ? 'APPROVED' : 'PENDING';

      const newTx: CompetitionTransaction = {
        transactionId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: 'school-ban-long',
        schoolYearId: 'year-2026-2027',
        classId,
        studentId: student.studentId,
        studentName: student.fullName,
        groupId,
        groupName: student.groupName || 'Tổ 1',
        criterionId: crit.criterionId,
        criterionName: crit.name,
        type: crit.type,
        points: signedPoints,
        reason: note.trim() || undefined,
        date: scoringDate,
        weekId: '2026-W38',
        monthId: scoringDate.substring(0, 7),
        createdBy: currentUser?.uid || 'user-totruong-1',
        createdByName: currentUser?.displayName || 'Tổ trưởng',
        createdByRole: 'TO_TRUONG',
        createdAt: new Date().toISOString(),
        status,
      };

      await dbService.createTransaction(newTx);
      await loadData();

      showToast(
        status === 'PENDING'
          ? 'Đã gửi ghi nhận cho GVCN phê duyệt thành công!'
          : 'Đã lưu điểm thi đua thành công!',
        'success'
      );

      // Reset
      setSelectedStudentId('');
      setSelectedCriterionId('');
      setNote('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Ghi Nhận Thi Đua Tổ</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              Quyền Tổ Trưởng
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Ghi nhận điểm cộng và điểm trừ của các thành viên trong tổ để gửi giáo viên chủ nhiệm phê duyệt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Member Selection (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
                1
              </span>
              <span>Chọn Thành Viên ({members.length} HS)</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {members.map((m) => (
              <label
                key={m.studentId}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                  selectedStudentId === m.studentId
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="student"
                    checked={selectedStudentId === m.studentId}
                    onChange={() => setSelectedStudentId(m.studentId)}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{m.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.studentCode}</div>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  {(m.totalPoints ?? 0) > 0 ? `+${m.totalPoints}` : m.totalPoints ?? 0} đ
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2: Criteria & Reason (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
                2
              </span>
              <span>Chọn Tiêu Chí &amp; Ghi Chú</span>
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setTab('PLUS')}
                className={`px-3 py-1 rounded-md transition ${
                  tab === 'PLUS' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Điểm Cộng
              </button>
              <button
                type="button"
                onClick={() => setTab('MINUS')}
                className={`px-3 py-1 rounded-md transition ${
                  tab === 'MINUS' ? 'bg-rose-600 text-white' : 'text-slate-600'
                }`}
              >
                Điểm Trừ
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredCriteria.map((cr) => (
              <label
                key={cr.criterionId}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                  selectedCriterionId === cr.criterionId
                    ? cr.type === 'PLUS'
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="criterion"
                    checked={selectedCriterionId === cr.criterionId}
                    onChange={() => setSelectedCriterionId(cr.criterionId)}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{cr.name}</div>
                    {cr.description && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{cr.description}</div>
                    )}
                  </div>
                </div>

                <span
                  className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                    cr.type === 'PLUS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {cr.type === 'PLUS' ? `+${cr.points}` : `-${cr.points}`}
                </span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày ghi nhận</label>
              <input
                type="date"
                value={scoringDate}
                onChange={(e) => setScoringDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do / Diễn giải cụ thể
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Giúp bạn dọn bàn học..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Ghi nhận sẽ gửi GVCN phê duyệt</span>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedStudentId || !selectedCriterionId}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Đang gửi...' : 'Gửi GVCN Phê Duyệt'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
