import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, ShieldCheck, UserCheck, BookOpen,
  Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff,
  Server, Wifi, WifiOff, RefreshCw,
} from 'lucide-react';

// ── Server status checker ─────────────────────────────────────────────────────
const onLocalhost = window.location.hostname === 'localhost';

const NODE_HEALTH_URL = onLocalhost
  ? 'http://localhost:5000/'
  : 'https://university-erp-node.onrender.com/';

const SPRING_HEALTH_URL = onLocalhost
  ? 'http://localhost:8080/health'
  : 'https://university-erp-spring.onrender.com/health';

async function pingServer(url) {
  try {
    // Use no-cors so the browser doesn't block cross-origin health checks.
    // With no-cors we can't read the response body or status, but if the
    // fetch completes without throwing it means the server is reachable.
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: AbortSignal.timeout(6000),
    });
    return true;   // fetch succeeded — server is up
  } catch {
    return false;  // network error or timeout — server is down
  }
}

// ── Status dot component ──────────────────────────────────────────────────────
function ServerBadge({ label, status }) {
  const config = {
    checking: { color: '#f59e0b', bg: '#fef9c3', border: '#fde047', text: 'Checking...' },
    online:   { color: '#16a34a', bg: '#dcfce7', border: '#86efac', text: 'Online' },
    offline:  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', text: 'Offline' },
  };
  const c = config[status] || config.checking;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: '5px 10px',
      fontSize: '0.78rem', fontWeight: 600, color: c.color,
      minWidth: 130,
    }}>
      {/* Animated pulse dot */}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {status === 'checking' ? (
          <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
        ) : status === 'online' ? (
          <>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c.color, display: 'inline-block',
              boxShadow: `0 0 0 0 ${c.color}`,
              animation: 'ping 1.5s ease-out infinite',
            }} />
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c.color, position: 'absolute',
            }} />
          </>
        ) : (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: c.color, display: 'inline-block',
          }} />
        )}
      </span>
      <span>{label}: {c.text}</span>
    </div>
  );
}

// ── Main Login component ──────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { loginAdmin, loading } = useAuth();

  const [adminType,     setAdminType]     = useState('SUPER_ADMIN');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  // Server status state
  const [nodeStatus,   setNodeStatus]   = useState('checking');
  const [springStatus, setSpringStatus] = useState('checking');

  const adminOptions = [
    { id: 'SUPER_ADMIN', label: 'Super Admin',   icon: ShieldCheck, desc: 'Full System Control' },
    { id: 'SUB_ADMIN',   label: 'Sub Admin',     icon: UserCheck,   desc: 'Departmental Management' },
    { id: 'TEACHER',     label: 'Teacher Login', icon: BookOpen,    desc: 'Faculty & Academics' },
  ];

  // ── Ping both servers on mount + every 30 s ──
  const checkServers = async () => {
    setNodeStatus('checking');
    setSpringStatus('checking');
    const [nodeOk, springOk] = await Promise.all([
      pingServer(NODE_HEALTH_URL),
      pingServer(SPRING_HEALTH_URL),
    ]);
    setNodeStatus(nodeOk   ? 'online' : 'offline');
    setSpringStatus(springOk ? 'online' : 'offline');
  };

  useEffect(() => {
    checkServers();
    const interval = setInterval(checkServers, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Login handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both Email ID and Password.');
      return;
    }

    try {
      const res = await loginAdmin(email, password, adminType);
      setSuccess(res.message || 'Login successful. Redirecting...');
      setTimeout(() => {
        if (res.user.adminType === 'SUPER_ADMIN') {
          navigate('/super-admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const allOnline = nodeStatus === 'online' && springStatus === 'online';
  const anyOffline = nodeStatus === 'offline' || springStatus === 'offline';

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* ── Header Branding ── */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-title">University ERP Portal</h1>
          <p className="auth-subtitle">Admin Authentication Management System</p>
        </div>

        {/* ── Server Status Panel ── */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: '1.25rem',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
              <Server size={14} />
              <span>Server Status</span>
            </div>
            <button
              type="button"
              onClick={checkServers}
              title="Refresh server status"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', display: 'flex', alignItems: 'center',
                gap: 4, fontSize: '0.75rem', padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ServerBadge label="Auth API"   status={nodeStatus} />
            <ServerBadge label="Data API"   status={springStatus} />
          </div>

          {/* Summary message */}
          {anyOffline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '6px 10px',
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 6, fontSize: '0.78rem', color: '#9a3412',
            }}>
              <WifiOff size={13} />
              <span>
                One or more servers are offline. Login may not work.
                {!onLocalhost && ' Free tier servers may take 30–60 s to wake up.'}
              </span>
            </div>
          )}

          {allOnline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '6px 10px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 6, fontSize: '0.78rem', color: '#166534',
            }}>
              <Wifi size={13} />
              <span>All servers are online. Ready to login.</span>
            </div>
          )}
        </div>

        {/* ── Admin Type Selector ── */}
        <div className="admin-type-selector">
          <label className="input-label">Select Admin Access Level</label>
          <div className="admin-tabs">
            {adminOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = adminType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`admin-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => { setAdminType(opt.id); setError(''); }}
                >
                  <Icon size={18} className="tab-icon" />
                  <span className="tab-label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feedback Alerts ── */}
        {error && (
          <div className="auth-alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-alert alert-success">
            <ShieldCheck size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* ── Login Form ── */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email ID</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="e.g. superadmin@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password-input">Password</label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>
              {loading
                ? 'Authenticating...'
                : `Sign In as ${adminOptions.find(o => o.id === adminType)?.label}`}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="auth-footer">
          <span className="footer-text">Student Portal Access?</span>
          <Link to="/login/student" className="footer-link">Switch to Student Login</Link>
        </div>

      </div>

      {/* ── CSS for ping animation ── */}
      <style>{`
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          70%  { box-shadow: 0 0 0 6px transparent; opacity: 0; }
          100% { box-shadow: 0 0 0 0 transparent; opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default Login;
