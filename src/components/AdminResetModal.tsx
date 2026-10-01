import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  X,
  Trash2,
  Layers,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { ClassRoom, CompetitionTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  onSuccess?: () => void;
}

export const AdminResetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialClassId = 'ALL',
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [rangeMode, setRangeMode] = useState<'ALL_TIME' | 'CUSTOM' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL_TIME');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);

  useEffect(() => {
    if (isOpen) {
      dbService.getClasses().then((cls) => setClasses(cls));
      dbService.getTransactions().then((txs) => setTransactions(txs));
      setSelectedClassId(initialClassId);
      setConfirmed(false);
    }
  }, [isOpen, initialClassId]);

  // Set dates based on range mode
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (rangeMode === 'THIS_WEEK') {
      setStartDate('2026-09-21');
      setEndDate('2026-09-27');
    } else if (rangeMode === 'THIS_MONTH') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    }
  }, [rangeMode]);

  // Calculate matching transactions count
  const matchingTxCount = useMemo(() => {
    return transactions.filter((tx) => {
      const matchClass = selectedClassId === 'ALL' || tx.classId === selectedClassId;
      if (!matchClass) return false;
      if (rangeMode === 'ALL_TIME') return true;
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    }).length;
  }, [transactions, selectedClassId, rangeMode, startDate, endDate]);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (!confirmed) {
      showToast('Vui lòng tích vào ô xác nhận để tiếp tục!', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const result = await dbService.resetCompetitionData({
        classId: selectedClassId,
        startDate: rangeMode === 'ALL_TIME' ? undefined : startDate,
        endDate: rangeMode === 'ALL_TIME' ? undefined : endDate,
        resetAllTime: rangeMode === 'ALL_TIME',
        adminUserId: currentUser?.uid || 'user-admin',
        adminUserName: currentUser?.displayName || 'Quản Trị Viên',
      });

      const className =
        selectedClassId === 'ALL'
          ? 'toàn trường (9 lớp)'
          : `Lớp ${classes.find((c) => c.classId === selectedClassId)?.name || selectedClassId}`;

      showToast(
        `Đã reset sạch điểm thi đua ${className}! Đã xóa ${result.deletedTransactionsCount} lượt điểm và đưa điểm học sinh về 0.`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      showToast('Lỗi khi reset điểm thi đua: ' + e?.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-rose-600 animate-spin-reverse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Dành riêng cho Admin
              </div>
              <h2 className="text-xl font-black text-slate-900">Reset Điểm Thi Đua Về 0</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Xóa sạch các lượt điểm cộng/trừ và đặt điểm thi đua học sinh về 0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 mt-5">
          {/* 1. Chọn Lớp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Bước 1: Chọn lớp cần reset</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="ALL">🏫 Tất cả các lớp trong trường (Toàn bộ 9 lớp)</option>
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  Lớp {cls.name} &bull; GVCN: {cls.homeroomTeacherName} ({cls.studentCount || 0} HS)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Khoảng Thời Gian */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Bước 2: Chọn khoảng thời gian reset</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setRangeMode('ALL_TIME')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                  rangeMode === 'ALL_TIME'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                Toàn bộ thời gian
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('THIS_WEEK')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                  rangeMode === 'THIS_WEEK'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('THIS_MONTH')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                  rangeMode === 'THIS_MONTH'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('CUSTOM')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                  rangeMode === 'CUSTOM'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                Tùy chọn ngày
              </button>
            </div>

            {rangeMode !== 'ALL_TIME' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setRangeMode('CUSTOM');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1">Đến ngày:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setRangeMode('CUSTOM');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dữ liệu dự kiến bị xóa */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs md:text-sm">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Số lượt điểm sẽ bị xóa sạch:</span>
            </span>
            <span className="font-black text-rose-700 text-base">
              {matchingTxCount} lượt ghi nhận điểm
            </span>
          </div>

          {/* Cảnh báo nghiêm ngặt */}
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900">
            <div className="font-black flex items-center gap-1.5 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>CẢNH BÁO QUAN TRỌNG</span>
            </div>
            <p className="leading-relaxed">
              Toàn bộ các sự kiện điểm cộng, điểm trừ của lớp trong thời gian chọn sẽ bị{' '}
              <strong>xóa hoàn toàn khỏi cơ sở dữ liệu</strong> và điểm thi đua sẽ{' '}
              <strong>đưa về 0</strong>. Thao tác này là dọn sạch dữ liệu và không thể hoàn tác!
            </p>
          </div>

          {/* Checkbox xác nhận */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
              Tôi xác nhận là Admin và đồng ý xóa sạch dữ liệu điểm thi đua của phạm vi đã chọn về 0.
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm rounded-xl transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={!confirmed || isResetting}
            onClick={handleExecuteReset}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isResetting ? 'Đang xóa sạch dữ liệu...' : 'Xác Nhận Reset Về 0'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
