import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Save, Wand2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { ExamSchedule, Stage, SubjectDetail } from '../types';

interface ScheduleWizardProps {
  stages: Stage[];
  onSave: (schedule: ExamSchedule) => void;
  onClose: () => void;
  initialData?: ExamSchedule | null;
}

interface WizardDay {
  id: string;
  date: string;
  periods: { 
      id: number; 
      start: string; 
      end: string;
      subjects: Record<string, SubjectDetail>;
  }[];
}

const ScheduleWizard: React.FC<ScheduleWizardProps> = ({ stages, onSave, onClose, initialData }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<WizardDay[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && initialData.days.length > 0) {
      const loadedDays = initialData.days.map((d, idx) => ({
        id: `day-${idx}`,
        date: d.date,
        periods: d.periods.map((p, pIdx) => ({
          id: pIdx + 1,
          start: '07:30',
          end: '10:00',
          subjects: p.subjects || {} 
        }))
      }));
      setDays(loadedDays);
    } else {
      generateDefaultDays(startDate, 5);
    }
  }, []);

  const generateDefaultDays = (start: string, count: number) => {
    const newDays: WizardDay[] = [];
    const dateObj = new Date(start);
    for (let i = 0; i < count; i++) {
      if (dateObj.getDay() === 5) dateObj.setDate(dateObj.getDate() + 1);
      if (dateObj.getDay() === 6) dateObj.setDate(dateObj.getDate() + 1);
      newDays.push({
        id: `day-${Date.now()}-${i}`,
        date: dateObj.toISOString().split('T')[0],
        periods: [{ id: 1, start: '07:30', end: '10:00', subjects: {} }]
      });
      dateObj.setDate(dateObj.getDate() + 1);
    }
    setDays(newDays);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (days.length === 0) generateDefaultDays(newStart, 5);
    else {
        const dateObj = new Date(newStart);
        const updatedDays = days.map(day => {
            if (dateObj.getDay() === 5) dateObj.setDate(dateObj.getDate() + 1);
            if (dateObj.getDay() === 6) dateObj.setDate(dateObj.getDate() + 1);
            const dateStr = dateObj.toISOString().split('T')[0];
            dateObj.setDate(dateObj.getDate() + 1);
            return { ...day, date: dateStr };
        });
        setDays(updatedDays);
    }
  };

  const addDay = () => {
    const lastDay = days.length > 0 ? new Date(days[days.length - 1].date) : new Date(startDate);
    lastDay.setDate(lastDay.getDate() + 1);
    if (lastDay.getDay() === 5) lastDay.setDate(lastDay.getDate() + 1);
    if (lastDay.getDay() === 6) lastDay.setDate(lastDay.getDate() + 1);

    setDays([...days, {
      id: `day-${Date.now()}`,
      date: lastDay.toISOString().split('T')[0],
      periods: [{ id: 1, start: '07:30', end: '10:00', subjects: {} }]
    }]);
  };

  const removeDay = (index: number) => {
    const newDays = [...days];
    newDays.splice(index, 1);
    setDays(newDays);
  };

  const addPeriod = (dayIndex: number) => {
    const newDays = [...days];
    const currentPeriods = newDays[dayIndex].periods;
    if (currentPeriods.length >= 3) return;
    
    let newStart = '10:30'; let newEnd = '12:30';
    if (currentPeriods.length === 1) { newStart = '10:30'; newEnd = '12:30'; }
    else if (currentPeriods.length === 2) { newStart = '13:00'; newEnd = '14:30'; }

    currentPeriods.push({
        id: currentPeriods.length + 1,
        start: newStart,
        end: newEnd,
        subjects: {}
    });
    setDays(newDays);
  };

  const removePeriod = (dayIndex: number, periodIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].periods.splice(periodIndex, 1);
    newDays[dayIndex].periods = newDays[dayIndex].periods.map((p, idx) => ({...p, id: idx + 1}));
    setDays(newDays);
  };

  const updateSubject = (dayIdx: number, pIdx: number, stageName: string, field: keyof SubjectDetail, value: string) => {
      const newDays = [...days];
      const period = newDays[dayIdx].periods[pIdx];
      
      if (!period.subjects[stageName]) {
          period.subjects[stageName] = { name: '', startTime: period.start, endTime: period.end };
      }
      
      period.subjects[stageName] = { ...period.subjects[stageName], [field]: value };
      
      if (field === 'name' && value === '') delete period.subjects[stageName];
      setDays(newDays);
  };

  const handleSave = () => {
    const formattedSchedule: ExamSchedule = {
      teachersPerCommittee: 1,
      days: days.map((day, idx) => ({
        dayId: idx + 1,
        date: day.date,
        periods: day.periods.map(p => ({
          periodId: p.id,
          main: [],
          reserves: [],
          subjects: p.subjects
        }))
      }))
    };
    onSave(formattedSchedule);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        <div className="bg-secondary p-6 rounded-t-2xl flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Calendar className="w-6 h-6" /> معالج الجدول وتوزيع المواد
            </h3>
            <p className="text-secondary-100 text-sm mt-1">حدد التواريخ، الفترات، وأوقات المواد لكل مرحلة بشكل مستقل.</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Wand2 size={24} /></div>
            <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">بداية الاختبارات</label>
                <input type="date" value={startDate} onChange={handleStartDateChange} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
          </div>

          <div className="space-y-4">
            {days.map((day, dayIndex) => (
              <div key={day.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b">
                   <div className="flex items-center gap-3">
                       <span className="bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{dayIndex + 1}</span>
                       <input type="date" value={day.date} onChange={(e) => { const nd = [...days]; nd[dayIndex].date = e.target.value; setDays(nd); }} className="bg-transparent font-bold text-gray-700 focus:outline-none" />
                       <span className="text-xs text-gray-400">{new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'long' })}</span>
                   </div>
                   <div className="flex gap-2">
                       <button onClick={() => addPeriod(dayIndex)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14} /> فترة</button>
                       <button onClick={() => removeDay(dayIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                   </div>
                </div>

                <div className="p-4 grid grid-cols-1 gap-3">
                    {day.periods.map((period, pIdx) => {
                        const uniqueKey = `${day.id}-p${period.id}`;
                        const isExpanded = expandedSubjects === uniqueKey;
                        const subjectCount = Object.keys(period.subjects).length;

                        return (
                            <div key={pIdx} className="border border-gray-200 rounded-xl p-3 bg-gray-50 hover:border-secondary/30 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-white bg-secondary px-2 py-1 rounded">فترة {period.id}</span>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs bg-white px-2 py-1 rounded border">
                                            <Clock size={12} />
                                            <span>الوقت العام: {period.start} - {period.end}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setExpandedSubjects(isExpanded ? null : uniqueKey)}
                                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${subjectCount > 0 ? 'bg-green-50 text-green-700 border-green-200 font-bold' : 'bg-white text-gray-500 border-gray-200'}`}
                                        >
                                            <BookOpen size={14} />
                                            {subjectCount > 0 ? `تم تحديد ${subjectCount} مواد` : 'تحديد المواد والوقت'}
                                            {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        </button>
                                        <button onClick={() => removePeriod(dayIndex, pIdx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-3 bg-white p-4 rounded-lg border border-gray-200 shadow-inner animate-fade-in">
                                        <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 font-bold mb-2 px-1">
                                            <div className="col-span-3">المرحلة</div>
                                            <div className="col-span-5">اسم المادة</div>
                                            <div className="col-span-2 text-center">بداية</div>
                                            <div className="col-span-2 text-center">نهاية</div>
                                        </div>
                                        <div className="space-y-2">
                                            {stages.length === 0 && <p className="text-xs text-red-500 text-center py-2">لا توجد مراحل مضافة.</p>}
                                            {stages.map(stage => {
                                                const sub = period.subjects[stage.name];
                                                return (
                                                    <div key={stage.id} className="grid grid-cols-12 gap-2 items-center">
                                                        <div className="col-span-3 text-xs font-bold text-gray-700 truncate">{stage.name}</div>
                                                        <div className="col-span-5">
                                                            <input type="text" placeholder="اسم المادة..." value={sub?.name || ''} onChange={(e) => updateSubject(dayIndex, pIdx, stage.name, 'name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-secondary outline-none" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input type="time" value={sub?.startTime || period.start} onChange={(e) => updateSubject(dayIndex, pIdx, stage.name, 'startTime', e.target.value)} className="w-full border border-gray-300 rounded px-1 py-1.5 text-xs text-center font-mono focus:border-secondary outline-none" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input type="time" value={sub?.endTime || period.end} onChange={(e) => updateSubject(dayIndex, pIdx, stage.name, 'endTime', e.target.value)} className="w-full border border-gray-300 rounded px-1 py-1.5 text-xs text-center font-mono focus:border-secondary outline-none" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addDay} className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-secondary hover:border-secondary flex items-center justify-center gap-2 font-bold transition-all"><Plus size={20} /> إضافة يوم جديد</button>
        </div>

        <div className="p-4 bg-white border-t rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100">إلغاء</button>
            <button onClick={handleSave} className="px-8 py-3 rounded-xl font-bold text-white bg-secondary hover:bg-secondary-500 shadow-lg flex items-center gap-2"><Save size={20} /> حفظ الجدول</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWizard;
