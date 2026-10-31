import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';

const _IS_PROD_PM = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const _SPRING_URL_PM = _IS_PROD_PM ? 'https://university-erp-spring.onrender.com' : 'http://localhost:9090';
const SPRING_API = `${_SPRING_URL_PM}/api`;

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

// ── Add Payment Modal ─────────────────────────────────────────────────────
// ── Add Payment Modal ─────────────────────────────────────────────────────
function AddPaymentModal({ isOpen, onClose, onSaved }) {
  const [form,   setForm]   = useState({ title: '', academicYear: '', amount: '', discount: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({ title: '', academicYear: '', amount: '', discount: '' });
      setErrors({});
      setApiErr('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleYearSelect = (e) => {
    const yr = e.target.value;
    setForm((f) => {
      let currentTitle = f.title;
      // Strip any previously appended academic year to avoid stacking
      const knownYears = ['First Year', 'Second Year', 'Third Year', 'Final Year', 'All Years'];
      for (const y of knownYears) {
        currentTitle = currentTitle.replace(new RegExp(`\\s*[–—\\-]\\s*${y}`, 'i'), '').trim();
      }
      if (yr && yr !== 'All Years' && currentTitle) {
        currentTitle = `${currentTitle} – ${yr}`;
      }
      return { ...f, academicYear: yr, title: currentTitle };
    });
    setErrors((er) => ({ ...er, title: '' }));
  };

  const validate = () => {
    const e = {};
    const trimmedTitle = (form.title || '').trim();

    // ── Payment Title Validation (Defect 2) ──
    if (!trimmedTitle) {
      e.title = 'Payment title is required.';
    } else if (/^-?\d+(\.\d+)?$/.test(trimmedTitle)) {
      e.title = 'Title cannot be only numbers. Please enter a valid fee name (e.g. Exam Fee – First Year).';
    } else if (!/[a-zA-Z]/.test(trimmedTitle)) {
      e.title = 'Title must contain letters. Numbers or special characters alone are not allowed.';
    } else if (!/^[a-zA-Z0-9\s\-–—()&/.,]+$/.test(trimmedTitle)) {
      e.title = 'Title contains invalid special characters (e.g. @#$%^*). Only letters, numbers, spaces, and hyphens are allowed.';
    } else if (trimmedTitle.length < 3) {
      e.title = 'Payment title must be at least 3 characters long.';
    }

    // ── Amount Validation ──
    const numAmt = Number(form.amount);
    if (!form.amount || isNaN(numAmt) || numAmt <= 0) {
      e.amount = 'Valid amount greater than 0 is required.';
    }

    // ── Discount Amount Validation (Defect 3) ──
    if (form.discount !== '' && form.discount !== null && form.discount !== undefined) {
      const numDisc = Number(form.discount);
      if (isNaN(numDisc) || numDisc < 0) {
        e.discount = 'Discount amount must be 0 or greater.';
      } else if (numAmt > 0 && numDisc > numAmt) {
        e.discount = `Discount amount (₹${numDisc.toLocaleString('en-IN')}) cannot exceed the original amount (₹${numAmt.toLocaleString('en-IN')}).`;
      }
    }

    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    let finalTitle = form.title.trim();
    if (form.academicYear && form.academicYear !== 'All Years' && !finalTitle.toLowerCase().includes(form.academicYear.toLowerCase())) {
      finalTitle = `${finalTitle} – ${form.academicYear}`;
    }

    setSaving(true);
    setApiErr('');
    try {
      await axios.post(`${SPRING_API}/payment-titles`, {
        title:    finalTitle,
        amount:   Number(form.amount),
        discount: Number(form.discount || 0),
      });
      onSaved();
      onClose();
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to add payment title.');
    } finally {
      setSaving(false);
    }
  };

  const numAmt  = Number(form.amount || 0);
  const numDisc = Number(form.discount || 0);
  const isDiscInvalid = numAmt > 0 && numDisc > numAmt;

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 460 }}>
        <div className="books-modal-head">
          <h3>Add Payment Title</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={submit}>
          <div className="books-modal-body">
            {apiErr && (
              <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
                <span>{apiErr}</span>
              </div>
            )}

            {/* Applicable Student Year Selector (Defect 6) */}
            <div className="books-form-group">
              <label className="books-form-label">
                Applicable Student Year <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
              </label>
              <select
                className="books-form-control"
                name="academicYear"
                value={form.academicYear}
                onChange={handleYearSelect}
              >
                <option value="">— Select Applicable Student Year —</option>
                <option value="First Year">First Year (e.g. Exam Fee – First Year)</option>
                <option value="Second Year">Second Year (e.g. Exam Fee – Second Year)</option>
                <option value="Third Year">Third Year (e.g. Exam Fee – Third Year)</option>
                <option value="Final Year">Final Year (e.g. Exam Fee – Final Year)</option>
                <option value="All Years">All Years / General</option>
              </select>
            </div>

            {/* Title field (Defect 2) */}
            <div className="books-form-group">
              <label className="books-form-label">Payment Title *</label>
              <input
                className={`books-form-control ${errors.title ? 'err' : ''}`}
                name="title"
                value={form.title}
                onChange={change}
                placeholder="e.g. Exam Fee – First Year"
              />
              {errors.title ? (
                <p className="books-form-err">{errors.title}</p>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Must contain letters (e.g. Exam Fee, Library Fee). Special characters like @#$% are rejected.
                </p>
              )}
            </div>

            <div className="club-form-row">
              {/* Amount field */}
              <div className="books-form-group">
                <label className="books-form-label">Amount (₹) *</label>
                <input
                  className={`books-form-control ${errors.amount ? 'err' : ''}`}
                  name="amount"
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={change}
                  placeholder="e.g. 2000"
                />
                {errors.amount && <p className="books-form-err">{errors.amount}</p>}
              </div>

              {/* Discount field (Defect 3) */}
              <div className="books-form-group">
                <label className="books-form-label">Discount (₹)</label>
                <input
                  className={`books-form-control ${errors.discount ? 'err' : ''}`}
                  name="discount"
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={change}
                  placeholder="e.g. 100"
                />
                {errors.discount && <p className="books-form-err">{errors.discount}</p>}
              </div>
            </div>

            {/* Net calculation preview */}
            {form.amount && !isNaN(numAmt) && numAmt > 0 && (
              <div style={{
                marginTop: 6,
                padding: '8px 12px',
                borderRadius: 6,
                background: isDiscInvalid ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${isDiscInvalid ? '#fecaca' : '#bbf7d0'}`,
              }}>
                {isDiscInvalid ? (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>
                    ⚠️ Invalid: Discount amount cannot exceed original amount of ₹{numAmt.toLocaleString('en-IN')}.
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    Final Net Payable:{' '}
                    <strong style={{ color: '#16a34a' }}>
                      ₹{Math.max(0, numAmt - numDisc).toLocaleString('en-IN')}
                    </strong>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
                    onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary"
                    disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PaymentPage — Admin payment title + combination management
// Accessible at /payment-management (Super Admin only)
// ══════════════════════════════════════════════════════════════════════════
// Mobile accordion card for Payment Titles
function PayMobCard({ t, fmt, showCheckboxes, isSelected, onToggle, expanded, onCardToggle, getAcademicYear }) {
  const yr = getAcademicYear ? getAcademicYear(t.title) : null;
  const netPayable = Math.max(0, t.amount - t.discount);
  return (
    <div className="mob-card" style={{ border: isSelected ? '2px solid #2563eb' : undefined }}>
      <button type="button" className="mob-card-header" onClick={onCardToggle} aria-expanded={expanded}>
        <div className="mob-card-summary">
          {showCheckboxes && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              onClick={e => e.stopPropagation()}
              style={{ flexShrink: 0 }}
            />
          )}
          <div className="mob-card-title-wrap" style={{ marginLeft: showCheckboxes ? 6 : 0 }}>
            <span className="mob-card-title">{t.title}</span>
            <span className="mob-card-sub">{t.titleId} {yr ? `• ${yr}` : ''}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row"><span className="mob-card-label">Title ID</span><span className="mob-card-value mono">{t.titleId}</span></div>
          {yr && <div className="mob-card-row"><span className="mob-card-label">Academic year</span><span className="mob-card-value">{yr}</span></div>}
          <div className="mob-card-row"><span className="mob-card-label">Amount</span><span className="mob-card-value">{fmt(t.amount)}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Discount</span><span className="mob-card-value" style={{ color: '#047857' }}>{t.discount > 0 ? `- ${fmt(t.discount)}` : '₹0'}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Net payable</span><span className="mob-card-value" style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(netPayable)}</span></div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {

  // ── Titles (paginated) ────────────────────────────────────────────────
  const [titles,        setTitles]        = useState([]);
  const [pageData,      setPageData]      = useState(DEFAULT_PAGE);
  const [page,          setPage]          = useState(0);
  const [size,          setSize]          = useState(10);
  const [titlesLoading, setTitlesLoading] = useState(true);
  const [payExpanded,   setPayExpanded]   = useState(null);

  // ── Modal ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);

  // ── Checkbox selection & Combination Flow ────────────────────────────
  const [selected, setSelected] = useState(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  // ── Combinations ──────────────────────────────────────────────────────
  const [combinations, setCombinations] = useState([]);
  const [creating,     setCreating]     = useState(false);
  const [viewCombo,    setViewCombo]    = useState(null);
  const [allTitles,    setAllTitles]    = useState([]);

  // ── Feedback ──────────────────────────────────────────────────────────
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load titles (paginated) ───────────────────────────────────────────
  const loadTitles = useCallback(async () => {
    setTitlesLoading(true);
    try {
      const res = await axios.get(`${SPRING_API}/payment-titles`, {
        params: { page, size },
      });
      const pd = res.data;
      setTitles(pd.content);
      setPageData({
        pageNumber:    pd.number       ?? pd.pageNumber    ?? 0,
        pageSize:      pd.size         ?? pd.pageSize      ?? size,
        totalElements: pd.totalElements,
        totalPages:    pd.totalPages,
        first:         pd.first,
        last:          pd.last,
      });
    } catch {
      setError('Failed to load payment titles.');
    } finally {
      setTitlesLoading(false);
    }
  }, [page, size]);

  // ── Load combinations ─────────────────────────────────────────────────
  const loadCombinations = useCallback(async () => {
    try {
      const res = await axios.get(`${SPRING_API}/payment-combinations`);
      setCombinations(res.data);
    } catch { /* silently ignore */ }
  }, []);

  // ── Load all titles flat (for breakdown card lookup) ──────────────────
  const loadAllTitles = useCallback(async () => {
    try {
      const res = await axios.get(`${SPRING_API}/payment-titles`, {
        params: { page: 0, size: 1000 },
      });
      setAllTitles(res.data.content ?? []);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadTitles(); },       [loadTitles]);
  useEffect(() => { loadCombinations(); }, [loadCombinations]);
  useEffect(() => { loadAllTitles(); },    [loadAllTitles]);

  // ── Page / size change ────────────────────────────────────────────────
  const onPageChange = (p) => { setPage(p); setSelected(new Set()); };
  const onSizeChange = (s) => { setSize(s); setPage(0); setSelected(new Set()); };

  // ── Helper: Identify Fee Category (Defect 7) ─────────────────────────
  const getFeeCategory = (title) => {
    if (!title) return '';
    let base = title.split(/[–—\-]/)[0].trim().toLowerCase();
    base = base.replace(/\s*\((first|second|third|final|1st|2nd|3rd|4th|all)\s*years?\)/i, '').trim();
    return base;
  };

  // ── Helper: Identify Academic Year (Defect 6) ─────────────────────────
  const getAcademicYear = (title) => {
    if (!title) return null;
    const lower = title.toLowerCase();
    if (lower.includes('first year') || lower.includes('1st year')) return 'First Year';
    if (lower.includes('second year') || lower.includes('2nd year')) return 'Second Year';
    if (lower.includes('third year') || lower.includes('3rd year')) return 'Third Year';
    if (lower.includes('final year') || lower.includes('4th year') || lower.includes('last year')) return 'Final Year';
    if (lower.includes('all year')) return 'All Years';
    return null;
  };

  // ── Checkbox handlers with Duplicate Prevention (Defect 7) ────────────
  const toggleOneWithValidation = (titleId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(titleId)) {
        next.delete(titleId);
        setConflictWarning('');
        return next;
      }

      const targetTitle = allTitles.find((t) => t.titleId === titleId) || titles.find((t) => t.titleId === titleId);
      if (targetTitle) {
        const targetCategory = getFeeCategory(targetTitle.title);
        // Check for duplicate category among already selected fees
        for (const selId of next) {
          const selTitle = allTitles.find((t) => t.titleId === selId) || titles.find((t) => t.titleId === selId);
          if (selTitle && getFeeCategory(selTitle.title) === targetCategory) {
            setConflictWarning(
              `Duplicate category not allowed: "${selTitle.title}" is already selected. A combination cannot contain multiple fees of category "${targetCategory.toUpperCase()}".`
            );
            return prev;
          }
        }
      }
      setConflictWarning('');
      next.add(titleId);
      return next;
    });
  };

  const isAllOnPageSelected =
    titles.length > 0 && titles.every((t) => selected.has(t.titleId));

  const toggleAll = () => {
    if (isAllOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        titles.forEach((t) => next.delete(t.titleId));
        setConflictWarning('');
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        let duplicateSkipped = false;
        for (const t of titles) {
          const cat = getFeeCategory(t.title);
          let conflict = false;
          for (const selId of next) {
            const existing = allTitles.find((x) => x.titleId === selId) || titles.find((x) => x.titleId === selId);
            if (existing && existing.titleId !== t.titleId && getFeeCategory(existing.title) === cat) {
              conflict = true;
              duplicateSkipped = true;
              break;
            }
          }
          if (!conflict) {
            next.add(t.titleId);
          }
        }
        if (duplicateSkipped) {
          setConflictWarning('Some duplicate or similar category fees on this page were skipped to prevent conflicting fee selection.');
        } else {
          setConflictWarning('');
        }
        return next;
      });
    }
  };

  // ── Create combination with validation (Defect 7) ─────────────────────
  const handleCreate = async () => {
    if (selected.size === 0) {
      setError('Please select at least 2 fee titles to create a combination.');
      return;
    }
    if (selected.size < 2) {
      setError('A payment combination requires at least 2 payment titles (e.g. Tuition Fee + Exam Fee).');
      return;
    }

    // Verify no duplicate categories exist
    const categoriesSeen = new Map();
    for (const selId of selected) {
      const t = allTitles.find((x) => x.titleId === selId) || titles.find((x) => x.titleId === selId);
      if (t) {
        const cat = getFeeCategory(t.title);
        if (categoriesSeen.has(cat)) {
          setError(`Cannot combine multiple fees of similar category "${cat}": "${categoriesSeen.get(cat)}" and "${t.title}".`);
          return;
        }
        categoriesSeen.set(cat, t.title);
      }
    }

    setCreating(true);
    setSuccess('');
    setError('');
    try {
      await axios.post(`${SPRING_API}/payment-combinations`, {
        titleIds: Array.from(selected),
      });
      setSuccess('Payment combination created successfully.');
      setSelected(new Set());
      setShowCheckboxes(false);
      setConflictWarning('');
      loadCombinations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment combination.');
    } finally {
      setCreating(false);
    }
  };

  const fmt = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header — Defect 4: Create Combination button beside Add Payment Title button */}
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Payment Management</h1>
          <p className="stu-page-sub">
            Manage fee titles and create payment combinations for students
          </p>
        </div>
        <div className="feature-page-header-actions">
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => {
              if (showCheckboxes) {
                setShowCheckboxes(false);
                setSelected(new Set());
                setConflictWarning('');
              } else {
                setShowCheckboxes(true);
                setConflictWarning('');
              }
            }}
            id="btn-create-payment-combination"
          >
            <span className="desk-only-text">
              {showCheckboxes ? 'Cancel Combination Mode' : 'Create Payment Combination'}
            </span>
            <span className="mob-only-text">
              {showCheckboxes ? 'Cancel combination' : 'Create combination'}
            </span>
          </button>
          <button
            className="books-btn books-btn-primary"
            onClick={() => setModalOpen(true)}
            id="btn-add-payment-title"
          >
            <span className="desk-only-text">+ Add Payment Title</span>
            <span className="mob-only-text">+ Add Payment</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Defect 5: Payment Combination Selection Flow Guidance */}
      {showCheckboxes && (
        <div
          style={{
            marginTop: '1rem',
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid #3b82f6',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Payment Combination Selection Flow
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select 2 or more different fee titles using the checkboxes below to bundle them together for students.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: selected.size >= 2 ? '#dcfce7' : '#e0f2fe',
                  color: selected.size >= 2 ? '#15803d' : '#0369a1',
                }}
              >
                {selected.size} fee{selected.size === 1 ? '' : 's'} selected
              </span>
              <button
                type="button"
                className="books-btn books-btn-ghost books-btn-sm"
                onClick={() => {
                  setShowCheckboxes(false);
                  setSelected(new Set());
                  setConflictWarning('');
                }}
              >
                Exit Selection
              </button>
            </div>
          </div>

          {/* Duplicate Conflict Warning (Defect 7) */}
          {conflictWarning && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 6,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{conflictWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Payment Titles Table (Defect 1: Alignment, Defect 4: Header 'Select', Defect 6: Academic Year) ── */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        {titlesLoading ? (
          <p className="books-loading">Loading payment titles...</p>
        ) : (
          <>
            <div className="pay-desk-table">
              <div className="books-table-wrap">
                <table className="books-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      {showCheckboxes && (
                        <th style={{ width: 85, textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              cursor: 'pointer',
                              userSelect: 'none',
                            }}
                            onClick={toggleAll}
                          >
                            <span style={{ fontWeight: 600 }}>Select</span>
                            <input
                              type="checkbox"
                              className="pay-checkbox"
                              checked={isAllOnPageSelected}
                              onChange={toggleAll}
                              title="Select all on this page"
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </th>
                      )}
                      <th style={{ width: 110, textAlign: 'center' }}>Title ID</th>
                      <th style={{ textAlign: 'left' }}>Payment Title</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Discount</th>
                      <th style={{ width: 140, textAlign: 'right' }}>Net Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titles.length === 0 ? (
                      <tr>
                        <td colSpan={showCheckboxes ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div className="books-empty">No payment titles found.</div>
                        </td>
                      </tr>
                    ) : (
                      titles.map((t) => {
                        const yr = getAcademicYear(t.title);
                        const isSelected = selected.has(t.titleId);
                        const netPayable = Math.max(0, t.amount - t.discount);

                        return (
                          <tr
                            key={t.titleId}
                            style={{
                              cursor: showCheckboxes ? 'pointer' : 'default',
                              background: isSelected ? 'rgba(59, 130, 246, 0.06)' : undefined,
                            }}
                            onClick={() => {
                              if (showCheckboxes) toggleOneWithValidation(t.titleId);
                            }}
                          >
                            {showCheckboxes && (
                              <td
                                style={{ textAlign: 'center', verticalAlign: 'middle' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="pay-checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleOneWithValidation(t.titleId)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </td>
                            )}
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <span className="code-badge">{t.titleId}</span>
                            </td>
                            <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {t.title}
                              </span>
                              {yr && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    display: 'inline-block',
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    fontWeight: 600,
                                  }}
                                >
                                  {yr}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 500 }}>
                              {fmt(t.amount)}
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'middle', color: '#047857', fontWeight: 500 }}>
                              {t.discount > 0 ? `- ${fmt(t.discount)}` : '₹0'}
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 700, color: '#16a34a' }}>
                              {fmt(netPayable)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pay-mob-list">
              {titles.length === 0 ? (
                <div className="books-empty" style={{ padding: '2rem', textAlign: 'center' }}>No payment titles found.</div>
              ) : (
                titles.map((t) => (
                  <PayMobCard
                    key={t.titleId}
                    t={t}
                    fmt={fmt}
                    showCheckboxes={showCheckboxes}
                    isSelected={selected.has(t.titleId)}
                    onToggle={() => toggleOneWithValidation(t.titleId)}
                    expanded={payExpanded === t.titleId}
                    onCardToggle={() => setPayExpanded(prev => prev === t.titleId ? null : t.titleId)}
                    getAcademicYear={getAcademicYear}
                  />
                ))
              )}
            </div>
          </>
        )}

        <Pagination
          pageData={pageData}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
        />
      </div>

      {/* ── Selection Action Bar (Shown in Combination Mode) ── */}
      {showCheckboxes && (
        <div
          className="pay-action-row"
          style={{
            marginTop: '1.25rem',
            padding: '14px 18px',
            borderRadius: 8,
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Selected Fees:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {selected.size} title{selected.size === 1 ? '' : 's'}
              </strong>
            </span>
            {selected.size > 0 && (
              <span style={{ marginLeft: 16, fontSize: '0.9rem', color: '#16a34a', fontWeight: 600 }}>
                Combined Total Net:{' '}
                {fmt(
                  Array.from(selected).reduce((sum, id) => {
                    const t = allTitles.find((x) => x.titleId === id) || titles.find((x) => x.titleId === id);
                    return sum + (t ? Math.max(0, t.amount - t.discount) : 0);
                  }, 0)
                )}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={() => {
                setShowCheckboxes(false);
                setSelected(new Set());
                setConflictWarning('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="books-btn books-btn-primary"
              onClick={handleCreate}
              disabled={creating || selected.size < 2}
              title={selected.size < 2 ? 'Select at least 2 titles to create combination' : ''}
            >
              {creating
                ? 'Creating...'
                : selected.size < 2
                ? 'Select at least 2 titles'
                : `Save Combination (${selected.size} selected)`}
            </button>
          </div>
        </div>
      )}

      {/* ── Created Payment Combinations ── */}
      {combinations.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <p className="pay-capsules-title">
            Created Payment Combinations
          </p>
          <div className="pay-capsules-wrap">
            {combinations.map((c) => (
              <span
                key={c.paymentId}
                className="pay-capsule"
                style={{ cursor: 'pointer' }}
                onClick={() => setViewCombo(c)}
                title="Click to view breakdown"
              >
                <span className="pay-capsule-id">{c.paymentId}</span>
                {c.paymentTitles.join(' + ')}
                <span style={{ color: '#16a34a', fontWeight: 600, marginLeft: 6 }}>
                  — {fmt(c.totalAmount)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Combination Breakdown Modal (Defect 1: Alignment in modal) ── */}
      {viewCombo && (
        <div className="books-overlay" onClick={() => setViewCombo(null)}>
          <div
            className="books-modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="books-modal-head">
              <h3>{viewCombo.paymentId} — Fee Breakdown</h3>
              <button className="books-modal-close" onClick={() => setViewCombo(null)}>
                x
              </button>
            </div>
            <div className="books-modal-body">
              <div className="books-table-wrap">
                <table className="books-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Payment Title</th>
                      <th style={{ width: 100, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 100, textAlign: 'right' }}>Discount</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCombo.paymentTitles.map((titleName) => {
                      const t = allTitles.find((x) => x.title === titleName);
                      const amt = t ? t.amount : 0;
                      const disc = t ? t.discount : 0;
                      const net = Math.max(0, amt - disc);
                      return (
                        <tr key={titleName}>
                          <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>{titleName}</td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{fmt(amt)}</td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle', color: '#047857' }}>
                            {disc > 0 ? `- ${fmt(disc)}` : '₹0'}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 700, color: '#16a34a' }}>
                            {fmt(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color, #e5e7eb)' }}>
                      <td style={{ textAlign: 'left', fontWeight: 700 }}>Total</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {fmt(viewCombo.paymentTitles.reduce((sum, name) => {
                          const t = allTitles.find((x) => x.title === name);
                          return sum + (t ? t.amount : 0);
                        }, 0))}
                      </td>
                      <td style={{ textAlign: 'right', color: '#047857', fontWeight: 700 }}>
                        {fmt(viewCombo.paymentTitles.reduce((sum, name) => {
                          const t = allTitles.find((x) => x.title === name);
                          return sum + (t ? t.discount : 0);
                        }, 0))}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#16a34a' }}>
                        {fmt(viewCombo.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="books-modal-foot">
              <button
                className="books-btn books-btn-ghost"
                onClick={() => setViewCombo(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Payment Title Modal ── */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          loadTitles();
          loadAllTitles();
          setSuccess('Payment title added successfully.');
        }}
      />
    </div>
  );
}
