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
      setExams(Array.isArray(res) ? res : (res.data ?? res ?? []));
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
        clearTimeout(slowTimer);
        setError('');
        setSuccess('Exam added successfully.');
      } else {
        await springApi.put(`/exams/${selExam.examId}`, form);
        clearTimeout(slowTimer);
        setError('');
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

  // Total students = unique students across all sections (use T1 as base if available, else max)
  const totalStudents = (exam) => {
    const t1  = (exam.t1Marks  ?? []).length;
    const t2  = (exam.t2Marks  ?? []).length;
    const see = (exam.seeMarks ?? []).length;
    return Math.max(t1, t2, see);
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Exam Management</h1>
          <p className="stu-page-sub">Manage exams and student marks</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
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

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="books-form-control"
          style={{ maxWidth: 360 }}
          placeholder="Search by Exam ID, subject, or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            {search
              ? 'No exams matched your search.'
              : 'No exams added yet. Click "+ Add Exam" to get started.'}
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
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
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
                    <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem',
                        fontWeight: 700, color: '#1e3a5f' }}>
                        {exam.examId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{exam.subject}</td>
                    <td style={{ color: '#6b7280' }}>{exam.academicYear || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: '#f1f5f9', color: '#374151',
                        borderRadius: 9999, padding: '2px 12px',
                        fontSize: '0.82rem', fontWeight: 600,
                      }}>
                        {totalStudents(exam)}
                      </span>
                    </td>
                    <td>
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
