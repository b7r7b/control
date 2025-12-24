import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, Save, X, Split, Layers, Search, RefreshCw } from 'lucide-react';
import { readExcelFile, getSheetData, parseStudents } from '../services/excelService';
import { Student } from '../types';

interface ImportWizardProps {
  onSave: (name: string, prefix: string, students: Student[]) => void;
  onCancel: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onSave, onCancel }) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Header Detection
  const [headerRowIndex, setHeaderRowIndex] = useState(0);

  // Form State
  const [stageName, setStageName] = useState('');
  const [prefix, setPrefix] = useState('10');
  const [splitByGrade, setSplitByGrade] = useState(false);
  
  // Mapping State
  const [mapping, setMapping] = useState({
    nameIdx: -1,
    idIdx: -1,
    gradeIdx: -1,
    classIdx: -1,
    phoneIdx: -1
  });

  const [previewData, setPreviewData] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper: Detect the best header row based on keywords
  const detectHeaderRow = (data: any[][]): number => {
    const keywords = ['اسم', 'name', 'طالب', 'student', 'جلوس', 'id', 'فصل', 'class', 'صف', 'grade', 'مستوى', 'جوال', 'mobile', 'phone'];
    let bestRow = 0;
    let maxScore = 0;

    // Scan first 20 rows
    const limit = Math.min(data.length, 20);
    for (let i = 0; i < limit; i++) {
        const row = data[i];
        let score = 0;
        if (Array.isArray(row)) {
            row.forEach(cell => {
                const val = String(cell).toLowerCase();
                if (keywords.some(k => val.includes(k))) {
                    score++;
                }
            });
        }
        if (score > maxScore) {
            maxScore = score;
            bestRow = i;
        }
    }
    return bestRow;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setError(null);
        const wb = await readExcelFile(e.target.files[0]);
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          handleSheetSelect(wb.SheetNames[0], wb);
        }
      } catch (err) {
        setError('فشل قراءة الملف. تأكد من أنه ملف Excel صالح.');
      }
    }
  };

  const handleSheetSelect = (sheetName: string, wb: XLSX.WorkBook = workbook!) => {
    setSelectedSheet(sheetName);
    setStageName(sheetName);
    const data = getSheetData(wb, sheetName);
    setSheetData(data);
    
    if (data.length > 0) {
      // Auto Detect Header
      const bestHeaderRow = detectHeaderRow(data);
      setHeaderRowIndex(bestHeaderRow);
      processHeadersAndMap(data, bestHeaderRow);
    } else {
        setError('ورقة العمل فارغة');
    }
  };

  const processHeadersAndMap = (data: any[][], rowIndex: number) => {
      if (!data[rowIndex]) return;
      
      const heads = data[rowIndex].map((h: any) => String(h || `Column ${Math.random()}`)); // Fallback for empty header cells
      setHeaders(heads);
      
      // Auto-map columns
      const newMapping = { nameIdx: -1, idIdx: -1, gradeIdx: -1, classIdx: -1, phoneIdx: -1 };
      heads.forEach((h, i) => {
        const text = h.toLowerCase();
        if (text.includes('اسم')) newMapping.nameIdx = i;
        else if (text.includes('رقم') || text.includes('جلوس') || text.includes('هوية') || text.includes('id')) newMapping.idIdx = i;
        else if (text.includes('صف') || text.includes('مستوى') || text.includes('مرحله') || text.includes('grade')) newMapping.gradeIdx = i;
        else if (text.includes('فصل') || text.includes('شعبة') || text.includes('class')) newMapping.classIdx = i;
        else if (text.includes('جوال') || text.includes('هاتف') || text.includes('phone') || text.includes('mobile')) newMapping.phoneIdx = i;
      });
      setMapping(newMapping);
  };

  // Re-process when Header Row Index changes manually
  useEffect(() => {
     if (sheetData.length > 0) {
         processHeadersAndMap(sheetData, headerRowIndex);
     }
  }, [headerRowIndex]);

  useEffect(() => {
    if (sheetData.length > 0 && mapping.nameIdx !== -1) {
      const students = parseStudents(sheetData, mapping, headerRowIndex);
      setPreviewData(students);
    } else {
      setPreviewData([]);
    }
  }, [sheetData, mapping, headerRowIndex]);

  const handleSave = () => {
    if (previewData.length === 0) {
      setError('لا يوجد طلاب للحفظ. تأكد من تحديد صف العناوين وعمود الاسم بشكل صحيح.');
      return;
    }

    if (splitByGrade && mapping.gradeIdx !== -1) {
      const groups: Record<string, Student[]> = {};
      previewData.forEach(student => {
        const key = student.grade || 'غير محدد';
        if (!groups[key]) groups[key] = [];
        groups[key].push(student);
      });

      if (Object.keys(groups).length === 0) {
        setError('لم يتم العثور على قيم في عمود الصف للتقسيم.');
        return;
      }

      let currentPrefix = parseInt(prefix) || 10;
      Object.keys(groups).forEach((gradeName) => {
         onSave(gradeName, String(currentPrefix), groups[gradeName]);
         currentPrefix += 10;
      });

    } else {
      if (!stageName) {
        setError('يرجى إدخال اسم المرحلة');
        return;
      }
      onSave(stageName, prefix, previewData);
    }
  };

  if (!workbook) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white hover:border-primary transition cursor-pointer relative group">
        <input 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          value=""
        />
        <div className="transform group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4 group-hover:text-primary" />
        </div>
        <h3 className="text-xl font-bold text-gray-700">اضغط لرفع ملف Excel</h3>
        <p className="text-sm text-gray-500 mt-2">يدعم ملفات .xlsx و .xls</p>
        <p className="text-xs text-blue-500 mt-4 font-bold">نصيحة: تأكد أن الملف يحتوي على أعمدة (الاسم، الفصل، الصف)</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            إعدادات الاستيراد
        </h3>
        <button onClick={() => setWorkbook(null)} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition">
            رفع ملف آخر
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">ورقة العمل</label>
          <select 
            value={selectedSheet} 
            onChange={(e) => handleSheetSelect(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {sheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Header Row Selector - Crucial for "Ineffective Import" fix */}
        <div>
           <label className="block text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
               <Search className="w-3 h-3" /> رقم صف العناوين
           </label>
           <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 min="1" 
                 max="50"
                 value={headerRowIndex + 1}
                 onChange={(e) => setHeaderRowIndex(Math.max(0, parseInt(e.target.value) - 1))}
                 className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none font-bold text-center"
               />
           </div>
        </div>
        
        <div>
           {splitByGrade ? (
             <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">اسم المرحلة</label>
                <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 italic cursor-not-allowed truncate">
                   تلقائي (حسب الصف)
                </div>
             </div>
           ) : (
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">اسم المرحلة</label>
               <input 
                 type="text" 
                 value={stageName}
                 onChange={(e) => setStageName(e.target.value)}
                 className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
               />
             </div>
           )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">بداية أرقام الجلوس</label>
          <input 
            type="text" 
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="مثال: 10"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <h4 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" /> مطابقة الأعمدة (تأكد من اختيار صف العناوين الصحيح أعلاه)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'الاسم (مطلوب)', key: 'nameIdx', required: true },
            { label: 'رقم الطالب', key: 'idIdx', required: false },
            { label: 'الصف', key: 'gradeIdx', required: false },
            { label: 'الفصل', key: 'classIdx', required: false },
            { label: 'رقم الجوال (اختياري)', key: 'phoneIdx', required: false },
          ].map((field) => (
            <div key={field.key}>
              <label className={`block text-[10px] font-bold mb-1 ${field.required ? 'text-blue-700' : 'text-gray-500'}`}>
                {field.label}
              </label>
              <select
                value={mapping[field.key as keyof typeof mapping]}
                onChange={(e) => setMapping({ ...mapping, [field.key]: Number(e.target.value) })}
                className={`w-full rounded-lg text-xs py-1.5 focus:border-blue-500 focus:ring-0 ${
                    mapping[field.key as keyof typeof mapping] === -1 && field.required 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
              >
                <option value="-1">-- غير محدد --</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-gray-500">معاينة البيانات ({previewData.length} سجل)</label>
             
             {mapping.gradeIdx !== -1 && (
                <label className="flex items-center gap-2 cursor-pointer mt-1 group select-none">
                    <input 
                      type="checkbox" 
                      checked={splitByGrade} 
                      onChange={(e) => setSplitByGrade(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className={`text-xs font-bold transition-colors ${splitByGrade ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}>
                       <span className="flex items-center gap-1">
                          <Split className="w-3 h-3" />
                          تقسيم تلقائي إلى مراحل حسب عمود "الصف"
                       </span>
                    </span>
                </label>
             )}
          </div>
          
          {previewData.length > 0 && (
             <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                <Check className="w-3 h-3" /> البيانات جاهزة
             </span>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto border rounded-lg bg-white text-xs custom-scrollbar">
          {previewData.length > 0 ? (
            <table className="w-full text-right">
              <thead className="bg-gray-100 text-gray-500 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-2 font-medium w-10">م</th>
                  <th className="p-2 font-medium">الاسم</th>
                  <th className="p-2 font-medium">رقم الجلوس</th>
                  <th className="p-2 font-medium text-blue-600">الصف</th>
                  <th className="p-2 font-medium text-purple-600">الفصل</th>
                  <th className="p-2 font-medium text-gray-600">الجوال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.slice(0, 50).map((s, i) => (
                  <tr key={i} className="hover:bg-blue-50/50">
                    <td className="p-2 text-gray-400 w-10 text-center border-l">{i + 1}</td>
                    <td className="p-2 font-bold text-gray-700 border-l">{s.name}</td>
                    <td className="p-2 text-gray-500 border-l font-mono">{s.studentId}</td>
                    <td className="p-2 text-blue-600 border-l font-medium">{s.grade}</td>
                    <td className="p-2 text-purple-600 border-l font-medium">{s.class}</td>
                    <td className="p-2 text-gray-600 font-mono">{s.phone}</td>
                  </tr>
                ))}
                {previewData.length > 50 && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-400 bg-gray-50">
                        ...و {previewData.length - 50} آخرين
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p>لا توجد بيانات للعرض.</p>
                <p className="text-[10px] mt-1">تأكد من تحديد "رقم صف العناوين" الصحيح بالأعلى</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t mt-4">
        <button 
          onClick={handleSave}
          disabled={previewData.length === 0}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
             previewData.length > 0 
             ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200' 
             : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {splitByGrade ? (
             <><Layers className="w-4 h-4" /> حفظ وتقسيم المراحل ({Object.keys(previewData.reduce((acc, s) => ({...acc, [s.grade || 'x']:1}), {})).length})</>
          ) : (
             <><Save className="w-4 h-4" /> حفظ البيانات ({previewData.length})</>
          )}
        </button>
        <button 
          onClick={onCancel}
          className="px-6 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default ImportWizard;