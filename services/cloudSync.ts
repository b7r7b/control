import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { AppData } from '../types';

/**
 * خدمة المزامنة السحابية
 * وظيفتها: نقل البيانات من التخزين المحلي (Local Storage) إلى قاعدة البيانات (Firebase)
 * لكي يتمكن "نظام التنفيذ" من قراءتها.
 */
export const syncDataToCloud = async (localData: AppData) => {
  try {
    // التحقق من وجود بيانات أساسية
    if (!localData.stages || localData.stages.length === 0) {
      throw new Error("لا توجد بيانات طلاب لتصديرها.");
    }

    // إعداد متغيرات التحكم في الدفعات (Batching)
    // في Firebase، الحد الأقصى للدفعة هو 500 عملية. سنجعلها 450 للأمان.
    const BATCH_SIZE = 450;
    let batch = writeBatch(db);
    let operationCounter = 0;
    let totalUploaded = 0;

    // دالة مساعدة لحفظ الدفعة وإعادة إنشاء واحدة جديدة
    const commitBatchIfFull = async () => {
      if (operationCounter >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db); // دفعة جديدة
        operationCounter = 0;
      }
      
    };

    // ---------------------------------------------------------
    // 1. منطق توزيع الطلاب على اللجان (Simulation of Distribution)
    // ---------------------------------------------------------
    
    // نجهز اللجان وسعتها
    const committeesConfig = localData.committees.map(c => ({
        name: c.name,
        location: c.location,
        // نحسب السعة الإجمالية لكل لجنة بناء على الأرقام المدخلة لكل مرحلة
        capacity: Object.values(c.counts).reduce((a, b) => a + b, 0) || 20 
    }));

    let currentCommIndex = 0;
    let currentCommFilled = 0;

    // دالة لتعيين الطالب في لجنة متاحة
    const assignCommitteeToStudent = (): string => {
        if (committeesConfig.length === 0) return 'General'; // حالة طوارئ

        // إذا انتهت اللجان، الباقي يذهب للاحتياط
        if (currentCommIndex >= committeesConfig.length) return 'احتياط';

        const comm = committeesConfig[currentCommIndex];
        const assignedName = comm.name;

        currentCommFilled++;

        // إذا امتلأت اللجنة الحالية، ننتقل للتي تليها
        if (currentCommFilled >= comm.capacity) {
            currentCommIndex++;
            currentCommFilled = 0;
        }

        return assignedName;
    };

    // ---------------------------------------------------------
    // 2. رفع بيانات الطلاب (Students)
    // ---------------------------------------------------------
    for (const stage of localData.stages) {
      for (const s of stage.students) {
        // تعيين اللجنة
        const assignedCommittee = assignCommitteeToStudent();
        
        // التأكد من وجود ID، وإلا توليد واحد مؤقت
        const docId = s.studentId && s.studentId.length > 1 
            ? s.studentId 
            : `S-${Math.floor(Math.random() * 1000000)}`;

        const studentRef = doc(db, 'students', docId);
        
        batch.set(studentRef, {
          id: docId,
          name: s.name,
          seatNumber: s.studentId || docId, // رقم الجلوس
          grade: stage.name, // المرحلة الدراسية
          className: s.class || 'عام',
          parentPhone: s.phone || '', // رقم ولي الأمر
          committeeNumber: assignedCommittee, // <--- الربط الجوهري مع اللجان
          image: `https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff&background=0284c7`
        });

        operationCounter++;
        totalUploaded++;
        await commitBatchIfFull();
      }
    }

    // ---------------------------------------------------------
    // 3. رفع بيانات المعلمين (Teachers)
    // ---------------------------------------------------------
    if (localData.teachers && localData.teachers.length > 0) {
      // نستخدم For Loop عادية للتعامل مع async/await بشكل صحيح
      for (let i = 0; i < localData.teachers.length; i++) {
        const t = localData.teachers[i];
        
        // توليد رقم وظيفي افتراضي يبدأ من 1001
        const teacherId = String(1001 + i); 
        
        const teacherRef = doc(db, 'teachers', teacherId);
        batch.set(teacherRef, {
          id: teacherId,
          name: t.name,
          phone: t.phone || '',
          qrCode: `TEACHER:${teacherId}` // هذا الكود الذي سيمسحه المعلم للدخول
        });

        operationCounter++;
        await commitBatchIfFull();
      }
    }

    // ---------------------------------------------------------
    // 4. رفع إعدادات اللجان (Committees Metadata)
    // ---------------------------------------------------------
    // هذا يساعد النظام الثاني في معرفة أسماء اللجان ومقراتها حتى لو لم يكن فيها طلاب
    for (const comm of committeesConfig) {
        const commRef = doc(db, 'committees_config', comm.name);
        batch.set(commRef, {
            committeeNumber: comm.name,
            location: comm.location,
            capacity: comm.capacity
        });
        
        operationCounter++;
        await commitBatchIfFull();
    }

    // ---------------------------------------------------------
    // 5. تنفيذ الدفعة الأخيرة المتبقية
    // ---------------------------------------------------------
    if (operationCounter > 0) {
      await batch.commit();
    }

    return { success: true, count: totalUploaded };

  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw error;
  }
  // أضف هذا الجزء قبل `await batch.commit();` في نهاية الدالة

    // ---------------------------------------------------------
    // 6. رفع جدول الاختبارات والمواد (Exam Schedule)
    // ---------------------------------------------------------
    if (localData.schedule) {
        // نرفع الجدول كوثيقة واحدة في مجموعة خاصة للإعدادات
        const scheduleRef = doc(db, 'system_config', 'exam_schedule');
        batch.set(scheduleRef, {
            ...localData.schedule,
            updatedAt: new Date().toISOString()
        });
        
        // نحتاج أيضاً لتحويل الجدول إلى "مظاريف اختبارات" (ExamEnvelopes) للنظام الثاني
        // هذا يتم عادة في النظام الثاني عند "استيراد الجدول"، لكن يمكننا تجهيز البيانات هنا
        // لتبسيط الأمر، سنكتفي برفع الجدول كـ Config، وسنقوم بتعديل النظام الثاني ليقرأ منه.
        operationCounter++;
    }
};
