import api from './api';

const admin_userService = {
  addUser: async (userData) => {
    try {
      const response = await api.post('/Admin/AddUser', userData);
      if (response.data === null) {
        alert("User registration Failed")
      } else {
        alert("User registered successfully")
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/Admin/delete/${id}`);
      alert("User deleted Successfully")
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
};

export default admin_userService;