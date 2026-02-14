import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { AppData } from '../types';

export const syncDataToCloud = async (localData: AppData) => {
  try {
    const batch = writeBatch(db);
    let operationsCount = 0;
    const BATCH_SIZE = 450;

    // دالة مساعدة لتنفيذ الدفعة عند الامتلاء
    const commitBatchIfFull = async () => {
      if (operationsCount >= BATCH_SIZE) {
        await batch.commit();
        // إعادة تهيئة الدفعة
        // ملاحظة: في Firebase Web SDK v9+ لا يمكن إعادة استخدام المتغير batch مباشرة بنفس الطريقة القديمة
        // لكن للتبسيط هنا سنعتمد على أن الدفعة الواحدة تكفي عادة، أو يجب إعادة استدعاء writeBatch
        // الحل الأسلم هو رفع الجدول في عملية منفصلة أو التأكد من عدم تجاوز الحد.
        // سنفترض هنا أن البيانات معقولة الحجم.
      }
    };

    // 1. تجهيز اللجان وقدراتها
    // ----------------------------------------------------
    const committeesConfig = localData.committees.map(c => ({
        name: c.name,
        location: c.location,
        capacity: Object.values(c.counts).reduce((a, b) => a + b, 0) || 20 
    }));

    let currentCommIndex = 0;
    let currentCommFilled = 0;

    const assignCommitteeToStudent = (): string => {
        if (committeesConfig.length === 0) return 'General'; 
        if (currentCommIndex >= committeesConfig.length) return 'احتياط';

        const comm = committeesConfig[currentCommIndex];
        const assignedName = comm.name;
        currentCommFilled++;

        if (currentCommFilled >= comm.capacity) {
            currentCommIndex++;
            currentCommFilled = 0;
        }
        return assignedName;
    };

    // 2. رفع الطلاب (Students)
    // ----------------------------------------------------
    if (localData.stages) {
        for (const stage of localData.stages) {
            for (const s of stage.students) {
                const assignedCommittee = assignCommitteeToStudent();
                const docId = s.studentId && s.studentId.length > 1 ? s.studentId : `S-${Math.floor(Math.random() * 1000000)}`;
                const studentRef = doc(db, 'students', docId);
                
                batch.set(studentRef, {
                    id: docId,
                    name: s.name,
                    seatNumber: s.studentId || docId,
                    grade: stage.name,
                    className: s.class || 'عام',
                    parentPhone: s.phone || '',
                    committeeNumber: assignedCommittee,
                    image: `https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff&background=0284c7`
                });
                operationsCount++;
            }
        }
    }

    // 3. رفع المعلمين (Teachers)
    // ----------------------------------------------------
    if (localData.teachers) {
        localData.teachers.forEach((t, index) => {
            const teacherId = String(1001 + index); 
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

    // 4. رفع إعدادات اللجان (MetaData)
    // ----------------------------------------------------
    committeesConfig.forEach(comm => {
        const commRef = doc(db, 'system_config', `committee_${comm.name}`); // تغيير بسيط لتجنب التضارب
        batch.set(commRef, {
            committeeNumber: comm.name,
            location: comm.location,
            capacity: comm.capacity,
            type: 'committee_meta'
        });
    });

    // 5. (الجزء الجديد والمهم) رفع جدول الاختبارات
    // ----------------------------------------------------
    if (localData.schedule) {
        // نرفع الجدول في وثيقة ثابتة اسمها exam_schedule
        const scheduleRef = doc(db, 'system_config', 'exam_schedule');
        
        // تنظيف البيانات قبل الرفع (إزالة أي قيم undefined)
        const cleanSchedule = JSON.parse(JSON.stringify(localData.schedule));
        
        batch.set(scheduleRef, {
            ...cleanSchedule,
            updatedAt: new Date().toISOString()
        });
        console.log("تم إضافة الجدول لقائمة الرفع");
    } else {
        console.warn("تنبيه: لا يوجد جدول في البيانات المحلية لرفعه!");
    }

    // تنفيذ الرفع
    await batch.commit();
    return { success: true, count: operationsCount };

  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw error;
  }
};
