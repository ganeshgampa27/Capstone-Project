import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login,error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Attempting login...');
      const response = await login({ email, password });
     
      
      // Navigate based on user role
      const role = (response.user || '').toLowerCase();
      
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
      console.log('Loading set to false');
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
              <h1 className="font-bold text-4xl tracking-wide">Login to Your Account</h1>
              <p className="text-cyan-100 text-sm pt-2">Welcome back! Please login to access your account.</p>
            </div>
            <div>
              <img src="Laptop_Man.png" alt="No Image" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="absolute -top-28 -right-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
            <div className="absolute -bottom-16 -left-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
            <div className="relative z-10 w-full md:w-80 h-full bg-white p-7 text-gray-600 rounded-xl shadow-lg" style={{ minHeight: "300px" }}>
              <h3 className="text-xl font-semibold mb-4 text-center">Sign In</h3>
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="flex flex-col space-y-6">
                <div>
                  <label className="text-sm" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-block self-end bg-cyan-700 text-white font-bold rounded-lg px-6 py-2 uppercase text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" color="text-white" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
                <div className="text-center text-sm">
                  <Link 
                    className="text-cyan-700 hover:text-cyan-900"
                    to="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="text-center text-sm">
                  <Link 
                    className="text-cyan-700 hover:text-cyan-900"
                    to="/register"
                  >
                    Don't have an account? Sign up!
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

export default Login;