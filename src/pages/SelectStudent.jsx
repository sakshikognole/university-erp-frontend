import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents } from '../services/studentService';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import Pagination from '../components/Pagination';

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 5, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

export default function SelectStudent() {
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [pageData,    setPageData]    = useState(DEFAULT_PAGE);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [size,        setSize]        = useState(5);
  const [loading,     setLoading]     = useState(true);
  const [pageError,   setPageError]   = useState('');
  const [selected,    setSelected]    = useState(null);
  const [error,       setError]       = useState('');
  const timer = useRef(null);

  function loadStudents() {
    setLoading(true); setPageError('');
    getAllStudents()
      .then((data) => setAllStudents(data))
      .catch((err) => setPageError(err.message || 'Failed to load students.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadStudents(); }, []);

  // Filter + paginate on the client side whenever search/page/size changes
  useEffect(() => {
    let data = allStudents;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((s) =>
        s.studentName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.degreeProgramName?.toLowerCase().includes(q)
      );
    }

    const totalElements = data.length;
    const totalPages    = Math.max(1, Math.ceil(totalElements / size));
    const safePage      = Math.min(page, totalPages - 1);
    const sliced        = data.slice(safePage * size, safePage * size + size);

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
    timer.current = setTimeout(() => { setSearch(val); setPage(0); setSelected(null); }, 400);
  };

  const onSizeChange = (s) => { setSize(s); setPage(0); };

  function handleContinue() {
    if (!selected) { setError('Please select a student to continue.'); return; }
    navigate('/student-details', { state: { student: selected } });
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Generate Certificate</h1>
      <p className="stu-page-sub">
        Search and select a student, then click Continue.
      </p>

      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      <div className="card">
        {/* Search */}
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

        {/* Table */}
        {loading ? (
          <PageLoader message="Loading students..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={loadStudents} />
        ) : (
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th>
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
                  <tr
                    key={s.studentId}
                    onClick={() => { setSelected(s); setError(''); }}
                    className={`stu-table-row ${selected?.studentId === s.studentId ? 'stu-row-selected' : ''}`}
                  >
                    <td>{pageData.pageNumber * size + i + 1}</td>
                    <td>{s.studentId}</td>
                    <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                    <td><span className="books-badge">{s.gender}</span></td>
                    <td>{s.studyingYear}</td>
                    <td>{s.degreeProgramName}</td>
                    <td>{s.academicYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          pageData={pageData}
          onPageChange={setPage}
          onSizeChange={onSizeChange}
        />
      </div>

      {/* Continue button */}
      <div className="stu-button-row" style={{ marginTop: 16 }}>
        <button
          className="stu-btn stu-btn-primary"
          onClick={handleContinue}
          disabled={!selected}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
