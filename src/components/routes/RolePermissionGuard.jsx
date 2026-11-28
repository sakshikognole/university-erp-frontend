/**
 * RolePermissionGuard
 *
 * Wraps any page that should respect database-driven page permissions.
 * - SUPER_ADMIN / ADMIN / SUB_ADMIN always pass through (unrestricted).
 * - TEACHER / FACULTY: checks the allowedPages array stored in their Role
 *   document. If the current path is not in allowedPages, renders a
 *   "not authorised" notice instead of the page.
 * - Other roles (STUDENT, FINANCE, …): pass through — their access is
 *   already controlled by route guards and navigation config.
 *
 * Usage (in App.jsx):
 *   <Route path="submissions" element={<RolePermissionGuard><Submission /></RolePermissionGuard>} />
 *
 * Or wrap individual pages inside the route element:
 *   element={<RolePermissionGuard><Attendance /></RolePermissionGuard>}
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// Cache role permissions in memory for the session (avoids repeated API calls)
let _cachedPerms = null;   // null = not fetched yet, {} = fetched

async function fetchRolePermissions() {
  if (_cachedPerms) return _cachedPerms;
  try {
    const token = localStorage.getItem('erp_token');
    const res = await fetch(`${API_BASE_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    const roles = await res.json();
    const map = {};
    for (const role of roles) {
      map[role.code] = role.allowedPages || [];
    }
    _cachedPerms = map;
    return map;
  } catch {
    return {};
  }
}

// Invalidate cache on logout (called from AuthContext logout)
export function clearRolePermCache() {
  _cachedPerms = null;
}

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN']);
const TEACHER_ROLES = new Set(['TEACHER', 'FACULTY']);

const RolePermissionGuard = ({ children, allowedFor }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  const [checking, setChecking]   = useState(true);
  const [allowed,  setAllowed]    = useState(true);

  useEffect(() => {
    // Reset on every route change
    setAllowed(true);
    setChecking(true);

    if (authLoading || !user) {
      setChecking(false);
      return;
    }

    const role = (user.adminType && user.adminType !== 'NONE') ? user.adminType : user.role;

    // Admins are always unrestricted
    if (ADMIN_ROLES.has(role)) {
      setChecking(false);
      setAllowed(true);
      return;
    }

    // For non-teacher roles we just pass through
    if (!TEACHER_ROLES.has(role)) {
      setChecking(false);
      setAllowed(true);
      return;
    }

    // Teacher/Faculty — check allowedPages from DB
    fetchRolePermissions().then((permMap) => {
      const pages = permMap[role] || [];
      if (pages.length === 0) {
        // empty = unrestricted
        setAllowed(true);
      } else {
        const currentPath = '/' + location.pathname.replace(/^\/+/, '');
        const ok = pages.some((p) => currentPath === p || currentPath.startsWith(p + '/'));
        setAllowed(ok);
      }
      setChecking(false);
    });
  }, [authLoading, user, location.pathname]);

  if (authLoading || checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={28} className="spin-animate" />
        <p style={{ fontSize: '0.9rem', margin: 0 }}>Checking permissions…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem', textAlign: 'center' }}>
          <ShieldCheck size={48} style={{ opacity: 0.25 }} />
          <h2 style={{ margin: 0 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem' }}>
            Your role does not have permission to access this page. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RolePermissionGuard;
