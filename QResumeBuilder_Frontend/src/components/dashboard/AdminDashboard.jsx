import React, { useState, useEffect,useContext } from 'react';
import Sidebar from './AdminOperations/SideBar';
import Promotions from './AdminOperations/Promotions';
import { AuthContext } from '../../contexts/AuthContext';
import TemplatesManagement from './AdminOperations/TemplatesManagement';
import AdminManagement from './AdminOperations/AdminManagement';
 
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { logout } = useContext(AuthContext);
 
  const [headerAnimation, setHeaderAnimation] = useState(true);
  const [showFullTitle, setShowFullTitle] = useState(true);
  const [fadeOutPrefix, setFadeOutPrefix] = useState(false);

  useEffect(() => {
    setHeaderAnimation(true);
    setShowFullTitle(true);
    setFadeOutPrefix(false);
   
    const timer1 = setTimeout(() => {
      setHeaderAnimation(false);
    }, 1000);
   
    const timer2 = setTimeout(() => {
      setFadeOutPrefix(true);
    }, 2000);
   
    const timer3 = setTimeout(() => {
      setShowFullTitle(false);
    }, 3000);
   
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
 
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
<header className="bg-purple-900 text-purple-100 shadow-md p-4 relative">
  <div className="flex justify-center items-center">
    {showFullTitle ? (
      <h1 className={`text-2xl font-bold text-purple-100 ${headerAnimation ? 'animate-[slideIn_1s_ease-in-out]' : ''}`}>
        <span className={fadeOutPrefix ? 'animate-[fadeOut_1s_ease-in-out]' : ''}>
          Resume Builder{' '}
        </span>
        Admin Dashboard
      </h1>
    ) : (
      <h1 className="text-2xl font-bold text-purple-100">
        Admin Dashboard
      </h1>
    )}
  </div>
  <button
    onClick={handleLogout}
    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-purple-300 px-4 py-2 rounded-md shadow-md transition-all duration-300 hover:scale-105"
  >
    Logout
  </button>
</header>
     
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
       
        <main className="flex-1 p-6 bg-[#ECF3FF]">
          {activeTab === 'users' && (
            <AdminManagement/>
          )}
         
          {activeTab === 'managers' && (
            <TemplatesManagement/>
          )}
 
          {activeTab === 'promotions' && (
            <Promotions/>
          )}
        </main>
      </div>
       <style jsx>{`
        @keyframes slideIn {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
       
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
       
        /* Add a global button style for all buttons in the app */
        button {
          transition: all 0.3s ease;
        }
       
        button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};
 
export default AdminDashboard;