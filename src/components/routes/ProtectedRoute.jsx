import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();

  // Wait for AuthContext to finish reading from localStorage.
  // Without this, on page refresh user is momentarily null and
  // the route redirects to /login before the real state is known.
  if (initializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 12,
        background: '#f9fafb',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #111827',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
