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
// Accepts columns (case-insensitive, any order):
//   serial no. / serialno / sr.no / s.no → serialNo
//   prn                                  → prn
//   name / student name / studentname    → studentName
//   t1 / t2 / see / marks / mark / score → marks (active tab's mark)
function parseCSV(text, tabType) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const markKey = tabType.toLowerCase(); // 't1', 't2', or 'see'

  return lines.slice(1)
    .filter((line) => line.trim())           // skip blank rows
    .map((line, i) => {
      const cols = line.split(',').map((c) => c.trim());
      const row  = {};
      headers.forEach((h, j) => { row[h] = cols[j] ?? ''; });

      // Resolve serial number
      const serialNo = Number(
        row['serial no.'] ?? row['serial no'] ?? row['serialno'] ??
        row['sr.no'] ?? row['sr no'] ?? row['s.no'] ?? row['sno'] ?? i + 1
      );

      // Resolve PRN
      const prn = row['prn'] ?? row['prn no'] ?? row['prnno'] ?? '';

      // Resolve student name
      const studentName =
        row['name'] ?? row['student name'] ?? row['studentname'] ??
        row['full name'] ?? row['fullname'] ?? '';

      // Resolve marks — try tab-specific key first, then generic fallbacks
      const rawMark =
        row[markKey] ??           // e.g. 't1', 't2', 'see'
        row['marks'] ??           // generic 'marks'
        row['mark'] ??            // singular 'mark'
        row['score'] ??           // 'score'
        row['obtained'] ??        // 'obtained marks'
        '';

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
  return {
    raw,
    converted:  tab !== 'SEE' ? +((v / max) * 10).toFixed(2) : null,
    percentage: +((v / max) * 100).toFixed(2),
  };
}

// ── Tab badge ──────────────────────────────────────────────────────────────────
function TabButton({ tab, active, count, onClick }) {
  const c = TAB_COLOR[tab];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 20px',
        border: `2px solid ${active ? c.active : '#e5e7eb'}`,
        borderRadius: 8,
        background: active ? c.bg : '#fff',
        color: active ? c.color : '#6b7280',
        fontWeight: active ? 700 : 500,
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      {tab}
      <span style={{
        background: active ? c.active : '#e5e7eb',
        color: active ? '#fff' : '#374151',
        borderRadius: 9999, padding: '1px 8px',
        fontSize: '0.75rem', fontWeight: 700,
      }}>{count}</span>
    </button>
  );
}

// ── Blank row factory ──────────────────────────────────────────────────────────
const blankRow = (n) => ({ serialNo: n, prn: '', studentName: '', marks: null });

