import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';

const _IS_PROD_SP = window.location.hostname !== 'localhost';
const _SPRING_URL = _IS_PROD_SP ? 'https://university-erp-spring.onrender.com' : 'http://localhost:8080';
const SPRING_API = `${_SPRING_URL}/api`;

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

// ── Add Payment Modal ─────────────────────────────────────────────────────
function AddPaymentModal({ isOpen, onClose, onSaved }) {
  const [form,         setForm]         = useState({ title: '', amount: '', discount: '' });
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [apiErr,       setApiErr]       = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({ title: '', amount: '', discount: '' });
      setDiscountType('flat');
      setErrors({});
      setApiErr('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  // Calculate the actual discount rupee value from input
  const discountRupees = () => {
    const amt  = Number(form.amount  || 0);
    const disc = Number(form.discount || 0);
    if (discountType === 'percent') {
      return (amt * disc) / 100;
    }
    return disc;
  };

  const finalAmount = () => Math.max(0, Number(form.amount || 0) - discountRupees());

  const validate = () => {
    const e = {};
    if (!form.title.trim())
      e.title = 'Title is required.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = 'Valid amount is required.';
    if (form.discount !== '') {
      if (isNaN(form.discount) || Number(form.discount) < 0)
        e.discount = 'Discount must be 0 or more.';
      if (discountType === 'percent' && Number(form.discount) > 100)
        e.discount = 'Percentage cannot exceed 100%.';
    }
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiErr('');
    try {
      await axios.post(`${SPRING_API}/payment-titles`, {
        title:    form.title.trim(),
        amount:   Number(form.amount),
        discount: discountRupees(),   // always send rupee value to backend
      });
      onSaved();
      onClose();
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to add payment title.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 420 }}>
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
            <div className="books-form-group">
              <label className="books-form-label">Title *</label>
              <input
                className={`books-form-control ${errors.title ? 'err' : ''}`}
                name="title"
                value={form.title}
                onChange={change}
                placeholder="e.g. Exam Fee"
              />
              {errors.title && <p className="books-form-err">{errors.title}</p>}
            </div>
            <div className="club-form-row">
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
              <div className="books-form-group">
                <label className="books-form-label">
                  Discount&nbsp;
                  {/* Toggle between ₹ flat and % */}
                  <span style={{
                    display: 'inline-flex', border: '1px solid #d1d5db',
                    borderRadius: 6, overflow: 'hidden', fontSize: '0.75rem',
                    marginLeft: 4, verticalAlign: 'middle',
                  }}>
                    <button
                      type="button"
                      onClick={() => { setDiscountType('flat'); setErrors((er) => ({ ...er, discount: '' })); }}
                      style={{
                        padding: '1px 8px', border: 'none', cursor: 'pointer',
                        background: discountType === 'flat' ? '#2563eb' : '#f9fafb',
                        color:      discountType === 'flat' ? '#fff'    : '#374151',
                        fontWeight: 600,
                      }}
                    >₹</button>
                    <button
                      type="button"
                      onClick={() => { setDiscountType('percent'); setErrors((er) => ({ ...er, discount: '' })); }}
                      style={{
                        padding: '1px 8px', border: 'none', cursor: 'pointer',
                        background: discountType === 'percent' ? '#2563eb' : '#f9fafb',
                        color:      discountType === 'percent' ? '#fff'    : '#374151',
                        fontWeight: 600,
                      }}
                    >%</button>
                  </span>
                </label>
                <input
                  className={`books-form-control ${errors.discount ? 'err' : ''}`}
                  name="discount"
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={form.discount}
                  onChange={change}
                  placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 100'}
                />
                {errors.discount && <p className="books-form-err">{errors.discount}</p>}
              </div>
            </div>
            {/* Live preview */}
            {form.amount && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 8, padding: '8px 12px', marginTop: 4, fontSize: 13,
              }}>
                {form.discount && discountType === 'percent' && (
                  <p style={{ margin: '0 0 4px', color: '#374151' }}>
                    Discount: {form.discount}% of ₹{Number(form.amount).toLocaleString('en-IN')}
                    {' = '}
                    <strong>- ₹{discountRupees().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                  </p>
                )}
                <p style={{ margin: 0, color: '#374151' }}>
                  Final amount after discount:{' '}
                  <strong style={{ color: '#16a34a', fontSize: 14 }}>
                    ₹{finalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </strong>
                </p>
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
export default function PaymentPage() {

  // ── Titles (paginated) ────────────────────────────────────────────────
  const [titles,        setTitles]        = useState([]);
  const [pageData,      setPageData]      = useState(DEFAULT_PAGE);
  const [page,          setPage]          = useState(0);
  const [size,          setSize]          = useState(10);
  const [titlesLoading, setTitlesLoading] = useState(true);

  // ── Modal ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);

  // ── Checkbox selection ────────────────────────────────────────────────
  const [selected, setSelected] = useState(new Set());

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
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
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
      setTitles(Array.isArray(pd.content) ? pd.content : []);
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
      setCombinations(Array.isArray(res.data) ? res.data : (res.data?.content ?? []));
    } catch {
      setError('Failed to load payment combinations.');
    }
  }, []);

  // ── Load all titles flat (for breakdown card lookup) ──────────────────
  const loadAllTitles = useCallback(async () => {
    try {
      const res = await axios.get(`${SPRING_API}/payment-titles`, {
        params: { page: 0, size: 1000 },
      });
      setAllTitles(Array.isArray(res.data?.content) ? res.data.content : []);
    } catch { /* silently ignore — allTitles is only used for breakdown display */ }
  }, []);

  useEffect(() => { loadTitles(); },       [loadTitles]);
  useEffect(() => { loadCombinations(); }, [loadCombinations]);
  useEffect(() => { loadAllTitles(); },    [loadAllTitles]);

  // ── Page / size change ────────────────────────────────────────────────
  const onPageChange = (p) => { setPage(p); setSelected(new Set()); };
  const onSizeChange = (s) => { setSize(s); setPage(0); setSelected(new Set()); };

  // ── Checkbox handlers ─────────────────────────────────────────────────
  const toggleOne = (titleId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(titleId) ? next.delete(titleId) : next.add(titleId);
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
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        titles.forEach((t) => next.add(t.titleId));
        return next;
      });
    }
  };

  // ── Create combination ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (selected.size === 0) return;
    setCreating(true);
    setSuccess(''); setError('');
    try {
      await axios.post(`${SPRING_API}/payment-combinations`, {
        titleIds: Array.from(selected),
      });
      setSuccess('Payment combination created successfully.');
      setSelected(new Set());
      loadCombinations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment combination.');
    } finally {
      setCreating(false);
    }
  };

  const fmt = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p className="stu-page-sub">
            Manage fee titles and create payment combinations for students
          </p>
        </div>
        <button
          className="books-btn books-btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + Add Payment Title
        </button>
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

      {/* ── Payment Titles Table ── */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        {titlesLoading ? (
          <p className="books-loading">Loading payment titles...</p>
        ) : (
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="pay-checkbox"
                      checked={isAllOnPageSelected}
                      onChange={toggleAll}
                      title="Select all on this page"
                    />
                  </th>
                  <th>Title ID</th>
                  <th>Payment Title</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {titles.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="books-empty">No payment titles found.</div>
                    </td>
                  </tr>
                ) : titles.map((t) => (
                  <tr
                    key={t.titleId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleOne(t.titleId)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="pay-checkbox"
                        checked={selected.has(t.titleId)}
                        onChange={() => toggleOne(t.titleId)}
                      />
                    </td>
                    <td><span className="code-badge">{t.titleId}</span></td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td className="pay-amount">{fmt(t.amount)}</td>
                    <td style={{ color: '#047857' }}>
                      {t.discount > 0 ? `- ${fmt(t.discount)}` : '₹0'}
                    </td>
                    <td className="pay-discount" style={{ fontWeight: 700 }}>
                      {fmt(t.amount - t.discount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          pageData={pageData}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
        />
      </div>

      {/* ── Create Combination button (shown when rows are selected) ── */}
      {selected.size > 0 && (
        <div className="pay-action-row">
          <p className="pay-selected-hint">
            {selected.size} title{selected.size > 1 ? 's' : ''} selected
          </p>
          <button
            className="books-btn books-btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating
              ? 'Creating...'
              : `Create Payment Combination (${selected.size} selected)`}
          </button>
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

      {/* ── Combination Breakdown Modal ── */}
      {viewCombo && (
        <div className="books-overlay" onClick={() => setViewCombo(null)}>
          <div
            className="books-modal"
            style={{ maxWidth: 500 }}
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
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Payment Title</th>
                      <th>Amount</th>
                      <th>Discount</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCombo.paymentTitles.map((titleName) => {
                      const t = allTitles.find((x) => x.title === titleName);
                      return (
                        <tr key={titleName}>
                          <td>{titleName}</td>
                          <td className="pay-amount">{fmt(t ? t.amount : 0)}</td>
                          <td style={{ color: '#047857' }}>
                            {t && t.discount > 0 ? `- ${fmt(t.discount)}` : '₹0'}
                          </td>
                          <td className="pay-discount" style={{ fontWeight: 700 }}>
                            {fmt(t ? t.amount - t.discount : 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-primary, #e5e7eb)' }}>
                      <td style={{ fontWeight: 700 }}>Total</td>
                      <td className="pay-amount" style={{ fontWeight: 700 }}>
                        {fmt(viewCombo.paymentTitles.reduce((sum, name) => {
                          const t = allTitles.find((x) => x.title === name);
                          return sum + (t ? t.amount : 0);
                        }, 0))}
                      </td>
                      <td style={{ color: '#047857', fontWeight: 700 }}>
                        {fmt(viewCombo.paymentTitles.reduce((sum, name) => {
                          const t = allTitles.find((x) => x.title === name);
                          return sum + (t ? t.discount : 0);
                        }, 0))}
                      </td>
                      <td className="pay-discount" style={{ fontWeight: 800, fontSize: 15 }}>
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
