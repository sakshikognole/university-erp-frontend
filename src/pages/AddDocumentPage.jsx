import { useState, useEffect, useRef } from 'react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';

const INSERT_FIELDS = [
  { label: 'Name',               token: '{{name}}' },
  { label: 'PRN',                token: '{{prn}}' },
  { label: 'Class',              token: '{{class}}' },
  { label: 'Division',           token: '{{division}}' },
  { label: 'Degree',             token: '{{degree}}' },
  { label: 'Year of Enrollment', token: '{{yearOfEnrollment}}' },
];

export default function AddDocumentPage() {
  const [documentName, setDocumentName] = useState('');
  const [content,      setContent]      = useState('');
  const [documents,    setDocuments]    = useState([]);
  const [docsLoading,  setDocsLoading]  = useState(true);
  const [docsError,    setDocsError]    = useState('');
  const [editingId,    setEditingId]    = useState(null);
  const [editContent,  setEditContent]  = useState('');
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');
  // D3: field-level error shown directly below the Document Name input
  const [nameError,    setNameError]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const textareaRef = useRef();
  const editAreaRef = useRef();

  // Auto-dismiss success after 4 seconds
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setDocsLoading(true); setDocsError('');
    try {
      const res = await springGet('/document-types');
      setDocuments(Array.isArray(res) ? res : (res.data ?? []));
    } catch (err) {
      setDocsError(err.message || 'Failed to load document types.');
    } finally {
      setDocsLoading(false);
    }
  }

  function insertToken(token, ref, value, setValue) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = value.substring(0, start) + token + value.substring(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // D4: validate document name — only letters and spaces, no double spaces
  function validateName(name) {
    const trimmed = name.trim();
    if (!trimmed)
      return 'Document name is required.';
    if (!/^[A-Za-z\s]+$/.test(trimmed))
      return 'Document name must contain only letters and spaces. No numbers or special characters.';
    if (/\s{2,}/.test(trimmed))
      return 'Document name must not contain double spaces.';
    if (trimmed.length < 2)
      return 'Document name must be at least 2 characters.';
    return '';
  }

  const handleNameChange = (val) => {
    setDocumentName(val);
    setNameError('');
    setError('');
    setSuccess('');
  };

  // D5: clear document name field
  const clearName = () => {
    setDocumentName('');
    setNameError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    // D3 + D4: validate and show error directly below field
    const nameErr = validateName(documentName);
    if (nameErr) { setNameError(nameErr); return; }

    // D6: duplicate check (case-insensitive)
    const isDuplicate = documents.some(
      d => d.documentName.trim().toLowerCase() === documentName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setNameError(`"${documentName.trim()}" already exists. Please use a different name.`);
      return;
    }

    setLoading(true);
    try {
      await springApi.post('/document-types', {
        documentName:   documentName.trim(),
        defaultContent: content.trim(),
      });
      setSuccess(`"${documentName.trim()}" added successfully.`);
      setDocumentName(''); setContent(''); setNameError('');
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add document type.');
    } finally { setLoading(false); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await springApi.delete(`/document-types/${id}`);
      // D7: show success message after deletion
      setSuccess(`"${name}" deleted successfully.`);
      fetchDocuments();
    } catch { setError('Delete failed.'); }
  }

  function startEditing(doc) {
    setEditingId(doc.id);
    setEditContent(doc.defaultContent || '');
  }

  async function saveEditContent(id, name) {
    try {
      await springApi.put(`/document-types/${id}/content`, { defaultContent: editContent });
      setEditingId(null);
      setSuccess(`"${name}" content updated successfully.`);
      fetchDocuments();
    } catch { setError('Failed to save content.'); }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Add Document Type</h1>
      <p className="stu-page-sub">
        Add certificate types and write their default content template.
      </p>

      {/* D1: consistent spacing between description and form */}
      <div style={{ marginTop: '1.5rem' }}>

        {/* Global alerts */}
        {success && (
          <div className="books-alert books-alert-success" style={{ marginBottom: 16 }}>
            <span>{success}</span>
            <button onClick={() => setSuccess('')}>x</button>
          </div>
        )}
        {error && (
          <div className="books-alert books-alert-error" style={{ marginBottom: 16 }}>
            <span>{error}</span>
            <button onClick={() => setError('')}>x</button>
          </div>
        )}

        {/* Add form */}
        <div className="card stu-form-card">
          <form onSubmit={handleSubmit} noValidate>

            {/* Document Name field */}
            <div className="stu-form-group">
              {/* D2: asterisk on mandatory field */}
              <label className="stu-form-label">
                Document Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {/* D5: clear button on the right side of the input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  className={`stu-input ${nameError ? 'err' : ''}`}
                  style={{ paddingRight: documentName ? 36 : 12 }}
                  placeholder="e.g. Bonafide Certificate"
                  value={documentName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {/* Clear (x) button — only shown when there is text */}
                {documentName && (
                  <button
                    type="button"
                    onClick={clearName}
                    title="Clear"
                    style={{
                      position: 'absolute', right: 8,
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#9ca3af',
                      fontSize: 16, lineHeight: 1, padding: '2px 4px',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {/* D3: validation message directly below the field */}
              {nameError && (
                <p className="books-form-err" style={{ marginTop: 4 }}>{nameError}</p>
              )}
            </div>

            {/* Certificate Content */}
            <div className="stu-form-group">
              <label className="stu-form-label">Default Certificate Content</label>
              <p className="stu-hint">
                Click a token to insert it. At generation time tokens are replaced with the student's real values.
              </p>
              <div className="stu-insert-bar">
                {INSERT_FIELDS.map((f) => (
                  <button
                    key={f.token} type="button" className="stu-insert-btn"
                    onClick={() => insertToken(f.token, textareaRef, content, setContent)}
                  >
                    {f.label}
                    <span className="stu-insert-token">{f.token}</span>
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="stu-textarea"
                rows={7}
                placeholder="Write the certificate content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="stu-button-row">
              <button className="stu-btn stu-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add Document Type'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing document types list */}
        <div className="card stu-form-card" style={{ marginTop: '1.25rem' }}>
          <p className="stu-list-title">
            Existing Document Types ({documents.length})
          </p>

          {docsLoading ? (
            <PageLoader message="Loading document types..." />
          ) : docsError ? (
            <PageError message={docsError} onRetry={fetchDocuments} />
          ) : documents.length === 0 ? (
            <p className="stu-info-text">No document types added yet.</p>
          ) : (
            <div className="stu-doc-list">
              {documents.map((doc) => (
                <div key={doc.id} className="stu-doc-item">
                  <div className="stu-doc-header">
                    <span className="stu-doc-name">{doc.documentName}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="stu-btn stu-btn-sm stu-btn-ghost"
                        onClick={() =>
                          editingId === doc.id ? setEditingId(null) : startEditing(doc)
                        }
                      >
                        {editingId === doc.id ? 'Cancel' : 'Edit Content'}
                      </button>
                      <button
                        className="stu-btn stu-btn-sm stu-btn-danger"
                        onClick={() => handleDelete(doc.id, doc.documentName)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingId === doc.id && (
                    <div className="stu-doc-editor">
                      <div className="stu-insert-bar">
                        {INSERT_FIELDS.map((f) => (
                          <button
                            key={f.token} type="button" className="stu-insert-btn"
                            onClick={() =>
                              insertToken(f.token, editAreaRef, editContent, setEditContent)
                            }
                          >
                            {f.label}
                            <span className="stu-insert-token">{f.token}</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        ref={editAreaRef}
                        className="stu-textarea"
                        rows={6}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        spellCheck={false}
                      />
                      <div className="stu-button-row">
                        <button
                          className="stu-btn stu-btn-primary"
                          onClick={() => saveEditContent(doc.id, doc.documentName)}
                        >
                          Save Content
                        </button>
                      </div>
                    </div>
                  )}

                  {editingId !== doc.id && (
                    <p className="stu-doc-preview">
                      {doc.defaultContent
                        ? doc.defaultContent.slice(0, 120) +
                          (doc.defaultContent.length > 120 ? '...' : '')
                        : 'No content template set — click Edit Content to add one.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
