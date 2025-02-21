import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://namoraidmanagementsystembackend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  credentials: 'include'
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Add better error messages for CORS issues
    if (error.message === 'Network Error') {
      console.error('CORS or Network Error:', error);
      // You might want to show a user-friendly error message
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const mainPersonApi = {
  getAll: () => api.get('/main-persons'),
};

export const companyApi = {
  getByMainPerson: (mainPersonId) => api.get(`/companies/main-person/${mainPersonId}`),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  getStats: () => api.get('/companies/stats'),
};

export const individualApi = {
  getByCompany: (companyId) => api.get(`/individuals/company/${companyId}`),
  create: (data) => api.post('/individuals', data),
  update: (id, data) => api.put(`/individuals/${id}`, data),
  delete: (id) => api.delete(`/individuals/${id}`),
  getExpired: (mainPersonId) => api.get(`/individuals/expired/${mainPersonId}`),
  getExpiringSoon: (mainPersonId) => api.get(`/individuals/expiring-soon/${mainPersonId}`),
  payPending: (id, data) => api.post(`/individuals/${id}/pay-pending`, data),
  getByIqamaNumber: (iqamaNumber) => api.get(`/individuals/by-iqama/${iqamaNumber}`),
};

export const notificationApi = {
  getExpiring: (days = 10) => api.get(`/notifications?days=${days}`),
};

export const incomeApi = {
  getAll: () => api.get('/income'),
  getById: (id) => api.get(`/income/${id}`),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
  getByDateRange: (startDate, endDate) => 
    api.get(`/income/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getFilteredIncome: (filters) => 
    api.post('/income/filter', filters),
  getReferredByList: () => api.get('/income/referred-by')
};

export const expenseApi = {
  getAll: () => api.get('/expense'),
  getById: (id) => api.get(`/expense/${id}`),
  create: (data) => api.post('/expense', data),
  update: (id, data) => api.put(`/expense/${id}`, data),
  delete: (id) => api.delete(`/expense/${id}`),
  getByDateRange: (startDate, endDate) => 
    api.get(`/expense/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getFilteredExpense: (filters) =>
    api.post('/expense/filter', filters)
};

export const iqamaPriceApi = {
  getCurrent: () => api.get('/iqama-price/current'),
  update: (price) => api.post('/iqama-price', { price }),
};

export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export default api; 