import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { springApi } from '../services/api';
import * as XLSX from 'xlsx';

// ── Node.js backend URL (Students module source) ──────────────────────────────
const _IS_PROD = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
const NODE_API = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS     = ['T1', 'T2', 'SEE'];
const MAX      = { T1: 20, T2: 20, SEE: 50 };
const TAB_KEY  = { T1: 't1Marks', T2: 't2Marks', SEE: 'seeMarks' };
const SEC_KEY  = { T1: 't1', T2: 't2', SEE: 'see' };
const TAB_COLOR = {
  T1:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', active: '#1d4ed8' },
  T2:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', active: '#166534' },
  SEE: { bg: '#fef9c3', color: '#854d0e', border: '#fde047', active: '#92400e' },
};

// ── CSV parser ─────────────────────────────────────────────────────────────────
function parseCSV(text, tabType) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const markKey = tabType.toLowerCase();

  return lines.slice(1)
    .filter((line) => line.trim())
    .map((line, i) => {
      const cols = line.split(',').map((c) => c.trim());
      const row  = {};
      headers.forEach((h, j) => { row[h] = cols[j] ?? ''; });

      const serialNo = Number(
        row['serial no.'] ?? row['serial no'] ?? row['serialno'] ??
        row['sr.no'] ?? row['sr no'] ?? row['s.no'] ?? row['sno'] ?? i + 1
      );
      const prn = row['prn'] ?? row['prn no'] ?? row['prnno'] ?? '';
      const studentName =
        row['name'] ?? row['student name'] ?? row['studentname'] ??
        row['full name'] ?? row['fullname'] ?? '';
      const rawMark =
        row[markKey] ?? row['marks'] ?? row['mark'] ?? row['score'] ?? row['obtained'] ?? '';

      return {
        serialNo,
        prn,
        studentName,
        marks: rawMark !== '' && !isNaN(Number(rawMark)) ? Number(rawMark) : null,
      };
    });
}

// ── Compute derived values ─────────────────────────────────────────────────────
function computeMark(raw, tab) {
  if (raw === null || raw === undefined || raw === '') return null;
  const v   = Number(raw);
  if (isNaN(v)) return null;
  const max = MAX[tab];
  return { raw, converted: tab !== 'SEE' ? +((v / max) * 10).toFixed(2) : null, percentage: +((v / max) * 100).toFixed(2) };
}

