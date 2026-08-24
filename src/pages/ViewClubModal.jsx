export default function ViewClubModal({ isOpen, club, parentClubs, onClose }) {
  if (!isOpen || !club) return null;

  const getParentName = () => {
    if (!club.parentClubId) return null;
    const p = parentClubs.find((c) => c.clubId === club.parentClubId);
    return p ? `${p.clubName} (${p.clubId})` : club.parentClubId;
  };

  const rows = [
    { label: 'Club ID',            value: club.clubId },
    { label: 'Club Name',          value: club.clubName },
    { label: 'Category',           value: club.clubCategory },
    { label: 'Type',               value: club.parentClubId ? 'Sub-club' : 'Independent Club' },
    { label: 'Parent Club',        value: getParentName() || '— (Independent)' },
    { label: 'Status',             value: club.status },
    { label: 'Active Members',     value: club.activeMembers ?? '—' },
    { label: 'Faculty Coordinator',value: club.facultyCoordinator || '—' },
    { label: 'Student Lead',       value: club.studentLeadName || '—' },
    { label: 'Lead Student ID',    value: club.studentLeadId || '—' },
    { label: 'Lead Role',          value: club.studentLeadRole || '—' },
    { label: 'Description',        value: club.description || '—' },
  ];

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 500 }}>

        <div className="books-modal-head">
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
              {club.clubId}
            </p>
            <h3>{club.clubName}</h3>
          </div>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {rows.map(({ label, value }) => (
            <div className="books-detail-row" key={label}>
              <span className="books-detail-label">{label}</span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
                {label === 'Status' ? (
                  <span className={`club-status-badge ${value === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {value}
                  </span>
                ) : value}
              </span>
            </div>
          ))}
        </div>

        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
