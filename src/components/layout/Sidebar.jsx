import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationConfig } from '../../config/navigationConfig';
import { X, GraduationCap } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, role = 'SUPER_ADMIN' }) => {
  const links = navigationConfig[role] || [];
  const location = useLocation();

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

  return (

    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

        {/* Desktop Header Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <GraduationCap size={24} className="logo-icon" />
            <span className="logo-text">University ERP</span>
          </div>
        </div>

        <div className="sidebar-header-mobile">
          <span className="logo-text">ERP Menu</span>
          <button className="close-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {links.map((link) => {
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
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
