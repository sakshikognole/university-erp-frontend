/**
 * EmailCommunication.jsx
 *
 * Full Email Communication page for the University ERP.
 * Allows SUPER_ADMIN / SUB_ADMIN users to:
 *   1. Add recipient email addresses manually (Add Email dialog)
 *   2. Bulk-import addresses from a CSV or Excel file (Bulk Upload)
 *   3. Review / remove recipients
 *   4. Compose a subject + message body
 *   5. Open a confirmation dialog that lets them select exactly which
 *      recipients receive the email, then send.
 *
 * Design: matches existing ERP conventions (pure CSS, lucide-react icons,
 * native fetch via emailCommunicationService, localStorage auth token).
 */

import React, { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Mail,
  Plus,
  Upload,
  Trash2,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { sendEmail } from './emailCommunicationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 500;
// Recognised column header names (lower-cased, trimmed) for auto-detection
const EMAIL_COLUMN_ALIASES = ['email', 'email address', 'e-mail', 'emailaddress', 'email_address'];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function isValidEmail(addr) {
  return typeof addr === 'string' && EMAIL_REGEX.test(addr.trim());
}

function normaliseEmail(addr) {
  return addr.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Sub-component: Add Email Modal
// ---------------------------------------------------------------------------
function AddEmailModal({ existingEmails, onAdd, onClose }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError('Please enter an email address.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    const normalised = normaliseEmail(trimmed);
    if (existingEmails.has(normalised)) {
      setError('This email address has already been added.');
      return;
    }
    onAdd(normalised);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ec-modal-narrow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Add Email Address</h3>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="ec-add-email-input">
              Email Address
            </label>
            <input
              ref={inputRef}
              id="ec-add-email-input"
              type="email"
              className={`ec-text-input${error ? ' ec-input-error' : ''}`}
              placeholder="e.g. recipient@university.edu"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              autoComplete="off"
            />
            {error && (
              <p className="ec-field-error">
                <AlertCircle size={13} />
                {error}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Import Summary Banner
// ---------------------------------------------------------------------------
function ImportSummary({ summary, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  if (!summary) return null;

  const hasInvalid = summary.invalid.length > 0;
  const hasDuplicates = summary.duplicates.length > 0;
  const hasAdded = summary.added > 0;
  const isError = summary.added === 0;

  return (
    <div className={`ec-import-summary ${isError ? 'ec-import-summary--error' : 'ec-import-summary--success'}`}>
      <div className="ec-import-summary-header">
        <div className="ec-import-summary-title">
          {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <strong>Import Summary</strong>
          <span className="ec-import-summary-file">{summary.fileName}</span>
        </div>
        <button type="button" className="close-modal-btn" onClick={onDismiss}>
          <X size={16} />
        </button>
      </div>

      <div className="ec-import-stats">
        <span className="ec-import-stat">
          <span className="ec-import-stat-label">Rows processed</span>
          <strong>{summary.totalRows}</strong>
        </span>
        <span className="ec-import-stat ec-stat-success">
          <span className="ec-import-stat-label">Added</span>
          <strong>{summary.added}</strong>
        </span>
        <span className="ec-import-stat ec-stat-warn">
          <span className="ec-import-stat-label">Duplicates skipped</span>
          <strong>{summary.duplicates.length}</strong>
        </span>
        <span className="ec-import-stat ec-stat-error">
          <span className="ec-import-stat-label">Invalid rejected</span>
          <strong>{summary.invalid.length}</strong>
        </span>
      </div>

      {(hasInvalid || hasDuplicates) && (
        <button
          type="button"
          className="ec-import-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      )}

      {expanded && (
        <div className="ec-import-details">
          {hasInvalid && (
            <div className="ec-import-detail-group">
              <p className="ec-import-detail-label">Invalid addresses ({summary.invalid.length})</p>
              <ul className="ec-import-detail-list">
                {summary.invalid.map((item, i) => (
                  <li key={i}>
                    <span className="ec-detail-value">{item.value || '(empty)'}</span>
                    <span className="ec-detail-reason">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasDuplicates && (
            <div className="ec-import-detail-group">
              <p className="ec-import-detail-label">Duplicate addresses ({summary.duplicates.length})</p>
              <ul className="ec-import-detail-list">
                {summary.duplicates.map((addr, i) => (
                  <li key={i}>
                    <span className="ec-detail-value">{addr}</span>
                    <span className="ec-detail-reason">Already in list</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Confirmation Dialog
// ---------------------------------------------------------------------------
function ConfirmDialog({ recipients, subject, body, sending, onConfirm, onClose }) {
  // Every recipient is selected by default when the dialog opens.
  const [selected, setSelected] = useState(() => new Set(recipients));

  const allChecked = selected.size === recipients.length;
  const noneChecked = selected.size === 0;
  const partialChecked = !allChecked && !noneChecked;

  const toggleAll = () => {
    if (allChecked || partialChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipients));
    }
  };

  const toggleOne = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected));
  };

  return (
    <div className="modal-overlay" onClick={!sending ? onClose : undefined}>
      <div
        className="modal-content ec-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="ec-confirm-header-title">
            <Mail size={20} />
            <h3 className="modal-title">Confirm Email Recipients</h3>
          </div>
          {!sending && (
            <button type="button" className="close-modal-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Subject preview */}
        <div className="ec-confirm-subject-row">
          <span className="ec-confirm-label">Subject:</span>
          <span className="ec-confirm-subject-value">{subject}</span>
        </div>

        {/* Recipient selection */}
        <div className="ec-confirm-recipient-section">
          <div className="ec-confirm-recipient-header">
            <label className="ec-select-all-row">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = partialChecked;
                }}
                onChange={toggleAll}
                disabled={sending}
              />
              <span>Select all</span>
            </label>
            <span className="ec-confirm-count">
              <strong>{selected.size}</strong> of {recipients.length} selected
            </span>
          </div>

          <div className="ec-confirm-recipient-list">
            {recipients.map((email) => (
              <label key={email} className="ec-recipient-check-row">
                <input
                  type="checkbox"
                  checked={selected.has(email)}
                  onChange={() => toggleOne(email)}
                  disabled={sending}
                />
                <span className="ec-recipient-email">{email}</span>
              </label>
            ))}
          </div>
        </div>

        {noneChecked && (
          <p className="ec-confirm-warn">
            <AlertTriangle size={14} />
            Select at least one recipient to send.
          </p>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={noneChecked || sending}
          >
            {sending ? (
              <>
                <Loader2 size={15} className="spin-animate" />
                Sending…
              </>
            ) : (
              <>
                <Send size={15} />
                Confirm &amp; Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
const EmailCommunication = () => {
  // ── Recipient state ────────────────────────────────────────────────────
  // Use a Set (stored as state via array for React reactivity) for O(1) dup checks.
  const [recipientList, setRecipientList] = useState([]); // ordered display list
  const recipientSet = useRef(new Set());                  // canonical lowercase set

  // ── UI state ──────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  // ── Compose state ─────────────────────────────────────────────────────
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [bodyError, setBodyError] = useState('');

  // ── File input ref ────────────────────────────────────────────────────
  const fileInputRef = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    // Auto-dismiss success messages after 6 s
    if (type === 'success') {
      setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
    }
  };

  // ── Add single email ──────────────────────────────────────────────────
  const handleAddEmail = (email) => {
    recipientSet.current.add(email);
    setRecipientList((prev) => [...prev, email]);
  };

  // ── Remove single email ───────────────────────────────────────────────
  const handleRemove = (email) => {
    recipientSet.current.delete(email);
    setRecipientList((prev) => prev.filter((e) => e !== email));
  };

  // ── Clear all recipients ──────────────────────────────────────────────
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    recipientSet.current.clear();
    setRecipientList([]);
    setImportSummary(null);
    setShowClearConfirm(false);
  };

  // ── Parse extracted email rows from CSV/XLSX ──────────────────────────
  /**
   * Given an array of rows (each row is an array of cell values),
   * and an optional header array, attempt to find the email column and
   * return { emails: string[], columnIndex: number | null, ambiguous: boolean }.
   */
  const detectEmailColumn = useCallback((headers, rows) => {
    if (!headers || headers.length === 0) return { columnIndex: null, ambiguous: false };

    const normHeaders = headers.map((h) => String(h ?? '').trim().toLowerCase());

    // Try exact match first
    let idx = normHeaders.findIndex((h) => EMAIL_COLUMN_ALIASES.includes(h));
    if (idx !== -1) return { columnIndex: idx, ambiguous: false };

    // Try partial match (header contains "email")
    const partialMatches = normHeaders.reduce((acc, h, i) => {
      if (h.includes('email') || h.includes('e-mail')) acc.push(i);
      return acc;
    }, []);

    if (partialMatches.length === 1) return { columnIndex: partialMatches[0], ambiguous: false };
    if (partialMatches.length > 1) return { columnIndex: null, ambiguous: true };

    return { columnIndex: null, ambiguous: false };
  }, []);

  /**
   * Process an array of raw row arrays (strings/numbers) plus optional
   * headers, returning the import summary object.
   */
  const processRows = useCallback(
    (headers, dataRows, fileName) => {
      const isSingleColumn = (headers?.length ?? 0) <= 1 && (dataRows[0]?.length ?? 0) <= 1;

      let columnIndex = 0;
      let ambiguous = false;

      if (isSingleColumn) {
        // Single-column file — treat every non-empty cell as an email candidate
        columnIndex = 0;
      } else {
        const detected = detectEmailColumn(headers, dataRows);
        columnIndex = detected.columnIndex;
        ambiguous = detected.ambiguous;

        if (columnIndex === null) {
          return {
            error: ambiguous
              ? 'Multiple possible email columns were found. Please ensure your file has a column labelled "Email" or "Email Address".'
              : 'No email column could be identified. Please ensure your file has a column labelled "Email" or "Email Address".',
          };
        }
      }

      let totalRows = 0;
      const added = [];
      const duplicates = [];
      const invalid = [];

      for (const row of dataRows) {
        const raw = row[columnIndex];
        if (raw === undefined || raw === null || String(raw).trim() === '') continue;

        totalRows++;
        const value = String(raw).trim();
        const norm = normaliseEmail(value);

        if (!isValidEmail(value)) {
          invalid.push({ value, reason: 'Invalid email format' });
        } else if (recipientSet.current.has(norm)) {
          duplicates.push(norm);
        } else {
          added.push(norm);
        }
      }

      // Commit valid new emails
      for (const email of added) {
        recipientSet.current.add(email);
      }
      if (added.length > 0) {
        setRecipientList((prev) => [...prev, ...added]);
      }

      return {
        fileName,
        totalRows,
        added: added.length,
        duplicates,
        invalid,
      };
    },
    [detectEmailColumn]
  );

  // ── Bulk Upload handler ───────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-uploaded if needed
    e.target.value = '';
    if (!file) return;

    setImportSummary(null);

    const ext = file.name.split('.').pop().toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      showFeedback(
        'error',
        `Unsupported file type ".${ext}". Please upload a CSV (.csv) or Excel (.xlsx / .xls) file.`
      );
      return;
    }

    if (ext === 'csv') {
      // ── CSV ────────────────────────────────────────────────────────────
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          const allRows = results.data;
          if (!allRows || allRows.length === 0) {
            showFeedback('error', 'The CSV file is empty or could not be read.');
            return;
          }

          // Determine whether the first row looks like a header
          const firstRow = allRows[0];
          const firstCellLower = String(firstRow[0] ?? '').trim().toLowerCase();
          const hasHeader = EMAIL_COLUMN_ALIASES.some((alias) =>
            firstCellLower.includes('email') || firstCellLower.includes('e-mail')
          );

          let headers = null;
          let dataRows = allRows;

          if (hasHeader || firstRow.length > 1) {
            headers = firstRow.map(String);
            dataRows = allRows.slice(1);
          }

          if (dataRows.length === 0) {
            showFeedback('error', 'The CSV file contains a header row but no data rows.');
            return;
          }

          const summary = processRows(headers, dataRows, file.name);

          if (summary.error) {
            showFeedback('error', summary.error);
            return;
          }

          if (summary.added === 0 && summary.totalRows === 0) {
            showFeedback('error', 'No email addresses found in the file.');
            return;
          }

          setImportSummary(summary);
        },
        error: () => {
          showFeedback('error', 'Failed to read the CSV file. Please check the file and try again.');
        },
      });
    } else {
      // ── XLSX / XLS ─────────────────────────────────────────────────────
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          if (!allRows || allRows.length === 0) {
            showFeedback('error', 'The spreadsheet is empty or could not be read.');
            return;
          }

          const firstRow = allRows[0];
          const firstCellLower = String(firstRow[0] ?? '').trim().toLowerCase();
          const hasHeader =
            firstRow.length > 1 ||
            firstCellLower.includes('email') ||
            firstCellLower.includes('e-mail');

          let headers = null;
          let dataRows = allRows;

          if (hasHeader) {
            headers = firstRow.map(String);
            dataRows = allRows.slice(1);
          }

          if (dataRows.length === 0) {
            showFeedback('error', 'The spreadsheet contains a header row but no data rows.');
            return;
          }

          const summary = processRows(headers, dataRows, file.name);

          if (summary.error) {
            showFeedback('error', summary.error);
            return;
          }

          if (summary.added === 0 && summary.totalRows === 0) {
            showFeedback('error', 'No email addresses found in the spreadsheet.');
            return;
          }

          setImportSummary(summary);
        } catch {
          showFeedback('error', 'Failed to read the spreadsheet. Please check the file and try again.');
        }
      };
      reader.onerror = () => {
        showFeedback('error', 'Could not read the file.');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // ── Compose validation ────────────────────────────────────────────────
  const validateCompose = () => {
    let valid = true;

    if (!subject.trim()) {
      setSubjectError('Subject is required.');
      valid = false;
    } else {
      setSubjectError('');
    }

    if (!body.trim()) {
      setBodyError('Message is required.');
      valid = false;
    } else {
      setBodyError('');
    }

    return valid;
  };

  // ── Open confirmation dialog ──────────────────────────────────────────
  const handleSendClick = () => {
    if (recipientList.length === 0) {
      showFeedback('error', 'Add at least one recipient before sending.');
      return;
    }
    if (!validateCompose()) return;
    setShowConfirmDialog(true);
  };

  // ── Confirmed send ────────────────────────────────────────────────────
  const handleConfirmedSend = async (confirmedRecipients) => {
    setSending(true);
    setFeedback({ type: '', message: '' });

    try {
      const result = await sendEmail(confirmedRecipients, subject.trim(), body.trim());

      setShowConfirmDialog(false);
      setSending(false);

      if (result.status === 207) {
        // Partial success
        showFeedback(
          'error',
          result.message ||
            `Partial delivery: ${result.summary?.sent} sent, ${result.summary?.failed} failed.`
        );
      } else {
        // Full success — clear compose fields and recipients
        showFeedback('success', result.message || 'Email sent successfully.');
        setSubject('');
        setBody('');
        setRecipientList([]);
        recipientSet.current.clear();
        setImportSummary(null);
      }
    } catch (err) {
      setSending(false);
      setShowConfirmDialog(false);
      showFeedback('error', err.message || 'Failed to send email. Please try again.');
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const canSend =
    recipientList.length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    !sending;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Email Communication</h1>
          <p className="page-subtitle">
            Compose and send custom emails to one or more recipients using the university email system.
          </p>
        </div>
      </div>

      {/* ── Feedback Banner ──────────────────────────────────────────────── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '0 0 1.25rem' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => setFeedback({ type: '', message: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Import Summary ───────────────────────────────────────────────── */}
      {importSummary && (
        <ImportSummary
          summary={importSummary}
          onDismiss={() => setImportSummary(null)}
        />
      )}

      {/* ── Recipient Management Card ─────────────────────────────────────── */}
      <div className="card ec-section-card">
        {/* Section header */}
        <div className="ec-section-header">
          <div className="ec-section-title-group">
            <Users size={18} />
            <h2 className="ec-section-title">Recipients</h2>
            {recipientList.length > 0 && (
              <span className="table-stats-badge">
                {recipientList.length}{' '}
                {recipientList.length === 1 ? 'recipient' : 'recipients'}
              </span>
            )}
          </div>
          <div className="header-actions-group">
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={() => setShowAddModal(true)}
              title="Add a single email address"
            >
              <Plus size={16} />
              <span>Add Email</span>
            </button>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              title="Import emails from CSV or Excel"
            >
              <Upload size={16} />
              <span>Bulk Upload</span>
            </button>
            {recipientList.length > 0 && (
              <button
                type="button"
                className="books-btn books-btn-ghost ec-clear-btn"
                onClick={() => setShowClearConfirm(true)}
                title="Clear all recipients"
              >
                <Trash2 size={16} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Recipient list body */}
        <div className="ec-recipient-body">
          {recipientList.length === 0 ? (
            <div className="ec-empty-recipients">
              <Mail size={36} className="empty-icon" />
              <h3>No recipients added yet</h3>
              <p>
                Click <strong>Add Email</strong> to add addresses one by one, or use{' '}
                <strong>Bulk Upload</strong> to import from a CSV or Excel file.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Email Address</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {recipientList.map((email, i) => (
                    <tr key={email}>
                      <td className="text-secondary" style={{ color: 'var(--text-secondary)' }}>
                        {i + 1}
                      </td>
                      <td>
                        <span className="ec-email-cell">{email}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="delete-icon-btn"
                          title={`Remove ${email}`}
                          onClick={() => handleRemove(email)}
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Limit warning */}
        {recipientList.length >= MAX_RECIPIENTS && (
          <div className="ec-limit-warn">
            <Info size={14} />
            Maximum of {MAX_RECIPIENTS} recipients reached.
          </div>
        )}
      </div>

      {/* ── Email Composition Card ────────────────────────────────────────── */}
      <div className="card ec-section-card" style={{ marginTop: '1.25rem' }}>
        <div className="ec-section-header">
          <div className="ec-section-title-group">
            <Mail size={18} />
            <h2 className="ec-section-title">Compose Email</h2>
          </div>
        </div>

        <div className="ec-compose-body">
          {/* Subject */}
          <div className="form-group">
            <label className="form-label" htmlFor="ec-subject">
              Subject <span className="ec-required">*</span>
            </label>
            <input
              id="ec-subject"
              type="text"
              className={`ec-text-input${subjectError ? ' ec-input-error' : ''}`}
              placeholder="Enter email subject"
              value={subject}
              maxLength={255}
              onChange={(e) => {
                setSubject(e.target.value);
                if (subjectError) setSubjectError('');
              }}
            />
            {subjectError && (
              <p className="ec-field-error">
                <AlertCircle size={13} />
                {subjectError}
              </p>
            )}
          </div>

          {/* Body / Description */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="ec-body">
              Description <span className="ec-required">*</span>
            </label>
            <textarea
              id="ec-body"
              className={`ec-textarea${bodyError ? ' ec-input-error' : ''}`}
              placeholder="Enter your message here…"
              value={body}
              rows={8}
              onChange={(e) => {
                setBody(e.target.value);
                if (bodyError) setBodyError('');
              }}
            />
            {bodyError && (
              <p className="ec-field-error">
                <AlertCircle size={13} />
                {bodyError}
              </p>
            )}
            <p className="ec-char-count">
              {body.length.toLocaleString()} / 50,000 characters
            </p>
          </div>

          {/* Send button row */}
          <div className="ec-send-row">
            {recipientList.length === 0 && (
              <p className="ec-send-hint">
                <AlertCircle size={14} />
                Add at least one recipient to enable sending.
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary ec-send-btn"
              disabled={!canSend}
              onClick={handleSendClick}
              title={
                recipientList.length === 0
                  ? 'Add recipients first'
                  : !subject.trim() || !body.trim()
                  ? 'Fill in subject and message'
                  : 'Review recipients and send'
              }
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Add Email Modal */}
      {showAddModal && (
        <AddEmailModal
          existingEmails={recipientSet.current}
          onAdd={handleAddEmail}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Clear All Confirmation */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div
            className="modal-content delete-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Clear All Recipients</h3>
                <p className="delete-dialog-desc">
                  This will remove all {recipientList.length}{' '}
                  {recipientList.length === 1 ? 'recipient' : 'recipients'} from the list.
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This action cannot be undone.</span>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearAll}
              >
                <Trash2 size={15} />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          recipients={recipientList}
          subject={subject}
          body={body}
          sending={sending}
          onConfirm={handleConfirmedSend}
          onClose={() => !sending && setShowConfirmDialog(false)}
        />
      )}
    </div>
  );
};

export default EmailCommunication;
