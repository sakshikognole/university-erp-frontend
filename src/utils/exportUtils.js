---/**
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
    const div = padRight(s.division || '-----"', divWidth);
    const degree = padRight(s.degree || 'N/A', degreeWidth);
    const year = padRight(s.yearOfEnrollment || 'N/A', yearWidth);
    
    // Format custom fields as "Key1: Value1; Key2: Value2"
    const customFieldsStr = s.customFields && s.customFields.length > 0
      ? s.customFields.map(cf => `${cf.key}: ${cf.value}`).join('; ')
      : '-----"';
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
          : '-----"';
        
        return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; font-size: 12px; color: #111827;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; font-size: 12px; font-family: monospace; color: #000000;">${s.prn || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.name || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.class || 'N/A'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.division || '-----"'}</td>
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
      : '-----"';
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
          : '-----"';

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

// ==========================================
// FEE PAYMENT EXPORTS & RECEIPT GENERATION
// ==========================================

export const exportFeePaymentsCSV = (feeRecords, filename = `fee_payments_${new Date().toISOString().slice(0, 10)}.csv`) => {
  const headers = ['PRN', 'Student Name', 'Class', 'Degree', 'Academic Year', 'Fee Type', 'Total Fee (INR)', 'Discount (INR)', 'Paid (INR)', 'Remaining (INR)', 'Status'];
  const rows = feeRecords.map((f) => [
    `"${(f.prn || '').replace(/"/g, '""')}"`,
    `"${(f.studentName || '').replace(/"/g, '""')}"`,
    `"${(f.class || '').replace(/"/g, '""')}"`,
    `"${(f.degree || '').replace(/"/g, '""')}"`,
    `"${(f.academicYear || '').replace(/"/g, '""')}"`,
    `"${(f.feeType || '').replace(/"/g, '""')}"`,
    f.totalFeeAmount || 0,
    f.discountAmount || 0,
    f.paidAmount || 0,
    f.remainingAmount || 0,
    `"${(f.status || 'PENDING').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const exportFeePaymentsTXT = (feeRecords, filename = `fee_payments_${new Date().toISOString().slice(0, 10)}.txt`) => {
  const dateStr = new Date().toLocaleString();
  const padRight = (str, len) => String(str || '').padEnd(len, ' ');

  const totalFee = feeRecords.reduce((acc, f) => acc + (f.totalFeeAmount || 0), 0);
  const totalDiscount = feeRecords.reduce((acc, f) => acc + (f.discountAmount || 0), 0);
  const totalPaid = feeRecords.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalRemaining = feeRecords.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

  const header = [
    '========================================================================================',
    '                               UNIVERSITY ERP - FEE PAYMENTS REPORT                      ',
    '========================================================================================',
    `Generated On: ${dateStr}`,
    `Total Records: ${feeRecords.length}`,
    `Summary: Total Fee: INR ${totalFee} | Discounts: INR ${totalDiscount} | Paid: INR ${totalPaid} | Remaining: INR ${totalRemaining}`,
    '----------------------------------------------------------------------------------------',
    `${padRight('PRN', 14)} ${padRight('STUDENT NAME', 22)} ${padRight('FEE TYPE', 24)} ${padRight('TOTAL', 10)} ${padRight('PAID', 10)} ${padRight('STATUS', 10)}`,
    '----------------------------------------------------------------------------------------',
  ];

  const body = feeRecords.map((f) => {
    return `${padRight(f.prn, 14)} ${padRight(f.studentName, 22)} ${padRight(f.feeType, 24)} ${padRight(f.totalFeeAmount, 10)} ${padRight(f.paidAmount, 10)} ${padRight(f.status, 10)}`;
  });

  const footer = [
    '----------------------------------------------------------------------------------------',
    'End of Fee Payments Report',
    '========================================================================================',
  ];

  const txtContent = [...header, ...body, ...footer].join('\r\n');
  triggerDownload(txtContent, filename, 'text/plain;charset=utf-8;');
};

export const exportFeePaymentsPDF = (feeRecords, title = 'University ERP - Fee Payments Summary') => {
  const dateStr = new Date().toLocaleString();
  const printWindow = window.open('', '_blank', 'width=950,height=750');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const totalFee = feeRecords.reduce((acc, f) => acc + (f.totalFeeAmount || 0), 0);
  const totalDiscount = feeRecords.reduce((acc, f) => acc + (f.discountAmount || 0), 0);
  const totalPaid = feeRecords.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalRemaining = feeRecords.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

  const rowsHtml = feeRecords
    .map(
      (f, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px 10px; font-size: 12px; color: #6b7280;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-family: monospace; font-weight: 600;">${f.prn}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 500;">${f.studentName}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #4b5563;">${f.feeType}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 600;">-------${(f.totalFeeAmount || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #15803d;">-------${(f.discountAmount || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 600; color: #047857;">-------${(f.paidAmount || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; color: #b91c1c;">-------${(f.remainingAmount || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 8px 10px; font-size: 11px;">
          <span style="display:inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: ${f.status === 'PAID' ? '#dcfce7; color: #15803d;' : f.status === 'PARTIAL' ? '#fef3c7; color: #b45309;' : '#fee2e2; color: #b91c1c;'}">${f.status}</span>
        </td>
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
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
          .stat-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; background: #f9fafb; }
          .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .stat-val { font-size: 16px; font-weight: 700; color: #111827; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f3f4f6; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; border-bottom: 1px solid #d1d5db; }
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="meta">Generated: ${dateStr} ------- Total Records: ${feeRecords.length}</div>
        </div>

        <div class="stats-bar">
          <div class="stat-box">
            <div class="stat-label">Total Fee</div>
            <div class="stat-val">-------${totalFee.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Discounted</div>
            <div class="stat-val">-------${totalDiscount.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Paid</div>
            <div class="stat-val">-------${totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Remaining</div>
            <div class="stat-val">-------${totalRemaining.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 12%;">PRN</th>
              <th style="width: 18%;">Student Name</th>
              <th style="width: 18%;">Fee Type</th>
              <th style="width: 11%;">Total</th>
              <th style="width: 9%;">Discount</th>
              <th style="width: 10%;">Paid</th>
              <th style="width: 10%;">Remaining</th>
              <th style="width: 8%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Official University ERP Report ------- System Generated
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const exportFeePayments = (feeRecords, format = 'csv') => {
  if (!feeRecords || feeRecords.length === 0) {
    alert('No fee payment data available to export.');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportFeePaymentsCSV(feeRecords);
      break;
    case 'txt':
      exportFeePaymentsTXT(feeRecords);
      break;
    case 'pdf':
      exportFeePaymentsPDF(feeRecords);
      break;
    default:
      exportFeePaymentsCSV(feeRecords);
  }
};

/**
 * Downloads / Prints official PDF Fee Receipt for a specific transaction
 */
