import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';

const CACHE_NAME = 'erp-auth-cache-v1';
const CACHE_MARKER = '/__erp_auth_active__';

const registerCacheMarker = async () => {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(CACHE_MARKER, new Response('active', { status: 200 }));
    }
    localStorage.setItem('erp_cache_active', '1');
  } catch (e) {
    // Ignore cache API errors
  }
};

const clearCacheMarker = async () => {
  try {
    localStorage.removeItem('erp_cache_active');
    if (typeof window !== 'undefined' && 'caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch (e) {
    // Ignore cache API errors
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('erp_token') || null;
  });

  const [loading, setLoading] = useState(false);
  // authLoading is true until the initial token-expiry check on mount completes.
  // Components that gate on user.adminType must wait for this to be false before
  // making access-control decisions, otherwise an expired-token logout() call
  // during the first render cycle causes a blank-page flash (DEF-001, DEF-002, DEF-015).
  const [authLoading, setAuthLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_token');
      sessionStorage.clear();
      clearCacheMarker();
    } catch (e) {}
  }, []);

  const redirectToLogin = useCallback(() => {
    logout();
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (
        !path.startsWith('/login') &&
        !path.startsWith('/forgot-password') &&
        !path.startsWith('/password-management')
      ) {
        window.location.replace('/login');
      }
    }
  }, [logout]);

  const checkAuthStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (
      path.startsWith('/login') ||
      path.startsWith('/forgot-password') ||
      path.startsWith('/password-management')
    ) {
      return;
    }

    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    const cacheActive = localStorage.getItem('erp_cache_active');

    // 1. If on protected route but storage / site data was cleared:
    if (!savedToken || !savedUser) {
      redirectToLogin();
      return;
    }

    // 2. Browser cache cleared check ("Cached images and files")
    if (cacheActive === '1' && 'caches' in window) {
      try {
        const hasCache = await caches.has(CACHE_NAME);
        let markerFound = false;
        if (hasCache) {
          const cache = await caches.open(CACHE_NAME);
          const match = await cache.match(CACHE_MARKER);
          if (match) markerFound = true;
        }

        if (!markerFound) {
          redirectToLogin();
          return;
        }
      } catch (e) {
        // Fallback: don't block if CacheStorage is unsupported
      }
    }
  }, [redirectToLogin]);

  // Check token expiration on mount and set session timeout check.
  // authLoading is set to false once this check has run so consumers know
  // that the auth state is settled and safe to use.
  useEffect(() => {
    let timer;
    if (token && typeof token === 'string' && token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          if (payload && payload.exp) {
            const expirationTime = payload.exp * 1000;
            const timeLeft = expirationTime - Date.now();
            if (timeLeft <= 0) {
              logout();
            } else {
              timer = setTimeout(() => {
                logout();
              }, timeLeft);
            }
          }
        }
      } catch (e) {
        // Safe fallback on any decoding error
      }
    }
    // Auth check is complete — unblock any gated consumers
    setAuthLoading(false);
    return () => { if (timer) clearTimeout(timer); };
  }, [token, logout]);

  // Continuously monitor storage and browser cache clearing
  useEffect(() => {
    checkAuthStatus();

    // Check every 800ms
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 800);

    const handleFocus = () => {
      checkAuthStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuthStatus();
      }
    };

    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'erp_token' || e.key === 'erp_user' || e.key === 'erp_cache_active') {
        checkAuthStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

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

      await registerCacheMarker();
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      localStorage.setItem('erp_token', data.user.token);
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

      await registerCacheMarker();
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      localStorage.setItem('erp_token', data.user.token);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authLoading,
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
