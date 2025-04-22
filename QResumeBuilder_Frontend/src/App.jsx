import { BrowserRouter as Router } from 'react-router-dom';
import React, { useContext } from 'react';
import AppRoutes from './Routes';
import Footer from './components/common/Footer';
import { AuthProvider,AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import './styles/tailwind.css';

const AppLayout = () => {
  const { isLoading } = useContext(AuthContext);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <LoadingSpinner size="lg" color="text-cyan-700" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading application...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="app-container">
      <div className="app-content">
          <AppRoutes />
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
};

export default App;