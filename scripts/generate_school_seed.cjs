const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelPath = path.resolve(__dirname, '../học sinh toàn trường.xls');
if (!fs.existsSync(excelPath)) {
  console.error('File not found:', excelPath);
  process.exit(1);
}

const wb = xlsx.readFile(excelPath);

const classConfigs = [
  { sheet: '6.1', classId: 'class-6a1', grade: 6, name: '6.1', teacher: 'Nguyễn Thị Thanh Mai', gvcnUsername: 'gvcn6a1', genderPrefix: 'Cô' },
  { sheet: '6.2', classId: 'class-6a2', grade: 6, name: '6.2', teacher: 'Nguyễn Thị Huyên', gvcnUsername: 'gvcn6a2', genderPrefix: 'Cô' },
  { sheet: '7.1', classId: 'class-7a1', grade: 7, name: '7.1', teacher: 'Nguyễn Thị Hồng Hoa', gvcnUsername: 'gvcn7a1', genderPrefix: 'Cô' },
  { sheet: '7.2', classId: 'class-7a2', grade: 7, name: '7.2', teacher: 'Phạm Thị Ngọc Diệp', gvcnUsername: 'gvcn7a2', genderPrefix: 'Cô' },
  { sheet: '8.1', classId: 'class-8a1', grade: 8, name: '8.1', teacher: 'Thái Thị Thùy Linh', gvcnUsername: 'gvcn8a1', genderPrefix: 'Cô' },
  { sheet: '8.2', classId: 'class-8a2', grade: 8, name: '8.2', teacher: 'Nguyễn Thị Kính', gvcnUsername: 'gvcn8a2', genderPrefix: 'Cô' },
  { sheet: '9.1', classId: 'class-9a1', grade: 9, name: '9.1', teacher: 'Võ Thị Mỹ Tiên', gvcnUsername: 'gvcn9a1', genderPrefix: 'Cô' },
  { sheet: '9.2', classId: 'class-9a2', grade: 9, name: '9.2', teacher: 'Nguyễn Thị Ánh Diệu', gvcnUsername: 'gvcn9a2', genderPrefix: 'Cô' },
  { sheet: '9.3', classId: 'class-9a3', grade: 9, name: '9.3', teacher: 'Phan Thị Non', gvcnUsername: 'gvcn9a3', genderPrefix: 'Cô' },
];

const schoolId = 'school-ban-long';
const schoolYearId = 'year-2026-2027';

const samplePlusReasons = [
  { critId: 'crit-plus-3', name: 'Phát biểu xây dựng bài', pts: 2, reason: 'Tích cực phát biểu đóng góp xây dựng bài' },
  { critId: 'crit-plus-4', name: 'Đạt điểm 9, 10 trong giờ học', pts: 5, reason: 'Đạt điểm kiểm tra miệng 10 điểm' },
  { critId: 'crit-plus-1', name: 'Đi học đầy đủ', pts: 2, reason: 'Chuyên cần trong tuần không nghỉ buổi nào' },
  { critId: 'crit-plus-6', name: 'Trực nhật sạch sẽ, tham gia lao động', pts: 3, reason: 'Trực nhật lớp và vệ sinh khu vực sạch sẽ' },
  { critId: 'crit-plus-5', name: 'Giúp đỡ bạn cùng tiến', pts: 5, reason: 'Nhiệt tình hướng dẫn bạn học tập tiến bộ' },
  { critId: 'crit-plus-2', name: 'Đi học đúng giờ', pts: 1, reason: 'Đi học đúng giờ suốt tuần' },
  { critId: 'crit-plus-3', name: 'Phát biểu xây dựng bài', pts: 2, reason: 'Giải bài tập khó trên bảng chính xác' },
];

