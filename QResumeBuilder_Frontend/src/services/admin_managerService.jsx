import api from './api';

const admin_managerService = {
  getAllManagers: async () => {
    try {
      const response = await api.get('https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api/Admin/getallmanagers');
      return response.data;
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  },
  
  addManager: async (managerData) => {
    try {
      const response = await api.post('https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api/Admin/AddManager', managerData);
      return response.data;
    } catch (error) {
      console.error('Error adding manager:', error);
      throw error;
    }
  },
  
  deleteManager: async (id) => {
    try {
      const response = await api.delete(`https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api/Admin/manager/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting manager ${id}:`, error);
      throw error;
    }
  },
  
  changeRole: async (managerId, roleData) => {
    const response = await api.patch(`https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api/Admin/ChangeRole/${managerId}`, roleData);
    return response.data;
  },
};

export default admin_managerService;