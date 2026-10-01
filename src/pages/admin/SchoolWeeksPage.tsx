import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Info,
  Clock,
  Coffee,
  School,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { SchoolWeekConfig } from '../../types';

export const SchoolWeeksPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [weeks, setWeeks] = useState<SchoolWeekConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<'ALL' | '1' | '2' | 'BREAK'>('ALL');

  // Edit / Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingWeek, setEditingWeek] = useState<SchoolWeekConfig | null>(null);

  // Form fields
  const [formWeekId, setFormWeekId] = useState('');
  const [formWeekNumber, setFormWeekNumber] = useState(1);
  const [formSemester, setFormSemester] = useState<1 | 2>(1);
  const [formLabel, setFormLabel] = useState('');
  const [formShortLabel, setFormShortLabel] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsCurrent, setFormIsCurrent] = useState(false);
  const [formIsBreak, setFormIsBreak] = useState(false);
  const [formNote, setFormNote] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [deletingWeek, setDeletingWeek] = useState<SchoolWeekConfig | null>(null);

  const loadWeeks = async () => {
    setLoading(true);
    try {
      const data = await dbService.getSchoolWeeks();
      setWeeks(data);
    } catch (e: any) {
      showToast('Lỗi khi tải danh mục tuần học: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeks();
    const handleUpdate = () => loadWeeks();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, []);

  const currentWeek = weeks.find((w) => w.isCurrent);

  const filteredWeeks = weeks.filter((w) => {
    const matchSearch =
      w.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.shortLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.weekId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.note && w.note.toLowerCase().includes(searchTerm.toLowerCase()));

    if (semesterFilter === 'BREAK') {
      return matchSearch && w.isBreak;
    }
    if (semesterFilter === '1') {
      return matchSearch && w.semester === 1 && !w.isBreak;
    }
    if (semesterFilter === '2') {
      return matchSearch && w.semester === 2 && !w.isBreak;
    }
    return matchSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingWeek(null);
    const nextNum = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;
    setFormWeekNumber(nextNum);
    setFormWeekId(`2026-W${nextNum + 35}`);
    setFormSemester(nextNum <= 19 ? 1 : 2);
    setFormShortLabel(`Tuần ${nextNum}`);
    setFormLabel(`Tuần ${nextNum}`);
    setFormStartDate('');
    setFormEndDate('');
    setFormIsCurrent(false);
    setFormIsBreak(false);
    setFormNote('');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (w: SchoolWeekConfig) => {
    setEditingWeek(w);
    setFormWeekId(w.weekId);
    setFormWeekNumber(w.weekNumber);
    setFormSemester(w.semester);
    setFormLabel(w.label);
    setFormShortLabel(w.shortLabel);
    setFormStartDate(w.startDate);
    setFormEndDate(w.endDate);
    setFormIsCurrent(!!w.isCurrent);
    setFormIsBreak(!!w.isBreak);
    setFormNote(w.note || '');
    setFormIsActive(w.isActive);
    setShowModal(true);
  };

  const handleSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWeekId.trim() || !formLabel.trim() || !formShortLabel.trim()) {
      showToast('Vui lòng điền mã tuần và tên hiển thị!', 'error');
      return;
    }

    if (!formStartDate || !formEndDate) {
      showToast('Vui lòng chọn ngày bắt đầu và kết thúc của tuần!', 'error');
      return;
    }

    if (formStartDate > formEndDate) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'error');
      return;
    }

    setSaving(true);
    try {
      const configItem: SchoolWeekConfig = {
        weekId: formWeekId.trim(),
        weekNumber: formWeekNumber,
        semester: formSemester,
        label: formLabel.trim(),
        shortLabel: formShortLabel.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        isCurrent: formIsCurrent,
        isBreak: formIsBreak,
        note: formNote.trim() || undefined,
        isActive: formIsActive,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Admin',
      };

      await dbService.saveSchoolWeek(configItem);

      if (formIsCurrent) {
        await dbService.setCurrentSchoolWeek(configItem.weekId);
      }

      await dbService.createAuditLog({
        schoolId: 'school-ban-long',
        userId: currentUser?.uid || 'admin',
        userName: currentUser?.displayName || 'Admin',
        userRole: 'ADMIN',
        action: 'seedData',
        details: `${editingWeek ? 'Cập nhật' : 'Thêm mới'} cấu hình tuần toàn trường: ${configItem.label}`,
        timestamp: new Date().toISOString(),
      });

      await loadWeeks();
      setShowModal(false);
      showToast(`Đã lưu thành công ${configItem.shortLabel}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu tuần học', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrentWeek = async (weekId: string) => {
    try {
      await dbService.setCurrentSchoolWeek(weekId);
      const target = weeks.find((w) => w.weekId === weekId);
      showToast(`Đã thiết lập ${target?.shortLabel || weekId} làm TUẦN THI ĐUA HIỆN TẠI của toàn trường!`, 'success');
      await loadWeeks();
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  const handleDeleteWeek = async () => {
    if (!deletingWeek) return;
    try {
      await dbService.deleteSchoolWeek(deletingWeek.weekId);
      showToast(`Đã xóa tuần ${deletingWeek.shortLabel}!`, 'info');
      setDeletingWeek(null);
      await loadWeeks();
    } catch (e: any) {
      showToast('Lỗi khi xóa: ' + e.message, 'error');
    }
  };

  const handleResetToDefault = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn khôi phục lại danh mục 35 tuần chuẩn của năm học 2026-2027 (bao gồm lịch Nghỉ Tết Nguyên Đán và các ngày lễ)?'
      )
    ) {
      return;
    }

    try {
      await dbService.resetSchoolWeeksToDefault();
      showToast('Đã khôi phục thành công danh mục tuần học chuẩn của trường!', 'success');
      await loadWeeks();
    } catch (e: any) {
      showToast('Lỗi khi khôi phục: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Cấu Hình Tuần Học Toàn Trường
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {weeks.length} tuần
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1 leading-relaxed">
            Thiết lập danh mục tuần học áp dụng đồng bộ cho <strong>tất cả 9 lớp</strong> và <strong>link gửi phụ huynh</strong>. Linh hoạt điều chỉnh ngày nghỉ lễ, nghỉ Tết, thi học kỳ theo thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            title="Khôi phục lại 35 tuần chuẩn năm học 2026-2027"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Khôi phục chuẩn 35 tuần</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tuần Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
              Tuần hiện tại
            </span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {currentWeek?.shortLabel || 'Chưa chọn'}
          </div>
          <div className="text-xs text-indigo-700 font-medium mt-1 truncate">
            {currentWeek?.label || 'Chưa thiết lập tuần hiện tại'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
            Học kỳ 1
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {weeks.filter((w) => w.semester === 1 && !w.isBreak).length} tuần
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Từ Tuần 1 đến Tuần 19
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
            Học kỳ 2
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {weeks.filter((w) => w.semester === 2 && !w.isBreak).length} tuần
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Từ Tuần 20 đến Tuần 35
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Tuần Nghỉ Lễ &amp; Tết
            </span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {weeks.filter((w) => w.isBreak).length} đợt
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            Không tính điểm thi đua
          </div>
        </div>
      </div>

      {/* Current Week Quick Setter Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">
              Tuần thi đua hiện tại của trường:
            </span>
            <span className="text-sm md:text-base font-bold text-slate-900">
              Đang chọn: <strong>{currentWeek?.label || 'Chưa thiết lập'}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Chọn nhanh tuần khác:
          </span>
          <select
            value={currentWeek?.weekId || ''}
            onChange={(e) => handleSetCurrentWeek(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {weeks
              .filter((w) => w.isActive && !w.isBreak)
              .map((w) => (
                <option key={w.weekId} value={w.weekId}>
                  {w.shortLabel}: {w.startDate} đến {w.endDate} {w.note ? `(${w.note})` : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tuần, ngày hoặc ghi chú (VD: Tết, 20/11, Tuần 4)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSemesterFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              semesterFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({weeks.length})
          </button>
          <button
            onClick={() => setSemesterFilter('1')}
            className={`px-3 py-1.5 rounded-lg transition ${
              semesterFilter === '1'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học kỳ 1
          </button>
          <button
            onClick={() => setSemesterFilter('2')}
            className={`px-3 py-1.5 rounded-lg transition ${
              semesterFilter === '2'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học kỳ 2
          </button>
          <button
            onClick={() => setSemesterFilter('BREAK')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              semesterFilter === 'BREAK'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:text-amber-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Nghỉ Lễ / Tết</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] md:text-xs">
              <tr>
                <th className="py-3.5 pl-4 w-14">#</th>
                <th className="py-3.5 min-w-[200px]">Tên tuần học</th>
                <th className="py-3.5 min-w-[100px]">Mã tuần</th>
                <th className="py-3.5 text-center w-24">Học kỳ</th>
                <th className="py-3.5 min-w-[180px]">Khoảng thời gian</th>
                <th className="py-3.5 min-w-[140px] text-center">Trạng thái</th>
                <th className="py-3.5 min-w-[180px]">Ghi chú sự kiện</th>
                <th className="py-3.5 text-right pr-4 min-w-[140px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Đang tải danh mục tuần học...
                  </td>
                </tr>
              ) : filteredWeeks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy tuần học nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredWeeks.map((w) => (
                  <tr
                    key={w.weekId}
                    className={`hover:bg-indigo-50/50 transition ${
                      w.isCurrent ? 'bg-indigo-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 pl-4 font-bold text-slate-500">
                      {w.weekNumber > 0 ? w.weekNumber : '-'}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{w.label}</span>
                        {w.isCurrent && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-2xs">
                            HIỆN TẠI
                          </span>
                        )}
                        {w.isBreak && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                            NGHỈ LỄ/TẾT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-600">{w.weekId}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-700">
                        HK {w.semester}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 font-medium">
                      {w.startDate} &rarr; {w.endDate}
                    </td>
                    <td className="py-3 text-center">
                      {w.isBreak ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Nghỉ học
                        </span>
                      ) : w.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Áp dụng thi đua
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                          Tạm ngưng
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 text-xs italic">
                      {w.note || '-'}
                    </td>
                    <td className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {!w.isCurrent && !w.isBreak && w.isActive && (
                          <button
                            onClick={() => handleSetCurrentWeek(w.weekId)}
                            className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                            title="Đặt làm tuần hiện tại"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(w)}
                          className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
                          title="Sửa tuần học"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWeek(w)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          title="Xóa tuần học"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto">
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-violet-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-200" />
                {editingWeek ? `Sửa Cấu Hình: ${editingWeek.shortLabel}` : 'Thêm Tuần Học Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeek} className="p-5 space-y-3.5 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tuần số (#) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formWeekNumber}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10) || 0;
                      setFormWeekNumber(num);
                      if (!editingWeek && num > 0) {
                        setFormShortLabel(`Tuần ${num}`);
                        setFormLabel(`Tuần ${num}`);
                        setFormWeekId(`2026-W${num + 35}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Nhập 0 nếu là tuần nghỉ</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mã tuần (Week ID) *
                  </label>
                  <input
                    type="text"
                    value={formWeekId}
                    onChange={(e) => setFormWeekId(e.target.value.trim())}
                    placeholder="VD: 2026-W36, 2027-TET"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tên viết tắt *
                  </label>
                  <input
                    type="text"
                    value={formShortLabel}
                    onChange={(e) => setFormShortLabel(e.target.value)}
                    placeholder="VD: Tuần 4, Nghỉ Tết"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Học kỳ *
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(parseInt(e.target.value, 10) as 1 | 2)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên hiển thị đầy đủ *
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="VD: Tuần 4 (21/09 – 27/09/2026)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Ghi chú sự kiện (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Nghỉ Tết Nguyên Đán, Chào mừng 20/11, Thi Học kỳ I..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsBreak}
                    onChange={(e) => setFormIsBreak(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-slate-800">
                    Đây là tuần nghỉ lễ / Nghỉ Tết (Không tính điểm thi đua học sinh)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsCurrent}
                    onChange={(e) => setFormIsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-800">
                    Đặt làm tuần thi đua hiện tại của toàn trường
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">
                    Kích hoạt tuần này trong hệ thống
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Tuần Học</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa <strong>{deletingWeek.label}</strong> khỏi cấu hình toàn trường không?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingWeek(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteWeek}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
