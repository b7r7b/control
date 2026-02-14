import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { AppData } from '../types';

export const syncDataToCloud = async (localData: AppData) => {
  try {
    // نستخدم Batch لكتابة البيانات دفعة واحدة (أسرع وأكثر أماناً)
    const batch = writeBatch(db);
    let operationsCount = 0;

    // 1. مزامنة الطلاب (Students)
    // نقوم بتجميع الطلاب من جميع المراحل الدراسية
    localData.stages.forEach(stage => {
      stage.students.forEach(s => {
        if (!s.studentId) return; // تخطي الطلاب بدون رقم جلوس
        
        // تحويل صيغة الطالب لتناسب النظام الثاني
        const studentRef = doc(db, 'students', s.studentId);
        batch.set(studentRef, {
          id: s.studentId,
          name: s.name,
          seatNumber: s.studentId,
          grade: stage.name,       // مثال: "أول ثانوي"
          className: s.class || 'عام',
          parentPhone: s.phone || '',
          image: `https://ui-avatars.com/api/?name=${s.name}&background=random` // صورة افتراضية
        });
        operationsCount++;
      });
    });

    // 2. مزامنة المعلمين (Teachers)
    if (localData.teachers && localData.teachers.length > 0) {
      localData.teachers.forEach((t, index) => {
        // توليد ID رقمي ثابت للمعلم (1001, 1002...) بناءً على ترتيبه
        // هذا يضمن أن نفس المعلم يحصل على نفس الرقم دائماً طالما الترتيب لم يتغير
        const teacherId = String(1001 + index); 
        
        const teacherRef = doc(db, 'teachers', teacherId);
        batch.set(teacherRef, {
          id: teacherId,
          name: t.name,
          phone: t.phone || '',
          qrCode: `TEACHER:${teacherId}` // كود الـ QR الذي سيمسحه المعلم للدخول
        });
        operationsCount++;
      });
    }

    // 3. مزامنة إعدادات اللجان (Committees Meta Data)
    // لن يعرف النظام الثاني اللجان إلا إذا رفعنا تعريفاتها
    if (localData.committees && localData.committees.length > 0) {
        localData.committees.forEach(committee => {
            // نستخدم اسم اللجنة (رقمها) كمعرف
            const commRef = doc(db, 'committees_config', committee.name);
            batch.set(commRef, {
                committeeNumber: committee.name,
                location: committee.location,
                capacity: committee.totalCapacity || 0
            });
            operationsCount++;
        });
    }

    // تنفيذ جميع العمليات
    await batch.commit();
    return { success: true, count: operationsCount };

  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw error;
  }
};
