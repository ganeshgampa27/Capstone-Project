import React, { useState, useEffect } from 'react';

const Alert = ({ type = 'info', message, className = '', dismissible = true, duration = 0 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => setIsVisible(false);

  if (!isVisible || !message) return null;

  const typeStyles = {
    info: 'bg-blue-100 border-blue-500 text-blue-700',
    success: 'bg-green-100 border-green-500 text-green-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    error: 'bg-red-100 border-red-500 text-red-700',
  };

  return (
    <div
      className={`border-l-4 p-4 ${typeStyles[type]} ${className}`}
      role="alert"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d={type === 'error' 
              ? 'M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z' 
              : 'M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z'} 
            />
          </svg>
          <p className="flex-1">{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-current hover:text-gray-800 flex-shrink-0 ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;