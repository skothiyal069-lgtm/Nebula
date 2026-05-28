import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage safely
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('nebula_token');
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (err) {
      console.error('Failed to read token from localStorage:', err);
    }
    setLoading(false);
  }, []);

  // Set default auth headers for api client
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        localStorage.setItem('nebula_token', token);
      } catch (err) {
        console.error('Failed to save token to localStorage:', err);
      }
      fetchProfile();
    } else {
      delete api.defaults.headers.common['Authorization'];
      try {
        localStorage.removeItem('nebula_token');
      } catch (err) {
        console.error('Failed to clear token from localStorage:', err);
      }
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.data.token);
        setUser({
          _id: res.data.data._id,
          username: res.data.data.username,
          email: res.data.data.email,
          avatar: res.data.data.avatar,
          status: res.data.data.status,
          mood: res.data.data.mood,
          energyLevel: res.data.data.energyLevel
        });
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server connection failed'
      };
    }
  };

  const register = async (username, email, password, avatar) => {
    try {
      const res = await api.post('/api/auth/register', {
        username,
        email,
        password,
        avatar
      });
      if (res.data.success) {
        setToken(res.data.data.token);
        setUser({
          _id: res.data.data._id,
          username: res.data.data.username,
          email: res.data.data.email,
          avatar: res.data.data.avatar,
          status: res.data.data.status,
          mood: res.data.data.mood,
          energyLevel: res.data.data.energyLevel
        });
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server connection failed'
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/api/auth/update', profileData);
      if (res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
      return { success: false, message: 'Update failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server connection failed'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('nebula_token');
    } catch (err) {
      console.error('Failed to clear localStorage on logout:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
