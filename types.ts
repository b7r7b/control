
export interface Student {
  name: string;
  studentId: string;
  grade: string;
  class: string;
}

export interface Stage {
  id: number;
  name: string;
  prefix: string;
  students: Student[];
  total: number;
}

export interface Committee {
  id: number; // Unique ID (timestamp or auto-inc)
  name: string; // Display name (e.g., "1")
  location: string;
  counts: Record<number, number>; // Maps Stage ID to count
}

export interface SchoolData {
  name: string;
  year: string;
  term: string;
}

export interface AppData {
  school: SchoolData;
  stages: Stage[];
  committees: Committee[];
  teachers: string[]; // New: List of teachers
}

export interface PrintSettings {
  adminName: string; // e.g., الإدارة العامة للتعليم بمحافظة جدة
  schoolName: string; // Override school name
  logoUrl: string;
  doorLabelTitle: string;
  attendanceTitle: string;
  stickerTitle: string;
  showBorder: boolean;
  
  // Column Header Text
  colSequence: string;
  colSeatId: string;
  colName: string;
  colStage: string;
  colPresence: string;
  colSignature: string;

  // Column Visibility Flags
  showColSequence: boolean;
  showColSeatId: boolean;
  showColName: boolean;
  showColStage: boolean;
  showColPresence: boolean;
  showColSignature: boolean;
}

export interface ColumnMapping {
  nameIdx: number;
  idIdx: number;
  gradeIdx: number;
  classIdx: number;
}

export enum AppStep {
  DATA = 1,
  IMPORT = 2,
  DISTRIBUTE = 3,
  PRINT = 4
}

// --- New Types for Dynamic Reporting ---

export interface ReportField {
  key: string;
  label: string;
  visible: boolean;
  type?: 'text' | 'boolean';
}

export interface DynamicReportConfig {
  id: string;
  title: string;
  fields: ReportField[];
}
