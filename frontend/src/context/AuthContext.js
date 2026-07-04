// Auth Context
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (name, phone_number) => {
    const data = await authService.registerOrLogin(name, phone_number);
    setUser(data.user);
    
    // Store last transaction if available
    if (data.lastTransaction) {
      localStorage.setItem('last_transaction', JSON.stringify(data.lastTransaction));
    }
    
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Don't clear last_transaction - user should see it on next login
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
