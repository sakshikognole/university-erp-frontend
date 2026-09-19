import { springApi } from '../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';

// â--â-- Constants â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
const ALLOWED_EXT   = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
const MAX_SIZE_MB   = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Fixed teacher ID since no login system
const TEACHER_ID = 'TCH-001';
const HEADERS    = { 'X-User-Role': 'TEACHER', 'X-Teacher-Id': TEACHER_ID };

// â--â-- Helpers â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
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
    case 'pdf':  return 'ð---';
    case 'jpg':
    case 'jpeg':
    case 'png':  return 'ð--¼ï¸-';
    case 'xls':
    case 'xlsx': return 'ð---';
    default:     return 'ð---';
  }
}

// â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
// UploadMaterialsPage
// â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
export default function UploadMaterialsPage() {
  // â--â-- Folder state â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const [folders,          setFolders]          = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [foldersLoading,   setFoldersLoading]   = useState(true);

  // new folder form
  const [showNewFolder,    setShowNewFolder]    = useState(false);
  const [newFolderName,    setNewFolderName]    = useState('');
  const [creatingFolder,   setCreatingFolder]   = useState(false);
  const [folderError,      setFolderError]      = useState('');

  // â--â-- File state â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const [pendingFiles,  setPendingFiles]  = useState([]);  // {file, id, progress, status, error}
  const [dragOver,      setDragOver]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  // â--â-- Folder contents (Step 3) â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const [folderFiles,     setFolderFiles]     = useState([]);
  const [filesLoading,    setFilesLoading]    = useState(false);
  const [deletingFileId,  setDeletingFileId]  = useState(null);
  const [previewFile,     setPreviewFile]     = useState(null);

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
      // silently fail â-- main error shown elsewhere
    } finally {
      setFilesLoading(false);
    }
  }, []);

  // Reload folder files whenever the selected folder changes
  useEffect(() => {
    loadFolderFiles(selectedFolderId);
  }, [selectedFolderId, loadFolderFiles]);

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

  // â--â-- Feedback â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // â--â-- Load folders on mount â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
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
  };

  // â--â-- Create folder â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { setFolderError('Folder name is required.'); return; }
    setCreatingFolder(true);
    setFolderError('');
    try {
      const res = await springApi.post(
        '/material-folders',
        { folderName: newFolderName.trim(), parentFolderId: '' },
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

  // â--â-- Validate and queue files â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const queueFiles = (rawFiles) => {
    const toAdd = [];
    const skipped = [];

    Array.from(rawFiles).forEach((file) => {
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.includes(ext)) {
        skipped.push(`${file.name} â-- unsupported type (.${ext})`);
      } else if (file.size > MAX_SIZE_BYTES) {
        skipped.push(`${file.name} â-- exceeds ${MAX_SIZE_MB} MB`);
      } else {
        toAdd.push({
          file,
          id:       Math.random().toString(36).slice(2),
          progress: 0,
          status:   'pending', // pending | uploading | done | error
          error:    '',
        });
      }
    });

    if (skipped.length) {
      setError(`Skipped: ${skipped.join(' | ')}`);
    }
    if (toAdd.length) {
      setPendingFiles((prev) => [...prev, ...toAdd]);
    }
  };

  // â--â-- Drag & drop handlers â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    queueFiles(e.dataTransfer.files);
  };

  // â--â-- Browse handler â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const onBrowse = (e) => {
    queueFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id) =>
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));

  // â--â-- Upload all pending files â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const uploadAll = async () => {
    if (!selectedFolderId) { setError('Please select a folder first.'); return; }
    if (!pendingFiles.length) { setError('No files selected.'); return; }

    setUploading(true);
    let doneCount = 0;

    for (const item of pendingFiles) {
      if (item.status === 'done') { doneCount++; continue; }

      // Mark as uploading
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

  const clearAll = () => setPendingFiles([]);

  // â--â-- Derived â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const selectedFolder  = folders.find((f) => f.folderId === selectedFolderId);
  const hasPending      = pendingFiles.some((f) => f.status === 'pending');
  const allDone         = pendingFiles.length > 0 &&
                          pendingFiles.every((f) => f.status === 'done');

  // â--â-- File type badge â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  function TypeBadge({ type }) {
    const t = (type || '').toLowerCase();
    return <span className={`dm-type-badge dm-type-${t}`}>{type || 'â--'}</span>;
  }

  // â--â-- Preview modal â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  function PreviewModal({ material, onClose }) {
    if (!material) return null;
    const type = (material.fileType || '').toLowerCase();
    const url  = material.fileUrl;
    let body;
    if (type === 'pdf') {
      body = <iframe src={url} title={material.fileName} />;
    } else if (['jpg','jpeg','png'].includes(type)) {
      body = <img src={url} alt={material.fileName} />;
    } else {
      body = (
        <div className="dm-preview-no-preview">
          <div style={{ fontSize: 40, marginBottom: 10 }}>ð---</div>
          <p>Preview not available for {type.toUpperCase()} files.</p>
          <a href={url} download={material.fileName}
             className="books-btn books-btn-primary"
             style={{ marginTop: 12, display: 'inline-block' }}>
            Download File
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
            <a href={url} download={material.fileName}
               className="books-btn books-btn-sm books-btn-ghost">
              â¬- Download
            </a>
            <button className="books-modal-close" onClick={onClose}>x</button>
          </div>
          <div className="dm-preview-body">{body}</div>
        </div>
      </div>
    );
  }

  // â--â-- Render â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
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

      {/* â--â-- Step 1: Folder Selection â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      <div className="vb-form-panel">
        <p className="vb-form-title">Step 1 â-- Select Folder</p>

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
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                  <option value="">â-- Select folder â--</option>
                  {folders.map((f) => (
                    <option key={f.folderId} value={f.folderId}>
                      ð--- {f.folderName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create new folder toggle */}
            {!showNewFolder ? (
              <button
                className="books-btn books-btn-ghost"
                style={{ marginTop: 6 }}
                onClick={() => { setShowNewFolder(true); setFolderError(''); }}
              >
                ð--- + Create New Folder
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
                  onClick={() => { setShowNewFolder(false); setNewFolderName(''); setFolderError(''); }}
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
            â-- Uploading to: <strong style={{ color: 'var(--text-primary)' }}>
              ð--- {selectedFolder.folderName}
            </strong>
          </p>
        )}
      </div>

      {/* â--â-- Step 2: Upload Area â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      <div className="vb-form-panel">
        <p className="vb-form-title">Step 2 â-- Add Files</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Supported: PDF, JPG, JPEG, PNG, XLS, XLSX &nbsp;Â·&nbsp; Max {MAX_SIZE_MB} MB per file
        </p>

        {/* Drag & Drop zone */}
        <div
          className={`dm-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dm-dropzone-icon">â--ï¸-</div>
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

        {/* File queue */}
        {pendingFiles.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {pendingFiles.length} file(s) selected
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
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
                    <span className="dm-file-item-name">{item.file.name}</span>
                    <span className="dm-file-item-size">{formatSize(item.file.size)}</span>

                    {/* Status indicators */}
                    {item.status === 'pending' && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Ready
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="dm-progress-wrap" style={{ width: 80 }}>
                          <div className="dm-progress-bar"
                               style={{ width: item.progress + '%' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {item.progress}%
                        </span>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        â-- Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span style={{ fontSize: 12, color: '#dc2626' }} title={item.error}>
                        â-- {item.error}
                      </span>
                    )}

                    {/* Remove button (only if not uploading) */}
                    {item.status !== 'uploading' && (
                      <button
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={() => removeFile(item.id)}
                        disabled={uploading}
                        title="Remove"
                        style={{ flexShrink: 0 }}
                      >
                        â--
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* â--â-- Upload button â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {pendingFiles.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="books-btn books-btn-primary"
            onClick={uploadAll}
            disabled={uploading || !hasPending}
          >
            {uploading
              ? 'Uploading...'
              : `Upload ${pendingFiles.filter((f) => f.status === 'pending').length} File(s)`}
          </button>
          {!selectedFolderId && (
            <span style={{ fontSize: 13, color: '#dc2626' }}>
              â-- Select a folder first
            </span>
          )}
        </div>
      )}

      {/* â--â-- Step 3: Folder Contents â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {selectedFolder && (
        <div style={{ marginTop: 28 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p className="vb-section-title" style={{ marginBottom: 2 }}>
                ð--- {selectedFolder.folderName} â-- Contents
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {folderFiles.length} file(s) uploaded in this folder
              </p>
            </div>
            <button
              className="books-btn books-btn-sm books-btn-ghost"
              onClick={() => loadFolderFiles(selectedFolderId)}
              disabled={filesLoading}
            >
              {filesLoading ? 'Refreshing...' : 'â-º Refresh'}
            </button>
          </div>

          {/* All folders list */}
          {folders.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600,
                          color: 'var(--text-secondary)', marginBottom: 8 }}>
                All Folders
              </p>
              <div className="dm-table-wrap">
                <table className="dm-table">
                  <thead>
                    <tr>
                      <th>Folder Name</th>
                      <th>Folder ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folders.map((f) => (
                      <tr
                        key={f.folderId}
                        style={{
                          background: f.folderId === selectedFolderId
                            ? 'var(--bg-secondary)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedFolderId(f.folderId)}
                      >
                        <td>
                          <div className="dm-name-cell">
                            <span className="dm-item-icon">ð---</span>
                            <span className="dm-item-name"
                                  style={{ fontWeight: f.folderId === selectedFolderId ? 700 : 500 }}>
                              {f.folderName}
                              {f.folderId === selectedFolderId && (
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)',
                                               marginLeft: 6, fontWeight: 400 }}>
                                  (selected)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {f.folderId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <div className="dm-empty-icon">ð---</div>
              <p>No files uploaded to this folder yet.</p>
            </div>
          ) : (
            <div className="dm-table-wrap">
              <table className="dm-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {folderFiles.map((file) => {
                    const ext = (file.fileType || '').toLowerCase();
                    return (
                      <tr key={file.materialId}>
                        <td>
                          <div className="dm-name-cell"
                               onClick={() => setPreviewFile(file)}
                               style={{ cursor: 'pointer' }}>
                            <span className="dm-item-icon">{fileIcon(ext)}</span>
                            <span className="dm-item-name">{file.fileName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`dm-type-badge dm-type-${ext}`}>
                            {file.fileType || 'â--'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {formatSize(file.fileSize)}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {file.uploadedDate
                            ? new Date(file.uploadedDate).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                            : 'â--'}
                        </td>
                        <td>
                          <div className="books-actions">
                            <button
                              className="books-btn books-btn-sm books-btn-ghost"
                              onClick={() => setPreviewFile(file)}
                            >
                              View
                            </button>
                            <a
                              href={file.fileUrl}
                              download={file.fileName}
                              className="books-btn books-btn-sm books-btn-ghost"
                            >
                              â¬-
                            </a>
                            <button
                              className="books-btn books-btn-sm books-btn-danger"
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingFileId === file.materialId}
                            >
                              {deletingFileId === file.materialId ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
