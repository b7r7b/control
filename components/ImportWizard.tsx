import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, Save, X } from 'lucide-react';
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
  
  // Form State
  const [stageName, setStageName] = useState('');
  const [prefix, setPrefix] = useState('10');
  
  // Mapping State
  const [mapping, setMapping] = useState({
    nameIdx: -1,
    idIdx: -1,
    gradeIdx: -1,
    classIdx: -1
  });

  const [previewData, setPreviewData] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
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
      const heads = data[0].map((h: any) => String(h));
      setHeaders(heads);
      
      // Auto-map columns
      const newMapping = { ...mapping };
      heads.forEach((h, i) => {
        const text = h.toLowerCase();
        if (text.includes('اسم')) newMapping.nameIdx = i;
        else if (text.includes('رقم') || text.includes('جلوس') || text.includes('هوية')) newMapping.idIdx = i;
        else if (text.includes('صف')) newMapping.gradeIdx = i;
        else if (text.includes('فصل')) newMapping.classIdx = i;
      });
      setMapping(newMapping);
    }
  };

  useEffect(() => {
    if (sheetData.length > 0 && mapping.nameIdx !== -1) {
      const students = parseStudents(sheetData, mapping);
      setPreviewData(students);
    } else {
      setPreviewData([]);
    }
  }, [sheetData, mapping]);

  const handleSave = () => {
    if (!stageName) {
      setError('يرجى إدخال اسم المرحلة');
      return;
    }
    if (previewData.length === 0) {
      setError('لا يوجد طلاب للحفظ. تأكد من تحديد عمود الاسم.');
      return;
    }
    onSave(stageName, prefix, previewData);
  };

  if (!workbook) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white hover:border-primary transition cursor-pointer relative">
        <input 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">اضغط لرفع ملف Excel</h3>
        <p className="text-sm text-gray-500 mt-2">يدعم ملفات .xlsx و .xls</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-in">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">اسم المرحلة</label>
          <input 
            type="text" 
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
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

      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
        <h4 className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> تحديد الأعمدة
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'الاسم (مطلوب)', key: 'nameIdx', required: true },
            { label: 'رقم الطالب', key: 'idIdx', required: false },
            { label: 'الصف', key: 'gradeIdx', required: false },
            { label: 'الفصل', key: 'classIdx', required: false },
          ].map((field) => (
            <div key={field.key}>
              <label className={`block text-[10px] font-bold mb-1 ${field.required ? 'text-blue-700' : 'text-gray-500'}`}>
                {field.label}
              </label>
              <select
                value={mapping[field.key as keyof typeof mapping]}
                onChange={(e) => setMapping({ ...mapping, [field.key]: Number(e.target.value) })}
                className="w-full rounded-lg border-gray-200 text-xs py-1.5 focus:border-blue-500 focus:ring-0"
              >
                <option value="-1">-- غير محدد --</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h} (Col {i+1})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <label className="text-xs font-bold text-gray-500">معاينة البيانات ({previewData.length} طالب)</label>
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
             سيتم الترتيب أبجدياً تلقائياً
          </span>
        </div>
        <div className="max-h-40 overflow-y-auto border rounded-lg bg-gray-50 text-xs">
          {previewData.length > 0 ? (
            <table className="w-full text-right">
              <thead className="bg-gray-100 text-gray-500 sticky top-0">
                <tr>
                  <th className="p-2 font-medium">م</th>
                  <th className="p-2 font-medium">الاسم</th>
                  <th className="p-2 font-medium">الرقم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td className="p-2 text-gray-400 w-10">{i + 1}</td>
                    <td className="p-2 font-medium text-gray-700">{s.name}</td>
                    <td className="p-2 text-gray-500">{s.studentId}</td>
                  </tr>
                ))}
                {previewData.length > 10 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-gray-400">...و {previewData.length - 10} آخرين</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400">لا توجد بيانات للعرض، يرجى تحديد عمود الاسم</div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t mt-4">
        <button 
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm shadow-green-200"
        >
          <Save className="w-4 h-4" /> حفظ البيانات
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
