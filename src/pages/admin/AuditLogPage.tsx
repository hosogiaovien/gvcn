import React, { useState, useEffect } from 'react';
import { History, Shield, Calendar, User, Search, Filter } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { AuditLog } from '../../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    const list = await dbService.getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.userName.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Nhật Ký Hệ Thống (Audit Logs)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {logs.length} bản ghi
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Toàn bộ thao tác nhạy cảm (đăng nhập, tạo tài khoản, đổi mật khẩu, chốt/mở tuần, chấm điểm) được lưu trữ bất biến
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên người thực hiện, hành động hoặc chi tiết..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 pl-4">Thời gian</th>
              <th className="py-3.5">Người thực hiện</th>
              <th className="py-3.5">Vai trò</th>
              <th className="py-3.5">Hành động</th>
              <th className="py-3.5 pr-4">Nội dung chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <tr key={log.logId} className="hover:bg-slate-50 transition">
                <td className="py-3.5 pl-4 font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                </td>
                <td className="py-3.5 font-bold text-slate-900">{log.userName}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                    {log.userRole}
                  </span>
                </td>
                <td className="py-3.5 font-mono text-indigo-700 font-bold">
                  {log.action}
                </td>
                <td className="py-3.5 pr-4 text-slate-700 leading-relaxed">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
