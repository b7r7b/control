
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
  managerName?: string;
  agentName?: string;
}

// --- Schedule Types ---
export interface PeriodAssignment {
  periodId: number;
  main: string[]; // Teacher names assigned to rooms (index matches committee index)
  reserves: string[]; // Teacher names in reserve
}

export interface DaySchedule {
  dayId: number;
  date: string;
  periods: PeriodAssignment[];
}

export interface ExamSchedule {
  days: DaySchedule[];
  teachersPerCommittee: number;
}

export interface Teacher {
  name: string;
  phone: string;
}

export interface AppData {
  school: SchoolData;
  stages: Stage[];
  committees: Committee[];
  teachers: Teacher[]; // Updated from string[] to Teacher[]
  schedule?: ExamSchedule; 
}

export interface PrintSettings {
  adminName: string;
  schoolName: string;
  
  // New Fields for Signatures
  managerName: string;
  agentName: string;

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
  TEACHERS = 4, // New Step
  PRINT = 5
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
