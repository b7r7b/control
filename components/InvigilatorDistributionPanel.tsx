import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, ExamSchedule, DaySchedule, PeriodAssignment, Teacher } from '../types';
import { Users, Wand2, Calendar, RotateCcw, ChevronDown, ChevronUp, MessageCircle, UserPlus, Upload, Trash2, X, ClipboardPaste, Printer, Share2, Send, CheckCircle, ExternalLink, Play, Square } from 'lucide-react';
import { readExcelFile, getSheetData } from '../services/excelService';

interface Props {
  data: AppData;
  onSave: (schedule: ExamSchedule) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
}

const InvigilatorDistributionPanel: React.FC<Props> = ({ data, onSave, onUpdateTeachers }) => {
  // Distribution Logic State
  const [numDays, setNumDays] = useState(5);
  const [numPeriods, setNumPeriods] = useState(1);
  const [teachersPerComm, setTeachersPerComm] = useState(1);
  const [schedule, setSchedule] = useState<ExamSchedule | null>(data.schedule || null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Teacher Management State
  const [showTeacherManager, setShowTeacherManager] = useState(true);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  
  // Paste Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedContent, setPastedContent] = useState('');

  // WhatsApp Batch Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTargetDay, setWhatsAppTargetDay] = useState<number>(0);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});
  
  // Auto Send State
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoSendList, setAutoSendList] = useState<Teacher[]>([]);
  const [autoSendIndex, setAutoSendIndex] = useState(0);

  // Stats calculation
  const stats = useMemo(() => {
    const usage: Record<string, { active: number, reserve: number }> = {};
    data.teachers.forEach(t => usage[t.name] = { active: 0, reserve: 0 });

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

  // --- Auto Send Effect ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isAutoSending && autoSendList.length > 0) {
        if (autoSendIndex < autoSendList.length) {
            timer = setTimeout(() => {
                const teacher = autoSendList[autoSendIndex];
                openWhatsAppLink(teacher, whatsAppTargetDay);
                setAutoSendIndex(prev => prev + 1);
            }, 1500); // 1.5 seconds delay between sends
        } else {
            setIsAutoSending(false);
            alert('تم الانتهاء من الإرسال التلقائي للجميع.');
        }
    }

    return () => clearTimeout(timer);
  }, [isAutoSending, autoSendIndex, autoSendList]);

  const startAutoSend = () => {
    // Filter teachers who have tasks AND valid phones
    const list = data.teachers.filter(t => t.phone && generateWhatsAppMessage(t, whatsAppTargetDay) !== '');
    
    if (list.length === 0) {
        alert('لا يوجد معلمين لإرسال الرسائل لهم في هذا اليوم.');
        return;
    }

    if (!confirm(`سيتم فتح ${list.length} نافذة واتساب بشكل متتابع.\n\nهام: تأكد من السماح للنوافذ المنبثقة (Pop-ups) في متصفحك لهذا الموقع.\n\nهل تريد البدء؟`)) {
        return;
    }

    setAutoSendList(list);
    setAutoSendIndex(0);
    setIsAutoSending(true);
  };

  const stopAutoSend = () => {
      setIsAutoSending(false);
      setAutoSendIndex(0);
  };


  // --- Teacher Management Functions ---
  const addTeacher = () => {
    if (newTeacherName.trim()) {
      const teacher: Teacher = {
          name: newTeacherName.trim(),
          phone: newTeacherPhone.trim()
      };
      // Prevent Duplicates by name
      if (data.teachers.some(t => t.name === teacher.name)) {
          alert('هذا الاسم موجود بالفعل');
          return;
      }
      onUpdateTeachers([...data.teachers, teacher]);
      setNewTeacherName('');
      setNewTeacherPhone('');
    }
  };

  const removeTeacher = (index: number) => {
      if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
        const updated = data.teachers.filter((_, i) => i !== index);
        onUpdateTeachers(updated);
      }
  };

  const clearAllTeachers = () => {
      if (confirm('هل أنت متأكد من حذف جميع المعلمين؟ سيتم فقدان البيانات الحالية.')) {
          onUpdateTeachers([]);
      }
  };

  const handleTeacherImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const wb = await readExcelFile(e.target.files[0]);
        if (wb.SheetNames.length > 0) {
            const sheetData = getSheetData(wb, wb.SheetNames[0]);
            let nameIdx = 0;
            let phoneIdx = -1;
            
            if (sheetData.length > 0) {
                const header = sheetData[0].map((c: any) => String(c).toLowerCase());
                header.forEach((h, i) => {
                    if (h.includes('اسم')) nameIdx = i;
                    if (h.includes('جوال') || h.includes('هاتف') || h.includes('phone')) phoneIdx = i;
                });
            }

            const newTeachers: Teacher[] = [];
            for(let i=1; i<sheetData.length; i++) {
                const row = sheetData[i];
                if (row && row[nameIdx]) {
                    const name = String(row[nameIdx]).trim();
                    const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
                    
                    if (name && name !== 'الاسم' && !data.teachers.some(t => t.name === name) && !newTeachers.some(t => t.name === name)) {
                        newTeachers.push({ name, phone });
                    }
                }
            }
            if (newTeachers.length > 0) {
                onUpdateTeachers([...data.teachers, ...newTeachers]);
                alert(`تم استيراد ${newTeachers.length} معلم بنجاح`);
            } else {
                alert('لم يتم العثور على بيانات جديدة.');
            }
        }
      } catch (err) {
        alert('فشل قراءة الملف');
      }
    }
  };
  
  const handlePasteProcess = () => {
      if (!pastedContent.trim()) return;
      
      const lines = pastedContent.trim().split(/\r?\n/);
      const newTeachers: Teacher[] = [];
      let skippedCount = 0;
      
      lines.forEach(line => {
          let parts = line.split('\t');
          if (parts.length < 2 && line.includes(',')) {
              parts = line.split(',');
          }
          
          if (parts.length >= 1) {
               let name = parts[0].trim();
               name = name.replace(/^[\d-.\s]+/, '');
               
               let phone = '';
               if (parts.length > 1) {
                   phone = parts[1].trim();
               }
               
               if (/^\d+$/.test(name) && !/^\d+$/.test(phone) && phone.length > 0) {
                   const temp = name;
                   name = phone;
                   phone = temp;
               }

               if (name && name.length > 1) {
                   if (!data.teachers.some(t => t.name === name) && !newTeachers.some(t => t.name === name)) {
                       newTeachers.push({ name, phone });
                   } else {
                       skippedCount++;
                   }
               }
          }
      });
  
      if (newTeachers.length > 0) {
          onUpdateTeachers([...data.teachers, ...newTeachers]);
          alert(`تم إضافة ${newTeachers.length} معلم بنجاح.${skippedCount > 0 ? ` (تم تخطي ${skippedCount} للتكرار)` : ''}`);
          setPastedContent('');
          setShowPasteModal(false);
      } else {
          alert('لم يتم العثور على بيانات جديدة صالحة.');
      }
  };

  // --- Schedule Logic ---

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

    const teacherUsage: Record<string, number> = {};
    data.teachers.forEach(t => teacherUsage[t.name] = 0);

    const newDays: DaySchedule[] = [];

    for (let d = 0; d < numDays; d++) {
      const periods: PeriodAssignment[] = [];
      
      for (let p = 0; p < numPeriods; p++) {
        const sortedTeachers = [...data.teachers].sort((a, b) => {
          const usageDiff = teacherUsage[a.name] - teacherUsage[b.name];
          if (usageDiff !== 0) return usageDiff;
          return Math.random() - 0.5;
        });

        const main: string[] = [];
        let tIdx = 0;

        for (let c = 0; c < data.committees.length; c++) {
           for (let k = 0; k < teachersPerComm; k++) {
              if (tIdx < sortedTeachers.length) {
                const teacher = sortedTeachers[tIdx];
                main.push(teacher.name);
                teacherUsage[teacher.name]++;
                tIdx++;
              } else {
                main.push('');
              }
           }
        }
        const reserves = sortedTeachers.slice(tIdx).map(t => t.name);
        periods.push({ periodId: p, main, reserves });
      }
      newDays.push({ dayId: d, date: '', periods });
    }

    const newSchedule: ExamSchedule = { days: newDays, teachersPerCommittee: teachersPerComm };
    setSchedule(newSchedule);
    onSave(newSchedule);
  };

  const handleManualChange = (dayIdx: number, periodIdx: number, type: 'main' | 'reserve', arrayIdx: number, newValue: string) => {
    if (!schedule) return;
    const newSched = { ...schedule };
    const period = newSched.days[dayIdx].periods[periodIdx];
    if (type === 'main') period.main[arrayIdx] = newValue;
    else if (newValue === '') period.reserves.splice(arrayIdx, 1);
    else period.reserves[arrayIdx] = newValue;
    setSchedule(newSched);
    onSave(newSched);
  };

  // --- Output Functions (Print & WhatsApp) ---

  const handlePrintSchedule = (specificDayIdx: number | null = null) => {
    if (!schedule) return;

    const daysToPrint = specificDayIdx !== null ? [schedule.days[specificDayIdx]] : schedule.days;
    let htmlContent = '';

    daysToPrint.forEach((day, dIdx) => {
        const actualDayIndex = specificDayIdx !== null ? specificDayIdx : dIdx;
        let dayHtml = `
            <div style="page-break-after: always; direction: rtl; font-family: 'Tajawal', sans-serif;">
                <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">جدول توزيع الملاحظين - اليوم ${actualDayIndex + 1}</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; text-align: center;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid #000; padding: 5px;">اللجنة</th>
                            <th style="border: 1px solid #000; padding: 5px;">المقر</th>
                            ${day.periods.map((_, i) => `
                                <th style="border: 1px solid #000; padding: 5px;">الفترة ${i+1}</th>
                                <th style="border: 1px solid #000; padding: 5px; width: 60px;">التوقيع</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Print Main Committees
        data.committees.forEach((comm, cIdx) => {
            dayHtml += `<tr>
                <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${comm.name}</td>
                <td style="border: 1px solid #000; padding: 5px;">${comm.location}</td>`;
            
            day.periods.forEach(period => {
                const teachers = [];
                for(let k=0; k<schedule.teachersPerCommittee; k++) {
                    const t = period.main[(cIdx * schedule.teachersPerCommittee) + k];
                    if (t) teachers.push(t);
                }
                dayHtml += `
                    <td style="border: 1px solid #000; padding: 5px;">${teachers.join(' - ')}</td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                `;
            });
            dayHtml += `</tr>`;
        });

        // Calculate maximum reserves depth for this day to create enough rows
        const maxReserves = day.periods.reduce((max, p) => Math.max(max, p.reserves.length), 0);
        
        // Print Reserves (Separate Rows)
        if (maxReserves > 0) {
             for (let r = 0; r < maxReserves; r++) {
                 dayHtml += `<tr style="background-color: #fffde7;">
                    <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">الاحتياط ${r + 1}</td>
                    <td style="border: 1px solid #000; padding: 5px;">-</td>
                 `;
                 
                 day.periods.forEach(period => {
                     const teacher = period.reserves[r] || '';
                     dayHtml += `
                        <td style="border: 1px solid #000; padding: 5px; color: ${teacher ? 'black' : '#ccc'}">${teacher}</td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                     `;
                 });
                 dayHtml += `</tr>`;
             }
        }

        dayHtml += `</tbody></table>
        <div style="margin-top: 30px; display: flex; justify-content: space-between; font-weight: bold;">
            <div>مسؤول الجدول: ....................</div>
            <div>مدير المدرسة: ....................</div>
        </div>
        </div>`;
        htmlContent += dayHtml;
    });

    const w = window.open('', '_blank');
    if (w) {
        w.document.write(`<html><head><title>جدول التوزيع</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700&display=swap" rel="stylesheet"></head><body>${htmlContent}</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 500);
    }
  };

  const generateWhatsAppMessage = (teacher: Teacher, dayIdx: number) => {
    if (!schedule) return '';
    const day = schedule.days[dayIdx];
    const dayName = `اليوم ${dayIdx + 1}`;
    let tasks: string[] = [];
    
    day.periods.forEach((p, pIdx) => {
        // Check Main
        p.main.forEach((assignedName, idx) => {
            if (assignedName === teacher.name) {
                const commIdx = Math.floor(idx / schedule.teachersPerCommittee);
                const committee = data.committees[commIdx];
                tasks.push(`- الفترة ${pIdx + 1}: لجنة ${committee ? committee.name : '؟'} (${committee ? committee.location : ''})`);
            }
        });
        // Check Reserve
        if (p.reserves.includes(teacher.name)) {
             tasks.push(`- الفترة ${pIdx + 1}: **احتياط**`);
        }
    });

    if (tasks.length === 0) return '';

    return `السلام عليكم أ. ${teacher.name}
إليك جدول الملاحظة الخاص بك لـ *${dayName}*:

${tasks.join('\n')}

مع التحية، إدارة ${data.school.name}`;
  };

  const openWhatsAppLink = (teacher: Teacher, dayIdx: number) => {
      const msg = generateWhatsAppMessage(teacher, dayIdx);
      if (!msg) {
          return;
      }
      
      let phone = teacher.phone.replace(/\s/g, '').replace(/-/g, '');
      if (phone.startsWith('05')) phone = '966' + phone.substring(1);
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      
      setSentStatus(prev => ({...prev, [`${dayIdx}-${teacher.name}`]: true}));
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardPaste className="w-5 h-5 text-purple-600" /> لصق بيانات المعلمين
                    </h3>
                    <button onClick={() => setShowPasteModal(false)} className="text-gray-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="font-bold mb-1">تعليمات:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>انسخ الجدول من Excel أو Word.</li>
                        <li>تأكد أن <strong>العمود الأول</strong> هو الاسم.</li>
                        <li>تأكد أن <strong>العمود الثاني</strong> (اختياري) هو رقم الجوال.</li>
                    </ul>
                </div>

                <textarea
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder={`مثال:\nمحمد احمد\t0500000000\nخالد علي\t0555555555`}
                    className="w-full h-48 p-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono mb-4"
                />

                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setShowPasteModal(false)}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handlePasteProcess}
                        disabled={!pastedContent.trim()}
                        className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        معالجة وإضافة
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* WhatsApp Batch Modal */}
      {showWhatsAppModal && schedule && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">إرسال الجداول عبر واتساب</h3>
                            <p className="text-xs text-gray-500">يمكنك إرسال الجدول لكل يوم بشكل مستقل</p>
                        </div>
                    </div>
                    <button onClick={() => { setShowWhatsAppModal(false); stopAutoSend(); }} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-4 border-b bg-white flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-700 text-sm">حدد اليوم للإرسال:</span>
                        <div className="flex gap-2">
                            {schedule.days.map((d, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setWhatsAppTargetDay(idx); stopAutoSend(); }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition ${
                                        whatsAppTargetDay === idx 
                                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    اليوم {idx + 1}
                                </button>
                            ))}
                        </div>
                     </div>
                     
                     {/* Auto Send Controls */}
                     <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <div className="text-sm text-blue-800 font-medium flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            {isAutoSending 
                                ? `جاري الإرسال التلقائي... (${autoSendIndex} / ${autoSendList.length})`
                                : 'يمكنك الإرسال بشكل آلي لجميع المعلمين في القائمة أدناه'}
                        </div>
                        
                        {!isAutoSending ? (
                            <button 
                                onClick={startAutoSend}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm animate-pulse"
                            >
                                <Play className="w-4 h-4" /> بدء الإرسال التلقائي
                            </button>
                        ) : (
                            <button 
                                onClick={stopAutoSend}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition flex items-center gap-2 shadow-sm"
                            >
                                <Square className="w-4 h-4 fill-current" /> إيقاف
                            </button>
                        )}
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {data.teachers
                            .filter(t => t.phone && generateWhatsAppMessage(t, whatsAppTargetDay) !== '')
                            .map((teacher, i) => {
                                const isSent = sentStatus[`${whatsAppTargetDay}-${teacher.name}`];
                                const isNext = isAutoSending && autoSendList[autoSendIndex]?.name === teacher.name;
                                return (
                                    <div key={i} className={`p-3 rounded-xl border flex justify-between items-center transition duration-300 ${isNext ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : isSent ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:shadow-sm'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSent ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {isSent ? <CheckCircle className="w-4 h-4" /> : (i + 1)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{teacher.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{teacher.phone}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => openWhatsAppLink(teacher, whatsAppTargetDay)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                                                isSent 
                                                ? 'bg-transparent text-green-600 hover:underline' 
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                            }`}
                                        >
                                            {isSent ? 'تم الإرسال' : <><Send className="w-3 h-3" /> إرسال</>}
                                        </button>
                                    </div>
                                );
                            })
                         }
                         {data.teachers.filter(t => t.phone && generateWhatsAppMessage(t, whatsAppTargetDay) !== '').length === 0 && (
                             <div className="col-span-full py-10 text-center text-gray-400">
                                 لا توجد مهام موزعة للمعلمين (الذين لديهم أرقام جوال) في هذا اليوم.
                             </div>
                         )}
                     </div>
                </div>
            </div>
         </div>
      )}

      {/* Teacher Management Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
         <div 
            className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
            onClick={() => setShowTeacherManager(!showTeacherManager)}
         >
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" /> إدارة بيانات المعلمين
                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded-full border">
                    {data.teachers.length} معلم
                </span>
            </h3>
            {showTeacherManager ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
         </div>
         
         {showTeacherManager && (
            <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                            <input 
                                type="text"
                                value={newTeacherName}
                                onChange={(e) => setNewTeacherName(e.target.value)}
                                placeholder="اسم المعلم..."
                                className="w-full rounded-xl border-gray-300 bg-gray-50 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div className="w-1/3">
                            <input 
                                type="text"
                                value={newTeacherPhone}
                                onChange={(e) => setNewTeacherPhone(e.target.value)}
                                placeholder="رقم الجوال..."
                                className="w-full rounded-xl border-gray-300 bg-gray-50 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none dir-ltr text-right"
                            />
                        </div>
                        <button 
                            onClick={addTeacher}
                            className="bg-orange-600 text-white px-4 rounded-xl hover:bg-orange-700 transition"
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        {/* Import Button */}
                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={handleTeacherImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 h-full">
                                <Upload className="w-4 h-4" /> Excel
                            </button>
                        </div>

                        {/* Paste Button */}
                        <button 
                            onClick={() => setShowPasteModal(true)}
                            className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-100 flex items-center gap-2 h-full"
                        >
                            <ClipboardPaste className="w-4 h-4" /> لصق
                        </button>

                        <button 
                            onClick={clearAllTeachers}
                            className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 flex items-center gap-2 border border-red-100 h-full"
                        >
                            <Trash2 className="w-4 h-4" /> حذف الكل
                        </button>
                    </div>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-xl bg-gray-50 p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {data.teachers.length > 0 ? data.teachers.map((t, i) => (
                        <div key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 flex items-center justify-between shadow-sm group hover:border-orange-300">
                             <div className="truncate">
                                <div>{t.name}</div>
                                {t.phone && <div className="text-[10px] text-gray-400 font-mono">{t.phone}</div>}
                             </div>
                             {/* VISIBILITY FIX: Removed opacity-0 group-hover:opacity-100 */}
                             <button onClick={() => removeTeacher(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                             </button>
                        </div>
                    )) : (
                        <div className="col-span-full text-center text-gray-400 py-4 text-xs">لا يوجد معلمين. أضف يدوياً أو قم بالاستيراد.</div>
                    )}
                </div>
            </div>
         )}
      </div>

      {/* Settings Bar for Schedule */}
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
        
        <div className="flex-1 flex gap-2 justify-end">
             {schedule && (
                 <>
                    <button 
                        onClick={() => setShowWhatsAppModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-green-100 hover:bg-green-700 transition flex items-center gap-2"
                        title="إرسال الجداول عبر واتساب"
                    >
                        <Share2 className="w-4 h-4" /> إرسال للجميع
                    </button>
                    <button 
                        onClick={() => handlePrintSchedule(activeDayIdx)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition flex items-center gap-2"
                        title="طباعة جدول اليوم الحالي للتوقيع"
                    >
                        <Printer className="w-4 h-4" /> طباعة اليوم
                    </button>
                    <button 
                        onClick={() => handlePrintSchedule(null)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-gray-800 transition flex items-center gap-2"
                        title="طباعة كامل الجدول"
                    >
                        <Printer className="w-4 h-4" /> طباعة الكل
                    </button>
                 </>
             )}
            <button 
               onClick={generateSchedule}
               className="bg-secondary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-opacity-90 transition flex items-center gap-2"
            >
               <Wand2 className="w-4 h-4" /> {schedule ? 'إعادة التوزيع' : 'بدء التوزيع'}
            </button>
        </div>
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
                                                                        <option key={i} value={t.name}>{t.name}</option>
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
             <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2 border-b pb-2">
                    <Users className="w-4 h-4" /> عداد المعلمين والإشعارات
                </h4>
                <div className="space-y-3">
                    {data.teachers.map((teacher, idx) => {
                        const s = stats[teacher.name] || { active: 0, reserve: 0 };
                        return (
                            <div key={idx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-800 text-xs truncate w-24" title={teacher.name}>{teacher.name}</span>
                                    {teacher.phone ? (
                                        <button 
                                            onClick={() => openWhatsAppLink(teacher, activeDayIdx)}
                                            className="text-green-600 hover:bg-green-100 p-1.5 rounded-full transition-colors"
                                            title={`إرسال الجدول إلى ${teacher.phone}`}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <span className="text-gray-300 text-[10px] px-2" title="لا يوجد رقم">لا يوجد رقم</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <span className="flex-1 bg-white border border-green-200 text-green-700 px-1.5 py-1 rounded text-[10px] text-center font-bold">
                                        {s.active} لجان
                                    </span>
                                    <span className="flex-1 bg-white border border-yellow-200 text-yellow-700 px-1.5 py-1 rounded text-[10px] text-center font-bold">
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