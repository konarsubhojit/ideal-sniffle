import { useState, useEffect } from 'react';
import { setToken, removeToken, authFetch } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Extract token from URL hash on OAuth callback
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const token = decodeURIComponent(tokenMatch[1]);
        setToken(token);
        window.location.hash = '';
      }
    }

    try {
      const response = await authFetch(`${API_URL}/api/auth/user`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        removeToken();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const logout = async () => {
    try {
      await authFetch(`${API_URL}/api/auth/logout`);
      setUser(null);
      removeToken();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
