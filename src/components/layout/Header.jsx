import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell, BellRing, LogOut, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// How often (ms) to silently refresh the unread count in the background.
const POLL_INTERVAL_MS = 60_000; // 1 minute

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Notification state
  const [notifItems, setNotifItems] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(false);

  // Unread badge count — null means "not yet fetched"
  const [unreadCount, setUnreadCount] = useState(null);

  const authHeader = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  }), []);

  // ── Fetch just the unread count (lightweight, runs on mount + poll) ─────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/unread-count`, {
        headers: authHeader(),
      });
      if (!res.ok) return; // silently ignore errors for the badge
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Network failure — leave existing count unchanged
    }
  }, [authHeader]);

  // ── Fetch full notification list (runs when dropdown opens) ─────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements?page=1&limit=5`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setNotifItems(data.announcements || []);
    } catch {
      setNotifError(true);
      setNotifItems([]);
    } finally {
      setNotifLoading(false);
    }
  }, [authHeader]);

  // ── Mark all visible notifications as read, then update badge ───────────────
  const markAllRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/system-announcements/mark-all-read`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      setUnreadCount(0);
    } catch {
      // Non-critical — badge will self-correct on next poll
    }
  }, [authHeader]);

  // ── Fetch unread count on mount and start background poll ───────────────────
  useEffect(() => {
    if (!user) return; // not logged in yet
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, fetchUnreadCount]);

  // ── When dropdown opens: load notifications and mark them all as read ────────
  useEffect(() => {
    if (isNotifOpen) {
      fetchNotifications();
      markAllRead();
    }
  }, [isNotifOpen, fetchNotifications, markAllRead]);

  // ── Close dropdowns on outside click ────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const now = new Date();
    const dt = new Date(d);
    const diffMs = now - dt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Badge label: cap at 99+
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const showBadge = unreadCount !== null && unreadCount > 0;

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className="header-right">
        <div className="notif-wrapper" ref={notifRef}>
          {/* Bell button — position:relative so the badge can sit over the top-right corner */}
          <button
            className="notification-btn"
            title="View Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{ position: 'relative' }}
          >
            <Bell size={20} />

            {/* Unread count badge */}
            {showBadge && (
              <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
                {badgeLabel}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">Notifications</div>
              <div className="notif-dropdown-body">
                {notifLoading ? (
                  <div className="notif-dropdown-empty">
                    <Loader2 size={22} className="spin-animate" style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
                    <p>Loading…</p>
                  </div>
                ) : notifError ? (
                  <div className="notif-dropdown-empty">
                    <Bell size={28} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                    <p>Unable to load</p>
                  </div>
                ) : notifItems.length === 0 ? (
                  <div className="notif-dropdown-empty">
                    <Bell size={28} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifItems.map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      className="notif-dropdown-item"
                      onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }}
                    >
                      <div className="notif-dropdown-item-icon">
                        <BellRing size={14} />
                      </div>
                      <div className="notif-dropdown-item-content">
                        <div className="notif-dropdown-item-title">{n.title}</div>
                        {n.description && (
                          <div className="notif-dropdown-item-desc">{n.description}</div>
                        )}
                        <div className="notif-dropdown-item-time">
                          <Calendar size={10} />
                          <span>{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="notif-dropdown-footer">
                <button
                  type="button"
                  className="notif-view-all-btn"
                  onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }}
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-dropdown" ref={dropdownRef}>
          <button className="profile-info-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Admin User'}</span>
              <span className="user-dept">{user?.department || (user?.adminType ? user.adminType.replace('_', ' ') : 'University')}</span>
            </div>
            <ChevronDown size={16} className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} />
          </button>
          
          {isProfileOpen && (
            <div className="dropdown-menu click-active">
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
