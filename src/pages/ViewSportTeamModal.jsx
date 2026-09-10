export default function ViewSportTeamModal({ isOpen, team, onClose }) {
  if (!isOpen || !team) return null;

  const badgeStyle = team.status === 'ACTIVE'
    ? { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
    : { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };

  return (
    <div className="books-overlay">
      {/* Defect 2: modal width 100% on mobile, max 520px on desktop — no horizontal scroll */}
      <div className="books-modal" style={{
        maxWidth: 520,
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>

        <div className="books-modal-head">
          <h3>Team Details</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="books-modal-body">

          {/* Team ID + Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
              {team.teamId}
            </span>
            <span style={{
              ...badgeStyle, padding: '3px 10px', borderRadius: 9999,
              fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}>{team.status}</span>
          </div>

          {/* Team Name */}
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700,
            wordBreak: 'break-word' }}>
            {team.teamName}
          </h2>

          {/* Details — stacked rows, no horizontal overflow */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
            <tbody>
              {[
                ['Sport ID',      team.sportId],
                ['Coach',         team.coachName],
                ['Status',        team.status],
                ['Total Members', Array.isArray(team.members) ? team.members.length : 0],
              ].map(([label, val]) => (
                <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 600, color: '#6b7280',
                    width: '40%', verticalAlign: 'top' }}>{label}</td>
                  <td style={{ padding: '8px 4px', color: '#111827',
                    wordBreak: 'break-word' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Members chips */}
          {Array.isArray(team.members) && team.members.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280',
                marginBottom: 8 }}>Members</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {team.members.map((m, i) => (
                  <span key={i} style={{
                    background: '#eff6ff', color: '#2563eb',
                    borderRadius: 6, padding: '3px 10px',
                    fontSize: '0.82rem', fontWeight: 500,
                    wordBreak: 'break-word',
                  }}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {team.description && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280',
                marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6,
                margin: 0, wordBreak: 'break-word' }}>
                {team.description}
              </p>
            </div>
          )}

        </div>

        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
