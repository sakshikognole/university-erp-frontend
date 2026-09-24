import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// FIX D1: absolute Spring Boot URL so downloads/previews work correctly
const onLocalhost   = window.location.hostname === 'localhost';
const SPRING_ORIGIN = onLocalhost
  ? 'http://localhost:8080'
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
      {[60, 20, 20].map((w, i) => (
        <td key={i}>
          <div style={{
            height: 13,
            width: `${w}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'books-shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────
function PreviewModal({ material, onClose }) {
  if (!material) return null;
  const type = (material.fileType || '').toLowerCase();
  const url  = absoluteUrl(material.fileUrl);

  let body;
  if (type === 'pdf') {
    body = (
      <iframe
        src={url}
        title={material.fileName}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  } else if (['jpg', 'jpeg', 'png'].includes(type)) {
    body = (
      <img
        src={url}
        alt={material.fileName}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    );
  } else {
    body = (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Preview not available for {type.toUpperCase()} files.
        </p>
        <a
          href={url}
          download={material.fileName}
          className="books-btn books-btn-primary"
        >
          ⬇ Download to Open
        </a>
      </div>
    );
  }

  return (
    <div className="dm-preview-overlay" onClick={onClose}>
      <div className="dm-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-preview-head">
          <span className="dm-preview-title">
            {fileIcon(type)} {material.fileName}
          </span>
          <a
            href={url}
            download={material.fileName}
            className="books-btn books-btn-sm books-btn-ghost"
            onClick={(e) => e.stopPropagation()}
          >
            ⬇ Download
          </a>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="dm-preview-body">{body}</div>
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
      <div className="st-page-header">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <p className="st-page-sub">Select a subject to view its study materials</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      {/* Subject dropdown */}
      <div className="books-form-group" style={{ maxWidth: 360, marginBottom: 20 }}>
        <label className="books-form-label">Select Subject / Folder</label>
        {subjectsLoading ? (
          <p className="books-loading">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            No folders available yet.
          </p>
        ) : (
          <select
            className="books-form-control"
            value={selectedSubject}
            onChange={(e) => handleFolderChange(e.target.value)}
          >
            <option value="">— Select Subject —</option>
            {subjects.map((s) => (
              <option key={s.folderId} value={s.folderId}>
                📁 {s.folderName}
              </option>
            ))}
          </select>
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
          {/* OBSERVATION FIX: skeleton loader while loading — no blank screen */}
          {materialsLoading ? (
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Material Name</th>
                    <th>File Type</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
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
                <div className="books-table-wrap">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45%' }}>Material Name</th>
                        <th>File Type</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => {
                        const absUrl = absoluteUrl(m.fileUrl);
                        const ext    = (m.fileType || '').toLowerCase();
                        return (
                          <tr key={m.materialId}>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{fileIcon(m.fileType)}</span>
                                <span style={{ wordBreak: 'break-word' }}>{m.fileName}</span>
                              </span>
                            </td>
                            <td><TypeBadge type={m.fileType} /></td>
                            <td style={{ fontSize: 13, color: 'var(--text-secondary)',
                                         whiteSpace: 'nowrap' }}>
                              {m.fileSize
                                ? m.fileSize < 1024 * 1024
                                  ? (m.fileSize / 1024).toFixed(1) + ' KB'
                                  : (m.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                                : '—'}
                            </td>
                            <td>
                              <div className="books-actions">
                                {/* View — inline preview modal */}
                                <button
                                  className="books-btn books-btn-sm books-btn-ghost"
                                  onClick={() => setPreviewFile(m)}
                                >
                                  View
                                </button>
                                {/* FIX D1: use absolute URL for download */}
                                <a
                                  href={absUrl}
                                  download={m.fileName}
                                  className="books-btn books-btn-sm books-btn-primary"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ⬇ Download
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="book-mob-list">
                {materials.map((m) => {
                  const absUrl = absoluteUrl(m.fileUrl);
                  return (
                    <div key={m.materialId} className="dm-file-card">
                      <div style={{ display: 'flex', alignItems: 'flex-start',
                                    gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>
                          {fileIcon(m.fileType)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14,
                                      wordBreak: 'break-word' }}>
                            {m.fileName}
                          </p>
                          <p style={{ margin: 0, fontSize: 12,
                                      color: 'var(--text-secondary)' }}>
                            <TypeBadge type={m.fileType} />
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          style={{ flex: 1 }}
                          onClick={() => setPreviewFile(m)}
                        >
                          View
                        </button>
                        {/* FIX D1: absolute URL for mobile download */}
                        <a
                          href={absUrl}
                          download={m.fileName}
                          className="books-btn books-btn-sm books-btn-primary"
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇ Download
                        </a>
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
        />
      )}

    </div>
  );
}
