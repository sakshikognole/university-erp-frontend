import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { user, authLoading } = useAuth();

    // DEF-001 / DEF-015: Return a centred spinner while the token expiry check
    // is still running. Returning null here caused a completely blank page on
    // browser refresh and on mobile "Desktop View" switches because React would
    // render nothing, then remount once authLoading settled.
    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: '0.75rem',
                color: 'var(--text-secondary, #6b7280)',
            }}>
                <Loader2 size={32} className="spin-animate" />
                <p style={{ fontSize: '0.9375rem', margin: 0 }}>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
