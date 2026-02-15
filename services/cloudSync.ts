import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { AppData } from '../types';

export const syncDataToCloud = async (localData: AppData) => {
  // التحقق من وجود لجان قبل البدء
  if (!localData.committees || localData.committees.length === 0) {
      throw new Error("لا توجد لجان موزعة لرفعها. يرجى إتمام خطوة التوزيع أولاً.");
  }

  try {
    const batch = writeBatch(db);
    let operationsCount = 0;
    
    console.log("🚀 بدء عملية المزامنة الذكية (الإصدار الذهبي - مانع التكرار)...");

    // ============================================================
    // 1. رفع المعلمين (Fix: حل جذري لمشكلة التكرار)
    // ============================================================
    if (localData.teachers && localData.teachers.length > 0) {
        localData.teachers.forEach((t) => {
            // تنظيف رقم الجوال لاستخدامه كمعرف (ID)
            let cleanPhone = t.phone ? t.phone.replace(/\D/g, '') : '';
            
            // المنطق الذكي:
            // إذا وجد رقم جوال، نستخدمه كمعرف (لأنه فريد).
            // إذا لم يوجد، نستخدم الاسم بعد حذف المسافات كمعرف.
            // النتيجة: لن يتم تكرار المعلم أبداً حتى لو رفعت الملف 100 مرة.
            const uniqueId = cleanPhone.length > 5 ? cleanPhone : `T_${t.name.trim().replace(/\s+/g, '_')}`;
            
            const teacherRef = doc(db, 'teachers', uniqueId);
            batch.set(teacherRef, {
                id: uniqueId,
                name: t.name,
                phone: t.phone || '',
                qrCode: `TEACHER:${uniqueId}` // كود QR ثابت للمعلم
            });
            operationsCount++;
        });
        console.log(`✅ تم معالجة ${localData.teachers.length} معلم (تم منع التكرار بنجاح)`);
    }

    // ============================================================
    // 2. رفع اللجان وتوزيع الطلاب (التوزيع المطابق للشاشة)
    // ============================================================
    
    // مؤشر (Cursor) لتتبع أين وصلنا في سحب الطلاب من كل مرحلة
    const stageCursors: Record<number, number> = {};
    localData.stages.forEach(s => stageCursors[s.id] = 0);

    for (const comm of localData.committees) {
        
        // أ. رفع الطلاب داخل هذه اللجنة
        for (const stage of localData.stages) {
            // كم عدد طلاب هذه المرحلة في هذه اللجنة؟
            const countInThisComm = comm.counts[stage.id] || 0;
            
            if (countInThisComm > 0) {
                const start = stageCursors[stage.id];
                const end = start + countInThisComm;
                
                // التأكد من وجود طلاب كافين في القائمة
                if (start < stage.students.length) {
                    // قص الطلاب المخصصين لهذه اللجنة بدقة
                    const assignedStudents = stage.students.slice(start, end);
                    
                    for (const s of assignedStudents) {
                        // توليد معرف ثابت للطالب أيضاً لمنع تكرار الطلاب عند إعادة الرفع
                        const studentIdClean = s.studentId && s.studentId.length > 2 
                            ? s.studentId 
                            : `ST_${s.name.trim().replace(/\s+/g, '_')}`;
                            
                        const studentRef = doc(db, 'students', studentIdClean);
                        
                        batch.set(studentRef, {
                            id: studentIdClean,
                            name: s.name,
                            seatNumber: s.studentId || '',
                            grade: stage.name, // اسم المرحلة (أول ثانوي..)
                            className: s.class || 'عام',
                            parentPhone: s.phone || '',
                            committeeNumber: comm.name, // <--- هام: ربط الطالب برقم اللجنة
                            location: comm.location || '', // ومقرها
                            image: `https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff`
                        });
                        operationsCount++;
                    }
                }
                // تحريك المؤشر ليتم السحب من بعد هؤلاء الطلاب في اللجنة التالية
                stageCursors[stage.id] = end;
            }
        }

        // ب. رفع إعدادات اللجنة (شاملة عدد الملاحظين والسعة)
        const commRef = doc(db, 'system_config', `committee_${comm.name}`);
        batch.set(commRef, {
            committeeNumber: comm.name,
            location: comm.location,
            // حساب السعة الإجمالية للجنة
            capacity: Object.values(comm.counts).reduce((a, b) => a + b, 0),
            // حفظ عدد الملاحظين المطلوب لهذه اللجنة (للجدول لاحقاً)
            invigilatorCount: comm.invigilatorCount || 1, 
            type: 'committee_meta'
        });
    }

    // ============================================================
    // 3. رفع الجدول (العمود الفقري للربط)
    // ============================================================
    if (localData.schedule) {
        const scheduleRef = doc(db, 'system_config', 'exam_schedule');
        
        // تنظيف البيانات لضمان قبول Firebase لها
        const cleanSchedule = JSON.parse(JSON.stringify(localData.schedule));
        
        batch.set(scheduleRef, {
            ...cleanSchedule,
            updatedAt: new Date().toISOString()
        });
        console.log("✅ تم رفع جدول الاختبارات والملاحظين");
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