const sampleMinusReasons = [
  { critId: 'crit-minus-4', name: 'Nói chuyện riêng / mất trật tự', pts: 2, reason: 'Nói chuyện riêng trong giờ học' },
  { critId: 'crit-minus-5', name: 'Không mặc đồng phục / quên khăn quàng', pts: 2, reason: 'Quên đeo khăn quàng đỏ' },
  { critId: 'crit-minus-3', name: 'Không thuộc bài / không làm bài tập', pts: 3, reason: 'Chưa chuẩn bị bài tập về nhà' },
  { critId: 'crit-minus-1', name: 'Đi học muộn', pts: 2, reason: 'Đi học trễ 10 phút' },
  { critId: 'crit-minus-6', name: 'Xả rác bừa bãi', pts: 3, reason: 'Để rác dưới hộc bàn' },
];

const sampleDates = [
  { date: '2026-09-03', weekId: '2026-W36' },
  { date: '2026-09-05', weekId: '2026-W36' },
  { date: '2026-09-09', weekId: '2026-W37' },
  { date: '2026-09-11', weekId: '2026-W37' },
  { date: '2026-09-12', weekId: '2026-W37' },
  { date: '2026-09-16', weekId: '2026-W38' },
  { date: '2026-09-18', weekId: '2026-W38' },
  { date: '2026-09-22', weekId: '2026-W39' },
  { date: '2026-09-24', weekId: '2026-W39' },
  { date: '2026-09-25', weekId: '2026-W39' },
];

// Helper pseudo random based on seed
function createRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const allClasses = [];
const allGroups = [];
const allStudents = [];
const allTransactions = [];
const allUsers = [
  {
    uid: 'user-admin',
    username: 'admin',
    password: 'password',
    displayName: 'Quản Trị Viên (Admin)',
    role: 'ADMIN',
    schoolId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: 'admin@thidua.school',
  },
  {
    uid: 'user-hieutruong',
    username: 'hieutruong',
    password: 'password',
    displayName: 'Thầy Nguyễn Văn Nam (Hiệu Trưởng)',
    role: 'HIEU_TRUONG',
    schoolId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: 'hieutruong@thidua.school',
  },
  {
    uid: 'user-phohieutruong',
    username: 'phohieutruong',
    password: 'password',
    displayName: 'Cô Trần Thị Lan (Phó Hiệu Trưởng)',
    role: 'PHO_HIEU_TRUONG',
    schoolId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: 'phohieutruong@thidua.school',
  },
  {
    uid: 'user-giamthi',
    username: 'giamthi',
    password: 'password',
    displayName: 'Thầy Đỗ Minh Tuấn (Giám Thị)',
    role: 'GIAM_THI',
    schoolId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: 'giamthi@thidua.school',
  },
  {
    uid: 'user-tongphutrach',
    username: 'tongphutrach',
    password: 'password',
    displayName: 'Thầy Hoàng Văn Hải (Tổng Phụ Trách)',
    role: 'TONG_PHU_TRACH',
    schoolId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: 'tongphutrach@thidua.school',
  },
];

let txCounter = 1;

