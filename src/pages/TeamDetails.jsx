import { springApi } from '../services/api';
import { useState, useEffect, useCallback, useRef } from 'react';

export default function TeamDetails({ teamId, onBack }) {
  const [team,         setTeam]         = useState(null);
  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  // PRN input state
  const [prnInput,     setPrnInput]     = useState('');
  const [namePreview,  setNamePreview]  = useState('');
  const [prnList,      setPrnList]      = useState([]);
  const [addingRoster, setAddingRoster] = useState(false);
  const lookupTimer = useRef(null);

  // Action feedback
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');

  // Auto-clear alerts
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // Load team + requests together
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [teamRes, reqRes] = await Promise.all([
        springApi.get(`/sport-teams/${teamId}`),
        springApi.get(`/sport-teams/${teamId}/requests`),
      ]);
      setTeam(teamRes);
      setRequests(Array.isArray(reqRes) ? reqRes : []);
    } catch {
      setError('Failed to load team details.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── PRN lookup ───────────────────────────────────────────────────────────

  const handlePrnInput = (e) => {
    const value = e.target.value;

    // Comma pressed → add current PRN to the table
    if (value.endsWith(',')) {
      const typed = value.slice(0, -1).trim();
      if (typed && namePreview && !namePreview.startsWith('...') && !namePreview.startsWith('Not found')) {
        // Only add if student was found
        if (!prnList.some((p) => p.prn === typed)) {
          const status = namePreview === 'Not found' ? 'notfound' : 'found';
          if (status === 'found') {
            setPrnList((prev) => [...prev, { prn: typed, studentName: namePreview, status: 'found' }]);
          }
        }
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

    // Debounce: lookup after user stops typing for 400ms
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

  // ── Roster actions ───────────────────────────────────────────────────────

  const removeFromRoster = async (studentPrn) => {
    if (!window.confirm('Remove this student from the roster?')) return;
    try {
      await springApi.delete(`/sport-teams/${teamId}/roster/${studentPrn}`);
      setSuccess('Student removed from roster.');
      loadAll(true);
    } catch (err) {
      setError(err.message || 'Failed to remove student.');
    }
  };

  // ── Request actions ──────────────────────────────────────────────────────

  const acceptRequest = async (requestId) => {
    try {
      await springApi.put(`/sport-team-requests/${requestId}/accept`);
      setSuccess('Request accepted. Student added to roster.');
      loadAll(true);
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    }
  };

  const ignoreRequest = async (requestId) => {
    try {
      await springApi.put(`/sport-team-requests/${requestId}/ignore`);
      setSuccess('Request ignored.');
      loadAll(true);
    } catch (err) {
      setError(err.message || 'Failed to ignore request.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <p className="books-loading">Loading team details...</p>;
  if (!team)   return <p className="st-empty">Team not found.</p>;

  return (
    <div className="page-container">

      {/* Back button */}
      <button className="st-back-link" onClick={onBack}>
        ← Back to Sport Teams
      </button>

      {/* Page title */}
      <div className="st-page-header">
        <div>
          <h1 className="page-title">{team.teamId}</h1>
          <p className="st-page-sub">{team.sportName} Team</p>
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

      {/* Team Details */}
      <div className="books-table-wrap">
        <table className="books-table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Sport Name</th>
              <th>Coach Name</th>
              <th>Captain Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{team.teamId}</td>
              <td>{team.sportName}</td>
              <td>{team.coachName}</td>
              <td>{team.captainName}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Roster Section ── */}
      <p className="st-section-title">Roster</p>

      {/* Add student by PRN */}
      <div style={{ marginBottom: 14 }}>

        {/* PRN input */}
        <div className="books-form-group" style={{ maxWidth: 320, marginBottom: 8 }}>
          <label className="books-form-label">PRN</label>
          <input
            className="st-prn-input"
            placeholder="Enter PRN"
            value={prnInput}
            onChange={handlePrnInput}
            style={{ width: '100%' }}
          />
        </div>

        {/* Name preview box */}
        <div className="books-form-group" style={{ maxWidth: 320, marginBottom: 8 }}>
          <label className="books-form-label">Student Name</label>
          <input
            className="st-prn-input"
            value={
              namePreview === '...'        ? 'Looking up...' :
              namePreview === 'Not found'  ? 'Student not found' :
              namePreview
            }
            readOnly
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              color: namePreview === 'Not found'
                ? '#dc2626'
                : 'var(--text-primary)',
              cursor: 'default',
            }}
            placeholder="Name will appear here"
          />
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Type a PRN — the student name appears below. Press <strong>,</strong> (comma) to add to the list.
        </p>

        {/* Students list table */}
        {prnList.length > 0 && (
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
                {prnList.map((p) => (
                  <tr key={p.prn}>
                    <td>{p.prn}</td>
                    <td style={{ fontWeight: 500 }}>{p.studentName}</td>
                    <td>
                      <div className="books-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => removePrnFromList(p.prn)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add all to roster */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="books-btn books-btn-primary"
                disabled={addingRoster}
                onClick={async () => {
                  setAddingRoster(true);
                  let added = 0;
                  const errors = [];
                  for (const p of prnList) {
                    try {
                      await springApi.post(`/sport-teams/${teamId}/roster/add`, {
                        studentPrn:  p.prn,
                        studentName: p.studentName,
                      });
                      added++;
                    } catch (err) {
                      errors.push(err.message || `Failed to add ${p.prn}.`);
                    }
                  }
                  setAddingRoster(false);
                  if (added > 0) {
                    setSuccess(`${added} student(s) added to roster successfully.`);
                    setPrnList([]);
                    loadAll(true);
                  }
                  if (errors.length) setError(errors.join(' | '));
                }}
              >
                {addingRoster ? 'Adding...' : `Add ${prnList.length} Student(s) to Roster`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roster table */}
      {!team.roster || team.roster.length === 0 ? (
        <p className="st-empty">No students in the roster yet.</p>
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
              {team.roster.map((entry) => (
                <tr key={entry.studentPrn}>
                  <td>{entry.studentPrn}</td>
                  <td>{entry.studentName}</td>
                  <td>
                    <button
                      className="books-btn books-btn-sm books-btn-danger"
                      onClick={() => removeFromRoster(entry.studentPrn)}
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

      {/* ── Student Requests Section ── */}
      <p className="st-section-title">Student Requests</p>

      {requests.length === 0 ? (
        <p className="st-empty">No requests for this team.</p>
      ) : (
        <div className="books-table-wrap">
          <table className="books-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>PRN</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.requestId}>
                  <td>{req.studentName}</td>
                  <td>{req.studentPrn}</td>
                  <td>
                    <span className={`st-badge st-badge-${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'PENDING' && (
                      <div className="books-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-primary"
                          onClick={() => acceptRequest(req.requestId)}
                        >
                          Accept
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => ignoreRequest(req.requestId)}
                        >
                          Ignore
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
