export default function ViewSportTeamModal({ isOpen, team, onClose }) {
  if (!isOpen || !team) return null;

  const badgeClass = team.status === 'ACTIVE'
    ? 'sport-badge-active'
    : 'sport-badge-inactive';

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 520 }}>

        <div className="books-modal-head">
          <h3>Team Details</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="books-modal-body">

          {/* ID + status row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
              {team.teamId}
            </span>
            <span className={`sport-status-badge ${badgeClass}`}>{team.status}</span>
          </div>

          {/* Team name */}
          <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700 }}>
            {team.teamName}
          </h2>

          {/* Info grid */}
          <div className="sport-card-details" style={{ marginBottom: 16 }}>
            <div className="sport-detail-item">
              <span className="sport-detail-label">Sport ID</span>
              <span className="sport-detail-value">{team.sportId}</span>
            </div>
            <div className="sport-detail-item">
              <span className="sport-detail-label">Coach</span>
              <span className="sport-detail-value">{team.coachName}</span>
            </div>
            <div className="sport-detail-item">
              <span className="sport-detail-label">Total Members</span>
              <span className="sport-detail-value">
                {Array.isArray(team.members) ? team.members.length : 0}
              </span>
            </div>
          </div>

          {/* Members chips */}
          {Array.isArray(team.members) && team.members.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p className="sport-detail-label" style={{ marginBottom: 8 }}>Members</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {team.members.map((m, i) => (
                  <span key={i} style={{
                    background: '#eff6ff', color: '#2563eb',
                    borderRadius: 6, padding: '3px 10px',
                    fontSize: '0.82rem', fontWeight: 500,
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {team.description && (
            <div>
              <p className="sport-detail-label" style={{ marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
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
