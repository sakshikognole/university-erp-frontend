/**
 * PageError — full-page centered error state with a Retry button.
 * Use when the initial data fetch fails (network error / server down).
 *
 * Usage:
 *   if (error) return <PageError message={error} onRetry={load} />;
 */
export default function PageError({ message = 'Something went wrong.', onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
      textAlign: 'center',
      padding: '0 1rem',
    }}>
      {/* Icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
      }}>
        ⚠️
      </div>

      {/* Message */}
      <div>
        <p style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', margin: '0 0 4px' }}>
          Failed to load data
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0, maxWidth: 360 }}>
          {message}
        </p>
        {!message.includes('localhost') && (
          <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 6 }}>
            The server may be waking up (free tier). Please wait a moment and try again.
          </p>
        )}
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 24px',
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
}
