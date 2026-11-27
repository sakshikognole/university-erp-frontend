import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Persist sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  // Responsive check: collapsed state is only for desktop viewport (>768px)
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

  // Prevent background scrolling on mobile when any modal/overlay is open
  useEffect(() => {
    const checkModalScrollLock = () => {
      const hasModal = !!document.querySelector(
        '.books-overlay, .modal-overlay, .sf-overlay, .dm-preview-overlay, .delete-dialog'
      );
      if (hasModal) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };

    checkModalScrollLock();
    const observer = new MutationObserver(checkModalScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, []);

  const effectiveCollapsed = isCollapsed && !isMobile;

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const userRole = user?.adminType !== 'NONE' && user?.adminType ? user.adminType : (user?.role || 'SUPER_ADMIN');

  return (
    <div className={`dashboard-layout ${effectiveCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isOpen={isMobileOpen} toggleSidebar={toggleSidebar} isCollapsed={effectiveCollapsed} role={userRole} />
      <div className="dashboard-main">
        <Header toggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
