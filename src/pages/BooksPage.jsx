import React, { useState, useEffect, useCallback, useRef } from 'react';
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
            <span className="book-mob-value mono">{book.bookId || '—'}</span>
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
            <button className="books-btn books-btn-sm books-btn-ghost"  onClick={() => onView(book)}>View</button>
            <button className="books-btn books-btn-sm books-btn-warning" onClick={() => onEdit(book)}>Edit</button>
            <button className="books-btn books-btn-sm books-btn-danger"  onClick={() => onDel(book)}>Delete</button>
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
  const [dupError, setDupError] = useState('');  // shown inside BookModal
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selBook,   setSelBook]   = useState(null);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [viewBook,  setViewBook]  = useState(null);
  const [delOpen,   setDelOpen]   = useState(false);
  const [delBook,   setDelBook]   = useState(null);

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

  const openAdd  = ()  => { setSelBook(null); setModalMode('add');  setDupError(''); setModalOpen(true); };
  const openEdit = (b) => { setSelBook(b);    setModalMode('edit'); setDupError(''); setModalOpen(true); };
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
          setDupError(`Book "${form.bookTitle}" by ${form.authorName} already exists.`);
          setSaving(false);
          return;
        }
        // Also check bookId uniqueness on frontend before hitting API
        const idTaken = books.some(
          (b) => b.bookId && b.bookId.trim().toLowerCase() === form.bookId.trim().toLowerCase()
        );
        if (idTaken) {
          setDupError(`Book ID "${form.bookId}" is already in use. Please enter a different ID.`);
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
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="books-page-sub">Manage all library books</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Book
        </button>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={dismiss} />

      <div className="card">
        <div className="books-toolbar">
          <input
            className="books-search-input"
            placeholder="Search by title, author, or ID..."
            onChange={onSearch}
          />
        </div>

        {loading ? (
          // Defects #7 + #8: skeleton loader gives instant visual feedback
          // instead of blank screen while waiting for API response
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th><th>Book Title</th><th>Author</th>
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
                      <th>Book ID</th>
                      <th>#</th>
                      <th>Book Title</th>
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
                        <td><span style={{fontFamily:'monospace',fontSize:'0.78rem',color:'#6b7280'}}>{b.bookId || '—'}</span></td>
                        <td>{page * size + i + 1}</td>
                        <td>{b.bookTitle}</td>
                        <td>{b.authorName}</td>
                        <td>{b.totalCopies}</td>
                        <td>{b.bookLocation}</td>
                        <td>
                          <span className="books-badge">{b.department}</span>
                        </td>
                        <td>
                          <div className="books-actions">
                            <button className="books-btn books-btn-sm books-btn-ghost"   onClick={() => openView(b)} title="View">View</button>
                            <button className="books-btn books-btn-sm books-btn-warning" onClick={() => openEdit(b)} title="Edit">Edit</button>
                            <button className="books-btn books-btn-sm books-btn-danger"  onClick={() => openDel(b)}  title="Delete">Delete</button>
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
        onClose={() => { setModalOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
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
