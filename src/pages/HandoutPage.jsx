import { useState, useEffect } from 'react';
import axios from 'axios';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import { getAllStudents } from '../services/studentService';

// Use plain axios for blob requests — springApi interceptor breaks binary data
const onLocalhost = window.location.hostname === 'localhost';
const SPRING_BASE = onLocalhost
  ? 'http://localhost:8080'
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

  const [pageError, setPageError] = useState('');

  async function loadData() {
    setLoading(true); setPageError('');
    try {
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

  const toggleStudent = (id)   => setSelStudents((p) => p.includes(id)   ? p.filter((x) => x !== id)   : [...p, id]);
  const toggleDoc     = (name) => setSelDocs    ((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
  const toggleAllS    = ()     => setSelStudents(selStudents.length === students.length ? [] : students.map((s) => s.studentId));
  const toggleAllD    = ()     => setSelDocs    (selDocs.length === docTypes.length     ? [] : docTypes.map((d) => d.documentName));

  async function handleGenerate() {
    if (!selStudents.length) { setError('Select at least one student.'); return; }
    if (!selDocs.length)     { setError('Select at least one document type.'); return; }
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
      <h1 className="page-title">Handout</h1>
      <p className="stu-page-sub">
        Select students and certificate types, then download all as a ZIP.
      </p>

      <div className="stu-handout-grid">
        {/* Students */}
        <div className="card stu-checklist-card">
          <div className="stu-checklist-header">
            <span className="stu-checklist-title">Students</span>
            <button className="stu-btn stu-btn-sm stu-btn-ghost" onClick={toggleAllS}>
              {selStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {students.length === 0 ? (
            <p className="stu-info-text">No students found.</p>
          ) : (
            <ul className="stu-checklist">
              {students.map((s) => (
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

        {/* Document Types */}
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
              {docTypes.map((d) => (
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
        </div>
      </div>

      {/* Footer */}
      <div className="card stu-handout-footer">
        {selStudents.length > 0 && selDocs.length > 0 && (
          <p className="stu-handout-summary">
            Will generate <strong>{selStudents.length * selDocs.length} PDF(s)</strong>
            {' '}— {selStudents.length} student{selStudents.length > 1 ? 's' : ''} x{' '}
            {selDocs.length} type{selDocs.length > 1 ? 's' : ''}
          </p>
        )}
        {error   && <p className="stu-error-text">{error}</p>}
        {success && <p className="stu-success-text">{success}</p>}
        <button
          className="stu-btn stu-btn-primary"
          onClick={handleGenerate}
          disabled={generating || !selStudents.length || !selDocs.length}
        >
          {generating ? 'Generating...' : 'Generate & Download ZIP'}
        </button>
      </div>
    </div>
  );
}
