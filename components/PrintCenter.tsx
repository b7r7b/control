import React, { useState, useEffect, useMemo } from 'react';
import { AppData, PrintSettings, DynamicReportConfig } from '../types';
import { 
  printDoorLabels, 
  printAttendance, 
  printSeatLabels,
  printStudentCountsReport,
  printInvigilatorAttendance,
  printAbsenceRecord,
  printLateRecord,
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
  printSubCommitteeTasks,
  printSubstituteInvigilatorRecord
} from '../services/printService';
import { Printer, Settings, Eye, EyeOff, Edit3, X, Users, ClipboardList, UserX, MailOpen, FolderOpen, FileCheck, FileStack, BookOpen, AlertCircle, List, UserMinus, ShieldAlert, FileText, LayoutList, PenTool, Search, User, Calendar, Book, Clock, UserCheck } from 'lucide-react';

interface PrintCenterProps {
  data: AppData;
  onUpdateSchool: (field: string, value: string) => void;
}

const PrintCenter: React.FC<PrintCenterProps> = ({ data, onUpdateSchool }) => {
  const [settings, setSettings] = useState<PrintSettings>({
    adminName: 'الإدارة العامة للتعليم بمحافظة جدة',
    schoolName: data.school.name || 'ثانوية الأمير عبدالمجيد الأولى',
    managerName: data.school.managerName || '',
    agentName: data.school.agentName || '',
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
  
  // Student Selection State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Exam Details State (Subject, Date, etc.)
  const [examDetails, setExamDetails] = useState({
      subject: '',
      date: '',
      day: '',
      period: 'الأولى',
      grade: '',
      time: '', // Start Time
      arrivalTime: '', // New: For Late Record
      lateDuration: '' // New: For Late Record
  });

  // Substitute Invigilator State
  const [substituteData, setSubstituteData] = useState({
      reserveTeacher: '',
      originalTeacher: '',
      committeeId: '',
      reason: ''
  });

  // Flatten all students with their calculated committee info
  const allStudents = useMemo(() => {
      const list: any[] = [];
      data.stages.forEach(stage => {
          stage.students.forEach((student, index) => {
             // Find which committee this student belongs to based on counts
             let committeeName = 'غير موزّع';
             let committeeLocation = '';
             
             // Logic: Iterate committees, subtract counts until we find where this student index falls
             let tempIndex = index;
             for (const comm of data.committees) {
                 const countInComm = comm.counts[stage.id] || 0;
                 if (tempIndex < countInComm) {
                     committeeName = comm.name;
                     committeeLocation = comm.location;
                     break;
                 }
                 tempIndex -= countInComm;
             }

             list.push({
                 uniqueId: `${stage.id}-${index}`, // composite ID
                 ...student,
                 stageName: stage.name,
                 committeeName,
                 committeeLocation
             });
          });
      });
      return list;
  }, [data]);

  const filteredStudents = useMemo(() => {
      if (!studentSearchTerm) return [];
      return allStudents.filter(s => s.name.includes(studentSearchTerm) || s.studentId.includes(studentSearchTerm)).slice(0, 10);
  }, [allStudents, studentSearchTerm]);

  const selectedStudentData = useMemo(() => {
      return allStudents.find(s => s.uniqueId === selectedStudentId);
  }, [allStudents, selectedStudentId]);

  useEffect(() => {
      setSettings(prev => ({
          ...prev,
          schoolName: data.school.name || prev.schoolName,
          managerName: data.school.managerName || prev.managerName,
          agentName: data.school.agentName || prev.agentName
      }));
  }, [data.school]);

  const handleSettingChange = (field: keyof PrintSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    if (field === 'schoolName') onUpdateSchool('name', value);
    if (field === 'managerName') onUpdateSchool('managerName', value);
    if (field === 'agentName') onUpdateSchool('agentName', value);
  };

  const handleDateChange = (dateVal: string) => {
      if (!dateVal) {
          setExamDetails(prev => ({ ...prev, date: '', day: '' }));
          return;
      }
      const dateObj = new Date(dateVal);
      const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
      setExamDetails(prev => ({ ...prev, date: dateVal, day: dayName }));
  };

  const inputClass = "w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none";

  const openReportConfig = (reportId: string, defaultTitle: string, defaultFields: {key: string, label: string}[]) => {
    setActiveReport({
      id: reportId,
      title: defaultTitle,
      fields: defaultFields.map(f => ({ ...f, visible: true }))
    });
    
    // Reset specific states
    if (reportId === 'invigilator_attendance' || reportId === 'invigilator_daily_list') {
        setInvigilatorAssignments({});
    }
    
    // Reset Student & Exam Data
    setSelectedStudentId('');
    setStudentSearchTerm('');
    setExamDetails({ subject: '', date: '', day: '', period: 'الأولى', grade: '', time: '', arrivalTime: '', lateDuration: '' });
    
    // Reset Substitute Data
    setSubstituteData({ reserveTeacher: '', originalTeacher: '', committeeId: '', reason: '' });
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
      case 'attendance': printAttendance(data, settings, activeReport); break;
      case 'unassigned_students': printUnassignedStudents(data, settings); break;
      case 'distribution_by_grade': printDistributionByGrade(data, settings); break;
      case 'distribution_by_committee': printStudentCountsReport(data, settings, activeReport); break; 

      // Group 3 (Invigilators)
      case 'invigilator_distribution': printInvigilatorAttendance(data, settings, activeReport, invigilatorAssignments); break;
      case 'invigilator_daily_list': printInvigilatorAttendance(data, settings, activeReport, invigilatorAssignments); break;

      // Group 4 (Admin)
      case 'answer_paper_receipt': printAnswerPaperReceipt(data, settings, activeReport); break;
      case 'exam_paper_tracking': printExamPaperTracking(data, settings, activeReport); break;
      case 'question_envelope_opening': printQuestionEnvelopeOpening(data, settings, activeReport, examDetails); break;
      case 'sub_committee_tasks': printSubCommitteeTasks(data, settings); break;
      case 'substitute_invigilator': printSubstituteInvigilatorRecord(data, settings, activeReport, examDetails, substituteData); break;
      case 'question_envelope': printQuestionEnvelope(data, settings, activeReport); break;
      case 'answer_envelope': printAnswerEnvelope(data, settings, activeReport); break;

      // Group 5 (Students Specific)
      case 'absence_daily': printAbsenceRecord(data, settings, activeReport, selectedStudentData, examDetails); break; 
      case 'student_late': printLateRecord(data, settings, activeReport, selectedStudentData, examDetails); break;
      case 'violation_minutes': printViolationMinutes(data, settings, activeReport, selectedStudentData, examDetails); break;

      // Stickers
      case 'seat_labels': printSeatLabels(data, settings); break;
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

  const needsStudentSelect = activeReport && ['absence_daily', 'violation_minutes', 'student_late'].includes(activeReport.id);
  const needsExamDetails = activeReport && ['absence_daily', 'violation_minutes', 'question_envelope_opening', 'student_late', 'substitute_invigilator'].includes(activeReport.id);
  const isLateReport = activeReport?.id === 'student_late';
  const isSubstituteReport = activeReport?.id === 'substitute_invigilator';

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
              
              {/* Title Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التقرير</label>
                <input type="text" value={activeReport.title} onChange={(e) => setActiveReport({...activeReport, title: e.target.value})} className={inputClass} />
              </div>

              {/* Manager Name Input for specific reports */}
              {(isLateReport || isSubstituteReport) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-2">
                           <PenTool className="w-3 h-3" /> اسم مدير المدرسة (للتوقيع)
                      </label>
                      <input 
                          type="text" 
                          value={settings.managerName} 
                          onChange={(e) => handleSettingChange('managerName', e.target.value)} 
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                          placeholder="الاسم الثلاثي..."
                      />
                  </div>
              )}
              
              {/* Invigilator Assignment Logic */}
              {(activeReport.id.includes('invigilator') && !isSubstituteReport) && (
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

              {/* Exam Details Section */}
              {needsExamDetails && (
                   <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                       <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                           <Calendar className="w-4 h-4" /> بيانات الاختبار (للتعبئة الآلية)
                       </h4>
                       <div className="grid grid-cols-2 gap-3">
                           {!isSubstituteReport && (
                               <div>
                                   <label className="block text-[10px] font-bold text-gray-500 mb-1">المادة</label>
                                   <input 
                                       type="text" 
                                       className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                       placeholder="مثال: الرياضيات"
                                       value={examDetails.subject}
                                       onChange={(e) => setExamDetails({...examDetails, subject: e.target.value})}
                                   />
                               </div>
                           )}
                           <div>
                               <label className="block text-[10px] font-bold text-gray-500 mb-1">التاريخ</label>
                               <input 
                                   type="date" 
                                   className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-center"
                                   value={examDetails.date}
                                   onChange={(e) => handleDateChange(e.target.value)}
                               />
                           </div>
                           <div>
                               <label className="block text-[10px] font-bold text-gray-500 mb-1">اليوم</label>
                               <input 
                                   type="text" 
                                   className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                   placeholder="مثال: الأحد"
                                   value={examDetails.day}
                                   onChange={(e) => setExamDetails({...examDetails, day: e.target.value})}
                               />
                           </div>
                            <div>
                               <label className="block text-[10px] font-bold text-gray-500 mb-1">الفترة</label>
                               <select 
                                   className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                   value={examDetails.period}
                                   onChange={(e) => setExamDetails({...examDetails, period: e.target.value})}
                               >
                                   <option value="الأولى">الأولى</option>
                                   <option value="الثانية">الثانية</option>
                                   <option value="الثالثة">الثالثة</option>
                               </select>
                           </div>
                           {!isSubstituteReport && (
                               <>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">وقت بدء الاختبار</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-center ltr"
                                        placeholder="07:30"
                                        value={examDetails.time}
                                        onChange={(e) => setExamDetails({...examDetails, time: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">الصف / المستوى</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                        placeholder="مثال: الصف الأول الثانوي"
                                        value={examDetails.grade}
                                        onChange={(e) => setExamDetails({...examDetails, grade: e.target.value})}
                                    />
                                </div>
                               </>
                           )}
                           
                           {/* Fields Specific to Late Report */}
                           {isLateReport && (
                               <>
                                   <div className="col-span-1">
                                       <label className="block text-[10px] font-bold text-red-500 mb-1">وقت حضور الطالب</label>
                                       <input 
                                           type="text" 
                                           className="w-full p-2 text-sm border border-red-300 bg-red-50 rounded-lg outline-none focus:border-red-500 text-center ltr"
                                           placeholder="07:40"
                                           value={examDetails.arrivalTime}
                                           onChange={(e) => setExamDetails({...examDetails, arrivalTime: e.target.value})}
                                       />
                                   </div>
                                   <div className="col-span-1">
                                       <label className="block text-[10px] font-bold text-red-500 mb-1">مقدار التأخر (دقيقة)</label>
                                       <input 
                                           type="text" 
                                           className="w-full p-2 text-sm border border-red-300 bg-red-50 rounded-lg outline-none focus:border-red-500 text-center"
                                           placeholder="10 دقائق"
                                           value={examDetails.lateDuration}
                                           onChange={(e) => setExamDetails({...examDetails, lateDuration: e.target.value})}
                                       />
                                   </div>
                               </>
                           )}
                       </div>
                   </div>
              )}

              {/* Substitute Invigilator Logic */}
              {isSubstituteReport && (
                  <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 mt-4">
                      <h4 className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2"><UserCheck className="w-4 h-4" /> بيانات التكليف (اختر من القوائم)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">المعلم البديل (احتياط)</label>
                              <select 
                                className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                                value={substituteData.reserveTeacher}
                                onChange={(e) => setSubstituteData({...substituteData, reserveTeacher: e.target.value})}
                              >
                                  <option value="">-- اختر المعلم البديل --</option>
                                  {data.teachers.map((t, idx) => <option key={idx} value={t.name}>{t.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">اللجنة (سيتم جلب المقر تلقائياً)</label>
                              <select 
                                className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                                value={substituteData.committeeId}
                                onChange={(e) => setSubstituteData({...substituteData, committeeId: e.target.value})}
                              >
                                  <option value="">-- اختر رقم اللجنة --</option>
                                  {data.committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">المعلم الأساسي (الغائب/المعتذر)</label>
                              <select 
                                className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                                value={substituteData.originalTeacher}
                                onChange={(e) => setSubstituteData({...substituteData, originalTeacher: e.target.value})}
                              >
                                  <option value="">-- اختر المعلم الأساسي --</option>
                                  {data.teachers.map((t, idx) => <option key={idx} value={t.name}>{t.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">سبب التكليف</label>
                              <input 
                                type="text"
                                className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                                placeholder="مثال: غياب، تأخر، ظرف طارئ..."
                                value={substituteData.reason}
                                onChange={(e) => setSubstituteData({...substituteData, reason: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>
              )}

              {/* Student Selection */}
              {needsStudentSelect && (
                   <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 mt-4">
                       <h4 className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2">
                           <User className="w-4 h-4" /> تحديد الطالب (اختياري)
                       </h4>
                       <div className="relative">
                           <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                               <div className="px-3 text-gray-400"><Search className="w-4 h-4" /></div>
                               <input 
                                  type="text" 
                                  className="w-full p-2.5 text-sm outline-none"
                                  placeholder="ابحث عن اسم الطالب..."
                                  value={studentSearchTerm}
                                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                               />
                               {selectedStudentId && (
                                   <button onClick={() => { setSelectedStudentId(''); setStudentSearchTerm(''); }} className="px-3 text-red-500 hover:bg-red-50 h-full"><X className="w-4 h-4" /></button>
                               )}
                           </div>

                           {/* Dropdown Results */}
                           {studentSearchTerm && !selectedStudentId && (
                               <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                   {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                       <div 
                                          key={s.uniqueId} 
                                          className="p-2 hover:bg-purple-50 cursor-pointer text-sm border-b last:border-0"
                                          onClick={() => {
                                              setSelectedStudentId(s.uniqueId);
                                              setStudentSearchTerm(s.name);
                                          }}
                                       >
                                           <div className="font-bold text-gray-800">{s.name}</div>
                                           <div className="flex justify-between text-xs text-gray-500 mt-1">
                                               <span>{s.stageName}</span>
                                               <span className="bg-gray-100 px-1 rounded">لجنة: {s.committeeName}</span>
                                           </div>
                                       </div>
                                   )) : (
                                       <div className="p-3 text-center text-xs text-gray-400">لا توجد نتائج</div>
                                   )}
                               </div>
                           )}
                           
                           {/* Selected Student Info Card */}
                           {selectedStudentData && (
                               <div className="mt-3 bg-white p-3 rounded-lg border border-purple-200 flex justify-between items-center shadow-sm">
                                   <div>
                                       <div className="font-bold text-sm text-gray-800">{selectedStudentData.name}</div>
                                       <div className="text-xs text-gray-500 mt-1">
                                           رقم الجلوس: <span className="font-mono font-bold text-black">{selectedStudentData.studentId}</span>
                                       </div>
                                   </div>
                                   <div className="text-center">
                                       <div className="text-[10px] text-gray-400">اللجنة</div>
                                       <div className="font-bold text-lg text-purple-700">{selectedStudentData.committeeName}</div>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
              )}

              {/* Field Visibility Config */}
              {activeReport.fields.length > 0 && (
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mt-4">
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
          <h2 className="text-xl font-bold text-gray-800">إعدادات الهوية والتواقيع</h2>
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
          {/* Signatories Inputs */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary" /> اسم مدير المدرسة (للتوقيع)
            </label>
            <input 
                type="text" 
                value={settings.managerName} 
                onChange={(e) => handleSettingChange('managerName', e.target.value)} 
                className={inputClass} 
                placeholder="مثال: أ. نايف الشهري"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary" /> اسم وكيل الشؤون التعليمية (للتوقيع)
            </label>
            <input 
                type="text" 
                value={settings.agentName} 
                onChange={(e) => handleSettingChange('agentName', e.target.value)} 
                className={inputClass} 
                placeholder="مثال: أ. احمد القرني"
            />
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
                 onClick={() => openReportConfig('attendance', 'كشف تحضير الطلاب', [
                     {key: 'col_seq', label: 'م'},
                     {key: 'col_seat', label: 'رقم الجلوس'},
                     {key: 'col_name', label: 'اسم الطالب'},
                     {key: 'col_stage', label: 'المرحلة'},
                     {key: 'col_pres', label: 'حضور'},
                     {key: 'col_sig', label: 'التوقيع'}
                 ])} 
              />
               <ReportBtn 
                 title="ملصقات الطاولات (3*7)" 
                 subtitle="نموذج 21 ملصق (A4)" 
                 icon={LayoutList} 
                 color="green" 
                 onClick={() => openReportConfig('seat_labels', settings.stickerTitle, [])} 
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

        {/* Group 5: Student Affairs (New Section) */}
        <div>
           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-orange-600" /> نماذج وشؤون الطلاب</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportBtn 
                 title="الغياب اليومي" 
                 subtitle="محضر غياب" 
                 icon={UserX} 
                 color="orange" 
                 onClick={() => openReportConfig('absence_daily', 'كشف الغياب اليومي', [{key: 'lbl_student', label: 'الطالب'}, {key: 'lbl_id', label: 'رقم الجلوس'}, {key: 'lbl_comm', label: 'رقم اللجنة'}, {key: 'lbl_subject', label: 'المادة'}])} 
              />
              <ReportBtn 
                 title="تعهد تأخر طالب" 
                 subtitle="تأخير أقل من 15 د" 
                 icon={Clock} 
                 color="orange" 
                 onClick={() => openReportConfig('student_late', 'تعهد طالب تأخر عن الاختبار', [])} 
              />
              <ReportBtn 
                 title="مخالفة الأنظمة" 
                 subtitle="محضر غش" 
                 icon={ShieldAlert} 
                 color="red" 
                 onClick={() => openReportConfig('violation_minutes', 'محضر مخالفة', [])} 
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
                 onClick={() => openReportConfig('answer_paper_receipt', 'كشف استلام أوراق الإجابة', [
                     {key: 'col_comm', label: 'رقم اللجنة'}, 
                     {key: 'col_applicants', label: 'عدد الطلاب'}, 
                     {key: 'col_present', label: 'الحاضرون'},
                     {key: 'col_absent', label: 'الغائبون'},
                     {key: 'col_total', label: 'أظرف الإجابة'},
                     {key: 'col_notes', label: 'توقيع المستلم'}
                 ])} 
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
                 title="ملاحظ بديل" 
                 subtitle="محضر دخول بديل" 
                 icon={UserCheck} 
                 color="purple" 
                 onClick={() => openReportConfig('substitute_invigilator', 'محضر دخول معلم ملاحظ بديل', [])} 
              />
               <ReportBtn 
                 title="مظروف الأسئلة" 
                 subtitle="ملصق الظرف" 
                 icon={FolderOpen} 
                 color="purple" 
                 onClick={() => openReportConfig('question_envelope', 'مظروف أسئلة الطلاب', [])} 
              />
              <ReportBtn 
                 title="مظروف الإجابة" 
                 subtitle="ملصق الظرف" 
                 icon={FolderOpen} 
                 color="purple" 
                 onClick={() => openReportConfig('answer_envelope', 'مظروف أصل الإجابة', [])} 
              />
           </div>
        </div>

      </div>
      
    </div>
  );
};

export default PrintCenter;