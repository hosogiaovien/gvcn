import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  ExternalLink,
  Save,
  Sparkles,
  HelpCircle,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { isFirebaseConfigured, activeConfig, saveCustomFirebaseConfig, clearCustomFirebaseConfig } from '../firebase/config';
import { dbService } from '../services/dbService';
import { useNotification } from '../context/NotificationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { showToast } = useNotification();
  const [apiKey, setApiKey] = useState(activeConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(activeConfig.authDomain || '');
  const [projectId, setProjectId] = useState(activeConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(activeConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(activeConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(activeConfig.appId || '');

  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!apiKey || !projectId) {
      showToast('Vui lòng nhập tối thiểu apiKey và projectId', 'error');
      return;
    }
    saveCustomFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    });
    showToast('Đã lưu cấu hình Firebase! Đang làm mới trang...', 'success');
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await dbService.seedAllToFirestore();
      if (res.success) {
        showToast(`Đã đẩy thành công ${res.count} bản ghi mẫu vào Firebase Firestore!`, 'success');
      } else {
        showToast(res.error || 'Lỗi khi khởi tạo', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isFirebaseConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cấu Hình Kết Nối Firebase</h3>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                Trạng thái:{' '}
                {isFirebaseConfigured ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối Firebase ({activeConfig.projectId})
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Đang dùng bộ nhớ cục bộ / Demo Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 border-b-2 transition ${activeTab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Thông số kết nối Web SDK
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 transition ${activeTab === 'guide' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Hướng dẫn lấy thông số
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
                <strong>Gợi ý:</strong> Bạn có thể cấu hình các biến này trực tiếp qua file <code>.env.local</code> hoặc trên{' '}
                <strong>Vercel Environment Variables</strong> (với tiền tố <code>VITE_FIREBASE_*</code>). Nếu nhập tại đây, hệ thống sẽ lưu vào trình duyệt của bạn để kiểm thử ngay lập tức!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    API Key (VITE_FIREBASE_API_KEY)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSyA..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Project ID (VITE_FIREBASE_PROJECT_ID)
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="thidua-truonghoc"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="thidua-truonghoc.firebaseapp.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="thidua-truonghoc.firebasestorage.app"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    App ID (VITE_FIREBASE_APP_ID)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789:web:abcdef..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Seed button */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Khởi tạo dữ liệu mẫu (Seed Data)
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-1">
                      Đẩy 40 học sinh lớp 9A1, 4 tổ, 15 tiêu chí và các tài khoản mẫu vào Cloud Firestore.
                    </p>
                  </div>
                  <button
                    onClick={handleSeed}
                    disabled={seeding || !isFirebaseConfigured}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    {seeding ? 'Đang đẩy dữ liệu...' : 'Đẩy vào Firestore'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-slate-700 text-xs leading-relaxed">
              <h4 className="font-bold text-slate-900 text-sm">3 Bước tạo Firebase cho dự án:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Vào{' '}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-medium inline-flex items-center gap-0.5 hover:underline"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  và bấm <strong>Add Project</strong> (Đặt tên ví dụ: <code>thidua-truonghoc</code>).
                </li>
                <li>
                  Tại menu trái, vào <strong>Build &gt; Authentication</strong> &gt; bấm <strong>Get Started</strong> &gt; bật tab <strong>Sign-in method</strong> &gt; chọn <strong>Email/Password</strong> &gt; bấm <strong>Enable</strong> &gt; Save.
                </li>
                <li>
                  Tại menu trái, vào <strong>Build &gt; Firestore Database</strong> &gt; bấm <strong>Create database</strong> &gt; chọn khu vực (asia-southeast1 hoặc asia-east1) &gt; chọn <strong>Start in production mode</strong> (file <code>firestore.rules</code> đã có sẵn trong dự án).
                </li>
                <li>
                  Vào <strong>Project Settings (biểu tượng bánh răng) &gt; General</strong> &gt; kéo xuống phần <strong>Your apps</strong> &gt; bấm biểu tượng Web <strong>&lt;/&gt;</strong> để lấy object cấu hình <code>firebaseConfig</code> và dán các giá trị vào tab Thông số.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={clearCustomFirebaseConfig}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            Xóa cấu hình tùy chỉnh
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-lg transition"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Lưu Cấu Hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
