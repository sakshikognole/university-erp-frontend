import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';
import ExamModal from './ExamModal';

export default function ExamsPage() {
  const navigate = useNavigate();

  const [exams,     setExams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [dupError,  setDupError]  = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selExam,   setSelExam]   = useState(null);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/exams');
      const list = Array.isArray(res) ? res : (res.data ?? res ?? []);
      // D11: sort alphabetically by examId for predictable order
      list.sort((a, b) => a.examId.localeCompare(b.examId));
      setExams(list);
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load exams.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const openAdd  = ()     => { setSelExam(null); setModalMode('add');  setDupError(''); setModalOpen(true); };
  const openEdit = (exam) => { setSelExam(exam); setModalMode('edit'); setDupError(''); setModalOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    const slowTimer = setTimeout(() => {
      setError('Server is waking up (free tier). Please wait a moment...');
    }, 3000);
    try {
      if (modalMode === 'add') {
        const isDuplicate = exams.some(
          (e) => e.examId.trim().toUpperCase() === form.examId.trim().toUpperCase()
        );
        if (isDuplicate) {
          clearTimeout(slowTimer);
          setDupError(`Exam ID "${form.examId}" already exists.`);
          setSaving(false);
          return;
        }
        await springApi.post('/exams', form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Exam added successfully.');
      } else {
        await springApi.put(`/exams/${selExam.examId}`, form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Exam updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete exam "${exam.examId} — ${exam.subject}"?`)) return;
    try {
      await springApi.delete(`/exams/${exam.examId}`);
      setSuccess('Exam deleted.');
      load(true);
    } catch {
      setError('Failed to delete exam.');
    }
  };

  const filtered = exams.filter((e) => {
    const q = search.toLowerCase();
    return !q
      || e.examId.toLowerCase().includes(q)
      || e.subject.toLowerCase().includes(q)
      || (e.academicYear || '').toLowerCase().includes(q);
  });

  // D13-D15: count only rows that have PRN or studentName entered
  const totalStudents = (exam) => {
    const count = (arr) => (arr ?? []).filter(r => r.prn?.trim() || r.studentName?.trim()).length;
    return Math.max(count(exam.t1Marks), count(exam.t2Marks), count(exam.seeMarks));
  };

  return (
    <div className="page-container">

      {/* D1/D2/D5: title + description left-aligned, button right-aligned on mobile */}
      <div className="books-page-header" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'nowrap', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title" style={{ textAlign: 'left' }}>Exam Management</h1>
          <p className="stu-page-sub" style={{ textAlign: 'left' }}>
            Manage exams and student marks
          </p>
        </div>
        <button
          className="books-btn books-btn-primary"
          style={{ flexShrink: 0 }}
          onClick={openAdd}
        >
          + Add Exam
        </button>
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

      {/* D3: Search with Clear button */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 380 }}>
        <input
          className="books-form-control"
          style={{ paddingRight: search ? 36 : 12 }}
          placeholder="Search by Exam ID, subject, or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* D3: Clear (×) button */}
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            title="Clear search"
            style={{
              position: 'absolute', right: 8, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#9ca3af',
              fontSize: 18, lineHeight: 1, padding: '2px 4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ padding: '1rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0',
              borderBottom: '1px solid #f3f4f6' }}>
              {[40, 90, 180, 100, 70, 100].map((w, j) => (
                <div key={j} style={{
                  width: w, height: 14, borderRadius: 4, flexShrink: 0,
                  background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'books-shimmer 1.4s infinite',
                }} />
              ))}
            </div>
          ))}
        </div>
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">
            {search ? 'No exams matched your search.' : 'No exams added yet. Click "+ Add Exam" to get started.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              Total: {filtered.length} exam{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop table */}
          <div className="book-desk-table">
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    {/* D4: all headers left-aligned, data aligned with headers */}
                    <th style={{ width: 48 }}>#</th>
                    <th>Exam ID</th>
                    <th>Subject</th>
                    <th>Academic Year</th>
                    <th style={{ textAlign: 'center' }}>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam, i) => (
                    <tr key={exam.examId}>
                      <td style={{ color: '#9ca3af', verticalAlign: 'middle' }}>{i + 1}</td>
                      {/* D4: each data cell aligned to match its header */}
                      <td style={{ verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem',
                          fontWeight: 700, color: '#1e3a5f' }}>
                          {exam.examId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, verticalAlign: 'middle' }}>
                        {exam.subject}
                      </td>
                      <td style={{ color: '#6b7280', verticalAlign: 'middle' }}>
                        {exam.academicYear || '—'}
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{
                          background: '#f1f5f9', color: '#374151',
                          borderRadius: 9999, padding: '2px 12px',
                          fontSize: '0.82rem', fontWeight: 600,
                        }}>
                          {totalStudents(exam)}
                        </span>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div className="books-actions">
                          <button
                            className="books-btn books-btn-sm books-btn-primary"
                            onClick={() => navigate(`/exam-marks?examId=${exam.examId}`)}
                          >
                            Marks
                          </button>
                          <button
                            className="books-btn books-btn-sm books-btn-ghost"
                            onClick={() => openEdit(exam)}
                          >
                            Edit
                          </button>
                          <button
                            className="books-btn books-btn-sm books-btn-danger"
                            onClick={() => handleDelete(exam)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="book-mob-list">
            {filtered.map((exam, i) => (
              <div key={exam.examId} className="book-mob-card">
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem',
                                     fontWeight: 700, color: '#1e3a5f' }}>
                        {exam.examId}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                        #{i + 1}
                      </span>
                    </div>
                    <span style={{
                      background: '#f1f5f9', color: '#374151',
                      borderRadius: 9999, padding: '2px 10px',
                      fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {totalStudents(exam)} students
                    </span>
                  </div>
                  {[
                    ['Subject',   exam.subject],
                    ['Acad. Year', exam.academicYear || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: 8,
                                              fontSize: 13, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: '#6b7280',
                                     minWidth: 80, flexShrink: 0 }}>
                        {label}
                      </span>
                      <span style={{ color: '#111827' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="books-btn books-btn-sm books-btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/exam-marks?examId=${exam.examId}`)}
                    >
                      Marks
                    </button>
                    <button
                      className="books-btn books-btn-sm books-btn-ghost"
                      style={{ flex: 1 }}
                      onClick={() => openEdit(exam)}
                    >
                      Edit
                    </button>
                    <button
                      className="books-btn books-btn-sm books-btn-danger"
                      style={{ flex: 1 }}
                      onClick={() => handleDelete(exam)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExamModal
        isOpen={modalOpen}
        mode={modalMode}
        exam={selExam}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
      />
    </div>
  );
}
