import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { SystemSettings } from '../../types';
import { AdminResetModal } from '../../components/AdminResetModal';

export const SystemSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  useEffect(() => {
    dbService.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentUser) return;
    setLoading(true);
    try {
      await dbService.updateSettings(settings, currentUser.uid);
      showToast('Đã lưu cấu hình hệ thống thành công!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Cấu Hình Toàn Trường</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              Admin Control
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Cấu hình thuật toán Tie-Break, phân quyền chấm thi đua và thông tin nhà trường
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Basic School Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" /> Thông Tin Trường Học
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tên trường:</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Năm học hiện tại:</label>
              <input
                type="text"
                value={settings.activeSchoolYear}
                onChange={(e) => setSettings({ ...settings, activeSchoolYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Tie Break Engine */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" /> Cấu Hình Thuật Toán Xếp Hạng &amp; Tie-Break
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống tự động phân loại khi học sinh hoặc các tổ bằng điểm nhau theo thứ tự ưu tiên:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                1
              </span>
              <span className="font-semibold text-slate-800">
                Tổng điểm thi đua cao hơn (Bắt buộc)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                2
              </span>
              <span className="font-semibold text-slate-800">
                Tổng điểm trừ ít hơn (Ít vi phạm nội quy hơn)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                3
              </span>
              <span className="font-semibold text-slate-800">
                Số lần đạt điểm cộng nhiều hơn (Tích cực phát biểu, việc tốt)
              </span>
            </div>
          </div>
        </div>

        {/* Permission Switches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Quyền Ghi Nhận Thi Đua
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Cho phép Tổ trưởng chấm trực tiếp</div>
                <div className="text-slate-500">
                  Nếu tắt, điểm do Tổ trưởng chấm sẽ ở trạng thái chờ GVCN phê duyệt (mặc định)
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowGroupLeaderDirectScore}
                onChange={(e) =>
                  setSettings({ ...settings, allowGroupLeaderDirectScore: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Cho phép Giám thị ghi nhận vi phạm</div>
                <div className="text-slate-500">Giám thị có thể trừ điểm học sinh toàn trường</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowGuardScore}
                onChange={(e) => setSettings({ ...settings, allowGuardScore: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Cho phép Tổng phụ trách ghi nhận thi đua</div>
                <div className="text-slate-500">Tổng phụ trách cộng điểm phong trào hoặc trừ điểm toàn trường</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowYouthLeaderScore}
                onChange={(e) =>
                  setSettings({ ...settings, allowYouthLeaderScore: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Data Maintenance & Reset Section */}
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" /> Quản Trị &amp; Reset Dữ Liệu Thi Đua
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cho phép Admin chọn lớp và khoảng thời gian để xóa sạch điểm thi đua, đưa điểm cộng/trừ về 0.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Reset Điểm Thi Đua
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}</span>
          </button>
        </div>
      </form>

      {/* Admin Reset Modal */}
      <AdminResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};
