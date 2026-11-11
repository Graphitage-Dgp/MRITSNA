import axios from 'axios';

const axiosInstance = axios.create({
  // Base URL now strictly targets the admin namespace
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin`, 
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;