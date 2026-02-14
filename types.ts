// تعريف هيكل الطالب
export interface Student {
  name: string;
  studentId: string;
  grade: string;
  class: string;
  phone?: string;
}

// تعريف المرحلة الدراسية (مثل: أول ثانوي)
export interface Stage {
  id: number;
  name: string;
  prefix: string;
  students: Student[];
  total: number;
}

// تعريف اللجنة
export interface Committee {
  id: number;
  name: string;
  location: string;
  counts: Record<number, number>; // توزيع الطلاب حسب معرف المرحلة
  invigilatorCount?: number; // عدد الملاحظين المطلوب
}

// تعريف بيانات المدرسة
export interface SchoolData {
  name: string;
  year: string;
  term: string;
  managerName?: string;
  agentName?: string;
}

// --- أنواع الجدول الجديد (المطور) ---

// تفاصيل المادة (الاسم والوقت المستقل)
export interface SubjectDetail {
  name: string;
  startTime: string;
  endTime: string;
}

export interface PeriodAssignment {
  periodId: number;
  main: string[]; // أسماء الملاحظين الأساسيين
  reserves: string[]; // أسماء ملاحظي الاحتياط
  // سجل يربط اسم المرحلة بتفاصيل المادة (الاسم، البداية، النهاية)
  subjects?: Record<string, SubjectDetail>; 
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

// البيانات الرئيسية للتطبيق
export interface AppData {
  school: SchoolData;
  stages: Stage[];
  committees: Committee[];
  teachers: Teacher[];
  schedule?: ExamSchedule; 
}

// إعدادات الطباعة
export interface PrintSettings {
  adminName: string;
  schoolName: string;
  managerName: string;
  agentName: string;
  logoUrl: string;
  doorLabelTitle: string;
  attendanceTitle: string;
  stickerTitle: string;
  showBorder: boolean;
  
  // عناوين الأعمدة
  colSequence: string;
  colSeatId: string;
  colName: string;
  colStage: string;
  colPresence: string;
  colSignature: string;

  // إخفاء/إظهار الأعمدة
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
  TEACHERS = 4,
  PRINT = 5
}
