import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Derive display values from real auth user
  const displayName = user?.name || 'User';
  const displayDept = user?.department || user?.role || '';

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className="header-right">
        <button className="notification-btn">
          <Bell size={20} />
        </button>

        <div className="profile-dropdown" ref={dropdownRef}>
          <button
            className="profile-info-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-dept">{displayDept}</span>
            </div>
            <ChevronDown
              size={16}
              className={`chevron-icon ${isProfileOpen ? 'open' : ''}`}
            />
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
