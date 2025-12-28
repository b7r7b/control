import { AppData, PrintSettings, DynamicReportConfig, SchoolData } from '../types';

// --- Helpers ---

const openPrintWindow = (content: string) => {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`
      <html>
        <head>
          <title>طباعة</title>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Tajawal', sans-serif; direction: rtl; margin: 0; padding: 0; background: #fff; }
            @media print {
              @page { margin: 1cm 0.5cm; size: A4; } /* Reduced top/bottom margins specifically */
              body { -webkit-print-color-adjust: exact; }
              .page-break { page-break-after: always; }
              .no-print { display: none; }
              thead { display: table-header-group; } 
              tr { page-break-inside: avoid; }
            }
            table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
            th, td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 12px; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { height: 80px; object-fit: contain; }
            .title { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0; text-decoration: underline; }
            .meta-box { border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-size: 11px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
};

const getHeaderHTML = (school: SchoolData, settings: PrintSettings) => {
    return `
    <div class="header-container">
        <div style="text-align: right; width: 30%;">
            <div style="font-weight: bold;">${settings.adminName}</div>
            <div style="font-weight: bold;">${settings.schoolName}</div>
            <div>لجنة الاختبارات والتحكم</div>
        </div>
        <div style="text-align: center; width: 40%;">
             ${settings.logoUrl ? `<img src="${settings.logoUrl}" class="logo" />` : ''}
        </div>
        <div style="text-align: left; width: 30%;">
            <div style="font-weight: bold;">${school.term}</div>
            <div style="font-weight: bold;">${school.year}</div>
        </div>
    </div>
    `;
};

const getField = (config: DynamicReportConfig | undefined, key: string, defaultLabel: string) => {
    if (!config) return { visible: true, label: defaultLabel };
    const field = config.fields.find(f => f.key === key);
    return field ? { visible: field.visible, label: field.label } : { visible: true, label: defaultLabel };
};

// --- Exports ---

export const printCommitteeAnswerEnvelopes = (data: AppData, settings: PrintSettings) => {
    let content = '';
    data.committees.forEach(committee => {
        // Filter active stages for this committee
        const activeStages = data.stages.filter(s => (committee.counts[s.id] || 0) > 0);
        const totalStudents = Object.values(committee.counts).reduce((a, b) => a + b, 0);

        if (totalStudents === 0) return; 

        // Generate Rows for Grades
        const gradesRows = activeStages.map(stage => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px dashed #ccc; margin-bottom: 10px;">
                <span style="font-size: 26px; font-weight: bold; color: #333;">${stage.name}</span>
                <span style="font-size: 32px; font-weight: 900; color: #000;">${committee.counts[stage.id]}</span>
            </div>
        `).join('');

        content += `
         <div class="page-break" style="height: 98vh; padding: 10px; box-sizing: border-box;">
            <div style="border: 4px double #000; height: 100%; border-radius: 20px; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column; background: #fff; position: relative; overflow: hidden;">
                
                ${getHeaderHTML(data.school, settings)}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 30px; padding-top: 10px;">
                    
                    <!-- Creative Title -->
                    <div style="
                        background-color: #000; 
                        color: #fff; 
                        padding: 10px 50px; 
                        font-size: 32px; 
                        font-weight: 900; 
                        border-radius: 10px;
                        margin-bottom: 20px;
                        box-shadow: 5px 5px 0px rgba(0,0,0,0.2);
                    ">
                        مظروف أوراق إجابة
                    </div>

                    <!-- Committee Info Box -->
                    <div style="
                        width: 100%; 
                        background: #fdfdfd; 
                        border: 3px solid #333; 
                        border-radius: 15px; 
                        padding: 20px 0; 
                        text-align: center;
                    ">
                        <div style="font-size: 24px; color: #555; font-weight: bold;">لجنة رقم</div>
                        <div style="font-size: 150px; line-height: 1; font-weight: 900; color: #000; margin: 10px 0;">${committee.name}</div>
                        <div style="
                            font-size: 28px; 
                            font-weight: bold; 
                            background: #eee; 
                            display: inline-block; 
                            padding: 5px 30px; 
                            border-radius: 50px;
                            border: 1px solid #999;
                        ">
                             المقر: ${committee.location}
                        </div>
                    </div>

                    <!-- Students Breakdown -->
                    <div style="width: 100%; margin-top: 20px;">
                        <div style="text-align: right; font-size: 20px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px;">
                            بيان أعداد الطلاب:
                        </div>
                        
                        <div style="background: #fafafa; border: 1px solid #ddd; border-radius: 10px; padding: 10px;">
                            ${gradesRows}
                        </div>

                        <div style="
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            margin-top: 20px; 
                            background: #333; 
                            color: #fff; 
                            padding: 15px 30px; 
                            border-radius: 10px;
                        ">
                            <span style="font-size: 28px; font-weight: 900;">الإجمالي الكلي للأوراق</span>
                            <span style="font-size: 36px; font-weight: 900;">${totalStudents}</span>
                        </div>
                    </div>

                </div>

                 <div style="width: 100%; text-align: center; margin-top: 20px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                    لجنة الاختبارات والتحكم
                </div>
            </div>
         </div>
        `;
    });
    openPrintWindow(content);
};

