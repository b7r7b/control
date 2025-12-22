import { AppData, PrintSettings, DynamicReportConfig } from '../types';

// --- Shared Components ---

const getHeaderHTML = (school: any, settings: PrintSettings) => `
  <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; direction: rtl;">
    <div style="text-align: right; width: 35%; font-size: 11px; line-height: 1.3; font-weight: 800; color: #000;">
      <div>المملكة العربية السعودية</div>
      <div>وزارة التعليم</div>
      <div>${settings.adminName}</div>
      <div>المدرسة: ${settings.schoolName || school.name}</div>
    </div>
    <div style="text-align: center; width: 30%;">
      <img src="${settings.logoUrl}" style="height: 60px; object-fit: contain; filter: grayscale(100%) contrast(120%);" alt="Ministry Logo">
    </div>
    <div style="text-align: left; width: 35%; font-size: 11px; line-height: 1.3; font-weight: 800; color: #000; padding-left: 5px;">
       <div>${school.term}</div>
       <div>${school.year}</div>
    </div>
  </div>
`;

const getFooterHTML = () => `
  <div style="margin-top: 20px; display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; text-align: center; page-break-inside: avoid; color: #000;">
      <div style="width: 40%;">
        <div style="margin-bottom: 25px;">رئيس لجنة الاختبارات</div>
        <div>.........................................</div>
      </div>
      <div style="width: 40%;">
        <div style="margin-bottom: 25px;">رئيس الكنترول</div>
        <div>.........................................</div>
      </div>
  </div>
`;

// Helper to check visibility and get label
const getField = (config: DynamicReportConfig | undefined, key: string, defaultLabel: string) => {
  if (!config) return { visible: true, label: defaultLabel };
  const field = config.fields.find(f => f.key === key);
  return field ? { visible: field.visible, label: field.label } : { visible: true, label: defaultLabel };
};

