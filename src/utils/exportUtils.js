/**
 * Export utilities for generating CSV, TXT, and PDF reports for Departments.
 * Adheres to monochrome styling and no-emoji rule.
 */

// Helper to trigger browser file download for text/csv data
const triggerDownload = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to CSV format
export const exportDepartmentsCSV = (departments, filename = `departments_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['Department ID', 'Department Name'];
  const rows = departments.map((d) => [
    `"${(d.departmentId || d.code || '').replace(/"/g, '""')}"`,
    `"${(d.name || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

// Export to TXT format (Structured plain text report)
export const exportDepartmentsTXT = (departments, filename = `departments_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const idWidth = 20;
  const nameWidth = 40;

  const padRight = (str, len) => (str || '').padEnd(len, ' ');

  const separator = '='.repeat(idWidth + nameWidth + 2);
  const subSeparator = '-'.repeat(idWidth + nameWidth + 2);

  const header = [
    'UNIVERSITY ERP - DEPARTMENTS DIRECTORY',
    `Generated On: ${dateStr}`,
    `Total Departments: ${departments.length}`,
    separator,
    `${padRight('DEPARTMENT ID', idWidth)}  ${padRight('DEPARTMENT NAME', nameWidth)}`,
    subSeparator,
  ];

  const body = departments.map((d) => {
    const id = padRight(d.departmentId || d.code || 'N/A', idWidth);
    const name = padRight(d.name || 'N/A', nameWidth);
    return `${id}  ${name}`;
  });

  const footer = [
    subSeparator,
    'End of Report',
    separator,
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

// Export to printable PDF format using browser print view
export const exportDepartmentsPDF = (departments, title = 'University Departments Directory') => {
  const dateStr = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const rowsHtml = departments
    .map(
      (d, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 14px; font-weight: 500; font-size: 13px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 14px; font-weight: 600; font-size: 13px; font-family: monospace; color: #000000;">${d.departmentId || d.code || 'N/A'}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #111827;">${d.name || 'N/A'}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 24px;
            color: #111827;
            background: #ffffff;
          }
          .header-box {
            border-bottom: 2px solid #000000;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 12px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 14px;
            text-align: left;
            border-bottom: 2px solid #111827;
          }
          .footer-box {
            margin-top: 30px;
            font-size: 11px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>University ERP</h1>
            <div class="meta-info">${title}</div>
          </div>
          <div class="meta-info" style="text-align: right;">
            <div>Generated: ${dateStr}</div>
            <div>Total Departments: ${departments.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 10%;">#</th>
              <th style="width: 35%;">Department ID</th>
              <th style="width: 55%;">Department Name</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          Official University ERP Export Document. Generated on ${dateStr}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Unified export dispatcher
export const exportDepartments = (departments, format = 'csv') => {
  if (!departments || departments.length === 0) {
    alert('No department data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportDepartmentsCSV(departments);
      break;
    case 'txt':
      exportDepartmentsTXT(departments);
      break;
    case 'pdf':
      exportDepartmentsPDF(departments);
      break;
    default:
      exportDepartmentsCSV(departments);
  }
};


// Export Students to CSV format
export const exportStudentsCSV = (students, filename = `students_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['PRN', 'Name', 'Class', 'Division', 'Degree', 'Year of Enrollment', 'Custom Fields'];
  
  const rows = students.map((s) => {
    // Format custom fields as "Key1: Value1; Key2: Value2"
    const customFieldsStr = s.customFields && s.customFields.length > 0
      ? s.customFields.map(cf => `${cf.key}: ${cf.value}`).join('; ')
      : '';
    
    return [
      `"${(s.prn || '').replace(/"/g, '""')}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.class || '').replace(/"/g, '""')}"`,
      `"${(s.division || '').replace(/"/g, '""')}"`,
      `"${(s.degree || '').replace(/"/g, '""')}"`,
      `"${(s.yearOfEnrollment || '').replace(/"/g, '""')}"`,
      `"${customFieldsStr.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

// Export Students to TXT format
export const exportStudentsTXT = (students, filename = `students_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const prnWidth = 14;
  const nameWidth = 25;
  const classWidth = 14;
  const divWidth = 8;
  const degreeWidth = 28;
  const yearWidth = 6;
  const customWidth = 30;

  const padRight = (str, len) => (str || '').padEnd(len, ' ');

  const separator = '='.repeat(prnWidth + nameWidth + classWidth + divWidth + degreeWidth + yearWidth + customWidth + 14);
  const subSeparator = '-'.repeat(prnWidth + nameWidth + classWidth + divWidth + degreeWidth + yearWidth + customWidth + 14);

  const header = [
    'UNIVERSITY ERP - STUDENTS DIRECTORY',
    `Generated On: ${dateStr}`,
    `Total Students: ${students.length}`,
    separator,
    `${padRight('PRN', prnWidth)}  ${padRight('NAME', nameWidth)}  ${padRight('CLASS', classWidth)}  ${padRight('DIV', divWidth)}  ${padRight('DEGREE', degreeWidth)}  ${padRight('YEAR', yearWidth)}  ${padRight('CUSTOM FIELDS', customWidth)}`,
    subSeparator,
  ];

  const body = students.map((s) => {
    const prn = padRight(s.prn || 'N/A', prnWidth);
    const name = padRight(s.name || 'N/A', nameWidth);
    const cls = padRight(s.class || 'N/A', classWidth);
    const div = padRight(s.division || '—', divWidth);
    const degree = padRight(s.degree || 'N/A', degreeWidth);
    const year = padRight(s.yearOfEnrollment || 'N/A', yearWidth);
    
    // Format custom fields as "Key1: Value1; Key2: Value2"
    const customFieldsStr = s.customFields && s.customFields.length > 0
      ? s.customFields.map(cf => `${cf.key}: ${cf.value}`).join('; ')
      : '—';
    const custom = padRight(customFieldsStr, customWidth);
    
    return `${prn}  ${name}  ${cls}  ${div}  ${degree}  ${year}  ${custom}`;
  });

  const footer = [
    subSeparator,
    'End of Report',
    separator,
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

// Export Students to printable PDF format
export const exportStudentsPDF = (students, title = 'University Students Directory') => {
  const dateStr = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const rowsHtml = students
    .map(
      (s, idx) => {
        // Format custom fields as "Key1: Value1; Key2: Value2"
        const customFieldsStr = s.customFields && s.customFields.length > 0
          ? s.customFields.map(cf => `${cf.key}: ${cf.value}`).join('; ')
          : '—';
        
        return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; font-size: 12px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; font-size: 12px; font-family: monospace; color: #000000;">${s.prn || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.name || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.class || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.division || '—'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.degree || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.yearOfEnrollment || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #6b7280;">${customFieldsStr}</td>
      </tr>
    `;
      }
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #111827;
            background: #ffffff;
          }
          .header-box {
            border-bottom: 2px solid #000000;
            padding-bottom: 10px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 11px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 2px solid #111827;
          }
          .footer-box {
            margin-top: 20px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>University ERP</h1>
            <div class="meta-info">${title}</div>
          </div>
          <div class="meta-info" style="text-align: right;">
            <div>Generated: ${dateStr}</div>
            <div>Total Students: ${students.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 11%;">PRN</th>
              <th style="width: 16%;">Name</th>
              <th style="width: 10%;">Class</th>
              <th style="width: 6%;">Div</th>
              <th style="width: 20%;">Degree</th>
              <th style="width: 8%;">Year</th>
              <th style="width: 25%;">Custom Fields</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          Official University ERP Export Document. Generated on ${dateStr}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Unified export dispatcher for students
export const exportStudents = (students, format = 'csv') => {
  if (!students || students.length === 0) {
    alert('No student data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportStudentsCSV(students);
      break;
    case 'txt':
      exportStudentsTXT(students);
      break;
    case 'pdf':
      exportStudentsPDF(students);
      break;
    default:
      exportStudentsCSV(students);
  }
};

// Export Staff to CSV format
export const exportStaffCSV = (staffList, filename = `staff_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Date of Joining', 'Bank Name', 'Account Holder', 'Account Number', 'IFSC Code'];

  const rows = staffList.map((s) => [
    `"${(s.staffId || '').replace(/"/g, '""')}"`,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.role || '').replace(/"/g, '""')}"`,
    `"${(s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().slice(0, 10) : '').replace(/"/g, '""')}"`,
    `"${(s.bankDetails?.bankName || '').replace(/"/g, '""')}"`,
    `"${(s.bankDetails?.accountHolderName || '').replace(/"/g, '""')}"`,
    `"${(s.bankDetails?.accountNumber || '').replace(/"/g, '""')}"`,
    `"${(s.bankDetails?.ifscCode || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

// Export Staff to TXT format
export const exportStaffTXT = (staffList, filename = `staff_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const idWidth = 14;
  const nameWidth = 22;
  const emailWidth = 26;
  const phoneWidth = 15;
  const roleWidth = 18;
  const dojWidth = 12;

  const padRight = (str, len) => (str || '').padEnd(len, ' ');

  const totalWidth = idWidth + nameWidth + emailWidth + phoneWidth + roleWidth + dojWidth + 10;
  const separator = '='.repeat(totalWidth);
  const subSeparator = '-'.repeat(totalWidth);

  const header = [
    'UNIVERSITY ERP - STAFF DIRECTORY',
    `Generated On: ${dateStr}`,
    `Total Staff: ${staffList.length}`,
    separator,
    `${padRight('STAFF ID', idWidth)}  ${padRight('NAME', nameWidth)}  ${padRight('EMAIL', emailWidth)}  ${padRight('PHONE', phoneWidth)}  ${padRight('ROLE', roleWidth)}  ${padRight('JOIN DATE', dojWidth)}`,
    subSeparator,
  ];

  const body = staffList.map((s) => {
    const id = padRight(s.staffId || 'N/A', idWidth);
    const name = padRight(s.name || 'N/A', nameWidth);
    const email = padRight(s.email || 'N/A', emailWidth);
    const phone = padRight(s.phone || 'N/A', phoneWidth);
    const role = padRight(s.role || 'N/A', roleWidth);
    const doj = padRight(s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().slice(0, 10) : 'N/A', dojWidth);

    return `${id}  ${name}  ${email}  ${phone}  ${role}  ${doj}`;
  });

  const footer = [
    subSeparator,
    'End of Report',
    separator,
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

// Export Staff to printable PDF format
export const exportStaffPDF = (staffList, title = 'University Staff Directory') => {
  const dateStr = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const rowsHtml = staffList
    .map(
      (s, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; font-size: 12px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; font-size: 12px; font-family: monospace; color: #000000;">${s.staffId || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.name || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.email || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.phone || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.role || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().slice(0, 10) : 'N/A'}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #111827;
            background: #ffffff;
          }
          .header-box {
            border-bottom: 2px solid #000000;
            padding-bottom: 10px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 11px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 2px solid #111827;
          }
          .footer-box {
            margin-top: 20px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>University ERP</h1>
            <div class="meta-info">${title}</div>
          </div>
          <div class="meta-info" style="text-align: right;">
            <div>Generated: ${dateStr}</div>
            <div>Total Staff: ${staffList.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 14%;">Staff ID</th>
              <th style="width: 20%;">Name</th>
              <th style="width: 23%;">Email</th>
              <th style="width: 13%;">Phone</th>
              <th style="width: 13%;">Role</th>
              <th style="width: 12%;">Join Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          Official University ERP Export Document. Generated on ${dateStr}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Unified export dispatcher for staff
export const exportStaff = (staffList, format = 'csv') => {
  if (!staffList || staffList.length === 0) {
    alert('No staff data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportStaffCSV(staffList);
      break;
    case 'txt':
      exportStaffTXT(staffList);
      break;
    case 'pdf':
      exportStaffPDF(staffList);
      break;
    default:
      exportStaffCSV(staffList);
  }
};

// Export Venues to CSV format
export const exportVenuesCSV = (venues, filename = `venues_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['Venue ID', 'Venue Name', 'Capacity', 'Status', 'Facilities'];

  const rows = venues.map((v) => {
    // Format facilities as "Name1: Details1; Name2: Details2"
    const facilitiesStr = Array.isArray(v.facilities) && v.facilities.length > 0
      ? v.facilities.map(f => typeof f === 'string' ? f : `${f.name}${f.details ? ': ' + f.details : ''}`).join('; ')
      : '';
    return [
      `"${(v.venueId || '').replace(/"/g, '""')}"`,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${v.capacity || 0}"`,
      `"${(v.status || 'ACTIVE').replace(/"/g, '""')}"`,
      `"${facilitiesStr.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

// Export Venues to TXT format
export const exportVenuesTXT = (venues, filename = `venues_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const idWidth = 14;
  const nameWidth = 25;
  const capWidth = 10;
  const statusWidth = 14;
  const facWidth = 35;

  const padRight = (str, len) => (str || '').padEnd(len, ' ');

  const totalWidth = idWidth + nameWidth + capWidth + statusWidth + facWidth + 8;
  const separator = '='.repeat(totalWidth);
  const subSeparator = '-'.repeat(totalWidth);

  const header = [
    'UNIVERSITY ERP - VENUES DIRECTORY',
    `Generated On: ${dateStr}`,
    `Total Venues: ${venues.length}`,
    separator,
    `${padRight('VENUE ID', idWidth)}  ${padRight('NAME', nameWidth)}  ${padRight('CAPACITY', capWidth)}  ${padRight('STATUS', statusWidth)}  ${padRight('FACILITIES', facWidth)}`,
    subSeparator,
  ];

  const body = venues.map((v) => {
    const id = padRight(v.venueId || 'N/A', idWidth);
    const name = padRight(v.name || 'N/A', nameWidth);
    const cap = padRight(String(v.capacity || 0), capWidth);
    const status = padRight(v.status || 'ACTIVE', statusWidth);
    const facStr = Array.isArray(v.facilities) && v.facilities.length > 0
      ? v.facilities.map(f => typeof f === 'string' ? f : `${f.name}${f.details ? ': ' + f.details : ''}`).join(', ')
      : '—';
    const fac = padRight(facStr, facWidth);

    return `${id}  ${name}  ${cap}  ${status}  ${fac}`;
  });

  const footer = [
    subSeparator,
    'End of Report',
    separator,
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

// Export Venues to printable PDF format
export const exportVenuesPDF = (venues, title = 'University Venues Directory') => {
  const dateStr = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const rowsHtml = venues
    .map(
      (v, idx) => {
        const facilitiesStr = Array.isArray(v.facilities) && v.facilities.length > 0
          ? v.facilities.map(f => typeof f === 'string' ? f : `${f.name}${f.details ? ': ' + f.details : ''}`).join(', ')
          : '—';

        return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; font-size: 12px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; font-size: 12px; font-family: monospace; color: #000000;">${v.venueId || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-weight: 500; color: #111827;">${v.name || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${v.capacity || 0}</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #4b5563;">${facilitiesStr}</td>
        <td style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${v.status || 'ACTIVE'}</td>
      </tr>
    `;
      }
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #111827;
            background: #ffffff;
          }
          .header-box {
            border-bottom: 2px solid #000000;
            padding-bottom: 10px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 11px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 2px solid #111827;
          }
          .footer-box {
            margin-top: 20px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>University ERP</h1>
            <div class="meta-info">${title}</div>
          </div>
          <div class="meta-info" style="text-align: right;">
            <div>Generated: ${dateStr}</div>
            <div>Total Venues: ${venues.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 15%;">Venue ID</th>
              <th style="width: 25%;">Name</th>
              <th style="width: 10%;">Capacity</th>
              <th style="width: 33%;">Facilities</th>
              <th style="width: 12%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          Official University ERP Export Document. Generated on ${dateStr}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Unified export dispatcher for venues
export const exportVenues = (venues, format = 'csv') => {
  if (!venues || venues.length === 0) {
    alert('No venue data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportVenuesCSV(venues);
      break;
    case 'txt':
      exportVenuesTXT(venues);
      break;
    case 'pdf':
      exportVenuesPDF(venues);
      break;
    default:
      exportVenuesCSV(venues);
  }
};

// Export Events to CSV format
export const exportEventsCSV = (events, filename = `events_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['Event ID', 'Title', 'Event Type', 'Organizer ID', 'Organizer Name', 'Start Date', 'End Date', 'Venue ID', 'Budget Estimate', 'Status', 'Description'];

  const rows = events.map((e) => [
    `"${(e.eventId || '').replace(/"/g, '""')}"`,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    `"${(e.eventType || '').replace(/"/g, '""')}"`,
    `"${(e.organizerId || '').replace(/"/g, '""')}"`,
    `"${(e.organizerName || '').replace(/"/g, '""')}"`,
    `"${(e.startDate || '').replace(/"/g, '""')}"`,
    `"${(e.endDate || '').replace(/"/g, '""')}"`,
    `"${(e.venueId || '').replace(/"/g, '""')}"`,
    `"${e.budgetEstimate !== undefined && e.budgetEstimate !== null ? e.budgetEstimate : ''}"`,
    `"${(e.status || 'UPCOMING').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

// Export Events to TXT format
export const exportEventsTXT = (events, filename = `events_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const idWidth = 14;
  const titleWidth = 26;
  const typeWidth = 16;
  const orgWidth = 18;
  const dateWidth = 22;
  const venueWidth = 14;
  const statusWidth = 12;

  const padRight = (str, len) => (str || '').padEnd(len, ' ');

  const totalWidth = idWidth + titleWidth + typeWidth + orgWidth + dateWidth + venueWidth + statusWidth + 12;
  const separator = '='.repeat(totalWidth);
  const subSeparator = '-'.repeat(totalWidth);

  const header = [
    'UNIVERSITY ERP - EVENT BOOKINGS DIRECTORY',
    `Generated On: ${dateStr}`,
    `Total Events: ${events.length}`,
    separator,
    `${padRight('EVENT ID', idWidth)}  ${padRight('TITLE', titleWidth)}  ${padRight('TYPE', typeWidth)}  ${padRight('ORGANIZER', orgWidth)}  ${padRight('DATES', dateWidth)}  ${padRight('VENUE', venueWidth)}  ${padRight('STATUS', statusWidth)}`,
    subSeparator,
  ];

  const body = events.map((e) => {
    const id = padRight(e.eventId || 'N/A', idWidth);
    const title = padRight(e.title || 'N/A', titleWidth);
    const type = padRight(e.eventType || 'N/A', typeWidth);
    const org = padRight(e.organizerName || e.organizerId || 'N/A', orgWidth);
    const dates = padRight(`${e.startDate ? e.startDate.slice(0, 10) : ''} to ${e.endDate ? e.endDate.slice(0, 10) : ''}`, dateWidth);
    const venue = padRight(e.venueId || 'N/A', venueWidth);
    const status = padRight(e.status || 'UPCOMING', statusWidth);

    return `${id}  ${title}  ${type}  ${org}  ${dates}  ${venue}  ${status}`;
  });

  const footer = [
    subSeparator,
    'End of Report',
    separator,
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

// Export Events to printable PDF format
export const exportEventsPDF = (events, title = 'University Event Bookings Directory') => {
  const dateStr = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const rowsHtml = events
    .map(
      (e, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; font-size: 12px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; font-size: 12px; font-family: monospace; color: #000000;">${e.eventId || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #111827;">${e.title || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #4b5563;">${e.eventType || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${e.organizerName || e.organizerId || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #111827;">${e.startDate ? e.startDate.slice(0, 10) : ''} &rarr; ${e.endDate ? e.endDate.slice(0, 10) : ''}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; color: #111827;">${e.venueId || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${e.status || 'UPCOMING'}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #111827;
            background: #ffffff;
          }
          .header-box {
            border-bottom: 2px solid #000000;
            padding-bottom: 10px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 11px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 2px solid #111827;
          }
          .footer-box {
            margin-top: 20px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>University ERP</h1>
            <div class="meta-info">${title}</div>
          </div>
          <div class="meta-info" style="text-align: right;">
            <div>Generated: ${dateStr}</div>
            <div>Total Events: ${events.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 12%;">Event ID</th>
              <th style="width: 22%;">Title</th>
              <th style="width: 14%;">Event Type</th>
              <th style="width: 16%;">Organizer</th>
              <th style="width: 16%;">Dates</th>
              <th style="width: 8%;">Venue</th>
              <th style="width: 8%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          Official University ERP Export Document. Generated on ${dateStr}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Unified export dispatcher for events
export const exportEvents = (events, format = 'csv') => {
  if (!events || events.length === 0) {
    alert('No event data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportEventsCSV(events);
      break;
    case 'txt':
      exportEventsTXT(events);
      break;
    case 'pdf':
      exportEventsPDF(events);
      break;
    default:
      exportEventsCSV(events);
  }
};

