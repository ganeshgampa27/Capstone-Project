import React, { useEffect, useState } from 'react';
 
const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isVisible, setIsVisible] = useState(false);
 
  useEffect(() => {
    setIsVisible(true);
  }, []);
 
  return (
    <aside className="w-64 bg-black dark:bg-gray-800 text-purple-400 dark:text-purple-300 min-h-screen flex flex-col transition-all duration-300 ease-in-out">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
          <span className="ml-2 font-bold text-purple-300">AdminPanel</span>
        </div>
      </div>
     
      <nav className="shadow-md flex-1 overflow-y-auto">
        <ul className="p-4 space-y-2">
          <li className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '100ms' }}>
            <button
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${activeTab === 'users'
                  ? 'bg-purple-900 dark:bg-purple-800 text-purple-100 dark:text-purple-100'
                  : 'text-purple-400 dark:text-purple-300 hover:bg-purple-900 dark:hover:bg-purple-800'}`}
              onClick={() => setActiveTab('users')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Admin Management
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </button>
          </li>
         
          <li className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <button
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${activeTab === 'managers'
                  ? 'bg-purple-900 dark:bg-purple-800 text-purple-100 dark:text-purple-100'
                  : 'text-purple-400 dark:text-purple-300 hover:bg-purple-900 dark:hover:bg-purple-800'}`}
              onClick={() => setActiveTab('managers')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Resume Templates
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </button>
          </li>
         
          <li className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <button
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${activeTab === 'promotions'
                  ? 'bg-purple-900 dark:bg-purple-800 text-purple-100 dark:text-purple-100'
                  : 'text-purple-400 dark:text-purple-300 hover:bg-purple-900 dark:hover:bg-purple-800'}`}
              onClick={() => setActiveTab('promotions')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Promotions
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </button>
          </li>
        </ul>
      </nav>
     
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-purple-400 dark:text-purple-300">
          <div className="w-8 h-8 rounded-full bg-purple-900 mr-3 flex items-center justify-center text-purple-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">Admin</span>
        </div>
      </div>
    </aside>
  );
};
 
export default Sidebar;