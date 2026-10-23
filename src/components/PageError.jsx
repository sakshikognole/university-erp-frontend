import { useState, useEffect, useCallback } from 'react';

/**
 * PageError — full-page centered error state with a Retry button.
 * Use when the initial data fetch fails (network error / server down).
 *
 * Usage:
 *   if (error) return <PageError message={error} onRetry={load} />;
 *
 * Fix: Retry button checks navigator.onLine before calling onRetry.
 * Listens to the browser's online/offline events so the button label
 * and state update automatically when the network connection changes.
 * Shows a loading state while the retry fetch is in progress.
 */
export default function PageError({ message = 'Something went wrong.', onRetry }) {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [retrying, setRetrying]     = useState(false);
  const [offlineMsg, setOfflineMsg] = useState('');

  // Keep isOnline in sync with real network events
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  setOfflineMsg(''); };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    // Re-check at click time — navigator.onLine may have changed
    if (!navigator.onLine) {
      setOfflineMsg('Still no internet connection. Please check your network and try again.');
      return;
    }
    setOfflineMsg('');
    setRetrying(true);
    try {
      await onRetry();
    } catch {
      // onRetry's own error handling takes care of UI — nothing extra needed here
    } finally {
      setRetrying(false);
    }
  }, [onRetry]);

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
        {isOnline ? '⚠️' : '📡'}
      </div>

      {/* Message */}
      <div>
        <p style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', margin: '0 0 4px' }}>
          {isOnline ? 'Failed to load data' : 'No internet connection'}
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0, maxWidth: 360 }}>
          {isOnline ? message : 'You are currently offline. Please reconnect and click Retry.'}
        </p>
        {isOnline && !message.includes('localhost') && (
          <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 6 }}>
            The server may be waking up (free tier). Please wait a moment and try again.
          </p>
        )}
        {/* Offline-at-click warning */}
        {offlineMsg && (
          <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 8, fontWeight: 500 }}>
            {offlineMsg}
          </p>
        )}
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          style={{
            padding: '8px 24px',
            background: retrying ? '#6b7280' : '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: retrying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.2s',
          }}
        >
          {retrying ? '⏳ Retrying...' : '🔄 Retry'}
        </button>
      )}
    </div>
  );
}
