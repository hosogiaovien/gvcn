import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Edit2,
  Trash2,
  UserPlus,
  Save,
  PlusCircle,
  MinusCircle,
  Flame,
  Award,
  BarChart3,
  GraduationCap,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { exportService, StudentImportRow } from '../../services/exportService';
import { Student, CompetitionTransaction, Criterion, ClassRoom, Group } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { AdminResetModal } from '../../components/AdminResetModal';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const ClassStudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const isSchoolWideRole =
    ['ADMIN', 'HIEU_TRUONG', 'PHO_HIEU_TRUONG', 'TONG_PHU_TRACH', 'GIAM_THI'].includes(currentUser?.role || '') ||
    sessionStorage.getItem('thidua_admin_acting') === 'true';

  const defaultClassId =
    currentUser?.role === 'GVCN' && currentUser.classId
      ? currentUser.classId
      : sessionStorage.getItem('thidua_selected_class_id') || currentUser?.classId || 'class-9a1';

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>(defaultClassId);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Checkbox selection & bulk delete state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);

  // Quick Score Modal State
  const [quickScoreModal, setQuickScoreModal] = useState<{
    open: boolean;
    student: Student | null;
    type: 'PLUS' | 'MINUS';
  }>({ open: false, student: null, type: 'PLUS' });
  const [quickCriterionId, setQuickCriterionId] = useState('');
  const [quickPoints, setQuickPoints] = useState<number>(2);
  const [quickReason, setQuickReason] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newGender, setNewGender] = useState<'NAM' | 'NU'>('NAM');
  const [newGroupId, setNewGroupId] = useState('group-1');
  const [newDateOfBirth, setNewDateOfBirth] = useState('');

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editStudentCode, setEditStudentCode] = useState('');
  const [editGender, setEditGender] = useState<'NAM' | 'NU'>('NAM');
  const [editGroupId, setEditGroupId] = useState('group-1');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');

  // Delete Student State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Excel Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const [allCls, cls, stList, txList, crList, grpList] = await Promise.all([
      dbService.getClasses(),
      dbService.getClassById(classId),
      dbService.getStudents(classId),
      dbService.getTransactions(classId),
      dbService.getCriteria(classId),
      dbService.getGroups(classId),
    ]);
    setClasses(allCls);
    if (cls) setCurrentClass(cls);
    setStudents(stList);
    setTransactions(txList);
    setCriteria(crList.filter((c) => c.active));
    const effectiveGroups: Group[] =
      grpList && grpList.length > 0
        ? grpList
        : [1, 2, 3, 4].map((num) => ({
            groupId: `group-${classId}-${num}`,
            classId,
            name: `Tổ ${num}`,
            leaderName: '',
            memberCount: 0,
            status: 'ACTIVE' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
    setGroups(effectiveGroups);
  };

  useEffect(() => {
    loadData();
    setSelectedStudentIds([]);
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  useEffect(() => {
    if (currentUser?.role === 'GVCN' && currentUser.classId && classId !== currentUser.classId) {
      setClassId(currentUser.classId);
    }
  }, [currentUser]);

  // Real-time student scores dynamically computed from transactions
  const studentScoresMap = useMemo(() => {
    const map: Record<string, { plus: number; minus: number; total: number; count: number }> = {};
    students.forEach((s) => {
      map[s.studentId] = {
        plus: 0,
        minus: 0,
        total: 0,
        count: 0,
      };
    });

    transactions.forEach((tx) => {
      if (tx.status === 'APPROVED' && map[tx.studentId]) {
        const pts = Math.abs(tx.points);
        if (tx.type === 'PLUS') {
          map[tx.studentId].plus += pts;
          map[tx.studentId].total += pts;
        } else {
          map[tx.studentId].minus += pts;
          map[tx.studentId].total -= pts;
        }
        map[tx.studentId].count += 1;
      }
    });

    // If a student doesn't have transactions yet, fall back to initial points if present
    students.forEach((s) => {
      if (map[s.studentId] && map[s.studentId].count === 0) {
        map[s.studentId].plus = s.plusPoints || 0;
        map[s.studentId].minus = s.minusPoints || 0;
        map[s.studentId].total = s.totalPoints || 0;
      }
    });

    return map;
  }, [students, transactions]);

  // Open Quick Score Modal for a student
  const handleOpenQuickScore = (st: Student, type: 'PLUS' | 'MINUS', e: React.MouseEvent) => {
    e.stopPropagation();
    const relevantCriteria = criteria.filter((c) => c.type === type);
    const defaultCrit = relevantCriteria[0];
    setQuickScoreModal({ open: true, student: st, type });
    setQuickCriterionId(defaultCrit?.criterionId || '');
    setQuickPoints(defaultCrit?.points || 2);
    setQuickReason('');
    setQuickDate(new Date().toISOString().split('T')[0]);
  };

  // Submit Quick Score
  const handleSaveQuickScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScoreModal.student) return;

    const st = quickScoreModal.student;
    const type = quickScoreModal.type;
    const crit = criteria.find((c) => c.criterionId === quickCriterionId);
    const pts = Math.max(1, Number(quickPoints));
    const signedPoints = type === 'PLUS' ? pts : -pts;

    const newTx: CompetitionTransaction = {
      transactionId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: 'school-ban-long',
      schoolYearId: 'year-2026-2027',
      classId,
      studentId: st.studentId,
      studentName: st.fullName,
      groupId: st.groupId,
      groupName: st.groupName || st.groupId,
      criterionId: crit?.criterionId || `quick-${type.toLowerCase()}`,
      criterionName: crit?.name || (type === 'PLUS' ? 'Khen thưởng nhanh' : 'Nhắc nhở nề nếp'),
      type,
      points: signedPoints,
      reason: quickReason.trim() || undefined,
      date: quickDate,
      weekId: '2026-W38',
      monthId: quickDate.substring(0, 7),
      createdBy: currentUser?.uid || 'user-gvcn-9a1',
      createdByName: currentUser?.displayName || 'GVCN',
      createdByRole: currentUser?.role || 'GVCN',
      createdAt: new Date().toISOString(),
      status: 'APPROVED',
    };

    // 1. Instant optimistic state update: updates students and transactions in 0ms!
    setTransactions((prev) => [newTx, ...prev]);
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== st.studentId) return s;
        const addPts = Math.abs(signedPoints);
        return {
          ...s,
          plusPoints: type === 'PLUS' ? (s.plusPoints || 0) + addPts : (s.plusPoints || 0),
          minusPoints: type === 'MINUS' ? (s.minusPoints || 0) + addPts : (s.minusPoints || 0),
          totalPoints: (s.totalPoints || 0) + signedPoints,
        };
      })
    );
    setQuickScoreModal({ open: false, student: null, type: 'PLUS' });

    // 2. Persist to storage & refresh database
    await dbService.createTransaction(newTx);
    await loadData();

    showToast(
      `Đã ${type === 'PLUS' ? 'cộng' : 'trừ'} ${pts} điểm cho ${st.fullName}! Điểm tự động cập nhật ngay trên danh sách.`,
      'success'
    );
  };

  const isStudentInGroup = (s: Student, filterVal: string) => {
    if (!filterVal || filterVal === 'ALL') return true;
    if (s.groupId === filterVal) return true;
    if (s.groupName && s.groupName.trim() === filterVal.trim()) return true;
    const grp = groups.find((g) => g.groupId === filterVal || g.name === filterVal);
    if (grp && (s.groupId === grp.groupId || s.groupName === grp.name)) return true;
    const numMatch = filterVal.match(/[1-4]$/);
    if (numMatch) {
      const num = numMatch[0];
      if (s.groupName === `Tổ ${num}` || s.groupId?.endsWith(`-${num}`) || s.groupId === `group-${num}`) return true;
    }
    return false;
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = isStudentInGroup(s, groupFilter);
    return matchSearch && matchGroup;
  });

  // Open Add Modal and auto-generate student code
  const handleOpenAddModal = () => {
    const nextNumber = students.length + 1;
    const generatedCode = `HS${String(nextNumber).padStart(3, '0')}`;
    setNewStudentCode(generatedCode);
    setNewFullName('');
    setNewGender('NAM');
    const firstGrp = groups.find((g) => g.name === 'Tổ 1' || g.groupId.endsWith('-1'));
    setNewGroupId(firstGrp?.groupId || `group-${classId}-1`);
    setNewDateOfBirth('2011-01-01');
    setShowAddModal(true);
  };

  // Create new student
  const handleSaveNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) {
      showToast('Vui lòng nhập họ và tên học sinh!', 'error');
      return;
    }
    if (!newStudentCode.trim()) {
      showToast('Vui lòng nhập mã học sinh!', 'error');
      return;
    }

    const numMatch = (newGroupId || '').match(/[1-4]$/);
    const groupNum = numMatch ? numMatch[0] : '1';
    const matchedGroup = groups.find((g) => g.groupId === newGroupId || g.name === `Tổ ${groupNum}`);
    const finalGroupId = matchedGroup?.groupId || newGroupId;
    const finalGroupName = matchedGroup?.name || `Tổ ${groupNum}`;

    const newStudent: Student = {
      studentId: `student-${Date.now()}`,
      schoolId: 'school-ban-long',
      classId: classId,
      schoolYearId: 'year-2026-2027',
      studentCode: newStudentCode.trim().toUpperCase(),
      fullName: newFullName.trim(),
      gender: newGender,
      dateOfBirth: newDateOfBirth || '2011-01-01',
      groupId: finalGroupId,
      groupName: finalGroupName,
      status: 'ACTIVE',
      totalPoints: 0,
      plusPoints: 0,
      minusPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveStudent(newStudent);
    await loadData();
    showToast(`Đã thêm học sinh ${newStudent.fullName} vào ${finalGroupName}!`, 'success');
    setShowAddModal(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (st: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(st);
    setEditFullName(st.fullName);
    setEditStudentCode(st.studentCode);
    setEditGender(st.gender);
    const numMatch = (st.groupId || '').match(/[1-4]$/) || (st.groupName || '').match(/[1-4]$/);
    const num = numMatch ? numMatch[0] : '1';
    const matched = groups.find((g) => g.groupId === st.groupId || g.name === `Tổ ${num}` || g.groupId.endsWith(`-${num}`));
    setEditGroupId(matched?.groupId || st.groupId || `group-${classId}-${num}`);
    setEditDateOfBirth(st.dateOfBirth || '');
  };

  // Save Edited Student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFullName.trim()) {
      showToast('Họ tên không được để trống!', 'error');
      return;
    }

    const numMatch = (editGroupId || '').match(/[1-4]$/);
    const groupNum = numMatch ? numMatch[0] : '1';
    const matchedGroup = groups.find((g) => g.groupId === editGroupId || g.name === `Tổ ${groupNum}`);
    const finalGroupId = matchedGroup?.groupId || editGroupId;
    const finalGroupName = matchedGroup?.name || `Tổ ${groupNum}`;

    const updated: Student = {
      ...editingStudent,
      fullName: editFullName.trim(),
      studentCode: editStudentCode.trim().toUpperCase(),
      gender: editGender,
      groupId: finalGroupId,
      groupName: finalGroupName,
      dateOfBirth: editDateOfBirth,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveStudent(updated);
    await loadData();
    showToast(`Đã cập nhật thông tin học sinh ${updated.fullName}!`, 'success');
    setEditingStudent(null);
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.studentId));
    }
  };

  const handleToggleSelectStudent = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Confirm Delete 1 Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    const name = deletingStudent.fullName;
    await dbService.deleteStudent(deletingStudent.studentId);
    setSelectedStudentIds((prev) => prev.filter((id) => id !== deletingStudent.studentId));
    await loadData();
    showToast(`Đã xóa học sinh ${name} khỏi lớp!`, 'info');
    setDeletingStudent(null);
  };

  // Confirm Bulk Delete Selected Students
  const handleConfirmBulkDelete = async () => {
    const count = selectedStudentIds.length;
    if (count === 0) return;
    await dbService.deleteStudentsBatch(selectedStudentIds);
    setSelectedStudentIds([]);
    setShowBulkDeleteModal(false);
    await loadData();
    showToast(`Đã xóa thành công ${count} học sinh đã chọn khỏi lớp!`, 'success');
  };

  // Confirm Delete All Students in Class
  const handleConfirmDeleteAll = async () => {
    const count = students.length;
    if (count === 0) return;
    await dbService.deleteAllStudentsOfClass(classId);
    setSelectedStudentIds([]);
    setShowDeleteAllModal(false);
    await loadData();
    showToast(`Đã xóa toàn bộ ${count} học sinh của lớp ${currentClass?.name || ''}!`, 'success');
  };

  const handleExportExcel = () => {
    exportService.exportStudentsToExcel(students, currentClass?.name || '9A1');
    showToast(`Đã xuất danh sách học sinh lớp ${currentClass?.name || '9A1'} ra file Excel!`, 'success');
  };

  const handleDownloadTemplate = () => {
    exportService.downloadStudentTemplate();
    showToast('Đã tải mẫu file Excel!', 'info');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await exportService.parseAndValidateExcel(file);
      setImportRows(rows);
    } catch (err: any) {
      showToast('Lỗi khi đọc file Excel: ' + err.message, 'error');
    }
  };

  const handleConfirmImport = async () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Không có dòng hợp lệ nào để nhập!', 'error');
      return;
    }

    setImporting(true);
    try {
      const newStudents: Student[] = validRows.map((r, idx) => {
        const groupNum = r.groupName?.includes('2')
          ? 2
          : r.groupName?.includes('3')
          ? 3
          : r.groupName?.includes('4')
          ? 4
          : 1;

        return {
          studentId: `student-${Date.now()}-${idx}`,
          schoolId: 'school-ban-long',
          classId: classId,
          schoolYearId: 'year-2026-2027',
          studentCode: r.studentCode,
          fullName: r.fullName,
          gender: r.gender === 'NU' ? 'NU' : 'NAM',
          dateOfBirth: r.dateOfBirth,
          groupId: `group-${groupNum}`,
          groupName: `Tổ ${groupNum}`,
          status: 'ACTIVE',
          totalPoints: 0,
          plusPoints: 0,
          minusPoints: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      await dbService.batchSaveStudents(newStudents);
      await loadData();
      showToast(`Đã nhập thành công ${newStudents.length} học sinh vào lớp ${currentClass?.name || ''}!`, 'success');
      setShowImportModal(false);
      setImportRows([]);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu học sinh', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Danh Sách Học Sinh Lớp {currentClass?.name || '9A1'}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {students.length} học sinh
            </span>

            {/* Class Switcher - FOR SCHOOL LEADERSHIP, PROCTOR, AND ADMIN */}
            {isSchoolWideRole && classes.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">
                  {currentUser?.role === 'ADMIN'
                    ? 'Admin chọn lớp:'
                    : currentUser?.role === 'TONG_PHU_TRACH'
                    ? 'TPT kiểm tra lớp:'
                    : currentUser?.role === 'GIAM_THI'
                    ? 'Giám thị tra cứu lớp:'
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
            Quản lý học sinh: thêm mới, sửa tên, chọn check all / check từng em để xóa 1 học sinh hay xóa tất cả
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Mở bảng thống kê thi đua 4 tổ của lớp"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>📊 Thống Kê Theo Tổ</span>
          </button>
          {isSchoolWideRole && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              title="Reset sạch điểm thi đua của lớp này về 0 theo khoảng thời gian"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Reset Điểm Lớp</span>
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> + Thêm Học Sinh
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={students.length === 0}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5 shadow-2xs"
            title="Xóa toàn bộ danh sách học sinh của lớp này"
          >
            <Trash2 className="w-4 h-4" /> Xóa Tất Cả HS Lớp
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Mẫu Excel
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* 4 Groups Quick Overview Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Tổng Quát Điểm Thi Đua 4 Tổ Lớp {currentClass?.name || '9A1'}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Phân tích tổ chi tiết &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((num) => {
            const targetGroup = groups.find((g) => g.name === `Tổ ${num}` || g.groupId.endsWith(`-${num}`)) || {
              groupId: `group-${classId}-${num}`,
              name: `Tổ ${num}`,
            };
            const gStudents = students.filter(
              (s) => isStudentInGroup(s, targetGroup.groupId) || isStudentInGroup(s, `Tổ ${num}`)
            );
            const gTotal = gStudents.reduce((sum, s) => {
              const sc = studentScoresMap[s.studentId];
              return sum + (sc ? sc.total : (s.totalPoints || 0));
            }, 0);
            const gPlus = gStudents.reduce((sum, s) => {
              const sc = studentScoresMap[s.studentId];
              return sum + (sc ? sc.plus : (s.plusPoints || 0));
            }, 0);
            const gMinus = gStudents.reduce((sum, s) => {
              const sc = studentScoresMap[s.studentId];
              return sum + (sc ? sc.minus : (s.minusPoints || 0));
            }, 0);
            const gAvg = gStudents.length > 0 ? (gTotal / gStudents.length).toFixed(1) : '0';
            const isSelected =
              groupFilter === targetGroup.groupId ||
              (groupFilter !== 'ALL' && isStudentInGroup({ groupId: groupFilter, groupName: groupFilter } as any, targetGroup.groupId));

            return (
              <div
                key={targetGroup.groupId}
                onClick={() => {
                  if (isSelected) {
                    setGroupFilter('ALL');
                  } else {
                    setGroupFilter(targetGroup.groupId);
                  }
                }}
                className={`p-3 rounded-xl border transition cursor-pointer text-center relative ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Tổ {num}</span>
                  <span className="text-xs font-semibold text-slate-500">{gStudents.length} HS</span>
                </div>
                <div className="text-lg font-black text-indigo-700 mt-1">
                  {gTotal > 0 ? `+${gTotal}` : gTotal} đ
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  TB: {gAvg} đ/HS &bull; <span className="text-emerald-600">+{gPlus}</span> / <span className="text-rose-600">-{gMinus}</span>
                </div>
                <div className="text-[10px] font-bold text-indigo-600 mt-1">
                  {isSelected ? 'Đang lọc học sinh (Bấm để hủy)' : 'Bấm để lọc theo tổ'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo họ tên học sinh hoặc mã số..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          >
            <option value="ALL">Tất cả 4 tổ ({students.length} HS)</option>
            {[1, 2, 3, 4].map((num) => {
              const targetGroup = groups.find((g) => g.name === `Tổ ${num}` || g.groupId.endsWith(`-${num}`)) || {
                groupId: `group-${classId}-${num}`,
                name: `Tổ ${num}`,
              };
              const gCount = students.filter(
                (s) => isStudentInGroup(s, targetGroup.groupId) || isStudentInGroup(s, `Tổ ${num}`)
              ).length;
              return (
                <option key={num} value={targetGroup.groupId}>
                  Tổ {num} ({gCount} HS)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selection & Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-indigo-900 text-white px-5 py-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-indigo-700">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedStudentIds.length}
            </span>
            <div>
              <div className="font-bold text-sm">
                Đã chọn {selectedStudentIds.length} / {filteredStudents.length} học sinh
              </div>
              <div className="text-xs text-indigo-200">
                Thao tác xóa nhanh các học sinh được chọn hoặc bỏ chọn
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-3.5 py-2 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedStudentIds.length} học sinh đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3.5 pl-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={handleToggleSelectAll}
                    title={
                      selectedStudentIds.length === filteredStudents.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả học sinh (Check all)'
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 w-12">STT</th>
                <th className="py-3.5 w-24">Mã HS</th>
                <th className="py-3.5">Họ và tên học sinh</th>
                <th className="py-3.5 w-20">Giới tính</th>
                <th className="py-3.5 w-20">Tổ</th>
                <th className="py-3.5 text-center w-28 text-emerald-700">Điểm cộng (+)</th>
                <th className="py-3.5 text-center w-28 text-rose-700">Điểm trừ (-)</th>
                <th className="py-3.5 text-center w-28">Tổng điểm</th>
                <th className="py-3.5 text-center w-36">Chấm nhanh</th>
                <th className="py-3.5 text-right pr-4 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const score = studentScoresMap[st.studentId] || {
                    plus: st.plusPoints || 0,
                    minus: st.minusPoints || 0,
                    total: st.totalPoints || 0,
                    count: 0,
                  };
                  const liveStudent: Student = {
                    ...st,
                    plusPoints: score.plus,
                    minusPoints: score.minus,
                    totalPoints: score.total,
                  };

                  return (
                    <tr
                      key={st.studentId}
                      onClick={() => setSelectedStudent(liveStudent)}
                      className={`hover:bg-indigo-50/50 cursor-pointer transition ${
                        selectedStudentIds.includes(st.studentId) ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(st.studentId)}
                          onChange={(e) => handleToggleSelectStudent(st.studentId, e)}
                          title="Chọn học sinh này"
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 font-mono font-semibold text-slate-700 text-sm">
                        {st.studentCode}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 text-base hover:text-indigo-600 transition">
                          {st.fullName}
                        </div>
                        {st.dateOfBirth && (
                          <div className="text-sm text-slate-500 font-medium">NS: {st.dateOfBirth}</div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-700 font-semibold text-sm md:text-base">
                        {st.gender === 'NAM' ? 'Nam' : 'Nữ'}
                      </td>
                      <td className="py-3.5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-sm rounded-lg">
                          {st.groupName}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-emerald-700 text-sm md:text-base">
                        +{score.plus}
                      </td>
                      <td className="py-3.5 text-center font-bold text-rose-700 text-sm md:text-base">
                        -{score.minus}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-sm md:text-base">
                          {score.total > 0 ? `+${score.total}` : score.total} đ
                        </span>
                      </td>
                      <td className="py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleOpenQuickScore(st, 'PLUS', e)}
                            title="Cộng điểm nhanh cho học sinh này"
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Điểm</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenQuickScore(st, 'MINUS', e)}
                            title="Trừ điểm nhanh cho học sinh này"
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                          >
                            <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>- Điểm</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-4">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedStudent(liveStudent)}
                            title="Xem chi tiết các lần cộng / trừ điểm"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(st, e)}
                            title="Sửa tên / thông tin học sinh"
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingStudent(st);
                            }}
                            title="Xóa học sinh khỏi lớp"
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD STUDENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Thêm Học Sinh Mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Thị Ánh Tuyết"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân vào tổ</label>
                  <select
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((num) => {
                      const g = groups.find((grp) => grp.name === `Tổ ${num}` || grp.groupId.endsWith(`-${num}`));
                      const val = g ? g.groupId : `group-${classId}-${num}`;
                      return (
                        <option key={num} value={val}>
                          Tổ {num}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={newDateOfBirth}
                    onChange={(e) => setNewDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Lưu học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT NAME & INFO */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Sửa Thông Tin Học Sinh</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    required
                    value={editStudentCode}
                    onChange={(e) => setEditStudentCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thuộc tổ</label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((num) => {
                      const g = groups.find((grp) => grp.name === `Tổ ${num}` || grp.groupId.endsWith(`-${num}`));
                      const val = g ? g.groupId : `group-${classId}-${num}`;
                      return (
                        <option key={num} value={val}>
                          Tổ {num}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE 1 STUDENT CONFIRMATION */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Xác Nhận Xóa Học Sinh?</h3>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh <strong className="text-slate-900 font-bold">{deletingStudent.fullName}</strong> ({deletingStudent.studentCode}) khỏi danh sách lớp {currentClass?.name || '9A1'}?
            </p>

            <div className="pt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: BULK DELETE SELECTED STUDENTS CONFIRMATION */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="font-black text-xl text-slate-900">Xóa Các Học Sinh Đã Chọn?</h3>
            <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
              Bạn đang chuẩn bị xóa <strong className="text-rose-600 font-bold text-base">{selectedStudentIds.length}</strong> học sinh đã được đánh dấu chọn khỏi lớp {currentClass?.name || '9A1'}.
            </p>

            {/* Preview list of selected students */}
            <div className="my-4 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 text-left text-xs bg-slate-50 divide-y divide-slate-200/60">
              {students
                .filter((s) => selectedStudentIds.includes(s.studentId))
                .slice(0, 15)
                .map((st) => (
                  <div key={st.studentId} className="py-1 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{st.fullName}</span>
                    <span className="font-mono text-slate-400">{st.studentCode} &bull; {st.groupName}</span>
                  </div>
                ))}
              {selectedStudentIds.length > 15 && (
                <div className="pt-1.5 text-center text-slate-400 italic">
                  ... và {selectedStudentIds.length - 15} học sinh khác
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa {selectedStudentIds.length} HS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE ALL STUDENTS IN CLASS CONFIRMATION */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="font-black text-xl text-slate-900">Xóa TOÀN BỘ Học Sinh Của Lớp?</h3>
            <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
              Cảnh báo: Hành động này sẽ xóa <strong className="text-rose-600 font-bold text-base">toàn bộ {students.length} học sinh</strong> của lớp <strong className="text-slate-900 font-bold text-base">{currentClass?.name || '9A1'}</strong>.
            </p>
            <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold text-left">
              ⚠️ Dữ liệu học sinh của lớp sẽ được làm trống. Sau khi xóa, bạn có thể thêm mới hoặc nhập lại từ file Excel bất cứ lúc nào.
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa hết {students.length} HS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        transactions={transactions}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <h3 className="font-black text-lg text-slate-900">Nhập Danh Sách Học Sinh từ Excel</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Kéo thả file Excel (.xlsx / .csv) vào đây hoặc click để chọn file
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition"
                >
                  Chọn file từ máy tính
                </button>
              </div>

              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Xem trước dữ liệu ({importRows.filter((r) => r.isValid).length}/{importRows.length} dòng hợp lệ)
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Dòng</th>
                          <th className="p-2">Mã HS</th>
                          <th className="p-2">Họ tên</th>
                          <th className="p-2">Giới tính</th>
                          <th className="p-2">Tổ</th>
                          <th className="p-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? '' : 'bg-rose-50/50'}>
                            <td className="p-2 text-slate-400">{row.stt || idx + 1}</td>
                            <td className="p-2 font-mono font-semibold">{row.studentCode}</td>
                            <td className="p-2 font-bold text-slate-900">{row.fullName}</td>
                            <td className="p-2">{row.gender}</td>
                            <td className="p-2">{row.groupName}</td>
                            <td className="p-2">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5" /> {row.errors?.join(', ') || 'Lỗi dữ liệu'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Hủy
              </button>
              <button
                disabled={importRows.length === 0 || importing}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {importing ? 'Đang nhập...' : 'Xác nhận nhập vào lớp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUICK SCORE (CỘNG / TRỪ ĐIỂM TRỰC TIẾP) */}
      {quickScoreModal.open && quickScoreModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    quickScoreModal.type === 'PLUS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {quickScoreModal.type === 'PLUS' ? (
                    <PlusCircle className="w-5 h-5" />
                  ) : (
                    <MinusCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {quickScoreModal.type === 'PLUS' ? 'Cộng Điểm Khen Thưởng' : 'Trừ Điểm Vi Phạm'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Học sinh: <strong className="text-slate-900 font-bold">{quickScoreModal.student.fullName}</strong> ({quickScoreModal.student.groupName || 'Tổ'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickScoreModal({ open: false, student: null, type: 'PLUS' })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickScore} className="space-y-4 mt-4">
              {/* Type Switcher */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    const plusCrits = criteria.filter((c) => c.type === 'PLUS');
                    setQuickScoreModal((prev) => ({ ...prev, type: 'PLUS' }));
                    setQuickCriterionId(plusCrits[0]?.criterionId || '');
                    setQuickPoints(plusCrits[0]?.points || 2);
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    quickScoreModal.type === 'PLUS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> Cộng Điểm (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const minusCrits = criteria.filter((c) => c.type === 'MINUS');
                    setQuickScoreModal((prev) => ({ ...prev, type: 'MINUS' }));
                    setQuickCriterionId(minusCrits[0]?.criterionId || '');
                    setQuickPoints(minusCrits[0]?.points || 2);
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    quickScoreModal.type === 'MINUS'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" /> Trừ Điểm (-)
                </button>
              </div>

              {/* Criterion Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn tiêu chí thi đua:
                </label>
                <select
                  value={quickCriterionId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setQuickCriterionId(cId);
                    const selected = criteria.find((c) => c.criterionId === cId);
                    if (selected) {
                      setQuickPoints(selected.points);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {criteria
                    .filter((c) => c.type === quickScoreModal.type)
                    .map((c) => (
                      <option key={c.criterionId} value={c.criterionId}>
                        {c.name} ({quickScoreModal.type === 'PLUS' ? '+' : '-'}{c.points} điểm)
                      </option>
                    ))}
                  <option value="">-- Tiêu chí khác / Nhập điểm tùy ý --</option>
                </select>
              </div>

              {/* Points input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điểm ({quickScoreModal.type === 'PLUS' ? '+' : '-'}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quickPoints}
                    onChange={(e) => setQuickPoints(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày ghi nhận:
                  </label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>

              {/* Specific Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do cụ thể (giải thích cho phụ huynh &amp; học sinh xem):
                </label>
                <textarea
                  rows={2}
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  placeholder={
                    quickScoreModal.type === 'PLUS'
                      ? 'VD: Hăng hái phát biểu xây dựng bài trong giờ Toán...'
                      : 'VD: Đi học muộn 10 phút, quên mang vở bài tập...'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickScoreModal({ open: false, student: null, type: 'PLUS' })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 ${
                    quickScoreModal.type === 'PLUS'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {quickScoreModal.type === 'PLUS'
                      ? `Lưu +${quickPoints} Điểm Ngay`
                      : `Lưu -${quickPoints} Điểm Ngay`}
                  </span>
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
        classId={classId}
        className={currentClass?.name || '9A1'}
      />

      {/* Admin Reset Modal */}
      <AdminResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        initialClassId={classId}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
