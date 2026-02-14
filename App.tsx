import React, { useState, useEffect } from 'react';
import { AppData, AppStep, Teacher } from './types';
import ImportWizard from './components/ImportWizard';
import DistributionPanel from './components/DistributionPanel';
import InvigilatorDistributionPanel from './components/InvigilatorDistributionPanel';
import PrintCenter from './components/PrintCenter';
import { UploadCloud, Loader2, Database, AlertTriangle } from 'lucide-react'; 
import { syncDataToCloud } from './services/cloudSync'; // استيراد خدمة المزامنة التي أنشأناها

const STORAGE_KEY = 'ExamSystemData_v2';

const INITIAL_DATA: AppData = {
  school: { name: '', year: '', term: '', managerName: '', agentName: '' },
  stages: [],
  committees: [],
  teachers: []
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [step, setStep] = useState<AppStep>(AppStep.DATA);
  const [isSyncing, setIsSyncing] = useState(false); // حالة التحميل لزر التصدير

  // تحميل البيانات المحفوظة محلياً عند البدء
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.teachers) parsed.teachers = [];
        else if (parsed.teachers.length > 0 && typeof parsed.teachers[0] === 'string') {
            parsed.teachers = parsed.teachers.map((name: string) => ({ name, phone: '' }));
        }
        setData(parsed);
      } catch (e) { console.error("Error loading data", e); }
    }
  }, []);

  // حفظ البيانات تلقائياً عند أي تغيير
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // --- دالة المزامنة السحابية (الجوهرية) ---
  const handleCloudSync = async () => {
    // 1. التحقق من وجود بيانات
    const studentCount = data.stages.reduce((acc, s) => acc + s.students.length, 0);
    const teacherCount = data.teachers.length;

    if (studentCount === 0) {
        alert("لا توجد بيانات طلاب لتصديرها! يرجى إضافة الطلاب أولاً.");
        return;
    }

    if (data.committees.length === 0) {
        alert("لا توجد لجان! يرجى توزيع الطلاب على اللجان قبل التصدير.");
        return;
    }

    // 2. رسالة تأكيد للمستخدم
    if (!window.confirm(`هل أنت متأكد؟\nسيتم رفع:\n- ${studentCount} طالب\n- ${teacherCount} معلم\n- ${data.committees.length} لجنة\n\nإلى النظام الذكي (Firebase). سيستبدل هذا البيانات القديمة هناك.`)) {
        return;
    }
    
    // 3. بدء عملية الرفع
    setIsSyncing(true);
    try {
      await syncDataToCloud(data);
      alert(`✅ تم التصدير بنجاح!\nأصبح بإمكانك الآن فتح "النظام الذكي" وستجد الطلاب واللجان جاهزة.`);
    } catch (e) {
      console.error(e);
      alert('❌ حدث خطأ أثناء الاتصال بالسحابة. تأكد من الإنترنت وإعدادات Firebase.');
    } finally {
      setIsSyncing(false);
    }
  };

  // دوال تحديث البيانات
  const updateSchool = (field: string, value: string) => {
    setData(prev => ({ ...prev, school: { ...prev.school, [field]: value } }));
  };
  
  const handleUpdateTeachers = (updatedTeachers: Teacher[]) => {
      setData(prev => ({ ...prev, teachers: updatedTeachers }));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-secondary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-2 rounded-lg">
                <Database className="w-6 h-6 text-accent" />
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight">نظام الكنترول المدرسي</h1>
               <p className="text-[10px] text-gray-300 opacity-80">الإعداد والتوزيع والطباعة</p>
             </div>
          </div>

          {/* زر التصدير للنظام الذكي */}
          <div className="flex items-center gap-3">
             <button 
                onClick={handleCloudSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border border-white/20
                    ${isSyncing ? 'bg-white/10 cursor-wait' : 'bg-primary hover:bg-green-600 shadow-lg hover:shadow-xl'}
                `}
                title="اضغط هنا بعد الانتهاء من التوزيع لرفع البيانات للنظام الثاني"
             >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{isSyncing ? 'جاري الرفع...' : 'تصدير للنظام الذكي'}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Progress Navigation Bar */}
        <div className="flex justify-center mb-8">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto max-w-full">
                {[
                    {id: AppStep.DATA, label: '1. بيانات المدرسة'},
                    {id: AppStep.IMPORT, label: '2. استيراد الطلاب'},
                    {id: AppStep.DISTRIBUTE, label: '3. توزيع اللجان'},
                    {id: AppStep.TEACHERS, label: '4. الملاحظين'},
                    {id: AppStep.PRINT, label: '5. الطباعة والتصدير'}
                ].map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setStep(s.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            step === s.id 
                            ? 'bg-secondary text-white shadow-md' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Screens */}
        <main className="animate-fade-in">
            {/* Step 1: Data */}
            {step === AppStep.DATA && (
                 <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                     <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
                         إعدادات العام الدراسي
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">اسم المدرسة</label>
                             <input 
                                value={data.school.name}
                                onChange={e => updateSchool('name', e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                placeholder="مثال: ثانوية المجد"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">العام الدراسي</label>
                             <input 
                                value={data.school.year}
                                onChange={e => updateSchool('year', e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                placeholder="مثال: 1445 هـ"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">مدير المدرسة</label>
                             <input 
                                value={data.school.managerName}
                                onChange={e => updateSchool('managerName', e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                placeholder="الاسم الكريم"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">وكيل الشؤون التعليمية</label>
                             <input 
                                value={data.school.agentName}
                                onChange={e => updateSchool('agentName', e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                placeholder="الاسم الكريم"
                             />
                         </div>
                     </div>
                     <div className="mt-8 flex justify-end">
                         <button onClick={() => setStep(AppStep.IMPORT)} className="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary transition-colors">
                             حفظ والمتابعة للطلاب
                         </button>
                     </div>
                 </div>
            )}

            {/* Step 2: Import */}
            {step === AppStep.IMPORT && (
                <ImportWizard 
                    onSave={(name, prefix, students) => {
                        const newStage = {
                            id: Date.now(),
                            name,
                            prefix,
                            students,
                            total: students.length
                        };
                        setData(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
                    }}
                    onCancel={() => {}}
                />
            )}

            {/* Step 3: Distribution */}
            {step === AppStep.DISTRIBUTE && (
                data.stages.length > 0 ? (
                    <DistributionPanel 
                        stages={data.stages} 
                        committees={data.committees} 
                        onChange={(updated) => setData(prev => ({ ...prev, committees: updated }))}
                    />
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                        <p className="text-gray-500 font-bold">يرجى إضافة طلاب ومراحل أولاً في الخطوة السابقة.</p>
                        <button onClick={() => setStep(AppStep.IMPORT)} className="mt-4 text-primary underline">الذهاب لاستيراد الطلاب</button>
                    </div>
                )
            )}

            {/* Step 4: Teachers */}
            {step === AppStep.TEACHERS && (
                 <InvigilatorDistributionPanel 
                    data={data} 
                    onSave={(schedule) => setData(prev => ({ ...prev, schedule }))} 
                    onUpdateTeachers={handleUpdateTeachers} 
                 />
            )}

            {/* Step 5: Print */}
            {step === AppStep.PRINT && (
                <PrintCenter data={data} onUpdateSchool={updateSchool} />
            )}
        </main>
      </div>

      <div className="text-center mt-6 text-gray-500 text-sm font-bold">
         تصميم: الأستاذ عبدالله علي الشهري
      </div>
    </div>
  );
};

export default App;
