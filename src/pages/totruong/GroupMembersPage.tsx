import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Flame,
  KeyRound,
  Eye,
  Search,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { Student, Group, CompetitionTransaction } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export const GroupMembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const classId = currentUser?.classId || 'class-9a1';
  const groupId = currentUser?.groupId || 'group-1';

  const [members, setMembers] = useState<Student[]>([]);
  const [groupObj, setGroupObj] = useState<Group | null>(null);
  const [allTransactions, setAllTransactions] = useState<CompetitionTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [className, setClassName] = useState('9A1');

  const loadData = async () => {
    const [allStudents, grpList, allTxs, cls] = await Promise.all([
      dbService.getStudents(classId),
      dbService.getGroups(classId),
      dbService.getTransactions(classId),
      dbService.getClassById(classId),
    ]);

    const myMembers = allStudents.filter((s) => s.groupId === groupId);
    const myGroup = grpList.find((g) => g.groupId === groupId) || null;

    setMembers(myMembers);
    setGroupObj(myGroup);
    setAllTransactions(allTxs);
    if (cls) setClassName(cls.name);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [groupId, classId]);

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" /> Thành Viên {groupObj?.name || 'Tổ 1'} &bull; Lớp {className}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Danh Sách Thành Viên {groupObj?.name || 'Tổ 1'}
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1.5 font-medium">
            Tổ trưởng: <strong className="text-white font-bold">{currentUser?.displayName}</strong> &bull; Sĩ số: {members.length} học sinh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs md:text-sm rounded-xl border border-white/30 backdrop-blur-md transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>Đổi Mật Khẩu Cá Nhân</span>
          </button>
          <Link
            to="/to-truong/score"
            className="px-4 py-2.5 bg-white text-sky-800 font-bold text-xs md:text-sm rounded-xl shadow-lg hover:bg-sky-50 transition flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4 text-orange-500" /> Chấm Điểm Thi Đua Tổ
          </Link>
        </div>
      </div>

      {/* Security & Role Policy Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Quy định phân quyền:</strong> Tổ trưởng phụ trách theo dõi nề nếp và chấm điểm thi đua cho thành viên trong tổ.
          Tổ trưởng <strong>không có quyền cấp tài khoản</strong> hoặc sửa đổi danh sách thành viên. Việc quản lý tài khoản và phân bổ học sinh do Giáo viên chủ nhiệm và Quản trị viên phụ trách.
        </div>
      </div>

      {/* Main Members Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" /> Thành Viên Trong Tổ ({filteredMembers.length}/{members.length} HS)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bấm vào tên học sinh để xem chi tiết điểm cộng, điểm trừ và lịch sử thi đua
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã HS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3">Mã HS</th>
                <th className="py-3 px-3">Họ và Tên Học Sinh</th>
                <th className="py-3 px-3 hidden sm:table-cell">Ngày sinh</th>
                <th className="py-3 px-3 hidden md:table-cell">Giới tính</th>
                <th className="py-3 px-3 text-center">Điểm (+)</th>
                <th className="py-3 px-3 text-center">Điểm (-)</th>
                <th className="py-3 px-3 text-center">Tổng Điểm</th>
                <th className="py-3 px-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy học sinh nào trong tổ phù hợp.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => (
                  <tr
                    key={m.studentId}
                    onClick={() => setSelectedStudentForModal(m)}
                    className="hover:bg-sky-50/60 transition cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                      {m.studentCode}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-sky-700">
                      <div className="flex items-center gap-2">
                        <span>{m.fullName}</span>
                        {m.fullName === currentUser?.displayName?.split('(')[0].trim() && (
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full">
                            Bạn (Tổ trưởng)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 hidden sm:table-cell">
                      {m.dateOfBirth || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 hidden md:table-cell">
                      {m.gender === 'NU' ? 'Nữ' : 'Nam'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      +{m.plusPoints ?? 0}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-600">
                      -{m.minusPoints ?? 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg font-black text-xs bg-slate-100 text-slate-800 border border-slate-200">
                        {(m.totalPoints ?? 0) > 0 ? `+${m.totalPoints}` : m.totalPoints ?? 0} đ
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentForModal(m);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 group-hover:text-sky-600 hover:bg-white transition"
                        title="Xem lịch sử thành tích"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={allTransactions}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
