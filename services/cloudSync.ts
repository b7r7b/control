import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { AppData, Student } from '../types';

export const syncDataToCloud = async (localData: AppData) => {
  if (!localData.committees || localData.committees.length === 0) {
      throw new Error("لا توجد لجان موزعة لرفعها. يرجى إتمام خطوة التوزيع أولاً.");
  }

  try {
    const batch = writeBatch(db);
    let operationsCount = 0;
    
    // إعداد مؤشرات لتتبع الطلاب الذين تم رفعهم من كل مرحلة
    // هذا يضمن عدم تكرار الطالب وعدم نسيان أحد
    const stageCursors: Record<number, number> = {};
    localData.stages.forEach(s => stageCursors[s.id] = 0);

    console.log("🚀 بدء عملية المزامنة الذكية...");

    // ============================================================
    // 1. رفع الطلاب وتوزيعهم حسب اللجان المعتمدة (المرآة الذكية)
    // ============================================================
    
    // نمر على كل لجنة كما هي موجودة في التوزيع
    for (const comm of localData.committees) {
        
        // داخل كل لجنة، نمر على المراحل لنرى كم طالب مخصص لهذه اللجنة
        for (const stage of localData.stages) {
            const countInThisComm = comm.counts[stage.id] || 0;
            
            if (countInThisComm > 0) {
                // نحدد بداية ونهاية الشريحة من قائمة طلاب المرحلة
                const start = stageCursors[stage.id];
                const end = start + countInThisComm;
                
                // نتأكد أن لدينا طلاب كافين (حماية من الأخطاء)
                if (start < stage.students.length) {
                    const assignedStudents = stage.students.slice(start, end);
                    
                    // رفع هؤلاء الطلاب مع رقم اللجنة الصحيح
                    for (const s of assignedStudents) {
                        const docId = s.studentId && s.studentId.length > 1 ? s.studentId : `S-${Math.floor(Math.random() * 1000000)}`;
                        const studentRef = doc(db, 'students', docId);
                        
                        batch.set(studentRef, {
                            id: docId,
                            name: s.name,
                            seatNumber: s.studentId || docId,
                            grade: stage.name, // اسم المرحلة (أول ثانوي، إلخ)
                            className: s.class || 'عام',
                            parentPhone: s.phone || '',
                            committeeNumber: comm.name, // <--- هنا السر: نأخذ اسم اللجنة الفعلي من التوزيع
                            location: comm.location || '',
                            image: `https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff`
                        });
                        operationsCount++;
                    }
                }
                
                // تحديث المؤشر للمرحلة (عشان اللجنة اللي بعدها تبدأ من حيث انتهينا)
                stageCursors[stage.id] = end;
            }
        }

        // ============================================================
        // 2. رفع إعدادات اللجنة (MetaData)
        // ============================================================
        const commRef = doc(db, 'system_config', `committee_${comm.name}`);
        batch.set(commRef, {
            committeeNumber: comm.name,
            location: comm.location,
            // نحسب السعة الفعلية بناءً على التوزيع
            capacity: Object.values(comm.counts).reduce((a, b) => a + b, 0),
            type: 'committee_meta'
        });
    }

    // ============================================================
    // 3. رفع المعلمين (Teachers)
    // ============================================================
    if (localData.teachers && localData.teachers.length > 0) {
        localData.teachers.forEach((t, index) => {
            // نستخدم رقم جوال المعلم كـ ID إذا وجد، وإلا نولد رقماً
            const teacherId = t.phone && t.phone.length > 5 ? t.phone : String(1000 + index);
            
            const teacherRef = doc(db, 'teachers', teacherId);
            batch.set(teacherRef, {
                id: teacherId,
                name: t.name,
                phone: t.phone || '',
                qrCode: `TEACHER:${teacherId}`
            });
            operationsCount++;
        });
    }

    // ============================================================
    // 4. رفع جدول الاختبارات (Exam Schedule)
    // ============================================================
    if (localData.schedule) {
        const scheduleRef = doc(db, 'system_config', 'exam_schedule');
        // تنظيف البيانات لضمان قبول Firebase لها (حذف الـ undefined)
        const cleanSchedule = JSON.parse(JSON.stringify(localData.schedule));
        
        batch.set(scheduleRef, {
            ...cleanSchedule,
            updatedAt: new Date().toISOString()
        });
        console.log("✅ تم تجهيز الجدول للرفع");
    }

    // تنفيذ كل العمليات دفعة واحدة
    await batch.commit();
    console.log(`🎉 تمت العملية بنجاح! تم رفع ${operationsCount} سجل.`);
    return { success: true, count: operationsCount };

  } catch (error) {
    console.error("❌ Cloud Sync Error:", error);
    throw error;
  }
};
