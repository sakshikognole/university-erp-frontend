import { springApi } from '../services/api';
import { useState, useEffect } from 'react';

// file type icon helper
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

// file type badge
function TypeBadge({ type }) {
  const t = (type || '').toLowerCase();
  return <span className={`dm-type-badge dm-type-${t}`}>{type || '—'}</span>;
}

export default function DisplayMaterialsPage() {
  const [subjects,         setSubjects]         = useState([]);
  const [selectedSubject,  setSelectedSubject]  = useState('');
  const [materials,        setMaterials]        = useState([]);
  const [subjectsLoading,  setSubjectsLoading]  = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error,            setError]            = useState('');

  // Load all folders (subjects) on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await springApi.get('/material-folders', {
          params: { all: true },
        });
        setSubjects(Array.isArray(res) ? res : []);
      } catch {
        setError('Failed to load subjects.');
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, []);

  // Load materials when subject changes
  useEffect(() => {
    if (!selectedSubject) { setMaterials([]); return; }

    const load = async () => {
      setMaterialsLoading(true);
      setError('');
      try {
        const res = await springApi.get('/materials', {
          params: { folderId: selectedSubject },
        });
        setMaterials(Array.isArray(res) ? res : []);
      } catch {
        setError('Failed to load materials.');
      } finally {
        setMaterialsLoading(false);
      }
    };
    load();
  }, [selectedSubject]);

  return (
    <div className="page-container">

      {/* Header */}
      <div className="st-page-header">
        <div>
          <h1 className="page-title">Display Materials</h1>
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
      <div className="books-form-group" style={{ maxWidth: 340, marginBottom: 24 }}>
        <label className="books-form-label">Subject</label>
        {subjectsLoading ? (
          <p className="books-loading">Loading subjects...</p>
        ) : (
          <select
            className="books-form-control"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
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

      {/* Materials table */}
      {selectedSubject && (
        <>
          {materialsLoading ? (
            <p className="books-loading">Loading materials...</p>
          ) : materials.length === 0 ? (
            <p className="st-empty">No materials found for this subject.</p>
          ) : (
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Material Name</th>
                    <th>File Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.materialId}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{fileIcon(m.fileType)}</span>
                          <span>{m.fileName}</span>
                        </span>
                      </td>
                      <td>
                        <TypeBadge type={m.fileType} />
                      </td>
                      <td>
                        <div className="books-actions">
                          {/* View — opens inline in browser */}
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="books-btn books-btn-sm books-btn-ghost"
                          >
                            View
                          </a>
                          {/* Download — forces file download */}
                          <a
                            href={m.fileUrl}
                            download={m.fileName}
                            className="books-btn books-btn-sm books-btn-primary"
                          >
                            Download
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

    </div>
  );
}
