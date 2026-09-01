import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import Pagination from '../components/Pagination';

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

// ── Add Payment Modal ─────────────────────────────────────────────────────
function AddPaymentModal({ isOpen, onClose, onSaved }) {
  const [form,    setForm]    = useState({ title: '', amount: '', discount: '' });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  useEffect(() => {
    if (isOpen) { setForm({ title: '', amount: '', discount: '' }); setErrors({}); setApiErr(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())          e.title    = 'Title is required.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
                                     e.amount   = 'Valid amount is required.';
    if (form.discount !== '' && (isNaN(form.discount) || Number(form.discount) < 0))
                                     e.discount = 'Discount must be 0 or more.';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiErr('');
    try {
      await springApi.post('/payment-titles', {
        title:    form.title.trim(),
        amount:   Number(form.amount),
        discount: Number(form.discount || 0),
      });
      onSaved();
      onClose();
    } catch (err) {
      setApiErr(err.message || 'Failed to add payment title.');
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
            {form.amount && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Final amount after discount:{' '}
                <strong style={{ color: '#16a34a' }}>
                  ₹{Math.max(0, Number(form.amount) - Number(form.discount || 0)).toLocaleString('en-IN')}
                </strong>
              </p>
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
// PaymentPage
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
  const [combinations,   setCombinations]   = useState([]);
  const [creating,       setCreating]       = useState(false);
  const [viewCombo,      setViewCombo]      = useState(null); // clicked capsule
  const [allTitles,      setAllTitles]      = useState([]); // flat list for breakdown lookup

  // ── Feedback ──────────────────────────────────────────────────────────
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load titles ───────────────────────────────────────────────────────
  const loadTitles = useCallback(async () => {
    setTitlesLoading(true);
    try {
      const res = await springApi.get('/payment-titles', {
        params: { page, size },
      });
      // springApi interceptor already unwraps res.data — res IS the Page object
      const pd = res;
      setTitles(pd.content ?? []);
      setPageData({
        pageNumber:    pd.number       ?? pd.pageNumber    ?? 0,
        pageSize:      pd.size         ?? pd.pageSize      ?? size,
        totalElements: pd.totalElements ?? 0,
        totalPages:    pd.totalPages    ?? 0,
        first:         pd.first        ?? true,
        last:          pd.last         ?? true,
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
      const res = await springApi.get('/payment-combinations');
      setCombinations(Array.isArray(res) ? res : []);
    } catch { /* silently ignore */ }
  }, []);

  // ── Load all titles flat (for breakdown card) ─────────────────────────
  const loadAllTitles = useCallback(async () => {
    try {
      const res = await springApi.get('/payment-titles', {
        params: { page: 0, size: 1000 },
      });
      setAllTitles((res?.content ?? res) ?? []);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadTitles(); },       [loadTitles]);
  useEffect(() => { loadCombinations(); }, [loadCombinations]);
  useEffect(() => { loadAllTitles(); },    [loadAllTitles]);

  // ── Page / size change ────────────────────────────────────────────────
  const onPageChange = (p) => { setPage(p);    setSelected(new Set()); };
  const onSizeChange = (s) => { setSize(s);    setPage(0); setSelected(new Set()); };

  // ── Checkbox handlers ─────────────────────────────────────────────────
  const toggleOne = (titleId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(titleId) ? next.delete(titleId) : next.add(titleId);
      return next;
    });
  };

  const isAllOnPageSelected = titles.length > 0 &&
    titles.every((t) => selected.has(t.titleId));

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
      await springApi.post('/payment-combinations', {
        titleIds: Array.from(selected),
      });
      setSuccess('Payment combination created successfully.');
      setSelected(new Set());
      loadCombinations();
    } catch (err) {
      setError(err.message || 'Failed to create payment.');
    } finally {
      setCreating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const fmt = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header — same pattern as BooksPage */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p className="books-page-sub">
            Select payment titles and create a payment combination
          </p>
        </div>
        <button
          className="books-btn books-btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + Add Payment
        </button>
      </div>

      {/* Alerts */}
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

      {/* ── Table ── */}
      <div className="card">
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
                  <th>Payment Title</th>
                  <th>Amount</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {titles.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
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
                    <td>{t.title}</td>
                    <td className="pay-amount">{fmt(t.amount)}</td>
                    <td className="pay-discount">{fmt(t.amount - t.discount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination — exact same component as BooksPage ── */}
        <Pagination
          pageData={pageData}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
        />
      </div>

      {/* ── Create Payment button ── */}
      {selected.size > 0 && (
        <div className="pay-action-row">
          <button
            className="books-btn books-btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating
              ? 'Creating...'
              : `Create Payment (${selected.size} selected)`}
          </button>
        </div>
      )}

      {/* ── Created Payment Combinations (capsules) ── */}
      {combinations.length > 0 && (
        <div>
          <p className="pay-capsules-title">Created Payments</p>
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

      {/* ── Combination Breakdown Card (overlay) ── */}
      {viewCombo && (
        <div
          className="books-overlay"
          onClick={() => setViewCombo(null)}
        >
          <div
            className="books-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="books-modal-head">
              <h3>
                {viewCombo.paymentId} — Payment Breakdown
              </h3>
              <button
                className="books-modal-close"
                onClick={() => setViewCombo(null)}
              >
                x
              </button>
            </div>

            {/* Breakdown table */}
            <div className="books-modal-body">
              <div className="books-table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Payment Title</th>
                      <th>Amount</th>
                      <th>After Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCombo.paymentTitles.map((titleName) => {
                      const t = allTitles.find((x) => x.title === titleName);
                      const amount  = t ? t.amount            : 0;
                      const final   = t ? t.amount - t.discount : 0;
                      return (
                        <tr key={titleName}>
                          <td>{titleName}</td>
                          <td className="pay-amount">{fmt(amount)}</td>
                          <td className="pay-discount">{fmt(final)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Total row */}
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                      <td style={{ fontWeight: 700 }}>Total</td>
                      <td className="pay-amount" style={{ fontWeight: 700 }}>
                        {fmt(
                          viewCombo.paymentTitles.reduce((sum, name) => {
                            const t = allTitles.find((x) => x.title === name);
                            return sum + (t ? t.amount : 0);
                          }, 0)
                        )}
                      </td>
                      <td className="pay-discount" style={{ fontWeight: 700, fontSize: 15 }}>
                        {fmt(viewCombo.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
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

      {/* ── Add Payment Modal ── */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { loadTitles(); setSuccess('Payment title added successfully.'); }}
      />

    </div>
  );
}
