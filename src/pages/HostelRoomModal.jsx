import { springApi } from '../services/api';
import { useState, useEffect, useRef } from 'react';

const EMPTY = { roomNo: '', capacity: 1 };

// D5: validate room number — letters, numbers, hyphens only, no special chars or spaces
function validateRoomNo(val) {
  const trimmed = val.trim();
  if (!trimmed) return 'Room number is required.';
  if (!/^[A-Za-z0-9\-]+$/.test(trimmed))
    return 'Room number must contain only letters, numbers, and hyphens. e.g. 101, A-12';
  if (trimmed.length > 20)
    return 'Room number must not exceed 20 characters.';
  return '';
}

export default function HostelRoomModal({ isOpen, blockId, onClose, onSaved }) {
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [apiErr,      setApiErr]      = useState('');

  const [prnInput,    setPrnInput]    = useState('');
  const [namePreview, setNamePreview] = useState('');
  const [prnStatus,   setPrnStatus]   = useState('idle'); // idle | loading | found | notfound
  const [prnList,     setPrnList]     = useState([]);
  const lookupTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setErrors({});
      setApiErr('');
      setPrnInput('');
      setNamePreview('');
      setPrnStatus('idle');
      setPrnList([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  // Capacity stepper
  const stepCap = (delta) => {
    setForm((f) => {
      const next = Math.max(1, Number(f.capacity || 1) + delta);
      return { ...f, capacity: next };
    });
    setErrors((er) => ({ ...er, capacity: '' }));
  };

  // D2: PRN lookup — handles both plain PRN and PRN-prefixed formats
  const lookupPrn = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) { setNamePreview(''); setPrnStatus('idle'); return; }
    setPrnStatus('loading');
    try {
      const res = await springApi.get(`/students/by-prn/${encodeURIComponent(trimmed)}`);
      // springApi interceptor unwraps res.data → res is StudentResponse directly
      const name = res?.studentName ?? res?.data?.studentName ?? '';
      if (name) {
        setNamePreview(name);
        setPrnStatus('found');
      } else {
        setNamePreview('');
        setPrnStatus('notfound');
      }
    } catch {
      // D2: try with/without PRN prefix if initial lookup fails
      if (!trimmed.toUpperCase().startsWith('PRN')) {
        try {
          const res2 = await springApi.get(
            `/students/by-prn/${encodeURIComponent('PRN' + trimmed)}`
          );
          const name2 = res2?.studentName ?? res2?.data?.studentName ?? '';
          if (name2) {
            setNamePreview(name2);
            setPrnStatus('found');
            return;
          }
        } catch { /* fall through */ }
      }
      setNamePreview('');
      setPrnStatus('notfound');
    }
  };

  const handlePrnChange = (e) => {
    const value = e.target.value;
    // Comma = add to list
    if (value.endsWith(',')) {
      const typed = value.slice(0, -1).trim();
      if (typed && prnStatus === 'found' && namePreview &&
          !prnList.some(p => p.prn === typed)) {
        setPrnList(prev => [...prev, { prn: typed, name: namePreview }]);
      }
      setPrnInput('');
      setNamePreview('');
      setPrnStatus('idle');
      clearTimeout(lookupTimer.current);
      return;
    }
    setPrnInput(value);
    clearTimeout(lookupTimer.current);
    const trimmed = value.trim();
    if (!trimmed) { setNamePreview(''); setPrnStatus('idle'); return; }
    setPrnStatus('loading');
    lookupTimer.current = setTimeout(() => lookupPrn(trimmed), 400);
  };

  // Add current PRN to list via button
  const addCurrentPrn = () => {
    const typed = prnInput.trim();
    if (typed && prnStatus === 'found' && namePreview &&
        !prnList.some(p => p.prn === typed)) {
      setPrnList(prev => [...prev, { prn: typed, name: namePreview }]);
      setPrnInput('');
      setNamePreview('');
      setPrnStatus('idle');
    }
  };

  const removePrn = (prn) => setPrnList(prev => prev.filter(p => p.prn !== prn));

  const validate = () => {
    const e = {};
    const roomErr = validateRoomNo(form.roomNo);
    if (roomErr) e.roomNo = roomErr;
    // UI improvement: consistent capacity message
    if (!form.capacity || Number(form.capacity) < 1)
      e.capacity = 'Value must be greater than or equal to 1.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiErr('');
    try {
      const res = await springApi.post('/hostel-rooms', {
        blockId,
        roomNo:   form.roomNo.trim(),
        capacity: Number(form.capacity),
      });
      const newRoom = res;
      for (const s of prnList) {
        try {
          await springApi.post(`/hostel-rooms/${newRoom.roomId}/students`, {
            studentPrn:  s.prn,
            studentName: s.name,
          });
        } catch { /* skip failed students */ }
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

  const prnStatusColor = prnStatus === 'found'    ? '#16a34a'
                       : prnStatus === 'notfound' ? '#dc2626'
                       : 'var(--text-secondary)';

  const prnDisplayValue = prnStatus === 'loading'  ? 'Looking up...'
                        : prnStatus === 'found'    ? namePreview
                        : prnStatus === 'notfound' ? 'Student not found'
                        : '';

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
                <label className="books-form-label">
                  Room No <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className={`books-form-control ${errors.roomNo ? 'err' : ''}`}
                  name="roomNo"
                  value={form.roomNo}
                  onChange={change}
                  placeholder="e.g. 101, A-12"
                  maxLength={20}
                />
                {errors.roomNo && <p className="books-form-err">{errors.roomNo}</p>}
              </div>

              {/* UI improvement: Capacity with stepper (+/-) for mobile */}
              <div className="books-form-group">
                <label className="books-form-label">
                  Capacity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => stepCap(-1)}
                    style={{
                      width: 32, height: 36, borderRadius: 6,
                      border: '1px solid #d1d5db', background: '#f9fafb',
                      fontSize: 18, cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <input
                    className={`books-form-control ${errors.capacity ? 'err' : ''}`}
                    name="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={change}
                    style={{ textAlign: 'center', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => stepCap(1)}
                    style={{
                      width: 32, height: 36, borderRadius: 6,
                      border: '1px solid #d1d5db', background: '#f9fafb',
                      fontSize: 18, cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                </div>
                {/* UI improvement: consistent validation message */}
                {errors.capacity && (
                  <p className="books-form-err">{errors.capacity}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{
              borderTop: '1px solid var(--border-color)',
              margin: '14px 0 12px', fontSize: 12,
              color: 'var(--text-secondary)', paddingTop: 12,
            }}>
              Add Students (optional)
            </div>

            {/* D2: PRN input with improved lookup */}
            <div className="books-form-group" style={{ marginBottom: 8 }}>
              <label className="books-form-label">PRN</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="hst-prn-input"
                  style={{ flex: 1 }}
                  placeholder="Enter PRN and press comma or click Add"
                  value={prnInput}
                  onChange={handlePrnChange}
                />
                <button
                  type="button"
                  className="books-btn books-btn-sm books-btn-ghost"
                  onClick={addCurrentPrn}
                  disabled={prnStatus !== 'found'}
                  style={{ flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Name preview */}
            <div className="books-form-group" style={{ marginBottom: 4 }}>
              <label className="books-form-label">Student Name</label>
              <input
                className="hst-prn-input"
                style={{
                  width: '100%', background: 'var(--bg-secondary)',
                  cursor: 'default', color: prnStatusColor,
                }}
                readOnly
                value={prnDisplayValue}
                placeholder="Name will appear here after PRN lookup"
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Type PRN — name appears. Press <strong>,</strong> or click <strong>Add</strong> to add to list.
            </p>

            {/* Pending students */}
            {prnList.length > 0 && (
              <div className="books-table-wrap" style={{ marginTop: 4 }}>
                <table className="books-table">
                  <thead>
                    <tr><th>PRN</th><th>Name</th><th></th></tr>
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
                          >✕</button>
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
