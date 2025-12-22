import { AppData, PrintSettings, DynamicReportConfig } from '../types';

// --- Shared Components ---

const getHeaderHTML = (school: any, settings: PrintSettings) => `
  <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; direction: rtl;">
    <div style="text-align: right; width: 30%; font-size: 11px; line-height: 1.4; font-weight: 800; color: #000;">
      <div>المملكة العربية السعودية</div>
      <div>وزارة التعليم</div>
      <div>${settings.adminName}</div>
    </div>
    <div style="text-align: center; width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
      <img src="${settings.logoUrl}" style="height: 60px; object-fit: contain; margin-bottom: 5px; filter: grayscale(100%) contrast(120%);" alt="Logo">
      <div style="font-size: 14px; font-weight: 900; text-decoration: underline; margin-top: 2px;">${settings.schoolName || school.name}</div>
    </div>
    <div style="text-align: left; width: 30%; font-size: 11px; line-height: 1.4; font-weight: 800; color: #000; padding-left: 5px;">
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
  // For stickers, we force 0 margin on @page to handle physical margins manually in CSS
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
            font-size: 11px;
            font-weight: 700;
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

          /* --- STICKER SPECIFIC STYLES (Avery L7160 / 3x7) --- */
          .sticker-sheet {
             width: 210mm;
             height: 297mm;
             
             /* 
                === إعدادات الهوامش العلوية (هام جداً) ===
                القياسي هو 15.1mm.
                اذا كانت الطباعة منخفضة (تخرج عن الملصق من الأسفل)، قلل هذا الرقم (مثلاً اجعله 10mm أو 12mm).
                اذا كانت الطباعة مرتفعة جداً (تخرج عن الملصق من الأعلى)، زد هذا الرقم (مثلاً اجعله 20mm).
             */
             padding-top: 12.0mm; 
             
             padding-left: 7.2mm; 
             padding-right: 7.2mm; 
             
             box-sizing: border-box;
             display: grid;
             /* 3 Columns of 63.5mm */
             grid-template-columns: 63.5mm 63.5mm 63.5mm;
             /* 7 Rows of 38.1mm */
             grid-template-rows: repeat(7, 38.1mm);
             /* Horizontal Gap 2.5mm */
             column-gap: 2.5mm;
             row-gap: 0mm;
             page-break-after: always;
             overflow: hidden; 
          }
          
          .sticker-cell {
             width: 63.5mm;
             height: 38.1mm;
             padding: 1mm 2mm; 
             box-sizing: border-box;
             overflow: hidden;
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             text-align: center;
             background: white;
             /* حدود وهمية للمساعدة في المعاينة - لا تظهر في الطباعة عادة إذا كانت خفيفة */
             /* border: 1px dashed #eee; */
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
        ${orientation === 'sticker' ? '<div class="print-warning no-print">تنبيه: تأكد من ضبط إعدادات الطابعة (Scale) على 100% وإلغاء خيار (Fit to Page) لضمان دقة الملصقات.</div>' : ''}
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
            <td style="font-weight:900; font-size:14px;">${c.name}</td>
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
      const pageContent = `<div style="padding: 10px; position: relative;">${getHeaderHTML(data.school, settings)}<div style="text-align: center; margin-top: 20px;"><h1 style="font-size: 24px; color: #208caa; border: 3px solid #208caa; display: inline-block; padding: 8px 40px; border-radius: 50px;">${settings.doorLabelTitle}</h1></div><div style="border: 5px solid #000; border-radius: 30px; padding: 40px; margin: 30px auto; width: 85%; background: #fff; text-align: center; box-shadow: 10px 10px 0px #eee;"><div style="font-size: 24px; color: #000; margin-bottom: 10px; font-weight:800;">لجنة رقم</div><div style="font-size: 180px; font-weight: 900; line-height: 1; color: #000;">${committee.name}</div><div style="font-size: 40px; margin-top: 20px; color: #7030A0; font-weight: 900;">${committee.location || ''}</div></div><div style="width: 80%; margin: 30px auto; text-align: right; background: #f9f9f9; padding: 20px; border-radius: 20px; border: 2px solid #ddd;">${detailsHtml}<div style="margin-top: 20px; padding-top: 15px; border-top: 3px solid #000; font-weight: 900; font-size: 24px; text-align: left;">الإجمالي: ${totalStudents} طالب</div></div></div>`;
      html += `<div class="page-break">${pageContent}</div>`;
    });
    openPrintWindow(html, 'portrait');
};

// REVERTED: Print Attendance Grouped by Stage
export const printAttendance = (data: AppData, settings: PrintSettings) => {
  let html = '';
  // Track cursor per stage to know which student we are on
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);

  data.committees.forEach(committee => {
    let rows = '';
    let sn = 1;
    let hasStudents = false;
    
    // Iterate stages sequentially
    data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        if (count > 0) {
            hasStudents = true;

            for(let i=0; i<count; i++) {
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

// UPDATED: Seat Labels - CLASSIC LAYOUT (Logo + Text)
export const printSeatLabels = (data: AppData, settings: PrintSettings) => {
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);
  
  let html = '';
  const ITEMS_PER_PAGE = 21; // 3 columns * 7 rows
  
  data.committees.forEach(committee => {
    const committeeStickers: any[] = [];
    
    // Collect students sequentially
    data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        for(let i=0; i<count; i++) {
            const idx = cursors[stage.id]++;
            const student = stage.students[idx] || { name: '...', studentId: '-' };
            const seatNumber = stage.prefix + String(idx + 1).padStart(3, '0');
            
            committeeStickers.push({ 
                studentName: student.name, 
                seatNumber: seatNumber, 
                stageName: stage.name, 
                committeeName: committee.name, 
                location: committee.location 
            });
        }
    });
    
    if (committeeStickers.length === 0) return;
    
    for (let i = 0; i < committeeStickers.length; i += ITEMS_PER_PAGE) {
      const pageItems = committeeStickers.slice(i, i + ITEMS_PER_PAGE);
      let cellsHtml = '';
      
      pageItems.forEach(item => {
        cellsHtml += `
          <div class="sticker-cell">
             <!-- Top Row: Logo & School Name -->
             <div style="display: flex; align-items: center; justify-content: space-between; height: 12mm; border-bottom: 1px solid #ddd; padding-bottom: 1px;">
                <div style="display:flex; align-items:center;">
                   <img src="${settings.logoUrl}" style="height: 10mm; width: auto; max-width: 15mm; object-fit: contain; filter: grayscale(100%) contrast(120%);" />
                </div>
                <div style="flex: 1; text-align: center; font-size: 8px; font-weight: 800; line-height: 1.1; overflow: hidden; max-height: 100%;">
                    <div>المملكة العربية السعودية</div>
                    <div>وزارة التعليم</div>
                    <div style="font-weight: 900;">${settings.schoolName || data.school.name}</div>
                </div>
             </div>
             
             <!-- Middle Row: Student Name -->
             <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                 <div style="font-weight: 900; font-size: 14px; line-height: 1.2; color: #000; text-align: center; overflow: hidden; max-height: 2.4em;">
                    ${item.studentName}
                 </div>
             </div>
             
             <!-- Bottom Row: Details -->
             <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 2px;">
                 <div style="text-align: right;">
                    <span style="font-size: 8px;">اللجنة:</span>
                    <span style="font-size: 12px; font-weight: 900;">${item.committeeName}</span>
                 </div>
                 <div style="text-align: left;">
                    <span style="font-size: 8px;">جلوس:</span>
                    <span style="font-size: 14px; font-weight: 900;">${item.seatNumber}</span>
                 </div>
             </div>
             <div style="font-size: 7px; text-align: center; margin-top: -2px;">${item.stageName}</div>
          </div>`;
      });
      
      // Fill remaining cells
      const remaining = ITEMS_PER_PAGE - pageItems.length;
      for(let r=0; r<remaining; r++) { cellsHtml += `<div class="sticker-cell"></div>`; }
      
      // Page Container (Grid)
      html += `
        <div class="sticker-sheet">
           ${cellsHtml}
        </div>`;
    }
  });
  
  if (html === '') { alert('لا يوجد طلاب لتوليد الملصقات.'); return; }
  openPrintWindow(html, 'sticker');
};

export const printInvigilatorAttendance = (
    data: AppData, 
    settings: PrintSettings, 
    config?: DynamicReportConfig,
    assignments?: Record<string, string>
) => {
// ... [rest of file unchanged]
  const fCommNo = getField(config, 'col_comm_no', 'رقم اللجنة');
  const fCommLoc = getField(config, 'col_comm_loc', 'مقر اللجنة');
  const fSubject = getField(config, 'col_subject', 'المادة');
  const fTime = getField(config, 'col_time', 'زمن الاختبار');
  const fName = getField(config, 'col_name', 'اسم الملاحظ');
  const fSign = getField(config, 'col_sign', 'التوقيع');

  let rows = '';
  const items = data.committees.length > 0 ? data.committees : Array(15).fill({ name: '', location: '' });
  
  items.forEach((c: any) => {
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
    </div>
  `;
  openPrintWindow(content, 'portrait');
};

