import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkTokenExpiration = (token) => {
    try {
      const decoded = jwtDecode(token);
      // Check if token will expire in the next 5 minutes
      return decoded.exp * 1000 < Date.now() + 5 * 60 * 1000;
    } catch (error) {
      return true;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh-token');
      const { token } = response.data;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      setUser({
        username: decoded.username,
        isAdmin: decoded.isAdmin,
        allowedMainPersons: decoded.allowedMainPersons || [],
        hasIncomeAccess: decoded.hasIncomeAccess
      });
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          if (checkTokenExpiration(token)) {
            // Token is expired or about to expire, try to refresh
            await refreshToken();
          } else {
            const decoded = jwtDecode(token);
            setUser({
              username: decoded.username,
              isAdmin: decoded.isAdmin,
              allowedMainPersons: decoded.allowedMainPersons || [],
              hasIncomeAccess: decoded.hasIncomeAccess
            });
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Set up periodic token refresh
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && checkTokenExpiration(token)) {
        await refreshToken();
      }
    }, 4 * 60 * 1000); // Check every 4 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({
      username: decoded.username,
      isAdmin: decoded.isAdmin,
      allowedMainPersons: decoded.allowedMainPersons || [],
      hasIncomeAccess: decoded.hasIncomeAccess
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 