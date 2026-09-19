export default function ViewSportModal({ isOpen, sport, onClose }) {
  if (!isOpen || !sport) return null;

  const rows = [
    { label: 'Sport ID',    value: sport.sportId },
    { label: 'Sport Name',  value: sport.sportName },
    { label: 'Capacity',    value: sport.capacity },
    { label: 'Status',      value: sport.status },
    { label: 'Venue ID',    value: sport.venueId },
    { label: 'Description', value: sport.description || '—' },
  ];

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 480 }}>

        <div className="books-modal-head">
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
              {sport.sportId}
            </p>
            <h3>{sport.sportName}</h3>
          </div>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {rows.map(({ label, value }) => (
            <div className="books-detail-row" key={label}>
              <span className="books-detail-label">{label}</span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
                {label === 'Status' ? (
                  <span className={`sport-status-badge ${value === 'ACTIVE' ? 'sport-badge-active' : 'sport-badge-inactive'}`}>
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
