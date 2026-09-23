import { springApi } from '../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────
const ALLOWED_EXT    = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
const MAX_SIZE_MB    = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Fixed teacher ID (no auth system)
const TEACHER_ID = 'TCH-001';
const HEADERS    = { 'X-User-Role': 'TEACHER', 'X-Teacher-Id': TEACHER_ID };

// Build absolute Spring Boot URL for file preview / download
// fileUrl from backend is a relative path like /api/materials/{id}/download
const onLocalhost  = window.location.hostname === 'localhost';
const SPRING_ORIGIN = onLocalhost
  ? 'http://localhost:8080'
  : 'https://university-erp-spring.onrender.com';

function absoluteUrl(relativeUrl) {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${SPRING_ORIGIN}${relativeUrl}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
}

function formatSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileIcon(ext) {
  switch (ext) {
    case 'pdf':  return '📕';
    case 'jpg':
    case 'jpeg':
    case 'png':  return '🖼️';
    case 'xls':
    case 'xlsx': return '📊';
    default:     return '📄';
  }
}

// ── Preview Modal ──────────────────────────────────────────────────────────
function PreviewModal({ material, onClose }) {
  if (!material) return null;
  const type = (material.fileType || '').toLowerCase();
  const url  = absoluteUrl(material.fileUrl);

  let body;
  if (type === 'pdf') {
    // FIX: use absolute Spring URL so browser loads from 8080, not 5173
    body = (
      <iframe
        src={url}
        title={material.fileName}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  } else if (['jpg', 'jpeg', 'png'].includes(type)) {
    // FIX: use <img> with absolute URL, not just filename
    body = (
      <img
        src={url}
        alt={material.fileName}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    );
  } else {
    // XLS/XLSX — cannot preview in browser, offer download only
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
// UploadMaterialsPage
// ══════════════════════════════════════════════════════════════════════════
export default function UploadMaterialsPage() {

  // ── Folder state ──────────────────────────────────────────────────────
  const [folders,          setFolders]          = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [foldersLoading,   setFoldersLoading]   = useState(true);

  // Create folder form
  const [showNewFolder,  setShowNewFolder]  = useState(false);
  const [newFolderName,  setNewFolderName]  = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError,    setFolderError]    = useState('');

  // Delete folder
  const [deletingFolderId, setDeletingFolderId] = useState(null);

  // ── File state ────────────────────────────────────────────────────────
  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileError,    setFileError]    = useState(''); // validation under Step 2
  const [dragOver,     setDragOver]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef(null);

  // ── Folder contents (Step 3) ──────────────────────────────────────────
  const [folderFiles,    setFolderFiles]    = useState([]);
  const [filesLoading,   setFilesLoading]   = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [previewFile,    setPreviewFile]    = useState(null);

  // ── Feedback ──────────────────────────────────────────────────────────
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load folders ──────────────────────────────────────────────────────
  const loadFolders = useCallback(async () => {
    setFoldersLoading(true);
    try {
      const res = await springApi.get('/material-folders', {
        headers: HEADERS,
        params:  { all: true },
      });
      setFolders(Array.isArray(res) ? res : []);
    } catch {
      setError('Failed to load folders.');
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  // ── Load folder files ──────────────────────────────────────────────────
  const loadFolderFiles = useCallback(async (folderId) => {
    if (!folderId) { setFolderFiles([]); return; }
    setFilesLoading(true);
    try {
      const res = await springApi.get('/materials', {
        headers: HEADERS,
        params:  { folderId },
      });
      setFolderFiles(Array.isArray(res) ? res : []);
    } catch {
      setError('Failed to load files.');
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolderFiles(selectedFolderId);
  }, [selectedFolderId, loadFolderFiles]);

  // ── Create folder ─────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) { setFolderError('Folder name is required.'); return; }

    // FIX: duplicate folder check (same name, case-insensitive)
    const exists = folders.some(
      (f) => f.folderName.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setFolderError(`Folder "${trimmed}" already exists.`);
      return;
    }

    setCreatingFolder(true);
    setFolderError('');
    try {
      const res = await springApi.post(
        '/material-folders',
        { folderName: trimmed, parentFolderId: '' },
        { headers: HEADERS },
      );
      setFolders((prev) => [...prev, res]);
      setSelectedFolderId(res.folderId);
      setNewFolderName('');
      setShowNewFolder(false);
      setSuccess(`Folder "${res.folderName}" created and selected.`);
    } catch (err) {
      setFolderError(err.message || 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // ── Delete folder ─────────────────────────────────────────────────────
  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(
      `Delete folder "${folder.folderName}" and all its files?\nThis action cannot be undone.`
    )) return;

    setDeletingFolderId(folder.folderId);
    try {
      await springApi.delete(`/material-folders/${folder.folderId}`, { headers: HEADERS });
      setFolders((prev) => prev.filter((f) => f.folderId !== folder.folderId));
      if (selectedFolderId === folder.folderId) {
        setSelectedFolderId('');
        setFolderFiles([]);
      }
      setSuccess(`Folder "${folder.folderName}" deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete folder.');
    } finally {
      setDeletingFolderId(null);
    }
  };

  // ── Validate and queue files ──────────────────────────────────────────
  const queueFiles = (rawFiles) => {
    // FIX: must select folder before adding files
    if (!selectedFolderId) {
      setFileError('Please select a folder in Step 1 before adding files.');
      return;
    }

    const toAdd   = [];
    const skipped = [];

    Array.from(rawFiles).forEach((file) => {
      const ext = getExt(file.name);

      if (!ALLOWED_EXT.includes(ext)) {
        skipped.push(`${file.name} — unsupported type (.${ext})`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        skipped.push(`${file.name} — exceeds ${MAX_SIZE_MB} MB`);
        return;
      }

      // FIX: duplicate check — same file name already in pending list
      const alreadyPending = pendingFiles.some(
        (p) => p.file.name.toLowerCase() === file.name.toLowerCase()
      );
      if (alreadyPending) {
        skipped.push(`${file.name} — already in upload queue`);
        return;
      }

      // FIX: duplicate check — same file name already uploaded in this folder
      const alreadyUploaded = folderFiles.some(
        (f) => f.fileName.toLowerCase() === file.name.toLowerCase()
      );
      if (alreadyUploaded) {
        skipped.push(`${file.name} — file already exists in this folder`);
        return;
      }

      toAdd.push({
        file,
        id:       Math.random().toString(36).slice(2),
        progress: 0,
        status:   'pending',
        error:    '',
      });
    });

    if (skipped.length) {
      setFileError(`Skipped: ${skipped.join(' | ')}`);
    } else {
      setFileError('');
    }
    if (toAdd.length) {
      setPendingFiles((prev) => [...prev, ...toAdd]);
    }
  };

  // ── Drag & drop ───────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    queueFiles(e.dataTransfer.files);
  };

  // ── Browse ────────────────────────────────────────────────────────────
  const onBrowse = (e) => {
    queueFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-selected after error
  };

  const removeFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
    setFileError('');
  };

  // FIX: reset failed files back to pending so upload button re-enables
  const retryFailed = () => {
    setPendingFiles((prev) =>
      prev.map((f) => f.status === 'error' ? { ...f, status: 'pending', error: '', progress: 0 } : f)
    );
    setFileError('');
  };

  // ── Upload all pending files ──────────────────────────────────────────
  const uploadAll = async () => {
    // FIX: validate folder selected before upload
    if (!selectedFolderId) {
      setFileError('Please select a folder in Step 1 before uploading.');
      return;
    }
    if (!pendingFiles.length) {
      setFileError('No files selected.');
      return;
    }

    setUploading(true);
    setFileError('');
    let doneCount = 0;

    for (const item of pendingFiles) {
      if (item.status === 'done') { doneCount++; continue; }
      if (item.status !== 'pending') continue;

      setPendingFiles((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, status: 'uploading' } : f)
      );

      const fd = new FormData();
      fd.append('file',     item.file);
      fd.append('folderId', selectedFolderId);

      try {
        await springApi.post('/materials/upload', fd, {
          headers: { ...HEADERS, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setPendingFiles((prev) =>
              prev.map((f) => f.id === item.id ? { ...f, progress: pct } : f)
            );
          },
        });
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'done', progress: 100 } : f
          )
        );
        doneCount++;
      } catch (err) {
        const msg = err.message || 'Upload failed.';
        // FIX: mark error but keep status as 'error' so retry button shows
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', error: msg } : f
          )
        );
      }
    }

    setUploading(false);
    if (doneCount > 0) {
      setSuccess(`${doneCount} file(s) uploaded successfully.`);
      loadFolderFiles(selectedFolderId);
    }
  };

  const clearDone = () =>
    setPendingFiles((prev) => prev.filter((f) => f.status !== 'done'));

  const clearAll = () => {
    setPendingFiles([]);
    setFileError('');
  };

  // ── Delete file ───────────────────────────────────────────────────────
  const handleDeleteFile = async (material) => {
    if (!window.confirm(`Delete "${material.fileName}"?`)) return;
    setDeletingFileId(material.materialId);
    try {
      await springApi.delete(`/materials/${material.materialId}`, { headers: HEADERS });
      setSuccess(`"${material.fileName}" deleted.`);
      loadFolderFiles(selectedFolderId);
    } catch (err) {
      setError(err.message || 'Failed to delete file.');
    } finally {
      setDeletingFileId(null);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const selectedFolder = folders.find((f) => f.folderId === selectedFolderId);
  const hasPending     = pendingFiles.some((f) => f.status === 'pending');
  const hasErrors      = pendingFiles.some((f) => f.status === 'error');
  const allDone        = pendingFiles.length > 0 &&
                         pendingFiles.every((f) => f.status === 'done');

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="dm-page-header">
        <div>
          <h1 className="page-title">Upload Materials</h1>
          <p className="dm-page-sub">
            Select a folder and upload study materials for students
          </p>
        </div>
      </div>

      {/* Global alerts */}
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

      {/* ── Step 1: Folder Selection ──────────────────────────────────── */}
      <div className="vb-form-panel">
        <p className="vb-form-title">Step 1 — Select Folder</p>

        {foldersLoading ? (
          <p className="books-loading">Loading folders...</p>
        ) : (
          <>
            {folders.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                No folders yet. Create one below to get started.
              </p>
            ) : (
              <div className="books-form-group" style={{ maxWidth: 380 }}>
                <label className="books-form-label">Choose a folder</label>
                <select
                  className="books-form-control"
                  value={selectedFolderId}
                  onChange={(e) => {
                    setSelectedFolderId(e.target.value);
                    setPendingFiles([]);
                    setFileError('');
                  }}
                >
                  <option value="">— Select folder —</option>
                  {folders.map((f) => (
                    <option key={f.folderId} value={f.folderId}>
                      📁 {f.folderName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create new folder */}
            {!showNewFolder ? (
              <button
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
                  {/* FIX: folder error shown right below the input, not above step 1 */}
                  {folderError && <p className="books-form-err">{folderError}</p>}
                </div>
                <button
                  className="books-btn books-btn-primary"
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                >
                  {creatingFolder ? 'Creating...' : 'Create'}
                </button>
                <button
                  className="books-btn books-btn-ghost"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName('');
                    setFolderError('');
                  }}
                  disabled={creatingFolder}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {/* Selected folder indicator */}
        {selectedFolder && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            ✅ Uploading to:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              📁 {selectedFolder.folderName}
            </strong>
          </p>
        )}
      </div>

      {/* ── Step 2: Upload Area ───────────────────────────────────────── */}
      <div className="vb-form-panel">
        <p className="vb-form-title">Step 2 — Add Files</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Supported: PDF, JPG, JPEG, PNG, XLS, XLSX &nbsp;·&nbsp; Max {MAX_SIZE_MB} MB per file
        </p>

        {/* Drag & Drop zone */}
        <div
          className={`dm-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dm-dropzone-icon">☁️</div>
          <p className="dm-dropzone-title">Drag &amp; Drop Files Here</p>
          <p className="dm-dropzone-sub">or click anywhere in this area</p>
          <div className="dm-dropzone-sep">or</div>
          <button
            className="books-btn books-btn-ghost"
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Browse Files from Drive
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
            style={{ display: 'none' }}
            onChange={onBrowse}
          />
        </div>

        {/* FIX: file-level validation shown inside Step 2, below the dropzone */}
        {fileError && (
          <div className="books-alert books-alert-error"
               style={{ marginTop: 10, marginBottom: 0 }}>
            <span>{fileError}</span>
            <button onClick={() => setFileError('')}>x</button>
          </div>
        )}

        {/* File queue */}
        {pendingFiles.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {pendingFiles.length} file(s) selected
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {/* FIX: Retry button for failed uploads — re-enables upload */}
                {hasErrors && (
                  <button className="books-btn books-btn-sm books-btn-warning"
                          onClick={retryFailed}>
                    ↺ Retry Failed
                  </button>
                )}
                {allDone && (
                  <button className="books-btn books-btn-sm books-btn-ghost"
                          onClick={clearDone}>
                    Clear Done
                  </button>
                )}
                <button className="books-btn books-btn-sm books-btn-ghost"
                        onClick={clearAll} disabled={uploading}>
                  Clear All
                </button>
              </div>
            </div>

            <ul className="dm-file-list">
              {pendingFiles.map((item) => {
                const ext = getExt(item.file.name);
                return (
                  <li key={item.id} className="dm-file-item">
                    <span className="dm-item-icon">{fileIcon(ext)}</span>
                    <span className="dm-file-item-name"
                          style={{ flex: 1, minWidth: 0, overflow: 'hidden',
                                   textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.file.name}
                    </span>
                    <span className="dm-file-item-size"
                          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatSize(item.file.size)}
                    </span>

                    {item.status === 'pending' && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)',
                                     flexShrink: 0 }}>
                        Ready
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <div style={{ display: 'flex', alignItems: 'center',
                                    gap: 6, flexShrink: 0 }}>
                        <div className="dm-progress-wrap" style={{ width: 60 }}>
                          <div className="dm-progress-bar"
                               style={{ width: item.progress + '%' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {item.progress}%
                        </span>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <span style={{ fontSize: 13, color: '#16a34a',
                                     fontWeight: 600, flexShrink: 0 }}>
                        ✓ Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span style={{ fontSize: 12, color: '#dc2626', flexShrink: 0 }}
                            title={item.error}>
                        ✕ Failed
                      </span>
                    )}

                    {item.status !== 'uploading' && (
                      <button
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={() => removeFile(item.id)}
                        disabled={uploading}
                        title="Remove"
                        style={{ flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Upload button — always visible when files are queued */}
        {pendingFiles.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center',
                        flexWrap: 'wrap' }}>
            <button
              className="books-btn books-btn-primary"
              onClick={uploadAll}
              disabled={uploading || (!hasPending && !hasErrors)}
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${pendingFiles.filter((f) => f.status === 'pending').length} File(s)`}
            </button>
            {/* FIX: folder hint shown INSIDE step 2, next to upload button */}
            {!selectedFolderId && (
              <span style={{ fontSize: 13, color: '#dc2626' }}>
                ← Select a folder in Step 1 first
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Step 3: Folder Contents ───────────────────────────────────── */}
      {selectedFolder && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 10,
                        flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p className="vb-section-title" style={{ marginBottom: 2 }}>
                📁 {selectedFolder.folderName} — Contents
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {folderFiles.length} file(s) in this folder
              </p>
            </div>
            <button
              className="books-btn books-btn-sm books-btn-ghost"
              onClick={() => loadFolderFiles(selectedFolderId)}
              disabled={filesLoading}
            >
              {filesLoading ? 'Refreshing...' : '↺ Refresh'}
            </button>
          </div>

          {/* All folders list — with delete button */}
          {folders.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600,
                          color: 'var(--text-secondary)', marginBottom: 8 }}>
                All Folders
              </p>
              {/* FIX mobile: card layout instead of table for folder list */}
              <div className="dm-folder-list">
                {folders.map((f) => (
                  <div
                    key={f.folderId}
                    className={`dm-folder-row ${f.folderId === selectedFolderId ? 'dm-folder-selected' : ''}`}
                    onClick={() => setSelectedFolderId(f.folderId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📁</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: f.folderId === selectedFolderId ? 700 : 500,
                                    fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap' }}>
                          {f.folderName}
                          {f.folderId === selectedFolderId && (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)',
                                           marginLeft: 6, fontWeight: 400 }}>
                              (selected)
                            </span>
                          )}
                        </p>
                        {/* FIX mobile: folder ID shown in full, wraps on small screens */}
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)',
                                    wordBreak: 'break-all' }}>
                          {f.folderId}
                        </p>
                      </div>
                    </div>
                    {/* FIX: Delete folder button */}
                    <button
                      className="books-btn books-btn-sm books-btn-danger"
                      style={{ flexShrink: 0 }}
                      disabled={deletingFolderId === f.folderId}
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                      title={`Delete folder "${f.folderName}"`}
                    >
                      {deletingFolderId === f.folderId ? '...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files in selected folder */}
          <p style={{ fontSize: 13, fontWeight: 600,
                      color: 'var(--text-secondary)', marginBottom: 8 }}>
            Files in &ldquo;{selectedFolder.folderName}&rdquo;
          </p>

          {filesLoading ? (
            <p className="books-loading">Loading files...</p>
          ) : folderFiles.length === 0 ? (
            <div className="dm-empty">
              <div className="dm-empty-icon">📂</div>
              <p>No files uploaded to this folder yet.</p>
            </div>
          ) : (
            /* FIX mobile: card layout for file list — no horizontal scrolling */
            <div className="dm-files-list">
              {folderFiles.map((file) => {
                const ext = (file.fileType || '').toLowerCase();
                const absUrl = absoluteUrl(file.fileUrl);
                return (
                  <div key={file.materialId} className="dm-file-card">
                    {/* File name row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start',
                                  gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(ext)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14,
                                    wordBreak: 'break-word' }}>
                          {file.fileName}
                        </p>
                        <p style={{ margin: 0, fontSize: 12,
                                    color: 'var(--text-secondary)' }}>
                          <span className={`dm-type-badge dm-type-${ext}`}>
                            {file.fileType || '—'}
                          </span>
                          &nbsp;·&nbsp;{formatSize(file.fileSize)}
                          &nbsp;·&nbsp;
                          {file.uploadedDate
                            ? new Date(file.uploadedDate).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {/* FIX: View opens inline for PDF/images, download prompt for others */}
                      <button
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={() => setPreviewFile(file)}
                      >
                        View
                      </button>
                      {/* FIX: Download uses absolute Spring URL */}
                      <a
                        href={absUrl}
                        download={file.fileName}
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⬇ Download
                      </a>
                      <button
                        className="books-btn books-btn-sm books-btn-danger"
                        onClick={() => handleDeleteFile(file)}
                        disabled={deletingFileId === file.materialId}
                      >
                        {deletingFileId === file.materialId ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {previewFile && (
        <PreviewModal
          material={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

    </div>
  );
}
