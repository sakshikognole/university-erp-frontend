import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents } from '../services/studentService';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import Pagination from '../components/Pagination';

// D4: default size 10 (was 5)
const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

export default function SelectStudent() {
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [pageData,    setPageData]    = useState(DEFAULT_PAGE);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  // D4: default size 10 (was 5)
  const [size,        setSize]        = useState(10);
  const [loading,     setLoading]     = useState(true);
  const [pageError,   setPageError]   = useState('');
  const [selected,    setSelected]    = useState(null);
  const [error,       setError]       = useState('');
  const timer = useRef(null);

  function loadStudents() {
    setLoading(true); setPageError('');
    getAllStudents()
      .then((data) => setAllStudents(Array.isArray(data) ? data : []))
      .catch((err) => setPageError(err.message || 'Failed to load students.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadStudents(); }, []);

  // Filter + paginate client-side
  useEffect(() => {
    let data = allStudents;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((s) =>
        s.studentName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q)   ||
        s.degreeProgramName?.toLowerCase().includes(q)
      );
    }

    const totalElements = data.length;
    const totalPages    = Math.max(1, Math.ceil(totalElements / size));
    // D5/D6: ensure safePage is within valid range so no blank rows
    const safePage      = Math.min(page, Math.max(0, totalPages - 1));
    const start         = safePage * size;
    const sliced        = data.slice(start, start + size);

    setStudents(sliced);
    setPageData({
      pageNumber: safePage, pageSize: size,
      totalElements, totalPages,
      first: safePage === 0,
      last:  safePage >= totalPages - 1,
    });
  }, [allStudents, search, page, size]);

  const onSearch = (e) => {
    clearTimeout(timer.current);
    const val = e.target.value;
    timer.current = setTimeout(() => {
      setSearch(val);
      setPage(0);       // reset to page 0 on search
      setSelected(null);
    }, 400);
  };

  // D6: reset to page 0 when size changes so serial numbers start from 1
  const onSizeChange = (s) => { setSize(s); setPage(0); setSelected(null); };
  const onPageChange = (p) => { setPage(p); };

  function handleContinue() {
    // D7: guard — only proceed if selected has a valid studentId
    if (!selected?.studentId) {
      setError('Please select a student to continue.');
      return;
    }
    navigate('/student-details', { state: { student: selected } });
  }

  // D7: only allow selecting rows that have valid student data
  const handleRowClick = (s) => {
    if (!s?.studentId) return;  // ignore blank/invalid rows
    setSelected(s);
    setError('');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Generate Certificate</h1>
      <p className="page-subtitle">
        Search and select a student, then click Continue.
      </p>

      {/* Observation: warm-up hint for Render cold start */}
      {loading && (
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)',
          marginBottom: 8, fontStyle: 'italic',
        }}>
          Loading students — this may take a moment if the server is waking up...
        </div>
      )}

      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      <div className="card">
        {/* Search + selected tag */}
        <div className="books-toolbar">
          <input
            className="books-search-input"
            placeholder="Search by name, ID or degree..."
            onChange={onSearch}
          />
          {selected && (
            <span className="stu-selected-tag">
              Selected: <strong>{selected.studentName}</strong> ({selected.studentId})
              <button onClick={() => setSelected(null)}>x</button>
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <PageLoader message="Loading students..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={loadStudents} />
        ) : (
          <>
            {/* ── Desktop table (hidden on mobile) ── */}
            <div className="book-desk-table">
              <div className="books-table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th style={{ width: 42 }}>#</th>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Year</th>
                      <th>Degree Program</th>
                      <th>Academic Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="books-empty">No students found.</div>
                        </td>
                      </tr>
                    ) : students.map((s, i) => (
                      // D7: only render rows with valid studentId
                      s?.studentId ? (
                        <tr
                          key={s.studentId}
                          onClick={() => handleRowClick(s)}
                          className={`stu-table-row ${selected?.studentId === s.studentId ? 'stu-row-selected' : ''}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* D6: serial number = page offset + row index + 1 */}
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {pageData.pageNumber * size + i + 1}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                            {s.studentId}
                          </td>
                          <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                          <td><span className="books-badge">{s.gender}</span></td>
                          <td style={{ fontSize: 13 }}>{s.studyingYear}</td>
                          <td style={{ fontSize: 13 }}>{s.degreeProgramName}</td>
                          <td style={{ fontSize: 13 }}>{s.academicYear}</td>
                        </tr>
                      ) : null
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* D1: Mobile cards (no horizontal scrolling) */}
            <div className="book-mob-list">
              {students.length === 0 ? (
                <p className="books-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                  No students found.
                </p>
              ) : students.map((s, i) => (
                s?.studentId ? (
                  <div
                    key={s.studentId}
                    className={`book-mob-card ${selected?.studentId === s.studentId ? 'stu-row-selected' : ''}`}
                    onClick={() => handleRowClick(s)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px',
                    }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: selected?.studentId === s.studentId ? '#2563eb' : '#f3f4f6',
                        color:      selected?.studentId === s.studentId ? '#fff'    : '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {pageData.pageNumber * size + i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap' }}>
                          {s.studentName}
                        </p>
                        <p style={{ margin: 0, fontSize: 12,
                                    color: 'var(--text-secondary)' }}>
                          {s.studentId} &nbsp;·&nbsp; {s.studyingYear}
                        </p>
                        <p style={{ margin: 0, fontSize: 12,
                                    color: 'var(--text-secondary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap' }}>
                          {s.degreeProgramName}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 11, color: 'var(--text-secondary)',
                        flexShrink: 0,
                      }}>
                        {s.gender} · {s.academicYear}
                      </span>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          </>
        )}

        <Pagination
          pageData={pageData}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
        />
      </div>

      {/* D7: Continue disabled unless a real student is selected */}
      <div className="stu-button-row" style={{ marginTop: 16 }}>
        <button
          className="stu-btn stu-btn-primary"
          onClick={handleContinue}
          disabled={!selected?.studentId}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
