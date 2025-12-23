import { AppData, PrintSettings, DynamicReportConfig, SchoolData } from '../types';

// Helper functions
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
  // For stickers, force 0 margin to allow edge-to-edge
  const marginCss = orientation === 'sticker' ? '0' : '5mm';

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
            font-size: 12px; 
            font-weight: 500;
          }
          @media print {
            @page { size: ${sizeCss}; margin: ${marginCss}; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          .page-break { page-break-after: always; }
          
          /* Table Styles */
          table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 2px solid #000; }
          th, td { 
            border: 1px solid #000; 
            padding: 4px;
            text-align: center; 
            font-size: 11px;
            color: #000; 
          }
          th { background-color: #f3f4f6 !important; font-weight: 800; border-bottom: 2px solid #000; }
          
          /* Specific Classes for Form Elements */
          .label-cell { background-color: #e5e7eb !important; font-weight: 800; }
          .value-cell { background-color: #fff; font-weight: 600; font-size: 13px; padding: 6px 4px; }
          
          /* Utility Classes */
          h1 { font-size: 18px; font-weight: 900; margin: 5px 0; color: #000; }
          h2 { font-size: 16px; font-weight: 900; margin: 4px 0; color: #000; }
          h3 { font-size: 14px; font-weight: 800; margin: 3px 0; color: #000; }
          
          .grid-container { width: 100%; }
          .form-box { border: 2px solid #000; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
          
          /* Grid for counts */
          .grid-row { display: flex; border-bottom: 1px solid #000; }
          .grid-row:last-child { border-bottom: none; }
          .grid-cell { flex: 1; border-left: 1px solid #000; padding: 2px; text-align: center; }
          .grid-cell:last-child { border-left: none; }

          /* --- STICKER SPECIFIC STYLES (Full Page / Edge-to-Edge) --- */
          .sticker-sheet {
             width: 210mm;
             height: 296mm; /* Almost A4 height */
             padding: 0;
             margin: 0;
             box-sizing: border-box;
             display: grid;
             grid-template-columns: repeat(3, 1fr);
             grid-template-rows: repeat(7, 1fr);
             gap: 0;
             page-break-after: always;
             overflow: hidden; 
          }
          
          .sticker-cell {
             width: auto;
             height: auto;
             padding: 3mm; 
             box-sizing: border-box;
             overflow: hidden;
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             text-align: center;
             background: white;
             border: 1px dotted #ccc; /* Cut guide */
          }
          
          /* Warning message for print settings */
          .print-warning {
             position: fixed; top: 0; left: 0; width: 100%; background: #fff3cd; color: #856404; text-align: center; padding: 10px; font-weight: bold; border-bottom: 1px solid #ffeeba; z-index: 9999;
          }
          @media print {
            .print-warning { display: none; }
          }
        </style>
      </head>
      <body>
        ${orientation === 'sticker' ? '<div class="print-warning no-print">تنبيه: تم ضبط الملصقات على كامل الصفحة (بدون هوامش). يرجى التأكد من إعدادات الطابعة (Margins: None / Minimum).</div>' : ''}
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

const getHeaderHTML = (school: any, settings: PrintSettings) => `
  <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; direction: rtl;">
    <div style="text-align: right; width: 30%; font-size: 10px; line-height: 1.3; font-weight: 800; color: #000;">
      <div>المملكة العربية السعودية</div>
      <div>وزارة التعليم</div>
      <div>${settings.adminName}</div>
    </div>
    <div style="text-align: center; width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
      <img src="${settings.logoUrl}" style="height: 60px; object-fit: contain; margin-bottom: 5px; filter: grayscale(100%) contrast(120%);" alt="Logo">
      <div style="font-size: 14px; font-weight: 900; text-decoration: underline; margin-top: 2px;">${settings.schoolName || school.name}</div>
    </div>
    <div style="text-align: left; width: 30%; font-size: 10px; line-height: 1.3; font-weight: 800; color: #000; padding-left: 5px;">
       <div>${school.term}</div>
       <div>${school.year}</div>
    </div>
  </div>
`;

// Helper to check visibility and get label
const getField = (config: DynamicReportConfig | undefined, key: string, defaultLabel: string) => {
  if (!config) return { visible: true, label: defaultLabel };
  const field = config.fields.find(f => f.key === key);
  return field ? { visible: field.visible, label: field.label } : { visible: true, label: defaultLabel };
};

// =========================================================================
// ==================== REPORT IMPLEMENTATIONS =============================
// =========================================================================

export const printSubstituteInvigilatorRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, examDetails?: any, subInfo?: any) => {
    // Determine Committee Data
    const committee = data.committees.find(c => String(c.id) === String(subInfo?.committeeId));
    const commName = committee ? committee.name : '...................';
    const commLoc = committee ? committee.location : '.........................................';

    // Values
    const date = examDetails?.date || '.... / .... / ....';
    const day = examDetails?.day || '...................';
    const period = examDetails?.period || '...................';
    const reserveTeacher = subInfo?.reserveTeacher || '...................................................................................';
    const originalTeacher = subInfo?.originalTeacher || '...................................................................................';
    const reason = subInfo?.reason || '..................................................................................................................';

    const content = `
    <div style="padding: 10px;">
        ${getHeaderHTML(data.school, settings)}
        
        <div style="text-align:center; margin: 30px 0;">
            <h2 style="text-decoration: underline;">محضر دخول معلم ملاحظ بديل</h2>
        </div>

        <div style="font-size: 14px; line-height: 2.2; font-weight: bold; text-align: right;">
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <div style="flex:1;">إنه في يوم: <span style="font-weight:900;">${day}</span></div>
                <div style="flex:1;">وتاريخ: <span style="font-weight:900; direction:ltr; display:inline-block;">${date}</span></div>
                <div style="flex:1;">الفترة: <span style="font-weight:900;">${period}</span></div>
            </div>

            <div style="margin-bottom: 10px;">
                تم تأمين المعلم الملاحظ (احتياط) / <span style="border-bottom: 1px dotted #000; padding: 0 10px; font-weight:900;">${reserveTeacher}</span>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div>لدخول لجنة اختبار رقم: <span style="border-bottom: 1px dotted #000; padding: 0 10px; font-weight:900;">${commName}</span></div>
                <div>ومقرها: <span style="border-bottom: 1px dotted #000; padding: 0 10px; font-weight:900;">${commLoc}</span></div>
            </div>

            <div style="margin-bottom: 10px;">
                بديلاً عن المعلم الملاحظ (أساسي) / <span style="border-bottom: 1px dotted #000; padding: 0 10px; font-weight:900;">${originalTeacher}</span>
            </div>

            <div style="margin-bottom: 20px;">
                وذلك بسبب: <span style="border-bottom: 1px dotted #000; padding: 0 10px; display: inline-block; min-width: 50%;">${reason}</span>
            </div>

        </div>

        <!-- Signature Table -->
        <div style="margin-top: 30px; margin-bottom: 50px;">
            <table style="width: 100%; border: 2px solid #000;">
                <thead>
                    <tr style="background-color: #d1d5db;">
                        <th colspan="3" style="padding: 8px; font-size: 14px; font-weight: 900; border: 1px solid #000;">لجنة الإشراف والملاحظة</th>
                    </tr>
                    <tr>
                        <th style="width: 35%; background-color: #f3f4f6;">الاسم</th>
                        <th style="width: 30%; background-color: #f3f4f6;">الصفة</th>
                        <th style="width: 35%; background-color: #f3f4f6;">التوقيع</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="height: 40px;">
                        <td></td>
                        <td style="font-weight: bold;">رئيس اللجنة</td>
                        <td></td>
                    </tr>
                    <tr style="height: 40px;">
                        <td></td>
                        <td style="font-weight: bold;">عضو</td>
                        <td></td>
                    </tr>
                    <tr style="height: 40px;">
                        <td style="font-weight: 900;">${reserveTeacher !== '...................................................................................' ? reserveTeacher : ''}</td>
                        <td style="font-weight: bold;">المعلم الملاحظ البديل</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Manager Signature (RTL: First child is Right, Last child is Left) -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px;">
            <div style="text-align: center; width: 200px;">
                <div style="font-weight: 900; margin-bottom: 30px;">مدير المدرسة</div>
                <div style="font-weight: 900;">${settings.managerName || '..........................'}</div>
            </div>
            <div style="text-align: center; width: 200px;">
                <div style="font-weight: 900;">التوقيع</div>
            </div>
        </div>

    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printLateRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, student?: any, examDetails?: any) => {
    // Fill data if available
    const sName = student?.name ? student.name : '';
    const sGrade = student?.grade ? student.grade : '';
    const sClass = student?.class ? student.class : '';
    
    const eDate = examDetails?.date || '';
    const eDay = examDetails?.day || '';
    const eSubject = examDetails?.subject || '';
    const ePeriod = examDetails?.period || '';
    const eTime = examDetails?.time || ''; // Start Time
    const arrivalTime = examDetails?.arrivalTime || '';
    const lateDuration = examDetails?.lateDuration || '';

    const content = `
    <div style="padding: 10px;">
      ${getHeaderHTML(data.school, settings)}
      
      <div style="text-align:center; margin: 20px 0;">
         <h2 style="text-decoration: underline; margin-bottom:5px;">تعهد طالب تأخر عن الاختبار بما لا يتجاوز خمس عشرة دقيقة</h2>
      </div>
      
      <!-- Student Info Table (Headers Top / Values Bottom) -->
      <table style="width: 100%; border: 2px solid #000; margin-bottom: 20px; text-align: center;">
        <tr>
            <th class="label-cell" style="width: 40%;">اسم الطالب</th>
            <th class="label-cell" style="width: 20%;">الصف / المستوى</th>
            <th class="label-cell" style="width: 20%;">المسار</th>
            <th class="label-cell" style="width: 20%;">رقم الجلوس</th>
        </tr>
        <tr>
            <td class="value-cell" style="height: 35px; font-size: 14px;">${sName}</td>
            <td class="value-cell">${sGrade}</td>
            <td class="value-cell">${sClass}</td>
            <td class="value-cell" style="font-family:monospace; font-weight:bold;">${student?.studentId || ''}</td>
        </tr>
        <tr>
            <th class="label-cell">اليوم</th>
            <th class="label-cell">التاريخ</th>
            <th class="label-cell">المادة</th>
            <th class="label-cell">الفترة</th>
        </tr>
        <tr>
            <td class="value-cell" style="height: 35px;">${eDay}</td>
            <td class="value-cell" style="direction:ltr;">${eDate}</td>
            <td class="value-cell">${eSubject}</td>
            <td class="value-cell">${ePeriod}</td>
        </tr>
      </table>

      <!-- Time Table (Values Top, Labels Bottom - Distinct Style) -->
      <table style="width: 100%; border: 2px solid #000; margin-bottom: 25px;">
         <tr style="height: 45px;">
            <td class="value-cell" style="width: 33%; font-size: 16px; font-weight: 900;">${eTime}</td>
            <td class="value-cell" style="width: 33%; font-size: 16px; font-weight: 900;">${arrivalTime}</td>
            <td class="value-cell" style="width: 33%; font-size: 16px; font-weight: 900;">${lateDuration}</td>
         </tr>
         <tr style="height: 30px;">
            <td class="label-cell">وقت بدء الاختبار</td>
            <td class="label-cell">وقت حضور الطالب</td>
            <td class="label-cell">مقدار التأخر</td>
         </tr>
      </table>

      <!-- Pledge Text -->
      <div style="border: 2px solid #000; padding: 25px; line-height: 2.2; font-size: 14px; font-weight: 600; margin-bottom: 30px; text-align: justify; position: relative;">
         أتعهد أنا الطالب / <span style="font-weight: 800; font-size: 15px;">${sName || '..........................................................'}</span> الالتزام بالحضور المبكر أيام الاختبارات وعدم تكرار التأخر، وأشعرت أنه في حال التكرار يتم حسم درجة من درجات المواظبة عن كل تأخر وعلى ذلك أوقع.
         <br><br>
         <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding-left: 50px;">
            <div style="font-weight: 800;">التوقيع: ...........................................</div>
         </div>
      </div>

      <!-- Signatures Table -->
      <table style="width: 100%; border: 2px solid #000; margin-bottom: 40px;">
         <tr style="height: 30px;">
            <td colspan="2" class="label-cell" style="width: 50%;">لجنة الإشراف والملاحظة</td>
            <td colspan="2" class="label-cell" style="width: 50%;">لجنة التحكم والضبط</td>
         </tr>
         <tr style="height: 40px;">
            <td class="label-cell" style="width: 15%;">الاسم</td>
            <td class="value-cell"></td>
            <td class="label-cell" style="width: 15%;">الاسم</td>
            <td class="value-cell"></td>
         </tr>
         <tr style="height: 40px;">
            <td class="label-cell">التوقيع</td>
            <td class="value-cell"></td>
            <td class="label-cell">التوقيع</td>
            <td class="value-cell"></td>
         </tr>
      </table>

      <!-- Manager Signature (Left aligned via flex-end) -->
      <div style="display: flex; justify-content: flex-end; padding-left: 40px; margin-bottom: 20px;">
          <div style="text-align: center; width: 250px;">
              <div style="font-weight: 800; font-size: 14px; margin-bottom: 40px;">مدير المدرسة</div>
              <div style="font-weight: 900; font-size: 14px;">${settings.managerName || '.......................................'}</div>
          </div>
      </div>

      <!-- Footer Notes -->
      <div style="font-size: 11px; font-weight: 700; margin-top: 10px; color: #333; border-top: 1px solid #ccc; padding-top: 10px;">
         • يسجل في بيان المتأخرين.<br>
         • في حالة التكرار يطبق على الطالب لائحة السلوك والمواظبة.
      </div>

    </div>
    `;
    openPrintWindow(content, 'portrait');
};

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

  for (let i = 0; i < rowsData.length; i += colsPerRo) {
    gridContent += `<div class="grid-row">`;
    for (let j = 0; j < colsPerRo; j++) {
      const item = rowsData[i + j];
      if (item) {
        gridContent += `
          <div class="grid-cell">
            <div style="display:flex; justify-content:space-between; align-items:center;">
               ${fClass.visible ? `<span style="font-size:10px">${item.stage}</span>` : ''}
               ${fComm.visible ? `<span style="font-size:11px; font-weight:900;">(${item.committee})</span>` : ''}
               ${fCount.visible ? `<span style="font-size:11px; font-weight:900;">${item.count}</span>` : ''}
            </div>
          </div>`;
      } else {
        gridContent += `<div class="grid-cell"></div>`;
      }
    }
    gridContent += `</div>`;
  }
  
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
      
      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; text-align: center; padding: 0 40px;">
            <div style="width: 30%;">
                <div>وكيل الشؤون التعليمية</div>
                <div style="margin-top: 25px;">${settings.agentName || '..........................'}</div>
            </div>
            <div style="width: 30%;">
                <div>مدير المدرسة</div>
                <div style="margin-top: 25px;">${settings.managerName || '..........................'}</div>
            </div>
      </div>
    </div>
  `;
  openPrintWindow(content, 'portrait');
};

export const printCommitteeData = (data: AppData, settings: PrintSettings) => {
    let rows = '';
    data.committees.forEach(c => {
        const total = data.stages.reduce((acc, s) => acc + (c.counts[s.id] || 0), 0);
        const stagesInComm = data.stages
            .filter(s => (c.counts[s.id] || 0) > 0)
            .map(s => s.name)
            .join('، ');
        
        rows += `
          <tr>
            <td style="font-weight:900; font-size:12px;">${c.name}</td>
            <td>${c.location}</td>
            <td>${stagesInComm}</td>
            <td style="font-weight:900;">${total}</td>
          </tr>
        `;
    });

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px;">بيانات اللجان</h2>
      <table>
        <thead>
          <tr>
            <th>رقم اللجنة</th>
            <th>مقر اللجنة</th>
            <th>الصفوف الدراسية</th>
            <th>عدد الطلاب</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; text-align: center; padding: 0 40px;">
            <div style="width: 30%;">
                <div>وكيل الشؤون التعليمية</div>
                <div style="margin-top: 25px;">${settings.agentName || '..........................'}</div>
            </div>
            <div style="width: 30%;">
                <div>مدير المدرسة</div>
                <div style="margin-top: 25px;">${settings.managerName || '..........................'}</div>
            </div>
      </div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

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
      
      const pageContent = `
        <div style="padding: 20px; text-align: center; border: 5px double #000; height: 95vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
            <div>
                 ${getHeaderHTML(data.school, settings)}
                 <h1 style="font-size: 40px; margin-top: 40px; margin-bottom: 20px;">${settings.doorLabelTitle}</h1>
                 <div style="font-size: 120px; font-weight: 900; margin: 20px 0; line-height: 1;">${committee.name}</div>
                 <div style="font-size: 24px; color: #555;">${committee.location}</div>
            </div>
            
            <div style="text-align: right; margin: 20px 40px;">
                <h3 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">تفاصيل الطلاب:</h3>
                ${detailsHtml}
                <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 24px; font-weight: 900;">
                    <span>المجموع الكلي</span>
                    <span>${totalStudents}</span>
                </div>
            </div>

            <div style="font-size: 14px; color: #999;">
                يرجى الالتزام بالهدوء داخل اللجنة
            </div>
        </div>
        <div class="page-break"></div>
      `;
      html += pageContent;
    });
    openPrintWindow(html, 'portrait');
};

export const printAttendance = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const fSeq = getField(config, 'col_seq', 'م');
    const fSeat = getField(config, 'col_seat', 'رقم الجلوس');
    const fName = getField(config, 'col_name', 'اسم الطالب');
    const fStage = getField(config, 'col_stage', 'المرحلة');
    const fPres = getField(config, 'col_pres', 'حضور');
    const fSig = getField(config, 'col_sig', 'التوقيع');

    let html = '';
    const sortedCommittees = [...data.committees].sort((a,b) => parseInt(a.name) - parseInt(b.name));

    sortedCommittees.forEach(committee => {
        const commStudents: any[] = [];
        data.stages.forEach(stage => {
            const count = committee.counts[stage.id] || 0;
            if (count > 0) {
                let startIdx = 0;
                for (const c of data.committees) {
                    if (c.id === committee.id) break;
                    startIdx += (c.counts[stage.id] || 0);
                }
                const stageStudents = stage.students.slice(startIdx, startIdx + count);
                stageStudents.forEach(s => {
                    commStudents.push({ ...s, stageName: stage.name });
                });
            }
        });
        commStudents.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        if (commStudents.length === 0) return;

        const rowsPerPage = 20;
        for (let i = 0; i < commStudents.length; i += rowsPerPage) {
            const chunk = commStudents.slice(i, i + rowsPerPage);
            const rowsHtml = chunk.map((s, idx) => `
                <tr style="height: 35px;">
                    ${fSeq.visible ? `<td style="width: 40px;">${i + idx + 1}</td>` : ''}
                    ${fSeat.visible ? `<td style="width: 100px; font-weight: bold; font-family: monospace; font-size: 14px;">${s.studentId}</td>` : ''}
                    ${fName.visible ? `<td style="text-align: right; padding-right: 10px; font-weight: bold;">${s.name}</td>` : ''}
                    ${fStage.visible ? `<td style="width: 120px;">${s.stageName}</td>` : ''}
                    ${fPres.visible ? `<td style="width: 60px;"></td>` : ''}
                    ${fSig.visible ? `<td style="width: 150px;"></td>` : ''}
                </tr>
            `).join('');

            html += `
                <div style="padding: 20px;">
                    ${getHeaderHTML(data.school, settings)}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; border: 1px solid #000; padding: 5px 10px; background: #f9f9f9;">
                         <div style="font-weight: bold;">اللجنة: <span style="font-size: 16px;">${committee.name}</span></div>
                         <div style="font-weight: bold;">المقر: <span>${committee.location}</span></div>
                         <div style="font-weight: bold;">${settings.attendanceTitle}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                ${fSeq.visible ? `<th>${fSeq.label}</th>` : ''}
                                ${fSeat.visible ? `<th>${fSeat.label}</th>` : ''}
                                ${fName.visible ? `<th>${fName.label}</th>` : ''}
                                ${fStage.visible ? `<th>${fStage.label}</th>` : ''}
                                ${fPres.visible ? `<th>${fPres.label}</th>` : ''}
                                ${fSig.visible ? `<th>${fSig.label}</th>` : ''}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                     <div style="margin-top: 20px; display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; text-align: center; padding: 0 40px;">
                        <div style="width: 30%;">
                            <div>ملاحظ اللجنة 1</div>
                            <div style="margin-top: 25px;">..........................</div>
                        </div>
                         <div style="width: 30%;">
                            <div>ملاحظ اللجنة 2</div>
                            <div style="margin-top: 25px;">..........................</div>
                        </div>
                    </div>
                </div>
                <div class="page-break"></div>
            `;
        }
    });
    openPrintWindow(html, 'portrait');
};

export const printSeatLabels = (data: AppData, settings: PrintSettings) => {
    const stickersPerPage = 21;
    let allStickers: string[] = [];
    
    const sortedCommittees = [...data.committees].sort((a,b) => parseInt(a.name) - parseInt(b.name));

    sortedCommittees.forEach(committee => {
         const commStudents: any[] = [];
         data.stages.forEach(stage => {
            const count = committee.counts[stage.id] || 0;
            if (count > 0) {
                let startIdx = 0;
                for (const c of data.committees) {
                    if (c.id === committee.id) break;
                    startIdx += (c.counts[stage.id] || 0);
                }
                const stageStudents = stage.students.slice(startIdx, startIdx + count);
                stageStudents.forEach(s => {
                    commStudents.push({ ...s, stageName: stage.name });
                });
            }
         });
         commStudents.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
         commStudents.forEach((s) => {
             const sticker = `
                <div class="sticker-cell">
                    <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">${settings.schoolName}</div>
                    <div style="font-size: 12px; margin: 5px 0; font-weight: 900;">${s.name}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 2px; font-size: 10px;">
                        <span>${s.stageName}</span>
                        <span style="font-weight: bold; font-family: monospace; font-size: 12px;">${s.studentId}</span>
                    </div>
                    <div style="background: #000; color: #fff; font-size: 10px; margin-top: 2px; border-radius: 2px;">لجنة ${committee.name}</div>
                </div>
             `;
             allStickers.push(sticker);
         });
    });
    
    let html = '';
    for (let i = 0; i < allStickers.length; i += stickersPerPage) {
        html += '<div class="sticker-sheet">';
        for (let j = 0; j < stickersPerPage; j++) {
            if (allStickers[i+j]) {
                html += allStickers[i+j];
            } else {
                html += '<div class="sticker-cell" style="border:none;"></div>';
            }
        }
        html += '</div>';
    }
    openPrintWindow(html, 'sticker');
};

export const printInvigilatorAttendance = (data: AppData, settings: PrintSettings, config: DynamicReportConfig | undefined, assignments: Record<string, string>) => {
    let rows = '';
    data.committees.forEach((c, idx) => {
        const assignedTeacher = assignments[c.name] || '';
        rows += `
            <tr style="height: 40px;">
                <td>${idx + 1}</td>
                <td style="font-weight: bold;">${c.name}</td>
                <td>${c.location}</td>
                <td style="font-weight: bold;">${assignedTeacher}</td>
                <td></td>
                <td></td>
            </tr>
        `;
    });

    const content = `
        <div style="padding: 20px;">
            ${getHeaderHTML(data.school, settings)}
            <h2 style="text-align: center; margin-bottom: 20px;">${config?.title || 'توزيع الملاحظين على اللجان'}</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">م</th>
                        <th>رقم اللجنة</th>
                        <th>مقر اللجنة</th>
                        <th>اسم الملاحظ</th>
                        <th>التوقيع (حضور)</th>
                        <th>التوقيع (انصراف)</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
             <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; text-align: center; padding: 0 40px;">
                <div style="width: 30%;">
                    <div>وكيل الشؤون التعليمية</div>
                    <div style="margin-top: 25px;">${settings.agentName || '..........................'}</div>
                </div>
                <div style="width: 30%;">
                    <div>مدير المدرسة</div>
                    <div style="margin-top: 25px;">${settings.managerName || '..........................'}</div>
                </div>
            </div>
        </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printAbsenceRecord = (data: AppData, settings: PrintSettings, config: DynamicReportConfig | undefined, student: any, examDetails: any) => {
    const sName = student?.name || '...........................................';
    const sId = student?.studentId || '....................';
    const sComm = student?.committeeName || '....................';
    
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline; margin: 30px 0;">محضر غياب طالب</h2>
        
        <div style="border: 2px solid #000; padding: 20px; font-size: 14px; line-height: 2;">
            <div style="display: flex; gap: 20px;">
                <div style="flex:1">اليوم: <b>${examDetails?.day || '................'}</b></div>
                <div style="flex:1">التاريخ: <b>${examDetails?.date || '................'}</b></div>
                <div style="flex:1">المادة: <b>${examDetails?.subject || '................'}</b></div>
            </div>
            <div style="margin-top: 20px;">
                أفيدكم أنا ملاحظ اللجنة رقم ( <b>${sComm}</b> ) بغياب الطالب:
                <div style="text-align: center; font-weight: 900; font-size: 18px; margin: 10px 0; border-bottom: 1px dotted #000;">${sName}</div>
            </div>
            <div style="display: flex; gap: 20px; margin-top: 10px;">
                <div style="flex:1">رقم الجلوس: <b>${sId}</b></div>
                <div style="flex:1">الصف: <b>${student?.stageName || '................'}</b></div>
            </div>
            
            <div style="margin-top: 30px; font-weight: bold;">
                وقد تم التأكد من غيابه بعد مرور نصف الوقت، وعليه جرى التوقيع.
            </div>
        </div>
        
        <table style="width: 100%; border: 2px solid #000; margin-top: 40px;">
             <tr>
                <td class="label-cell" colspan="2">ملاحظو اللجنة</td>
                <td class="label-cell" colspan="2">لجنة التحكم والضبط</td>
             </tr>
             <tr style="height: 40px;">
                <td class="label-cell">الاسم</td>
                <td class="value-cell"></td>
                <td class="label-cell">الاسم</td>
                <td class="value-cell"></td>
             </tr>
             <tr style="height: 40px;">
                <td class="label-cell">التوقيع</td>
                <td class="value-cell"></td>
                <td class="label-cell">التوقيع</td>
                <td class="value-cell"></td>
             </tr>
        </table>

         <div style="display: flex; justify-content: flex-end; padding-left: 40px; margin-top: 40px;">
            <div style="text-align: center; width: 250px;">
                <div style="font-weight: 800; font-size: 14px; margin-bottom: 40px;">مدير المدرسة</div>
                <div style="font-weight: 900; font-size: 14px;">${settings.managerName || '.......................................'}</div>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printQuestionEnvelopeOpening = (data: AppData, settings: PrintSettings, config: DynamicReportConfig | undefined, examDetails: any) => {
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; margin: 20px 0; text-decoration: underline;">محضر فتح مظاريف الأسئلة</h2>
        
        <div style="text-align: justify; line-height: 2; font-size: 14px; margin-bottom: 20px;">
            إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '..../..../.......'}</b> 
            وفي تمام الساعة <b>${examDetails?.time || '.......'}</b>، اجتمعت اللجنة المشرفة على الاختبارات وقامت بفتح مظروف أسئلة مادة: 
            <span style="font-weight: 900; font-size: 16px;">( ${examDetails?.subject || '..........................'} )</span>
            للصف <span style="font-weight: 900;">( ${examDetails?.grade || '..........................'} )</span>.
            <br>
            وقد وجد المظروف مغلقاً ومختوماً بختم المصدر وسليماً من أي عبث، وعدد الأسئلة بداخله مطابق لما هو مدون عليه من الخارج.
        </div>
        
        <table style="margin-top: 30px;">
            <thead>
                <tr>
                    <th colspan="3" style="background: #e5e7eb;">أعضاء اللجنة</th>
                </tr>
                <tr>
                    <th>م</th>
                    <th>الاسم</th>
                    <th>التوقيع</th>
                </tr>
            </thead>
            <tbody>
                ${[1,2,3].map(i => `<tr style="height: 40px;"><td>${i}</td><td></td><td></td></tr>`).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
             <div style="text-align: center; width: 40%;">
                <div style="font-weight: bold;">وكيل الشؤون التعليمية</div>
                <div style="margin-top: 40px; font-weight: 900;">${settings.agentName}</div>
             </div>
             <div style="text-align: center; width: 40%;">
                <div style="font-weight: bold;">مدير المدرسة</div>
                <div style="margin-top: 40px; font-weight: 900;">${settings.managerName}</div>
             </div>
        </div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printQuestionEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const content = `
        <div style="padding: 40px; text-align: center; border: 5px solid #000; height: 90vh; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="font-size: 40px; margin-bottom: 40px;">مظروف أسئلة اختبار</h1>
            <div style="font-size: 24px; margin: 20px 0; text-align: right; padding-right: 20%;">
                <div style="margin: 20px 0;">المادة: ................................................</div>
                <div style="margin: 20px 0;">الصف: ................................................</div>
                <div style="margin: 20px 0;">اليوم والتاريخ: ....................................</div>
                <div style="margin: 20px 0;">عدد الأوراق: ........................................</div>
            </div>
            <div style="margin-top: 60px; font-size: 18px;">
                 اسم معد الأسئلة: ................................................ التوقيع: ....................
            </div>
        </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printAnswerEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const content = `
        <div style="padding: 40px; text-align: center; border: 5px double #000; height: 90vh; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="font-size: 40px; margin-bottom: 40px;">مظروف أوراق إجابة</h1>
            <div style="font-size: 24px; margin: 20px 0; text-align: right; padding-right: 20%;">
                <div style="margin: 20px 0;">المادة: ................................................</div>
                <div style="margin: 20px 0;">الصف: ................................................</div>
                <div style="margin: 20px 0;">عدد الطلاب الكلي: ....................................</div>
                <div style="margin: 20px 0;">عدد الحاضرين: ........................................</div>
                <div style="margin: 20px 0;">عدد الغائبين: ..........................................</div>
                <div style="margin: 20px 0;">عدد الأوراق الموجودة: ................................</div>
            </div>
            <div style="margin-top: 60px; border-top: 2px dashed #000; padding-top: 20px;">
                 <h3 style="margin-bottom: 20px;">لجنة التصحيح والمراجعة</h3>
                 <div style="display:flex; justify-content:space-around;">
                    <div>المصحح: .......................</div>
                    <div>المراجع: .......................</div>
                 </div>
            </div>
        </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printAnswerPaperReceipt = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const fComm = getField(config, 'col_comm', 'رقم اللجنة');
    const fApps = getField(config, 'col_applicants', 'عدد الطلاب');
    const fPres = getField(config, 'col_present', 'الحاضرون');
    const fAbs = getField(config, 'col_absent', 'الغائبون');
    const fTotal = getField(config, 'col_total', 'أظرف الإجابة');
    const fNotes = getField(config, 'col_notes', 'توقيع المستلم');

    let rows = '';
    data.committees.forEach(c => {
         const total = data.stages.reduce((acc, s) => acc + (c.counts[s.id] || 0), 0);
         rows += `
            <tr style="height: 40px;">
                ${fComm.visible ? `<td style="font-weight:bold;">${c.name}</td>` : ''}
                ${fApps.visible ? `<td>${total}</td>` : ''}
                ${fPres.visible ? `<td></td>` : ''}
                ${fAbs.visible ? `<td></td>` : ''}
                ${fTotal.visible ? `<td></td>` : ''}
                ${fNotes.visible ? `<td></td>` : ''}
            </tr>
         `;
    });

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; margin-bottom: 20px;">${config?.title || 'كشف استلام أوراق الإجابة من اللجان'}</h2>
        <table>
            <thead>
                <tr>
                    ${fComm.visible ? `<th>${fComm.label}</th>` : ''}
                    ${fApps.visible ? `<th>${fApps.label}</th>` : ''}
                    ${fPres.visible ? `<th>${fPres.label}</th>` : ''}
                    ${fAbs.visible ? `<th>${fAbs.label}</th>` : ''}
                    ${fTotal.visible ? `<th>${fTotal.label}</th>` : ''}
                    ${fNotes.visible ? `<th>${fNotes.label}</th>` : ''}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 40px; text-align:center; font-weight:bold;">
             المسؤول عن الكنترول: .................................................... التوقيع: ..........................
        </div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printExamPaperTracking = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const rows = [1,2,3,4,5,6,7,8,9,10].map(i => `
        <tr style="height: 40px;">
            <td>${i}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `).join('');

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; margin-bottom: 20px;">${config?.title || 'استمارة متابعة سير أوراق الإجابة'}</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">م</th>
                    <th>المادة</th>
                    <th>الصف</th>
                    <th>وقت التسليم للكنترول</th>
                    <th>وقت التسليم للتصحيح</th>
                    <th>وقت الإعادة للكنترول</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printUnassignedStudents = (data: AppData, settings: PrintSettings) => {
    const unassigned: any[] = [];
    data.stages.forEach(stage => {
        const distributed = data.committees.reduce((acc, c) => acc + (c.counts[stage.id] || 0), 0);
        if (distributed < stage.students.length) {
            const left = stage.students.slice(distributed);
            left.forEach(s => unassigned.push({...s, stage: stage.name}));
        }
    });

    if (unassigned.length === 0) {
        alert('جميع الطلاب موزعين على اللجان.');
        return;
    }

    const rows = unassigned.map((s, i) => `
        <tr>
            <td>${i+1}</td>
            <td>${s.name}</td>
            <td>${s.studentId}</td>
            <td>${s.stage}</td>
        </tr>
    `).join('');

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; color: red;">الطلاب غير الموزعين على لجان</h2>
        <table>
            <thead>
                <tr>
                    <th>م</th>
                    <th>الاسم</th>
                    <th>رقم الجلوس</th>
                    <th>المرحلة</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printEmptyCommittees = (data: AppData, settings: PrintSettings) => {
    const empty = data.committees.filter(c => {
        const total = data.stages.reduce((acc, s) => acc + (c.counts[s.id] || 0), 0);
        return total === 0;
    });

    if (empty.length === 0) {
        alert('لا توجد لجان فارغة.');
        return;
    }

    const rows = empty.map((c, i) => `
        <tr>
            <td>${i+1}</td>
            <td>${c.name}</td>
            <td>${c.location}</td>
        </tr>
    `).join('');

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">قائمة اللجان الفارغة (بدون طلاب)</h2>
        <table style="width: 50%; margin: 0 auto;">
            <thead>
                <tr>
                    <th>م</th>
                    <th>رقم اللجنة</th>
                    <th>المقر</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printDistributionByGrade = (data: AppData, settings: PrintSettings) => {
    let html = '';
    data.stages.forEach(stage => {
        const stageComms = data.committees.filter(c => (c.counts[stage.id] || 0) > 0);
        if (stageComms.length === 0) return;

        let rows = '';
        let cursor = 1;
        stageComms.forEach(c => {
            const count = c.counts[stage.id];
            const end = cursor + count - 1;
            rows += `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.location}</td>
                    <td>${count}</td>
                    <td>من ${cursor} إلى ${end}</td>
                </tr>
            `;
            cursor += count;
        });

        html += `
            <div style="page-break-inside: avoid; margin-bottom: 30px;">
                <h3 style="background: #eee; padding: 5px;">توزيع طلاب: ${stage.name}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>رقم اللجنة</th>
                            <th>المقر</th>
                            <th>عدد الطلاب</th>
                            <th>تسلسل (افتراضي)</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    });

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">توزيع الطلاب حسب الصفوف</h2>
        ${html}
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printViolationMinutes = (data: AppData, settings: PrintSettings, config: DynamicReportConfig | undefined, student: any, examDetails: any) => {
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline; color: red;">محضر ضبط حالة غش / مخالفة</h2>
        
        <div style="margin-top: 30px; line-height: 2; text-align: justify; font-size: 14px;">
            إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '..../..../.......'}</b> 
            وفي أثناء سير اختبار مادة <b>${examDetails?.subject || '................'}</b>، 
            لوحظ قيام الطالب: <span style="font-weight: bold; font-size: 16px;">${student?.name || '................................'}</span>
            <br>
            بالصف: <b>${student?.stageName || '................'}</b> 
            رقم الجلوس: <b>${student?.studentId || '................'}</b> 
            بلجنة رقم: <b>${student?.committeeName || '...'}</b>
            <br><br>
            <b>بارتكاب المخالفة التالية:</b>
            <br>
            <div style="border: 1px solid #000; height: 100px; padding: 10px; margin-top: 5px;"></div>
            
            <br>
            <b>الوسيلة المضبوطة (إن وجدت):</b> ..........................................................................
        </div>

        <table style="margin-top: 30px;">
            <tr>
                <td colspan="2" class="label-cell">ملاحظو اللجنة</td>
                <td colspan="2" class="label-cell">شهود الواقعة (إن وجد)</td>
            </tr>
            <tr style="height: 40px;">
                <td style="width: 20%;">الاسم</td>
                <td></td>
                <td style="width: 20%;">الاسم</td>
                <td></td>
            </tr>
            <tr style="height: 40px;">
                <td>التوقيع</td>
                <td></td>
                <td>التوقيع</td>
                <td></td>
            </tr>
        </table>
        
        <div style="margin-top: 30px; border: 1px dashed #000; padding: 10px;">
            <b>رأي الطالب في الواقعة:</b>
            <br><br><br>
            <b>توقيع الطالب:</b> ..............................
        </div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printSubCommitteeTasks = (data: AppData, settings: PrintSettings) => {
    printCommitteeData(data, settings);
};