import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    if (!email || !otp) {
      setError('Missing required information. Please try again.');
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword({
        email,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      setSuccess('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Header/>
    <div className="antialiased bg-primary-200 p-3 h-full">
      <div className="w-full flex justify-center items-center">
        <div className="bg-cyan-700 w-full max-w-md p-8 rounded-xl shadow-lg text-white">
          <div className="bg-white p-7 text-gray-600 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-center">Reset Your Password</h2>
            {error && <Alert type="error" message={error} className="mb-4" />}
            {success && <Alert type="success" message={success} className="mb-4" />}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-sm" htmlFor="password">
                  New Password
                </label>
                <input
                  className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="******************"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {formData.password.length > 0 && formData.password.length < 8 && (
                  <p className="text-xs italic text-red-500">Password must be at least 8 characters long.</p>
                )}
              </div>
              <div className="mb-4">
                <label className="text-sm" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="******************"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                  <p className="text-xs italic text-red-500">Passwords do not match.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-700 text-white font-medium rounded focus:outline-none transition duration-150 ease-in-out py-2 px-4 font-bold rounded-lg px-6 py-3 uppercase text-sm mb-4"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ResetPassword;