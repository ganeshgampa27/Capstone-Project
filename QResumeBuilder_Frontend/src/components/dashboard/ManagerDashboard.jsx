import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { AuthContext } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <aside className="w-64 bg-black text-purple-400 min-h-screen flex flex-col transition-all duration-300 ease-in-out shadow-md">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
          <span className="ml-2 font-bold text-purple-300">ManagerPanel</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="p-4 space-y-2">
          <li className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '100ms' }}>
            <button
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${activeTab === 'users'
                  ? 'bg-purple-900 text-purple-100'
                  : 'text-purple-400 hover:bg-purple-900'}`}
              onClick={() => setActiveTab('users')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Users
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </button>
          </li>

          <li className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <button
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${activeTab === 'templates'
                  ? 'bg-purple-900 text-purple-100'
                  : 'text-purple-400 hover:bg-purple-900'}`}
              onClick={() => setActiveTab('templates')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Templates
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center text-purple-400">
          <div className="w-8 h-8 rounded-full bg-purple-900 mr-3 flex items-center justify-center text-purple-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">Manager</span>
        </div>
      </div>
    </aside>
  );
};

const ManagerDashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [thumbnailStates, setThumbnailStates] = useState({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize] = useState(10);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPageInput, setUserPageInput] = useState(userCurrentPage);
  
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  const [templatePageSize] = useState(8);
  const [templateTotalPages, setTemplateTotalPages] = useState(0);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [templatePageInput, setTemplatePageInput] = useState(templateCurrentPage);

  const [activeTab, setActiveTab] = useState('users');
  const [headerAnimation, setHeaderAnimation] = useState(true);
  const [showFullTitle, setShowFullTitle] = useState(true);
  const [fadeOutPrefix, setFadeOutPrefix] = useState(false);

  const { logout } = useContext(AuthContext);
  const API_BASE_URL = 'http://localhost:5294';
  const authToken = localStorage.getItem('authToken');
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    setHeaderAnimation(true);
    setShowFullTitle(true);
    setFadeOutPrefix(false);

    const timer1 = setTimeout(() => setHeaderAnimation(false), 1000);
    const timer2 = setTimeout(() => setFadeOutPrefix(true), 2000);
    const timer3 = setTimeout(() => setShowFullTitle(false), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
  }, [userCurrentPage, templateCurrentPage]);

  useEffect(() => {
    if (userSearchTerm) {
      const lowercasedTerm = userSearchTerm.toLowerCase();
      const filtered = users.filter(user =>
        user.firstName.toLowerCase().includes(lowercasedTerm) ||
        user.lastName.toLowerCase().includes(lowercasedTerm) ||
        user.email.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearchTerm, users]);

  useEffect(() => {
    if (templateSearchTerm) {
      const lowercasedTerm = templateSearchTerm.toLowerCase();
      const filtered = templates.filter(template =>
        template.name.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [templateSearchTerm, templates]);

  useEffect(() => {
    setUserPageInput(userCurrentPage);
    setTemplatePageInput(templateCurrentPage);
  }, [userCurrentPage, templateCurrentPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Admin/GetUsersByPage?pageNumber=${userCurrentPage}&pageSize=${userPageSize}`, 
        { headers }
      );
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setUserTotalPages(response.data.totalPages);
      setTotalUsers(response.data.totalUsers);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Admin/GetTemplatesByPage?pageNumber=${templateCurrentPage}&pageSize=${templatePageSize}`, 
        { headers }
      );
      const fetchedTemplates = response.data.templates;
      setTemplates(fetchedTemplates);
      setFilteredTemplates(fetchedTemplates);
      setTemplateTotalPages(response.data.totalPages);
      setTotalTemplates(response.data.totalTemplates);
      // Initialize thumbnail states
      const initialThumbnailStates = fetchedTemplates.reduce((acc, template) => {
        acc[template.id] = template.content && !template.thumbnailUrl ? 'loading' : 'loaded';
        return acc;
      }, {});
      setThumbnailStates(initialThumbnailStates);
      fetchedTemplates.forEach((template) => {
        if (template.content && !template.thumbnailUrl) {
          generateThumbnail(template);
        }
      });
    } catch (err) {
      setError('Failed to fetch templates. Please try again later.');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateThumbnail = async (template) => {
    if (!template.content) {
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'loaded' }));
      return;
    }
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              .thumbnail-container {
                width: 210mm;
                height: auto;
                padding: 10mm;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                background-color: white;
              }
            </style>
          </head>
          <body>
            <div class="thumbnail-container">${template.content}</div>
          </body>
        </html>
      `);
      doc.close();

      const contentDiv = doc.querySelector('.thumbnail-container');
      const canvas = await html2canvas(contentDiv, {
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        logging: true,
      });

      const thumbnailUrl = canvas.toDataURL('image/png');
      console.log(`Thumbnail generated for ${template.name}: ${thumbnailUrl.slice(0, 50)}...`);

      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, thumbnailUrl } : t))
      );
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'loaded' }));
      document.body.removeChild(iframe);
    } catch (err) {
      console.error(`Error generating thumbnail for ${template.name}:`, err);
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'error' }));
    }
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const renderTemplatePreview = () => {
    if (!previewTemplate) return null;
    try {
      const isJsonContent = previewTemplate.content.trim().startsWith('{');
      if (isJsonContent) {
        const parsedContent = JSON.parse(previewTemplate.content);
        return (
          <div className="bg-gray-50 p-4 border rounded overflow-auto max-h-96">
            <pre className="text-sm">{JSON.stringify(parsedContent, null, 2)}</pre>
          </div>
        );
      } else {
        return (
          <div
            className="template-preview"
            dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
            style={{
              width: '210mm',
              margin: '0 auto',
              padding: '15mm',
              backgroundColor: 'white',
              boxShadow: '0 0 15px rgba(0,0,0,0.1)',
              fontFamily: 'Arial, sans-serif',
              fontSize: '12pt',
              lineHeight: '1.5',
            }}
          />
        );
      }
    } catch (e) {
      return (
        <div className="bg-gray-50 p-4 border rounded overflow-auto max-h-96">
          <pre className="text-sm">{previewTemplate.content}</pre>
        </div>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  const handleUserPreviousPage = () => {
    if (userCurrentPage > 1) {
      setUserCurrentPage(userCurrentPage - 1);
      setUserPageInput(userCurrentPage - 1);
    }
  };

  const handleUserNextPage = () => {
    if (userCurrentPage < userTotalPages) {
      setUserCurrentPage(userCurrentPage + 1);
      setUserPageInput(userCurrentPage + 1);
    }
  };

  const handleUserPageInputChange = (e) => setUserPageInput(e.target.value);

  const handleUserPageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(userPageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > userTotalPages) {
      toast.error(`The maximum number of pages is ${userTotalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setUserPageInput(userCurrentPage);
    } else {
      setUserCurrentPage(pageNum);
      setUserPageInput(pageNum);
    }
  };

  const handleTemplatePreviousPage = () => {
    if (templateCurrentPage > 1) {
      setTemplateCurrentPage(templateCurrentPage - 1);
      setTemplatePageInput(templateCurrentPage - 1);
    }
  };

  const handleTemplateNextPage = () => {
    if (templateCurrentPage < templateTotalPages) {
      setTemplateCurrentPage(templateCurrentPage + 1);
      setTemplatePageInput(templateCurrentPage + 1);
    }
  };

  const handleTemplatePageInputChange = (e) => setTemplatePageInput(e.target.value);

  const handleTemplatePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(templatePageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > templateTotalPages) {
      toast.error(`The maximum number of pages is ${templateTotalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTemplatePageInput(templateCurrentPage);
    } else {
      setTemplateCurrentPage(pageNum);
      setTemplatePageInput(pageNum);
    }
  };

  const renderUsersTab = () => (
    <>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">User Search</h2>
        <div className="flex">
          <input
            type="text"
            placeholder="Search by name or email"
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-l"
          />
          <button
            onClick={() => {/* Search is handled by useEffect */}}
            className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700 transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {userSearchTerm ? `Search Results: ${filteredUsers.length} found` : `All Users (${totalUsers} total)`}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">ID</th>
                <th className="text-left p-2 border">Name</th>
                <th className="text-left p-2 border">Email</th>
                <th className="text-left p-2 border">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{user.id}</td>
                  <td className="p-2 border">{user.firstName} {user.lastName}</td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">{formatDate(user.joinDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No users found</p>
          )}
        </div>

        {userTotalPages > 1 && (
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button 
              onClick={handleUserPreviousPage} 
              disabled={userCurrentPage === 1} 
              className={`p-1 rounded ${userCurrentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <form onSubmit={handleUserPageSubmit} className="flex items-center">
              <span className="text-gray-700 font-medium">Page</span>
              <input
                type="number"
                value={userPageInput}
                onChange={handleUserPageInputChange}
                className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                min="1"
              />
              <span className="text-gray-700 font-medium">of {userTotalPages}</span>
            </form>
            <button 
              onClick={handleUserNextPage} 
              disabled={userCurrentPage === userTotalPages} 
              className={`p-1 rounded ${userCurrentPage === userTotalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderTemplatesTab = () => (
    <>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Template Search</h2>
        <div className="flex">
          <input
            type="text"
            placeholder="Search by template name"
            value={templateSearchTerm}
            onChange={(e) => setTemplateSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-l"
          />
          <button
            onClick={() => {/* Search is handled by useEffect */}}
            className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700 transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {templateSearchTerm ? `Search Results: ${filteredTemplates.length} found` : `All Templates (${totalTemplates} total)`}
        </h2>
        
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <p className="text-gray-500">No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-gray-200 hover:border-purple-300 transform hover:-translate-y-2"
                onClick={() => handlePreviewTemplate(template)}
              >
                <div className="relative bg-gray-50 overflow-hidden" style={{ paddingTop: '133.33%' }}>
                  {thumbnailStates[template.id] === 'loading' ? (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  ) : thumbnailStates[template.id] === 'error' ? (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-5xl font-bold text-gray-300">{template.name.charAt(0)}</div>
                    </div>
                  ) : (
                    <img
                      src={
                        template.thumbnailUrl ||
                        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E${template.name.charAt(0)}%3C/text%3E%3C/svg%3E`
                      }
                      alt={`${template.name} template preview`}
                      className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error(`Image load error for ${template.name}`);
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E${template.name.charAt(0)}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold text-center px-4">
                      Click to View
                    </span>
                  </div>
                </div>
                <div className="p-4 border-t bg-white">
                  <h3 className="font-semibold text-base truncate">{template.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {templateTotalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button 
              onClick={handleTemplatePreviousPage} 
              disabled={templateCurrentPage === 1} 
              className={`p-1 rounded ${templateCurrentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <form onSubmit={handleTemplatePageSubmit} className="flex items-center">
              <span className="text-gray-700 font-medium">Page</span>
              <input
                type="number"
                value={templatePageInput}
                onChange={handleTemplatePageInputChange}
                className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                min="1"
              />
              <span className="text-gray-700 font-medium">of {templateTotalPages}</span>
            </form>
            <button 
              onClick={handleTemplateNextPage} 
              disabled={templateCurrentPage === templateTotalPages} 
              className={`p-1 rounded ${templateCurrentPage === templateTotalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <ToastContainer />
      <header className="bg-purple-900 text-purple-100 shadow-md p-4 relative">
        <div className="flex justify-center items-center">
          {showFullTitle ? (
            <h1 className={`text-2xl font-bold text-purple-100 ${headerAnimation ? 'animate-[slideIn_1s_ease-in-out]' : ''}`}>
              <span className={fadeOutPrefix ? 'animate-[fadeOut_1s_ease-in-out]' : ''}>
                Resume Builder{' '}
              </span>
              Manager Dashboard
            </h1>
          ) : (
            <h1 className="text-2xl font-bold text-purple-100">
              Manager Dashboard
            </h1>
          )}
        </div>
        <button
          onClick={() => logout()}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-purple-300 px-4 py-2 rounded-md shadow-md transition-all duration-300 hover:scale-105"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-1">
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-6 bg-[#ECF3FF]">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          )}

          {activeTab === 'users' ? renderUsersTab() : renderTemplatesTab()}
        </main>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-modalFadeIn">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">{previewTemplate?.name} Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {renderTemplatePreview()}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes modalFadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;