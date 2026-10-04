import { springApi } from '../services/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import HostelRoomModal from './HostelRoomModal';

export default function HostelBlockDetails({ block: blockProp, onBack }) {
  // Use blockId from prop — the key used to fetch full data
  const blockId = blockProp?.blockId || blockProp?.id || blockProp?._id || '';

  const [block,         setBlock]         = useState(null);
  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selRoom,       setSelRoom]       = useState(null);

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
  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Delete room "${room.roomNo}"?`)) return;
    try {
      await springApi.delete(`/hostel-rooms/${room.roomId}`);
      setSuccess('Room deleted.');
      if (selRoom?.roomId === room.roomId) setSelRoom(null);
      loadAll(true);
    } catch (err) {
      setError(err.message || 'Failed to delete room.');
    }
  };

  // ── Remove student from room ──────────────────────────────────────────
  const handleRemoveStudent = async (roomId, prn) => {
    if (!window.confirm('Remove this student from the room?')) return;
    try {
      await springApi.delete(`/hostel-rooms/${roomId}/students/${prn}`);
      setSuccess('Student removed.');
      loadAll(true);
    } catch (err) {
      setError(err.message || 'Failed to remove student.');
    }
  };

  // ── PRN lookup ────────────────────────────────────────────────────────
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
    setNamePreview('...');
    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await springApi.get(`/students/by-prn/${trimmed}`);
        setNamePreview(res.studentName || res.data?.studentName || 'Not found');
      } catch {
        setNamePreview('Not found');
      }
    }, 400);
  };

  // ── PRN lookup with fallback prefix ──────────────────────────────────
  const lookupPrnFull = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) { setNamePreview(''); return; }
    setNamePreview('...');
    const tryLookup = async (prn) => {
      const res = await springApi.get(`/students/by-prn/${encodeURIComponent(prn)}`);
      return res?.studentName ?? res?.data?.studentName ?? '';
    };
    try {
      const name = await tryLookup(trimmed);
      setNamePreview(name || 'Not found');
    } catch {
      // D2: try with PRN prefix if plain lookup fails
      if (!trimmed.toUpperCase().startsWith('PRN')) {
        try {
          const name2 = await tryLookup('PRN' + trimmed);
          setNamePreview(name2 || 'Not found');
          return;
        } catch { /* fall through */ }
      }
      setNamePreview('Not found');
    }
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
        <button className="hst-back-link" onClick={onBack}>
          ← Back to Hostel Management
        </button>
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
        <button className="hst-back-link" onClick={onBack}>
          ← Back to Hostel Management
        </button>
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
        <button className="hst-back-link" onClick={onBack}>
          ← Back to Hostel Management
        </button>
        <p className="hst-empty" style={{ marginTop: 24 }}>
          Hostel block not found. Please go back and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* Back */}
      <button className="hst-back-link" onClick={onBack}>
        ← Back to Hostel Management
      </button>

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">{block.hostelName}</h1>
          <p className="hst-page-sub">
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
        <button
          className="books-btn books-btn-primary"
          style={{ flexShrink: 0 }}
          onClick={() => setRoomModalOpen(true)}
        >
          + Add Room
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

      {/* ── Rooms Table ── */}
      <p className="hst-section-title">Rooms ({rooms.length})</p>

      {rooms.length === 0 ? (
        <div className="hst-empty">
          <p>No rooms yet. Click "+ Add Room" to add the first room.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="book-desk-table">
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Room No</th>
                    <th>Capacity</th>
                    <th>Occupancy</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const occupied = room.students?.length ?? 0;
                    const full     = occupied >= room.capacity;
                    const isSelected = selRoom?.roomId === room.roomId;
                    return (
                      <tr
                        key={room.roomId}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-secondary)' : undefined,
                        }}
                        onClick={() => setSelRoom(isSelected ? null : room)}
                      >
                        <td style={{ fontWeight: 600 }}>Room {room.roomNo}</td>
                        <td>{room.capacity}</td>
                        <td>{occupied} / {room.capacity}</td>
                        <td>
                          <span className={`hst-room-occupancy ${full ? 'full' : 'open'}`}>
                            {full ? 'Full' : 'Available'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="books-actions">
                            <button
                              className="books-btn books-btn-sm books-btn-danger"
                              onClick={() => handleDeleteRoom(room)}
                            >
                              Delete
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

          {/* UI improvement: Mobile room cards — expandable, no horizontal scroll */}
          <div className="book-mob-list">
            {rooms.map((room) => {
              const occupied   = room.students?.length ?? 0;
              const full       = occupied >= room.capacity;
              const isSelected = selRoom?.roomId === room.roomId;
              return (
                <div key={room.roomId} className="book-mob-card">
                  <button
                    type="button"
                    className="book-mob-header"
                    onClick={() => setSelRoom(isSelected ? null : room)}
                    aria-expanded={isSelected}
                  >
                    <div className="book-mob-summary">
                      <span className="book-mob-title">Room {room.roomNo}</span>
                      <span className={`hst-room-occupancy ${full ? 'full' : 'open'}`}
                            style={{ fontSize: 11, marginTop: 2 }}>
                        {full ? 'Full' : 'Available'}
                      </span>
                    </div>
                    <span className="book-mob-chevron">{isSelected ? '▲' : '▼'}</span>
                  </button>
                  {isSelected && (
                    <div className="book-mob-details">
                      {[
                        ['Capacity',   room.capacity],
                        ['Occupancy',  `${occupied} / ${room.capacity}`],
                      ].map(([label, val]) => (
                        <div key={label} className="book-mob-row">
                          <span className="book-mob-label">{label}</span>
                          <span className="book-mob-value">{val}</span>
                        </div>
                      ))}
                      <div className="book-mob-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDeleteRoom(room)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Room Detail Panel (shown when a row is clicked) ── */}
      {selRoom && (
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '16px 20px',
          marginTop: 16,
          background: 'var(--bg-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 12 }}>
            <div>
              <strong style={{ fontSize: 15 }}>Room {selRoom.roomNo}</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)',
                             marginLeft: 10 }}>
                {selRoom.students?.length ?? 0} / {selRoom.capacity} students
              </span>
            </div>
            <button
              className="books-btn books-btn-sm books-btn-ghost"
              onClick={() => setSelRoom(null)}
            >
              ✕ Close
            </button>
          </div>

          {/* Students in this room */}
          {(!selRoom.students || selRoom.students.length === 0) ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
              No students in this room yet.
            </p>
          ) : (
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>PRN</th>
                    <th>Student Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selRoom.students.map((s) => (
                    <tr key={s.studentPrn}>
                      <td>{s.studentPrn}</td>
                      <td>{s.studentName}</td>
                      <td>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() =>
                            handleRemoveStudent(selRoom.roomId, s.studentPrn)
                          }
                        >
                          Remove
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

      {/* ── Add Students Section ── */}
      <p className="hst-section-title">Add Students to Room</p>

      {/* Room selector */}
      <div className="books-form-group" style={{ maxWidth: 320, marginBottom: 14 }}>
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
      <div className="books-form-group" style={{ maxWidth: 320, marginBottom: 8 }}>
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
      <div className="books-form-group" style={{ maxWidth: 320, marginBottom: 8 }}>
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
            background: 'var(--bg-secondary)',
            color: namePreview === 'Not found' ? '#dc2626'
                 : namePreview && namePreview !== '...' ? '#16a34a'
                 : 'var(--text-primary)',
            cursor: 'default',
          }}
        />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Type a PRN — name appears below. Press <strong>,</strong> (comma) to add to the list.
      </p>

      {/* Pending student list */}
      {prnList.length > 0 && (
        <div className="books-table-wrap" style={{ marginBottom: 12 }}>
          <table className="books-table">
            <thead>
              <tr>
                <th>PRN</th>
                <th>Student Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prnList.map((p) => (
                <tr key={p.prn}>
                  <td>{p.prn}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>
                    <button
                      className="books-btn books-btn-sm books-btn-ghost"
                      onClick={() => removePrnFromList(p.prn)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="books-btn books-btn-primary"
              onClick={handleAddStudents}
              disabled={addingStuds || !selRoomId}
            >
              {addingStuds
                ? 'Adding...'
                : `Add ${prnList.length} Student(s) to Room`}
            </button>
            {!selRoomId && (
              <span style={{ marginLeft: 10, fontSize: 13, color: '#dc2626' }}>
                ← Select a room first
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add Room modal */}
      <HostelRoomModal
        isOpen={roomModalOpen}
        blockId={blockId}
        onClose={() => setRoomModalOpen(false)}
        onSaved={handleRoomSaved}
      />

    </div>
  );
}
