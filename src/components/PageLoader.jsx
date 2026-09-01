/**
 * PageLoader — full-page centered loading spinner.
 * Use while initial page data is being fetched.
 *
 * Usage:
 *   if (loading) return <PageLoader message="Loading books..." />;
 */
export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
    }}>
      {/* Spinner */}
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #111827',
        borderRadius: '50%',
        animation: 'pageloader-spin 0.8s linear infinite',
      }} />

      <style>{`
        @keyframes pageloader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
        {message}
      </p>
    </div>
  );
}
