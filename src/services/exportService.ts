import * as XLSX from 'xlsx';
import { Student, StudentRankItem, GroupRankItem, WeeklySummary } from '../types';

export interface StudentImportRow {
  stt?: number;
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  groupName?: string;
  isValid: boolean;
  errors: string[];
}

export const exportService = {
  /**
   * Export student roster to Excel
   */
  exportStudentsToExcel(students: Student[], className = 'Lop'): void {
    const data = students.map((s, idx) => ({
      'STT': idx + 1,
      'Mã học sinh': s.studentCode,
      'Họ và tên': s.fullName,
      'Giới tính': s.gender === 'NAM' ? 'Nam' : 'Nữ',
      'Ngày sinh': s.dateOfBirth || '',
      'Tổ': s.groupName || s.groupId,
      'Điểm thi đua': s.totalPoints || 0,
      'Điểm cộng': s.plusPoints || 0,
      'Điểm trừ': s.minusPoints || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
    XLSX.writeFile(wb, `Danh_sach_hoc_sinh_${className}.xlsx`);
  },

  /**
   * Export weekly summary rankings to Excel
   */
  exportWeeklyRankingsToExcel(
    summary: WeeklySummary,
    className: string
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Student rankings sheet
    const studentData = summary.studentRankings.map((s) => ({
      'Hạng': s.rank,
      'Mã HS': s.studentCode,
      'Họ và tên': s.fullName,
      'Tổ': s.groupName,
      'Tổng điểm': s.totalPoints,
      'Điểm cộng': s.plusPoints,
      'Số lần cộng': s.plusCount,
      'Điểm trừ': s.minusPoints,
      'Số lần trừ': s.minusCount,
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Xếp hạng cá nhân');

    // 2. Group rankings sheet
    const groupData = summary.groupRankings.map((g) => ({
      'Hạng': g.rank,
      'Tên tổ': g.groupName,
      'Sĩ số': g.memberCount,
      'Tổng điểm': g.totalPoints,
      'Điểm TB/HS': g.averagePoints,
      'Điểm cộng': g.plusPoints,
      'Điểm trừ': g.minusPoints,
    }));
    const wsGroups = XLSX.utils.json_to_sheet(groupData);
    XLSX.utils.book_append_sheet(wb, wsGroups, 'Xếp hạng tổ');

    XLSX.writeFile(wb, `Tong_ket_thi_dua_Tuan_${summary.weekNumber}_${className}.xlsx`);
  },

  /**
   * Download a blank student import template (.xlsx)
   */
  downloadStudentTemplate(): void {
    const templateData = [
      {
        'STT': 1,
        'Mã học sinh': '9A1-01',
        'Họ và tên': 'Nguyễn Văn An',
        'Giới tính': 'Nam',
        'Ngày sinh': '2012-05-15',
        'Tổ': 'Tổ 1',
      },
      {
        'STT': 2,
        'Mã học sinh': '9A1-02',
        'Họ và tên': 'Trần Thị Bình',
        'Giới tính': 'Nữ',
        'Ngày sinh': '2012-08-20',
        'Tổ': 'Tổ 2',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Hoc_Sinh');
    XLSX.writeFile(wb, 'Mau_nhap_hoc_sinh.xlsx');
  },

  /**
   * Parse uploaded Excel file and validate row by row
   */
  async parseAndValidateExcel(file: File): Promise<StudentImportRow[]> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(ws);

    return rawRows.map((row, index) => {
      const errors: string[] = [];
      const fullName = (row['Họ và tên'] || row['ho_ten'] || row['FullName'] || '').toString().trim();
      const studentCode = (row['Mã học sinh'] || row['ma_hs'] || row['StudentCode'] || '').toString().trim();
      const rawGender = (row['Giới tính'] || row['gioi_tinh'] || row['Gender'] || '').toString().trim();
      const dateOfBirth = (row['Ngày sinh'] || row['ngay_sinh'] || '').toString().trim();
      const groupName = (row['Tổ'] || row['to'] || '').toString().trim();

      if (!fullName) errors.push('Thiếu họ và tên');
      if (!studentCode) errors.push('Thiếu mã học sinh');

      let gender = 'NAM';
      if (rawGender.toLowerCase().includes('nữ') || rawGender.toLowerCase() === 'nu' || rawGender.toLowerCase() === 'f') {
        gender = 'NU';
      }

      return {
        stt: index + 1,
        studentCode,
        fullName,
        gender,
        dateOfBirth,
        groupName: groupName || 'Tổ 1',
        isValid: errors.length === 0,
        errors,
      };
    });
  },

  /**
   * Trigger print dialog for the current view
   */
  printReport(): void {
    window.print();
  },
};
