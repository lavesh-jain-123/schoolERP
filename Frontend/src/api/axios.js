import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Store toast function reference (will be set by App.jsx)
let showToastFunction = null;

export const setToastFunction = (fn) => {
  showToastFunction = fn;
};

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle different error types
    if (status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem('token');
      showToastFunction?.('Session expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else if (status === 403) {
      // Forbidden - no permission
      showToastFunction?.('⛔ You do not have permission to perform this action', 'error');
    } else if (status === 404) {
      // Not found
      showToastFunction?.(message || 'Resource not found', 'error');
    } else if (status === 400) {
      // Bad request
      showToastFunction?.(message || 'Invalid request', 'error');
    } else if (status >= 500) {
      // Server error
      showToastFunction?.('Server error. Please try again later.', 'error');
    } else if (error.code === 'ERR_NETWORK') {
      // Network error
      showToastFunction?.('Network error. Please check your connection.', 'error');
    }

    return Promise.reject(error);
  }
);

export default api;