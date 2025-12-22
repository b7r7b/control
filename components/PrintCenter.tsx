import React, { useState, useEffect } from 'react';
import { AppData, PrintSettings, DynamicReportConfig } from '../types';
import { 
  printDoorLabels, 
  printAttendance, 
  printSeatLabels,
  printStudentCountsReport,
  printInvigilatorAttendance,
  printAbsenceRecord,
  printQuestionEnvelopeOpening,
  printQuestionEnvelope,
  printAnswerEnvelope,
  printAnswerPaperReceipt,
  printExamPaperTracking,
  printCommitteeData,
  printUnassignedStudents,
  printEmptyCommittees,
  printDistributionByGrade,
  printViolationMinutes,
  printSubCommitteeTasks
} from '../services/printService';
import { Printer, Settings, Eye, EyeOff, Edit3, X, Users, ClipboardList, UserX, MailOpen, FolderOpen, FileCheck, FileStack, BookOpen, AlertCircle, List, UserMinus, ShieldAlert, FileText, LayoutList } from 'lucide-react';

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
  const [invigilatorAssignments, setInvigilatorAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data.school.name) {
        setSettings(prev => ({ ...prev, schoolName: data.school.name }));
    }
  }, [data.school.name]);

  const handleSettingChange = (field: keyof PrintSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = "w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none";

  const openReportConfig = (reportId: string, defaultTitle: string, defaultFields: {key: string, label: string}[]) => {
    setActiveReport({
      id: reportId,
      title: defaultTitle,
      fields: defaultFields.map(f => ({ ...f, visible: true }))
    });
    if (reportId === 'invigilator_attendance' || reportId === 'invigilator_daily_list') {
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
    
    switch (activeReport.id) {
      // Group 1
      case 'student_counts': printStudentCountsReport(data, settings, activeReport); break;
      case 'committee_data': printCommitteeData(data, settings); break;
      case 'door_labels': printDoorLabels(data, settings); break;
      case 'empty_committees': printEmptyCommittees(data, settings); break;
      
      // Group 2
      case 'attendance': printAttendance(data, settings); break;
      case 'unassigned_students': printUnassignedStudents(data, settings); break;
      case 'distribution_by_grade': printDistributionByGrade(data, settings); break;
      case 'distribution_by_committee': printStudentCountsReport(data, settings, activeReport); break; // Re-use logic for now or custom

      // Group 3
      case 'invigilator_distribution': printInvigilatorAttendance(data, settings, activeReport, invigilatorAssignments); break;
      case 'invigilator_daily_list': printInvigilatorAttendance(data, settings, activeReport, invigilatorAssignments); break;

      // Group 4
      case 'answer_paper_receipt': printAnswerPaperReceipt(data, settings, activeReport); break;
      case 'absence_daily': printAbsenceRecord(data, settings, activeReport); break; // Using single form logic for now
      case 'exam_paper_tracking': printExamPaperTracking(data, settings, activeReport); break;
      case 'question_envelope_opening': printQuestionEnvelopeOpening(data, settings, activeReport); break;
      case 'violation_minutes': printViolationMinutes(data, settings); break;
      case 'sub_committee_tasks': printSubCommitteeTasks(data, settings); break;
      
      // Stickers
      case 'seat_labels': printSeatLabels(data, settings); break;
      
      // Envelopes (Added for completeness though separate in list)
      case 'question_envelope': printQuestionEnvelope(data, settings, activeReport); break;
    }
  };

  // Helper component for Report Buttons
  const ReportBtn = ({ id, title, subtitle, icon: Icon, onClick, color = "blue" }: any) => {
    const colors: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600 hover:bg-blue-600",
        orange: "bg-orange-100 text-orange-600 hover:bg-orange-600",
        green: "bg-green-100 text-green-600 hover:bg-green-600",
        red: "bg-red-100 text-red-600 hover:bg-red-600",
        purple: "bg-purple-100 text-purple-600 hover:bg-purple-600",
    };
    
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-right group h-full"
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${colors[color]} group-hover:text-white`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="font-bold text-gray-800 text-sm">{title}</div>
                {subtitle && <div className="text-[10px] text-gray-400">{subtitle}</div>}
            </div>
        </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Config Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                تجهيز النموذج: {activeReport.title}
              </h3>
              <button onClick={() => setActiveReport(null)} className="text-gray-400 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التقرير</label>
                <input type="text" value={activeReport.title} onChange={(e) => setActiveReport({...activeReport, title: e.target.value})} className={inputClass} />
              </div>
              
              {(activeReport.id.includes('invigilator')) && (
                  <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                      <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> توزيع المعلمين (للطباعة فقط)</h4>
                      <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                        {data.committees.map((c, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                                <span className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold w-24 text-center">لجنة {c.name}</span>
                                <select className="flex-1 rounded-lg border-gray-300 text-sm py-2" value={invigilatorAssignments[c.name] || ''} onChange={(e) => handleInvigilatorAssignment(c.name, e.target.value)}>
                                    <option value="">-- اختر المعلم --</option>
                                    {data.teachers && data.teachers.map((t, tIdx) => (<option key={tIdx} value={t.name}>{t.name}</option>))}
                                </select>
                             </div>
                        ))}
                      </div>
                  </div>
              )}

              {activeReport.fields.length > 0 && (
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-800 mb-4">الأعمدة والحقول</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeReport.fields.map((field) => (
                        <div key={field.key} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${field.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                          <button onClick={() => toggleFieldVisibility(field.key)} className={`p-1.5 rounded-md transition-colors ${field.visible ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                            {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <input type="text" value={field.label} onChange={(e) => updateFieldLabel(field.key, e.target.value)} disabled={!field.visible} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium" />
                        </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setActiveReport(null)} className="px-5 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={handlePrintActiveReport} className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-[#1673a4] shadow-lg shadow-blue-200 transition flex items-center gap-2"><Printer className="w-4 h-4" /> طباعة</button>
            </div>
          </div>
        </div>
      )}

      {/* Identity Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Settings className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-800">إعدادات الهوية والعناوين</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الإدارة التعليمية (الترويسة العلوية)</label>
            <input type="text" value={settings.adminName} onChange={(e) => handleSettingChange('adminName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المدرسة</label>
            <input type="text" value={settings.schoolName} onChange={(e) => handleSettingChange('schoolName', e.target.value)} className={inputClass} />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">رابط الشعار</label>
             <input type="text" value={settings.logoUrl} onChange={(e) => handleSettingChange('logoUrl', e.target.value)} className={`${inputClass} text-left dir-ltr`} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Group 1: Committees & Students */}
        <div>
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><LayoutList className="w-5 h-5 text-blue-600" /> تقارير اللجان</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportBtn 
                 title="بيان أعداد الطلاب" 
                 subtitle="إحصائية عامة للجان" 
                 icon={Users} 
                 color="blue" 
                 onClick={() => openReportConfig('student_counts', 'بيان بأعداد الطلاب في اللجان', [{key: 'col_class', label: 'الصف'}, {key: 'col_comm', label: 'رقم اللجنة'}, {key: 'col_count', label: 'عدد الطلاب'}])} 
              />
              <ReportBtn 
                 title="بيانات اللجان" 
                 subtitle="قائمة اللجان ومقارها" 
                 icon={List} 
                 color="blue" 
                 onClick={() => openReportConfig('committee_data', 'بيانات اللجان', [])} 
              />
              <ReportBtn 
                 title="ملصقات اللجان" 
                 subtitle="تعريف بالأبواب" 
                 icon={FileText} 
                 color="blue" 
                 onClick={() => openReportConfig('door_labels', settings.doorLabelTitle, [])} 
              />
              <ReportBtn 
                 title="اللجان الفارغة" 
                 subtitle="كشف اللجان الشاغرة" 
                 icon={AlertCircle} 
                 color="blue" 
                 onClick={() => openReportConfig('empty_committees', 'كشف بأسماء اللجان الفارغة', [])} 
              />
           </div>
        </div>

        {/* Group 2: Attendance & Distribution */}
        <div>
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-green-600" /> كشوف المناداة والتوزيع</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportBtn 
                 title="كشف مناداة" 
                 subtitle="قوائم التحضير" 
                 icon={ClipboardList} 
                 color="green" 
                 onClick={() => openReportConfig('attendance', settings.attendanceTitle, [])} 
              />
              <ReportBtn 
                 title="توزيع حسب الصفوف" 
                 subtitle="التوزيع على اللجان" 
                 icon={LayoutList} 
                 color="green" 
                 onClick={() => openReportConfig('distribution_by_grade', 'توزيع الطلاب حسب الصفوف', [])} 
              />
              <ReportBtn 
                 title="توزيع حسب اللجنة" 
                 subtitle="قوائم الطلاب باللجان" 
                 icon={Users} 
                 color="green" 
                 onClick={() => openReportConfig('distribution_by_committee', 'توزيع الطلاب على اللجان', [{key: 'col_class', label: 'الصف'}, {key: 'col_comm', label: 'رقم اللجنة'}, {key: 'col_count', label: 'عدد الطلاب'}])} 
              />
              <ReportBtn 
                 title="الطلاب غير المرتبطين" 
                 subtitle="غير الموزعين" 
                 icon={UserMinus} 
                 color="green" 
                 onClick={() => openReportConfig('unassigned_students', 'الطلاب غير المرتبطين بلجان', [])} 
              />
           </div>
        </div>

        {/* Group 3: Invigilators */}
        <div>
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-orange-600" /> الملاحظين والمراقبة</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ReportBtn 
                 title="توزيع الملاحظين" 
                 subtitle="على اللجان" 
                 icon={Users} 
                 color="orange" 
                 onClick={() => openReportConfig('invigilator_distribution', 'توزيع الملاحظين على اللجان', [{key: 'col_comm_no', label: 'رقم اللجنة'}, {key: 'col_name', label: 'اسم الملاحظ'}])} 
              />
              <ReportBtn 
                 title="كشف الملاحظين اليومي" 
                 subtitle="توقيع الحضور" 
                 icon={ClipboardList} 
                 color="orange" 
                 onClick={() => openReportConfig('invigilator_daily_list', 'كشف الملاحظين اليومي', [{key: 'col_name', label: 'الاسم'}, {key: 'col_sign', label: 'التوقيع'}])} 
              />
              <ReportBtn 
                 title="مهام اللجان الفرعية" 
                 subtitle="تعليمات الملاحظين" 
                 icon={FileText} 
                 color="orange" 
                 onClick={() => openReportConfig('sub_committee_tasks', 'مهام اللجان', [])} 
              />
           </div>
        </div>

        {/* Group 4: Admin Forms */}
        <div>
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileStack className="w-5 h-5 text-purple-600" /> النماذج الإدارية والمحاضر</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportBtn 
                 title="استلام أوراق الإجابة" 
                 subtitle="نموذج الاستلام" 
                 icon={FileCheck} 
                 color="purple" 
                 onClick={() => openReportConfig('answer_paper_receipt', 'كشف استلام أوراق الإجابة', [{key: 'col_comm', label: 'رقم اللجنة'}, {key: 'col_applicants', label: 'المتقدمون'}, {key: 'col_total', label: 'المجموع'}])} 
              />
              <ReportBtn 
                 title="الغياب اليومي" 
                 subtitle="محضر غياب" 
                 icon={UserX} 
                 color="purple" 
                 onClick={() => openReportConfig('absence_daily', 'كشف الغياب اليومي', [{key: 'lbl_student', label: 'الطالب'}, {key: 'lbl_id', label: 'رقم الجلوس'}])} 
              />
              <ReportBtn 
                 title="متابعة أوراق الإجابة" 
                 subtitle="سير الأوراق" 
                 icon={BookOpen} 
                 color="purple" 
                 onClick={() => openReportConfig('exam_paper_tracking', 'متابعة سير أوراق الإجابة', [])} 
              />
               <ReportBtn 
                 title="فتح المظاريف" 
                 subtitle="محضر رسمي" 
                 icon={MailOpen} 
                 color="purple" 
                 onClick={() => openReportConfig('question_envelope_opening', 'محضر فتح مظاريف الأسئلة', [])} 
              />
              <ReportBtn 
                 title="مخالفة الأنظمة" 
                 subtitle="محضر غش" 
                 icon={ShieldAlert} 
                 color="red" 
                 onClick={() => openReportConfig('violation_minutes', 'محضر مخالفة', [])} 
              />
               <ReportBtn 
                 title="مظروف الأسئلة" 
                 subtitle="ملصق الظرف" 
                 icon={FolderOpen} 
                 color="purple" 
                 onClick={() => openReportConfig('question_envelope', 'مظروف أسئلة الطلاب', [])} 
              />
           </div>
        </div>

      </div>
      
    </div>
  );
};

export default PrintCenter;