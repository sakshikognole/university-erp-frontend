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

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const userRole = user?.adminType !== 'NONE' && user?.adminType ? user.adminType : (user?.role || 'SUPER_ADMIN');

  return (
    <div className={`dashboard-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isOpen={isMobileOpen} toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} role={userRole} />
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
