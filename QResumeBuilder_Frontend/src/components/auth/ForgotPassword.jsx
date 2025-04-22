import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await forgotPassword(email);
      navigate('/verify-otp', {
        state: {
          email,
          isForgotPassword: true
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during the password reset request');
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Header/>
    <div className="antialiased bg-primary-200 p-3 h-full">
      <div className="w-full flex justify-center items-center">
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:items-stretch md:space-x-12 bg-cyan-700 w-full max-w-4xl p-8 sm:px-12 sm:py-10 rounded-xl shadow-lg text-white overflow-hidden">
          <div className="md:py-4 flex-grow flex flex-col space-y-8 md:justify-between">
            <div>
              <h1 className="font-bold text-4xl tracking-wide">Forgot Password</h1>
              <p className="text-cyan-100 text-sm pt-2">We'll send you a verification code to reset your password.</p>
            </div>
            <div>
              <img src="review.png" alt="noImg" />
            </div>
          </div>
          <div className="relative z-10 h-20">
            <div className="absolute -top-28 -right-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
            <div className="absolute -bottom-16 -left-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
            <div className="relative z-10 w-full md:w-80 h-full bg-white p-7 text-gray-600 rounded-xl shadow-lg" style={{ minHeight: "350px" }}>
              <h3 className="text-xl font-semibold mb-4 text-center">Reset Your Password</h3>

              {error && <Alert type="error" message={error} className="mb-4" />}
              
              <form className="flex flex-col space-y-4 pt-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="flex justify-center inline-block self-end bg-cyan-700 text-white font-medium rounded focus:outline-none transition duration-150 ease-in-out py-2 px-4 font-bold rounded-lg px-6 py-2 uppercase text-sm mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : 'Continue'}
                </button>
                <div className="text-center text-sm pt-4">
                  <Link 
                    className="text-cyan-700 hover:text-cyan-900"
                    to="/login"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ForgotPassword;