for (const cfg of classConfigs) {
  const sheet = wb.Sheets[cfg.sheet];
  if (!sheet) {
    console.error('Sheet not found:', cfg.sheet);
    continue;
  }
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const rawRows = json.slice(8).filter((r) => r && r[0] && !isNaN(Number(r[0])));

  const classStudents = [];
  const totalInClass = rawRows.length;
  const perGroup = Math.ceil(totalInClass / 4);

  // Teacher user
  const teacherUid = `user-${cfg.gvcnUsername}`;
  allUsers.push({
    uid: teacherUid,
    username: cfg.gvcnUsername,
    password: 'password',
    displayName: `${cfg.genderPrefix} ${cfg.teacher} (GVCN ${cfg.name})`,
    role: 'GVCN',
    schoolId,
    classId: cfg.classId,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    email: `${cfg.gvcnUsername}@thidua.school`,
  });

  // Also support alias username without 'a' e.g. gvcn61 -> same login
  const aliasUsername = cfg.gvcnUsername.replace('a', '');
  if (aliasUsername !== cfg.gvcnUsername) {
    allUsers.push({
      uid: `${teacherUid}-alias`,
      username: aliasUsername,
      password: 'password',
      displayName: `${cfg.genderPrefix} ${cfg.teacher} (GVCN ${cfg.name})`,
      role: 'GVCN',
      schoolId,
      classId: cfg.classId,
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      email: `${aliasUsername}@thidua.school`,
    });
  }

  // Create 4 groups
  const classGroups = [];
  for (let num = 1; num <= 4; num++) {
    const groupId = `group-${cfg.classId}-${num}`;
    classGroups.push({
      groupId,
      classId: cfg.classId,
      name: `Tổ ${num}`,
      leaderId: `user-totruong-${cfg.classId}-${num}`,
      leaderName: '',
      memberCount: 0,
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
  }

  // Read students
  rawRows.forEach((r, idx) => {
    const stt = Number(r[0]);
    const groupNum = Math.min(4, Math.floor(idx / perGroup) + 1);
    const grp = classGroups[groupNum - 1];
    grp.memberCount++;

    const studentCode = String(r[2] || `${cfg.name.replace('.', '')}-${stt}`);
    const fullName = String(r[6] || '').trim();
    let dob = String(r[7] || '').trim();
    if (dob.includes('/')) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    const rawGender = String(r[9] || '').toLowerCase();
    const gender = rawGender.includes('nữ') || rawGender.includes('nu') ? 'NU' : 'NAM';

    const groupStudentIdx = classStudents.filter((s) => s.groupId === grp.groupId).length;
    let groupRole = 'MEMBER';
    if (groupStudentIdx === 0) {
      groupRole = 'LEADER';
      grp.leaderName = fullName;
    } else if (groupStudentIdx === 1) {
      groupRole = 'DEPUTY';
    }

    const studentId = `student-${cfg.classId}-${stt}`;
    const student = {
      studentId,
      schoolId,
      classId: cfg.classId,
      schoolYearId,
      studentCode,
      fullName,
      gender,
      dateOfBirth: dob || '2014-01-01',
      groupId: grp.groupId,
      groupName: grp.name,
      groupRole,
      status: 'ACTIVE',
      totalPoints: 0,
      plusPoints: 0,
      minusPoints: 0,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-24T00:00:00.000Z',
    };

    classStudents.push(student);
  });

  // Create user profiles for Tổ trưởng
  classGroups.forEach((grp, gIdx) => {
    const leaderStudent = classStudents.find((s) => s.groupId === grp.groupId && s.groupRole === 'LEADER');
    if (leaderStudent) {
      const num = gIdx + 1;
      const cleanClassCode = cfg.name.replace('.', '').toLowerCase();
      allUsers.push({
        uid: grp.leaderId,
        username: `totruong_${cleanClassCode}_to${num}`,
        password: 'password',
        displayName: `${leaderStudent.fullName} (Tổ trưởng Tổ ${num} - Lớp ${cfg.name})`,
        role: 'TO_TRUONG',
        schoolId,
        classId: cfg.classId,
        groupId: grp.groupId,
        position: 'LEADER',
        status: 'ACTIVE',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        email: `totruong.${cleanClassCode}.to${num}@thidua.school`,
      });
    }
  });

  // Generate mock points (điểm ma) and transactions for each student
  const rand = createRandom(cfg.grade * 100 + Number(cfg.name.split('.')[1] || 1) * 31);

  classStudents.forEach((st, sIdx) => {
    // 3 to 7 plus transactions
    const numPlus = 3 + Math.floor(rand() * 5); // 3 to 7
    let sPlus = 0;
    let sMinus = 0;

    for (let p = 0; p < numPlus; p++) {
      const sampleItem = samplePlusReasons[Math.floor(rand() * samplePlusReasons.length)];
      const sampleDate = sampleDates[Math.floor(rand() * sampleDates.length)];
      const tx = {
        transactionId: `tx-${cfg.classId}-${txCounter++}`,
        schoolId,
        schoolYearId,
        classId: cfg.classId,
        studentId: st.studentId,
        groupId: st.groupId,
        criterionId: sampleItem.critId,
        criterionName: sampleItem.name,
        type: 'PLUS',
        points: sampleItem.pts,
        reason: sampleItem.reason,
        date: sampleDate.date,
        weekId: sampleDate.weekId,
        monthId: '2026-09',
        createdBy: teacherUid,
        createdByName: `${cfg.genderPrefix} ${cfg.teacher}`,
        createdByRole: 'GVCN',
        createdAt: `${sampleDate.date}T08:${String(10 + Math.floor(rand() * 40)).padStart(2, '0')}:00.000Z`,
        status: 'APPROVED',
      };
      allTransactions.push(tx);
      sPlus += sampleItem.pts;
    }

    // ~35% of students get 1 to 2 minus transactions
    if (rand() < 0.4) {
      const numMinus = 1 + (rand() < 0.3 ? 1 : 0);
      for (let m = 0; m < numMinus; m++) {
        const sampleItem = sampleMinusReasons[Math.floor(rand() * sampleMinusReasons.length)];
        const sampleDate = sampleDates[Math.floor(rand() * sampleDates.length)];
        const tx = {
          transactionId: `tx-${cfg.classId}-${txCounter++}`,
          schoolId,
          schoolYearId,
          classId: cfg.classId,
          studentId: st.studentId,
          groupId: st.groupId,
          criterionId: sampleItem.critId,
          criterionName: sampleItem.name,
          type: 'MINUS',
          points: sampleItem.pts,
          reason: sampleItem.reason,
          date: sampleDate.date,
          weekId: sampleDate.weekId,
          monthId: '2026-09',
          createdBy: teacherUid,
          createdByName: `${cfg.genderPrefix} ${cfg.teacher}`,
          createdByRole: 'GVCN',
          createdAt: `${sampleDate.date}T09:${String(10 + Math.floor(rand() * 40)).padStart(2, '0')}:00.000Z`,
          status: 'APPROVED',
        };
        allTransactions.push(tx);
        sMinus += sampleItem.pts;
      }
    }

    st.plusPoints = sPlus;
    st.minusPoints = sMinus;
    st.totalPoints = sPlus - sMinus;
  });

  const classTotalPoints = classStudents.reduce((sum, s) => sum + (s.totalPoints || 0), 0);

  allClasses.push({
    classId: cfg.classId,
    schoolId,
    schoolYearId,
    grade: cfg.grade,
    name: cfg.name,
    homeroomTeacherId: teacherUid,
    homeroomTeacherName: `${cfg.genderPrefix} ${cfg.teacher}`,
    status: 'ACTIVE',
    studentCount: classStudents.length,
    totalPoints: classTotalPoints,
    groupCount: 4,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-26T00:00:00.000Z',
  });

  allGroups.push(...classGroups);
  allStudents.push(...classStudents);
}

// Generate Public Shares
const allPublicShares = allClasses.map((cls) => {
  const token = `share-${cls.name.replace('.', '-')}-official`;
  return {
    shareId: `pshare-${cls.classId}`,
    classId: cls.classId,
    schoolId,
    schoolYearId,
    token,
    shareToken: token,
    title: `Bảng Thi Đua Lớp ${cls.name} - Năm Học 2026–2027`,
    isActive: true,
    allowAnonymousView: true,
    showRankings: true,
    showGroupDetails: true,
    showStudentNames: true,
    showTransactions: true,
    showClassRank: true,
    showGroupRank: true,
    showPoints: true,
    showPlusMinus: true,
    showHistory: true,
    nameDisplayFormat: 'FULL',
    showWeekly: true,
    showMonthly: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-26T00:00:00.000Z',
  };
});

console.log('Generated:');
console.log('- Classes:', allClasses.length);
console.log('- Groups:', allGroups.length);
console.log('- Students:', allStudents.length);
console.log('- Users:', allUsers.length);
console.log('- Transactions:', allTransactions.length);

// Write to a json or export module file
const outputData = {
  allClasses,
  allGroups,
  allStudents,
  allUsers,
  allTransactions,
  allPublicShares,
};

fs.writeFileSync(path.resolve(__dirname, '../src/services/generatedSchoolData.json'), JSON.stringify(outputData, null, 2), 'utf8');
console.log('Saved generatedSchoolData.json successfully!');
