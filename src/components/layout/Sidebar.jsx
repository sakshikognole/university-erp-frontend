import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationConfig } from '../../config/navigationConfig';
import { X, GraduationCap, Search } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, role = 'SUPER_ADMIN' }) => {
  const links = navigationConfig[role] || [];
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const isLinkActive = (linkPath) => {
    const currentPath = location.pathname;

    // Direct exact match
    if (currentPath === linkPath) return true;

    // Exam marks page should keep Exams highlighted in sidebar
    if (
      linkPath === '/exams' &&
      (currentPath === '/exam-marks' ||
        currentPath.startsWith('/exam-marks/') ||
        currentPath.startsWith('/exams/'))
    ) {
      return true;
    }

    // Student Certificate flow
    if (
      linkPath === '/select-student' &&
      (currentPath === '/student-details' ||
        currentPath === '/certificate-preview')
    ) {
      return true;
    }

    // Subpath match (e.g. /students/add, /staff/edit/..., avoiding root '/')
    if (linkPath !== '/' && currentPath.startsWith(`${linkPath}/`)) {
      return true;
    }

    return false;
  };

  // Responsive check: collapsed mode is purely for desktop view (>768px).
  // On mobile (<= 768px), sidebar is a slide-out drawer that MUST always show both logos and labels.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldCollapse = isCollapsed && !isMobile;

  // Lock background body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredLinks = links.filter((link) =>
    link.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${shouldCollapse ? 'collapsed' : ''}`}>

        {/* Sidebar Header Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <GraduationCap size={24} className="logo-icon" />
            <span className="logo-text">University ERP</span>
          </div>
          <button 
            type="button" 
            className="close-btn mobile-close-btn" 
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Sidebar Search Bar */}
        <div className="sidebar-search-container">
          <div className="sidebar-search-box">
            <Search size={16} className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="sidebar-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {filteredLinks.length > 0 ? (
              filteredLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.path);
                return (
                  <li key={link.path} className="nav-item">
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => `nav-link ${isActive || active ? 'active' : ''}`}
                      onClick={() => {
                        // Close sidebar on mobile when a link is clicked
                        if (window.innerWidth <= 768) {
                          toggleSidebar();
                        }
                      }}
                    >
                      <Icon size={20} className="nav-icon" />
                      <span className="nav-label">{link.label}</span>
                    </NavLink>
                  </li>
                );
              })
            ) : (
              <li className="sidebar-no-results">
                <span>No menu items found</span>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
