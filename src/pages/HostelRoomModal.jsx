import { springApi } from '../services/api';
import { useState, useEffect, useRef } from 'react';

const EMPTY = { roomNo: '', capacity: '' };

export default function HostelRoomModal({ isOpen, blockId, onClose, onSaved }) {
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [apiErr,      setApiErr]      = useState('');

  // optional student section
  const [prnInput,    setPrnInput]    = useState('');
  const [namePreview, setNamePreview] = useState('');
  const [prnList,     setPrnList]     = useState([]);
  const lookupTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setErrors({});
      setApiErr('');
      setPrnInput('');
      setNamePreview('');
      setPrnList([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
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

  const removePrn = (prn) =>
    setPrnList((prev) => prev.filter((p) => p.prn !== prn));

  // ── Validate ──────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.roomNo.trim())                          e.roomNo   = 'Room number is required.';
    if (!form.capacity || Number(form.capacity) <= 0) e.capacity = 'Capacity must be greater than 0.';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiErr('');
    try {
      // 1. Create the room
      const res = await springApi.post('/hostel-rooms', {
        blockId,
        roomNo:   form.roomNo.trim(),
        capacity: Number(form.capacity),
      });
      const newRoom = res;

      // 2. Add students if any were listed (optional)
      for (const s of prnList) {
        try {
          await springApi.post(`/hostel-rooms/${newRoom.roomId}/students`, {
            studentPrn:  s.prn,
            studentName: s.name,
          });
        } catch {
          // silently skip if student fails — room was still created
        }
      }

      onSaved(
        prnList.length > 0
          ? `Room added with ${prnList.length} student(s).`
          : 'Room added successfully.'
      );
    } catch (err) {
      setApiErr(err.message || 'Failed to add room.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 460 }}>

        <div className="books-modal-head">
          <h3>Add Room</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {apiErr && (
              <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
                <span>{apiErr}</span>
              </div>
            )}

            {/* Room No + Capacity */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Room No *</label>
                <input
                  className={`books-form-control ${errors.roomNo ? 'err' : ''}`}
                  name="roomNo"
                  value={form.roomNo}
                  onChange={change}
                  placeholder="e.g. 101"
                />
                {errors.roomNo && <p className="books-form-err">{errors.roomNo}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Capacity *</label>
                <input
                  className={`books-form-control ${errors.capacity ? 'err' : ''}`}
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={change}
                  placeholder="e.g. 4"
                />
                {errors.capacity && <p className="books-form-err">{errors.capacity}</p>}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border-color)',
                          margin: '14px 0 12px',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          paddingTop: 12 }}>
              Add Students (optional)
            </div>

            {/* PRN input */}
            <div className="books-form-group" style={{ marginBottom: 8 }}>
              <label className="books-form-label">PRN</label>
              <input
                className="hst-prn-input"
                style={{ width: '100%' }}
                placeholder="Enter PRN"
                value={prnInput}
                onChange={handlePrnInput}
              />
            </div>

            {/* Name preview */}
            <div className="books-form-group" style={{ marginBottom: 6 }}>
              <label className="books-form-label">Student Name</label>
              <input
                className="hst-prn-input"
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  cursor: 'default',
                  color: namePreview === 'Not found' ? '#dc2626' : 'var(--text-primary)',
                }}
                readOnly
                value={
                  namePreview === '...'       ? 'Looking up...' :
                  namePreview === 'Not found' ? 'Student not found' :
                  namePreview
                }
                placeholder="Name will appear here"
              />
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Type PRN, name appears — press <strong>,</strong> to add to list.
            </p>

            {/* Pending students */}
            {prnList.length > 0 && (
              <div className="books-table-wrap" style={{ marginTop: 4 }}>
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>PRN</th>
                      <th>Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prnList.map((p) => (
                      <tr key={p.prn}>
                        <td style={{ fontSize: 13 }}>{p.prn}</td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                        <td>
                          <button
                            type="button"
                            className="books-btn books-btn-sm books-btn-ghost"
                            onClick={() => removePrn(p.prn)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
                    onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary"
                    disabled={saving}>
              {saving
                ? 'Adding...'
                : prnList.length > 0
                  ? `Add Room + ${prnList.length} Student(s)`
                  : 'Add Room'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
