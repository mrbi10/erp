// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Example state
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
    navigate('/dashboard'); // redirect after login
  };

  const logout = () => {
    setUser(null);
    navigate('/'); // redirect after logout
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