export const printAnswerPaperReceipt = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const colComm = getField(config, 'col_comm', 'رقم اللجنة');
    const colApplicants = getField(config, 'col_applicants', 'المتقدمون');
    const colPresent = getField(config, 'col_present', 'الحاضرون');
    const colAbsent = getField(config, 'col_absent', 'الغائبون');
    const colTotal = getField(config, 'col_total', 'المجموع');
    const colNotes = getField(config, 'col_notes', 'ملاحظات');
  
    let rows = '';
    data.committees.forEach((c: any, index: number) => {
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
        <h2 style="text-align: center; margin-bottom: 20px;">${config?.title || 'كشف استلام أوراق الإجابة'}</h2>
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
        </table>
      </div>
    `;
    openPrintWindow(content, 'landscape');
};

export const printUnassignedStudents = (data: AppData, settings: PrintSettings) => {
    let rows = '';
    let count = 0;
    
    // Calculate how many students are assigned in each stage
    const assignedCounts: Record<number, number> = {};
    data.stages.forEach(s => assignedCounts[s.id] = 0);
    
    data.committees.forEach(c => {
        data.stages.forEach(s => {
            assignedCounts[s.id] += (c.counts[s.id] || 0);
        });
    });

    data.stages.forEach(s => {
        const assigned = assignedCounts[s.id];
        if (assigned < s.students.length) {
            // Get unassigned students
            const unassigned = s.students.slice(assigned);
            unassigned.forEach(st => {
                count++;
                rows += `
                  <tr>
                    <td>${count}</td>
                    <td>${st.name}</td>
                    <td>${st.studentId}</td>
                    <td>${st.grade}</td>
                    <td>${st.class}</td>
                    <td>${s.name}</td>
                  </tr>
                `;
            });
        }
    });

    if (rows === '') {
        rows = '<tr><td colspan="6">جميع الطلاب موزعين على اللجان</td></tr>';
    }

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px;">كشف بأسماء الطلاب غير المرتبطين بلجان</h2>
      <table>
        <thead>
          <tr>
            <th style="width:40px">م</th>
            <th>اسم الطالب</th>
            <th>رقم الجلوس</th>
            <th>الصف</th>
            <th>الفصل</th>
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
    let rows = '';
    data.committees.forEach(c => {
        const total = data.stages.reduce((acc, s) => acc + (c.counts[s.id] || 0), 0);
        if (total === 0) {
            rows += `
              <tr>
                <td style="font-weight:900;">${c.name}</td>
                <td>${c.location}</td>
                <td>فارغة</td>
              </tr>
            `;
        }
    });

    if (rows === '') {
        rows = '<tr><td colspan="3">لا توجد لجان فارغة</td></tr>';
    }

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px;">كشف بأسماء اللجان الفارغة</h2>
      <table>
        <thead>
          <tr>
            <th>رقم اللجنة</th>
            <th>مقر اللجنة</th>
            <th>الحالة</th>
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
        let rows = '';
        const classGroups: Record<string, number> = {};
        stage.students.forEach(s => {
            const cls = s.class || 'بدون فصل';
            classGroups[cls] = (classGroups[cls] || 0) + 1;
        });

        let currentStudentIdx = 0;
        const distributionMap: {className: string, committee: string, count: number}[] = [];
        
        data.committees.forEach(c => {
            const countInComm = c.counts[stage.id] || 0;
            if (countInComm > 0) {
                const committeeStudents = stage.students.slice(currentStudentIdx, currentStudentIdx + countInComm);
                const commClassCounts: Record<string, number> = {};
                committeeStudents.forEach(s => {
                    const cls = s.class || 'عام';
                    commClassCounts[cls] = (commClassCounts[cls] || 0) + 1;
                });
                Object.entries(commClassCounts).forEach(([cls, cnt]) => {
                     distributionMap.push({ className: cls, committee: c.name, count: cnt });
                });
                currentStudentIdx += countInComm;
            }
        });
        
        distributionMap.sort((a,b) => a.className.localeCompare(b.className));
        distributionMap.forEach(d => {
            rows += `<tr><td>${d.className}</td><td>${d.committee}</td><td>${d.count}</td></tr>`;
        });

        if (rows) {
            html += `
                <h3 style="margin-top:20px; border-bottom:1px solid #000;">${stage.name}</h3>
                <table style="margin-top:5px;">
                    <thead><tr><th>الفصل</th><th>اللجنة</th><th>عدد الطلاب</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }
    });

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px;">توزيع الطلاب على اللجان حسب الصفوف والفصول</h2>
      ${html}
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

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
        <h2 style="text-align: center; color: #333; margin-bottom: 15px;">${config?.title || 'متابعة سير أوراق الإجابة'}</h2>
        
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

