import React, { useState, useEffect } from 'react';
import {
  Award,
  PlusCircle,
  MinusCircle,
  Plus,
  Check,
  Trash2,
  Edit2,
  Shield,
  Save,
  X,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { Criterion, CriterionType, ClassRoom } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ClassCriteriaPage: React.FC = () => {
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

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [tab, setTab] = useState<'PLUS' | 'MINUS'>('PLUS');

  // Add Criterion State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CriterionType>('PLUS');
  const [newPoints, setNewPoints] = useState<number>(2);
  const [newCategory, setNewCategory] = useState<'HOC_TAP' | 'KY_LUAT' | 'CHUYEN_CAN' | 'PHONG_TRAO' | 'KHAC'>('HOC_TAP');
  const [newDescription, setNewDescription] = useState('');
  const [newAllowGroupLeader, setNewAllowGroupLeader] = useState(true);
  const [newAllowGuard, setNewAllowGuard] = useState(false);

  // Edit Criterion State
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CriterionType>('PLUS');
  const [editPoints, setEditPoints] = useState<number>(2);
  const [editCategory, setEditCategory] = useState<'HOC_TAP' | 'KY_LUAT' | 'CHUYEN_CAN' | 'PHONG_TRAO' | 'KHAC'>('HOC_TAP');
  const [editDescription, setEditDescription] = useState('');
  const [editAllowGroupLeader, setEditAllowGroupLeader] = useState(true);
  const [editAllowGuard, setEditAllowGuard] = useState(false);

  // Delete Criterion State
  const [deletingCriterion, setDeletingCriterion] = useState<Criterion | null>(null);

  const loadData = async () => {
    const [list, cls, allCls] = await Promise.all([
      dbService.getCriteria(classId),
      dbService.getClassById(classId),
      dbService.getClasses(),
    ]);
    setCriteria(list);
    if (cls) setCurrentClass(cls);
    setClasses(allCls);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  const handleToggleAllowGroupLeader = async (criterion: Criterion) => {
    const updated = {
      ...criterion,
      allowGroupLeader: !criterion.allowGroupLeader,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveCriterion(updated);
    await loadData();
    showToast(`Đã ${updated.allowGroupLeader ? 'cho phép' : 'chặn'} Tổ trưởng chấm tiêu chí này!`, 'info');
  };

  const handleToggleAllowGuard = async (criterion: Criterion) => {
    const updated = {
      ...criterion,
      allowGuard: !criterion.allowGuard,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveCriterion(updated);
    await loadData();
    showToast(`Đã ${updated.allowGuard ? 'cấp quyền' : 'thu hồi quyền'} cho Giám thị!`, 'info');
  };

  // Quick adjust point value on table
  const handleQuickAdjustPoints = async (criterion: Criterion, delta: number) => {
    const nextPoints = Math.max(1, criterion.points + delta);
    const updated: Criterion = {
      ...criterion,
      points: nextPoints,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveCriterion(updated);
    await loadData();
    showToast(`Đã cập nhật điểm tiêu chí "${criterion.name}" thành ${nextPoints} điểm!`, 'success');
  };

  // Open Edit Modal
  const handleOpenEdit = (cr: Criterion) => {
    setEditingCriterion(cr);
    setEditName(cr.name);
    setEditType(cr.type);
    setEditPoints(cr.points);
    setEditCategory(cr.category || 'HOC_TAP');
    setEditDescription(cr.description || '');
    setEditAllowGroupLeader(cr.allowGroupLeader);
    setEditAllowGuard(cr.allowGuard);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriterion) return;
    if (!editName.trim()) {
      showToast('Vui lòng nhập tên tiêu chí!', 'error');
      return;
    }

    const updated: Criterion = {
      ...editingCriterion,
      name: editName.trim(),
      type: editType,
      points: Math.max(1, Number(editPoints)),
      category: editCategory,
      description: editDescription.trim(),
      allowGroupLeader: editAllowGroupLeader,
      allowGuard: editAllowGuard,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveCriterion(updated);
    await loadData();
    showToast(`Đã lưu thay đổi cho tiêu chí "${updated.name}"!`, 'success');
    setEditingCriterion(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setNewName('');
    setNewType(tab);
    setNewPoints(2);
    setNewCategory('HOC_TAP');
    setNewDescription('');
    setNewAllowGroupLeader(true);
    setNewAllowGuard(false);
    setShowAddModal(true);
  };

  // Save New Criterion
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Vui lòng nhập tên tiêu chí!', 'error');
      return;
    }

    const newCr: Criterion = {
      criterionId: `cr-${Date.now()}`,
      classId: classId,
      name: newName.trim(),
      type: newType,
      points: Math.max(1, Number(newPoints)),
      category: newCategory,
      description: newDescription.trim(),
      allowGroupLeader: newAllowGroupLeader,
      allowGuard: newAllowGuard,
      allowYouthLeader: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveCriterion(newCr);
    await loadData();
    showToast(`Đã thêm tiêu chí mới: ${newCr.name} (${newCr.type === 'PLUS' ? '+' : '-'}${newCr.points} điểm)!`, 'success');
    setShowAddModal(false);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCriterion) return;
    await dbService.deleteCriterion(deletingCriterion.criterionId);
    await loadData();
    showToast(`Đã xóa tiêu chí "${deletingCriterion.name}"!`, 'info');
    setDeletingCriterion(null);
  };

  const filteredCriteria = criteria.filter((c) => c.type === tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Tiêu Chí Thi Đua Lớp {currentClass?.name || '9A1'}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {criteria.length} tiêu chí
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
            Giáo viên chủ nhiệm có thể chỉnh sửa tên, số điểm quy định (+ / -) và phân quyền chấm điểm cho Tổ trưởng và Giám thị
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Thêm Tiêu Chí Mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-bold">
        <button
          onClick={() => setTab('PLUS')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 text-sm ${
            tab === 'PLUS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Tiêu Chí Điểm Cộng (+ Thưởng)
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
            {criteria.filter((c) => c.type === 'PLUS').length}
          </span>
        </button>
        <button
          onClick={() => setTab('MINUS')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 text-sm ${
            tab === 'MINUS'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MinusCircle className="w-4 h-4" /> Tiêu Chí Điểm Trừ (- Vi phạm)
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800">
            {criteria.filter((c) => c.type === 'MINUS').length}
          </span>
        </button>
      </div>

      {/* Criteria Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3.5 pl-4">Tên tiêu chí</th>
                <th className="py-3.5">Danh mục</th>
                <th className="py-3.5">Mô tả quy định</th>
                <th className="py-3.5 text-center w-36">Số điểm quy định</th>
                <th className="py-3.5 text-center w-36">Tổ trưởng được chấm?</th>
                <th className="py-3.5 text-center w-36">Giám thị được chấm?</th>
                <th className="py-3.5 text-right pr-4 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCriteria.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có tiêu chí nào trong danh mục này. Hãy bấm "+ Thêm Tiêu Chí Mới".
                  </td>
                </tr>
              ) : (
                filteredCriteria.map((cr) => (
                  <tr key={cr.criterionId} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3.5 pl-4">
                      <div className="font-bold text-slate-900 text-sm">{cr.name}</div>
                      {cr.classId !== 'GLOBAL' && (
                        <span className="text-[10px] text-indigo-600 font-semibold uppercase">
                          (Dành riêng lớp {currentClass?.name || '9A1'})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {cr.category === 'HOC_TAP'
                          ? 'Học tập'
                          : cr.category === 'KY_LUAT'
                          ? 'Kỷ luật'
                          : cr.category === 'CHUYEN_CAN'
                          ? 'Chuyên cần'
                          : cr.category === 'PHONG_TRAO'
                          ? 'Phong trào'
                          : 'Khác'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 max-w-xs text-xs">{cr.description || '-'}</td>
                    <td className="py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickAdjustPoints(cr, -1)}
                          title="Giảm 1 điểm"
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition"
                        >
                          -
                        </button>
                        <span
                          onClick={() => handleOpenEdit(cr)}
                          title="Bấm để sửa số điểm"
                          className={`cursor-pointer font-black text-xs px-3 py-1 rounded-lg hover:ring-2 hover:ring-indigo-400 transition ${
                            cr.type === 'PLUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cr.type === 'PLUS' ? `+${cr.points}` : `-${cr.points}`} đ
                        </span>
                        <button
                          onClick={() => handleQuickAdjustPoints(cr, 1)}
                          title="Tăng 1 điểm"
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAllowGroupLeader(cr)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          cr.allowGroupLeader
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cr.allowGroupLeader ? 'Được phép' : 'Chặn'}
                      </button>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAllowGuard(cr)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          cr.allowGuard
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cr.allowGuard ? 'Được phép' : 'Chặn'}
                      </button>
                    </td>
                    <td className="py-3.5 text-right pr-4">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cr)}
                          title="Sửa tiêu chí & số điểm"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCriterion(cr)}
                          title="Xóa tiêu chí này"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT CRITERIA MODAL */}
      {editingCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Sửa Tiêu Chí Thi Đua</h3>
              </div>
              <button
                onClick={() => setEditingCriterion(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tiêu chí thi đua <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại điểm</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="PLUS">🟢 Điểm cộng (+ Khen thưởng)</option>
                    <option value="MINUS">🔴 Điểm trừ (- Vi phạm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điểm thi đua <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={editPoints}
                      onChange={(e) => setEditPoints(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-indigo-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">điểm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục hoạt động</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="HOC_TAP">Học tập &amp; Phát biểu</option>
                  <option value="KY_LUAT">Kỷ luật &amp; Nề nếp lớp</option>
                  <option value="CHUYEN_CAN">Chuyên cần &amp; Đúng giờ</option>
                  <option value="PHONG_TRAO">Phong trào hoạt động</option>
                  <option value="KHAC">Quy định khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Hướng dẫn áp dụng</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ghi rõ tình huống cụ thể được cộng hoặc trừ điểm..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Permissions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Phân quyền ai được ghi nhận:</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowGroupLeader}
                    onChange={(e) => setEditAllowGroupLeader(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tổ trưởng &amp; Tổ phó được quyền chấm tiêu chí này</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowGuard}
                    onChange={(e) => setEditAllowGuard(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Thầy Giám thị được quyền ghi nhận tiêu chí này</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCriterion(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Cập nhật tiêu chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CRITERIA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Thêm Tiêu Chí Thi Đua Mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tiêu chí thi đua <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giúp đỡ bạn cùng tiến bộ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại điểm</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="PLUS">🟢 Điểm cộng (+ Thưởng)</option>
                    <option value="MINUS">🔴 Điểm trừ (- Vi phạm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điểm thi đua <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={newPoints}
                      onChange={(e) => setNewPoints(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-indigo-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">điểm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục hoạt động</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="HOC_TAP">Học tập &amp; Phát biểu</option>
                  <option value="KY_LUAT">Kỷ luật &amp; Nề nếp lớp</option>
                  <option value="CHUYEN_CAN">Chuyên cần &amp; Đúng giờ</option>
                  <option value="PHONG_TRAO">Phong trào hoạt động</option>
                  <option value="KHAC">Quy định khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Hướng dẫn áp dụng</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ghi rõ tình huống cụ thể được cộng hoặc trừ điểm..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Permissions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Phân quyền ai được ghi nhận:</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAllowGroupLeader}
                    onChange={(e) => setNewAllowGroupLeader(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tổ trưởng &amp; Tổ phó được quyền chấm tiêu chí này</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAllowGuard}
                    onChange={(e) => setNewAllowGuard(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Thầy Giám thị được quyền ghi nhận tiêu chí này</span>
                </label>
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
                  <Save className="w-4 h-4" /> Lưu tiêu chí mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CRITERION CONFIRMATION */}
      {deletingCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Xác Nhận Xóa Tiêu Chí?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa tiêu chí <strong className="text-slate-900 font-bold">{deletingCriterion.name}</strong> ({deletingCriterion.type === 'PLUS' ? '+' : '-'}{deletingCriterion.points} điểm)?
            </p>

            <div className="pt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingCriterion(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
