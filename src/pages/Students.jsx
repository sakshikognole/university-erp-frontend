import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { exportStudents } from '../utils/exportUtils';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/students`, {
        headers: authHeader(),
      });

      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.warn('Backend unavailable:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportStudents(filteredStudents, format);
  };

  // Filter students by search query
  const filteredStudents = students.filter((s) => {
    const query = search.toLowerCase().trim();
    // Support both Node field names (name/class/degree) and
    // Spring Boot field names (studentName/studyingYear/degreeProgramName)
    const nameStr   = (s.name   || s.studentName        || '').toLowerCase();
    const prnStr    = (s.prn                             || '').toLowerCase();
    const classStr  = (s.class  || s.studyingYear        || '').toLowerCase();
    const degreeStr = (s.degree || s.degreeProgramName   || '').toLowerCase();
    return nameStr.includes(query) || prnStr.includes(query) || classStr.includes(query) || degreeStr.includes(query);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records and enrollment information</p>
        </div>

        <div className="header-actions-group">
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
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('csv')}
                >
                  <FileSpreadsheet size={15} />
                  <span>CSV Spreadsheet (.csv)</span>
                </button>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('txt')}
                >
                  <FileText size={15} />
                  <span>Text Document (.txt)</span>
                </button>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('pdf')}
                >
                  <Printer size={15} />
                  <span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/bulk-upload-students')}
            title="Bulk upload students via CSV"
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>

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

      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Name, PRN, Class, or Degree..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredStudents.length}</strong> {filteredStudents.length === 1 ? 'Student' : 'Students'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading students list...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="table-empty-state">
              <GraduationCap size={36} className="empty-icon" />
              <h3>No students found</h3>
              <p>
                {search
                  ? `No students matched "${search}".`
                  : 'Get started by adding your first student.'}
              </p>
              {!search && (
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
                    <th style={{ width: '80px' }}>#</th>
                    <th style={{ width: '180px' }}>PRN</th>
                    <th>Name</th>
                    <th style={{ width: '140px' }}>Class</th>
                    <th style={{ width: '100px' }}>Division</th>
                    <th>Degree</th>
                    <th style={{ width: '120px' }}>Year</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
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
                        <span className="dept-name-cell">{student.name || student.studentName}</span>
                      </td>
                      <td>{student.class || student.studyingYear}</td>
                      <td>{student.division || '—'}</td>
                      <td>{student.degree || student.degreeProgramName}</td>
                      <td>{student.yearOfEnrollment}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Student"
                            onClick={() => navigate(`/students/edit/${student._id || student.prn}`)}
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

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
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
                            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="pagination-dots">...</span>;
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
                    <span>Items per page:</span>
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
