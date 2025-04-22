import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const cookieOptions = {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('token');
      const userRole = Cookies.get('userRole');
      
      if (token && userRole) {
        try {
          authService.setAuthToken(token);
          setCurrentUser({ role: userRole });
        } catch (err) {
          console.error('Failed to load user:', err);
          Cookies.remove('token', { path: '/' });
          Cookies.remove('userRole', { path: '/' });
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      Cookies.set('token', response.token, cookieOptions);
      const userRole = response.user.toLowerCase();
      Cookies.set('userRole', userRole, cookieOptions);
      setCurrentUser({ role: userRole });
      setIsLoading(false);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    try {
      authService.logout().catch(err => console.error('Logout API error:', err));
    } finally {
      Cookies.remove('token', { path: '/logout' });
      Cookies.remove('userRole', { path: '/logout' });
      setCurrentUser(null);
      authService.clearAuthToken();
    }
  };

  const register = async (userData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.initiateRegistration(userData);
      setIsLoading(false);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setIsLoading(false);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset password link.');
      setIsLoading(false);
      throw err;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    forgotPassword,
    isLoading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;