export const printDoorLabels = (data: AppData, settings: PrintSettings) => {
  let content = '';
  data.committees.forEach(committee => {
    content += `
      <div class="page-break" style="height: 95vh; box-sizing: border-box; padding: 10px;">
        <!-- Outer Decorative Border -->
        <div style="border: 6px solid #2d3436; height: 100%; padding: 5px; box-sizing: border-box; display: flex; flex-direction: column;">
            <div style="border: 2px solid #2d3436; height: 100%; padding: 25px; box-sizing: border-box; display: flex; flex-direction: column;">
                
                ${getHeaderHTML(data.school, settings)}
                
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: -20px;">
                    
                    <!-- Committee Number Badge -->
                    <div style="margin-bottom: 30px; text-align: center;">
                        <span style="font-size: 24px; font-weight: bold; display: block; margin-bottom: 5px; color: #636e72;">لجنة اختبارات رقم</span>
                        <div style="
                            font-size: 160px; 
                            font-weight: 900; 
                            line-height: 1; 
                            border: 8px solid #000; 
                            padding: 10px 60px; 
                            border-radius: 30px; 
                            background-color: #f5f6fa;
                            box-shadow: 10px 10px 0px rgba(0,0,0,0.1);
                        ">
                            ${committee.name}
                        </div>
                    </div>

                    <!-- Location -->
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 40px; border-bottom: 3px solid #000; padding-bottom: 10px; width: 80%; text-align: center;">
                        مقر اللجنة: <span style="font-weight: 900;">${committee.location}</span>
                    </div>
                    
                    <!-- Stats Table -->
                    <table style="width: 90%; font-size: 24px; border: 3px solid #000;">
                        <thead>
                        <tr style="background-color: #2d3436; color: #fff;">
                            <th style="font-size: 26px; padding: 15px; border: 1px solid #000;">المرحلة / الصف</th>
                            <th style="font-size: 26px; padding: 15px; border: 1px solid #000; width: 150px;">العدد</th>
                        </tr>
                        </thead>
                        <tbody>
                        ${data.stages.filter(s => (committee.counts[s.id] || 0) > 0).map(s => `
                            <tr>
                            <td style="font-size: 26px; font-weight: bold; padding: 15px; border: 1px solid #000;">${s.name}</td>
                            <td style="font-size: 28px; font-weight: 900; padding: 15px; border: 1px solid #000;">${committee.counts[s.id]}</td>
                            </tr>
                        `).join('')}
                        <tr style="background-color: #dfe6e9;">
                            <td style="font-size: 26px; font-weight: 900; padding: 15px; border: 1px solid #000;">الإجمالي الكلي</td>
                            <td style="font-size: 32px; font-weight: 900; padding: 15px; border: 1px solid #000;">${Object.values(committee.counts).reduce((a, b) => a + b, 0)}</td>
                        </tr>
                        </tbody>
                    </table>

                </div>

                <div style="text-align: center; margin-top: 30px; border-top: 2px solid #000; padding-top: 20px;">
                    <div style="font-size: 20px; font-weight: bold;">مدير المدرسة</div>
                    <div style="font-size: 24px; font-weight: 900; margin-top: 10px;">${settings.managerName}</div>
                </div>

            </div>
        </div>
      </div>
    `;
  });
  openPrintWindow(content);
};

