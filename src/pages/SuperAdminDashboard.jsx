import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Building2, UserPlus, ChevronDown, Loader2 } from 'lucide-react';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    activeDepartments: 0,
    activeClubs: 0,
  });
  const [showAddUserMenu, setShowAddUserMenu] = useState(false);
  const addUserMenuRef = useRef(null);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addUserMenuRef.current && !addUserMenuRef.current.contains(event.target)) {
        setShowAddUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/stats`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalStudents: data.stats?.totalStudents || 0,
          totalStaff: data.stats?.totalStaff || 0,
          activeDepartments: data.stats?.totalDepartments || 0,
          activeClubs: 0,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch stats, using fallback:', err);
      setStats({
        totalStudents: 0,
        totalStaff: 0,
        activeDepartments: 0,
        activeClubs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      id: 'students',
      label: 'Total Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: '#000000',
    },
    {
      id: 'staff',
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: Users,
      color: '#374151',
    },
    {
      id: 'departments',
      label: 'Active Departments',
      value: stats.activeDepartments,
      icon: Building2,
      color: '#4b5563',
    },
    {
      id: 'clubs',
      label: 'Active Clubs',
      value: stats.activeClubs,
      icon: UserPlus,
      color: '#6b7280',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Super Admin Dashboard</h1>
          <p className="page-subtitle">University management and system overview</p>
        </div>

        <div className="download-dropdown-wrapper" ref={addUserMenuRef}>
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => setShowAddUserMenu(!showAddUserMenu)}
            title="Add new user"
          >
            <UserPlus size={16} />
            <span>Add New User</span>
            <ChevronDown size={14} />
          </button>

          {showAddUserMenu && (
            <div className="download-dropdown-menu">
              <div className="dropdown-menu-header">Select User Type</div>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  setShowAddUserMenu(false);
                  navigate('/add-student');
                }}
              >
                <GraduationCap size={15} />
                <span>Add Student</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  setShowAddUserMenu(false);
                  navigate('/add-staff');
                }}
              >
                <Users size={15} />
                <span>Add Staff</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spin-animate" />
        </div>
      ) : (
        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            const cardRouteMap = {
              students: '/students',
              staff: '/staff',
              departments: '/departments',
            };
            const route = cardRouteMap[card.id];
            const isClickable = Boolean(route);
            return (
              <div
                key={card.id}
                className={`stat-card card ${isClickable ? 'stat-card-clickable' : ''}`}
                onClick={isClickable ? () => navigate(route) : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <div className="stat-card-icon" style={{ backgroundColor: card.color }}>
                  <Icon size={24} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">{card.label}</div>
                  <div className="stat-card-value">{card.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
