import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user, initializing } = useAuth();

  // Wait for localStorage hydration before redirecting
  if (initializing) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.adminType !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default SuperAdminRoute;
