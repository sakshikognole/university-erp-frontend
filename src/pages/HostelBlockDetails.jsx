import { springApi } from '../services/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import HostelRoomModal from './HostelRoomModal';

const _IS_PROD = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

export default function HostelBlockDetails({ block: blockProp, onBack }) {
  // Use blockId from prop — the key used to fetch full data
  const blockId = blockProp?.blockId || blockProp?.id || blockProp?._id || '';

  const [block,         setBlock]         = useState(null);
  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selRoom,       setSelRoom]       = useState(null);
  const [delItem,       setDelItem]       = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  // PRN input state
  const [prnInput,    setPrnInput]    = useState('');
  const [namePreview, setNamePreview] = useState('');
  const [prnList,     setPrnList]     = useState([]);
  const [selRoomId,   setSelRoomId]   = useState('');
  const [addingStuds, setAddingStuds] = useState(false);
  const lookupTimer = useRef(null);

  // feedback
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load rooms ────────────────────────────────────────────────────────
  const loadAll = useCallback(async (silent = false) => {
    if (!blockId) {
      setLoadError('Invalid hostel block ID. Please go back and select a hostel.');
      setLoading(false);
      return;
    }
    if (!silent) { setLoading(true); setLoadError(''); }
    try {
      const [blkRes, roomRes] = await Promise.all([
        springApi.get(`/hostel-blocks/${blockId}`),
        springApi.get('/hostel-rooms', { params: { blockId } }),
      ]);
      setBlock(blkRes);
      const fetchedRooms = Array.isArray(roomRes) ? roomRes : [];
      setRooms(fetchedRooms);
      if (selRoom) {
        const updated = fetchedRooms.find(r => r.roomId === selRoom.roomId);
        setSelRoom(updated || null);
      }
    } catch (err) {
      if (!silent) setLoadError(err.message || 'Failed to load hostel details. Please try again.');
      else setError('Failed to refresh. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [blockId]); // eslint-disable-line

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Room saved ────────────────────────────────────────────────────────
  const handleRoomSaved = (msg) => {
    setSuccess(msg);
    setRoomModalOpen(false);
    loadAll(true);
  };

  // ── Delete room ───────────────────────────────────────────────────────
  const handleDeleteRoom = (room) => {
    setDelItem({
      title: 'Delete Room',
      description: `Are you sure you want to delete room "${room.roomNo}"? This action will permanently remove the record.`,
      itemName: `Room ${room.roomNo}`,
      itemSubtext: `${block?.hostelName || 'Hostel'} - Floor ${room.floor || 1}`,
      itemBadge: room.roomId,
      action: async () => {
        setDeleting(true);
        try {
          await springApi.delete(`/hostel-rooms/${room.roomId}`);
          setSuccess('Room deleted.');
          if (selRoom?.roomId === room.roomId) setSelRoom(null);
          setDelItem(null);
          loadAll(true);
        } catch (err) {
          setError(err.message || 'Failed to delete room.');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  // ── Remove student from room ──────────────────────────────────────────
  const handleRemoveStudent = (roomId, prn, studentName) => {
    setDelItem({
      title: 'Remove Student',
      description: 'Are you sure you want to remove this student from the room? This action will permanently remove the record.',
      itemName: studentName || prn,
      itemSubtext: `PRN: ${prn}`,
      itemBadge: roomId,
      action: async () => {
        setDeleting(true);
        try {
          await springApi.delete(`/hostel-rooms/${roomId}/students/${prn}`);
          setSuccess('Student removed.');
          setDelItem(null);
          loadAll(true);
        } catch (err) {
          setError(err.message || 'Failed to remove student.');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  // ── PRN lookup — robust check across Spring Boot and Node.js backend ──
  const lookupStudent = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) { setNamePreview(''); return; }
    setNamePreview('...');

    // 1. Check Spring Boot
    try {
      const res = await springApi.get(`/students/by-prn/${encodeURIComponent(trimmed)}`);
      const name = res?.studentName || res?.name || res?.data?.studentName || res?.data?.name || '';
      if (name) {
        setNamePreview(name);
        return;
      }
    } catch { /* continue */ }

    // 2. Try with/without PRN prefix
    try {
      const alt = trimmed.toUpperCase().startsWith('PRN') ? trimmed.substring(3) : 'PRN' + trimmed;
      const res2 = await springApi.get(`/students/by-prn/${encodeURIComponent(alt)}`);
      const name2 = res2?.studentName || res2?.name || res2?.data?.studentName || res2?.data?.name || '';
      if (name2) {
        setNamePreview(name2);
        return;
      }
    } catch { /* continue */ }

    // 3. Fallback to Node backend
    try {
      const token = localStorage.getItem('erp_token');
      const resNode = await fetch(`${NODE_URL}/super-admin/students`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (resNode.ok) {
        const students = await resNode.json();
        const found = Array.isArray(students)
          ? students.find((s) => {
              const sp = (s.prn || '').toLowerCase().trim();
              const tp = trimmed.toLowerCase();
              return sp === tp || sp === ('prn' + tp) || ('prn' + sp) === tp;
            })
          : null;
        const nameNode = found?.name || found?.studentName || '';
        if (nameNode) {
          setNamePreview(nameNode);
          return;
        }
      }
    } catch { /* not found */ }

    setNamePreview('Not found');
  };

  const handlePrnInput = (e) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const typed = value.slice(0, -1).trim();
      if (
        typed && namePreview &&
        namePreview !== '...' && namePreview !== 'Not found' &&
        !prnList.some((p) => p.prn === typed)
      ) {
        setPrnList((prev) => [...prev, { prn: typed, name: namePreview }]);
      }
      setPrnInput('');
      setNamePreview('');
      clearTimeout(lookupTimer.current);
      return;
    }
    setPrnInput(value);
    clearTimeout(lookupTimer.current);
    const trimmed = value.trim();
    if (!trimmed) { setNamePreview(''); return; }
    lookupTimer.current = setTimeout(() => lookupStudent(trimmed), 400);
  };

  // ── Add button handler ───────────────────────────────────────────────
  const addCurrentPrn = () => {
    const typed = prnInput.trim();
    if (typed && namePreview && namePreview !== '...' && namePreview !== 'Not found'
        && !prnList.some(p => p.prn === typed)) {
      setPrnList(prev => [...prev, { prn: typed, name: namePreview }]);
      setPrnInput(''); setNamePreview('');
    }
  };

  const removePrnFromList = (prn) =>
    setPrnList(prev => prev.filter(p => p.prn !== prn));

  // ── Add students to selected room ─────────────────────────────────────
  const handleAddStudents = async () => {
    if (!selRoomId) { setError('Please select a room first.'); return; }
    if (prnList.length === 0) { setError('No students in the list.'); return; }
    setAddingStuds(true);
    let added = 0;
    const errs = [];
    for (const s of prnList) {
      try {
        await springApi.post(`/hostel-rooms/${selRoomId}/students`, {
          studentPrn:  s.prn,
          studentName: s.name,
        });
        added++;
      } catch (err) {
        errs.push(err.message || `Failed to add ${s.prn}.`);
      }
    }
    setAddingStuds(false);
    if (added > 0) {
      setSuccess(`${added} student(s) added successfully.`);
      setPrnList([]);
      setPrnInput('');
      setNamePreview('');
      loadAll(true);
    }
    if (errs.length) setError(errs.join(' | '));
  };

  // ── Render ────────────────────────────────────────────────────────────
  // State 1: loading
  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            title="Back to Hostel Management"
            aria-label="Back to Hostel Management"
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Back to Hostel Management</span>
        </div>
        <p className="books-loading" style={{ marginTop: 24 }}>
          Loading hostel details...
        </p>
      </div>
    );
  }

  // State 2: API failed (load error)
  if (loadError) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            title="Back to Hostel Management"
            aria-label="Back to Hostel Management"
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Back to Hostel Management</span>
        </div>
        <div className="books-alert books-alert-error" style={{ marginTop: 20 }}>
          <span>{loadError}</span>
        </div>
        <button
          className="books-btn books-btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => loadAll()}
        >
          ↺ Retry
        </button>
      </div>
    );
  }

  // State 3: loaded but block has no data (should not happen but guard anyway)
  if (!block?.hostelName) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            title="Back to Hostel Management"
            aria-label="Back to Hostel Management"
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Back to Hostel Management</span>
        </div>
        <p className="hst-empty" style={{ marginTop: 24 }}>
          Hostel block not found. Please go back and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* ── Page Header ── */}
      <div className="feature-page-header">
        <div className="feature-page-header-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            title="Back to Hostel Management"
            aria-label="Back to Hostel Management"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{block.hostelName}</h1>
            <p className="page-subtitle">
              {block.blockId} &nbsp;·&nbsp;
              <span className={`hst-badge hst-badge-${block.type?.toLowerCase()}`}
                    style={{ fontSize: 11 }}>
                {block.type}
              </span>
              &nbsp;·&nbsp;
              <span className="hst-status" style={{ display: 'inline-flex' }}>
                <span className={`hst-status-dot ${block.active ? 'active' : 'inactive'}`} />
                {block.active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
        <div className="feature-page-header-actions">
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => setRoomModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add Room</span>
          </button>
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

      {/* ── Rooms Section ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Rooms ({rooms.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Select a room card to view allotted students and details
            </p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="hst-empty">
            <p>No rooms yet. Click "+ Add Room" to add the first room.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {rooms.map((room) => {
              const occupied = room.students?.length ?? 0;
              const full     = occupied >= room.capacity;
              const isSelected = selRoom?.roomId === room.roomId;
              return (
                <div
                  key={room.roomId}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active, #eff6ff)' : 'var(--bg-primary)',
                    border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                  onClick={() => setSelRoom(isSelected ? null : room)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Room {room.roomNo}
                    </span>
                    <span className={`hst-room-occupancy ${full ? 'full' : 'open'}`}>
                      {full ? 'Full' : 'Available'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <span>Capacity: <strong style={{ color: 'var(--text-primary)' }}>{room.capacity}</strong></span>
                    <span>Occupancy: <strong style={{ color: 'var(--text-primary)' }}>{occupied} / {room.capacity}</strong></span>
                  </div>

                  {/* Visual occupancy progress bar */}
                  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round((occupied / Math.max(1, room.capacity)) * 100))}%`,
                      height: '100%',
                      background: full ? '#dc2626' : '#2563eb',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#2563eb' : 'var(--text-secondary)'
                    }}>
                      {isSelected ? '✓ Viewing Students' : 'Click to view students'}
                    </span>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                      title="Delete Room"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room);
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Room Detail Panel (shown when a room card is selected) ── */}
      {selRoom && (
        <div style={{
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: '2rem',
          background: 'var(--bg-primary)',
          boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Users size={18} style={{ color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 15 }}>Students Allotted to Room {selRoom.roomNo}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 10 }}>
                  ({selRoom.students?.length ?? 0} / {selRoom.capacity} allotted)
                </span>
              </div>
            </div>
            <button
              className="books-btn books-btn-sm books-btn-ghost"
              onClick={() => setSelRoom(null)}
              style={{ alignSelf: 'flex-start', flexShrink: 0 }}
            >
              ✕ Close
            </button>
          </div>

          {/* Students in this room */}
          {(!selRoom.students || selRoom.students.length === 0) ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
              No students in this room yet. Use the section below to add students.
            </p>
          ) : (
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>PRN</th>
                    <th>Student Name</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selRoom.students.map((s) => (
                    <tr key={s.studentPrn}>
                      <td style={{ fontWeight: 600 }}>{s.studentPrn}</td>
                      <td>{s.studentName}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleRemoveStudent(selRoom.roomId, s.studentPrn, s.studentName)}
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Add Students to Room Section (visually separated card below) ── */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Add Students to Room
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Select a room and enter student PRN to allocate students to hostel rooms
          </p>
        </div>

        {/* Room selector */}
        <div className="books-form-group" style={{ maxWidth: 360, marginBottom: 14 }}>
          <label className="books-form-label">Select Room</label>
          <select
            className="books-form-control"
            value={selRoomId}
            onChange={(e) => setSelRoomId(e.target.value)}
          >
            <option value="">— Select Room —</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}
                      disabled={r.students?.length >= r.capacity}>
                Room {r.roomNo} ({r.students?.length ?? 0}/{r.capacity})
                {r.students?.length >= r.capacity ? ' — Full' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* PRN input */}
        <div className="books-form-group" style={{ maxWidth: 360, marginBottom: 8 }}>
          <label className="books-form-label">PRN</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="hst-prn-input"
              style={{ flex: 1 }}
              placeholder="Enter PRN"
              value={prnInput}
              onChange={handlePrnInput}
            />
            <button
              type="button"
              className="books-btn books-btn-sm books-btn-ghost"
              onClick={addCurrentPrn}
              disabled={!namePreview || namePreview === '...' || namePreview === 'Not found'}
              style={{ flexShrink: 0 }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Name preview */}
        <div className="books-form-group" style={{ maxWidth: 360, marginBottom: 8 }}>
          <label className="books-form-label">Student Name</label>
          <input
            className="hst-prn-input"
            readOnly
            value={
              namePreview === '...'       ? 'Looking up...' :
              namePreview === 'Not found' ? 'Student not found' :
              namePreview
            }
            placeholder="Name will appear here"
            style={{
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-secondary)',
              color: namePreview === 'Not found' ? '#dc2626'
                   : namePreview && namePreview !== '...' ? '#16a34a'
                   : 'var(--text-primary)',
              cursor: 'default',
            }}
          />
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Type a PRN — student name is retrieved automatically. Click <strong>Add</strong> or press <strong>,</strong> to stage the student.
        </p>

        {/* Pending student list */}
        {prnList.length > 0 && (
          <div className="books-table-wrap" style={{ marginBottom: 14 }}>
            <table className="books-table">
              <thead>
                <tr>
                  <th>PRN</th>
                  <th>Student Name</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {prnList.map((p) => (
                  <tr key={p.prn}>
                    <td>{p.prn}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => removePrnFromList(p.prn)}
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="books-btn books-btn-primary"
                onClick={handleAddStudents}
                disabled={addingStuds || !selRoomId}
              >
                {addingStuds
                  ? 'Adding...'
                  : `Add ${prnList.length} Student(s) to Room`}
              </button>
              {!selRoomId && (
                <span style={{ fontSize: 13, color: '#dc2626' }}>
                  ← Select a room above first
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Room modal */}
      <HostelRoomModal
        isOpen={roomModalOpen}
        blockId={blockId}
        onClose={() => setRoomModalOpen(false)}
        onSaved={handleRoomSaved}
      />

      <ConfirmDialog
        isOpen={!!delItem}
        title={delItem?.title}
        description={delItem?.description}
        itemName={delItem?.itemName}
        itemSubtext={delItem?.itemSubtext}
        itemBadge={delItem?.itemBadge}
        onConfirm={() => delItem?.action && delItem.action()}
        onCancel={() => setDelItem(null)}
        loading={deleting}
      />

    </div>
  );
}
