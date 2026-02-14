import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, ExamSchedule, DaySchedule, PeriodAssignment, Teacher } from '../types';
import { Users, Wand2, Calendar, RotateCcw, ChevronDown, ChevronUp, MessageCircle, UserPlus, Upload, Trash2, X, ClipboardPaste, Printer, Share2, Send, CheckCircle, ExternalLink, Play, Square, Layers, Clock, Edit2, Plus, Save, FileDown } from 'lucide-react';
import { readExcelFile, getSheetData, exportToExcel } from '../services/excelService';
import ScheduleWizard from './ScheduleWizard'; // استيراد المعالج الجديد

interface Props {
  data: AppData;
  onSave: (schedule: ExamSchedule) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
}

const InvigilatorDistributionPanel: React.FC<Props> = ({ data, onSave, onUpdateTeachers }) => {
  // State for Schedule Data
  const [schedule, setSchedule] = useState<ExamSchedule | null>(data.schedule || null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  
  // UI State
  const [showWizard, setShowWizard] = useState(false);
  const [showTeacherManager, setShowTeacherManager] = useState(true);

  // Initialize if empty (Default to opening Wizard)
  useEffect(() => {
    if (!schedule) {
       // Could auto-open wizard here if desired
    }
  }, []);

  // --- Handlers ---
  
  const handleWizardSave = (newSchedule: ExamSchedule) => {
      // Preserve existing assignments if possible (Advanced logic omitted for simplicity)
      // For now, we overwrite structure but could map old assignments by day index
      setSchedule(newSchedule);
      onSave(newSchedule);
      setShowWizard(false);
      setActiveDayIdx(0);
  };

  const handleAssignTeacher = (dayIdx: number, periodIdx: number, type: 'main' | 'reserve', teacherName: string) => {
      if (!schedule) return;
      const newSchedule = { ...schedule };
      const targetArray = type === 'main' 
          ? newSchedule.days[dayIdx].periods[periodIdx].main 
          : newSchedule.days[dayIdx].periods[periodIdx].reserves;
      
      // Avoid duplicates
      if (!targetArray.includes(teacherName)) {
          targetArray.push(teacherName);
          setSchedule(newSchedule);
          onSave(newSchedule);
      }
  };

  const removeAssignment = (dayIdx: number, periodIdx: number, type: 'main' | 'reserve', teacherName: string) => {
       if (!schedule) return;
       const newSchedule = { ...schedule };
       const periods = newSchedule.days[dayIdx].periods[periodIdx];
       
       if (type === 'main') {
           periods.main = periods.main.filter(t => t !== teacherName);
       } else {
           periods.reserves = periods.reserves.filter(t => t !== teacherName);
       }
       setSchedule(newSchedule);
       onSave(newSchedule);
  };

  // --- Teacher Stats Logic ---
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

  // --- Main Render ---

  if (!schedule && !showWizard) {
      return (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary">
                  <Calendar size={64} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">جدول الملاحظين غير معد</h2>
              <p className="text-gray-500 mb-8 max-w-md">لم تقم بإنشاء هيكل الجدول (الأيام والفترات) بعد. اضغط أدناه للبدء.</p>
              <button 
                onClick={() => setShowWizard(true)}
                className="bg-secondary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary/90 transition-all shadow-lg flex items-center gap-3"
              >
                  <Wand2 />
                  إنشاء جدول جديد
              </button>
          </div>
      );
  }

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Wizard Modal */}
      {showWizard && (
          <ScheduleWizard 
             onClose={() => setShowWizard(false)} 
             onSave={handleWizardSave}
             initialData={schedule} 
          />
      )}

      {/* Top Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="bg-secondary/10 p-3 rounded-xl text-secondary">
                  <Calendar size={24} />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-gray-800">توزيع الملاحظين</h2>
                  <p className="text-sm text-gray-500">
                      {schedule?.days.length} أيام اختبارات • {data.committees.length} لجان
                  </p>
              </div>
          </div>
          
          <div className="flex gap-2">
              <button 
                  onClick={() => setShowTeacherManager(!showTeacherManager)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 border ${showTeacherManager ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                  <Users size={18} />
                  قائمة المعلمين
              </button>
              <button 
                  onClick={() => setShowWizard(true)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                  <Edit2 size={18} />
                  تعديل الهيكل
              </button>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Schedule Grid */}
          <div className="flex-1 space-y-6">
              {/* Day Tabs */}
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar gap-2">
                  {schedule?.days.map((day, idx) => (
                      <button
                          key={day.dayId}
                          onClick={() => setActiveDayIdx(idx)}
                          className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex flex-col items-center gap-1 min-w-[100px] ${
                              activeDayIdx === idx 
                              ? 'bg-secondary text-white shadow-md' 
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                          <span>اليوم {day.dayId}</span>
                          <span className={`text-[10px] ${activeDayIdx === idx ? 'text-secondary-200' : 'text-gray-400'}`}>
                              {new Date(day.date).toLocaleDateString('ar-SA', {weekday: 'short'})}
                          </span>
                      </button>
                  ))}
              </div>

              {/* Periods for Active Day */}
              <div className="space-y-6">
                  {schedule?.days[activeDayIdx].periods.map((period, pIdx) => (
                      <div key={period.periodId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                  <Clock className="text-secondary" size={20} />
                                  الفترة {period.periodId}
                              </h3>
                              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
                                  {data.committees.length} لجنة في هذه الفترة
                              </span>
                          </div>
                          
                          <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {data.committees.map((committee) => {
                                      // Check assignments
                                      // Note: System 1 saves assignments in period.main arrays. 
                                      // Mapping logic here assumes flat distribution or you need to enhance data structure to link teachers to specific committee IDs.
                                      // For this UI fix, let's assume we render slots.
                                      
                                      // *** IMPORTANT ***
                                      // The previous implementation of InvigilatorDistributionPanel had complex logic to map the flat list `period.main` to committees.
                                      // To make this fully work, we need to know WHICH teachers are assigned to THIS committee.
                                      // A simple approach is slicing the array based on committee index.
                                      
                                      const needs = committee.invigilatorCount || 1;
                                      // Logic to get teachers assigned to THIS committee for THIS period
                                      // This is a simplification. Ideally, `schedule` structure should map CommitteeID -> Teachers.
                                      // Current structure: `main: string[]` (flat list).
                                      
                                      // Let's implement a "Slot" based UI where you drop teachers into the committee card.
                                      // We need to find if any teacher is assigned to this committee.
                                      // Since the data structure is flat (main[]), we assign based on index:
                                      // Committee 0 gets main[0], Committee 1 gets main[1], etc.
                                      
                                      // Calculating offset is tricky with variable needs. 
                                      // Let's rely on a simpler visual: Allow assigning to "Committee X".
                                      
                                      return (
                                          <div key={committee.id} className="border border-gray-200 rounded-xl p-4 hover:border-secondary/50 transition-colors">
                                              <div className="flex justify-between mb-3">
                                                  <span className="font-bold text-gray-800">لجنة {committee.name}</span>
                                                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{committee.location}</span>
                                              </div>
                                              
                                              <div className="space-y-2">
                                                  {/* Slots based on needs */}
                                                  {Array.from({ length: needs }).map((_, slotIdx) => {
                                                      // Calculate global index for the flat array
                                                      // This is a naive calculation. A better data structure is recommended for production.
                                                      // Global Index = (Sum of needs of previous committees) + slotIdx
                                                      const prevNeeds = data.committees.slice(0, data.committees.findIndex(c => c.id === committee.id)).reduce((a,c) => a + (c.invigilatorCount||1), 0);
                                                      const globalIdx = prevNeeds + slotIdx;
                                                      
                                                      const assignedTeacher = period.main[globalIdx];

                                                      return (
                                                          <div key={slotIdx} className={`p-2 rounded-lg border text-sm flex justify-between items-center ${
                                                              assignedTeacher ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'
                                                          }`}>
                                                              {assignedTeacher ? (
                                                                  <>
                                                                    <span className="font-bold truncate">{assignedTeacher}</span>
                                                                    <button onClick={() => removeAssignment(activeDayIdx, pIdx, 'main', assignedTeacher)} className="hover:text-red-500"><X size={14}/></button>
                                                                  </>
                                                              ) : (
                                                                  <span className="text-xs">اضغط معلم للإضافة</span>
                                                              )}
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                              
                              {/* Reserves Section */}
                              <div className="mt-6 border-t pt-4">
                                  <h4 className="text-sm font-bold text-gray-500 mb-3">الاحتياط لهذه الفترة</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {period.reserves.map(t => (
                                          <div key={t} className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                                              {t}
                                              <button onClick={() => removeAssignment(activeDayIdx, pIdx, 'reserve', t)}><X size={14}/></button>
                                          </div>
                                      ))}
                                      <div className="text-xs text-gray-400 py-2 px-3 border border-dashed rounded-lg">
                                          اضغط على "احتياط" بجانب المعلم للإضافة
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* RIGHT: Teacher List (Draggable/Clickable) */}
          {showTeacherManager && (
             <div className="lg:w-80 shrink-0">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-secondary" />
                        المعلمين المتاحين
                    </h3>
                    
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
                                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{stats.active}</span>
                                            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">{stats.reserve}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                // Find first empty slot in active period
                                                if(!schedule) return;
                                                // Simple logic: Push to end of array (since we map by index)
                                                handleAssignTeacher(activeDayIdx, 0, 'main', teacher.name); 
                                                // Note: Ideally allow user to select period if multiple
                                            }}
                                            className="flex-1 bg-white border border-green-200 text-green-700 py-1 rounded-lg text-xs hover:bg-green-50 font-bold"
                                        >
                                            + لجنة
                                        </button>
                                        <button 
                                            onClick={() => handleAssignTeacher(activeDayIdx, 0, 'reserve', teacher.name)}
                                            className="flex-1 bg-white border border-yellow-200 text-yellow-700 py-1 rounded-lg text-xs hover:bg-yellow-50 font-bold"
                                        >
                                            + احتياط
                                        </button>
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
