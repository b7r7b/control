import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Save, Wand2 } from 'lucide-react';
import { ExamSchedule, DaySchedule } from '../types';

interface ScheduleWizardProps {
  onSave: (schedule: ExamSchedule) => void;
  onClose: () => void;
  initialData?: ExamSchedule | null;
}

// هيكل مؤقت للتعامل مع الواجهة
interface WizardDay {
  id: string;
  date: string;
  periods: { id: number; start: string; end: string }[];
}

const ScheduleWizard: React.FC<ScheduleWizardProps> = ({ onSave, onClose, initialData }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<WizardDay[]>([]);

  // تهيئة البيانات عند الفتح
  useEffect(() => {
    if (initialData && initialData.days.length > 0) {
      // إذا كان هناك جدول سابق، قم بتحميله
      const loadedDays = initialData.days.map((d, idx) => ({
        id: `day-${idx}`,
        date: d.date,
        periods: d.periods.map((p, pIdx) => ({
          id: pIdx + 1,
          start: '07:30', // قيم افتراضية إذا لم تكن مخزنة
          end: '10:00'
        }))
      }));
      setDays(loadedDays);
    } else {
      // إعداد افتراضي (5 أيام)
      generateDefaultDays(startDate, 5);
    }
  }, []);

  const generateDefaultDays = (start: string, count: number) => {
    const newDays: WizardDay[] = [];
    const dateObj = new Date(start);
    
    for (let i = 0; i < count; i++) {
      // تخطي الجمعة والسبت
      if (dateObj.getDay() === 5) dateObj.setDate(dateObj.getDate() + 1); // جمعة -> سبت
      if (dateObj.getDay() === 6) dateObj.setDate(dateObj.getDate() + 1); // سبت -> أحد

      newDays.push({
        id: `day-${Date.now()}-${i}`,
        date: dateObj.toISOString().split('T')[0],
        periods: [{ id: 1, start: '07:30', end: '10:00' }] // فترة واحدة افتراضياً
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
        // تحديث التواريخ فقط مع الحفاظ على الفترات
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
    // Skip weekend check for simplicity or add if needed
    if (lastDay.getDay() === 5) lastDay.setDate(lastDay.getDate() + 1);
    if (lastDay.getDay() === 6) lastDay.setDate(lastDay.getDate() + 1);

    setDays([...days, {
      id: `day-${Date.now()}`,
      date: lastDay.toISOString().split('T')[0],
      periods: [{ id: 1, start: '07:30', end: '10:00' }]
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
    if (currentPeriods.length >= 3) return; // حد أقصى 3 فترات
    
    // تحديد وقت ذكي للفترة الجديدة
    let newStart = '10:30';
    let newEnd = '12:30';
    if (currentPeriods.length === 1) {
        newStart = '10:30'; newEnd = '12:30';
    } else if (currentPeriods.length === 2) {
        newStart = '13:00'; newEnd = '14:30';
    }

    currentPeriods.push({
        id: currentPeriods.length + 1,
        start: newStart,
        end: newEnd
    });
    setDays(newDays);
  };

  const removePeriod = (dayIndex: number, periodIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].periods.splice(periodIndex, 1);
    // إعادة ترتيب أرقام الفترات
    newDays[dayIndex].periods = newDays[dayIndex].periods.map((p, idx) => ({...p, id: idx + 1}));
    setDays(newDays);
  };

  const updateDayDate = (index: number, newDate: string) => {
    const newDays = [...days];
    newDays[index].date = newDate;
    setDays(newDays);
  };

  const handleSave = () => {
    // تحويل البيانات لهيكل النظام الأول
    const formattedSchedule: ExamSchedule = {
      teachersPerCommittee: 1, // قيمة افتراضية
      days: days.map((day, idx) => ({
        dayId: idx + 1,
        date: day.date,
        periods: day.periods.map(p => ({
          periodId: p.id,
          main: [], // سيتم تعبئتها في اللوحة
          reserves: []
        }))
      }))
    };
    onSave(formattedSchedule);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-secondary p-6 rounded-t-2xl flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              معالج بناء الجدول
            </h3>
            <p className="text-secondary-100 text-sm mt-1">حدد الأيام والفترات بدقة ليتم إنشاء جداول الملاحظين بناءً عليها</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          
          {/* Start Date Control */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Wand2 size={24} />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ بداية الاختبارات</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs focus:ring-2 focus:ring-secondary/50 outline-none"
                />
            </div>
            <button 
                onClick={() => generateDefaultDays(startDate, 5)}
                className="text-sm text-gray-500 hover:text-secondary underline"
            >
                إعادة تعيين (5 أيام)
            </button>
          </div>

          {/* Days Grid */}
          <div className="space-y-4">
            {days.map((day, dayIndex) => (
              <div key={day.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                   <div className="flex items-center gap-3">
                       <span className="bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                           {dayIndex + 1}
                       </span>
                       <input 
                         type="date"
                         value={day.date}
                         onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                         className="bg-transparent font-bold text-gray-700 focus:outline-none"
                       />
                       <span className="text-xs text-gray-400">
                           {new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'long' })}
                       </span>
                   </div>
                   <div className="flex items-center gap-2">
                       <button 
                         onClick={() => addPeriod(dayIndex)}
                         className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                         title="إضافة فترة جديدة لهذا اليوم"
                       >
                           <Plus size={14} /> إضافة فترة
                       </button>
                       <button 
                         onClick={() => removeDay(dayIndex)}
                         className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                         title="حذف اليوم بالكامل"
                       >
                           <Trash2 size={16} />
                       </button>
                   </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {day.periods.map((period, pIdx) => (
                        <div key={pIdx} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-gray-50 group">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 bg-white border px-2 py-1 rounded">
                                    فترة {period.id}
                                </span>
                                <div className="flex items-center gap-1 text-gray-600 text-sm">
                                    <Clock size={14} />
                                    <span>{period.start} - {period.end}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => removePeriod(dayIndex, pIdx)}
                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    {day.periods.length === 0 && (
                        <div className="text-red-400 text-xs py-2">يجب إضافة فترة واحدة على الأقل</div>
                    )}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={addDay}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all flex items-center justify-center gap-2 font-bold"
          >
              <Plus size={20} /> إضافة يوم جديد
          </button>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
                إلغاء
            </button>
            <button 
                onClick={handleSave}
                className="px-8 py-3 rounded-xl font-bold text-white bg-secondary hover:bg-secondary-500 transition-colors shadow-lg flex items-center gap-2"
            >
                <Save size={20} />
                اعتماد وبناء الجدول
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWizard;
