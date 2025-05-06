import api from './api';

const admin_managerService = {
  getAllManagers: async () => {
    try {
      const response = await api.get('/Admin/getallmanagers');
      return response.data;
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  },
  
  addManager: async (managerData) => {
    try {
      const response = await api.post('/Admin/AddManager', managerData);
      return response.data;
    } catch (error) {
      console.error('Error adding manager:', error);
      throw error;
    }
  },
  
  deleteManager: async (id) => {
    try {
      const response = await api.delete(`/Admin/manager/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting manager ${id}:`, error);
      throw error;
    }
  },
  
  changeRole: async (managerId, roleData) => {
    const response = await api.patch(`/Admin/ChangeRole/${managerId}`, roleData);
    return response.data;
  },
};

export default admin_managerService;