export const printAttendance = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
  const fSeq = getField(config, 'col_seq', 'م');
  const fSeat = getField(config, 'col_seat', 'رقم الجلوس');
  const fName = getField(config, 'col_name', 'اسم الطالب');
  const fStage = getField(config, 'col_stage', 'المرحلة');
  const fPres = getField(config, 'col_pres', 'حضور');
  const fSig = getField(config, 'col_sig', 'التوقيع');

  let content = '';
  
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);
  
  data.committees.forEach(committee => {
    const studentsInCommittee: any[] = [];
    data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        const start = cursors[stage.id];
        const end = start + count;
        if (count > 0 && stage.students) {
            stage.students.slice(start, end).forEach(s => {
                studentsInCommittee.push({ ...s, stageName: stage.name });
            });
            cursors[stage.id] = end;
        }
    });
    
    if (studentsInCommittee.length === 0) return;

    // --- Auto-Fit Logic ---
    const totalStudents = studentsInCommittee.length;
    let fontSize = 12;
    let padding = 5;

    // Adjust sizes based on student count to fit A4
    if (totalStudents > 25) {
        fontSize = 10;
        padding = 3;
    } 
    if (totalStudents > 35) {
        fontSize = 9;
        padding = 2;
    }
    // ---------------------

    let rows = '';
    studentsInCommittee.forEach((student, idx) => {
        rows += `
            <tr style="height: auto;">
                ${fSeq.visible ? `<td style="width: 40px; padding: ${padding}px; font-size: ${fontSize}px;">${idx + 1}</td>` : ''}
                ${fSeat.visible ? `<td style="width: 100px; padding: ${padding}px; font-size: ${fontSize}px;">${student.studentId}</td>` : ''}
                ${fName.visible ? `<td style="text-align: right; padding: ${padding}px; font-size: ${fontSize}px; padding-right: 10px;">${student.name}</td>` : ''}
                ${fStage.visible ? `<td style="width: 120px; padding: ${padding}px; font-size: ${fontSize}px;">${student.stageName}</td>` : ''}
                ${fPres.visible ? `<td style="width: 80px; padding: ${padding}px; font-size: ${fontSize}px;"></td>` : ''}
                ${fSig.visible ? `<td style="width: 120px; padding: ${padding}px; font-size: ${fontSize}px;"></td>` : ''}
            </tr>
        `;
    });

    content += `
      <div class="page-break" style="height: 100vh; display: flex; flex-direction: column;">
        ${getHeaderHTML(data.school, settings)}
        
        <div style="text-align: center; margin-bottom: 5px;">
           <h2 style="font-size: 18px; font-weight: bold; margin: 5px 0;">${config?.title || 'كشف تحضير الطلاب'}</h2>
           <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 5px; background: #f9f9f9; width: fit-content; margin: 0 auto 10px auto;">
                <span>لجنة رقم: ${committee.name}</span>
                <span>-</span>
                <span>المقر: ${committee.location}</span>
           </div>
        </div>
        
        <table style="flex: 1; height: auto;">
            <thead>
                <tr>
                    ${fSeq.visible ? `<th style="width: 40px; padding: ${padding}px; font-size: ${fontSize}px;">${fSeq.label}</th>` : ''}
                    ${fSeat.visible ? `<th style="width: 100px; padding: ${padding}px; font-size: ${fontSize}px;">${fSeat.label}</th>` : ''}
                    ${fName.visible ? `<th style="padding: ${padding}px; font-size: ${fontSize}px;">${fName.label}</th>` : ''}
                    ${fStage.visible ? `<th style="width: 120px; padding: ${padding}px; font-size: ${fontSize}px;">${fStage.label}</th>` : ''}
                    ${fPres.visible ? `<th style="width: 80px; padding: ${padding}px; font-size: ${fontSize}px;">${fPres.label}</th>` : ''}
                    ${fSig.visible ? `<th style="width: 120px; padding: ${padding}px; font-size: ${fontSize}px;">${fSig.label}</th>` : ''}
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <div style="margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; padding-left: 50px; padding-right: 50px; font-size: 12px; font-weight: bold;">
             <div>الملاحظ الأول: .............................. التوقيع: .............</div>
             <div>الملاحظ الثاني: .............................. التوقيع: .............</div>
        </div>
      </div>
    `;
  });

  openPrintWindow(content);
};

export const printSeatLabels = (data: AppData, settings: PrintSettings, committeeId?: string) => {
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);
  
  let content = '';
  // 3 columns * 7 rows = 21 labels per page
  const LABELS_PER_PAGE = 21; 

  data.committees.forEach(committee => {
    // 1. Collect all students for THIS specific committee
    let committeeLabels: any[] = [];

    data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        const start = cursors[stage.id];
        const end = start + count;
        
        if (count > 0) {
            // Get the slice of students for this committee
            const stageStudents = stage.students.slice(start, end);
            
            // Only add to printable list if this committee is selected (or if printing all)
            if (!committeeId || String(committee.id) === String(committeeId)) {
                stageStudents.forEach(s => {
                    committeeLabels.push({ 
                        ...s, 
                        stageName: stage.name, 
                        committeeName: committee.name, 
                        committeeLoc: committee.location 
                    });
                });
            }
            
            // IMPORTANT: Advance the cursor regardless of whether we printed or not
            // This ensures subsequent committees get the correct next batch of students
            cursors[stage.id] = end;
        }
    });

    // If no labels to print for this committee, skip
    if (committeeLabels.length === 0) return;

    // 2. Chunk committee labels into pages
    for (let i = 0; i < committeeLabels.length; i += LABELS_PER_PAGE) {
        const pageLabels = committeeLabels.slice(i, i + LABELS_PER_PAGE);
        
        // Start Page container
        content += `<div class="page-break" style="display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(7, 1fr); gap: 8px; height: 98vh; padding: 15px; box-sizing: border-box;">`;
        
        // Render Labels
        pageLabels.forEach(label => {
            content += `
            <div style="border: 2px dashed #999; padding: 5px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; overflow: hidden; background-color: #fff;">
                <div style="font-size: 10px; margin-bottom: 2px; color: #666;">${settings.schoolName}</div>
                <div style="font-weight: 900; font-size: 18px; margin-bottom: 2px;">${label.name}</div>
                <div style="font-size: 14px; margin-bottom: 2px;">رقم الجلوس: <b style="font-size: 16px;">${label.studentId}</b></div>
                <div style="border-top: 1px solid #eee; width: 100%; margin: 2px 0;"></div>
                <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 5px; font-size: 12px; box-sizing: border-box;">
                    <span>لجنة: <b>${label.committeeName}</b></span>
                    <span>${label.stageName}</span>
                </div>
            </div>
            `;
        });

        // 3. Fill remaining slots with EMPTY divs to maintain grid structure and force page break at the end
        const remainingSlots = LABELS_PER_PAGE - pageLabels.length;
        for(let j=0; j<remainingSlots; j++) {
            content += `<div style="border: 1px dotted #f0f0f0;"></div>`;
        }

        content += `</div>`; // End Page
    }
  });
  
  openPrintWindow(content);
};

