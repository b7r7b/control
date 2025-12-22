import React, { useState, useEffect } from 'react';
import { AppData, PrintSettings, DynamicReportConfig } from '../types';
import { 
  printDoorLabels, 
  printAttendance, 
  printSeatLabels,
  // New Services
  printStudentCountsReport,
  printInvigilatorAttendance,
  printAbsenceRecord,
  printQuestionEnvelopeOpening,
  printQuestionEnvelope,
  printAnswerEnvelope,
  printAnswerPaperReceipt,
  printExamPaperTracking
} from '../services/printService';
import { Printer, Settings, FileText, Square, ChevronDown, ChevronUp, TableProperties, Image as ImageIcon, Eye, EyeOff, FileCheck, ClipboardList, FolderOpen, UserX, PenTool, MailOpen, Users, Edit3, X, Check, FileStack, BookOpen } from 'lucide-react';

interface PrintCenterProps {
  data: AppData;
}

const PrintCenter: React.FC<PrintCenterProps> = ({ data }) => {
  const [settings, setSettings] = useState<PrintSettings>({
    adminName: 'الإدارة العامة للتعليم بمحافظة جدة',
    schoolName: data.school.name || '',
    logoUrl: 'https://salogos.org/wp-content/uploads/2021/11/UntiTtled-1.png',
    doorLabelTitle: 'بطاقة تعريف لجنة اختبار',
    attendanceTitle: 'كشف تحضير الطلاب',
    stickerTitle: 'ملصق طاولة',
    showBorder: true,
    colSequence: 'م',
    colSeatId: 'رقم الجلوس',
    colName: 'اسم الطالب',
    colStage: 'المرحلة',
    colPresence: 'حضور',
    colSignature: 'التوقيع',
    showColSequence: true,
    showColSeatId: true,
    showColName: true,
    showColStage: true,
    showColPresence: true,
    showColSignature: true,
  });

  const [activeReport, setActiveReport] = useState<DynamicReportConfig | null>(null);
  
  // Temporary state to hold teacher assignments for the print session
  // Key: Committee ID (or index), Value: Teacher Name
  const [invigilatorAssignments, setInvigilatorAssignments] = useState<Record<string, string>>({});

  // Sync school name if data changes
  useEffect(() => {
    if (data.school.name) {
        setSettings(prev => ({ ...prev, schoolName: data.school.name }));
    }
  }, [data.school.name]);

  const handleSettingChange = (field: keyof PrintSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = "w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none";

  // --- Dynamic Report Configuration Handlers ---

  const openReportConfig = (reportId: string, defaultTitle: string, defaultFields: {key: string, label: string}[]) => {
    setActiveReport({
      id: reportId,
      title: defaultTitle,
      fields: defaultFields.map(f => ({ ...f, visible: true }))
    });
    // Reset Assignments when opening new report
    if (reportId === 'invigilator_attendance') {
        setInvigilatorAssignments({});
    }
  };

  const toggleFieldVisibility = (key: string) => {
    if (!activeReport) return;
    setActiveReport({
      ...activeReport,
      fields: activeReport.fields.map(f => f.key === key ? { ...f, visible: !f.visible } : f)
    });
  };

  const updateFieldLabel = (key: string, newLabel: string) => {
    if (!activeReport) return;
    setActiveReport({
      ...activeReport,
      fields: activeReport.fields.map(f => f.key === key ? { ...f, label: newLabel } : f)
    });
  };
  
  const handleInvigilatorAssignment = (committeeName: string, teacherName: string) => {
      setInvigilatorAssignments(prev => ({...prev, [committeeName]: teacherName}));
  };

  const handlePrintActiveReport = () => {
    if (!activeReport) return;
    
    // Dispatch to specific print function based on ID
    switch (activeReport.id) {
      case 'student_counts':
        printStudentCountsReport(data, settings, activeReport);
        break;
      case 'invigilator_attendance':
        printInvigilatorAttendance(data, settings, activeReport, invigilatorAssignments);
        break;
      case 'absence_record':
        printAbsenceRecord(data, settings, activeReport);
        break;
      case 'question_envelope_opening':
        printQuestionEnvelopeOpening(data, settings, activeReport);
        break;
      case 'question_envelope':
        printQuestionEnvelope(data, settings, activeReport);
        break;
      case 'answer_envelope':
        printAnswerEnvelope(data, settings, activeReport);
        break;
      case 'answer_paper_receipt':
        printAnswerPaperReceipt(data, settings, activeReport);
        break;
      case 'exam_paper_tracking':
        printExamPaperTracking(data, settings, activeReport);
        break;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Configuration Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                تخصيص النموذج
              </h3>
              <button onClick={() => setActiveReport(null)} className="text-gray-400 hover:text-red-500 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التقرير</label>
                <input 
                  type="text" 
                  value={activeReport.title}
                  onChange={(e) => setActiveReport({...activeReport, title: e.target.value})}
                  className={inputClass}
                />
              </div>

              {/* Special Section: Teacher Assignment for Invigilator Report */}
              {activeReport.id === 'invigilator_attendance' && (
                  <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                      <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" /> توزيع المعلمين على اللجان
                      </h4>
                      <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                        {data.committees.length > 0 ? data.committees.map((committee, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                                <span className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold w-24 text-center">لجنة {committee.name}</span>
                                <select 
                                    className="flex-1 rounded-lg border-gray-300 text-sm py-2"
                                    value={invigilatorAssignments[committee.name] || ''}
                                    onChange={(e) => handleInvigilatorAssignment(committee.name, e.target.value)}
                                >
                                    <option value="">-- اختر المعلم --</option>
                                    {data.teachers && data.teachers.map((t, tIdx) => (
                                        <option key={tIdx} value={t}>{t}</option>
                                    ))}
                                </select>
                             </div>
                        )) : (
                            <div className="text-center text-xs text-gray-400">لا توجد لجان مضافة.</div>
                        )}
                      </div>
                      {data.teachers.length === 0 && (
                          <div className="mt-2 text-xs text-red-500">ملاحظة: لا يوجد معلمين في النظام. أضف معلمين في الخطوة الأولى لتظهر القائمة.</div>
                      )}
                  </div>
              )}

              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <TableProperties className="w-4 h-4" /> الأعمدة والحقول
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeReport.fields.map((field) => (
                    <div key={field.key} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${field.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                      <button 
                        onClick={() => toggleFieldVisibility(field.key)}
                        className={`p-1.5 rounded-md transition-colors ${field.visible ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}
                        title={field.visible ? 'إخفاء' : 'إظهار'}
                      >
                        {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <input 
                        type="text" 
                        value={field.label}
                        onChange={(e) => updateFieldLabel(field.key, e.target.value)}
                        disabled={!field.visible}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setActiveReport(null)} className="px-5 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition">إلغاء</button>
              <button 
                onClick={handlePrintActiveReport}
                className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-[#1673a4] shadow-lg shadow-blue-200 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة النموذج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Identity Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Settings className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-800">إعدادات الهوية والعناوين</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الإدارة التعليمية (الترويسة العلوية)</label>
            <input type="text" value={settings.adminName} onChange={(e) => handleSettingChange('adminName', e.target.value)} className={inputClass} placeholder="مثال: الإدارة العامة للتعليم بمنطقة الرياض" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المدرسة (للتقارير)</label>
            <input type="text" value={settings.schoolName} onChange={(e) => handleSettingChange('schoolName', e.target.value)} className={inputClass} />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> رابط الشعار (Logo URL)</label>
             <input type="text" value={settings.logoUrl} onChange={(e) => handleSettingChange('logoUrl', e.target.value)} className={`${inputClass} text-left dir-ltr`} />
          </div>
        </div>
      </div>

      {/* 2. Main Student Reports (Legacy but kept for direct access) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" /> التقارير الأساسية (طباعة مباشرة)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => printDoorLabels(data, settings)} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-4"><Square className="w-7 h-7" /></div>
              <h3 className="font-bold text-gray-800 mb-1">ملصقات الأبواب</h3>
            </button>
            <button onClick={() => printAttendance(data, settings)} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-secondary hover:shadow-lg transition-all group text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-secondary mb-4"><FileText className="w-7 h-7" /></div>
              <h3 className="font-bold text-gray-800 mb-1">كشوف المناداة</h3>
            </button>
            <button onClick={() => printSeatLabels(data, settings)} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-lg transition-all group text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4"><div className="grid grid-cols-2 gap-1 w-5 h-5"><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div></div></div>
              <h3 className="font-bold text-gray-800 mb-1">ملصقات الطاولات</h3>
            </button>
        </div>
      </div>

      {/* 3. NEW & Customized Administrative Forms */}
      <div className="space-y-4 pt-6 border-t border-dashed border-gray-300">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-orange-600" /> النماذج الإدارية الجديدة (قابلة للتخصيص)
        </h3>
        <p className="text-xs text-gray-500 mb-4">اضغط على النموذج لفتح خيارات التعديل (إخفاء أعمدة، تغيير مسميات) قبل الطباعة.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* 1. Student Counts */}
             <button 
                onClick={() => openReportConfig('student_counts', 'أعداد الطلاب في اللجان', [
                  {key: 'col_class', label: 'الصف'},
                  {key: 'col_comm', label: 'رقم اللجنة'},
                  {key: 'col_count', label: 'عدد الطلاب'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><Users className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">أعداد الطلاب في اللجان</div><div className="text-[10px] text-gray-400">إحصائية اللجان</div></div>
            </button>

            {/* 2. Invigilator Attendance */}
            <button 
                onClick={() => openReportConfig('invigilator_attendance', 'كشف بأسماء الملاحظين', [
                  {key: 'col_comm_no', label: 'رقم اللجنة'},
                  {key: 'col_comm_loc', label: 'مقر اللجنة'},
                  {key: 'col_subject', label: 'المادة'},
                  {key: 'col_time', label: 'زمن الاختبار'},
                  {key: 'col_name', label: 'اسم الملاحظ'},
                  {key: 'col_sign', label: 'التوقيع'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><ClipboardList className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">كشف الملاحظين</div><div className="text-[10px] text-gray-400">توزيع المراقبة</div></div>
            </button>

            {/* 3. Absence Record */}
            <button 
                onClick={() => openReportConfig('absence_record', 'محضر غياب طالب عن الاختبار', [
                  {key: 'lbl_student', label: 'اسم الطالب'},
                  {key: 'lbl_id', label: 'رقم الجلوس'},
                  {key: 'lbl_comm', label: 'رقم اللجنة'},
                  {key: 'lbl_subject', label: 'المادة'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><UserX className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">محضر غياب طالب</div><div className="text-[10px] text-gray-400">نموذج فردي</div></div>
            </button>

            {/* 4. Question Envelope Opening */}
            <button 
                onClick={() => openReportConfig('question_envelope_opening', 'محضر فتح مظروف أسئلة', [
                  {key: 'lbl_subject', label: 'المادة'},
                  {key: 'lbl_period', label: 'الفترة'},
                  {key: 'lbl_status', label: 'حالة المظروف'},
                  {key: 'col_name', label: 'الاسم'},
                  {key: 'col_role', label: 'الصفة'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><MailOpen className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">محضر فتح مظاريف</div><div className="text-[10px] text-gray-400">لجنة فتح المظاريف</div></div>
            </button>

             {/* 5. Question Envelope */}
             <button 
                onClick={() => openReportConfig('question_envelope', 'مظروف أسئلة الطلاب', [
                  {key: 'lbl_year', label: 'العام الدراسي'},
                  {key: 'lbl_term', label: 'الفصل الدراسي'},
                  {key: 'lbl_subject', label: 'المادة'},
                  {key: 'lbl_count', label: 'عدد طلاب اللجنة'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><FolderOpen className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">مظروف الأسئلة</div><div className="text-[10px] text-gray-400">ملصق الظرف الخارجي</div></div>
            </button>

            {/* 6. Answer Envelope */}
             <button 
                onClick={() => openReportConfig('answer_envelope', 'مظروف أصل الإجابة النموذجية', [
                  {key: 'lbl_year', label: 'العام الدراسي'},
                  {key: 'lbl_term', label: 'الفصل الدراسي'},
                  {key: 'lbl_type', label: 'نوع الأسئلة'},
                  {key: 'lbl_teacher', label: 'اسم المعلم'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><FileCheck className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">مظروف الإجابة</div><div className="text-[10px] text-gray-400">للإجابة النموذجية</div></div>
            </button>

             {/* 7. Answer Paper Receipt (New) */}
             <button 
                onClick={() => openReportConfig('answer_paper_receipt', 'كشف استلام أوراق الإجابة', [
                    {key: 'col_comm', label: 'رقم اللجنة'},
                    {key: 'col_applicants', label: 'المتقدمون'},
                    {key: 'col_present', label: 'الحاضرون'},
                    {key: 'col_absent', label: 'الغائبون'},
                    {key: 'col_total', label: 'المجموع'},
                    {key: 'col_notes', label: 'ملاحظات'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><FileStack className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">كشف استلام أوراق</div><div className="text-[10px] text-gray-400">استلام الأجوبة من اللجان</div></div>
            </button>

            {/* 8. Exam Paper Tracking (New) */}
            <button 
                onClick={() => openReportConfig('exam_paper_tracking', 'متابعة تسليم واستلام الأسئلة', [
                    {key: 'lbl_teacher', label: 'اسم المعلم'},
                    {key: 'lbl_subject', label: 'المادة'},
                    {key: 'lbl_grade', label: 'الصف / المستوى'},
                    {key: 'lbl_track', label: 'المسار'},
                    {key: 'lbl_assign_date', label: 'تاريخ استلام القرار'},
                    {key: 'lbl_assign_sig', label: 'توقيع المعلم'},
                    {key: 'lbl_env_q', label: 'مظروف أصل الأسئلة'},
                    {key: 'lbl_env_a', label: 'مظروف أصل الإجابة'},
                    {key: 'lbl_env_s', label: 'مظاريف أسئلة الطلاب'},
                    {key: 'lbl_deliver_date', label: 'تاريخ التسليم'},
                    {key: 'lbl_deliver_sig', label: 'التوقيع'},
                ])}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-right group"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><BookOpen className="w-5 h-5" /></div>
                <div><div className="font-bold text-gray-800 text-sm">متابعة تسليم الأسئلة</div><div className="text-[10px] text-gray-400">سجل تسليم المعلمين</div></div>
            </button>

        </div>
      </div>
      
    </div>
  );
};

export default PrintCenter;