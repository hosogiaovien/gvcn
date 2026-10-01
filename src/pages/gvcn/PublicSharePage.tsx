import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Eye,
  Lock,
  ExternalLink,
  Printer,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { publicShareService } from '../../services/publicShareService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { PublicShareConfig, ClassRoom } from '../../types';
import { QRCodeModal } from '../../components/QRCodeModal';

export const PublicSharePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>(currentUser?.classId || 'class-9a1');

  const [shareConfig, setShareConfig] = useState<PublicShareConfig | null>(null);
  const [allClassShares, setAllClassShares] = useState<{
    classRoom: ClassRoom;
    token: string;
    url: string;
  }[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ className: string; token: string; url: string } | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      const cls = await dbService.getClasses();
      setClasses(cls);

      const shares = await Promise.all(
        cls.map(async (c) => {
          const share = await dbService.getPublicShareByClassId(c.classId);
          const token = share?.token || `tk_${c.name.toLowerCase()}_banlong_2026`;
          return {
            classRoom: c,
            token,
            url: `${window.location.origin}/public/${token}`,
          };
        })
      );
      setAllClassShares(shares);
    };
    loadClasses();
  }, []);

  const loadShare = async () => {
    let conf = await dbService.getPublicShareByClassId(classId);
    if (!conf) {
      const currClass = classes.find((c) => c.classId === classId);
      conf = {
        shareId: `share-${classId}-active`,
        classId,
        schoolId: 'school-ban-long',
        schoolYearId: 'year-2026-2027',
        token: currClass ? `tk_${currClass.name.toLowerCase()}_banlong_2026` : publicShareService.generateSecureToken(),
        isActive: true,
        showClassRank: true,
        showGroupRank: true,
        showPoints: true,
        showPlusMinus: true,
        showHistory: true,
        nameDisplayFormat: 'FULL',
        showWeekly: true,
        showMonthly: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByName: currentUser?.displayName || 'GVCN',
      };
      await dbService.savePublicShare(conf);
    }
    setShareConfig(conf);
  };

  useEffect(() => {
    loadShare();
  }, [classId]);

  const fullShareUrl = shareConfig
    ? `${window.location.origin}/public/${shareConfig.token}`
    : '';

  const handleCopyLink = () => {
    if (!fullShareUrl) return;
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    showToast(`Đã sao chép link công khai cho phụ huynh lớp ${classes.find(c => c.classId === classId)?.name || '9A1'}!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySpecificLink = (url: string, token: string, className: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    showToast(`Đã sao chép link phụ huynh Lớp ${className}!`, 'success');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleOpenQRForClass = (className: string, token: string, url: string) => {
    setModalTarget({ className, token, url });
    setShowQRModal(true);
  };

  const handleRegenerateToken = async () => {
    if (!shareConfig) return;
    const newToken = publicShareService.generateSecureToken();
    const updated: PublicShareConfig = {
      ...shareConfig,
      token: newToken,
      updatedAt: new Date().toISOString(),
    };
    await dbService.savePublicShare(updated);
    setShareConfig(updated);

    await dbService.createAuditLog({
      schoolId: 'school-ban-long',
      classId,
      userId: currentUser?.uid || 'gvcn',
      userName: currentUser?.displayName || 'GVCN',
      userRole: 'GVCN',
      action: 'createPublicShare',
      details: `Đổi mã bảo mật link chia sẻ phụ huynh lớp ${classId}`,
      timestamp: new Date().toISOString(),
    });

    showToast('Đã tạo mã bảo mật ngẫu nhiên mới! Link cũ đã vô hiệu hóa.', 'info');
  };

  const handleToggleActive = async () => {
    if (!shareConfig) return;
    const updated: PublicShareConfig = {
      ...shareConfig,
      isActive: !shareConfig.isActive,
      updatedAt: new Date().toISOString(),
    };
    await dbService.savePublicShare(updated);
    setShareConfig(updated);
    showToast(
      updated.isActive ? 'Đã kích hoạt link phụ huynh!' : 'Đã thu hồi (khóa) link phụ huynh!',
      updated.isActive ? 'success' : 'info'
    );
  };

  const handleSaveOption = async (key: keyof PublicShareConfig, val: any) => {
    if (!shareConfig) return;
    const updated = {
      ...shareConfig,
      [key]: val,
      updatedAt: new Date().toISOString(),
    };
    await dbService.savePublicShare(updated);
    setShareConfig(updated);
    showToast('Đã lưu cấu hình hiển thị!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Chia Sẻ Cho Phụ Huynh Học Sinh</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                shareConfig?.isActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {shareConfig?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
            </span>
            {/* Class Switcher - ADMIN ONLY */}
            {currentUser?.role === 'ADMIN' && classes.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Quyền Admin - Xem Lớp:</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="bg-transparent text-indigo-900 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      Lớp {c.name} (Khối {c.grade}) {c.homeroomTeacherName ? `- ${c.homeroomTeacherName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Phụ huynh quét mã QR hoặc mở link để theo dõi thi đua mà không cần tài khoản, dữ liệu nhạy cảm được bảo mật tuyệt đối
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            disabled={!shareConfig?.isActive}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" /> Xem &amp; In Mã QR
          </button>
        </div>
      </div>

      {/* Share Link Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Đường Dẫn &amp; Mã QR Riêng Biệt Cho Phụ Huynh Lớp {classes.find((c) => c.classId === classId)?.name || '9A1'}
              </label>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                Riêng từng lớp
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Mỗi lớp có 1 mã bảo mật và QR riêng biệt. Phụ huynh quét mã này chỉ xem được thi đua nội bộ của lớp mình.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareConfig?.isActive ? fullShareUrl : 'Link đang bị khóa'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs select-all text-slate-700 font-semibold"
              />
              <button
                onClick={handleCopyLink}
                disabled={!shareConfig?.isActive}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
              <a
                href={fullShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shrink-0"
                title="Mở thử nghiệm"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-5 md:pt-0">
            <button
              onClick={handleToggleActive}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition ${
                shareConfig?.isActive
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {shareConfig?.isActive ? 'Thu hồi link' : 'Mở lại link'}
            </button>
            <button
              onClick={handleRegenerateToken}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tạo token mới
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings Form */}
      {shareConfig && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Cấu Hình Quyền Riêng Tư &amp; Thông Tin Hiển Thị
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Hiển thị xếp hạng cá nhân</div>
                <div className="text-slate-500">Cho phụ huynh thấy thứ hạng của các học sinh</div>
              </div>
              <input
                type="checkbox"
                checked={shareConfig.showClassRank}
                onChange={(e) => handleSaveOption('showClassRank', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Hiển thị xếp hạng 4 tổ</div>
                <div className="text-slate-500">Xem điểm tổng hợp và thứ tự các tổ thi đua</div>
              </div>
              <input
                type="checkbox"
                checked={shareConfig.showGroupRank}
                onChange={(e) => handleSaveOption('showGroupRank', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Hiển thị điểm số cụ thể</div>
                <div className="text-slate-500">Nếu tắt, chỉ hiển thị thứ bậc mà không hiện số điểm</div>
              </div>
              <input
                type="checkbox"
                checked={shareConfig.showPoints}
                onChange={(e) => handleSaveOption('showPoints', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Hiển thị chi tiết điểm cộng / điểm trừ</div>
                <div className="text-slate-500">Xem số điểm cộng và trừ riêng biệt</div>
              </div>
              <input
                type="checkbox"
                checked={shareConfig.showPlusMinus}
                onChange={(e) => handleSaveOption('showPlusMinus', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>

          <div className="pt-2">
            <label className="block font-bold text-slate-800 text-xs mb-2">
              Định dạng hiển thị tên học sinh (Bảo vệ quyền riêng tư của các em):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { format: 'FULL' as const, label: 'Tên đầy đủ', example: 'Nguyễn Văn An' },
                { format: 'ABBREVIATED' as const, label: 'Viết tắt tên đệm', example: 'Nguyễn V. An' },
                { format: 'MASKED' as const, label: 'Che ký tự giữa', example: 'Nguyễn *** An' },
              ].map((item) => (
                <button
                  key={item.format}
                  type="button"
                  onClick={() => handleSaveOption('nameDisplayFormat', item.format)}
                  className={`p-3 rounded-xl border text-left transition ${
                    shareConfig.nameDisplayFormat === item.format
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">{item.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.example}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table: Danh Sách Link & Mã QR Của Từng Lớp Trong Trường - ADMIN ONLY */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>Quyền Admin: Bảng Tra Cứu Mã QR &amp; Link Phụ Huynh Toàn Bộ 10 Lớp Học</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi lớp có mã bảo mật và link phụ huynh riêng biệt, không dùng chung. Bấm vào để sao chép hoặc in mã QR cho lớp.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 pl-3 w-28">Lớp / Khối</th>
                  <th className="py-3 w-48">Giáo viên chủ nhiệm</th>
                  <th className="py-3">Đường dẫn phụ huynh riêng của lớp</th>
                  <th className="py-3 text-right pr-3 w-56">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allClassShares.map((item) => {
                  const isCurrent = item.classRoom.classId === classId;
                  return (
                    <tr
                      key={item.classRoom.classId}
                      className={`hover:bg-slate-50 transition ${isCurrent ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="py-3 pl-3">
                        <div className="font-bold text-slate-900 text-sm">
                          Lớp {item.classRoom.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">Khối {item.classRoom.grade}</div>
                      </td>
                      <td className="py-3 text-slate-700 font-semibold">
                        {item.classRoom.homeroomTeacherName || 'Chưa gán GV'}
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-indigo-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 select-all truncate max-w-md">
                          {item.url}
                        </div>
                      </td>
                      <td className="py-3 text-right pr-3">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySpecificLink(item.url, item.token, item.classRoom.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Sao chép liên kết lớp này"
                          >
                            {copiedToken === item.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedToken === item.token ? 'Đã chép' : 'Chép link'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenQRForClass(item.classRoom.name, item.token, item.url)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title={`Xem mã QR lớp ${item.classRoom.name}`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã QR</span>
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Mở tab mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setModalTarget(null);
          }}
          token={modalTarget ? modalTarget.token : (shareConfig?.token || '')}
          className={modalTarget ? modalTarget.className : (classes.find((c) => c.classId === classId)?.name || '9A1')}
          shareUrl={modalTarget ? modalTarget.url : fullShareUrl}
        />
      )}
    </div>
  );
};