export default function ExamMarksPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const examId         = searchParams.get('examId');

  const [exam,     setExam]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // ── Per-tab state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState('T1');
  const [tabData,   setTabData]     = useState({ T1: [], T2: [], SEE: [] });
  const [edited,    setEdited]      = useState({ T1: false, T2: false, SEE: false });
  const [saving,    setSaving]      = useState(false);

  const fileRef = useRef();

  // Auto-clear notifications
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // Load exam
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

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Remove row ─────────────────────────────────────────────────────────────
  const removeRow = (idx) => {
    setCurrentRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Update cell ────────────────────────────────────────────────────────────
  const updateCell = (idx, field, value) => {
    setCurrentRows((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: field === 'marks'
          ? (value === '' ? null : Number(value))
          : value,
      };
      return copy;
    });
  };

  // ── CSV import ─────────────────────────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result, activeTab);
      setCurrentRows(parsed);
      setSuccess(`Imported ${parsed.length} student(s) into ${activeTab}. Review and save.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Save current tab ───────────────────────────────────────────────────────
  const saveTab = async () => {
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
      setError('');
      setSuccess(`${activeTab} marks saved successfully.`);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  // ── Download blob ──────────────────────────────────────────────────────────
  const dl = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const buildRows = () => currentRows.map((m, i) => {
    const c = computeMark(m.marks, activeTab);
    const isT1T2 = activeTab !== 'SEE';
    return { ...m, idx: i, c, isT1T2 };
  });

  const exportCSV = () => {
    if (!exam || currentRows.length === 0) return;
    const isT1T2 = activeTab !== 'SEE';
    const hdr = isT1T2
      ? `S.No,PRN,Student Name,${activeTab} Raw /${MAX[activeTab]},${activeTab} /10,${activeTab} %`
      : `S.No,PRN,Student Name,SEE Raw /50,SEE %`;
    const rows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx + 1, prn, studentName, marks ?? '', c?.converted ?? '', c?.percentage ?? ''].join(',')
        : [idx + 1, prn, studentName, marks ?? '', c?.percentage ?? ''].join(',')
    );
    dl(new Blob([[hdr, ...rows].join('\n')], { type: 'text/csv' }),
      `${exam.examId}_${exam.subject}_${activeTab}.csv`);
  };

  const exportExcel = () => {
    if (!exam || currentRows.length === 0) return;
    const isT1T2 = activeTab !== 'SEE';
    const hdr = isT1T2
      ? `S.No\tPRN\tStudent Name\t${activeTab} Raw /${MAX[activeTab]}\t${activeTab} /10\t${activeTab} %`
      : `S.No\tPRN\tStudent Name\tSEE Raw /50\tSEE %`;
    const rows = buildRows().map(({ idx, prn, studentName, marks, c }) =>
      isT1T2
        ? [idx + 1, prn, studentName, marks ?? '', c?.converted ?? '', c?.percentage ?? ''].join('\t')
        : [idx + 1, prn, studentName, marks ?? '', c?.percentage ?? ''].join('\t')
    );
    dl(new Blob([[hdr, ...rows].join('\n')], { type: 'application/vnd.ms-excel' }),
      `${exam.examId}_${exam.subject}_${activeTab}.xls`);
  };

  const exportPDF = () => {
    if (!exam) return;
    const isT1T2 = activeTab !== 'SEE';
    const max = MAX[activeTab];
    const ths = isT1T2
      ? ['S.No', 'PRN', 'Student Name', `${activeTab} Raw /${max}`, `${activeTab} /10`, `${activeTab} %`]
      : ['S.No', 'PRN', 'Student Name', 'SEE Raw /50', 'SEE %'];
    const trs = buildRows().map(({ idx, prn, studentName, marks, c }, i) => {
      const cells = isT1T2
        ? [i + 1, prn, studentName, marks ?? '-', c?.converted ?? '-', c ? `${c.percentage}%` : '-']
        : [i + 1, prn, studentName, marks ?? '-', c ? `${c.percentage}%` : '-'];
      return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        ${cells.map((v) => `<td style="padding:6px 10px;border:1px solid #e5e7eb">${v}</td>`).join('')}
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
<p class="meta">Exam ID: ${exam.examId} | Max Marks: ${max}${exam.academicYear ? ` | ${exam.academicYear}` : ''}</p>
<table><thead><tr>${ths.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${trs}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const downloadTemplate = () => {
    const isT1T2 = activeTab !== 'SEE';
    const tabCol = activeTab; // T1, T2, or SEE
    const hdr  = `Serial No.,PRN,Name,${tabCol}`;
    const samp = isT1T2 ? `1,PRN001,Student Name,15` : '1,PRN001,Student Name,42';
    dl(new Blob([[hdr, samp].join('\n')], { type: 'text/csv' }),
      `exam_${activeTab}_template.csv`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #e5e7eb',
        borderTop: '3px solid #111827', borderRadius: '50%',
        animation: 'pageloader-spin 0.8s linear infinite',
      }} />
    </div>
  );

  if (!exam) return (
    <div className="page-container">
      <p style={{ color: '#dc2626' }}>{error || 'Exam not found.'}</p>
    </div>
  );

  const isT1T2 = activeTab !== 'SEE';
  const max    = MAX[activeTab];
  const tc     = TAB_COLOR[activeTab];
  const isFraction  = (exam?.displayMode ?? 'PERCENTAGE') === 'FRACTION';
  // fractionScale: user-defined denominator (default 10). e.g. scale=5 means 20 marks → /5
  const fracScale   = Number(exam?.fractionScale ?? 10) || 10;

  return (
    <div className="page-container">

      {/* ── Back + Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button className="books-btn books-btn-ghost books-btn-sm"
          onClick={() => navigate('/exams')}>← Back</button>
      </div>

      <div className="books-page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">{exam.subject}</h1>
          <p className="stu-page-sub">
            {exam.examId}
            {exam.academicYear && <>&nbsp;·&nbsp;{exam.academicYear}</>}
          </p>
        </div>
      </div>

      {/* ── T1 / T2 / SEE Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <TabButton
            key={tab}
            tab={tab}
            active={activeTab === tab}
            count={(tabData[tab] ?? []).length}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* ── Active tab info banner ── */}
      <div style={{
        background: tc.bg, border: `1px solid ${tc.border}`,
        borderRadius: 8, padding: '10px 14px', marginBottom: 14,
        fontSize: '0.85rem', color: tc.color, fontWeight: 500,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <span>
          <strong>{activeTab}</strong> — Max Marks: <strong>{max}</strong>
          {isT1T2 && <> &nbsp;&middot;&nbsp; Display: <strong>{isFraction ? `Fraction (/` + fracScale + `)` : 'Percentage (%)'}</strong></>}
          {!isT1T2 && <> &nbsp;&middot;&nbsp; Display: <strong>{isFraction ? `Fraction (/` + fracScale + `)` : 'Percentage (%)'}</strong></>}
        </span>
        <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
          {currentRows.length} student{currentRows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv"
          style={{ display: 'none' }} onChange={handleImport} />
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
            {saving ? 'Saving...' : `💾 Save ${activeTab} Marks`}
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

      {/* ── Marks table for active tab ── */}
      <div className="card" style={{ padding: '1rem' }}>
        {currentRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</p>
            <p style={{ fontWeight: 600, color: '#374151' }}>No {activeTab} data yet</p>
            <p style={{ fontSize: '0.875rem' }}>
              Click <strong>+ Add Row</strong> to add students manually,
              or <strong>📥 Import CSV</strong> to import a list.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <button className="books-btn books-btn-primary" onClick={addRow}>+ Add Row</button>
              <button className="books-btn books-btn-ghost"
                onClick={() => fileRef.current.click()}>📥 Import CSV</button>
            </div>
          </div>
        ) : (
          <>
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>PRN</th>
                    <th>Student Name</th>
                    <th>
                      {activeTab} Marks
                      <span style={{ fontWeight: 400, fontSize: '0.72rem' }}>&nbsp;/{max}</span>
                    </th>
                    {isT1T2 && (
                      <th style={{ textAlign: 'center' }}>
                        {isFraction ? `/${fracScale} Scale` : '% Score'}
                      </th>
                    )}
                    {!isT1T2 && (
                      <th style={{ textAlign: 'center' }}>
                        {isFraction ? `/${fracScale} Scale` : '% Score'}
                      </th>
                    )}
                    <th style={{ width: 56, textAlign: 'center' }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((m, idx) => {
                    const comp = computeMark(m.marks, activeTab);
                    return (
                      <tr key={idx}>
                        <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td>
                          <input
                            className="books-form-control"
                            style={{ padding: '4px 8px', minWidth: 90 }}
                            value={m.prn ?? ''}
                            onChange={(e) => updateCell(idx, 'prn', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="books-form-control"
                            style={{ padding: '4px 8px', minWidth: 140 }}
                            value={m.studentName ?? ''}
                            onChange={(e) => updateCell(idx, 'studentName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" max={max}
                            className="books-form-control"
                            style={{ padding: '4px 8px', width: 80 }}
                            value={m.marks ?? ''}
                            onChange={(e) => updateCell(idx, 'marks', e.target.value)}
                          />
                        </td>
                        {isT1T2 && (
                          <td style={{ textAlign: 'center', fontWeight: 700, color: tc.color }}>
                            {comp
                              ? (isFraction
                                  ? `${+((comp.raw / max) * fracScale).toFixed(2)}/${fracScale}`
                                  : `${comp.percentage}%`)
                              : '—'}
                          </td>
                        )}
                        {!isT1T2 && (
                          <td style={{ textAlign: 'center', color: '#6b7280' }}>
                            {comp
                              ? (isFraction
                                  ? `${+((comp.raw / max) * fracScale).toFixed(2)}/${fracScale}`
                                  : `${comp.percentage}%`)
                              : '—'}
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }}>
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

            {/* Add row at the bottom */}
            <button
              className="books-btn books-btn-ghost"
              onClick={addRow}
              style={{ marginTop: 10, fontSize: '0.85rem' }}
            >
              + Add Row
            </button>
          </>
        )}
      </div>

      {/* Unsaved changes sticky banner */}
      {edited[activeTab] && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#1e3a5f', color: '#fff',
          padding: '12px 20px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: '0.9rem' }}>
            Unsaved changes in <strong>{activeTab}</strong>
          </span>
          <button className="books-btn books-btn-primary"
            onClick={saveTab} disabled={saving}
            style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      )}

    </div>
  );
}
