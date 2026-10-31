import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// FIX D1: absolute Spring Boot URL so downloads/previews work correctly
const onLocalhost   = window.location.hostname === 'localhost';
const SPRING_ORIGIN = onLocalhost
  ? 'http://localhost:9090'
  : 'https://university-erp-spring.onrender.com';

function absoluteUrl(relativeUrl) {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${SPRING_ORIGIN}${relativeUrl}`;
}

// ── File type helpers ──────────────────────────────────────────────────────
function fileIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'pdf':           return '📕';
    case 'jpg':
    case 'jpeg':
    case 'png':           return '🖼️';
    case 'xls':
    case 'xlsx':          return '📊';
    default:              return '📄';
  }
}

function TypeBadge({ type }) {
  const t = (type || '').toLowerCase();
  return <span className={`dm-type-badge dm-type-${t}`}>{type || '—'}</span>;
}

// ── Skeleton loader rows ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      <td style={{ width: '40%', padding: '12px 16px' }}>
        <div style={{
          height: 14,
          width: '75%',
          borderRadius: 4,
          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'books-shimmer 1.4s infinite',
        }} />
      </td>
      <td style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>
        <div style={{
          height: 14,
          width: '50%',
          margin: '0 auto',
          borderRadius: 4,
          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'books-shimmer 1.4s infinite',
        }} />
      </td>
      <td style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>
        <div style={{
          height: 14,
          width: '40%',
          margin: '0 auto',
          borderRadius: 4,
          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'books-shimmer 1.4s infinite',
        }} />
      </td>
      <td style={{ width: '24%', textAlign: 'center', padding: '12px 16px' }}>
        <div style={{
          height: 14,
          width: '70%',
          margin: '0 auto',
          borderRadius: 4,
          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'books-shimmer 1.4s infinite',
        }} />
      </td>
    </tr>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────
function PreviewModal({ material, onClose, onDownload, downloading }) {
  if (!material) return null;
  const type = (material.fileType || '').toLowerCase();
  const url  = absoluteUrl(material.fileUrl);

  let body;
  if (type === 'pdf') {
    body = (
      <iframe
        src={url}
        title={material.fileName}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    );
  } else if (['jpg', 'jpeg', 'png'].includes(type)) {
    body = (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <img
          src={url}
          alt={material.fileName}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }}
        />
      </div>
    );
  } else {
    body = (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 14, padding: 24,
      }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          Preview not available for {type.toUpperCase()} files.
        </p>
        <button
          type="button"
          className="books-btn books-btn-primary"
          onClick={(e) => onDownload(material.fileUrl, material.fileName, material.materialId, e)}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : '⬇ Download to Open'}
        </button>
      </div>
    );
  }

  return (
    <div className="dm-preview-overlay" onClick={onClose}>
      <div
        className="dm-preview-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: 1200,
          height: '92vh',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="dm-preview-head" style={{ padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(type)}</span>
            <span className="dm-preview-title" title={material.fileName}>
              {material.fileName}
            </span>
            <TypeBadge type={type} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              type="button"
              className="books-btn books-btn-sm books-btn-primary"
              onClick={(e) => onDownload(material.fileUrl, material.fileName, material.materialId, e)}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </span>
              )}
            </button>
            <button
              type="button"
              className="books-modal-close"
              onClick={onClose}
              title="Close Preview"
            >
              ✕
            </button>
          </div>
        </div>
        <div
          className="dm-preview-body"
          style={{ flex: 1, height: 'calc(92vh - 60px)', background: type === 'pdf' ? '#323639' : '#f3f4f6' }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function DisplayMaterialsPage() {

  // FIX D2 + D3: use URL search params so selected folder persists on refresh
  // and browser Back/Forward work correctly
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubject = searchParams.get('folder') || '';

  const [subjects,         setSubjects]         = useState([]);
  const [materials,        setMaterials]        = useState([]);
  const [subjectsLoading,  setSubjectsLoading]  = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error,            setError]            = useState('');
  const [previewFile,      setPreviewFile]      = useState(null);
  const [downloadingId,    setDownloadingId]    = useState(null);

  // Create folder form
  const [showNewFolder,  setShowNewFolder]  = useState(false);
  const [newFolderName,  setNewFolderName]  = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError,    setFolderError]    = useState('');

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setFolderError('Folder name is required.');
      return;
    }

    const exists = subjects.some(
      (f) => f.folderName.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setFolderError(`Folder "${trimmed}" already exists.`);
      return;
    }

    setCreatingFolder(true);
    setFolderError('');
    try {
      const res = await springApi.post('/material-folders', {
        folderName: trimmed,
        parentFolderId: '',
      });
      setSubjects((prev) => [...prev, res]);
      handleFolderChange(res.folderId);
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (err) {
      setFolderError(err.message || 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // ── Direct Download via fetch + blob ─────────────────────────────────────
  const downloadFile = async (fileUrl, fileName, materialId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const fullUrl = absoluteUrl(fileUrl);
    setDownloadingId(materialId || 'current');
    try {
      const response = await fetch(fullUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'study-material.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName || 'study-material.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Load folders (subjects) on mount ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setSubjectsLoading(true);
      try {
        const res = await springApi.get('/material-folders', {
          params: { all: true },
        });
        setSubjects(Array.isArray(res) ? res : []);
      } catch {
        setError('Failed to load subjects. Please try again.');
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, []);

  // ── Load materials when folder changes ───────────────────────────────────
  const loadMaterials = useCallback(async (folderId) => {
    if (!folderId) { setMaterials([]); return; }
    setMaterialsLoading(true);
    setError('');
    try {
      const res = await springApi.get('/materials', {
        params: { folderId },
      });
      setMaterials(Array.isArray(res) ? res : []);
    } catch {
      setError('Failed to load materials. Please try again.');
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials(selectedSubject);
  }, [selectedSubject, loadMaterials]);

  // FIX D2 + D3: change folder by updating URL param
  // — this pushes a new history entry so Back button works correctly
  const handleFolderChange = (folderId) => {
    if (folderId) {
      setSearchParams({ folder: folderId });
    } else {
      setSearchParams({});
    }
  };

  const selectedFolder = subjects.find((s) => s.folderId === selectedSubject);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Study Materials</h1>
          <p className="page-subtitle">Select a subject to view its study materials</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      {/* ── Step 1: Folder Selection Box ─────────────────────────────── */}
      <div className="vb-form-panel">
        <p className="vb-form-title">Step 1 — Select Folder</p>

        {subjectsLoading ? (
          <p className="books-loading">Loading folders...</p>
        ) : (
          <>
            {subjects.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                No folders available yet. Create one below to get started.
              </p>
            ) : (
              <div className="books-form-group" style={{ maxWidth: 380 }}>
                <label className="books-form-label">Choose a folder</label>
                <select
                  className="books-form-control"
                  value={selectedSubject}
                  onChange={(e) => handleFolderChange(e.target.value)}
                >
                  <option value="">— Select folder —</option>
                  {subjects.map((s) => (
                    <option key={s.folderId} value={s.folderId}>
                      📁 {s.folderName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create new folder */}
            {!showNewFolder ? (
              <button
                type="button"
                className="books-btn books-btn-ghost"
                style={{ marginTop: 6 }}
                onClick={() => { setShowNewFolder(true); setFolderError(''); }}
              >
                📁 + Create New Folder
              </button>
            ) : (
              <div style={{ marginTop: 12, display: 'flex', gap: 8,
                            alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="books-form-group" style={{ margin: 0 }}>
                  <input
                    className={`books-form-control ${folderError ? 'err' : ''}`}
                    placeholder="e.g. Java Notes"
                    value={newFolderName}
                    onChange={(e) => { setNewFolderName(e.target.value); setFolderError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    autoFocus
                    style={{ width: 260 }}
                  />
                  {folderError && (
                    <p className="books-form-err" style={{ marginTop: 4 }}>
                      {folderError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                >
                  {creatingFolder ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  className="books-btn books-btn-ghost"
                  onClick={() => { setShowNewFolder(false); setNewFolderName(''); setFolderError(''); }}
                  disabled={creatingFolder}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected folder info */}
      {selectedFolder && !materialsLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            📁 <strong style={{ color: 'var(--text-primary)' }}>
              {selectedFolder.folderName}
            </strong>
            &nbsp;—&nbsp;{materials.length} file(s)
          </p>
          <button
            type="button"
            className="books-btn books-btn-sm books-btn-ghost"
            onClick={() => loadMaterials(selectedSubject)}
          >
            ↺ Refresh
          </button>
        </div>
      )}

      {/* Materials table */}
      {selectedSubject && (
        <>
          {materialsLoading ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-primary, #e5e7eb)', borderRadius: 8 }}>
              <div className="books-table-wrap">
                <table className="books-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%', textAlign: 'left', padding: '12px 16px' }}>Material name</th>
                      <th style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>File type</th>
                      <th style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>Size</th>
                      <th style={{ width: '24%', textAlign: 'left', padding: '12px 16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : materials.length === 0 ? (
            <div className="dm-empty">
              <div className="dm-empty-icon">📂</div>
              <p>No materials found for this subject.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="book-desk-table">
                <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-primary, #e5e7eb)', borderRadius: 8 }}>
                  <div className="books-table-wrap">
                    <table className="books-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40%', textAlign: 'left', padding: '12px 16px' }}>Material name</th>
                          <th style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>File type</th>
                          <th style={{ width: '18%', textAlign: 'center', padding: '12px 16px' }}>Size</th>
                          <th style={{ width: '24%', textAlign: 'left', padding: '12px 16px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m) => {
                          return (
                            <tr key={m.materialId}>
                              <td style={{ textAlign: 'left', verticalAlign: 'middle', padding: '12px 16px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, maxWidth: '100%' }}>
                                  <span style={{ fontSize: 18, flexShrink: 0 }}>{fileIcon(m.fileType)}</span>
                                  <span style={{
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }} title={m.fileName}>
                                    {m.fileName}
                                  </span>
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>
                                <TypeBadge type={m.fileType} />
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {m.fileSize
                                  ? m.fileSize < 1024 * 1024
                                    ? (m.fileSize / 1024).toFixed(1) + ' KB'
                                    : (m.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                                  : '—'}
                              </td>
                              <td style={{ textAlign: 'left', verticalAlign: 'middle', padding: '12px 16px' }}>
                                <div className="books-actions" style={{ alignItems: 'center', gap: 8 }}>
                                  <button
                                    type="button"
                                    className="books-btn books-btn-sm books-btn-ghost"
                                    onClick={() => setPreviewFile(m)}
                                    title="View file preview"
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                      View
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="books-btn books-btn-sm books-btn-primary"
                                    onClick={(e) => downloadFile(m.fileUrl, m.fileName, m.materialId, e)}
                                    disabled={downloadingId === m.materialId}
                                    title="Download directly to device"
                                  >
                                    {downloadingId === m.materialId ? (
                                      'Downloading...'
                                    ) : (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="7 10 12 15 17 10" />
                                          <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Download
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="book-mob-list">
                {materials.map((m) => {
                  return (
                    <div key={m.materialId} className="mob-card" style={{ marginBottom: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>
                          {fileIcon(m.fileType)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            margin: 0,
                            fontWeight: 600,
                            fontSize: 14,
                            color: 'var(--text-primary)',
                            wordBreak: 'break-word',
                            display: 'block'
                          }}>
                            {m.fileName}
                          </span>
                        </div>
                      </div>

                      <div className="mob-card-details" style={{ padding: 0, border: 'none' }}>
                        <div className="mob-card-row">
                          <span className="mob-card-label">File Type</span>
                          <span className="mob-card-value">
                            <TypeBadge type={m.fileType} />
                          </span>
                        </div>
                        <div className="mob-card-row">
                          <span className="mob-card-label">Size</span>
                          <span className="mob-card-value">
                            {m.fileSize
                              ? m.fileSize < 1024 * 1024
                                ? (m.fileSize / 1024).toFixed(1) + ' KB'
                                : (m.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="mob-card-actions" style={{ marginTop: 12, paddingTop: 10 }}>
                        <button
                          type="button"
                          className="books-btn books-btn-sm books-btn-ghost"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setPreviewFile(m)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </span>
                        </button>
                        <button
                          type="button"
                          className="books-btn books-btn-sm books-btn-primary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={(e) => downloadFile(m.fileUrl, m.fileName, m.materialId, e)}
                          disabled={downloadingId === m.materialId}
                        >
                          {downloadingId === m.materialId ? (
                            'Downloading...'
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          material={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={downloadFile}
          downloading={downloadingId === previewFile.materialId}
        />
      )}

    </div>
  );
}
