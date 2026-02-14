import React, { useState, useEffect, useMemo } from 'react';
import { AppData, ExamSchedule, Teacher } from '../types';
import { Users, Wand2, Calendar, Clock, Edit2, X, Plus } from 'lucide-react';
import ScheduleWizard from './ScheduleWizard'; 

interface Props {
  data: AppData;
  onSave: (schedule: ExamSchedule) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
}

const InvigilatorDistributionPanel: React.FC<Props> = ({ data, onSave, onUpdateTeachers }) => {
  const [schedule, setSchedule] = useState<ExamSchedule | null>(data.schedule || null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showTeacherManager, setShowTeacherManager] = useState(true);

  // تحديث الحالة المحلية إذا تغيرت البيانات القادمة من الأب
  useEffect(() => {
    if (data.schedule) {
        setSchedule(data.schedule);
    } else if (!schedule) {
        // يمكن فتح المعالج تلقائياً هنا إذا رغبت
    }
  }, [data.schedule]);

  const handleWizardSave = (newSchedule: ExamSchedule) => {
      setSchedule(newSchedule);
      onSave(newSchedule);
      setShowWizard(false);
      setActiveDayIdx(0);
  };

  const handleAssignTeacher = (dayIdx: number, periodIdx: number, teacherName: string, isReserve: boolean) => {
      if (!schedule) return;
      const newSchedule = { ...schedule };
      const period = newSchedule.days[dayIdx].periods[periodIdx];
      const targetArray = isReserve ? period.reserves : period.main;
      
      // منع التكرار (يمكن السماح به إذا كان المعلم يدخل لجنتين في أوقات مختلفة، لكن هنا نمنعه للتبسيط)
      if (!targetArray.includes(teacherName)) {
          targetArray.push(teacherName);
          setSchedule(newSchedule);
          onSave(newSchedule);
      }
  };

  const removeAssignment = (dayIdx: number, periodIdx: number, teacherName: string, isReserve: boolean) => {
       if (!schedule) return;
       const newSchedule = { ...schedule };
       const period = newSchedule.days[dayIdx].periods[periodIdx];
       
       if (isReserve) {
           period.reserves = period.reserves.filter(t => t !== teacherName);
       } else {
           period.main = period.main.filter(t => t !== teacherName);
       }
       setSchedule(newSchedule);
       onSave(newSchedule);
  };

  // إحصائيات المعلمين (كم مرة مراقب وكم مرة احتياط)
  const teacherStats = useMemo(() => {
      const stats: Record<string, { active: number, reserve: number }> = {};
      data.teachers.forEach(t => stats[t.name] = { active: 0, reserve: 0 });

      if (schedule) {
          schedule.days.forEach(day => {
              day.periods.forEach(per => {
                  per.main.forEach(t => { if(stats[t]) stats[t].active++; });
                  per.reserves.forEach(t => { if(stats[t]) stats[t].reserve++; });
              });
          });
      }
      return stats;
  }, [data.teachers, schedule]);

  if (!schedule && !showWizard) {
      return (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary"><Calendar size={64} /></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">الجدول غير جاهز</h2>
              <p className="text-gray-500 mb-8 max-w-md">لم تقم ببناء هيكل الأيام والفترات والمواد بعد.</p>
              <button onClick={() => setShowWizard(true)} className="bg-secondary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary/90 transition-all shadow-lg flex items-center gap-3"><Wand2 /> إنشاء الجدول الآن</button>
          </div>
      );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {showWizard && (
          <ScheduleWizard 
             stages={data.stages}
             onClose={() => setShowWizard(false)} 
             onSave={handleWizardSave}
             initialData={schedule} 
          />
      )}

      {/* شريط الأدوات العلوي */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="bg-secondary/10 p-3 rounded-xl text-secondary"><Calendar size={24} /></div>
              <div>
                  <h2 className="text-xl font-bold text-gray-800">توزيع الملاحظين</h2>
                  <p className="text-sm text-gray-500">{schedule?.days.length} أيام اختبارات • {data.committees.length} لجان</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={() => setShowTeacherManager(!showTeacherManager)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 border ${showTeacherManager ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-200'}`}><Users size={18} /> المعلمين</button>
              <button onClick={() => setShowWizard(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2"><Edit2 size={18} /> تعديل الجدول والمواد</button>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          {/* يمين: شبكة الجدول */}
          <div className="flex-1 space-y-6">
              {/* تبويبات الأيام */}
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar gap-2">
                  {schedule?.days.map((day, idx) => (
                      <button key={day.dayId} onClick={() => setActiveDayIdx(idx)} className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex flex-col items-center gap-1 min-w-[100px] ${activeDayIdx === idx ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                          <span>اليوم {day.dayId}</span>
                          <span className={`text-[10px] ${activeDayIdx === idx ? 'text-secondary-200' : 'text-gray-400'}`}>{new Date(day.date).toLocaleDateString('ar-SA', {weekday: 'short'})}</span>
                      </button>
                  ))}
              </div>

              {/* الفترات لليوم النشط */}
              <div className="space-y-6">
                  {schedule?.days[activeDayIdx].periods.map((period, pIdx) => (
                      <div key={period.periodId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Clock className="text-secondary" size={20} /> الفترة {period.periodId}</h3>
                              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">{data.committees.length} لجنة</span>
                          </div>
                          
                          <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {data.committees.map((committee) => {
                                      // تحديد المادة الخاصة بهذه اللجنة
                                      // 1. معرفة المرحلة التي ينتمي لها طلاب اللجنة (الأكثرية)
                                      const dominantStageId = Object.entries(committee.counts).sort(([, a], [, b]) => b - a)[0]?.[0]; 
                                      const stageName = data.stages.find(s => s.id === Number(dominantStageId))?.name;
                                      // 2. جلب تفاصيل المادة من الجدول
                                      const subjectDetail = stageName ? period.subjects?.[stageName] : null;

                                      // حساب المعلمين المعينين (منطق بسيط يعتمد على الترتيب في المصفوفة)
                                      const needs = committee.invigilatorCount || 1;
                                      const prevNeeds = data.committees.slice(0, data.committees.findIndex(c => c.id === committee.id)).reduce((a,c) => a + (c.invigilatorCount||1), 0);
                                      
                                      return (
                                          <div key={committee.id} className="border border-gray-200 rounded-xl p-4 hover:border-secondary/50 transition-colors">
                                              <div className="flex justify-between mb-2">
                                                  <span className="font-bold text-gray-800">لجنة {committee.name}</span>
                                                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{committee.location}</span>
                                              </div>
                                              
                                              {/* عرض المادة والوقت */}
                                              {subjectDetail && (
                                                  <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg overflow-hidden">
                                                      <div className="bg-blue-100/50 px-2 py-1 text-xs font-bold text-blue-800 text-center truncate" title={subjectDetail.name}>
                                                          {subjectDetail.name}
                                                      </div>
                                                      <div className="flex justify-between items-center px-2 py-0.5 text-[10px] text-blue-600 font-mono">
                                                          <span>{subjectDetail.startTime}</span>
                                                          <span>-</span>
                                                          <span>{subjectDetail.endTime}</span>
                                                      </div>
                                                  </div>
                                              )}

                                              {/* خانات المعلمين */}
                                              <div className="space-y-2">
                                                  {Array.from({ length: needs }).map((_, slotIdx) => {
                                                      const globalIdx = prevNeeds + slotIdx;
                                                      const assignedTeacher = period.main[globalIdx];
                                                      return (
                                                          <div key={slotIdx} className={`p-2 rounded-lg border text-sm flex justify-between items-center ${assignedTeacher ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'}`}>
                                                              {assignedTeacher ? (
                                                                  <><span className="font-bold truncate">{assignedTeacher}</span><button onClick={() => removeAssignment(activeDayIdx, pIdx, assignedTeacher, false)} className="hover:text-red-500"><X size={14}/></button></>
                                                              ) : <span className="text-xs">اضغط معلم للإضافة</span>}
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                              
                              {/* قسم الاحتياط */}
                              <div className="mt-6 border-t pt-4">
                                  <h4 className="text-sm font-bold text-gray-500 mb-3">الاحتياط لهذه الفترة</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {period.reserves.map(t => (
                                          <div key={t} className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                                              {t} <button onClick={() => removeAssignment(activeDayIdx, pIdx, t, true)}><X size={14}/></button>
                                          </div>
                                      ))}
                                      <div className="text-xs text-gray-400 py-2 px-3 border border-dashed rounded-lg">اضغط "احتياط" لإضافة معلم</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* يسار: قائمة المعلمين */}
          {showTeacherManager && (
             <div className="lg:w-80 shrink-0">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-secondary" /> المعلمين المتاحين</h3>
                    <div className="space-y-2">
                        {data.teachers.map((teacher) => {
                            const stats = teacherStats[teacher.name];
                            return (
                                <div key={teacher.name} className="p-3 border border-gray-100 rounded-xl hover:shadow-md transition-all bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">{teacher.name}</div>
                                            <div className="text-[10px] text-gray-400">{teacher.phone || 'لا يوجد رقم'}</div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[10px] font-bold">
                                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded" title="عدد مرات المراقبة">{stats.active}</span>
                                            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded" title="عدد مرات الاحتياط">{stats.reserve}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAssignTeacher(activeDayIdx, 0, teacher.name, false)} className="flex-1 bg-white border border-green-200 text-green-700 py-1 rounded-lg text-xs hover:bg-green-50 font-bold">+ لجنة</button>
                                        <button onClick={() => handleAssignTeacher(activeDayIdx, 0, teacher.name, true)} className="flex-1 bg-white border border-yellow-200 text-yellow-700 py-1 rounded-lg text-xs hover:bg-yellow-50 font-bold">+ احتياط</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 </div>
             </div>
          )}
      </div>
    </div>
  );
};

export default InvigilatorDistributionPanel;
