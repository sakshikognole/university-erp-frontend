import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const [delExam,   setDelExam]   = useState(null);
  const [deleting,  setDeleting]  = useState(false);
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

  const handleDelete = (exam) => {
    setDelExam(exam);
  };

  const confirmDelete = async () => {
    if (!delExam) return;
    setDeleting(true);
    try {
      await springApi.delete(`/exams/${delExam.examId}`);
      setSuccess('Exam deleted.');
      setDelExam(null);
      load(true);
    } catch {
      setError('Failed to delete exam.');
    } finally {
      setDeleting(false);
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

      {/* Header consistent with Students, Staff, and Departments */}
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Exam Management</h1>
          <p className="page-subtitle">
            Manage exams and student marks
          </p>
        </div>
        <div className="feature-page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            <span>Add Exam</span>
          </button>
        </div>
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
        <div className="card table-card" style={{ padding: '1rem', marginTop: '1.25rem' }}>
          {/* Search + count INSIDE the card */}
          <div className="table-controls-bar">
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                className="search-input"
                placeholder="Search by Exam ID, Subject, or Year..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
            <div
              className="table-stats-badge"
              style={{ width: 'fit-content', alignSelf: 'flex-end', marginLeft: 'auto' }}
            >
              Total: <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'Exam' : 'Exams'}
            </div>
          </div>

          {/* Desktop table */}
          <div className="book-desk-table">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '52px' }}>#</th>
                    <th style={{ width: '160px' }}>Exam ID</th>
                    <th>Subject</th>
                    <th style={{ width: '150px' }}>Academic Year</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam, i) => (
                    <tr key={exam.examId}>
                      <td className="text-secondary">{i + 1}</td>
                      <td>
                        <span className="code-badge">{exam.examId}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{exam.subject}</span>
                      </td>
                      <td className="text-secondary">
                        {exam.academicYear || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-badge status-active">
                          {totalStudents(exam)}
                        </span>
                      </td>
                      <td>
                        <div className="books-actions">
                          <button
                            type="button"
                            className="action-btn view-btn"
                            title="View Marks"
                            onClick={() => navigate(`/exam-marks?examId=${exam.examId}`)}
                          >
                            <Eye size={14} /><span className="action-label">Marks</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Exam"
                            onClick={() => openEdit(exam)}
                          >
                            <Edit size={14} /><span className="action-label">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Delete Exam"
                            onClick={() => handleDelete(exam)}
                          >
                            <Trash2 size={14} /><span className="action-label">Delete</span>
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
              <div key={exam.examId} className="mob-card" style={{ marginBottom: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mob-card-num" style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>#{i + 1}</span>
                    <span className="code-badge">{exam.examId}</span>
                  </div>
                  <span className="status-badge status-active" style={{ fontSize: '0.75rem' }}>
                    {totalStudents(exam)} students
                  </span>
                </div>
                <div className="mob-card-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                  <span className="mob-card-label">Subject</span>
                  <span className="mob-card-value" style={{ fontWeight: 600, color: '#111827' }}>{exam.subject}</span>
                </div>
                <div className="mob-card-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 10 }}>
                  <span className="mob-card-label">Academic Year</span>
                  <span className="mob-card-value text-secondary">{exam.academicYear || '—'}</span>
                </div>
                <div className="mob-card-actions">
                  <button
                    type="button"
                    className="action-btn view-btn"
                    onClick={() => navigate(`/exam-marks?examId=${exam.examId}`)}
                  >
                    <Eye size={15} /><span className="action-label">Marks</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn edit-btn"
                    onClick={() => openEdit(exam)}
                  >
                    <Edit size={15} /><span className="action-label">Edit</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(exam)}
                  >
                    <Trash2 size={15} /><span className="action-label">Delete</span>
                  </button>
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

      <ConfirmDialog
        isOpen={!!delExam}
        title="Delete Exam"
        description={`Are you sure you want to delete exam "${delExam?.examId} — ${delExam?.subject}"? This action will permanently remove the record.`}
        itemName={delExam?.subject}
        itemSubtext={delExam?.academicYear ? `Academic Year: ${delExam.academicYear}` : 'Exam Schedule'}
        itemBadge={delExam?.examId}
        onConfirm={confirmDelete}
        onCancel={() => setDelExam(null)}
        loading={deleting}
      />
    </div>
  );
}
