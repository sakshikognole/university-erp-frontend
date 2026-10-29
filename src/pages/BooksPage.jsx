import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import bookService from '../services/bookService';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import BookModal from './BookModal';
import ViewBookModal from './ViewBookModal';
import Pagination from '../components/Pagination';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

// ── Mobile accordion card — shown only on small screens via CSS ──────────────
function BookMobileCard({ book, index, page, size, isExpanded, onToggle, onView, onEdit, onDel }) {
  return (
    <div className="book-mob-card">
      {/* Tap header to expand/collapse */}
      <button
        type="button"
        className="book-mob-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="book-mob-summary">
          <span className="book-mob-num">{page * size + index + 1}</span>
          <div className="book-mob-title-wrap">
            <span className="book-mob-title">{book.bookTitle}</span>
            <span className="book-mob-author">{book.authorName}</span>
          </div>
        </div>
        <span className="book-mob-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="book-mob-details">
          <div className="book-mob-row">
            <span className="book-mob-label">Book ID</span>
            <span className="code-badge">{book.bookId || '—'}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Total Copies</span>
            <span className="book-mob-value">{book.totalCopies}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Location</span>
            <span className="book-mob-value">{book.bookLocation}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Department</span>
            <span className="book-mob-value">
              <span className="books-badge">{book.department}</span>
            </span>
          </div>
          <div className="book-mob-actions">
            <button className="books-btn books-btn-sm books-btn-ghost"  onClick={() => onView(book)}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View</span></button>
            <button className="books-btn books-btn-sm books-btn-warning" onClick={() => onEdit(book)}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</span></button>
            <button className="books-btn books-btn-sm books-btn-danger"  onClick={() => onDel(book)}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BooksPage() {
  const [books,    setBooks]    = useState([]);
  const [pageData, setPageData] = useState(DEFAULT_PAGE);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const [size,     setSize]     = useState(10);
  const [loading,  setLoading]  = useState(true);
  const [pageError,setPageError]= useState('');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selBook,   setSelBook]   = useState(null);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [viewBook,  setViewBook]  = useState(null);
  const [delOpen,   setDelOpen]   = useState(false);
  const [delBook,   setDelBook]   = useState(null);
  const [duplicateIdError, setDuplicateIdError] = useState(''); // For showing duplicate ID error in modal

  const [alert, setAlert] = useState({ type: '', message: '' });
  const notify  = (type, message) => setAlert({ type, message });
  const dismiss = () => setAlert({ type: '', message: '' });

  // Mobile accordion — only one book expanded at a time
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const timer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      // BookController returns ApiResponse<PageResponse<Book>>:
      // { success, message, data: { content:[], pageNumber, ... } }
      // springApi interceptor unwraps axios res.data → res = { success, message, data:{...} }
      // So the PageResponse is at res.data
      const res = await bookService.getAll(search, page, size);
      const pd  = res?.data ?? res;   // handle both wrapped and unwrapped shapes
      setBooks(pd?.content ?? []);
      setPageData({
        pageNumber:    pd?.pageNumber    ?? 0,
        pageSize:      pd?.pageSize      ?? size,
        totalElements: pd?.totalElements ?? 0,
        totalPages:    pd?.totalPages    ?? 0,
        first: pd?.first ?? true,
        last:  pd?.last  ?? true,
      });
    } catch (e) {
      setPageError(e.message || 'Failed to load books.');
    } finally {
      setLoading(false);
    }
  }, [search, page, size]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (e) => {
    const val = e.target.value;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSearch(val); setPage(0); }, 400);
  };

  const onSizeChange = (s) => { setSize(s); setPage(0); };

  const openAdd  = ()  => { setSelBook(null); setModalMode('add'); setDuplicateIdError(''); setModalOpen(true); };
  const openEdit = (b) => { setSelBook(b);    setModalMode('edit'); setDuplicateIdError(''); setModalOpen(true); };
  const openView = (b) => { setViewBook(b);   setViewOpen(true); };
  const openDel  = (b) => { setDelBook(b);    setDelOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        // Duplicate check: search the full database by title before saving.
        // bookService.getAll returns ApiResponse: { success, message, data: { content:[...] } }
        const searchRes = await bookService.getAll(form.bookTitle.trim(), 0, 100);
        const allMatching = searchRes?.data?.content
          ?? searchRes?.content
          ?? [];
        const isDuplicate = allMatching.some(
          (b) =>
            b.bookTitle.trim().toLowerCase() === form.bookTitle.trim().toLowerCase() &&
            b.authorName.trim().toLowerCase() === form.authorName.trim().toLowerCase()
        );
        if (isDuplicate) {
          notify('error', `Book "${form.bookTitle}" by ${form.authorName} already exists.`);
          setSaving(false);
          return;
        }
        // Defect #3: Check bookId uniqueness and show error in modal below Book ID field
        const idTaken = books.some(
          (b) => b.bookId && b.bookId.trim().toLowerCase() === form.bookId.trim().toLowerCase()
        );
        if (idTaken) {
          setDuplicateIdError('Book ID already exists');
          setSaving(false);
          return;
        }
        await bookService.create(form);
        notify('success', 'Book added successfully');
      } else {
        await bookService.update(selBook.id, form);
        notify('success', 'Book updated successfully');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      notify('error', e.message || 'Failed to save book.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await bookService.delete(delBook.id);
      notify('success', 'Book deleted successfully');
      setDelOpen(false);
      if (books.length === 1 && page > 0) setPage(p => p - 1);
      else load();
    } catch (e) {
      notify('error', e.message);
      setDelOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle">Manage all library books</p>
        </div>
        <div className="feature-page-header-actions">
          <button className="books-btn books-btn-primary" onClick={openAdd}>
            + Add Book
          </button>
        </div>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={dismiss} />

      <div className="card">
        <div className="books-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by Title, Author, or ID..."
              onChange={onSearch}
            />
          </div>
          <div className="table-stats-badge" style={{ marginLeft: 'auto' }}>
            Total: <strong>{pageData.totalElements ?? books.length}</strong>{' '}
            {(pageData.totalElements ?? books.length) === 1 ? 'Book' : 'Books'}
          </div>
        </div>

        {loading ? (
          // Defects #7 + #8: skeleton loader gives instant visual feedback
          // instead of blank screen while waiting for API response
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th><th>Book id</th><th>Book title</th><th>Author</th>
                  <th>Copies</th><th>Location</th><th>Department</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: size }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div style={{
                          height: 14,
                          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                          backgroundSize: '200% 100%',
                          borderRadius: 4,
                          animation: 'books-shimmer 1.4s infinite',
                          width: j === 1 ? '80%' : j === 6 ? '60%' : '50%',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : pageError ? (
          <PageError message={pageError} onRetry={load} />
        ) : (
          <>
            {/* ── Mobile view — accordion cards (hidden on tablet/desktop) ── */}
            <div className="book-mob-list">
              {books.length === 0 ? (
                <p className="books-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                  No books found.
                </p>
              ) : books.map((b, i) => (
                <BookMobileCard
                  key={b.id}
                  book={b}
                  index={i}
                  page={page}
                  size={size}
                  isExpanded={expandedId === b.id}
                  onToggle={() => toggleExpand(b.id)}
                  onView={openView}
                  onEdit={openEdit}
                  onDel={openDel}
                />
              ))}
            </div>

            {/* ── Desktop/tablet view — full table (hidden on mobile) ── */}
            <div className="book-desk-table">
              <div className="books-table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Book id</th>
                      <th>Book title</th>
                      <th>Author</th>
                      <th>Copies</th>
                      <th>Location</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="books-empty">No books found.</div>
                        </td>
                      </tr>
                    ) : books.map((b, i) => (
                      <tr key={b.id}>
                        <td>{page * size + i + 1}</td>
                        <td><span className="code-badge">{b.bookId || '—'}</span></td>
                        <td>{b.bookTitle}</td>
                        <td>{b.authorName}</td>
                        <td>{b.totalCopies}</td>
                        <td>{b.bookLocation}</td>
                        <td>
                          <span className="books-badge">{b.department}</span>
                        </td>
                        <td>
                          <div className="books-actions">
                            <button className="books-btn books-btn-sm books-btn-ghost"   onClick={() => openView(b)} title="View"><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View</span></button>
                            <button className="books-btn books-btn-sm books-btn-warning" onClick={() => openEdit(b)} title="Edit"><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</span></button>
                            <button className="books-btn books-btn-sm books-btn-danger"  onClick={() => openDel(b)}  title="Delete"><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <Pagination
          pageData={pageData}
          onPageChange={setPage}
          onSizeChange={onSizeChange}
        />
      </div>

      <BookModal
        isOpen={modalOpen}
        mode={modalMode}
        book={selBook}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        loading={saving}
        duplicateIdError={duplicateIdError}
        onDuplicateIdErrorClear={() => setDuplicateIdError('')}
      />
      <ViewBookModal
        isOpen={viewOpen}
        book={viewBook}
        onClose={() => setViewOpen(false)}
      />
      <ConfirmDialog
        isOpen={delOpen}
        message={`Delete "${delBook?.bookTitle}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDelOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
