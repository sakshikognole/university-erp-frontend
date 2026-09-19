import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Download,
  Search,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Edit,
  Filter,
  X,
} from 'lucide-react';
import { exportStudents } from '../utils/exportUtils';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const authHeader = () => {
  const token = localStorage.getItem('erp_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ---------------------------------------------------------------------------
// Students — list, search, filter, pagination
// ---------------------------------------------------------------------------
const Students = () => {
  const navigate = useNavigate();

  // ── Data ────────────────────────────────────────────────────────────────
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [feedback, _setFeedback]   = useState({ type: '', message: '' });

  // ── Search ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Filters ─────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    degree:           '',
    class:            '',
    yearOfEnrollment: '',
    division:         '',
  });
  // Derived unique values from the loaded dataset (for filter dropdowns)
  const [filterOptions, setFilterOptions] = useState({
    degrees:    [],
    classes:    [],
    years:      [],
    divisions:  [],
  });

  // ── Download dropdown ────────────────────────────────────────────────────
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ────────────────────────────────────────────────────────────────────────
  // Fetch all students once on mount.
  // We fetch the full list client-side so that filter dropdowns are always
  // populated and searching/filtering is instant without extra round-trips.
  // For very large datasets the backend also accepts query params for
  // server-side filtering (see studentController.getStudents).
  // ────────────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/students`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);

      // Build unique sorted option lists for filter dropdowns
      const unique = (arr) =>
        [...new Set(arr.filter(Boolean).map((v) => v.trim()))].sort();
      setFilterOptions({
        degrees:   unique(data.map((s) => s.degree)),
        classes:   unique(data.map((s) => s.class)),
        years:     unique(data.map((s) => s.yearOfEnrollment)),
        divisions: unique(data.map((s) => s.division)),
      });
    } catch (err) {
      console.warn('Backend unavailable:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single useEffect — only runs once on mount (fetchStudents is stable)
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Filter / search logic ────────────────────────────────────────────────
  const filteredStudents = students.filter((s) => {
    // Text search across name, PRN, class, degree
    const query = search.toLowerCase().trim();
    if (query) {
      const nameStr   = (s.name   || '').toLowerCase();
      const prnStr    = (s.prn    || '').toLowerCase();
      const classStr  = (s.class  || '').toLowerCase();
      const degreeStr = (s.degree || '').toLowerCase();
      const matches =
        nameStr.includes(query) ||
        prnStr.includes(query)  ||
        classStr.includes(query) ||
        degreeStr.includes(query);
      if (!matches) return false;
    }

    // Dropdown filters (exact match, case-insensitive)
    if (filters.degree && s.degree?.trim().toLowerCase() !== filters.degree.toLowerCase()) return false;
    if (filters.class  && s.class?.trim().toLowerCase()  !== filters.class.toLowerCase())  return false;
    if (filters.yearOfEnrollment && s.yearOfEnrollment?.trim() !== filters.yearOfEnrollment) return false;
    if (filters.division && s.division?.trim().toLowerCase() !== filters.division.toLowerCase()) return false;

    return true;
  });

  // Count active filters for the badge
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages  = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const endIndex    = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  // ── Filter handlers ──────────────────────────────────────────────────────
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ degree: '', class: '', yearOfEnrollment: '', division: '' });
  };

  const clearAll = () => {
    setSearch('');
    clearFilters();
  };

  // ── Download ─────────────────────────────────────────────────────────────
  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportStudents(filteredStudents, format);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Page header ── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records and enrollment information</p>
        </div>

        <div className="header-actions-group">
          {/* Download */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download students data"
            >
              <Download size={16} />
              <span>Download</span>
              <ChevronDown size={14} />
            </button>
            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('csv')}>
                  <FileSpreadsheet size={15} /><span>CSV Spreadsheet (.csv)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('txt')}>
                  <FileText size={15} /><span>Text Document (.txt)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('pdf')}>
                  <Printer size={15} /><span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* Bulk Upload */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/bulk-upload-students')}
            title="Bulk upload students via CSV"
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>

          {/* Add Student */}
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/add-student')}
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* ── Feedback banner ── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>

        {/* ── Search + filter bar ── */}
        <div className="table-controls-bar">
          {/* Search box */}
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Name, PRN, Class or Degree…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            className={`btn btn-secondary students-filter-btn${activeFilterCount > 0 ? ' filter-active' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
            title="Toggle filters"
          >
            <Filter size={15} />
            <span>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            <ChevronDown
              size={13}
              style={{
                transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Stats + clear-all */}
          <div className="students-bar-right">
            {(activeFilterCount > 0 || search) && (
              <button type="button" className="students-clear-all-btn" onClick={clearAll}>
                <X size={13} />
                <span>Clear all</span>
              </button>
            )}
            <div className="table-stats-badge">
              Total: <strong>{filteredStudents.length}</strong>{' '}
              {filteredStudents.length === 1 ? 'Student' : 'Students'}
            </div>
          </div>
        </div>

        {/* ── Filter panel (collapsible) ── */}
        {showFilters && (
          <div className="students-filter-panel">
            <div className="students-filter-grid">
              {/* Degree */}
              <div className="students-filter-group">
                <label className="students-filter-label" htmlFor="filter-degree">
                  Degree
                </label>
                <select
                  id="filter-degree"
                  className="students-filter-select"
                  value={filters.degree}
                  onChange={(e) => handleFilterChange('degree', e.target.value)}
                >
                  <option value="">All Degrees</option>
                  {filterOptions.degrees.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className="students-filter-group">
                <label className="students-filter-label" htmlFor="filter-class">
                  Class
                </label>
                <select
                  id="filter-class"
                  className="students-filter-select"
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                >
                  <option value="">All Classes</option>
                  {filterOptions.classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="students-filter-group">
                <label className="students-filter-label" htmlFor="filter-year">
                  Year of Enrollment
                </label>
                <select
                  id="filter-year"
                  className="students-filter-select"
                  value={filters.yearOfEnrollment}
                  onChange={(e) => handleFilterChange('yearOfEnrollment', e.target.value)}
                >
                  <option value="">All Years</option>
                  {filterOptions.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div className="students-filter-group">
                <label className="students-filter-label" htmlFor="filter-division">
                  Division
                </label>
                <select
                  id="filter-division"
                  className="students-filter-select"
                  value={filters.division}
                  onChange={(e) => handleFilterChange('division', e.target.value)}
                >
                  <option value="">All Divisions</option>
                  {filterOptions.divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div style={{ paddingTop: '0.25rem' }}>
                <button type="button" className="students-clear-filters-btn" onClick={clearFilters}>
                  <X size={13} />
                  <span>Clear filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Table ── */}
        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading students list…</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="table-empty-state">
              <GraduationCap size={36} className="empty-icon" />
              <h3>No students found</h3>
              <p>
                {search || activeFilterCount > 0
                  ? 'No students matched the current search or filters.'
                  : 'Get started by adding your first student.'}
              </p>
              {search || activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="books-btn books-btn-ghost"
                  style={{ marginTop: '1rem' }}
                  onClick={clearAll}
                >
                  Clear search &amp; filters
                </button>
              ) : (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/add-student')}
                >
                  <Plus size={16} />
                  <span>Add Student</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '52px' }}>#</th>
                    <th style={{ width: '160px' }}>PRN</th>
                    <th>Name</th>
                    <th style={{ width: '130px' }}>Class</th>
                    <th style={{ width: '90px' }}>Division</th>
                    <th>Degree</th>
                    <th style={{ width: '80px' }}>Year</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map((student, index) => (
                    <tr key={student._id || student.prn || index}>
                      <td className="text-secondary">{startIndex + index + 1}</td>
                      <td>
                        <span className="code-badge">{student.prn}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{student.name}</span>
                      </td>
                      <td>{student.class}</td>
                      <td>{student.division || '—'}</td>
                      <td>{student.degree}</td>
                      <td>{student.yearOfEnrollment}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="action-buttons-cell"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Student"
                            onClick={() =>
                              navigate(`/students/edit/${student._id || student.prn}`)
                            }
                          >
                            <Edit size={15} />
                            <span className="action-label">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredStudents.length)} of{' '}
                    {filteredStudents.length} students
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-btn${pageNum === currentPage ? ' active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="pagination-dots">
                            …
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="items-per-page">
                    <span>Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="items-per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
