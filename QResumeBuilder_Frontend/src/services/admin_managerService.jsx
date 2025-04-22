import api from './api';

const admin_managerService = {
  getAllManagers: async () => {
    try {
      const response = await api.get('http://localhost:5294/api/Admin/getallmanagers');
      return response.data;
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  },
  
  addManager: async (managerData) => {
    try {
      const response = await api.post('http://localhost:5294/api/Admin/AddManager', managerData);
      return response.data;
    } catch (error) {
      console.error('Error adding manager:', error);
      throw error;
    }
  },
  
  deleteManager: async (id) => {
    try {
      const response = await api.delete(`http://localhost:5294/api/Admin/manager/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting manager ${id}:`, error);
      throw error;
    }
  },
  
  changeRole: async (managerId, roleData) => {
    const response = await api.patch(`http://localhost:5294/api/Admin/ChangeRole/${managerId}`, roleData);
    return response.data;
  },
};

export default admin_managerService;