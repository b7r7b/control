import React, { useState, useEffect } from 'react';
import { AppData, Stage, Committee, AppStep, Student } from './types';
import ImportWizard from './components/ImportWizard';
import DistributionPanel from './components/DistributionPanel';
import PrintCenter from './components/PrintCenter';
import { readExcelFile, getSheetData } from './services/excelService';
import { Trash2, Printer, Settings2, Users, Database, Upload, UserPlus, X } from 'lucide-react';

const STORAGE_KEY = 'ExamSystemData_v2';

const INITIAL_DATA: AppData = {
  school: { name: '', year: '', term: '' },
  stages: [],
  committees: [],
  teachers: []
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [step, setStep] = useState<AppStep>(AppStep.DATA);
  const [showImport, setShowImport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Teacher Input State
  const [newTeacherName, setNewTeacherName] = useState('');

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure teachers array exists for backward compatibility
        if (!parsed.teachers) parsed.teachers = [];
        setData(parsed);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save Data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateSchool = (field: string, value: string) => {
    setData(prev => ({ ...prev, school: { ...prev.school, [field]: value } }));
  };

  const handleSaveStage = (name: string, prefix: string, students: Student[]) => {
    const newStage: Stage = {
      id: Date.now(),
      name,
      prefix,
      students,
      total: students.length
    };

    setData(prev => {
      // Initialize counts for this new stage in existing committees
      const updatedCommittees = prev.committees.map(c => ({
        ...c,
        counts: { ...c.counts, [newStage.id]: 0 }
      }));
      return {
        ...prev,
        stages: [...prev.stages, newStage],
        committees: updatedCommittees
      };
    });
    setShowImport(false);
    
    // Move to distribute step if it's the first stage
    if (data.stages.length === 0) setStep(AppStep.DISTRIBUTE);
  };

  const handleReset = () => {
    if (confirm('سيتم حذف جميع البيانات والبدء من جديد. هل أنت متأكد؟')) {
      setData(INITIAL_DATA);
      localStorage.removeItem(STORAGE_KEY);
      setStep(AppStep.DATA);
    }
  };

  const removeStage = (id: number) => {
    if (confirm('حذف هذه المرحلة سيؤدي لحذف توزيع طلابها. استمرار؟')) {
      setData(prev => ({
        ...prev,
        stages: prev.stages.filter(s => s.id !== id),
        committees: prev.committees.map(c => {
            const newCounts = { ...c.counts };
            delete newCounts[id];
            return { ...c, counts: newCounts };
        })
      }));
    }
  };

  // --- Teacher Management ---
  const addTeacher = () => {
    if (newTeacherName.trim()) {
      setData(prev => ({ ...prev, teachers: [...prev.teachers, newTeacherName.trim()] }));
      setNewTeacherName('');
    }
  };

  const removeTeacher = (index: number) => {
    setData(prev => ({
        ...prev,
        teachers: prev.teachers.filter((_, i) => i !== index)
    }));
  };

  const handleTeacherImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const wb = await readExcelFile(e.target.files[0]);
        if (wb.SheetNames.length > 0) {
            const sheetData = getSheetData(wb, wb.SheetNames[0]);
            // Assume names are in the first column, skip header if it looks like a header
            const newTeachers: string[] = [];
            for(let i=0; i<sheetData.length; i++) {
                const row = sheetData[i];
                if (row[0]) {
                    const name = String(row[0]).trim();
                    if (name && name !== 'الاسم' && name !== 'اسم المعلم') {
                        newTeachers.push(name);
                    }
                }
            }
            if (newTeachers.length > 0) {
                setData(prev => ({ ...prev, teachers: Array.from(new Set([...prev.teachers, ...newTeachers])) }));
                alert(`تم استيراد ${newTeachers.length} معلم بنجاح`);
            } else {
                alert('لم يتم العثور على أسماء في العمود الأول');
            }
        }
      } catch (err) {
        alert('فشل قراءة الملف');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#f3e5f5] to-[#e8eaf6] py-8 px-4 font-sans text-right" dir="rtl">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl border border-white/50 overflow-hidden backdrop-blur-sm">
        
        {/* Header */}
        <header className="relative bg-white p-6 border-b border-gray-100 flex flex-col items-center gap-4">
            <button 
                onClick={handleReset}
                className="absolute top-6 left-6 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
                <Trash2 className="w-4 h-4" /> تصفير النظام
            </button>
            
            <div className="flex flex-col items-center">
                <img src="https://salogos.org/wp-content/uploads/2021/11/UntiTtled-1.png" className="h-20 object-contain mb-2" alt="Logo" />
                <h1 className="text-2xl font-bold text-primary">المملكة العربية السعودية</h1>
                <p className="text-lg text-secondary font-medium">وزارة التعليم - نظام الكنترول</p>
            </div>
            
            <div className="w-full max-w-md h-1.5 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-80"></div>
        </header>

        {/* Steps Navigation */}
        <nav className="p-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex justify-center gap-2 md:gap-4">
                {[
                    { id: AppStep.DATA, label: 'البيانات الأساسية', icon: Database },
                    { id: AppStep.IMPORT, label: 'الطلاب', icon: Users },
                    { id: AppStep.DISTRIBUTE, label: 'التوزيع', icon: Settings2 },
                    { id: AppStep.PRINT, label: 'الطباعة', icon: Printer },
                ].map((s) => {
                    const isActive = step === s.id;
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                isActive 
                                ? 'bg-white text-primary shadow-md ring-1 ring-gray-100 scale-105' 
                                : 'text-gray-500 hover:bg-white/60'
                            }`}
                        >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary/10' : 'bg-gray-200'}`}>
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                            </span>
                            <span className="hidden md:inline">{s.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>

        {/* Main Content */}
        <main className="p-6 md:p-8 min-h-[500px]">
            
            {/* Step 1: Data */}
            <div className={step === AppStep.DATA ? 'block animate-fade-in' : 'hidden'}>
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    {/* School Data */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                                <Database className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">بيانات المدرسة والاختبارات</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1.5">اسم المدرسة</label>
                                <input 
                                    type="text" 
                                    value={data.school.name}
                                    onChange={(e) => updateSchool('name', e.target.value)}
                                    className="w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="مثال: ثانوية الملك فهد"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1.5">العام الدراسي</label>
                                    <input 
                                        type="text" 
                                        value={data.school.year}
                                        onChange={(e) => updateSchool('year', e.target.value)}
                                        className="w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="1445هـ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1.5">الفترة</label>
                                    <input 
                                        type="text" 
                                        value={data.school.term}
                                        onChange={(e) => updateSchool('term', e.target.value)}
                                        className="w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="الفصل الدراسي الأول"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Management */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">بيانات المعلمين (الملاحظين)</h2>
                            </div>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls"
                                    onChange={handleTeacherImport}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> استيراد من Excel
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text"
                                value={newTeacherName}
                                onChange={(e) => setNewTeacherName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTeacher()}
                                placeholder="أدخل اسم المعلم..."
                                className="flex-1 rounded-xl border-gray-300 bg-gray-50 p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                            <button 
                                onClick={addTeacher}
                                className="bg-orange-600 text-white px-4 rounded-xl hover:bg-orange-700 transition"
                            >
                                <UserPlus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 min-h-[100px] max-h-[200px] overflow-y-auto border border-gray-100">
                            {data.teachers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.teachers.map((t, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-bold text-gray-700 flex items-center gap-2 shadow-sm">
                                            {t}
                                            <button onClick={() => removeTeacher(idx)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-4">لم يتم إضافة معلمين بعد. يمكنك الإضافة يدوياً أو الاستيراد.</div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={() => setStep(AppStep.IMPORT)} 
                            className="bg-primary hover:bg-[#1673a4] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all text-lg"
                        >
                            حفظ ومتابعة
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Import */}
            <div className={step === AppStep.IMPORT ? 'block animate-fade-in' : 'hidden'}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">إدارة المراحل والطلاب</h2>
                    <button 
                        onClick={() => setShowImport(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-green-100 text-sm flex items-center gap-2 transition-all"
                    >
                        + استيراد مرحلة جديدة
                    </button>
                </div>

                {showImport && (
                    <div className="mb-8">
                         <ImportWizard onSave={handleSaveStage} onCancel={() => setShowImport(false)} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.stages.map(stage => (
                        <div key={stage.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                            <button 
                                onClick={() => removeStage(stage.id)}
                                className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                    {stage.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{stage.name}</h3>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">بادئة الجلوس: {stage.prefix}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                                <span className="text-xs font-bold text-gray-500">عدد الطلاب</span>
                                <span className="text-lg font-black text-gray-800">{stage.total}</span>
                            </div>
                        </div>
                    ))}
                    {data.stages.length === 0 && !showImport && (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            لا توجد مراحل مضافة. قم باستيراد ملف Excel للبدء.
                        </div>
                    )}
                </div>
            </div>

            {/* Step 3: Distribution */}
            <div className={step === AppStep.DISTRIBUTE ? 'block animate-fade-in' : 'hidden'}>
                {data.stages.length > 0 ? (
                    <DistributionPanel 
                        stages={data.stages} 
                        committees={data.committees} 
                        onChange={(updated) => setData(prev => ({ ...prev, committees: updated }))}
                    />
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        يرجى إضافة طلاب أولاً في الخطوة السابقة.
                    </div>
                )}
            </div>

            {/* Step 4: Print Center */}
            <div className={step === AppStep.PRINT ? 'block animate-fade-in' : 'hidden'}>
                <PrintCenter data={data} />
            </div>

        </main>
      </div>
      
      <div className="text-center mt-6 text-gray-400 text-xs">
         تم التطوير باستخدام أحدث تقنيات الويب
      </div>
    </div>
  );
};

export default App;