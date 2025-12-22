import * as XLSX from 'xlsx';
import { Student } from '../types';

export const readExcelFile = (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      resolve(workbook);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[][] => {
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
};

export const parseStudents = (data: any[][], mapping: { nameIdx: number; idIdx: number; gradeIdx: number; classIdx: number }): Student[] => {
  const students: Student[] = [];
  // Start from 1 to skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[mapping.nameIdx]) {
      students.push({
        name: String(row[mapping.nameIdx]).trim(),
        studentId: mapping.idIdx !== -1 ? String(row[mapping.idIdx] || '') : '',
        grade: mapping.gradeIdx !== -1 ? String(row[mapping.gradeIdx] || '') : '',
        class: mapping.classIdx !== -1 ? String(row[mapping.classIdx] || '') : '',
      });
    }
  }
  // Sort alphabetically by Arabic name
  return students.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
};
