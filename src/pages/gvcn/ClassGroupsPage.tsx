import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  FolderTree,
  Users,
  Award,
  UserCheck,
  Plus,
  Sparkles,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  X,
  Save,
  Lock,
  UserPlus,
  Crown,
  Medal,
  Copy,
  Info,
  BarChart3,
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { rankingService } from '../../services/rankingService';
import { Group, Student, CompetitionTransaction, GroupRankItem, UserProfile, ClassRoom } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { GroupStatisticsModal } from '../../components/GroupStatisticsModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ClassGroupsPage: React.FC = () => {
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<CompetitionTransaction[]>([]);
  const [groupRanks, setGroupRanks] = useState<GroupRankItem[]>([]);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState<boolean>(false);

  // State for Assigning Leader/Deputy Modal
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    group: Group | null;
    roleType: 'LEADER' | 'DEPUTY';
  }>({ open: false, group: null, roleType: 'LEADER' });
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // State for Create/Provision User Account Modal
  const [provisionModal, setProvisionModal] = useState<{
    open: boolean;
    group: Group | null;
    student: Student | null;
    roleType: 'LEADER' | 'DEPUTY';
  }>({ open: false, group: null, student: null, roleType: 'LEADER' });
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('123456');

  // State for Reset Password Modal
  const [resetModal, setResetModal] = useState<{
    open: boolean;
    user: UserProfile | null;
    title: string;
  }>({ open: false, user: null, title: '' });
  const [newPassword, setNewPassword] = useState('123456');

  // Show/hide password states map: key is username or uid
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = async () => {
    const [grpList, stList, userList, txList, cls, allCls] = await Promise.all([
      dbService.getGroups(classId),
      dbService.getStudents(classId),
      dbService.getUsers(),
      dbService.getTransactions(classId),
      dbService.getClassById(classId),
      dbService.getClasses(),
    ]);
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
    setStudents(stList);
    setUsers(userList);
    setTransactions(txList);
    if (cls) setCurrentClass(cls);
    setClasses(allCls);

    const sRanks = rankingService.calculateStudentRankings(stList, txList);
    setGroupRanks(rankingService.calculateGroupRankings(effectiveGroups, sRanks));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('thidua_store_update', handleUpdate);
    return () => window.removeEventListener('thidua_store_update', handleUpdate);
  }, [classId]);

  // Find user profile for a leader/deputy
  const findUserForStudent = (username?: string, uid?: string, groupId?: string, position?: string) => {
    if (username) {
      const u = users.find((x) => x.username.toLowerCase() === username.toLowerCase());
      if (u) return u;
    }
    if (uid) {
      const u = users.find((x) => x.uid === uid);
      if (u) return u;
    }
    if (groupId && position) {
      const u = users.find(
        (x) => x.groupId === groupId && x.role === 'TO_TRUONG' && x.position === position
      );
      if (u) return u;
    }
    return null;
  };

  // Open Assign Modal
  const handleOpenAssignModal = (group: Group, roleType: 'LEADER' | 'DEPUTY') => {
    const currentSelected =
      roleType === 'LEADER'
        ? group.leaderId || ''
        : group.deputyId || '';
    setAssignModal({ open: true, group, roleType });
    setSelectedStudentId(currentSelected);
  };

  // Save Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal.group) return;

    const group = assignModal.group;
    const student = students.find((s) => s.studentId === selectedStudentId);

    const updatedGroup: Group = {
      ...group,
      updatedAt: new Date().toISOString(),
    };

    if (assignModal.roleType === 'LEADER') {
      updatedGroup.leaderId = student?.studentId;
      updatedGroup.leaderName = student?.fullName;
    } else {
      updatedGroup.deputyId = student?.studentId;
      updatedGroup.deputyName = student?.fullName;
    }

    await dbService.saveGroup(updatedGroup);
    await loadData();
    showToast(
      `Đã chỉ định ${student ? student.fullName : 'Chưa chỉ định'} làm ${
        assignModal.roleType === 'LEADER' ? 'Tổ trưởng' : 'Tổ phó'
      } ${group.name}!`,
      'success'
    );
    setAssignModal({ open: false, group: null, roleType: 'LEADER' });
  };

  // Open Provision Account Modal
  const handleOpenProvisionModal = (group: Group, roleType: 'LEADER' | 'DEPUTY') => {
    const studentId = roleType === 'LEADER' ? group.leaderId : group.deputyId;
    const student = students.find((s) => s.studentId === studentId);

    if (!student) {
      showToast(`Vui lòng chỉ định ${roleType === 'LEADER' ? 'Tổ trưởng' : 'Tổ phó'} trước khi cấp tài khoản!`, 'error');
      return;
    }

    const groupNum = group.groupId.replace('group-', '');
    const prefix = roleType === 'LEADER' ? 'totruong' : 'topho';
    const suggestedUsername = `${prefix}${groupNum}`;

    setInputUsername(suggestedUsername);
    setInputPassword('123456');
    setProvisionModal({ open: true, group, student, roleType });
  };

  // Save Provisioned Account
  const handleSaveProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionModal.group || !provisionModal.student) return;

    const group = provisionModal.group;
    const student = provisionModal.student;
    const cleanUsername = inputUsername.trim().toLowerCase();

    if (!cleanUsername) {
      showToast('Vui lòng nhập tên đăng nhập!', 'error');
      return;
    }

    // Check if username already used by another user
    const existing = users.find((u) => u.username.toLowerCase() === cleanUsername);
    const targetUid = existing ? existing.uid : `user-${cleanUsername}-${Date.now().toString().slice(-4)}`;

    const newUser: UserProfile = {
      uid: targetUid,
      username: cleanUsername,
      password: inputPassword.trim() || '123456',
      displayName: `${student.fullName} (${
        provisionModal.roleType === 'LEADER' ? 'Tổ trưởng' : 'Tổ phó'
      } ${group.name})`,
      role: 'TO_TRUONG',
      position: provisionModal.roleType === 'LEADER' ? 'TO_TRUONG' : 'TO_PHO',
      schoolId: 'school-ban-long',
      classId: classId,
      groupId: group.groupId,
      status: 'ACTIVE',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: `${cleanUsername}@thidua.school`,
    };

    await dbService.saveUser(newUser);

    // Update group record
    const updatedGroup: Group = {
      ...group,
      leaderUsername: provisionModal.roleType === 'LEADER' ? cleanUsername : group.leaderUsername,
      deputyUsername: provisionModal.roleType === 'DEPUTY' ? cleanUsername : group.deputyUsername,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveGroup(updatedGroup);

    await loadData();
    showToast(
      `Đã cấp tài khoản "${cleanUsername}" cho ${student.fullName} thành công! Mật khẩu: ${newUser.password}`,
      'success'
    );
    setProvisionModal({ open: false, group: null, student: null, roleType: 'LEADER' });
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: UserProfile, title: string) => {
    setResetModal({ open: true, user, title });
    setNewPassword('123456');
  };

  // Save Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal.user) return;

    const pass = newPassword.trim();
    if (!pass) {
      showToast('Mật khẩu không được để trống!', 'error');
      return;
    }

    await dbService.resetUserPassword(resetModal.user.uid, pass);
    await loadData();
    showToast(`Đã đổi mật khẩu tài khoản "${resetModal.user.username}" thành công!`, 'success');
    setResetModal({ open: false, user: null, title: '' });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}: ${text}`, 'info');
  };

  if (currentUser?.role === 'TO_TRUONG') {
    return <Navigate to="/to-truong/members" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Quản Lý 4 Tổ Lớp {currentClass?.name || '9A1'}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              4 Tổ thi đua &bull; Ban cán sự tổ
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
            Chỉ định Tổ trưởng, Tổ phó cho từng tổ, cấp tài khoản đăng nhập (user/pass thường không cần email) và đổi/reset mật khẩu
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSchoolWideRole && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Lớp:</span>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  sessionStorage.setItem('thidua_selected_class_id', e.target.value);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              >
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    Lớp {cls.name} ({cls.studentCount || 0} HS)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGroupStatsModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition flex items-center gap-2"
            title="Mở bảng thống kê thi đua 4 tổ của lớp"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>📊 Thống Kê Theo Tổ</span>
          </button>
        </div>
      </div>

      {/* 4 Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupRanks.map((grp) => {
          const groupObj = groups.find((g) => g.groupId === grp.groupId || g.name === grp.groupName);
          const members = students.filter((s) => {
            if (s.groupId === grp.groupId) return true;
            if (groupObj && (s.groupId === groupObj.groupId || s.groupName === groupObj.name)) return true;
            if (s.groupName === grp.groupName) return true;
            const numMatch = (grp.groupName || grp.groupId).match(/[1-4]$/);
            if (numMatch) {
              const num = numMatch[0];
              if (s.groupName === `Tổ ${num}` || s.groupId?.endsWith(`-${num}`) || s.groupId === `group-${num}`) return true;
            }
            return false;
          });

          // Find leader user & deputy user
          const leaderUser = groupObj
            ? findUserForStudent(
                groupObj.leaderUsername,
                groupObj.leaderId,
                groupObj.groupId,
                'TO_TRUONG'
              ) || users.find((u) => u.username === `totruong${groupObj.groupId.replace('group-', '')}`)
            : null;

          const deputyUser = groupObj
            ? findUserForStudent(
                groupObj.deputyUsername,
                groupObj.deputyId,
                groupObj.groupId,
                'TO_PHO'
              ) || users.find((u) => u.username === `topho${groupObj.groupId.replace('group-', '')}`)
            : null;

          return (
            <div
              key={grp.groupId}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              {/* Card Top Title & Score */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                      grp.rank === 1
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                        : grp.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : grp.rank === 3
                        ? 'bg-amber-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{grp.rank}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{grp.groupName}</h3>
                    <div className="text-sm text-slate-600 font-medium">
                      Sĩ số: <strong className="text-slate-800">{members.length} học sinh</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-700">
                    {grp.totalPoints > 0 ? `+${grp.totalPoints}` : grp.totalPoints} đ
                  </div>
                  <div className="text-sm text-slate-600 font-medium">TB: {grp.averagePoints} đ/HS</div>
                </div>
              </div>

              {/* SECTION: GROUP LEADER & DEPUTY ASSIGNMENT & ACCOUNTS */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Ban Cán Sự &amp; Tài Khoản Chấm Điểm ({grp.groupName})</span>
                </div>

                {/* 1. TỔ TRƯỞNG */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                        <Crown className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-sm text-slate-600 font-semibold">Tổ trưởng:</div>
                        <div className="font-bold text-slate-900 text-sm">
                          {groupObj?.leaderName || (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => groupObj && handleOpenAssignModal(groupObj, 'LEADER')}
                      className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 font-bold text-xs rounded-lg transition"
                    >
                      {groupObj?.leaderName ? 'Đổi Tổ trưởng' : '+ Chỉ định'}
                    </button>
                  </div>

                  {/* Account credentials */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {leaderUser ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-slate-400 font-medium">User: </span>
                            <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                              {leaderUser.username}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Pass: </span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {revealedPasswords[leaderUser.uid]
                                ? leaderUser.password || '123456'
                                : '••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(leaderUser.uid)}
                              className="ml-1 text-slate-400 hover:text-slate-700"
                              title="Hiện / Ẩn mật khẩu"
                            >
                              {revealedPasswords[leaderUser.uid] ? (
                                <EyeOff className="w-3.5 h-3.5 inline" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 inline" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `User: ${leaderUser.username} | Pass: ${leaderUser.password || '123456'}`,
                                'thông tin tài khoản'
                              )
                            }
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                            title="Sao chép User / Pass"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenResetModal(
                                leaderUser,
                                `Đổi mật khẩu Tổ trưởng ${grp.groupName}`
                              )
                            }
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Đổi Pass
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-slate-400 text-xs italic">Chưa cấp tài khoản đăng nhập</span>
                        <button
                          onClick={() => groupObj && handleOpenProvisionModal(groupObj, 'LEADER')}
                          disabled={!groupObj?.leaderId}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Cấp User &amp; Pass
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. TỔ PHÓ */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                        <Medal className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-sm text-slate-600 font-semibold">Tổ phó:</div>
                        <div className="font-bold text-slate-900 text-sm">
                          {groupObj?.deputyName || (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => groupObj && handleOpenAssignModal(groupObj, 'DEPUTY')}
                      className="px-2.5 py-1 text-sky-600 hover:bg-sky-50 font-bold text-xs rounded-lg transition"
                    >
                      {groupObj?.deputyName ? 'Đổi Tổ phó' : '+ Chỉ định'}
                    </button>
                  </div>

                  {/* Account credentials */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {deputyUser ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-slate-400 font-medium">User: </span>
                            <span className="font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded">
                              {deputyUser.username}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Pass: </span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {revealedPasswords[deputyUser.uid]
                                ? deputyUser.password || '123456'
                                : '••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(deputyUser.uid)}
                              className="ml-1 text-slate-400 hover:text-slate-700"
                              title="Hiện / Ẩn mật khẩu"
                            >
                              {revealedPasswords[deputyUser.uid] ? (
                                <EyeOff className="w-3.5 h-3.5 inline" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 inline" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `User: ${deputyUser.username} | Pass: ${deputyUser.password || '123456'}`,
                                'thông tin tài khoản'
                              )
                            }
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                            title="Sao chép User / Pass"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenResetModal(
                                deputyUser,
                                `Đổi mật khẩu Tổ phó ${grp.groupName}`
                              )
                            }
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Đổi Pass
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-slate-400 text-xs italic">Chưa cấp tài khoản đăng nhập</span>
                        <button
                          onClick={() => groupObj && handleOpenProvisionModal(groupObj, 'DEPUTY')}
                          disabled={!groupObj?.deputyId}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Cấp User &amp; Pass
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="p-5 flex-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Thành viên trong tổ ({members.length} HS)</span>
                  <span>Điểm</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                  {members.map((m, idx) => {
                    const isLeader = groupObj?.leaderName === m.fullName;
                    const isDeputy = groupObj?.deputyName === m.fullName;

                    return (
                      <div
                        key={m.studentId}
                        onClick={() => setSelectedStudentForModal(m)}
                        className="py-2.5 flex items-center justify-between text-xs hover:bg-indigo-50/70 cursor-pointer px-2 rounded-xl transition group"
                        title="Bấm để xem chi tiết thành tích thi đua của học sinh này"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-mono w-4">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                            {m.fullName}
                          </span>
                          {isLeader && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[10px] rounded-md flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Tổ trưởng
                            </span>
                          )}
                          {isDeputy && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-black text-[10px] rounded-md flex items-center gap-1">
                              <Medal className="w-3 h-3" /> Tổ phó
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 text-sm">
                            {(m.totalPoints ?? 0) > 0 ? `+${m.totalPoints}` : m.totalPoints ?? 0} đ
                          </span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUMMARY CARD: ALL CLASS LEADER & DEPUTY PASSWORDS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base md:text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Bảng Tổng Hợp Tài Khoản Ban Cán Sự 4 Tổ
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5 leading-relaxed">
              GVCN có thể in hoặc sao chép nhanh tên đăng nhập và mật khẩu để bàn giao cho các Tổ trưởng, Tổ phó
            </p>
          </div>
          <button
            onClick={() => {
              const text = groups
                .map((g) => {
                  const num = g.groupId.replace('group-', '');
                  return `[${g.name}]\n- Tổ trưởng: ${g.leaderName || 'Chưa có'} (User: totruong${num} | Pass: 123456)\n- Tổ phó: ${g.deputyName || 'Chưa có'} (User: topho${num} | Pass: 123456)`;
                })
                .join('\n\n');
              copyToClipboard(text, 'toàn bộ danh sách tài khoản');
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Copy className="w-4 h-4" /> Sao chép tất cả tài khoản
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3 pl-4">Tổ</th>
                <th className="py-3">Chức vụ</th>
                <th className="py-3">Học sinh đảm nhiệm</th>
                <th className="py-3">Tên đăng nhập (Username)</th>
                <th className="py-3">Mật khẩu</th>
                <th className="py-3 text-right pr-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.flatMap((g) => {
                const num = g.groupId.replace('group-', '');
                const leaderU = users.find((u) => u.username === `totruong${num}`) || findUserForStudent(g.leaderUsername, g.leaderId);
                const deputyU = users.find((u) => u.username === `topho${num}`) || findUserForStudent(g.deputyUsername, g.deputyId);

                return [
                  {
                    groupName: g.name,
                    roleTitle: 'Tổ trưởng',
                    studentName: g.leaderName || 'Chưa chỉ định',
                    user: leaderU,
                    defaultUser: `totruong${num}`,
                  },
                  {
                    groupName: g.name,
                    roleTitle: 'Tổ phó',
                    studentName: g.deputyName || 'Chưa chỉ định',
                    user: deputyU,
                    defaultUser: `topho${num}`,
                  },
                ];
              }).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 pl-4 font-bold text-slate-900">{item.groupName}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.roleTitle === 'Tổ trưởng'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {item.roleTitle}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">{item.studentName}</td>
                  <td className="py-3 font-mono font-bold text-indigo-700">
                    {item.user ? item.user.username : item.defaultUser}
                  </td>
                  <td className="py-3 font-mono text-slate-600">
                    {item.user ? item.user.password || '123456' : '123456'}
                  </td>
                  <td className="py-3 text-right pr-4">
                    {item.user ? (
                      <button
                        onClick={() =>
                          handleOpenResetModal(
                            item.user!,
                            `Đổi mật khẩu ${item.roleTitle} ${item.groupName}`
                          )
                        }
                        className="px-2.5 py-1 text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-lg transition"
                      >
                        Đổi Pass
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Sẵn sàng</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ASSIGN LEADER / DEPUTY */}
      {assignModal.open && assignModal.group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Chỉ Định {assignModal.roleType === 'LEADER' ? 'Tổ Trưởng' : 'Tổ Phó'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {assignModal.group.name} &bull; Lớp {currentClass?.name || '9A1'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModal({ open: false, group: null, roleType: 'LEADER' })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn học sinh trong {assignModal.group.name}:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">-- Chưa chỉ định (Để trống) --</option>
                  {students
                    .filter((s) => s.groupId === assignModal.group?.groupId)
                    .map((st) => (
                      <option key={st.studentId} value={st.studentId}>
                        {st.fullName} ({st.studentCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <Info className="w-4 h-4 inline mr-1 text-amber-600" />
                Sau khi chỉ định, học sinh này sẽ chịu trách nhiệm chấm điểm nề nếp thi đua cho các bạn trong tổ.
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, group: null, roleType: 'LEADER' })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Xác nhận chỉ định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROVISION USER ACCOUNT (NO EMAIL NEEDED) */}
      {provisionModal.open && provisionModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Cấp Tài Khoản Đăng Nhập</h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Cho {provisionModal.student.fullName} ({provisionModal.roleType === 'LEADER' ? 'Tổ trưởng' : 'Tổ phó'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProvisionModal({ open: false, group: null, student: null, roleType: 'LEADER' })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProvision} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ví dụ: totruong1 hoặc topho1"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Học sinh dùng tên này để đăng nhập, KHÔNG CẦN NHẬP EMAIL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu ban đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ví dụ: 123456"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                Tài khoản này được cấp quyền chấm điểm tổ thi đua. GVCN có thể đổi hoặc reset mật khẩu bất kỳ lúc nào nếu học sinh quên.
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProvisionModal({ open: false, group: null, student: null, roleType: 'LEADER' })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Cấp tài khoản ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {resetModal.open && resetModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Đổi / Reset Mật Khẩu</h3>
                  <p className="text-sm text-slate-600 font-medium">{resetModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setResetModal({ open: false, user: null, title: '' })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">Tài khoản:</div>
                <div className="font-bold text-slate-900 text-sm">{resetModal.user.displayName}</div>
                <div className="font-mono text-indigo-700 font-bold mt-0.5">Username: {resetModal.user.username}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu mới:</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword('123456')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    Mặc định (123456)
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, user: null, title: '' })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        transactions={transactions}
        isOpen={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
      />

      {/* Group Statistics Modal */}
      <GroupStatisticsModal
        isOpen={showGroupStatsModal}
        onClose={() => setShowGroupStatsModal(false)}
        classId={classId}
        className={currentClass?.name || '9A1'}
      />
    </div>
  );
};