export const downloadFeeReceiptPDF = (receipt) => {
  if (!receipt) {
    alert('Invalid receipt data');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=800,height=750');
  if (!printWindow) {
    alert('Please allow popups to download/print the fee receipt.');
    return;
  }

  const paidDate = new Date(receipt.paidAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Fee_Receipt_${receipt.receiptNumber || 'Receipt'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }
          .receipt-card {
            border: 2px solid #111827;
            border-radius: 8px;
            padding: 28px;
            max-width: 700px;
            margin: 0 auto;
          }
          .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .uni-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #000000;
            text-transform: uppercase;
          }
          .uni-tagline {
            font-size: 12px;
            color: #6b7280;
            margin-top: 3px;
          }
          .receipt-badge {
            text-align: right;
          }
          .receipt-tag {
            background: #111827;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          .receipt-no {
            font-size: 13px;
            font-weight: 700;
            font-family: monospace;
            margin-top: 6px;
            color: #111827;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
          }
          .info-item {
            font-size: 13px;
          }
          .info-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .info-value {
            font-weight: 600;
            color: #111827;
          }
          .payment-breakdown {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .payment-breakdown th {
            text-align: left;
            padding: 10px 12px;
            background: #f3f4f6;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            border-bottom: 1px solid #d1d5db;
          }
          .payment-breakdown td {
            padding: 12px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
          }
          .amount-row-highlight {
            background: #ecfdf5;
            font-weight: 700;
          }
          .amount-row-highlight td {
            font-size: 15px;
            color: #047857;
            border-top: 2px solid #059669;
          }
          .footer-note {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px dashed #d1d5db;
            font-size: 11px;
            color: #6b7280;
          }
          .stamp-box {
            text-align: right;
            font-size: 12px;
            font-weight: 600;
            color: #111827;
          }
          .status-paid-pill {
            display: inline-block;
            background: #10b981;
            color: #ffffff;
            font-weight: 800;
            padding: 3px 12px;
            border-radius: 9999px;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="receipt-header">
            <div>
              <div class="uni-name">University ERP</div>
              <div class="uni-tagline">Official Student E-Fee Payment Receipt</div>
            </div>
            <div class="receipt-badge">
              <span class="receipt-tag">Payment Verified</span>
              <div class="receipt-no">Receipt #${receipt.receiptNumber || 'N/A'}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Student PRN</div>
              <div class="info-value" style="font-family: monospace;">${receipt.prn || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Student Name</div>
              <div class="info-value">${receipt.studentName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Program & Class</div>
              <div class="info-value">${receipt.degree || ''} (${receipt.class || 'N/A'})</div>
            </div>
            <div class="info-item">
              <div class="info-label">Academic Year / Sem</div>
              <div class="info-value">${receipt.academicYear || '2025-2026'} - ${receipt.semester || 'Semester 1'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Transaction ID</div>
              <div class="info-value" style="font-family: monospace; font-size: 12px;">${receipt.transactionId || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Date & Time</div>
              <div class="info-value">${paidDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Mode</div>
              <div class="info-value">${receipt.paymentMethod || 'Razorpay (Test Mode)'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Gateway Reference</div>
              <div class="info-value" style="font-family: monospace; font-size: 12px;">${receipt.razorpayPaymentId || 'pay_test_verified'}</div>
            </div>
          </div>

          <table class="payment-breakdown">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fee Category:</strong> ${receipt.feeType || 'Tuition & Academic Fee'}</td>
                <td style="text-align: right; font-weight: 600;">-------${(receipt.totalFeeAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Scholarship / Institutional Discount</td>
                <td style="text-align: right; color: #15803d;">- -------${(receipt.discountAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Net Payable Amount</td>
                <td style="text-align: right; font-weight: 600;">-------${Math.max(0, (receipt.totalFeeAmount || 0) - (receipt.discountAmount || 0)).toLocaleString('en-IN')}</td>
              </tr>
              <tr class="amount-row-highlight">
                <td><strong>Amount Paid in This Transaction</strong></td>
                <td style="text-align: right;">-------${(receipt.amountPaidThisTransaction || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Total Cumulative Amount Paid</td>
                <td style="text-align: right; font-weight: 600;">-------${(receipt.totalPaidSoFar || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td><strong>Remaining Balance Amount</strong></td>
                <td style="text-align: right; font-weight: 700; color: ${receipt.remainingBalance === 0 ? '#15803d' : '#b91c1c'};">-------${(receipt.remainingBalance || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-note">
            <div>
              <span class="status-paid-pill">PAYMENT SUCCESSFUL</span>
              <div style="margin-top: 6px;">This is a computer generated electronic receipt. No physical signature required.</div>
            </div>
            <div class="stamp-box">
              <div>Finance & Accounts Office</div>
              <div style="font-size: 11px; color: #6b7280; font-weight: 400;">University ERP System</div>
            </div>
          </div>
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
  printWindow.document.write(html);
  printWindow.document.close();
};


