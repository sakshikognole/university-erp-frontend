import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import { getAllStudents } from '../services/studentService';

const onLocalhost = window.location.hostname === 'localhost';
const SPRING_BASE = onLocalhost
  ? 'http://localhost:9090'
  : 'https://university-erp-spring.onrender.com';

export default function HandoutPage() {
  const [students,    setStudents]    = useState([]);
  const [docTypes,    setDocTypes]    = useState([]);
  const [selStudents, setSelStudents] = useState([]);
  const [selDocs,     setSelDocs]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [pageError,   setPageError]   = useState('');
  const successTimer = useRef(null);

  // Improvement 3: auto-dismiss success after 4 seconds
  useEffect(() => {
    if (!success) return;
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(successTimer.current);
  }, [success]);

  async function loadData() {
    setLoading(true); setPageError('');
    try {
      // D1 fix: getAllStudents now fetches all pages (size=200 per page)
      const [s, d] = await Promise.all([
        getAllStudents(),
        springGet('/document-types'),
      ]);
      setStudents(s);
      setDocTypes(Array.isArray(d) ? d : (d.data ?? []));
    } catch (err) {
      setPageError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const toggleStudent = (id) =>
    setSelStudents(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDoc = (name) =>
    setSelDocs(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const toggleAllS = () =>
    setSelStudents(selStudents.length === students.length ? [] : students.map(s => s.studentId));
  const toggleAllD = () =>
    setSelDocs(selDocs.length === docTypes.length ? [] : docTypes.map(d => d.documentName));

  // Improvement 1: Clear all selected students at once
  const clearStudents = () => setSelStudents([]);

  async function handleGenerate() {
    if (!selStudents.length) { setError('Select at least one student.'); return; }
    if (!selDocs.length)     { setError('Select at least one certificate type.'); return; }
    setGenerating(true); setError(''); setSuccess('');
    try {
      const res = await axios.post(
        `${SPRING_BASE}/api/handout/generate`,
        { studentIds: selStudents, documentTypes: selDocs },
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'certificates.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      // Improvement 3: success message auto-dismisses after 4s
      setSuccess(`${selStudents.length * selDocs.length} PDF(s) downloaded as ZIP.`);
    } catch {
      setError('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <PageLoader message="Loading students and certificate types..." />;
  if (pageError) return <PageError message={pageError} onRetry={loadData} />;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'nowrap', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">Handout</h1>
          <p className="page-subtitle">
            Select students and certificate types, then download all as a ZIP.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}
      {/* Improvement 3: success auto-dismisses, but user can also close */}
      {success && (
        <div className="books-alert books-alert-success" style={{ marginBottom: 12 }}>
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')}>x</button>
        </div>
      )}

      <div className="stu-handout-grid">

        {/* ── Students panel ── */}
        <div className="card stu-checklist-card">
          <div className="stu-checklist-header">
            <span className="stu-checklist-title">
              Students
              <span style={{ fontSize: 12, color: 'var(--text-secondary)',
                             fontWeight: 400, marginLeft: 6 }}>
                ({students.length} total)
              </span>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="stu-btn stu-btn-sm stu-btn-ghost" onClick={toggleAllS}>
                {selStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
              {/* Improvement 1: Clear button */}
              {selStudents.length > 0 && (
                <button className="stu-btn stu-btn-sm stu-btn-ghost"
                        onClick={clearStudents}
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                  Clear ({selStudents.length})
                </button>
              )}
            </div>
          </div>

          {students.length === 0 ? (
            <p className="stu-info-text">No students found.</p>
          ) : (
            <ul className="stu-checklist">
              {students.map(s => (
                <li key={s.studentId} className="stu-checklist-item">
                  <label className="stu-check-label">
                    <input
                      type="checkbox"
                      checked={selStudents.includes(s.studentId)}
                      onChange={() => toggleStudent(s.studentId)}
                    />
                    <span className="stu-check-text">
                      <strong>{s.studentName}</strong>
                      <span className="stu-check-meta">
                        {s.studentId} · {s.studyingYear} · {s.gender}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="stu-checklist-count">
            {selStudents.length} / {students.length} selected
          </div>
        </div>

        {/* ── Certificate Types panel ── */}
        <div className="card stu-checklist-card">
          <div className="stu-checklist-header">
            <span className="stu-checklist-title">Certificate Types</span>
            <button className="stu-btn stu-btn-sm stu-btn-ghost" onClick={toggleAllD}>
              {selDocs.length === docTypes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {docTypes.length === 0 ? (
            <p className="stu-info-text">No certificate types found. Add one first.</p>
          ) : (
            <ul className="stu-checklist">
              {docTypes.map(d => (
                <li key={d.id} className="stu-checklist-item">
                  <label className="stu-check-label">
                    <input
                      type="checkbox"
                      checked={selDocs.includes(d.documentName)}
                      onChange={() => toggleDoc(d.documentName)}
                    />
                    <span className="stu-check-text">
                      <strong>{d.documentName}</strong>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="stu-checklist-count">
            {selDocs.length} / {docTypes.length} selected
          </div>

          {/* Improvement 2: Generate button below certificate types on the right */}
          <div style={{
            paddingTop: 12, borderTop: '1px solid var(--border-primary,#f3f4f6)',
            marginTop: 8,
          }}>
            {selStudents.length > 0 && selDocs.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Will generate{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {selStudents.length * selDocs.length} PDF{selStudents.length * selDocs.length > 1 ? 's' : ''}
                </strong>
                {' '}({selStudents.length} student{selStudents.length > 1 ? 's' : ''}
                {' '}× {selDocs.length} type{selDocs.length > 1 ? 's' : ''})
              </p>
            )}
            {/* Improvement 2: button is compact and right-aligned */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="books-btn books-btn-primary"
                style={{ fontSize: 13, padding: '7px 16px' }}
                onClick={handleGenerate}
                disabled={generating || !selStudents.length || !selDocs.length}
              >
                {generating ? 'Generating...' : '⬇ Generate & Download ZIP'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
