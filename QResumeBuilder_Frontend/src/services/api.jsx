import axios from 'axios';

const API_URL =  'https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;