export const printStudentCountsReport = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    // Similar to door labels but list format
    const fClass = getField(config, 'col_class', 'الصف');
    const fComm = getField(config, 'col_comm', 'رقم اللجنة');
    const fCount = getField(config, 'col_count', 'عدد الطلاب');

    let rows = '';
    data.committees.forEach(c => {
        data.stages.forEach(s => {
            if ((c.counts[s.id] || 0) > 0) {
                rows += `
                    <tr>
                        ${fComm.visible ? `<td>${c.name}</td>` : ''}
                        ${fClass.visible ? `<td>${s.name}</td>` : ''}
                        ${fCount.visible ? `<td>${c.counts[s.id]}</td>` : ''}
                    </tr>
                `;
            }
        });
    });

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">${config?.title || 'تقرير توزيع الطلاب'}</h2>
        <table>
            <thead>
                <tr>
                    ${fComm.visible ? `<th>${fComm.label}</th>` : ''}
                    ${fClass.visible ? `<th>${fClass.label}</th>` : ''}
                    ${fCount.visible ? `<th>${fCount.label}</th>` : ''}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printInvigilatorAttendance = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, assignments?: Record<string, string>) => {
    // This assumes we are printing a list of invigilators assigned
    let rows = '';
    data.committees.forEach((c, idx) => {
        const teacher = assignments ? assignments[c.name] : '';
        rows += `
            <tr>
                <td>${idx + 1}</td>
                <td>${c.name}</td>
                <td>${c.location}</td>
                <td>${teacher || ''}</td>
                <td></td>
            </tr>
        `;
    });

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">${config?.title || 'توزيع الملاحظين'}</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">م</th>
                    <th style="width: 100px;">اللجنة</th>
                    <th>المقر</th>
                    <th>اسم الملاحظ</th>
                    <th style="width: 150px;">التوقيع</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 40px; text-align: left; padding-left: 50px;">
            <h3>مدير المدرسة: ${settings.managerName}</h3>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printAbsenceRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, studentData?: any, examDetails?: any) => {
    // Single student absence form
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline;">${config?.title || 'استمارة غياب طالب'}</h2>
        <div style="margin: 40px 20px; font-size: 16px; line-height: 2;">
            <p>إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '.../.../....'}</b></p>
            <p>وأثناء سير اختبار مادة: <b>${examDetails?.subject || '....................'}</b> للفترة ( <b>${examDetails?.period || '....'}</b> )</p>
            <p>تغيب الطالب/ـة: <b>${studentData?.name || '........................................'}</b></p>
            <p>رقم الجلوس: <b>${studentData?.studentId || '..............'}</b> باللجنة رقم: <b>${studentData?.committeeName || '...'}</b></p>
            <br/>
            <p>وعليه جرى تحرير المحضر،،،</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px;">
            <div style="text-align: center;">
                <p>ملاحظ اللجنة</p>
                <p>.............................</p>
            </div>
            <div style="text-align: center;">
                <p>وكيل الشؤون التعليمية</p>
                <p>${settings.agentName || '.............................'}</p>
            </div>
            <div style="text-align: center;">
                <p>مدير المدرسة</p>
                <p>${settings.managerName || '.............................'}</p>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printLateRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, studentData?: any, examDetails?: any) => {
     const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline;">${config?.title || 'إقرار تأخر طالب عن دخول الاختبار'}</h2>
        <div style="margin: 40px 20px; font-size: 16px; line-height: 2;">
            <p>حضر الطالب: <b>${studentData?.name || '........................................'}</b></p>
            <p>بالصف: <b>${studentData?.grade || '................'}</b></p>
            <p>في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '.../.../....'}</b></p>
            <p>الساعة: <b>${examDetails?.arrivalTime || '.......'}</b> وقد تأخر عن بداية اختبار مادة: <b>${examDetails?.subject || '....................'}</b></p>
            <p>مدة التأخير: <b>${examDetails?.lateDuration || '.......'}</b></p>
            <p>وقد سمح له بدخول الاختبار مع أخذ التعهد اللازم عليه بعدم التكرار.</p>
        </div>
        <div style="margin-top: 50px; padding: 0 50px;">
            <div style="text-align: left; margin-bottom: 30px;">
                <p>توقيع الطالب: .............................</p>
            </div>
            <div style="text-align: center;">
                <p>مدير المدرسة</p>
                <p>${settings.managerName || '.............................'}</p>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printQuestionEnvelopeOpening = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, examDetails?: any) => {
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline;">${config?.title || 'محضر فتح مظاريف الأسئلة'}</h2>
        <div style="margin: 40px 20px; font-size: 16px; line-height: 2;">
            <p>إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '.../.../....'}</b></p>
            <p>تم فتح مظروف أسئلة مادة: <b>${examDetails?.subject || '....................'}</b></p>
            <p>للصف: <b>${examDetails?.grade || '....................'}</b> الفترة: <b>${examDetails?.period || '....'}</b></p>
            <p>وقد وجد المغلف سليماً ومغلقاً بإحكام، وعدد النماذج بداخله مطابق لما هو مدون عليه.</p>
            <br/>
            <p>أعضاء اللجنة:</p>
            <ol>
                <li>................................................... التوقيع: ...................</li>
                <li>................................................... التوقيع: ...................</li>
                <li>................................................... التوقيع: ...................</li>
            </ol>
        </div>
        <div style="text-align: left; margin-top: 50px; padding-left: 50px;">
            <p>مدير المدرسة</p>
            <p>${settings.managerName || '.............................'}</p>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printQuestionEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const content = `
    <div style="padding: 20px; text-align: center; border: 3px solid #000; height: 90vh; display: flex; flex-direction: column; justify-content: center;">
        ${getHeaderHTML(data.school, settings)}
        <h1 style="font-size: 48px; margin: 30px 0;">ظرف أسئلة</h1>
        <div style="text-align: right; margin: 0 auto; width: 70%; font-size: 24px; line-height: 2.5;">
            <p>المادة: ......................................................</p>
            <p>الصف: ......................................................</p>
            <p>اليوم والتاريخ: ......................................................</p>
            <p>الفترة: ......................................................</p>
            <p>عدد الأوراق: ......................................................</p>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printAnswerEnvelope = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const content = `
    <div class="page-break" style="
        height: 98vh;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
    ">
        <!-- Decorative Outer Border -->
        <div style="
            width: 100%;
            height: 100%;
            border: 4px double #000;
            padding: 10px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        ">
            <!-- Inner Border -->
            <div style="
                flex: 1;
                border: 1px solid #000;
                padding: 30px;
                display: flex;
                flex-direction: column;
                align-items: center;
            ">

                <!-- Header -->
                <div style="width: 100%; margin-bottom: 40px;">
                    ${getHeaderHTML(data.school, settings)}
                </div>

                <!-- Title -->
                <div style="
                    background-color: #000;
                    color: #fff;
                    padding: 15px 60px;
                    border-radius: 50px;
                    font-size: 36px;
                    font-weight: 900;
                    margin-bottom: 80px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                ">
                    ظرف أوراق إجابة
                </div>

                <!-- Fields Section -->
                <div style="
                    width: 90%;
                    display: flex;
                    flex-direction: column;
                    gap: 60px; /* Big spacing */
                    font-size: 28px;
                    font-weight: bold;
                ">
                    <!-- Subject -->
                    <div style="display: flex; align-items: baseline;">
                        <span style="width: 180px; flex-shrink: 0;">المادة:</span>
                        <div style="flex: 1; border-bottom: 2px dotted #000; height: 10px;"></div>
                    </div>

                    <!-- Grade -->
                    <div style="display: flex; align-items: baseline;">
                        <span style="width: 180px; flex-shrink: 0;">الصف:</span>
                        <div style="flex: 1; border-bottom: 2px dotted #000; height: 10px;"></div>
                    </div>

                    <!-- Count -->
                    <div style="display: flex; align-items: baseline;">
                        <span style="width: 180px; flex-shrink: 0;">عدد الطلاب:</span>
                        <div style="flex: 1; border-bottom: 2px dotted #000; height: 10px;"></div>
                    </div>
                </div>

                <!-- Footer / Spacer -->
                <div style="flex: 1;"></div>

                 <div style="width: 100%; text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    ${settings.schoolName} - لجنة الاختبارات والتحكم
                </div>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printAnswerPaperReceipt = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    const fComm = getField(config, 'col_comm', 'رقم اللجنة');
    const fApps = getField(config, 'col_applicants', 'عدد الطلاب (تفصيل)');
    const fPres = getField(config, 'col_present', 'الحاضرون');
    const fAbs = getField(config, 'col_absent', 'الغائبون');
    const fTotal = getField(config, 'col_total', 'أظرف الإجابة');
    const fNotes = getField(config, 'col_notes', 'توقيع المستلم');

    // --- NEW: Compact Header (Embedded) ---
    // This saves about 40-50px of vertical space compared to standard header
    const compactHeader = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
        <div style="text-align: right; width: 30%; font-size: 10px;">
            <div style="font-weight: bold;">${settings.adminName}</div>
            <div style="font-weight: bold;">${settings.schoolName}</div>
            <div>لجنة الاختبارات والتحكم</div>
        </div>
        <div style="text-align: center; width: 40%;">
             ${settings.logoUrl ? `<img src="${settings.logoUrl}" style="height: 40px; object-fit: contain;" />` : ''}
        </div>
        <div style="text-align: left; width: 30%; font-size: 10px;">
            <div style="font-weight: bold;">${data.school.term}</div>
            <div style="font-weight: bold;">${data.school.year}</div>
        </div>
    </div>
    `;

    const committeesCount = data.committees.length;
    
    // Auto-Fit Calculation
    // We aim for single page (around 20-25 committees), but allow overflow.
    // Base available height for content ~900px
    const availableHeight = 950; 
    let rowHeight = Math.floor(availableHeight / (committeesCount + 1)); // +1 for header row
    
    // Clamp Row Height: 
    // Min 35px: To ensure readability ( حسن الورقة ).
    // Max 50px: Don't let it look too sparse if few committees.
    rowHeight = Math.max(35, Math.min(50, rowHeight));
    
    // Scale Font based on row height
    let fontSize = Math.floor(rowHeight * 0.35);
    fontSize = Math.max(11, Math.min(13, fontSize));

    let rows = '';
    data.committees.forEach(c => {
         const activeStages = data.stages.filter(s => (c.counts[s.id] || 0) > 0);
         
         // Inner Content: Use flex to distribute grade lines evenly in the available row height
         const countDetails = activeStages.map((s, i) => {
            const borderStyle = i === activeStages.length - 1 ? '' : 'border-bottom: 1px solid #ccc;';
            return `
            <div style="flex: 1; ${borderStyle} display:flex; align-items:center; justify-content:space-between; padding:0 4px; font-size:${fontSize - 1}px;">
                <span style="font-weight:bold;">${s.name}</span>
                <span style="font-weight:bold;">${c.counts[s.id]}</span>
            </div>`;
         }).join('');

         // Empty Rows for manual input
         const emptyRows = activeStages.map((_, i) => {
            const borderStyle = i === activeStages.length - 1 ? '' : 'border-bottom: 1px solid #ccc;';
            return `<div style="flex: 1; ${borderStyle}"></div>`;
         }).join('');

         rows += `
            <tr style="height: ${rowHeight}px;">
                ${fComm.visible ? `<td style="font-weight:bold; font-size: ${fontSize + 1}px; vertical-align: middle; padding: 0;">${c.name}</td>` : ''}
                
                ${fApps.visible ? `<td style="padding: 0; height: ${rowHeight}px;"><div style="height: 100%; display: flex; flex-direction: column;">${countDetails}</div></td>` : ''}
                
                ${fPres.visible ? `<td style="padding: 0; height: ${rowHeight}px;"><div style="height: 100%; display: flex; flex-direction: column;">${emptyRows}</div></td>` : ''}
                
                ${fAbs.visible ? `<td style="padding: 0; height: ${rowHeight}px;"><div style="height: 100%; display: flex; flex-direction: column;">${emptyRows}</div></td>` : ''}
                
                ${fTotal.visible ? `<td style="vertical-align: middle;"></td>` : ''}
                
                ${fNotes.visible ? `<td style="vertical-align: middle;"></td>` : ''}
            </tr>
         `;
    });

    // We removed 'page-break' class from the container div and rely on standard print flow.
    // If it exceeds one page, the table will naturally break, and the <thead> will repeat.
    const content = `
    <div style="display: flex; flex-direction: column; padding: 0px;">
        ${compactHeader}
        <h2 style="text-align: center; margin: 5px 0 10px 0; font-size: 16px; font-weight:bold;">${config?.title || 'كشف استلام أوراق الإجابة من اللجان'}</h2>
        
        <table style="border: 2px solid #000; width: 100%;">
            <thead>
                <tr style="height: 35px; background-color: #f3f4f6; border-bottom: 2px solid #000;">
                    ${fComm.visible ? `<th style="width: 8%; border: 1px solid #000; font-size: 11px;">${fComm.label}</th>` : ''}
                    ${fApps.visible ? `<th style="width: 28%; border: 1px solid #000; font-size: 11px;">${fApps.label}</th>` : ''}
                    ${fPres.visible ? `<th style="width: 14%; border: 1px solid #000; font-size: 11px;">${fPres.label}</th>` : ''}
                    ${fAbs.visible ? `<th style="width: 14%; border: 1px solid #000; font-size: 11px;">${fAbs.label}</th>` : ''}
                    ${fTotal.visible ? `<th style="width: 14%; border: 1px solid #000; font-size: 11px;">${fTotal.label}</th>` : ''}
                    ${fNotes.visible ? `<th style="width: 22%; border: 1px solid #000; font-size: 11px;">${fNotes.label}</th>` : ''}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        <div style="margin-top: 15px; display: flex; justify-content: space-between; padding: 0 40px; font-size: 12px; page-break-inside: avoid;">
             <div style="text-align:center; font-weight:bold;">
                  عضو الكنترول: ........................................... التوقيع: .....................
             </div>
             <div style="text-align:center; font-weight:bold;">
                  مدير المدرسة: ${settings.managerName}
             </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printExamPaperTracking = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig) => {
    // A table with steps: Committee -> Control -> Grading -> Revision -> Monitoring
    let rows = '';
    // Example fixed rows for subjects or general tracking
    for(let i=0; i<10; i++) {
        rows += `
            <tr style="height: 40px;">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `;
    }

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">${config?.title || 'نموذج متابعة أوراق الإجابة'}</h2>
        <table>
            <thead>
                <tr>
                    <th>المادة</th>
                    <th>الصف</th>
                    <th>استلام من اللجنة</th>
                    <th>تسليم للتصحيح</th>
                    <th>استلام من التصحيح</th>
                    <th>المراجعة والتدقيق</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printCommitteeData = (data: AppData, settings: PrintSettings) => {
    const rows = data.committees.map(c => {
        const total = Object.values(c.counts).reduce((a, b) => a + b, 0);
        return `
            <tr>
                <td>${c.name}</td>
                <td>${c.location}</td>
                <td>${total}</td>
            </tr>
        `;
    }).join('');

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">بيانات لجان الاختبارات</h2>
        <table>
            <thead>
                <tr>
                    <th>رقم اللجنة</th>
                    <th>المقر</th>
                    <th>إجمالي الطلاب</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printUnassignedStudents = (data: AppData, settings: PrintSettings) => {
    // In current logic, all students are in stages, and committees just count how many.
    // If sum of committee counts < stage total, there are unassigned students.
    let content = '';
    
    let rows = '';
    data.stages.forEach(stage => {
        const assigned = data.committees.reduce((acc, c) => acc + (c.counts[stage.id] || 0), 0);
        const unassignedCount = stage.total - assigned;
        
        if (unassignedCount > 0) {
             const startIdx = assigned;
             const unassignedStudents = stage.students.slice(startIdx);
             
             unassignedStudents.forEach(s => {
                 rows += `
                    <tr>
                        <td>${s.name}</td>
                        <td>${s.studentId}</td>
                        <td>${stage.name}</td>
                    </tr>
                 `;
             });
        }
    });

    if (!rows) {
        rows = `<tr><td colspan="3">لا يوجد طلاب غير موزعين.</td></tr>`;
    }

    content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">الطلاب غير المرتبطين بلجان</h2>
        <table>
            <thead>
                <tr>
                    <th>اسم الطالب</th>
                    <th>رقم الجلوس</th>
                    <th>المرحلة</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printEmptyCommittees = (data: AppData, settings: PrintSettings) => {
    const emptyRows = data.committees
        .filter(c => Object.values(c.counts).reduce((a, b) => a + b, 0) === 0)
        .map(c => `<tr><td>${c.name}</td><td>${c.location}</td></tr>`)
        .join('');

    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">اللجان الفارغة</h2>
        <table>
            <thead>
                <tr>
                    <th>رقم اللجنة</th>
                    <th>المقر</th>
                </tr>
            </thead>
            <tbody>${emptyRows || '<tr><td colspan="2">لا توجد لجان فارغة</td></tr>'}</tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printDistributionByGrade = (data: AppData, settings: PrintSettings) => {
    let content = `
        <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">توزيع الطلاب حسب الصفوف</h2>
    `;
    
    data.stages.forEach(stage => {
        content += `<h3>${stage.name} (الإجمالي: ${stage.total})</h3>`;
        content += `<table><thead><tr><th>اللجنة</th><th>العدد</th></tr></thead><tbody>`;
        
        data.committees.forEach(c => {
            if ((c.counts[stage.id] || 0) > 0) {
                content += `<tr><td>${c.name}</td><td>${c.counts[stage.id]}</td></tr>`;
            }
        });
        
        content += `</tbody></table><br/>`;
    });
    
    content += `</div>`;
    openPrintWindow(content);
};

export const printViolationMinutes = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, studentData?: any, examDetails?: any) => {
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline;">محضر ضبط مخالفة في الاختبارات</h2>
        <div style="margin: 30px 20px; font-size: 16px; line-height: 2;">
            <p>إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '.../.../....'}</b></p>
            <p>وأثناء اختبار مادة: <b>${examDetails?.subject || '....................'}</b></p>
            <p>لوحظ قيام الطالب: <b>${studentData?.name || '........................................'}</b></p>
            <p>بمخالفة أنظمة الاختبارات عن طريق: .....................................................................</p>
            <p>........................................................................................................................</p>
            <p>وقد تم ضبط الوسيلة المستخدمة (إن وجدت) ومرفقة بهذا المحضر.</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px;">
            <div style="text-align: center;">
                <p>الملاحظ</p>
                <p>.............................</p>
            </div>
            <div style="text-align: center;">
                <p>الطالب (إن أمكن)</p>
                <p>.............................</p>
            </div>
             <div style="text-align: center;">
                <p>مدير المدرسة</p>
                <p>${settings.managerName || '.............................'}</p>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printSubCommitteeTasks = (data: AppData, settings: PrintSettings) => {
    // Generic form for sub committee tasks
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center;">مهام اللجان الفرعية</h2>
        <table style="margin-top: 20px;">
            <thead>
                <tr>
                    <th style="width: 200px;">اللجنة الفرعية</th>
                    <th>المهام والمسؤوليات</th>
                    <th style="width: 150px;">المكلفون</th>
                </tr>
            </thead>
            <tbody>
                <tr style="height: 60px;"><td>لجنة التحكم وضبط الجودة</td><td></td><td></td></tr>
                <tr style="height: 60px;"><td>لجنة الإشراف والمتابعة</td><td></td><td></td></tr>
                <tr style="height: 60px;"><td>لجنة رصد الدرجات</td><td></td><td></td></tr>
                <tr style="height: 60px;"><td>لجنة الدعم الفني</td><td></td><td></td></tr>
            </tbody>
        </table>
    </div>
    `;
    openPrintWindow(content);
};

export const printSubstituteInvigilatorRecord = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, examDetails?: any, substituteData?: any) => {
    const content = `
    <div style="padding: 20px;">
        ${getHeaderHTML(data.school, settings)}
        <h2 style="text-align: center; text-decoration: underline;">محضر تكليف ملاحظ بديل</h2>
        <div style="margin: 40px 20px; font-size: 16px; line-height: 2;">
            <p>إنه في يوم <b>${examDetails?.day || '..........'}</b> الموافق <b>${examDetails?.date || '.../.../....'}</b></p>
            <p>نظراً لغياب/تأخر الملاحظ الأساسي: <b>${substituteData?.originalTeacher || '........................................'}</b></p>
            <p>فقد تم تكليف المعلم (الاحتياط): <b>${substituteData?.reserveTeacher || '........................................'}</b></p>
            <p>للمراقبة في اللجنة رقم: <b>${substituteData?.committeeId || '...'}</b></p>
            <p>سبب التكليف: <b>${substituteData?.reason || '....................'}</b></p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px;">
            <div style="text-align: center;">
                <p>المعلم البديل</p>
                <p>.............................</p>
            </div>
            <div style="text-align: center;">
                <p>مسؤول توزيع الملاحظين</p>
                <p>.............................</p>
            </div>
            <div style="text-align: center;">
                <p>مدير المدرسة</p>
                <p>${settings.managerName || '.............................'}</p>
            </div>
        </div>
    </div>
    `;
    openPrintWindow(content);
};

export const printAnswerSubmissionList = (data: AppData, settings: PrintSettings, config?: DynamicReportConfig, examDetails?: any) => {
  let content = '';
  const cursors: Record<number, number> = {};
  data.stages.forEach(s => cursors[s.id] = 0);
  
  data.committees.forEach(committee => {
    const studentsInCommittee: any[] = [];
    data.stages.forEach(stage => {
        const count = committee.counts[stage.id] || 0;
        const start = cursors[stage.id];
        const end = start + count;
        if (count > 0 && stage.students) {
            stage.students.slice(start, end).forEach(s => {
                studentsInCommittee.push({ ...s, stageName: stage.name });
            });
            cursors[stage.id] = end;
        }
    });
    
    if (studentsInCommittee.length === 0) return;

    // Dynamic sizing logic for Auto-Fit A4
    const totalStudents = studentsInCommittee.length;
    let fontSize = 12;
    let padding = 5;
    let headerHeight = 160; // Approximate header height

    if (totalStudents > 25) {
        fontSize = 10;
        padding = 3;
    } 
    if (totalStudents > 35) {
        fontSize = 9;
        padding = 2;
    }
    
    let rows = '';
    studentsInCommittee.forEach((student, idx) => {
        rows += `
            <tr style="height: auto;">
                <td style="padding: ${padding}px; font-size: ${fontSize}px;">${idx + 1}</td>
                <td style="padding: ${padding}px; font-size: ${fontSize}px;">${student.studentId}</td>
                <td style="padding: ${padding}px; font-size: ${fontSize}px; text-align: right; font-weight: bold;">${student.name}</td>
                <td style="padding: ${padding}px; font-size: ${fontSize}px;">${student.grade || student.stageName}</td>
                <td style="padding: ${padding}px;"></td>
                <td style="padding: ${padding}px;"></td>
            </tr>
        `;
    });

    content += `
      <div class="page-break" style="height: 100vh; display: flex; flex-direction: column;">
        ${getHeaderHTML(data.school, settings)}
        
        <div style="text-align: center; margin-bottom: 5px;">
           <div style="background-color: #3b82f6; color: white; display: inline-block; padding: 5px 20px; font-weight: bold; border-radius: 5px; margin-bottom: 5px;">
             ${config?.title || 'كشف استلام ورقة الإجابة'}
           </div>
           
           <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold; border: 2px solid #000; padding: 8px 20px; margin-bottom: 5px; background-color: #f9fafb;">
                <div>رقم اللجنة: ${committee.name}</div>
                <div>مقر اللجنة: ${committee.location}</div>
           </div>
        </div>

        <table style="flex: 1;">
            <thead>
                <tr>
                    <th style="width: 40px; padding: ${padding}px; font-size: ${fontSize}px;">م</th>
                    <th style="width: 100px; padding: ${padding}px; font-size: ${fontSize}px;">رقم الطالب</th>
                    <th style="padding: ${padding}px; font-size: ${fontSize}px;">اسم الطالب</th>
                    <th style="width: 120px; padding: ${padding}px; font-size: ${fontSize}px;">الصف</th>
                    <th style="width: 80px; padding: ${padding}px; font-size: ${fontSize}px;">زمن الخروج</th>
                    <th style="width: 100px; padding: ${padding}px; font-size: ${fontSize}px;">التوقيع</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 30px; font-weight: bold; font-size: 12px;">
             <div style="text-align: right;">
                  <div style="margin-bottom: 15px;">اسم الملاحظ: ...........................................</div>
                  <div>التوقيع: ...........................................</div>
             </div>
             <div style="text-align: left; padding-left: 20px;">
                  <div style="margin-bottom: 15px;">مدير المدرسة</div>
                  <div>${settings.managerName}</div>
             </div>
        </div>
      </div>
    `;
  });

  openPrintWindow(content);
};
