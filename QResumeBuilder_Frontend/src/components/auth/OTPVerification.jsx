import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, verifyOTPForgotPassword, resendOTP, forgotpasswordresendOTP } from '../../services/authService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Header from '../common/Header';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(60);

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const userData = location.state?.userData || null;
  const isRegistration = location.state?.isRegistration || false;
  const isForgotPassword = location.state?.isForgotPassword || false;

  const inputRefs = useRef([]);
  useEffect(() => {
    let interval;
    if (resendDisabled) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 60;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [resendDisabled]);
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
        if (email && !resendDisabled && !isRegistration) {
      handleResendOTP();
    }
  }, []);

  const handleChange = (index, e) => {
    const value = e.target.value;
    
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
        if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
        if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
            inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isForgotPassword) {
        await verifyOTPForgotPassword(otpValue);
      } else {
        await verifyOTP(otpValue);
      }
      
      if (isForgotPassword) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          navigate('/reset-password', {
            state: {
              email,
              otp: otpValue
            }
          });
        }, 1000);
      } else {
        setSuccess(isRegistration ? 'Registration successful!' : 'Email verified successfully!');
                setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Email is required to resend OTP');
      return;
    }
    try {
      if (isForgotPassword) {
        await forgotpasswordresendOTP({ email });
      } else {
        await resendOTP({ email });
      }
      
      setSuccess('A new OTP has been sent to your email');
      setResendDisabled(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <>
    <Header/>
    <div className="antialiased bg-primary-200 p-3 h-full">
      <div className="w-full flex justify-center items-center">
        <div className="bg-cyan-700 w-full max-w-md p-8 rounded-xl shadow-lg text-white">
          <div className="bg-white p-7 text-gray-600 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-center">Verify Your Email</h2>
            <p className="text-sm text-center mb-6">
              We've sent a verification code to<br />
              <span className="font-medium">{email || 'your email'}</span>
            </p>
            
            {error && <Alert type="error" message={error} className="mb-4" />}
            {success && <Alert type="success" message={success} className="mb-4" />}
            
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    className="w-12 h-12 text-center text-xl font-semibold ring-1 ring-gray-300 rounded-md outline-none focus:ring-2 focus:ring-teal-300"
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : null}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-700 text-white font-medium rounded focus:outline-none transition duration-150 ease-in-out py-2 px-4 font-bold rounded-lg px-6 py-3 uppercase text-sm mb-4"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Verify OTP'}
              </button>
            </form>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={resendDisabled}
                className={`text-sm ${
                  resendDisabled
                    ? 'text-gray-400'
                    : 'text-cyan-700 hover:text-cyan-900'
                }`}
              >
                {resendDisabled
                  ? `Resend OTP in ${timer}s`
                  : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default OTPVerification;