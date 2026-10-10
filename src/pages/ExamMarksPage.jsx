import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { springApi } from '../services/api';

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

export default function ExamMarksPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const examId         = searchParams.get('examId');

  const [exam,     setExam]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [activeTab, setActiveTab]   = useState('T1');
  const [tabData,   setTabData]     = useState({ T1: [], T2: [], SEE: [] });
  const [edited,    setEdited]      = useState({ T1: false, T2: false, SEE: false });
  const [rowErrors, setRowErrors]   = useState({ T1: [], T2: [], SEE: [] });
  const [saving,    setSaving]      = useState(false);

  // D17/Obs4: PRN lookup for auto-name
  const [prnLookupStatus, setPrnLookupStatus] = useState({});
  const prnTimers = useRef({});

  const fileRef = useRef();

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

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
  // Improvement: single Add Row button (in toolbar only when rows exist)
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

  // Obs4/D17: PRN lookup → auto-fill student name
  const lookupPrn = useCallback(async (prn, idx) => {
    if (!prn.trim()) return;
    setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'loading' }));
    try {
      const res = await springApi.get(`/students/by-prn/${encodeURIComponent(prn.trim())}`);
      const name = res?.studentName ?? res?.data?.studentName ?? '';
      if (name) {
        setCurrentRows(prev => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], studentName: name };
          return copy;
        });
        setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
      } else {
        setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'notfound' }));
      }
    } catch {
      // Try with PRN prefix
      if (!prn.trim().toUpperCase().startsWith('PRN')) {
        try {
          const res2 = await springApi.get(`/students/by-prn/${encodeURIComponent('PRN' + prn.trim())}`);
          const name2 = res2?.studentName ?? res2?.data?.studentName ?? '';
          if (name2) {
            setCurrentRows(prev => {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], studentName: name2 };
              return copy;
            });
            setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'found' }));
            return;
          }
        } catch { /* fall through */ }
      }
      setPrnLookupStatus(p => ({ ...p, [`${activeTab}-${idx}`]: 'notfound' }));
    }
  }, [activeTab, setCurrentRows]);

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

  const dl = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const buildRows = () => currentRows.map((m, i) => {
    const c = computeMark(m.marks, activeTab);
    return { ...m, idx: i, c };
  });

  const exportCSV = () => {
    if (!exam || currentRows.length === 0) return;
    const isT1T2 = activeTab !== 'SEE';
    const hdr = isT1T2
      ? `S.No,PRN,Student Name,${activeTab} Raw /${MAX[activeTab]},${activeTab} /10,${activeTab} %`
      : `S.No,PRN,Student Name,SEE Raw /50,SEE %`;
    const rows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx+1, prn, studentName, marks??'', c?.converted??'', c?.percentage??''].join(',')
        : [idx+1, prn, studentName, marks??'', c?.percentage??''].join(',')
    );
    dl(new Blob([[hdr,...rows].join('\n')],{type:'text/csv'}),
      `${exam.examId}_${exam.subject}_${activeTab}.csv`);
  };

  // D21/D22: Excel export — use proper xlsx MIME for better mobile compatibility
  const exportExcel = () => {
    if (!exam || currentRows.length === 0) return;
    const isT1T2 = activeTab !== 'SEE';
    const hdr = isT1T2
      ? `S.No\tPRN\tStudent Name\t${activeTab} Raw /${MAX[activeTab]}\t${activeTab} /10\t${activeTab} %`
      : `S.No\tPRN\tStudent Name\tSEE Raw /50\tSEE %`;
    const rows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx+1, prn, studentName, marks??'', c?.converted??'', c?.percentage??''].join('\t')
        : [idx+1, prn, studentName, marks??'', c?.percentage??''].join('\t')
    );
    // Use BOM + proper MIME type for better mobile support
    const bom = '\uFEFF';
    dl(new Blob([bom + [hdr,...rows].join('\n')],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${exam.examId}_${exam.subject}_${activeTab}.xlsx`);
  };

  const exportPDF = () => {
    if (!exam) return;
    const isT1T2 = activeTab !== 'SEE';
    const max = MAX[activeTab];
    const ths = isT1T2
      ? ['S.No','PRN','Student Name',`${activeTab} Raw /${max}`,`${activeTab} /10`,`${activeTab} %`]
      : ['S.No','PRN','Student Name','SEE Raw /50','SEE %'];
    const trs = buildRows().map(({ idx, prn, studentName, marks, c }, i) => {
      const cells = isT1T2
        ? [i+1, prn, studentName, marks??'-', c?.converted??'-', c?`${c.percentage}%`:'-']
        : [i+1, prn, studentName, marks??'-', c?`${c.percentage}%`:'-'];
      return `<tr style="background:${i%2===0?'#fff':'#f9fafb'}">
        ${cells.map(v=>`<td style="padding:6px 10px;border:1px solid #e5e7eb">${v}</td>`).join('')}
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${exam.examId} ${activeTab}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}
h1{font-size:15pt;margin-bottom:4px}.meta{font-size:10pt;color:#6b7280;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:9pt}
th{background:#1e3a5f;color:#fff;padding:7px 10px;text-align:left;border:1px solid #1e3a5f}
</style></head><body>
<h1>${exam.subject} — ${activeTab} Marks Sheet</h1>
<p class="meta">Exam ID: ${exam.examId} | Max: ${max}${exam.academicYear?` | ${exam.academicYear}`:''}</p>
<table><thead><tr>${ths.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
<tbody>${trs}</tbody></table></body></html>`;
    const w = window.open('','_blank');
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const downloadTemplate = () => {
    const hdr  = `Serial No.,PRN,Name,${activeTab}`;
    const samp = activeTab !== 'SEE' ? `1,PRN001,Student Name,15` : '1,PRN001,Student Name,42';
    dl(new Blob([[hdr,samp].join('\n')],{type:'text/csv'}),`exam_${activeTab}_template.csv`);
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

      {/* D12: header left-aligned on mobile */}
      <div style={{
        display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', flexWrap:'nowrap',
        gap:12, marginBottom:16, textAlign:'left',
      }}>
        <div style={{ minWidth:0 }}>
          <h1 className="page-title" style={{ textAlign:'left' }}>{exam.subject}</h1>
          <p className="page-subtitle" style={{ textAlign:'left' }}>
            <span style={{ fontFamily:'monospace', fontWeight:700 }}>{exam.examId}</span>
            {exam.academicYear && <>&nbsp;·&nbsp;{exam.academicYear}</>}
          </p>
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
                  <th>PRN</th>
                  <th>Student Name</th>
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

      {/* Unsaved changes — single Save button at bottom */}
      {edited[activeTab] && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:999,
          background:'#1e3a5f', color:'#fff',
          padding:'12px 20px', borderRadius:10,
          display:'flex', alignItems:'center', gap:12,
          boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize:'0.9rem' }}>
            Unsaved changes in <strong>{activeTab}</strong>
          </span>
          <button className="books-btn books-btn-primary"
            onClick={saveTab} disabled={saving}
            style={{ padding:'6px 16px', fontSize:'0.85rem' }}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      )}

    </div>
  );
}
