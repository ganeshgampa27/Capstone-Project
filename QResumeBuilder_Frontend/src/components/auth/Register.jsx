import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { register, error: authError, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Register component mounted');
    return () => {
      console.log('Register component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('Current authError state:', authError);
  }, [authError]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));



    setValidationErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    if (name === 'email') {
      if (!value.includes('@')) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Email must contain @ symbol'
        }));
      }
    }

    if (name === 'password') {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.valid) {
        setValidationErrors(prev => ({
          ...prev,
          password: passwordValidation.message
        }));
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      }
    }
  };
  
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!hasNumber) return { valid: false, message: 'Password must contain at least one number' };
    if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };

    return { valid: true, message: '' };
  };
  
  const validateForm = () => {
    const errors = { email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.email.includes('@')) {
      errors.email = 'Email must contain @ symbol';
      isValid = false;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message;
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;
    
    try {
      console.log('Submitting registration with:', formData);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      console.log('Registration successful, navigating to /verify-otp');
      navigate('/verify-otp', { 
        state: { 
          email: formData.email,
          userData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password
          },
          isRegistration: true
        } 
      });
    } catch (err) {
      console.error('Registration error caught in Register:', err);
    }
  };
  
  return (
    <>
      <Header />
      <div className="antialiased bg-primary-200 p-3 min-h-screen">
        <div className="w-full flex justify-center items-center">
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:items-stretch md:space-x-12 bg-cyan-700 w-full max-w-4xl p-8 sm:px-12 sm:py-10 rounded-xl shadow-lg text-white overflow-hidden">
            <div className="md:py-4 flex-grow flex flex-col space-y-8 md:justify-between">
              <div>
                <h1 className="font-bold text-4xl tracking-wide">Create an Account</h1>
                <p className="text-cyan-100 text-sm pt-2">Join our community and enjoy all our services.</p>
              </div>
              <div>
                <img src="review.png" alt="Registration illustration" />
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="absolute -top-28 -right-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
              <div className="absolute -bottom-16 -left-28 z-0 bg-teal-400 w-40 h-40 rounded-full"></div>
              <div className="relative z-10 w-full md:w-80 h-full bg-white p-7 text-gray-600 rounded-xl shadow-lg" style={{ minHeight: "520px" }}>
                {authError && (
                  <div className="mb-4" style={{ position: 'relative', zIndex: 20 }}>
                    <Alert type="error" message={authError} />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-4 text-center">Sign Up</h3>
                
                <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm" htmlFor="firstName">First Name</label>
                    <input
                      className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm" htmlFor="lastName">Last Name</label>
                    <input
                      className="ring-1 ring-gray-300 mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300"
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm" htmlFor="email">Email</label>
                    <input
                      className={`ring-1 ${validationErrors.email ? 'ring-red-500' : 'ring-gray-300'} mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300`}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-xs italic text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm" htmlFor="password">Password</label>
                    <input
                      className={`ring-1 ${validationErrors.password ? 'ring-red-500' : 'ring-gray-300'} mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300`}
                      id="password"
                      name="password"
                      type="password"
                      placeholder="******************"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.password ? (
                      <p className="text-xs italic text-red-500">{validationErrors.password}</p>
                    ) : formData.password.length > 0 && (
                      <p className="text-xs italic text-gray-500">
                        Password must contain at least 8 characters, including one uppercase letter, 
                        one number, and one special character.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm" htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      className={`ring-1 ${validationErrors.confirmPassword ? 'ring-red-500' : 'ring-gray-300'} mt-2 w-full rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300`}
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="******************"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.confirmPassword && (
                      <p className="text-xs italic text-red-500">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="inline-block self-end bg-cyan-700 text-white font-bold rounded-lg px-6 py-2 uppercase text-sm mt-4 disabled:opacity-50"
                    disabled={isLoading || Object.values(validationErrors).some(error => error !== '')}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Continue'}
                  </button>
                  
                  <div className="text-center text-sm pt-4">
                    <Link className="text-cyan-700 hover:text-cyan-900" to="/login">
                      Already have an account? Login!
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

export default Register;