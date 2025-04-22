import React, { useState, useEffect } from 'react';
import admin_managerService from '../../../services/admin_managerService';

const Promotions = () => {
  const [managerId, setManagerId] = useState('');
  const [newRole, setNewRole] = useState('');
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchManagers();
  },[]);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const fetchedManagers = await admin_managerService.getAllManagers();
      const eligibleManagers = fetchedManagers.filter(manager => manager.role !== 'admin');
      setManagers(eligibleManagers);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch managers');
      setLoading(false);
      console.error('Error fetching managers:', err);
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!managerId || String(managerId).trim() === '') {
      setPromotionError('Please enter a manager ID');
      return;
    }

    setPromotionLoading(true);
    setPromotionError(null);
    setSuccessMessage('');

    try {
      await admin_managerService.changeRole(managerId, { role: newRole });
      setSuccessMessage(`Manager ${managerId} has been successfully changed to ${newRole}`);
      setManagerId('');
      setNewRole('');
      await fetchManagers();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setPromotionError(err.response.data.message);
      } else {
        setPromotionError(err.message || 'Failed to change manager role');
      }
      console.error(err);
    } finally {
      setPromotionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  const eligibleManagers = managers.filter(manager => manager.role !== 'admin');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manager Role Management</h2>
      
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
      
      {successMessage && (
        <div className="bg-green-50 p-4 rounded mb-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {promotionError && (
        <div className="bg-red-50 p-4 rounded mb-4">
          <p className="text-red-700">{promotionError}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">Change Manager Role</h3>
        <form onSubmit={handleRoleChange}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager ID</label>
              <input
                type="text"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter manager ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter role name"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={promotionLoading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {promotionLoading ? 'Processing...' : 'Change Role'}
          </button>
        </form>
      </div>

      {eligibleManagers.length > 0 && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="font-semibold text-lg mb-3">Available Managers</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">ID</th>
                  <th className="text-left p-2 border">Name</th>
                  <th className="text-left p-2 border">Email</th>
                  <th className="text-left p-2 border">Role</th>
                  <th className="text-left p-2 border">Join Date</th>
                  {eligibleManagers[0] && eligibleManagers[0].status && (
                    <th className="text-left p-2 border">Status</th>
                  )}
                  <th className="text-left p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eligibleManagers.map(manager => (
                  <tr key={manager.id}>
                    <td className="p-2 border">{manager.id}</td>
                    <td className="p-2 border">{manager.firstName} {manager.lastName}</td>
                    <td className="p-2 border">{manager.email}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        manager.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        manager.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {manager.role || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2 border">{formatDate(manager.joinDate)}</td>
                    {manager.status && (
                      <td className="p-2 border">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          manager.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {manager.status}
                        </span>
                      </td>
                    )}
                    <td className="p-2 border">
                      <button 
                        onClick={() => {
                          setManagerId(manager.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {eligibleManagers.length === 0 && !loading && (
        <div className="bg-white p-4 rounded shadow mb-6 text-center">
          <p className="text-gray-500">No eligible managers found.</p>
        </div>
      )}
    </div>
  );
};

export default Promotions;