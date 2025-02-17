import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(false);
  const [allowedMainPersons, setAllowedMainPersons] = useState([]);

  const login = (token) => {
    localStorage.setItem('adminToken', token);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    setAdmin(true);
    setAllowedMainPersons(decoded.allowedMainPersons || []);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(false);
    setAllowedMainPersons([]);
  };

  return (
    <AuthContext.Provider value={{ admin, allowedMainPersons, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 