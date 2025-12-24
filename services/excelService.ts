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

export const parseStudents = (data: any[][], mapping: { nameIdx: number; idIdx: number; gradeIdx: number; classIdx: number; phoneIdx?: number }, headerRowIndex: number = 0): Student[] => {
  const students: Student[] = [];
  
  // Start from headerRowIndex + 1 to skip the header row itself
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    // Ensure row exists and has the name column
    if (row && row[mapping.nameIdx] !== undefined && row[mapping.nameIdx] !== null) {
      const name = String(row[mapping.nameIdx]).trim();
      // Skip empty names or lines that might be page footers
      if (name.length < 2) continue;

      students.push({
        name: name,
        studentId: mapping.idIdx !== -1 ? String(row[mapping.idIdx] || '') : '',
        grade: mapping.gradeIdx !== -1 ? String(row[mapping.gradeIdx] || '').trim() : '',
        class: mapping.classIdx !== -1 ? String(row[mapping.classIdx] || '').trim() : '',
        phone: (mapping.phoneIdx !== undefined && mapping.phoneIdx !== -1) ? String(row[mapping.phoneIdx] || '').trim() : '',
      });
    }
  }
  
  // Strict Alphabetical Sort by Name (Arabic)
  return students.sort((a, b) => {
    return a.name.localeCompare(b.name, 'ar');
  });
};

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  
  // Adjust column width slightly for better readability
  const wscols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};