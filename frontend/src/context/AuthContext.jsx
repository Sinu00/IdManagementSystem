import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(false);
  const [allowedMainPersons, setAllowedMainPersons] = useState([]);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = decodeToken(token);
    if (decoded) {
      setAdmin(true);
      setAllowedMainPersons(decoded.allowedMainPersons || []);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAdmin(false);
    setAllowedMainPersons([]);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setAdmin(true);
        setAllowedMainPersons(decoded.allowedMainPersons || []);
      } else {
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, allowedMainPersons, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 