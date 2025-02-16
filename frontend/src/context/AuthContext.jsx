import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('adminToken');
    return !!token;
  });

  const login = (token) => {
    localStorage.setItem('adminToken', token);
    setAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 