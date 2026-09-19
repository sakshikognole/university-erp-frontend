import { springApi } from '../services/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import HostelRoomModal from './HostelRoomModal';

export default function HostelBlockDetails({ block: blockProp, onBack }) {
  const [block,        setBlock]        = useState(blockProp);
  const [rooms,        setRooms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  // selected room for detail panel (click a row)
  const [selRoom,      setSelRoom]      = useState(null);

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

  // Use blockId field if available, otherwise fall back to MongoDB _id
  const lookupKey = block?.blockId || block?.id || block?._id || '';

  // ── Load rooms ────────────────────────────────────────────────────────
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [blkRes, roomRes] = await Promise.all([
        springApi.get(`/hostel-blocks/${lookupKey}`),
        springApi.get('/hostel-rooms', { params: { blockId: lookupKey } }),
      ]);
      setBlock(blkRes);
      const fetchedRooms = Array.isArray(roomRes) ? roomRes : [];
      setRooms(fetchedRooms);
      // keep selRoom in sync
      if (selRoom) {
        const updated = fetchedRooms.find(r => r.roomId === selRoom.roomId);
        setSelRoom(updated || null);
      }
    } catch {
      setError('Failed to load block details.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [lookupKey]); // eslint-disable-line

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

  const removePrnFromList = (prn) =>
    setPrnList((prev) => prev.filter((p) => p.prn !== prn));

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
  if (loading) return <p className="books-loading">Loading block details...</p>;
  if (!block)  return <p className="hst-empty">Block not found.</p>;

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
        <input
          className="hst-prn-input"
          placeholder="Enter PRN"
          value={prnInput}
          onChange={handlePrnInput}
        />
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
            color: namePreview === 'Not found' ? '#dc2626' : 'var(--text-primary)',
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
        blockId={lookupKey}
        onClose={() => setRoomModalOpen(false)}
        onSaved={handleRoomSaved}
      />

    </div>
  );
}