export const printViolationMinutes = (data: AppData, settings: PrintSettings) => {
    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">محضر مخالفة الأنظمة والتعليمات</h2>
      
      <div style="margin-bottom: 20px; font-size: 13px; line-height: 2;">
        إنه في يوم ..................... الموافق .... / .... / .... 14هـ ، وفي تمام الساعة ............
        <br>
        أثناء سير اختبار مادة .............................. للصف ..............................
        <br>
        تم ضبط الطالب/ـة: ............................................................ رقم الجلوس: ( ..................... )
        <br>
        في اللجنة رقم: ( .......... ) بمخالفة التعليمات والأنظمة، وهي:
        <br>
        <div style="border:1px solid #ccc; height:80px; margin: 10px 0;"></div>
      </div>

      <div style="border: 1px solid #000; padding: 10px; margin-bottom: 20px;">
         <h3 style="margin:0 0 10px 0;">وسيلة الغش المضبوطة (إن وجدت):</h3>
         <div style="display:flex; justify-content:space-around;">
            <span><span style="border:1px solid #000; width:15px; height:15px; display:inline-block;"></span> قصاصات ورقية</span>
            <span><span style="border:1px solid #000; width:15px; height:15px; display:inline-block;"></span> هاتف جوال</span>
            <span><span style="border:1px solid #000; width:15px; height:15px; display:inline-block;"></span> كتابة على اليد/الأدوات</span>
            <span><span style="border:1px solid #000; width:15px; height:15px; display:inline-block;"></span> أخرى: ............</span>
         </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="width: 48%;">
            <h3 style="text-align:center; background:#eee; padding:5px; border:1px solid #000;">شهادة الملاحظين</h3>
            <div style="margin-top:10px;">
                1. الاسم: ................................. التوقيع: .............<br><br>
                2. الاسم: ................................. التوقيع: .............
            </div>
        </div>
        <div style="width: 48%;">
            <h3 style="text-align:center; background:#eee; padding:5px; border:1px solid #000;">إقرار الطالب</h3>
            <div style="margin-top:10px;">
                أقر أنا الطالب الموضح اسمه أعلاه بصحة ما ورد في هذا المحضر.<br><br>
                التوقيع: .................................
            </div>
        </div>
      </div>
      
      <div style="border-top: 2px dashed #000; padding-top: 10px;">
         <h3>رأي لجنة التحكم والضبط:</h3>
         <div style="height: 60px;"></div>
         <div style="display:flex; justify-content:space-between; font-weight:900;">
            <div>عضو اللجنة: .....................</div>
            <div>عضو اللجنة: .....................</div>
            <div>رئيس اللجنة: .....................</div>
         </div>
      </div>
      
       <div style="margin-top:20px; font-weight:900; text-align:center;">يعتمد، مدير المدرسة: ..................................................... التوقيع: ........................</div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

export const printSubCommitteeTasks = (data: AppData, settings: PrintSettings) => {
    const tasks = [
        "التأكد من تهيئة مقر اللجنة ونظافته وترتيب الطاولات.",
        "استلام مظروف الأسئلة من لجنة التحكم والضبط قبل بدء الاختبار بوقت كاف.",
        "فتح المظروف داخل اللجنة والتأكد من عدد الأوراق وسلامتها.",
        "توزيع أوراق الأسئلة على الطلاب في الوقت المحدد.",
        "مطابقة هوية الطلاب والتأكد من جلوس كل طالب في مكانه الصحيح.",
        "منع دخول أي وسائل غير مسموح بها (جوالات، كتب، مذكرات).",
        "الالتزام بالهدوء وتوفير الجو المناسب للطلاب.",
        "عدم تفسير الأسئلة أو قراءتها إلا من قبل معلم المادة.",
        "استلام أوراق الإجابة من الطلاب وعدها وترتيبها تصاعدياً حسب أرقام الجلوس.",
        "تسليم أوراق الإجابة والمتبقي من الأسئلة للجنة التحكم والضبط فور انتهاء الوقت."
    ];
    
    let tasksHtml = '';
    tasks.forEach((t, i) => {
        tasksHtml += `<div style="margin-bottom: 10px; font-size: 14px;">${i+1}. ${t}</div>`;
    });

    const content = `
    <div>
      ${getHeaderHTML(data.school, settings)}
      <h2 style="text-align: center; margin-bottom: 20px; border:2px solid #000; display:inline-block; padding:5px 20px; border-radius:10px;">مهام لجان الاختبارات الفرعية (الملاحظين)</h2>
      
      <div style="border: 2px solid #000; padding: 20px; background: #fcfcfc; border-radius: 10px;">
         ${tasksHtml}
      </div>

      <div style="margin-top: 40px;">
         <h3>إقرار بالعلم:</h3>
         <p>أقر أنا الموقع أدناه باطلاعي على مهام الملاحظة والتقيد بها.</p>
         <table style="margin-top: 20px;">
            <thead>
                <tr>
                    <th>م</th>
                    <th>اسم الملاحظ</th>
                    <th>التوقيع</th>
                    <th>التاريخ</th>
                </tr>
            </thead>
            <tbody>
                ${Array(10).fill(0).map((_, i) => `
                <tr style="height:35px;">
                    <td>${i+1}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>`).join('')}
            </tbody>
         </table>
      </div>
      
       <div style="margin-top:20px; font-weight:900; text-align:left;">مدير المدرسة: .......................................</div>
    </div>
    `;
    openPrintWindow(content, 'portrait');
};

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
  openPrintWindow(`<div>${getHeaderHTML(data.school, settings)}${form}<div style="margin: 20px 0; border-bottom:2px dashed #000;"></div>${form}</div>`, 'portrait');
};

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