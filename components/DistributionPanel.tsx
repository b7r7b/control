import React, { useMemo, useState } from 'react';
import { Stage, Committee } from '../types';
import { Plus, Trash2, Wand2, Calculator, RotateCcw, AlertCircle, ArrowLeftRight, CheckCircle2, Eraser, Split, Hash, Users } from 'lucide-react';

interface DistributionPanelProps {
  stages: Stage[];
  committees: Committee[];
  onChange: (committees: Committee[]) => void;
}

type DistMode = 'capacity' | 'count';

const DistributionPanel: React.FC<DistributionPanelProps> = ({ stages, committees, onChange }) => {
  const [distMode, setDistMode] = useState<DistMode>('capacity');
  const [capacityInput, setCapacityInput] = useState('20');
  const [committeeCountInput, setCommitteeCountInput] = useState('10');
  const [separateStages, setSeparateStages] = useState(false); // Default false to allow mixing as requested

  // Calculate ranges for visualization (Alphabetical Order)
  const ranges = useMemo(() => {
    const result: Record<number, Record<number, string>> = {};
    const cursors: Record<number, number> = {};
    
    // Initialize cursors at 1 for each stage
    stages.forEach(s => cursors[s.id] = 1);

    committees.forEach(c => {
      result[c.id] = {};
      stages.forEach(s => {
        const count = c.counts[s.id] || 0;
        if (count > 0) {
          const start = cursors[s.id];
          const end = start + count - 1;
          result[c.id][s.id] = `${start} - ${end}`;
          cursors[s.id] += count; // Move cursor for next committee
        }
      });
    });
    return result;
  }, [committees, stages]);

  const totalStudents = useMemo(() => stages.reduce((acc, s) => acc + s.total, 0), [stages]);

  const handleUpdateCommittee = (index: number, field: keyof Committee, value: any) => {
    const updated = [...committees];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleUpdateCount = (committeeIndex: number, stageId: number, value: string) => {
    const updated = [...committees];
    // Allow empty input for better UX, convert to 0 internally
    const val = value === '' ? 0 : parseInt(value);
    
    const counts = { ...updated[committeeIndex].counts };
    counts[stageId] = isNaN(val) ? 0 : val;
    updated[committeeIndex].counts = counts;
    onChange(updated);
  };

  const addCommittee = () => {
    const nextName = committees.length > 0 
      ? String(parseInt(committees[committees.length - 1].name) + 1) 
      : '1';
    
    const newCommittee: Committee = {
      id: Date.now(),
      name: nextName,
      location: '',
      counts: {}
    };
    onChange([...committees, newCommittee]);
  };

  const removeCommittee = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذه اللجنة؟')) {
      const updated = committees.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  const removeAllCommittees = () => {
    if (confirm('هل أنت متأكد من حذف جميع اللجان نهائياً؟')) {
      onChange([]);
    }
  };

  const resetCountsOnly = () => {
      if (confirm('سيتم تصفير أعداد الطلاب في جميع اللجان (ستبقى اللجان فارغة). هل أنت متأكد؟')) {
          const reset = committees.map(c => ({
              ...c,
              counts: {} // Empty counts
          }));
          onChange(reset);
      }
  };

  const autoDistribute = () => {
    let capacity = 0;

    if (distMode === 'capacity') {
        capacity = parseInt(capacityInput);
        if (isNaN(capacity) || capacity <= 0) {
            alert('الرجاء إدخال سعة صحيحة للجنة (أكبر من 0).');
            return;
        }
    } else {
        const count = parseInt(committeeCountInput);
        if (isNaN(count) || count <= 0) {
            alert('الرجاء إدخال عدد لجان صحيح (أكبر من 0).');
            return;
        }
        capacity = Math.ceil(totalStudents / count);
    }

    if (committees.length > 0) {
      if (!confirm(`سيتم إعادة توزيع ${totalStudents} طالب على اللجان ${distMode === 'count' ? `(السعة المحسوبة: ${capacity} طالب/لجنة)` : ''} . هل أنت متأكد؟`)) {
        return;
      }
    }

    const newCommittees: Committee[] = [];
    const remaining: Record<number, number> = {};
    // Clone totals
    stages.forEach(s => remaining[s.id] = s.total);

    let committeeCounter = 1;

    if (separateStages) {
        // Mode 1: Separate Stages (Do not mix stages in one committee)
        for (const stage of stages) {
            while (remaining[stage.id] > 0) {
                const take = Math.min(remaining[stage.id], capacity);
                
                const counts: Record<number, number> = {};
                counts[stage.id] = take;
                
                newCommittees.push({
                    id: Date.now() + committeeCounter,
                    name: String(committeeCounter++),
                    location: '',
                    counts
                });
                
                remaining[stage.id] -= take;
            }
        }
    } else {
        // Mode 2: Sequential Mixing (Fill committee to capacity across stages)
        // Correct logic: Keep creating committees until ALL students are distributed.
        // In each committee, iterate stages to fill 'capacity'.
        
        while (Object.values(remaining).reduce((a, b) => a + b, 0) > 0) {
           let currentCommSpace = capacity;
           const counts: Record<number, number> = {};
           
           // We iterate through ALL stages to fill this single committee
           for (const stage of stages) {
             if (currentCommSpace <= 0) break; // Committee Full
             
             const r = remaining[stage.id];
             if (r > 0) {
               const take = Math.min(r, currentCommSpace);
               counts[stage.id] = take;
               remaining[stage.id] -= take;
               currentCommSpace -= take;
             }
           }
           
           // If we added anyone, push the committee
           const totalInComm = capacity - currentCommSpace;
           if (totalInComm > 0) {
             newCommittees.push({
               id: Date.now() + committeeCounter,
               name: String(committeeCounter++),
               location: '',
               counts
             });
           } else {
               // Safety break to prevent infinite loops if something goes wrong
               break; 
           }
        }
    }
    
    onChange(newCommittees);
  };

  // Helper to calculate totals
  const getStageDistributedCount = (stageId: number) => {
    return committees.reduce((acc, c) => acc + (c.counts[stageId] || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map(stage => {
          const distributed = getStageDistributedCount(stage.id);
          const remaining = stage.total - distributed;
          const statusColor = remaining === 0 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : remaining > 0 
              ? 'bg-white text-gray-600 border-gray-200' 
              : 'bg-red-50 text-red-700 border-red-200';

          return (
            <div key={stage.id} className={`p-4 rounded-2xl border ${statusColor} shadow-sm flex flex-col items-center transition-all duration-300 relative overflow-hidden`}>
              {remaining === 0 && <div className="absolute top-0 right-0 p-1"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>}
              <span className="text-xs font-bold opacity-70 mb-1">{stage.name}</span>
              <span className="text-2xl font-black mb-1">{remaining === 0 ? stage.total : `${distributed} / ${stage.total}`}</span>
              <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full font-bold">
                {remaining === 0 ? 'اكتمل التوزيع' : remaining > 0 ? `متبقي ${remaining}` : `زيادة ${Math.abs(remaining)}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        
        {/* Controls Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          
          <div className="flex items-center gap-2">
            <Calculator className="text-primary w-5 h-5" />
            <div>
                <h3 className="font-bold text-gray-700">توزيع الطلاب على اللجان</h3>
                <p className="text-[10px] text-gray-400">الإجمالي الكلي: {totalStudents} طالب</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full xl:w-auto items-start xl:items-center justify-end">
             
             {/* Mode Selector & Inputs */}
             <div className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 w-full md:w-auto">
                
                {/* Mode Toggle */}
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setDistMode('capacity')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors ${distMode === 'capacity' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        سعة اللجنة
                    </button>
                    <button 
                        onClick={() => setDistMode('count')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors ${distMode === 'count' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        عدد اللجان
                    </button>
                </div>

                {/* Input based on Mode */}
                <div className="flex items-center gap-2">
                    {distMode === 'capacity' ? (
                        <>
                             <span className="text-[10px] font-bold text-gray-500">السعة:</span>
                             <input 
                                type="number" 
                                value={capacityInput}
                                onChange={(e) => setCapacityInput(e.target.value)}
                                className="w-14 text-center text-sm font-bold bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-primary outline-none"
                             />
                        </>
                    ) : (
                        <>
                             <span className="text-[10px] font-bold text-gray-500">اللجان:</span>
                             <input 
                                type="number" 
                                value={committeeCountInput}
                                onChange={(e) => setCommitteeCountInput(e.target.value)}
                                className="w-14 text-center text-sm font-bold bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-primary outline-none"
                             />
                             <span className="text-[10px] text-gray-400 font-mono">
                                ({Math.ceil(totalStudents / (parseInt(committeeCountInput) || 1))} ط/ل)
                             </span>
                        </>
                    )}
                </div>

                {/* Separate Toggle */}
                <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>
                <label className="flex items-center gap-1.5 cursor-pointer px-1 select-none">
                    <input 
                        type="checkbox" 
                        checked={separateStages} 
                        onChange={(e) => setSeparateStages(e.target.checked)}
                        className="rounded text-secondary focus:ring-secondary w-4 h-4"
                    />
                    <span className="text-[10px] font-bold text-gray-600">فصل المراحل</span>
                </label>

                {/* Action Button */}
                <button 
                  onClick={autoDistribute}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-opacity-90 shadow-sm flex items-center gap-2 transition w-full sm:w-auto justify-center"
                >
                  <Wand2 className="w-3 h-3" /> توزيع
                </button>
             </div>

             {/* Manual Actions */}
             <div className="flex gap-2 w-full md:w-auto justify-end">
                <button 
                  onClick={addCommittee}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold flex items-center gap-1 transition"
                  title="إضافة لجنة فارغة"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={resetCountsOnly}
                  className="px-3 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-bold flex items-center gap-1 transition"
                  title="تصفير أعداد الطلاب فقط"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <button 
                  onClick={removeAllCommittees}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 transition"
                  title="حذف جميع اللجان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="p-3 w-16 border-l bg-gray-100">رقم</th>
                <th className="p-3 w-40 border-l bg-gray-100">المقر</th>
                {stages.map(s => (
                  <th key={s.id} className="p-3 border-l min-w-[140px] text-blue-700 bg-blue-50">
                    {s.name}
                    <div className="text-[9px] font-normal opacity-60 mt-1 flex items-center justify-center gap-1">
                        <ArrowLeftRight className="w-3 h-3" /> تسلسل أبجدي
                    </div>
                  </th>
                ))}
                <th className="p-3 bg-gray-100 w-20 border-l">مجموع</th>
                <th className="p-3 w-12 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {committees.map((committee, idx) => {
                const total = stages.reduce((acc, s) => acc + (committee.counts[s.id] || 0), 0);
                return (
                  <tr key={committee.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-2 border-l align-top">
                      <input 
                        type="text" 
                        value={committee.name}
                        onChange={(e) => handleUpdateCommittee(idx, 'name', e.target.value)}
                        className="w-full text-center font-bold bg-transparent focus:outline-none focus:text-primary py-1"
                      />
                    </td>
                    <td className="p-2 border-l align-top">
                      <input 
                        type="text" 
                        value={committee.location}
                        onChange={(e) => handleUpdateCommittee(idx, 'location', e.target.value)}
                        placeholder="المكان"
                        className="w-full text-center text-xs text-gray-600 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary rounded px-2 py-1"
                      />
                    </td>
                    {stages.map(s => (
                      <td key={s.id} className="p-2 border-l align-top">
                        <div className="flex flex-col gap-1">
                            <input 
                              type="number" 
                              min="0"
                              value={committee.counts[s.id] === 0 ? '' : committee.counts[s.id]}
                              placeholder="0"
                              onChange={(e) => handleUpdateCount(idx, s.id, e.target.value)}
                              className="w-full text-center font-bold text-gray-800 bg-gray-50 rounded-lg py-1.5 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition-all placeholder-gray-300"
                            />
                            {/* Visualization of Alphabetical Range */}
                            <div className="text-[10px] text-gray-500 font-mono bg-blue-50/50 rounded px-1 py-0.5">
                              {ranges[committee.id]?.[s.id] ? (
                                <span className="dir-ltr inline-block text-blue-600 font-bold">
                                  {ranges[committee.id][s.id]}
                                </span>
                              ) : <span className="opacity-30">-</span>}
                            </div>
                        </div>
                      </td>
                    ))}
                    <td className="p-2 border-l font-black text-gray-700 bg-gray-50/30 align-top pt-3">{total}</td>
                    <td className="p-2 align-top pt-2">
                      <button 
                        onClick={() => removeCommittee(idx)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="حذف اللجنة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {committees.length === 0 && (
                <tr>
                  <td colSpan={stages.length + 4} className="p-12 text-center text-gray-400 bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p>لا توجد لجان حالياً.</p>
                      <button onClick={autoDistribute} className="text-primary text-sm font-bold hover:underline">
                        اضغط هنا للتوزيع التلقائي
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-[10px] text-gray-400 flex gap-4">
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> الأرقام أسفل كل خلية تمثل تسلسل الطلاب الأبجدي في اللجنة.</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> يمكنك تعديل أعداد الطلاب يدوياً وسيتم تحديث التسلسل تلقائياً.</span>
        </div>
      </div>
    </div>
  );
};

export default DistributionPanel;