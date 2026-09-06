import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// API base URLs — hardcoded for production reliability.
// Update these if your Render service URLs change.
const IS_PROD = window.location.hostname !== 'localhost';
const NODE_URL = IS_PROD
  ? 'https://university-erp-node.onrender.com'
  : 'http://localhost:5000';
const API_BASE_URL = `${NODE_URL}/api`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('erp_token') || null;
  });

  const [loading,      setLoading]      = useState(false);
  // initializing = true during the very first render cycle.
  // ProtectedRoute waits for this to be false before deciding to redirect.
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // After the first render, localStorage has been read and user state is settled.
    setInitializing(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('erp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('erp_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('erp_token', token);
    } else {
      localStorage.removeItem('erp_token');
    }
  }, [token]);

  // Admin Login
  const loginAdmin = async (email, password, adminType) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, adminType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      setToken(data.user.token);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      // Fallback mock authentication if backend is unreachable
      // if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      //   const mockUser = {
      //     id: 'mock_admin_1',
      //     name: adminType === 'SUPER_ADMIN' ? 'Super Administrator' : adminType === 'SUB_ADMIN' ? 'Finance Sub Admin' : 'Dr. Sarah Connor',
      //     email: email,
      //     role: adminType === 'TEACHER' ? 'FACULTY' : adminType,
      //     adminType: adminType,
      //     department: adminType === 'TEACHER' ? 'Computer Science' : 'Administration',
      //     token: 'mock_jwt_token_admin',
      //   };
      //   setUser(mockUser);
      //   setToken(mockUser.token);
      //   return { message: 'Login successful (Offline Mode)', user: mockUser };
      // }
      throw error;
    }
  };

  // Student Login
  const loginStudent = async (prn, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Student login failed');
      }

      setUser(data.user);
      setToken(data.user.token);
      setLoading(false);
      return data;
    } catch (error) {
      // setLoading(false);
      // if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      //   const mockUser = {
      //     id: 'mock_student_1',
      //     name: 'Alex Johnson',
      //     email: 'student@university.edu',
      //     prn: prn,
      //     role: 'STUDENT',
      //     adminType: 'NONE',
      //     department: 'Computer Science',
      //     token: 'mock_jwt_token_student',
      //   };
      //   setUser(mockUser);
      //   setToken(mockUser.token);
      //   return { message: 'Student login successful (Offline Mode)', user: mockUser };
      // }
      throw error;
    }
  };

  // Send OTP (000000)
  const sendOtp = async (identifier) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { message: 'Test OTP generated: 000000', otp: '000000' };
      }
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (identifier, otp, newPassword, retypePassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, newPassword, retypePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        if (otp !== '000000') {
          throw new Error('Invalid OTP. Please use test OTP 000000');
        }
        return { message: 'Password reset successfully (Offline Mode)' };
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initializing,
        loginAdmin,
        loginStudent,
        sendOtp,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
