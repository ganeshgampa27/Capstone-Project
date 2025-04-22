import api from './api';
import Cookies from 'js-cookie';

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export const login = async (credentials) => {
  const response = await api.post('http://localhost:5294/api/auth/Userlogin', credentials);
  
  if (response.data.token) {
    setAuthToken(response.data.token);
  }
  
  return response.data;
};

export const initiateRegistration = async (userData) => {
  const data = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    passwordHash: userData.password,
    confirmPasswordHash: userData.password
  };
  
  const response = await api.post('http://localhost:5294/api/auth/register/initiate', data);
  console.log(response.data);
  return response.data;
};

export const verifyOTP = async (otp) => {
  const response = await api.post('http://localhost:5294/api/auth/register/verify', { otp });
  return response.data;
};

export const resendOTP = async ({ email }) => {
  const response = await api.post('http://localhost:5294/api/auth/register/resend-otp', { email });
  return response.data;
};

export const forgotpasswordresendOTP = async ({ email }) => {
  const response = await api.post('http://localhost:5294/api/password/resend-otp', { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('http://localhost:5294/api/password/forgot', { email });
  return response.data;
};

export const verifyOTPForgotPassword = async (otp) => {
  const response = await api.post('http://localhost:5294/api/password/verify-otp', { otp });
  return response.data;
};

export const resetPassword = async ({ email, newPassword, confirmPassword }) => {
  const response = await api.patch('http://localhost:5294/api/password/reset', {
    email,
    newPassword,
    confirmPassword
  });
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  Cookies.remove('token', { path: '/' });
  clearAuthToken();
};

const authService = {
  login,
  initiateRegistration,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyOTPForgotPassword,
  resetPassword,
  setAuthToken,
  clearAuthToken,
  logout
};

export default authService;