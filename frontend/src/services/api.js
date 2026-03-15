import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with consistent configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    console.log(`📡 ${config.method.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.method.toUpperCase()} ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Enhance error messages
    console.error(`❌ Error from ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 400) {
      error.message = error.response.data?.error || 'Invalid request';
    } else if (error.response?.status === 401) {
      error.message = 'Authentication required';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