const openPrintWindow = (content: string, orientation: 'portrait' | 'landscape' | 'sticker' = 'portrait') => {
  if (!content || content.trim() === '') {
    alert('لا توجد بيانات للطباعة.');
    return;
  }

  const w = window.open('', '_blank');
  if (!w) {
      alert('الرجاء السماح بالنوافذ المنبثقة للطباعة');
      return;
  }
  
  // Determine CSS size based on orientation
  const sizeCss = orientation === 'sticker' ? 'A4' : `A4 ${orientation}`;

  w.document.open();
  w.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <title>طباعة</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Tajawal', sans-serif; 
            direction: rtl; 
            margin: 0; 
            padding: 0; 
            background: #fff; 
            color: #000;
            font-size: 11px;
            font-weight: 700;
          }
          @media print {
            @page { size: ${sizeCss}; margin: 5mm; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          .page-break { page-break-after: always; }
          
          /* Table Styles */
          table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 2px solid #000; }
          th, td { 
            border: 1px solid #000; 
            padding: 3px 2px; 
            text-align: center; 
            font-size: 11px; 
            font-weight: 700; 
            color: #000; 
          }
          th { background-color: #f0f0f0 !important; font-weight: 900; border-bottom: 2px solid #000; }
          
          /* Utility Classes */
          h1 { font-size: 18px; font-weight: 900; margin: 5px 0; color: #000; }
          h2 { font-size: 15px; font-weight: 900; margin: 5px 0; color: #000; }
          h3 { font-size: 13px; font-weight: 800; margin: 5px 0; color: #000; }
          
          .grid-container { width: 100%; }
          .form-box { border: 2px solid #000; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
          
          /* Grid for counts */
          .grid-row { display: flex; border-bottom: 1px solid #000; }
          .grid-row:last-child { border-bottom: none; }
          .grid-cell { flex: 1; border-left: 1px solid #000; padding: 3px; text-align: center; }
          .grid-cell:last-child { border-left: none; }
        </style>
      </head>
      <body>
        ${content}
        <script>
           window.onload = function() {
             setTimeout(function() {
               window.print();
             }, 800);
           };
        </script>
      </body>
    </html>
  `);
  w.document.close();
};

// =========================================================================
// ==================== REPORT IMPLEMENTATIONS =============================
// =========================================================================

// 1. Student Counts in Committees (Form 1)
export const printStudentCountsReport = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
  const fClass = getField(config, 'col_class', 'الصف');
  const fComm = getField(config, 'col_comm', 'رقم اللجنة');
  const fCount = getField(config, 'col_count', 'عدد الطلاب');

  const rowsData: any[] = [];
  data.committees.forEach(c => {
    data.stages.forEach(s => {
      const count = c.counts[s.id] || 0;
      if (count > 0) {
        rowsData.push({ committee: c.name, stage: s.name, count: count });
      }
    });
  });

  const totalCount = rowsData.reduce((acc, r) => acc + r.count, 0);
  
  // 4 columns per row
  const colsPerRo = 4;
  let gridContent = '';
  
  // Header Row for Grid
  gridContent += `<div class="grid-row" style="background:#eee; font-weight:900; border-top:1px solid #000;">`;
  for(let k=0; k<colsPerRo; k++) {
     gridContent += `
        <div class="grid-cell">
           <div style="display:flex; justify-content:space-between; font-size:10px;">
              ${fClass.visible ? `<span>${fClass.label}</span>` : ''}
              ${fComm.visible ? `<span>${fComm.label}</span>` : ''}
              ${fCount.visible ? `<span>${fCount.label}</span>` : ''}
           </div>
        </div>`;
  }
  gridContent += `</div>`;

  // Data Rows
  for (let i = 0; i < rowsData.length; i += colsPerRo) {
    gridContent += `<div class="grid-row">`;
    for (let j = 0; j < colsPerRo; j++) {
      const item = rowsData[i + j];
      if (item) {
        gridContent += `
          <div class="grid-cell">
            <div style="display:flex; justify-content:space-between; align-items:center;">
               ${fClass.visible ? `<span style="font-size:10px">${item.stage}</span>` : ''}
               ${fComm.visible ? `<span style="font-size:12px; font-weight:900;">(${item.committee})</span>` : ''}
               ${fCount.visible ? `<span style="font-size:12px; font-weight:900;">${item.count}</span>` : ''}
            </div>
          </div>`;
      } else {
        gridContent += `<div class="grid-cell"></div>`;
      }
    }
    gridContent += `</div>`;
  }
  
  // Total Row
  gridContent += `
    <div class="grid-row" style="background:#eee; font-weight:900; border-top:1px solid #000;">
       <div class="grid-cell" style="text-align:center;">المجموع الكلي: ${totalCount} طالب</div>
    </div>
  `;

  const content = `
    <div class="grid-container">
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px;">${config?.title || 'أعداد الطلاب في اللجان'}</h2>
      <div style="border: 2px solid #000;">
         ${gridContent}
      </div>
    </div>
  `;
  openPrintWindow(content, 'portrait');
};

// 2. Invigilator Attendance List (Form 2)
export const printInvigilatorAttendance = (
    data: AppData, 
    settings: PrintSettings, 
    config?: DynamicReportConfig,
    assignments?: Record<string, string>
) => {
  const fCommNo = getField(config, 'col_comm_no', 'رقم اللجنة');
  const fCommLoc = getField(config, 'col_comm_loc', 'مقر اللجنة');
  const fSubject = getField(config, 'col_subject', 'المادة');
  const fTime = getField(config, 'col_time', 'زمن الاختبار');
  const fName = getField(config, 'col_name', 'اسم الملاحظ');
  const fSign = getField(config, 'col_sign', 'التوقيع');

  let rows = '';
  const items = data.committees.length > 0 ? data.committees : Array(15).fill({ name: '', location: '' });
  
  items.forEach((c: any) => {
    // Check if there is an assigned teacher for this committee
    const teacherName = assignments && c.name ? (assignments[c.name] || '') : '';

    rows += `
      <tr style="height: 30px;">
        ${fCommNo.visible ? `<td>${c.name || ''}</td>` : ''}
        ${fCommLoc.visible ? `<td>${c.location || ''}</td>` : ''}
        ${fSubject.visible ? `<td></td>` : ''}
        ${fTime.visible ? `<td></td>` : ''}
        ${fName.visible ? `<td>${teacherName}</td>` : ''}
        ${fSign.visible ? `<td></td>` : ''}
      </tr>
    `;
  });

  const content = `
    <div class="grid-container">
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 10px;">${config?.title || 'كشف بأسماء الملاحظين'}</h2>
      
      <div style="display:flex; border:2px solid #000; margin-bottom:10px; font-weight:900;">
        <div style="flex:1; padding:4px; border-left:1px solid #000; background:#eee; text-align:center;">اليوم</div>
        <div style="flex:2; padding:4px; border-left:1px solid #000;"></div>
        <div style="flex:1; padding:4px; border-left:1px solid #000; background:#eee; text-align:center;">التاريخ</div>
        <div style="flex:2; padding:4px; border-left:1px solid #000; text-align:center;"></div>
        <div style="flex:1; padding:4px; border-left:1px solid #000; background:#eee; text-align:center;">الفترة</div>
        <div style="flex:2; padding:4px; text-align:center;"></div>
      </div>

      <table>
        <thead>
          <tr>
            ${fCommNo.visible ? `<th style="width:50px">${fCommNo.label}</th>` : ''}
            ${fCommLoc.visible ? `<th>${fCommLoc.label}</th>` : ''}
            ${fSubject.visible ? `<th>${fSubject.label}</th>` : ''}
            ${fTime.visible ? `<th style="width:80px">${fTime.label}</th>` : ''}
            ${fName.visible ? `<th style="width:250px">${fName.label}</th>` : ''}
            ${fSign.visible ? `<th style="width:80px">${fSign.label}</th>` : ''}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:15px; display:flex; font-size:11px;">
         <div style="width:15%; border:1px solid #000; background:#eee; display:flex; align-items:center; justify-content:center; font-weight:900;">الاحتياط</div>
         <div style="width:85%;">
            <div style="border:1px solid #000; border-right:none; height:25px; display:flex;"><div style="flex:1; border-left:1px solid #000;"></div><div style="width:80px;"></div></div>
            <div style="border:1px solid #000; border-right:none; border-top:none; height:25px; display:flex;"><div style="flex:1; border-left:1px solid #000;"></div><div style="width:80px;"></div></div>
            <div style="border:1px solid #000; border-right:none; border-top:none; height:25px; display:flex;"><div style="flex:1; border-left:1px solid #000;"></div><div style="width:80px;"></div></div>
         </div>
      </div>
      <div style="margin-top:15px; font-weight:900;">مدير المدرسة: ....................................... التوقيع: .....................</div>
    </div>
  `;
  openPrintWindow(content, 'portrait');
};

// 3. Absence Record (Form 3)
export const printAbsenceRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
  const lblStudent = getField(config, 'lbl_student', 'اسم الطالب');
  const lblId = getField(config, 'lbl_id', 'رقم الجلوس');
  const lblComm = getField(config, 'lbl_comm', 'رقم اللجنة');
  const lblSubject = getField(config, 'lbl_subject', 'المادة');

  const form = `
    <div class="form-box">
        <h2 style="text-align: center; margin-bottom: 10px; text-decoration: underline;">${config?.title || 'محضر غياب طالب عن الاختبار'}</h2>
        
        <table style="margin-bottom:10px;">
           <tr style="height:30px;">
              <td style="background:#eee; width:15%;">${lblStudent.label}</td>
              <td style="width:35%;"></td>
              <td style="background:#eee; width:15%;">${lblId.label}</td>
              <td style="width:35%;"></td>
           </tr>
           <tr style="height:30px;">
              <td style="background:#eee;">اليوم</td>
              <td></td>
              <td style="background:#eee;">التاريخ</td>
              <td></td>
           </tr>
           <tr style="height:30px;">
              <td style="background:#eee;">الفترة</td>
              <td></td>
              <td style="background:#eee;">${lblComm.label}</td>
              <td></td>
           </tr>
           <tr style="height:30px;">
              <td style="background:#eee;">${lblSubject.label}</td>
              <td></td>
              <td style="background:#eee;">الصف</td>
              <td></td>
           </tr>
        </table>

        <div style="background:#ddd; padding:5px; text-align:center; font-weight:900; border:1px solid #000; border-bottom:none;">مصادقة لجنة الإشراف والملاحظة</div>
        <table style="margin-top:0;">
          <tr>
            <th style="width:40px">م</th>
            <th>الاسم</th>
            <th>الصفة</th>
            <th>التوقيع</th>
          </tr>
          <tr style="height:28px;"><td>1</td><td></td><td>رئيس اللجنة</td><td></td></tr>
          <tr style="height:28px;"><td>2</td><td></td><td>عضو</td><td></td></tr>
          <tr style="height:28px;"><td>3</td><td></td><td>ملاحظ اللجنة</td><td></td></tr>
        </table>
        
        <div style="margin-top:15px; font-weight:900; display:flex; justify-content:space-between;">
           <div>مدير المدرسة: ..............................</div>
           <div>التوقيع: ......................</div>
        </div>
        <div style="font-size:10px; margin-top:5px; color:#000; font-weight:bold;">
           * يوضع محضر الغياب حسب رقم جلوس الطالب في تسلسل أوراق الإجابة.<br>
           * يسجل في بيان الغائبين.
        </div>
    </div>
  `;
  // Two forms per page
  openPrintWindow(`<div>${getHeaderHTML(data.school, settings)}${form}<div style="margin: 20px 0; border-bottom:2px dashed #000;"></div>${form}</div>`, 'portrait');
};

// 4. Question Envelope Opening
export const printQuestionEnvelopeOpening = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
  const lblSubject = getField(config, 'lbl_subject', 'المادة');
  const lblPeriod = getField(config, 'lbl_period', 'الفترة');
  const fName = getField(config, 'col_name', 'الاسم');
  const fRole = getField(config, 'col_role', 'الصفة');

  const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; border:2px solid #000; border-radius:10px; padding:8px 20px; width:fit-content; margin:0 auto 20px auto;">${config?.title || 'محضر فتح مظروف أسئلة'}</h2>
      
      <table style="margin-bottom:20px;">
        <tr>
          <th style="padding:10px;">اليوم</th>
          <th style="padding:10px;">التاريخ</th>
          <th style="padding:10px;">${lblPeriod.label}</th>
          <th style="padding:10px;">${lblSubject.label}</th>
          <th style="padding:10px;">الصف/المستوى</th>
        </tr>
        <tr style="height:40px;">
           <td></td><td></td><td></td><td></td><td></td>
        </tr>
      </table>

      <div style="font-size:16px; line-height:2.2; text-align:center; margin-bottom:30px; font-weight:900;">
         تم فتح مظروف الأسئلة عند الساعة ( &nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp; )<br>
         ووجد: &nbsp; <span style="border:2px solid #000; width:15px; height:15px; display:inline-block; vertical-align:middle;"></span> سليم &nbsp;&nbsp;&nbsp; <span style="border:2px solid #000; width:15px; height:15px; display:inline-block; vertical-align:middle;"></span> غير سليم ،، وتم تحرير محضر بذلك.
      </div>

      <div style="background:#eee; padding:8px; text-align:center; font-weight:900; border:1px solid #000; border-bottom:none;">أعضاء اللجنة</div>
      <table>
         <thead>
           <tr>
             <th style="width:40px">م</th>
             ${fName.visible ? `<th>${fName.label}</th>` : ''}
             <th>عمله</th>
             ${fRole.visible ? `<th>${fRole.label}</th>` : ''}
             <th>التوقيع</th>
           </tr>
         </thead>
         <tbody>
           <tr style="height:40px;"><td>1</td>${fName.visible ? `<td></td>` : ''}<td>وكيل شؤون الطلاب</td>${fRole.visible ? `<td>رئيساً</td>` : ''}<td></td></tr>
           <tr style="height:40px;"><td>2</td>${fName.visible ? `<td></td>` : ''}<td>وكيل الشؤون التعليمية</td>${fRole.visible ? `<td>عضواً</td>` : ''}<td></td></tr>
           <tr style="height:40px;"><td>3</td>${fName.visible ? `<td></td>` : ''}<td>معلم</td>${fRole.visible ? `<td>عضواً</td>` : ''}<td></td></tr>
           <tr style="height:40px;"><td>4</td>${fName.visible ? `<td></td>` : ''}<td>معلم</td>${fRole.visible ? `<td>عضواً</td>` : ''}<td></td></tr>
         </tbody>
      </table>
      <div style="margin-top:40px; font-weight:900;">مدير المدرسة: ....................................... التوقيع: ........................</div>
    </div>
  `;
  openPrintWindow(content, 'portrait');
};

// 5. Question Envelope Label
export const printQuestionEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
   const lblYear = getField(config, 'lbl_year', 'العام الدراسي');
   const lblTerm = getField(config, 'lbl_term', 'الفصل الدراسي');
   const lblSubject = getField(config, 'lbl_subject', 'المادة');
   const lblCount = getField(config, 'lbl_count', 'عدد طلاب اللجنة');

   const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h1 style="text-align: center; margin-bottom: 20px;">${config?.title || 'مظروف أسئلة الطلاب'}</h1>
      
      <table style="font-size:14px; border: 2px solid #000;">
        <tr style="height:40px;">
           <td style="width:30%; background:#e0d0b0; font-weight:900;">${lblYear.label}</td>
           <td style="font-weight:900; font-size:16px;">${data.school.year}</td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblTerm.label}</td>
           <td>
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الأول 
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثاني
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثالث
           </td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">الدور</td>
           <td>
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الأول 
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثاني
           </td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblSubject.label}</td>
           <td></td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">الصف / المستوى</td>
           <td></td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">المسار</td>
           <td></td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">اليوم والتاريخ</td>
           <td> ......................... الموافق: ..... / ..... / .....</td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">الفترة</td>
           <td></td>
        </tr>
         <tr style="height:60px;">
           <td style="background:#e0d0b0; font-weight:900;">رقم اللجنة</td>
           <td></td>
        </tr>
         <tr style="height:60px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblCount.label}</td>
           <td></td>
        </tr>
      </table>
    </div>
   `;
   openPrintWindow(content, 'portrait');
};

// 6. Answer Envelope Label
export const printAnswerEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const lblYear = getField(config, 'lbl_year', 'العام الدراسي');
    const lblTerm = getField(config, 'lbl_term', 'الفصل الدراسي');
    const lblType = getField(config, 'lbl_type', 'نوع الأسئلة');
    const lblTeacher = getField(config, 'lbl_teacher', 'اسم المعلم');

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h1 style="text-align: center; margin-bottom: 20px;">${config?.title || 'مظروف أصل الإجابة النموذجية'}</h1>
      
      <table style="font-size:14px; border: 2px solid #000;">
        <tr style="height:40px;">
           <td style="width:30%; background:#e0d0b0; font-weight:900;">${lblYear.label}</td>
           <td style="font-weight:900; font-size:16px;">${data.school.year}</td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblTerm.label}</td>
           <td>
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الأول 
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثاني
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثالث
           </td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">الدور</td>
           <td>
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الأول 
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> الثاني
           </td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblType.label}</td>
           <td>
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> أساسية 
              &nbsp;&nbsp;
              <span style="display:inline-block; width:12px; height:12px; border:2px solid #000;"></span> بديلة
           </td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">المادة</td>
           <td></td>
        </tr>
        <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">الصف / المستوى</td>
           <td></td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">المسار</td>
           <td></td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">${lblTeacher.label}</td>
           <td></td>
        </tr>
         <tr style="height:40px;">
           <td style="background:#e0d0b0; font-weight:900;">توقيع المعلم</td>
           <td></td>
        </tr>
      </table>
    </div>
   `;
   openPrintWindow(content, 'portrait');
};

// 7. Answer Paper Receipt (New) - Landscape
export const printAnswerPaperReceipt = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const colComm = getField(config, 'col_comm', 'رقم اللجنة');
    const colApplicants = getField(config, 'col_applicants', 'المتقدمون');
    const colPresent = getField(config, 'col_present', 'الحاضرون');
    const colAbsent = getField(config, 'col_absent', 'الغائبون');
    const colTotal = getField(config, 'col_total', 'المجموع');
    const colNotes = getField(config, 'col_notes', 'ملاحظات');
  
    let rows = '';
    const items = data.committees.length > 0 ? data.committees : Array(15).fill({ name: '', location: '', counts: {} });
    
    items.forEach((c: any, index: number) => {
      const totalStudents = data.stages.reduce((acc, stage) => acc + (c.counts[stage.id] || 0), 0);
      rows += `
        <tr style="height: 28px;">
          <td>${index + 1}</td>
          ${colComm.visible ? `<td>${c.name || ''}</td>` : ''}
          ${colApplicants.visible ? `<td>${totalStudents || ''}</td>` : ''}
          ${colPresent.visible ? `<td></td>` : ''}
          ${colAbsent.visible ? `<td></td>` : ''}
          ${colTotal.visible ? `<td></td>` : ''}
          ${colNotes.visible ? `<td></td>` : ''}
        </tr>
      `;
    });
  
    const content = `
      <div>
        ${getHeaderHTML(data.school, settings)}
        
        <div style="background:#e0f0e0; border:2px solid #000; padding:5px 15px; margin-bottom:10px; display:flex; justify-content:space-between; font-weight:900;">
           <div>اسم النموذج: ${config?.title || 'كشف استلام أوراق الإجابة من اللجان'}</div>
           <div>رقم النموذج: ( )</div>
        </div>

        <div style="display:flex; gap:20px; font-weight:900; margin-bottom:10px; border:1px solid #000; padding:8px; background:#f9f9f9; font-size:12px;">
           <div style="flex:1;">الصف/المستوى: ........................</div>
           <div style="flex:1;">المادة: ........................</div>
           <div style="flex:1;">اليوم: ........................</div>
           <div style="flex:1;">التاريخ: .... / .... / ....</div>
        </div>
  
        <table>
          <thead>
            <tr>
              <th style="width:40px">م</th>
              ${colComm.visible ? `<th>${colComm.label}</th>` : ''}
              ${colApplicants.visible ? `<th>${colApplicants.label}</th>` : ''}
              ${colPresent.visible ? `<th>${colPresent.label}</th>` : ''}
              ${colAbsent.visible ? `<th>${colAbsent.label}</th>` : ''}
              ${colTotal.visible ? `<th>${colTotal.label}</th>` : ''}
              ${colNotes.visible ? `<th>${colNotes.label}</th>` : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
             <tr style="font-weight:900; background:#eee;">
                 <td colspan="${2 + (colComm.visible?1:0) + (colApplicants.visible?1:0) + (colPresent.visible?1:0) + (colAbsent.visible?1:0)}">المجموع</td>
                 <td></td>
                 <td></td>
             </tr>
          </tfoot>
        </table>
  
        <div style="margin-top:20px; display:flex; justify-content:space-between; font-weight:900;">
           <div style="width:40%;">
              <div>المستلم (عضو لجنة التحكم والضبط):</div>
              <div style="margin-top:10px;">الاسم: ............................................</div>
              <div style="margin-top:10px;">التوقيع: ............................................</div>
           </div>
           <div style="width:40%; text-align:left; padding-top:20px;">
               • يحفظ في ملف الاختبارات.
           </div>
        </div>
      </div>
    `;
    openPrintWindow(content, 'landscape');
};
  
// 8. Exam Paper Tracking (New) - Landscape
export const printExamPaperTracking = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const lblTeacher = getField(config, 'lbl_teacher', 'اسم المعلم');
    const lblSubject = getField(config, 'lbl_subject', 'المادة');
    const lblGrade = getField(config, 'lbl_grade', 'الصف / المستوى');
    const lblTrack = getField(config, 'lbl_track', 'المسار');
    const lblAssignDate = getField(config, 'lbl_assign_date', 'تاريخ الاستلام');
    const lblAssignSig = getField(config, 'lbl_assign_sig', 'التوقيع');
    const lblEnvQ = getField(config, 'lbl_env_q', 'أصل الأسئلة');
    const lblEnvA = getField(config, 'lbl_env_a', 'أصل الإجابة');
    const lblEnvS = getField(config, 'lbl_env_s', 'أسئلة الطلاب');
    const lblDeliverDate = getField(config, 'lbl_deliver_date', 'تاريخ التسليم');
    const lblDeliverSig = getField(config, 'lbl_deliver_sig', 'التوقيع');
  
    let rows = '';
    for(let i=0; i<15; i++) {
        rows += `
          <tr style="height: 30px;">
             ${lblTeacher.visible ? `<td></td>` : ''}
             ${lblSubject.visible ? `<td></td>` : ''}
             ${lblGrade.visible ? `<td></td>` : ''}
             ${lblTrack.visible ? `<td></td>` : ''}
             
             ${lblAssignDate.visible ? `<td style="font-size:10px; color:#aaa;"></td>` : ''}
             ${lblAssignSig.visible ? `<td></td>` : ''}

             ${lblEnvQ.visible ? `<td></td>` : ''}
             ${lblEnvA.visible ? `<td></td>` : ''}
             ${lblEnvS.visible ? `<td></td>` : ''}

             ${lblDeliverDate.visible ? `<td style="font-size:10px; color:#aaa;"></td>` : ''}
             ${lblDeliverSig.visible ? `<td></td>` : ''}
             <td></td>
          </tr>
        `;
    }
  
    const content = `
      <div>
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; color: #333; margin-bottom: 15px;">${config?.title || 'متابعة تسليم واستلام أسئلة ونماذج الإجابة وتصويرها وتغليفها'}</h2>
        
        <table style="width:100%;">
          <thead>
            <tr style="background:#d0e0d0;">
               ${lblTeacher.visible ? `<th rowspan="2">${lblTeacher.label}</th>` : ''}
               ${lblSubject.visible ? `<th rowspan="2">${lblSubject.label}</th>` : ''}
               ${lblGrade.visible ? `<th rowspan="2">${lblGrade.label}</th>` : ''}
               ${lblTrack.visible ? `<th rowspan="2">${lblTrack.label}</th>` : ''}
               
               <th colspan="${(lblAssignDate.visible?1:0) + (lblAssignSig.visible?1:0)}" style="background:#e0e0e0;">استلام قرار التكليف</th>
               
               ${lblEnvQ.visible ? `<th rowspan="2" style="width:50px;">${lblEnvQ.label}</th>` : ''}
               ${lblEnvA.visible ? `<th rowspan="2" style="width:50px;">${lblEnvA.label}</th>` : ''}
               ${lblEnvS.visible ? `<th rowspan="2" style="width:70px;">${lblEnvS.label}</th>` : ''}

               <th colspan="${(lblDeliverDate.visible?1:0) + (lblDeliverSig.visible?1:0)}" style="background:#e0e0e0;">تسليم وكيل الشؤون التعليمية</th>
               
               <th rowspan="2">ملاحظات</th>
            </tr>
            <tr style="background:#f0f0f0;">
               ${lblAssignDate.visible ? `<th style="width:80px;">${lblAssignDate.label}</th>` : ''}
               ${lblAssignSig.visible ? `<th>${lblAssignSig.label}</th>` : ''}
               
               ${lblDeliverDate.visible ? `<th style="width:80px;">${lblDeliverDate.label}</th>` : ''}
               ${lblDeliverSig.visible ? `<th>${lblDeliverSig.label}</th>` : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    openPrintWindow(content, 'landscape');
};

// --- Standard Reports ---

export const printDoorLabels = (data: AppData, settings: PrintSettings) => {
    let html = '';
    data.committees.forEach(committee => {
      const totalStudents = data.stages.reduce((acc, stage) => acc + (committee.counts[stage.id] || 0), 0);
      if (totalStudents === 0) return;
      let detailsHtml = '';
      data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        if (count > 0) {
          detailsHtml += `<div style="display: flex; justify-content: space-between; border-bottom: 2px dotted #ccc; padding: 10px 0; font-size: 20px;"><span>${stage.name}</span><span style="font-weight: 900; color: #208caa;">${count}</span></div>`;
        }
      });
      const pageContent = `<div style="padding: 10px; position: relative;">${getHeaderHTML(data.school, settings)}<div style="text-align: center; margin-top: 20px;"><h1 style="font-size: 24px; color: #208caa; border: 3px solid #208caa; display: inline-block; padding: 8px 40px; border-radius: 50px;">${settings.doorLabelTitle}</h1></div><div style="border: 5px solid #000; border-radius: 30px; padding: 40px; margin: 30px auto; width: 85%; background: #fff; text-align: center; box-shadow: 10px 10px 0px #eee;"><div style="font-size: 24px; color: #000; margin-bottom: 10px; font-weight:800;">لجنة رقم</div><div style="font-size: 180px; font-weight: 900; line-height: 1; color: #000;">${committee.name}</div><div style="font-size: 40px; margin-top: 20px; color: #7030A0; font-weight: 900;">${committee.location || ''}</div></div><div style="width: 80%; margin: 30px auto; text-align: right; background: #f9f9f9; padding: 20px; border-radius: 20px; border: 2px solid #ddd;">${detailsHtml}<div style="margin-top: 20px; padding-top: 15px; border-top: 3px solid #000; font-weight: 900; font-size: 24px; text-align: left;">الإجمالي: ${totalStudents} طالب</div></div></div>`;
      html += `<div class="page-break">${pageContent}</div>`;
    });
    openPrintWindow(html, 'portrait');
};

export const printAttendance = (data: AppData, settings: PrintSettings) => {
    let html = '';
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);

  data.committees.forEach(committee => {
    let rows = '';
    let sn = 1;
    let hasStudents = false;
    data.stages.forEach(stage => {
      const count = committee.counts[stage.id] || 0;
      if (count > 0) {
        hasStudents = true;
        for (let i = 0; i < count; i++) {
          const idx = cursors[stage.id]++;
          const student = stage.students[idx] || { name: '...', studentId: '-' };
          const seatNumber = stage.prefix + String(idx + 1).padStart(3, '0');
          rows += `<tr>${settings.showColSequence ? `<td style="width:30px;">${sn++}</td>` : ''}${settings.showColSeatId ? `<td style="font-weight: 900; font-size: 13px;">${seatNumber}</td>` : ''}${settings.showColName ? `<td style="text-align: right; padding-right: 10px; font-weight: 800;">${student.name}</td>` : ''}${settings.showColStage ? `<td>${stage.name}</td>` : ''}${settings.showColPresence ? `<td></td>` : ''}${settings.showColSignature ? `<td></td>` : ''}</tr>`;
        }
      }
    });
    if (!hasStudents) return;
    const pageContent = `<div>${getHeaderHTML(data.school, settings)}<div style="text-align: center; margin: 10px 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;"><h2 style="margin: 0; color: #208caa; font-size: 20px;">${settings.attendanceTitle}</h2><div style="display: flex; justify-content: center; gap: 20px; margin-top: 5px; font-size: 16px; font-weight: 800;"><span>اللجنة: ${committee.name}</span><span>|</span><span>المقر: ${committee.location || '___'}</span></div></div><table><thead><tr>${settings.showColSequence ? `<th style="width: 30px;">${settings.colSequence}</th>` : ''}${settings.showColSeatId ? `<th style="width: 80px;">${settings.colSeatId}</th>` : ''}${settings.showColName ? `<th>${settings.colName}</th>` : ''}${settings.showColStage ? `<th style="width: 100px;">${settings.colStage}</th>` : ''}${settings.showColPresence ? `<th style="width: 60px;">${settings.colPresence}</th>` : ''}${settings.showColSignature ? `<th style="width: 100px;">${settings.colSignature}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table><div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: 800; font-size: 12px; text-align: center;"><div style="width: 30%;"><div>الملاحظ الأول</div><div style="margin-top: 20px;">..........................</div></div><div style="width: 30%;"><div>الملاحظ الثاني</div><div style="margin-top: 20px;">..........................</div></div><div style="width: 30%;"><div>مدير المدرسة</div><div style="margin-top: 20px;">..........................</div></div></div></div>`;
    html += `<div class="page-break">${pageContent}</div>`;
  });
  openPrintWindow(html, 'portrait');
};

export const printSeatLabels = (data: AppData, settings: PrintSettings) => {
  // Seat labels use a very specific grid, they don't use standard A4 portrait margins.
  // We handle this by setting a custom page style inside the openPrintWindow logic or just use 'sticker' type
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);
  let html = '';
  const ITEMS_PER_PAGE = 21;
  data.committees.forEach(committee => {
    const committeeStickers: any[] = [];
    data.stages.forEach(stage => {
      const count = committee.counts[stage.id] || 0;
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const idx = cursors[stage.id]++;
          const student = stage.students[idx] || { name: '...', studentId: '-' };
          const seatNumber = stage.prefix + String(idx + 1).padStart(3, '0');
          committeeStickers.push({ studentName: student.name, seatNumber: seatNumber, stageName: stage.name, committeeName: committee.name, location: committee.location });
        }
      }
    });
    if (committeeStickers.length === 0) return;
    for (let i = 0; i < committeeStickers.length; i += ITEMS_PER_PAGE) {
      const pageItems = committeeStickers.slice(i, i + ITEMS_PER_PAGE);
      let cellsHtml = '';
      pageItems.forEach(item => {
        cellsHtml += `<div style="border: 1px dashed #aaa; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 4px; overflow: hidden; background: white; height: 100%;"><div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 2px;"><div style="font-size: 8px; text-align: right; line-height: 1.1; font-weight: 900;"><div>وزارة التعليم</div><div>${settings.schoolName || data.school.name}</div></div><img src="${settings.logoUrl}" style="height: 20px;"><div style="font-size: 8px; text-align: left; line-height: 1.1;"><div>${data.school.term}</div><div>${settings.stickerTitle}</div></div></div><div style="flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; line-height: 1.1; padding: 2px;">${item.studentName}</div><div style="background: #f0f0f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; padding: 2px 4px; border-radius: 4px; font-weight: bold;"><div>لجنة: <b>${item.committeeName}</b></div><div style="font-size: 14px; font-weight: 900; background: #fff; padding: 0 4px; border: 1px solid #ddd; border-radius: 3px;">${item.seatNumber}</div><div>${item.stageName}</div></div></div>`;
      });
      const remaining = ITEMS_PER_PAGE - pageItems.length;
      for(let r=0; r<remaining; r++) { cellsHtml += `<div></div>`; }
      html += `<div class="page-break" style="width: 100%; height: 98vh; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(7, 1fr); gap: 0; padding: 0;">${cellsHtml}</div>`;
    }
  });
  if (html === '') { alert('لا يوجد طلاب لتوليد الملصقات.'); return; }
  openPrintWindow(html, 'sticker');
};

