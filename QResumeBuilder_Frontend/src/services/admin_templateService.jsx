import api from './api';

const admin_templateService = {
  addTemplate: async (templateData) => {
    try {
      const response = await api.post('/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting template ${id}:`, error);
      throw error;
    }
  }
};

export default admin_templateService;