// ── Tab badge ──────────────────────────────────────────────────────────────────
function TabButton({ tab, active, count, onClick }) {
  const c = TAB_COLOR[tab];
  return (
    <button type="button" onClick={onClick} style={{
      padding: '8px 20px',
      border: `2px solid ${active ? c.active : '#e5e7eb'}`,
      borderRadius: 8, background: active ? c.bg : '#fff',
      color: active ? c.color : '#6b7280',
      fontWeight: active ? 700 : 500, fontSize: '0.9rem',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {tab}
      <span style={{
        background: active ? c.active : '#e5e7eb',
        color: active ? '#fff' : '#374151',
        borderRadius: 9999, padding: '1px 8px',
        fontSize: '0.75rem', fontWeight: 700,
      }}>
        {/* D13/14/15: show only rows with data */}
        {count}
      </span>
    </button>
  );
}

const blankRow = (n) => ({ serialNo: n, prn: '', studentName: '', marks: null });

// ── Validate a single row ──────────────────────────────────────────────────────
// D16/D17/D18/D19/D20: PRN, name, marks validation
function validateRow(row, tab, allRows, idx) {
  const errs = {};
  const prn = (row.prn ?? '').trim();
  const name = (row.studentName ?? '').trim();
  const marks = row.marks;
  const max = MAX[tab];

  // PRN
  if (!prn) {
    errs.prn = 'PRN is required.';
  } else if (prn.startsWith('-')) {
    errs.prn = 'PRN must not be negative.';
  } else if (/[^A-Za-z0-9]/.test(prn)) {
    errs.prn = 'PRN must contain only letters and numbers.';
  } else {
    // Duplicate PRN check
    const dup = allRows.findIndex((r, i) => i !== idx && (r.prn ?? '').trim() === prn);
    if (dup >= 0) errs.prn = `Duplicate PRN (row ${dup + 1}).`;
  }

  // Student Name
  if (!name) {
    errs.studentName = 'Student name is required.';
  } else if (!/[A-Za-z]/.test(name)) {
    errs.studentName = 'Student name must contain letters.';
  }

  // Marks
  if (marks === null || marks === undefined || marks === '') {
    errs.marks = 'Marks are required.';
  } else {
    const m = Number(marks);
    if (isNaN(m)) {
      errs.marks = 'Marks must be a number.';
    } else if (m < 0) {
      errs.marks = 'Marks cannot be negative.';
    } else if (m > max) {
      errs.marks = `Marks cannot exceed ${max}.`;
    }
  }

  return errs;
}

// ── Mobile-compatible PDF generator ──────────────────────────────────────────
function generateMarksPdfBlob(exam, activeTab, max, currentRows, isFraction, fracScale, pctScale) {
  const safeExamId = (exam?.examId || 'EXAM').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSubject = (exam?.subject || 'Subject');
  const acadYear = exam?.academicYear ? ` | Academic Year: ${exam.academicYear}` : '';
  const title = `${safeSubject} - ${activeTab} Marks Sheet`;
  const subtitle = `Exam ID: ${safeExamId} | Max Marks: ${max}${acadYear}`;

  const isT1T2 = activeTab !== 'SEE';
  const headers = isT1T2
    ? ['#', 'PRN', 'Student Name', `Raw /${max}`, isFraction ? `/${fracScale}` : `% /${pctScale}`, 'Status']
    : ['#', 'PRN', 'Student Name', `Raw /50`, `% /${pctScale}`, 'Status'];

  const colX = [40, 75, 180, 360, 440, 500];

  const sanitize = (str) =>
    String(str ?? '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/[()\\\\]/g, '\\$&');

  const rowsPerPage = 26;
  const pagesData = [];
  for (let i = 0; i < currentRows.length; i += rowsPerPage) {
    pagesData.push(currentRows.slice(i, i + rowsPerPage));
  }
  if (pagesData.length === 0) pagesData.push([]);

  const numPages = pagesData.length;
  const font1Obj = 3 + numPages;
  const font2Obj = font1Obj + 1;
  const firstStreamObj = font2Obj + 1;

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageKids = [];
  for (let p = 0; p < numPages; p++) {
    pageKids.push(`${3 + p} 0 R`);
  }
  objects.push(`<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${numPages} >>`);

  for (let p = 0; p < numPages; p++) {
    const streamObjIdx = firstStreamObj + p;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${font1Obj} 0 R /F2 ${font2Obj} 0 R >> >> /Contents ${streamObjIdx} 0 R >>`
    );
  }

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  pagesData.forEach((pageRows, pIdx) => {
    let stream = '';
    let y = 800;
    stream += `BT\n/F2 16 Tf\n40 ${y} Td\n(${sanitize(title)}) Tj\nET\n`;
    y -= 18;
    stream += `BT\n/F1 10 Tf\n40 ${y} Td\n(${sanitize(subtitle)}) Tj\nET\n`;
    y -= 14;
    stream += `BT\n/F1 8 Tf\n40 ${y} Td\n(Page ${pIdx + 1} of ${numPages} | Total Records: ${currentRows.length}) Tj\nET\n`;
    y -= 22;

    stream += `0.92 0.94 0.96 rg\n40 ${y - 4} 515 20 re\nf\n0 g\n`;
    headers.forEach((h, hIdx) => {
      stream += `BT\n/F2 9 Tf\n${colX[hIdx]} ${y + 2} Td\n(${sanitize(h)}) Tj\nET\n`;
    });
    stream += `0.8 w\n40 ${y - 4} m 555 ${y - 4} l S\n`;
    y -= 18;

    pageRows.forEach((row, rIdx) => {
      const globalIdx = pIdx * rowsPerPage + rIdx;
      const comp = computeMark(row.marks, activeTab);
      const convertedVal = comp
        ? (isFraction
            ? `${+((comp.raw / max) * fracScale).toFixed(2)}/${fracScale}`
            : `${+((comp.raw / max) * pctScale).toFixed(2)}%`)
        : '-';
      const statusText = row.marks != null ? 'Present' : 'Absent';

      const rowValues = [
        globalIdx + 1,
        row.prn || '-',
        row.studentName || '-',
        row.marks != null ? String(row.marks) : '-',
        convertedVal,
        statusText,
      ];

      if (rIdx % 2 === 1) {
        stream += `0.98 0.98 0.98 rg\n40 ${y - 4} 515 16 re\nf\n0 g\n`;
      }

      rowValues.forEach((val, cIdx) => {
        stream += `BT\n/F1 9 Tf\n${colX[cIdx]} ${y} Td\n(${sanitize(val)}) Tj\nET\n`;
      });

      stream += `0.3 w [1 2] 0 d\n40 ${y - 4} m 555 ${y - 4} l S\n[] 0 d\n`;
      y -= 18;
    });

    const streamLen = stream.length;
    objects.push(`<< /Length ${streamLen} >>\nstream\n${stream}\nendstream`);
  });

  let pdfStr = '%PDF-1.4\n';
  const xref = [0];
  objects.forEach((obj, idx) => {
    xref.push(pdfStr.length);
    pdfStr += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const startxref = pdfStr.length;
  pdfStr += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdfStr += `${String(xref[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return new Blob([pdfStr], { type: 'application/pdf' });
}

export default function ExamMarksPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const examId         = searchParams.get('examId');

  const [exam,         setExam]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [studentsList, setStudentsList] = useState([]);

  const [activeTab, setActiveTab]   = useState('T1');
  const [tabData,   setTabData]     = useState({ T1: [], T2: [], SEE: [] });
  const [edited,    setEdited]      = useState({ T1: false, T2: false, SEE: false });
  const [rowErrors, setRowErrors]   = useState({ T1: [], T2: [], SEE: [] });
  const [saving,    setSaving]      = useState(false);

  // PRN lookup status for auto-name
  const [prnLookupStatus, setPrnLookupStatus] = useState({});
  const prnTimers = useRef({});

  const fileRef = useRef();

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // Preload students from Students module for instant reliable PRN lookup
  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    fetch(`${NODE_API}/super-admin/students`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data.students ?? data.content ?? []);
        setStudentsList(arr);
      })
      .catch((err) => console.warn('Could not preload students for PRN lookup:', err));
  }, []);

  useEffect(() => {
    if (!examId) { navigate('/exams'); return; }
    setLoading(true);
    springApi.get(`/exams/${examId}`)
      .then((res) => {
        const e = res?.data ?? res;
        setExam(e);
        setTabData({
          T1:  Array.isArray(e.t1Marks)  ? e.t1Marks  : [],
          T2:  Array.isArray(e.t2Marks)  ? e.t2Marks  : [],
          SEE: Array.isArray(e.seeMarks) ? e.seeMarks : [],
        });
      })
      .catch(() => setError('Failed to load exam.'))
      .finally(() => setLoading(false));
  }, [examId, navigate]);

  const currentRows = tabData[activeTab] ?? [];

  const setCurrentRows = useCallback((updater) => {
    setTabData((prev) => ({
      ...prev,
      [activeTab]: typeof updater === 'function' ? updater(prev[activeTab]) : updater,
    }));
    setEdited((prev) => ({ ...prev, [activeTab]: true }));
  }, [activeTab]);

  // ── Add row ────────────────────────────────────────────────────────────────
  const addRow = () => {
    setCurrentRows((prev) => [...prev, blankRow(prev.length + 1)]);
  };

  const removeRow = (idx) => {
    setCurrentRows((prev) => prev.filter((_, i) => i !== idx));
    setRowErrors((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter((_, i) => i !== idx),
    }));
  };

  // PRN lookup → auto-fill student name from Students module (consistent across T1, T2, SEE)
  const lookupPrn = useCallback(async (prn, idx) => {
    const clean = (prn || '').trim();
    if (!clean) return;

    setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'loading' }));

    const cleanLower = clean.toLowerCase();
    const cleanNoPrefix = cleanLower.startsWith('prn') ? cleanLower.slice(3) : cleanLower;

    // 1. Search in preloaded Students module list
    const foundLocal = studentsList.find(s => {
      const sPrn = (s.prn || '').trim().toLowerCase();
      const sPrnNoPrefix = sPrn.startsWith('prn') ? sPrn.slice(3) : sPrn;
      const sId = (s._id || s.studentId || '').toString().toLowerCase();
      return (
        sPrn === cleanLower ||
        sPrnNoPrefix === cleanNoPrefix ||
        sPrn === 'prn' + cleanNoPrefix ||
        sId === cleanLower
      );
    });

    if (foundLocal && (foundLocal.name || foundLocal.studentName)) {
      const studentName = foundLocal.name || foundLocal.studentName;
      setCurrentRows(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], studentName };
        return copy;
      });
      setRowErrors(prev => {
        const tabErrs = [...(prev[activeTab] || [])];
        if (tabErrs[idx]) tabErrs[idx] = { ...tabErrs[idx], studentName: undefined };
        return { ...prev, [activeTab]: tabErrs };
      });
      setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
      return;
    }

    // 2. Query Students module directly via search
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(`${NODE_API}/super-admin/students?search=${encodeURIComponent(clean)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const match = list.find(s => {
            const sPrn = (s.prn || '').trim().toLowerCase();
            const sPrnNoPrefix = sPrn.startsWith('prn') ? sPrn.slice(3) : sPrn;
            return sPrn === cleanLower || sPrnNoPrefix === cleanNoPrefix || sPrn === 'prn' + cleanNoPrefix;
          }) || list[0];
          const name = match.name || match.studentName;
          if (name) {
            setCurrentRows(prev => {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], studentName: name };
              return copy;
            });
            setRowErrors(prev => {
              const tabErrs = [...(prev[activeTab] || [])];
              if (tabErrs[idx]) tabErrs[idx] = { ...tabErrs[idx], studentName: undefined };
              return { ...prev, [activeTab]: tabErrs };
            });
            setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
            return;
          }
        }
      }
    } catch {
      /* fall through to spring */
    }

    // 3. Fallback to Spring Boot
    try {
      const res = await springApi.get(`/students/by-prn/${encodeURIComponent(clean)}`);
      const name = res?.studentName ?? res?.name ?? res?.data?.studentName ?? res?.data?.name ?? '';
      if (name) {
        setCurrentRows(prev => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], studentName: name };
          return copy;
        });
        setRowErrors(prev => {
          const tabErrs = [...(prev[activeTab] || [])];
          if (tabErrs[idx]) tabErrs[idx] = { ...tabErrs[idx], studentName: undefined };
          return { ...prev, [activeTab]: tabErrs };
        });
        setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
        return;
      }
    } catch {
      if (!cleanLower.startsWith('prn')) {
        try {
          const res2 = await springApi.get(`/students/by-prn/${encodeURIComponent('PRN' + clean)}`);
          const name2 = res2?.studentName ?? res2?.name ?? res2?.data?.studentName ?? '';
          if (name2) {
            setCurrentRows(prev => {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], studentName: name2 };
              return copy;
            });
            setRowErrors(prev => {
              const tabErrs = [...(prev[activeTab] || [])];
              if (tabErrs[idx]) tabErrs[idx] = { ...tabErrs[idx], studentName: undefined };
              return { ...prev, [activeTab]: tabErrs };
            });
            setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
            return;
          }
        } catch { /* fall through */ }
      }
    }

    setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'notfound' }));
  }, [activeTab, studentsList, setCurrentRows]);

  const updateCell = (idx, field, value) => {
    setCurrentRows((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: field === 'marks' ? (value === '' ? null : Number(value)) : value,
      };
      return copy;
    });
    // Clear row error for this field
    setRowErrors(prev => {
      const tabErrs = [...(prev[activeTab] || [])];
      if (tabErrs[idx]) tabErrs[idx] = { ...tabErrs[idx], [field]: undefined };
      return { ...prev, [activeTab]: tabErrs };
    });

    // Obs4: auto-lookup name when PRN field changes
    if (field === 'prn' && value.trim()) {
      clearTimeout(prnTimers.current[`${activeTab}-${idx}`]);
      prnTimers.current[`${activeTab}-${idx}`] = setTimeout(() => {
        lookupPrn(value, idx);
      }, 400);
    }
  };

  // ── CSV import — D23/24/25: APPEND to existing rows ──────────────────────
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result, activeTab);
      // D23/24/25: append imported rows BELOW existing rows, not replace
      setCurrentRows(prev => {
        const startSerial = prev.length + 1;
        const withSerial = parsed.map((r, i) => ({ ...r, serialNo: startSerial + i }));
        return [...prev, ...withSerial];
      });
      setSuccess(`Imported ${parsed.length} student(s) appended to ${activeTab}. Review and save.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Validate all rows before save ─────────────────────────────────────────
  const validateAllRows = () => {
    const rows = tabData[activeTab] ?? [];
    const errs = rows.map((row, idx) => validateRow(row, activeTab, rows, idx));
    setRowErrors(prev => ({ ...prev, [activeTab]: errs }));
    return errs.every(e => Object.keys(e).length === 0);
  };

  // ── Save tab ───────────────────────────────────────────────────────────────
  const saveTab = async () => {
    if (!validateAllRows()) {
      setError('Please fix validation errors before saving.');
      return;
    }
    setSaving(true);
    const slowTimer = setTimeout(() => {
      setError('Server is waking up (free tier). Please wait...');
    }, 3000);
    try {
      const section = SEC_KEY[activeTab];
      const res = await springApi.put(`/exams/${examId}/marks/${section}`, currentRows);
      clearTimeout(slowTimer);
      const saved = res?.data ?? res;
      setExam(saved);
      setTabData({
        T1:  Array.isArray(saved.t1Marks)  ? saved.t1Marks  : tabData.T1,
        T2:  Array.isArray(saved.t2Marks)  ? saved.t2Marks  : tabData.T2,
        SEE: Array.isArray(saved.seeMarks) ? saved.seeMarks : tabData.SEE,
      });
      setEdited((prev) => ({ ...prev, [activeTab]: false }));
      setRowErrors(prev => ({ ...prev, [activeTab]: [] }));
      setError('');
      setSuccess(`${activeTab} marks saved successfully.`);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  // Safe mobile-friendly download helper with delayed revocation
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2500);
  };

  const buildRows = () => currentRows.map((m, i) => {
    const c = computeMark(m.marks, activeTab);
    return { ...m, idx: i, c };
  });

  const getSafeFilenames = () => {
    const safeExamId = (exam?.examId || 'EXAM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeSubject = (exam?.subject || 'Subject').replace(/[^a-zA-Z0-9_-]/g, '_');
    return { safeExamId, safeSubject };
  };

  // CSV export with UTF-8 BOM, proper quotes, and CRLF for mobile spreadsheet viewers
  const exportCSV = () => {
    if (!exam || currentRows.length === 0) return;
    const { safeExamId, safeSubject } = getSafeFilenames();
    const isT1T2 = activeTab !== 'SEE';
    const max = MAX[activeTab];
    const headers = isT1T2
      ? ['S.No', 'PRN', 'Student Name', `${activeTab} Raw /${max}`, `${activeTab} /10`, `${activeTab} %`]
      : ['S.No', 'PRN', 'Student Name', 'SEE Raw /50', 'SEE %'];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx + 1, prn || '', studentName || '', marks ?? '', c?.converted ?? '', c?.percentage != null ? `${c.percentage}%` : ''].map(escapeCSV).join(',')
        : [idx + 1, prn || '', studentName || '', marks ?? '', c?.percentage != null ? `${c.percentage}%` : ''].map(escapeCSV).join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${safeExamId}_${safeSubject}_${activeTab}.csv`);
  };

  // Excel export using true OpenXML .xlsx binary workbook (100% mobile compatible)
  const exportExcel = () => {
    if (!exam || currentRows.length === 0) return;
    const { safeExamId, safeSubject } = getSafeFilenames();
    const isT1T2 = activeTab !== 'SEE';
    const max = MAX[activeTab];
    const headers = isT1T2
      ? ['S.No', 'PRN', 'Student Name', `${activeTab} Raw /${max}`, `${activeTab} /10`, `${activeTab} %`]
      : ['S.No', 'PRN', 'Student Name', 'SEE Raw /50', 'SEE %'];

    const dataRows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx + 1, prn || '', studentName || '', marks ?? '', c?.converted ?? '', c?.percentage != null ? `${c.percentage}%` : '']
        : [idx + 1, prn || '', studentName || '', marks ?? '', c?.percentage != null ? `${c.percentage}%` : '']
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab}_Marks`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, `${safeExamId}_${safeSubject}_${activeTab}.xlsx`);
  };

  // PDF export generating true .pdf binary file for mobile opening + print preview
  const exportPDF = () => {
    if (!exam) return;
    const { safeExamId, safeSubject } = getSafeFilenames();
    const pdfBlob = generateMarksPdfBlob(
      exam,
      activeTab,
      MAX[activeTab],
      currentRows,
      (exam?.displayMode ?? 'PERCENTAGE') === 'FRACTION',
      Number(exam?.fractionScale ?? 10) || 10,
      Number(exam?.percentageScale ?? 100) || 100
    );
    triggerDownload(pdfBlob, `${safeExamId}_${safeSubject}_${activeTab}.pdf`);
  };

  const downloadTemplate = () => {
    const hdr  = `Serial No.,PRN,Name,${activeTab}`;
    const samp = activeTab !== 'SEE' ? `1,PRN001,Student Name,15` : '1,PRN001,Student Name,42';
    const content = '\uFEFF' + [hdr, samp].join('\r\n');
    triggerDownload(new Blob([content], { type: 'text/csv;charset=utf-8;' }), `exam_${activeTab}_template.csv`);
  };

  // D13/14/15: count only rows with student data
  const studentCount = (rows) =>
    (rows ?? []).filter(r => (r.prn ?? '').trim() || (r.studentName ?? '').trim()).length;

  if (loading) return (
    <div className="page-container" style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb',
        borderTop:'3px solid #111827', borderRadius:'50%',
        animation:'pageloader-spin 0.8s linear infinite' }} />
    </div>
  );

  if (!exam) return (
    <div className="page-container">
      <p style={{ color:'#dc2626' }}>{error || 'Exam not found.'}</p>
    </div>
  );

  const isT1T2 = activeTab !== 'SEE';
  const max    = MAX[activeTab];
  const tc     = TAB_COLOR[activeTab];
  const isFraction  = (exam?.displayMode ?? 'PERCENTAGE') === 'FRACTION';
  const pctScale    = Number(exam?.percentageScale ?? 100) || 100;
  const fracScale   = Number(exam?.fractionScale ?? 10) || 10;
  const tabRowErrs  = rowErrors[activeTab] || [];

  return (
    <div className="page-container">

      {/* Back */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <button className="books-btn books-btn-ghost books-btn-sm"
          onClick={() => navigate('/exams')}>← Back</button>
      </div>

      {/* Header and prominent information cards / badges for Subject ID and Academic Year */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ textAlign: 'left', marginBottom: 10 }}>
          {exam.subject}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '5px 12px', fontSize: '0.85rem'
          }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subject:
            </span>
            <strong style={{ color: '#0f172a' }}>{exam.subject}</strong>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '5px 12px', fontSize: '0.85rem'
          }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subject / Exam ID:
            </span>
            <span className="code-badge" style={{ fontWeight: 700 }}>{exam.examId}</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '5px 12px', fontSize: '0.85rem'
          }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Academic Year:
            </span>
            <span style={{
              background: '#eff6ff', color: '#1e3a5f', border: '1px solid #bfdbfe',
              borderRadius: 4, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600
            }}>
              {exam.academicYear || 'Not Specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs — D13/14/15: count based on rows with data */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((tab) => (
          <TabButton
            key={tab}
            tab={tab}
            active={activeTab === tab}
            count={studentCount(tabData[tab])}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Info banner */}
      <div style={{
        background:tc.bg, border:`1px solid ${tc.border}`,
        borderRadius:8, padding:'10px 14px', marginBottom:14,
        fontSize:'0.85rem', color:tc.color, fontWeight:500,
        display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:8,
      }}>
        <span>
          <strong>{activeTab}</strong> — Max: <strong>{max}</strong>
          &nbsp;·&nbsp; Display:{' '}
          <strong>
            {isFraction
              ? `Fraction (/${fracScale})`
              : `Percentage (out of ${pctScale}%)`}
          </strong>
        </span>
        <span style={{ fontSize:'0.78rem', opacity:0.8 }}>
          {studentCount(currentRows)} student{studentCount(currentRows) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Improvement: single toolbar — no duplicate Add Row / Save */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv"
          style={{ display:'none' }} onChange={handleImport} />
        <button className="books-btn books-btn-ghost"
          onClick={() => fileRef.current.click()}>📥 Import CSV</button>
        <button className="books-btn books-btn-ghost"
          onClick={downloadTemplate}>📋 Template</button>
        <button className="books-btn books-btn-ghost" onClick={addRow}>
          + Add Row
        </button>
        <button className="books-btn books-btn-ghost" onClick={exportCSV}
          disabled={currentRows.length === 0}>📄 CSV</button>
        <button className="books-btn books-btn-ghost" onClick={exportExcel}
          disabled={currentRows.length === 0}>📊 Excel</button>
        <button className="books-btn books-btn-ghost" onClick={exportPDF}
          disabled={currentRows.length === 0}>🖨️ PDF</button>
        {edited[activeTab] && (
          <button className="books-btn books-btn-primary"
            onClick={saveTab} disabled={saving}>
            {saving ? 'Saving...' : `💾 Save ${activeTab}`}
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>x</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      {/* Marks table */}
      <div className="card" style={{ padding:'1rem' }}>
        {currentRows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2.5rem', color:'#9ca3af' }}>
            <p style={{ fontSize:'1.5rem', marginBottom:8 }}>📋</p>
            <p style={{ fontWeight:600, color:'#374151' }}>No {activeTab} data yet</p>
            <p style={{ fontSize:'0.875rem' }}>
              Click <strong>+ Add Row</strong> to add students manually,
              or <strong>📥 Import CSV</strong> to import a list.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:16 }}>
              <button className="books-btn books-btn-primary" onClick={addRow}>+ Add Row</button>
              <button className="books-btn books-btn-ghost"
                onClick={() => fileRef.current.click()}>📥 Import CSV</button>
            </div>
          </div>
        ) : (
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width:42 }}>#</th>
                  <th>Prn</th>
                  <th>Student name</th>
                  <th>{activeTab} marks <span style={{ fontWeight:400, fontSize:'0.72rem' }}>/{max}</span></th>
                  <th style={{ textAlign:'center' }}>
                    {isFraction ? `/${fracScale}` : `% (/${pctScale})`}
                  </th>
                  <th style={{ width:48, textAlign:'center' }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((m, idx) => {
                  const comp   = computeMark(m.marks, activeTab);
                  const rErr   = tabRowErrs[idx] || {};
                  const prnKey = `${activeTab}-${idx}`;
                  const lookupStatus = prnLookupStatus[prnKey];
                  return (
                    <tr key={idx} style={{ background: Object.keys(rErr).length ? '#fff5f5' : undefined }}>
                      <td style={{ color:'#9ca3af', fontSize:'0.8rem', verticalAlign:'top', paddingTop:10 }}>
                        {idx + 1}
                      </td>
                      <td>
                        {/* D16/Obs4: PRN with auto-lookup indicator */}
                        <input
                          className={`books-form-control ${rErr.prn ? 'err' : ''}`}
                          style={{ padding:'4px 8px', minWidth:90 }}
                          value={m.prn ?? ''}
                          onChange={(e) => updateCell(idx, 'prn', e.target.value)}
                          placeholder="PRN"
                        />
                        {lookupStatus === 'loading' && (
                          <span style={{ fontSize:10, color:'#9ca3af' }}>looking up...</span>
                        )}
                        {lookupStatus === 'found' && (
                          <span style={{ fontSize:10, color:'#16a34a' }}>✓ found</span>
                        )}
                        {lookupStatus === 'notfound' && (
                          <span style={{ fontSize:10, color:'#dc2626' }}>not found</span>
                        )}
                        {rErr.prn && <p className="books-form-err" style={{ fontSize:10, margin:'2px 0 0' }}>{rErr.prn}</p>}
                      </td>
                      <td>
                        {/* D17: Student Name with validation */}
                        <input
                          className={`books-form-control ${rErr.studentName ? 'err' : ''}`}
                          style={{ padding:'4px 8px', minWidth:130 }}
                          value={m.studentName ?? ''}
                          onChange={(e) => updateCell(idx, 'studentName', e.target.value)}
                          placeholder="Student Name"
                        />
                        {rErr.studentName && (
                          <p className="books-form-err" style={{ fontSize:10, margin:'2px 0 0' }}>
                            {rErr.studentName}
                          </p>
                        )}
                      </td>
                      <td>
                        {/* D18/19/20: marks validation 0-max, no negative, required */}
                        <input
                          type="number" min="0" max={max} step="0.5"
                          className={`books-form-control ${rErr.marks ? 'err' : ''}`}
                          style={{ padding:'4px 8px', width:80 }}
                          value={m.marks ?? ''}
                          onChange={(e) => updateCell(idx, 'marks', e.target.value)}
                          placeholder={`0-${max}`}
                        />
                        {rErr.marks && (
                          <p className="books-form-err" style={{ fontSize:10, margin:'2px 0 0' }}>
                            {rErr.marks}
                          </p>
                        )}
                      </td>
                      <td style={{ textAlign:'center', fontWeight:700, color:tc.color }}>
                        {comp
                          ? (isFraction
                              ? `${+((comp.raw/max)*fracScale).toFixed(2)}/${fracScale}`
                              : `${+((comp.raw/max)*pctScale).toFixed(2)}%`)
                          : '—'}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => removeRow(idx)}
                        >×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
