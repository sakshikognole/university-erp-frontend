import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

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

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className="header-right">
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="notification-btn"
            title="View Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={20} />
          </button>
          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">Notifications</div>
              <div className="notif-dropdown-empty">
                <Bell size={28} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                <p>No new notifications</p>
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
