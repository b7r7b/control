import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Committee, ExamSchedule, DaySchedule, PeriodAssignment } from '../types';
import { Users, Wand2, Calendar, Save, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: AppData;
  onSave: (schedule: ExamSchedule) => void;
}

const InvigilatorDistributionPanel: React.FC<Props> = ({ data, onSave }) => {
  const [numDays, setNumDays] = useState(5);
  const [numPeriods, setNumPeriods] = useState(1);
  const [teachersPerComm, setTeachersPerComm] = useState(1);
  const [schedule, setSchedule] = useState<ExamSchedule | null>(data.schedule || null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Stats calculation
  const stats = useMemo(() => {
    const usage: Record<string, { active: number, reserve: number }> = {};
    data.teachers.forEach(t => usage[t] = { active: 0, reserve: 0 });

    if (schedule) {
      schedule.days.forEach(day => {
        day.periods.forEach(period => {
           period.main.forEach(t => {
             if (t) {
                if (!usage[t]) usage[t] = { active: 0, reserve: 0 };
                usage[t].active++;
             }
           });
           period.reserves.forEach(t => {
             if (t) {
                if (!usage[t]) usage[t] = { active: 0, reserve: 0 };
                usage[t].reserve++;
             }
           });
        });
      });
    }
    return usage;
  }, [schedule, data.teachers]);

  const generateSchedule = () => {
    if (data.committees.length === 0) {
      alert('يجب توزيع اللجان أولاً');
      return;
    }
    if (data.teachers.length === 0) {
      alert('لا يوجد معلمين للتوزيع');
      return;
    }

    const neededPerSlot = data.committees.length * teachersPerComm;
    if (data.teachers.length < neededPerSlot) {
      if (!confirm(`عدد المعلمين (${data.teachers.length}) أقل من المطلوب لكل فترة (${neededPerSlot}). سيتم ترك بعض اللجان فارغة. هل تريد الاستمرار؟`)) {
        return;
      }
    }

    // Fairness Logic: Track usage count to prioritize least used
    const teacherUsage: Record<string, number> = {};
    data.teachers.forEach(t => teacherUsage[t] = 0);

    const newDays: DaySchedule[] = [];

    for (let d = 0; d < numDays; d++) {
      const periods: PeriodAssignment[] = [];
      
      for (let p = 0; p < numPeriods; p++) {
        // Sort teachers by usage (Ascending) -> Least used comes first
        // Add random sort for teachers with same usage to shuffle them
        const sortedTeachers = [...data.teachers].sort((a, b) => {
          const usageDiff = teacherUsage[a] - teacherUsage[b];
          if (usageDiff !== 0) return usageDiff;
          return Math.random() - 0.5;
        });

        // Assign to Committees (Main)
        // Since we might need 2 teachers per committee, the main array size is committees * teachersPerComm
        // Logic: Main array stores raw teacher names sequentially. 
        // Index 0 to N-1 are for Committee 1 (if N=teachersPerComm)
        
        const main: string[] = [];
        let tIdx = 0;

        // Fill slots
        for (let c = 0; c < data.committees.length; c++) {
           for (let k = 0; k < teachersPerComm; k++) {
              if (tIdx < sortedTeachers.length) {
                const teacher = sortedTeachers[tIdx];
                main.push(teacher);
                teacherUsage[teacher]++; // Increment usage
                tIdx++;
              } else {
                main.push(''); // Empty slot if no teachers left
              }
           }
        }

        // Remaining go to Reserve
        const reserves = sortedTeachers.slice(tIdx);
        // We generally don't count reserve as "usage" for fairness in assignment, 
        // or we can count it with lower weight. Here we only count active duty.

        periods.push({
          periodId: p,
          main,
          reserves
        });
      }

      newDays.push({
        dayId: d,
        date: '', // User can fill manually later or we can add date picker
        periods
      });
    }

    const newSchedule: ExamSchedule = {
      days: newDays,
      teachersPerCommittee: teachersPerComm
    };

    setSchedule(newSchedule);
    onSave(newSchedule);
  };

  const handleManualChange = (dayIdx: number, periodIdx: number, type: 'main' | 'reserve', arrayIdx: number, newValue: string) => {
    if (!schedule) return;
    const newSched = { ...schedule };
    const period = newSched.days[dayIdx].periods[periodIdx];

    if (type === 'main') {
        period.main[arrayIdx] = newValue;
    } else {
        // Handle reserve change
        if (newValue === '') {
             // Remove
             period.reserves.splice(arrayIdx, 1);
        } else {
             period.reserves[arrayIdx] = newValue;
        }
    }
    setSchedule(newSched);
    onSave(newSched);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Settings Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-6 items-end">
        <div>
           <label className="block text-xs font-bold text-gray-500 mb-1">عدد الأيام</label>
           <input type="number" min="1" max="20" value={numDays} onChange={(e) => setNumDays(Number(e.target.value))} className="w-20 rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-bold text-center" />
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 mb-1">الفترات يومياً</label>
           <select value={numPeriods} onChange={(e) => setNumPeriods(Number(e.target.value))} className="w-24 rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-bold">
             <option value="1">فترة واحدة</option>
             <option value="2">فترتين</option>
             <option value="3">3 فترات</option>
           </select>
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 mb-1">ملاحظين بكل لجنة</label>
           <select value={teachersPerComm} onChange={(e) => setTeachersPerComm(Number(e.target.value))} className="w-24 rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-bold">
             <option value="1">1 ملاحظ</option>
             <option value="2">2 ملاحظين</option>
           </select>
        </div>
        <button 
           onClick={generateSchedule}
           className="bg-secondary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-opacity-90 transition flex items-center gap-2"
        >
           <Wand2 className="w-4 h-4" /> توزيع عادل تلقائي
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Main Schedule Area */}
         <div className="lg:col-span-3 space-y-4">
            {schedule ? (
                <>
                    {/* Day Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {schedule.days.map((d, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveDayIdx(idx)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                    activeDayIdx === idx 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                اليوم {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* Schedule Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" /> جدول توزيع اليوم {activeDayIdx + 1}
                             </h3>
                             <div className="text-xs text-gray-400">
                                يتم الحفظ تلقائياً عند التعديل
                             </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-center">
                                <thead className="bg-gray-100 text-gray-600 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-3 w-16 sticky right-0 bg-gray-100 border-l z-10">اللجنة</th>
                                        {Array.from({length: schedule.days[activeDayIdx].periods.length}).map((_, pIdx) => (
                                            <th key={pIdx} className="p-3 border-l min-w-[200px]">
                                                الفترة {pIdx + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.committees.map((comm, cIdx) => (
                                        <tr key={comm.id} className="hover:bg-gray-50/50">
                                            <td className="p-3 font-bold bg-white sticky right-0 border-l z-10 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span>{comm.name}</span>
                                                    <span className="text-[9px] font-normal text-gray-400">{comm.location}</span>
                                                </div>
                                            </td>
                                            {schedule.days[activeDayIdx].periods.map((period, pIdx) => (
                                                <td key={pIdx} className="p-2 border-l align-top">
                                                    <div className="flex flex-col gap-1">
                                                        {Array.from({length: schedule.teachersPerCommittee}).map((_, tOffset) => {
                                                            const flatIdx = (cIdx * schedule.teachersPerCommittee) + tOffset;
                                                            const assigned = period.main[flatIdx] || '';
                                                            return (
                                                                <select
                                                                    key={tOffset}
                                                                    value={assigned}
                                                                    onChange={(e) => handleManualChange(activeDayIdx, pIdx, 'main', flatIdx, e.target.value)}
                                                                    className={`w-full text-xs p-1.5 rounded border ${assigned ? 'bg-white border-gray-300' : 'bg-red-50 border-red-200'} focus:ring-1 focus:ring-primary`}
                                                                >
                                                                    <option value="" className="text-gray-300">-- فارغ --</option>
                                                                    {data.teachers.map((t, i) => (
                                                                        <option key={i} value={t}>{t}</option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {/* Reserves Row */}
                                    <tr className="bg-yellow-50/30 border-t-2 border-gray-100">
                                        <td className="p-3 font-bold text-yellow-700 text-xs sticky right-0 bg-yellow-50/30 border-l z-10">الاحتياط</td>
                                        {schedule.days[activeDayIdx].periods.map((period, pIdx) => (
                                            <td key={pIdx} className="p-2 border-l align-top">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {period.reserves.map((res, rIdx) => (
                                                        <span key={rIdx} className="bg-white border border-yellow-200 text-gray-700 px-2 py-1 rounded-md text-[10px] shadow-sm flex items-center gap-1">
                                                            {res}
                                                        </span>
                                                    ))}
                                                    {period.reserves.length === 0 && <span className="text-gray-400 text-[10px]">- لا يوجد -</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <Wand2 className="w-10 h-10 mb-2 opacity-20" />
                    <p>قم بتوليد الجدول لبدء التوزيع</p>
                </div>
            )}
         </div>

         {/* Stats Sidebar */}
         <div className="space-y-4">
             <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm h-full max-h-[600px] overflow-y-auto">
                <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" /> عداد المعلمين
                </h4>
                <div className="space-y-2">
                    {data.teachers.map((teacher, idx) => {
                        const s = stats[teacher] || { active: 0, reserve: 0 };
                        return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                <span className="font-bold text-gray-700 truncate w-24" title={teacher}>{teacher}</span>
                                <div className="flex gap-2">
                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded" title="عدد اللجان">
                                        {s.active} لجان
                                    </span>
                                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded" title="عدد الاحتياط">
                                        {s.reserve} احتياط
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default InvigilatorDistributionPanel;
