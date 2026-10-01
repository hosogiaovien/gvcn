import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { CompetitionTransaction } from '../../types';

export const ApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [pendingTxs, setPendingTxs] = useState<CompetitionTransaction[]>([]);
  const [rejectModalTx, setRejectModalTx] = useState<CompetitionTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const classId = currentUser?.classId || 'class-9a1';

  const loadData = async () => {
    const list = await dbService.getTransactions(classId);
    setPendingTxs(list.filter((t) => t.status === 'PENDING'));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  const handleApprove = async (txId: string) => {
    setProcessing(true);
    try {
      await dbService.updateTransactionStatus(
        txId,
        'APPROVED',
        currentUser?.uid,
        currentUser?.displayName
      );
      await loadData();
      showToast('Đã phê duyệt bản ghi thi đua!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (pendingTxs.length === 0) return;
    setProcessing(true);
    try {
      for (const tx of pendingTxs) {
        await dbService.updateTransactionStatus(
          tx.transactionId,
          'APPROVED',
          currentUser?.uid,
          currentUser?.displayName
        );
      }
      await loadData();
      showToast(`Đã duyệt toàn bộ ${pendingTxs.length} bản ghi thi đua!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTx) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }
    setProcessing(true);
    try {
      await dbService.updateTransactionStatus(
        rejectModalTx.transactionId,
        'REJECTED',
        currentUser?.uid,
        currentUser?.displayName,
        rejectReason.trim()
      );
      await loadData();
      showToast('Đã từ chối bản ghi thi đua!', 'info');
      setRejectModalTx(null);
      setRejectReason('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Phê Duyệt Ghi Nhận Thi Đua</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                pendingTxs.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {pendingTxs.length} yêu cầu chờ duyệt
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Duyệt các điểm cộng, điểm trừ do Tổ trưởng ghi nhận trước khi tính vào tổng kết
          </p>
        </div>

        {pendingTxs.length > 0 && (
          <button
            onClick={handleBatchApprove}
            disabled={processing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Duyệt tất cả ({pendingTxs.length})</span>
          </button>
        )}
      </div>

      {/* List */}
      {pendingTxs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tuyệt vời! Không có yêu cầu chờ duyệt</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tất cả các ghi nhận từ Tổ trưởng đã được xử lý hoàn tất hoặc chưa có ghi nhận mới phát sinh.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTxs.map((tx) => (
            <div
              key={tx.transactionId}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    tx.type === 'PLUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tx.type === 'PLUS' ? '+' : '-'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{tx.studentName}</span>
                    <span className="text-xs text-slate-500 font-medium">({tx.groupName})</span>
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded ${
                        tx.type === 'PLUS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points} đ
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    Tiêu chí: {tx.criterionName}
                  </div>

                  {tx.reason && (
                    <div className="text-xs text-slate-500 italic mt-0.5">&ldquo;{tx.reason}&rdquo;</div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Người gửi: {tx.createdByName}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Ngày: {tx.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => setRejectModalTx(tx)}
                  disabled={processing}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Từ chối
                </button>
                <button
                  onClick={() => handleApprove(tx.transactionId)}
                  disabled={processing}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt điểm
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Từ Chối Ghi Nhận Thi Đua</h3>
              <button
                onClick={() => setRejectModalTx(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Nhập lý do từ chối ghi nhận của học sinh{' '}
              <strong>{rejectModalTx.studentName}</strong> để thông báo lại cho Tổ trưởng:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Thiếu minh chứng, chưa xác thực với thầy cô bộ môn..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalTx(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