// ... Old Administrative Forms (Keeping them as legacy support, but adding new ones below)
export const printExamFileCover = (data: AppData, settings: PrintSettings) => {
    // Legacy Implementation
    const listItems = ["احصائية الحضور اليومي", "استلام الكنترول من الملاحظين", "أسماء المصححين والمراجعين", "اعداد التصوير", "اعداد الطلاب", "المادة وتصحيحها ومراجعتها", "تأخر طالب", "تسليم أسئلة الاختبار", "توزيع الملاحظين", "جدول التصوير", "عدد الطلاب في كل لجنة", "غش طالب", "غياب طالب", "كليشة ظروف الاختبارات", "محضر فتح المظروف", "استلام وتسليم أوراق الإجابة للمصححين والمراجعين"];
    const content = `<div><div style="text-align: center; margin-bottom: 40px;"><img src="https://salogos.org/wp-content/uploads/2021/11/UntiTtled-1.png" style="height: 120px;"><h1 style="font-size: 32px; margin-top: 10px; color: #000; font-weight:900;">ملف الاختبارات</h1><h2 style="font-size: 18px; color: #555;">${settings.schoolName || data.school.name} - ${data.school.year}</h2></div><div style="border: 2px solid #208caa; border-radius: 15px; padding: 20px; background: #fcfcfc;"><h3 style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 20px; color: #208caa;">محتويات الملف</h3><div style="display: flex; flex-wrap: wrap; direction: rtl;">${listItems.map(item => `<div style="width: 50%; padding: 10px; box-sizing: border-box; display: flex; align-items: center; font-size: 14px; font-weight: bold;"><span style="width: 20px; height: 20px; border: 2px solid #555; border-radius: 4px; display: inline-block; margin-left: 10px;"></span>${item}</div>`).join('')}</div></div><div style="text-align: center; margin-top: 50px; font-size: 12px; color: #888;">تم إصدار هذا الملف من نظام الكنترول المدرسي</div></div>`;
    openPrintWindow(content, 'portrait');
};
export const printControlReceipt = (data: AppData, settings: PrintSettings) => {
    // Legacy
    // ... same as before
    const stageCols = data.stages.length > 0 ? data.stages.map(s => `<th colspan="3">${s.name}</th>`).join('') : '<th colspan="3">الصف ........</th><th colspan="3">الصف ........</th>';
    const stageSubCols = data.stages.length > 0 ? data.stages.map(() => `<th style="font-size:9px">الحضور</th><th style="font-size:9px">الغياب</th><th style="font-size:9px">المجموع</th>`).join('') : Array(2).fill(`<th style="font-size:9px">الحضور</th><th style="font-size:9px">الغياب</th><th style="font-size:9px">المجموع</th>`).join('');
    let rows = '';
    if (data.committees.length > 0) { data.committees.forEach(comm => { const cells = data.stages.length > 0 ? data.stages.map(() => `<td></td><td></td><td></td>`).join('') : Array(2).fill(`<td></td><td></td><td></td>`).join(''); rows += `<tr style="height: 35px;"><td style="font-weight:bold">${comm.name}</td><td>${comm.location}</td>${cells}<td></td><td></td></tr>`; }); } else { for(let i=1; i<=15; i++) { const cells = Array(data.stages.length || 2).fill(`<td></td><td></td><td></td>`).join(''); rows += `<tr style="height: 35px;"><td>${i}</td><td></td>${cells}<td></td><td></td></tr>`; } }
    const content = `<div>${getHeaderHTML(data.school, settings)}<h2 style="text-align: center; color: #333; margin-bottom: 20px;">استلام الكنترول من الملاحظين</h2><div style="text-align: center; margin-bottom: 20px; font-weight: bold;">اليوم: ..................... الموافق: .... / .... / .... 14هـ &nbsp;&nbsp;&nbsp; الفترة: .....................</div><table><thead><tr><th rowspan="2" style="width: 50px;">اللجنة</th><th rowspan="2" style="width: 80px;">مقرها</th>${stageCols}<th rowspan="2" style="width: 100px;">التوقيع</th><th rowspan="2" style="width: 60px;">التوقيت</th></tr><tr>${stageSubCols}</tr></thead><tbody>${rows}</tbody></table>${getFooterHTML()}</div>`;
    openPrintWindow(content, 'portrait');
};
export const printCorrectionTracking = (data: AppData, settings: PrintSettings) => {
    // Legacy
    let rows = ''; for(let i=0; i<12; i++) { rows += `<tr style="height: 45px;"><td></td><td></td><td><div style="display:flex; justify-content:space-between; padding:0 2px;"><span></span><span></span><span></span></div></td><td><div style="display:flex; justify-content:space-between; padding:0 2px;"><span></span><span></span><span></span></div></td><td><div style="display:flex; justify-content:space-between; padding:0 2px;"><span></span><span></span><span></span></div></td><td><div style="display:flex; justify-content:space-between; padding:0 2px;"><span></span><span></span><span></span></div></td><td></td></tr>`; }
    const content = `<div>${getHeaderHTML(data.school, settings)}<h2 style="text-align: center; color: #333; margin-bottom: 20px;">المادة وتصحيحها ومراجعتها</h2><table><thead><tr><th rowspan="2" style="width: 100px;">اليوم والتاريخ</th><th rowspan="2">المادة</th><th style="width: 80px;">صححت</th><th style="width: 80px;">روجعت</th><th style="width: 80px;">دققت</th><th style="width: 80px;">رصدت</th><th rowspan="2" style="width: 150px;">ملاحظات</th></tr><tr><td style="font-size:9px; background:#f0f8ff;">1 | 2 | 3</td><td style="font-size:9px; background:#f0f8ff;">1 | 2 | 3</td><td style="font-size:9px; background:#f0f8ff;">1 | 2 | 3</td><td style="font-size:9px; background:#f0f8ff;">1 | 2 | 3</td></tr></thead><tbody>${rows}</tbody></table>${getFooterHTML()}</div>`;
    openPrintWindow(content, 'portrait');
};
export const printAbsenceReport = (data: AppData, settings: PrintSettings) => {
    printAbsenceRecord(data, settings, undefined);
};
export const printEnvelopeOpening = (data: AppData, settings: PrintSettings) => {
    printQuestionEnvelopeOpening(data, settings, undefined);
};
export const printInvigilatorDistribution = (data: AppData, settings: PrintSettings) => {
    let rows = ''; for(let i=1; i<=20; i++) { rows += `<tr style="height: 30px;"><td>${i}</td><td style="text-align: right; padding-right: 10px;"></td><td></td><td></td><td></td><td></td></tr>`; }
    const content = `<div>${getHeaderHTML(data.school, settings)}<h2 style="text-align: center; color: #333; margin-bottom: 20px;">جدول توزيع الملاحظين</h2><div style="text-align: center; margin-bottom: 20px; font-weight: bold; display: flex; justify-content: center; gap: 30px;"><span>اليوم: ..........................</span><span>المادة: ..........................</span><span>التاريخ: ..... / ..... / 14هـ</span></div><table><thead><tr><th rowspan="2" style="width: 40px;">م</th><th rowspan="2">اسم الملاحظ</th><th colspan="2">الفترة الأولى</th><th colspan="2">الفترة الثانية</th></tr><tr><th style="width: 80px;">اللجنة</th><th style="width: 80px;">التوقيع</th><th style="width: 80px;">اللجنة</th><th style="width: 80px;">التوقيع</th></tr></thead><tbody>${rows}</tbody></table>${getFooterHTML()}</div>`;
    openPrintWindow(content, 'portrait');
};