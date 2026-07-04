// API Service
import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5004/api'
    : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    console.error('API Error:', { 
      status: error.response?.status, 
      data: error.response?.data,
      message 
    });
    return Promise.reject(new Error(message));
  }
);

// Auth Service
export const authService = {
  registerOrLogin: async (name, phone_number) => {
    const response = await api.post('/auth/register', { name, phone_number });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/user/profile', userData);
    return response.data.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Loan Service
export const loanService = {
  createApplication: async (amount, termDays) => {
    const response = await api.post('/loans/apply', { amount, termDays });
    return response.data.data;
  },

  getUserLoans: async () => {
    const response = await api.get('/loans');
    return response.data.data;
  },

  getLoanDetails: async (loanId) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data.data;
  },

  initiateStkPush: async (phone, amount, loanAmount, termDays = 60) => {
    const response = await api.post('/stk_push', {
      phone,
      amount,
      loanAmount,
      termDays,
    });
    return response.data;
  },

  checkPaymentStatus: async (checkoutId) => {
    const response = await api.get('/check_status', {
      params: {
        checkoutId,
        t: Date.now(),
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
    return response.data;
  },
};

export default api;
