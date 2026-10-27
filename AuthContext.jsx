import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('INR'); // INR, USD
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('uip_user');
    const storedCurrency = localStorage.getItem('uip_currency');
    if (storedCurrency) {
      setCurrency(storedCurrency);
    }
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.currency) {
          setCurrency(parsed.currency);
        }
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const changeCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('uip_currency', curr);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return currency === 'INR' ? '₹0' : '$0';
    const num = Math.round(Number(amount));
    if (currency === 'INR') {
      return '₹' + num.toLocaleString('en-IN');
    }
    return '$' + num.toLocaleString('en-US');
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await api.auth.login(email, password);
      setUser(userData);
      localStorage.setItem('uip_user', JSON.stringify(userData));
      if (userData.currency) {
        changeCurrency(userData.currency);
      }
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone, role = 'CLIENT') => {
    setLoading(true);
    try {
      const userData = await api.auth.register(name, email, password, phone, role);
      setUser(userData);
      localStorage.setItem('uip_user', JSON.stringify(userData));
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('uip_user');
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const updatedUser = await api.auth.getUser(user.id);
      setUser(updatedUser);
      localStorage.setItem('uip_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      currency, 
      changeCurrency, 
      formatCurrency, 
      login, 
      register, 
      logout, 
      refreshUser, 
      loading,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
