import React, { useState, useEffect } from 'react';
import admin_userService from '../../../services/admin_userService';
import admin_managerService from '../../../services/admin_managerService';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const AdminManagement = () => {
  const [searchName, setSearchName] = useState('');
  const [personDetails, setPersonDetails] = useState(null);
  const [allPeople, setAllPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [showAllPeople, setShowAllPeople] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showNotFoundMessage, setShowNotFoundMessage] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [batchFile, setBatchFile] = useState(null);
  const [batchImportError, setBatchImportError] = useState(null);
  const [batchImportSuccess, setBatchImportSuccess] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage);

  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5294/api/Admin/GetUserPagination', {
        params: {
          pageNumber: currentPage,
          pageSize: pageSize
        }
      });

      if (response.data && Array.isArray(response.data.users)) {
        const combinedData = response.data.users.map(item => ({
          ...item,
          role: item.role || (item.role === 'manager' ? 'manager' : 'user')
        }));
        setAllPeople(combinedData);
        setFilteredPeople(combinedData);
        setTotalPages(Math.ceil(response.data.totalUsers / pageSize));
      } else {
        setError('No user data received from server');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users: ' + (err.message || 'Unknown error'));
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    let filtered = [...allPeople];
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(person => 
        person.role.toLowerCase() === filterRole.toLowerCase()
      );
    }
    
    if (searchName.trim() !== '') {
      const lowerCaseSearch = searchName.toLowerCase();
      filtered = filtered.filter(person =>
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(lowerCaseSearch) ||
        person.email.toLowerCase().includes(lowerCaseSearch)
      );
      
      setShowNotFoundMessage(filtered.length === 0);
      setNotFoundMessage(`No results found for "${searchName}"`);
    } else {
      setShowNotFoundMessage(false);
    }
    
    setFilteredPeople(filtered);
  }, [searchName, allPeople, filterRole]);

  const handleBatchFileChange = (e) => {
    const file = e.target.files[0];
    setBatchFile(file);
    setBatchImportError(null);
    setBatchImportSuccess(null);
  };

  const handleBatchImport = async () => {
    if (!batchFile) {
      setBatchImportError('Please select a file to import');
      return;
    }

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!allowedTypes.includes(batchFile.type)) {
      setBatchImportError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    try {
      setLoading(true);
      setBatchImportError(null);
      setBatchImportSuccess(null);

      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          let transformedData;
          
          if (batchFile.type === 'text/csv') {
            const text = e.target.result;
            const data = parseCSV(text);
            transformedData = data.map(item => ({
              firstName: item.firstName || item.Firstname || item.firstname || "",
              lastName: item.lastName || item.Lastname || item.lastname || "",
              email: item.email || item.Email || "",
              role: item.role || item.Role || "user",
              passwordHash: item.password || item.Password || "Temporary1!",
              confirmPasswordHash: item.password || item.Password || "Temporary1!"
            }));
          } else {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            transformedData = jsonData.map(item => ({
              firstName: item.firstName || item.Firstname || item.firstname || item['First Name'] || "",
              lastName: item.lastName || item.Lastname || item.lastname || item['Last Name'] || "",
              email: item.email || item.Email || item['E-mail'] || "",
              role: item.role || item.Role || "user",
              passwordHash: item.password || item.Password || "Temporary1!",
              confirmPasswordHash: item.password || item.Password || "Temporary1!"
            }));
          }

          const validData = transformedData.filter(item =>
            item.firstName && item.lastName && item.email
          );

          if (validData.length === 0) {
            setBatchImportError('No valid user data found in the file.');
            setLoading(false);
            return;
          }

          const response = await axios.post('http://localhost:5294/api/Admin/batch-insert', validData);
          await fetchData();
          setBatchImportSuccess(response.data || `${validData.length} employees added successfully!`);
          setBatchFile(null);
          document.getElementById('batchFileInput').value = '';
        } catch (err) {
          setBatchImportError(err.response?.data || err.message || 'Failed to parse file data');
        } finally {
          setLoading(false);
        }
      };

      if (batchFile.type === 'text/csv') {
        fileReader.readAsText(batchFile);
      } else {
        fileReader.readAsArrayBuffer(batchFile);
      }
    } catch (err) {
      setBatchImportError('Failed to process file');
      setLoading(false);
    }
  };

  function parseCSV(csvText) {
    csvText = csvText.trim();
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) throw new Error("CSV file appears to be empty or contains only headers");
    
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    for (let i = 1; i <= lines.length; i++) {
      if (!lines[i]?.trim()) continue;
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length < headers.length) continue;
      
      const entry = {};
      headers.forEach((header, index) => {
        if (index < values.length) entry[header] = values[index];
      });
      data.push(entry);
    }
    return data;
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setPageInput(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setPageInput(currentPage + 1);
    }
  };

  const handlePageInputChange = (e) => setPageInput(e.target.value);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      toast.error(`The maximum number of pages is ${totalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setPageInput(currentPage);
    } else {
      setCurrentPage(pageNum);
      setPageInput(pageNum);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password, confirmPassword) => {
    const errors = {};
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) errors.password = errors.password || 'Password must contain at least one uppercase letter';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.password = errors.password || 'Password must contain at least one special character';
    if (!/\d/.test(password)) errors.password = errors.password || 'Password must contain at least one number';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleViewPerson = (person) => {
    setShowNotFoundMessage(false);
    setPersonDetails(person);
    setShowAllPeople(false);
  };

  const handleGoBack = () => {
    setPersonDetails(null);
    setShowAllPeople(true);
  };

  const handleAddPerson = async () => {
    setValidationErrors({});
    const errors = {};

    if (!newPerson.role) {
      alert('Please select a role before adding a new member');
      return;
    }

    if (!newPerson.firstName) errors.firstName = 'First name is required';
    if (!newPerson.lastName) errors.lastName = 'Last name is required';
    if (!newPerson.email) errors.email = 'Email is required';
    else if (!validateEmail(newPerson.email)) errors.email = 'Please enter a valid email address';

    const passwordErrors = validatePassword(newPerson.password, newPerson.confirmPassword);
    Object.assign(errors, passwordErrors);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const personData = {
        firstName: newPerson.firstName,
        lastName: newPerson.lastName,
        email: newPerson.email,
        role: newPerson.role,
        passwordHash: newPerson.password,
        confirmPasswordHash: newPerson.confirmPassword
      };

      if (newPerson.role === 'user') {
        await admin_userService.addUser(personData);
      } else {
        await admin_managerService.addManager(personData);
      }

      await fetchData();

      setNewPerson({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: ''
      });
      setShowAllPeople(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to add ${newPerson.role}`);
      setLoading(false);
    }
  };

  const handlePersonInputChange = (e) => {
    const { name, value } = e.target;
    setNewPerson({ ...newPerson, [name]: value });
    
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
    
    if (name === 'password' || name === 'confirmPassword') {
      if (validationErrors.confirmPassword) {
        setValidationErrors({ ...validationErrors, confirmPassword: null });
      }
    }
  };

  const handleRemovePerson = async (person) => {
    if (window.confirm(`Are you sure you want to remove this ${person.role}?`)) {
      try {
        setLoading(true);
        setError(null);

        if (person.role === 'user') {
          await admin_userService.deleteUser(person.id);
        } else {
          await admin_managerService.deleteManager(person.id);
        }

        await fetchData();

        if (personDetails && personDetails.id === person.id && personDetails.role === person.role) {
          setPersonDetails(null);
          setShowAllPeople(true);
        }
        setLoading(false);
      } catch (err) {
        setError(`Failed to delete ${person.role}: ${person.id}`);
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (err) {
      return 'N/A';
    }
  };

  const getRoleDisplay = (role) => {
    if (!role) return 'N/A';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleFilterRoleChange = (e) => {
    setFilterRole(e.target.value);
    setShowAllPeople(true);
    setPersonDetails(null);
  };

  return (
    <div>
      <ToastContainer />
      <h2 className="text-xl font-semibold mb-4">Admin Management System</h2>
      
      {loading && (
        <div className="bg-blue-50 p-4 rounded mb-4">
          <p className="text-blue-700">Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">Add New Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={newPerson.firstName}
              onChange={handlePersonInputChange}
              placeholder="First Name"
              className={`w-full p-2 border rounded ${validationErrors.firstName ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={newPerson.lastName}
              onChange={handlePersonInputChange}
              placeholder="Last Name"
              className={`w-full p-2 border rounded ${validationErrors.lastName ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={newPerson.email}
              onChange={handlePersonInputChange}
              placeholder="Email Address"
              className={`w-full p-2 border rounded ${validationErrors.email ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={newPerson.role}
              onChange={handlePersonInputChange}
              className={`w-full p-2 border rounded ${validationErrors.role ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select an option</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
            {validationErrors.role && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.role}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={newPerson.password}
              onChange={handlePersonInputChange}
              placeholder="Password"
              className={`w-full p-2 border rounded ${validationErrors.password ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.password && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
            )}
            <ul className="text-xs text-gray-500 mt-1">
              <li className={newPerson.password.length >= 8 ? 'text-green-500' : ''}>
                ✓ Minimum 8 characters
              </li>
              <li className={/[A-Z]/.test(newPerson.password) ? 'text-green-500' : ''}>
                ✓ At least one uppercase letter
              </li>
              <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPerson.password) ? 'text-green-500' : ''}>
                ✓ At least one special character
              </li>
              <li className={/\d/.test(newPerson.password) ? 'text-green-500' : ''}>
                ✓ At least one number
              </li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={newPerson.confirmPassword}
              onChange={handlePersonInputChange}
              placeholder="Confirm Password"
              className={`w-full p-2 border rounded ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleAddPerson}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {loading ? 'Adding...' : newPerson.role ? `Add ${getRoleDisplay(newPerson.role)}` : 'Add Member'}
        </button>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">Batch Import Users</h3>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            id="batchFileInput"
            accept=".csv,.xlsx,.xls"
            onChange={handleBatchFileChange}
            className="flex-1"
          />
          <button
            onClick={handleBatchImport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={loading || !batchFile}
          >
            {loading ? 'Importing...' : 'Import Users'}
          </button>
        </div>
        
        {batchImportError && (
          <div className="bg-red-50 p-3 rounded mt-3">
            <p className="text-red-700">{batchImportError}</p>
          </div>
        )}
        
        {batchImportSuccess && (
          <div className="bg-green-50 p-3 rounded mt-3">
            <p className="text-green-700">{batchImportSuccess}</p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Supported file types: CSV, Excel (.xlsx, .xls)
        </p>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">Search Users</h3>
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="flex flex-1">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by name or email"
              className="flex-1 p-2 border rounded-l"
            />
            <button
              onClick={() => setShowAllPeople(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <select
            value={filterRole}
            onChange={handleFilterRoleChange}
            className="p-2 border rounded"
          >
            <option value="all">All Members</option>
            <option value="user">Users</option>
            <option value="manager">Managers</option>
          </select>
        </div>
      </div>
      
      {personDetails && !showAllPeople && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleGoBack}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to List
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <p className="text-gray-600">ID:</p>
            <p>{personDetails.id}</p>
            <p className="text-gray-600">Name:</p>
            <p>{personDetails.firstName} {personDetails.lastName}</p>
            <p className="text-gray-600">Email:</p>
            <p>{personDetails.email}</p>
            <p className="text-gray-600">Role:</p>
            <p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                personDetails.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                personDetails.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getRoleDisplay(personDetails.role)}
              </span>
            </p>
            <p className="text-gray-600">Join Date:</p>
            <p>{formatDate(personDetails.joinDate)}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => handleRemovePerson(personDetails)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={loading}
            >
              {loading ? 'Removing...' : `Remove ${getRoleDisplay(personDetails.role)}`}
            </button>
          </div>
        </div>
      )}
      
      {showAllPeople && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">
              {searchName || filterRole !== 'all' ?
                `Search Results: ${filteredPeople.length} found` :
                'All Members'
              }
            </h3>
            {filteredPeople.length > 0 && (
              <button
                onClick={() => setShowAllPeople(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Hide List
              </button>
            )}
          </div>
          
          {filteredPeople.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border">ID</th>
                      <th className="text-left p-2 border">Name</th>
                      <th className="text-left p-2 border">Email</th>
                      <th className="text-left p-2 border">Role</th>
                      <th className="text-left p-2 border">Join Date</th>
                      <th className="text-left p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople.map(person => (
                      <tr key={`${person.role}-${person.id}`}>
                        <td className="p-2 border">{person.id}</td>
                        <td className="p-2 border">{person.firstName} {person.lastName}</td>
                        <td className="p-2 border">{person.email}</td>
                        <td className="p-2 border">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            person.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            person.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getRoleDisplay(person.role)}
                          </span>
                        </td>
                        <td className="p-2 border">{formatDate(person.joinDate)}</td>
                        <td className="p-2 border">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewPerson(person)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                              disabled={loading}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRemovePerson(person)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center space-x-2">
                  <button 
                    onClick={handlePreviousPage} 
                    disabled={currentPage === 1} 
                    className={`p-1 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <form onSubmit={handlePageSubmit} className="flex items-center">
                    <span className="text-gray-700 font-medium">Page</span>
                    <input
                      type="number"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <span className="text-gray-700 font-medium">of {totalPages}</span>
                  </form>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages} 
                    className={`p-1 rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  {showNotFoundMessage ? notFoundMessage :
                    filterRole === 'user' ? 'No users found.' :
                    filterRole === 'manager' ? 'No managers found.' :
                    'No members found. Add a new member to get started.'}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManagement;