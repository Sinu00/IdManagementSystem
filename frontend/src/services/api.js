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
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      error: error.message
    });
    
    // Only redirect to login if there's no token or if it's expired
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
      }
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
  login: (credentials) => {
    console.log('Login URL:', `${API_URL}/api/auth/login`);
    return api.post('/api/auth/login', credentials);
  },
};

export const mainPersonApi = {
  getAll: () => api.get('/api/main-persons'),
};

export const companyApi = {
  getAll: () => api.get('/api/companies'),
  getByMainPerson: (mainPersonId) => api.get(`/api/companies/main-person/${mainPersonId}`),
  getById: (id) => api.get(`/api/companies/${id}`),
  create: (data) => api.post('/api/companies', data),
  update: (id, data) => api.put(`/api/companies/${id}`, data),
  delete: (id) => api.delete(`/api/companies/${id}`),
  getStats: () => api.get('/api/companies/stats'),
  processPayment: (id, data) => api.post(`/api/companies/${id}/payment`, data),
  processSaudiPayment: (id, data) => api.post(`/api/companies/${id}/payment`, { 
    paymentType: 'saudi',
    paymentAmount: data.amount,
    clear: data.clear
  }),
  bulkMigrate: (data) => api.post('/api/companies/bulk-migrate', data),
};

export const individualApi = {
  getAll: () => api.get('/api/individuals/all'),
  getByCompany: (companyId) => api.get(`/api/individuals/company/${companyId}`),
  create: (data) => api.post('/api/individuals', data),
  update: (id, data) => api.put(`/api/individuals/${id}`, data),
  delete: (id) => api.delete(`/api/individuals/${id}`),
  getExpired: (mainPersonId) => api.get(`/api/individuals/expired/${mainPersonId}`),
  getExpiringSoon: (mainPersonId) => api.get(`/api/individuals/expiring-soon/${mainPersonId}`),
  payPending: (id, data) => api.post(`/api/individuals/${id}/pay-pending`, data),
  getByIqamaNumber: (iqamaNumber) => api.get(`/api/individuals/by-iqama/${iqamaNumber}`),
};

export const notificationApi = {
  getExpiring: (days = 10) => api.get(`/api/notifications?days=${days}`),
};

export const notifyAdminApi = {
  getAll: () => api.get('/api/notify-admin'),
  getById: (id) => api.get(`/api/notify-admin/${id}`),
  create: (data) => api.post('/api/notify-admin', data),
  update: (id, data) => api.put(`/api/notify-admin/${id}`, data),
  delete: (id) => api.delete(`/api/notify-admin/${id}`),
  approve: (id) => api.post(`/api/notify-admin/${id}/approve`),
  reject: (id) => api.post(`/api/notify-admin/${id}/reject`),
};

export const notifyCompanyAdminApi = {
  getAll: () => api.get('/api/notify-company-admin'),
  getById: (id) => api.get(`/api/notify-company-admin/${id}`),
  create: (data) => api.post('/api/notify-company-admin', data),
  update: (id, data) => api.put(`/api/notify-company-admin/${id}`, data),
  delete: (id) => api.delete(`/api/notify-company-admin/${id}`),
  approve: (id) => api.post(`/api/notify-company-admin/${id}/approve`),
  reject: (id) => api.post(`/api/notify-company-admin/${id}/reject`),
};

export const incomeApi = {
  getAll: () => api.get('/api/income'),
  getById: (id) => api.get(`/api/income/${id}`),
  create: (data) => api.post('/api/income', data),
  update: (id, data) => api.put(`/api/income/${id}`, data),
  delete: (id) => api.delete(`/api/income/${id}`),
  getByDateRange: (startDate, endDate) => 
    api.get(`/api/income/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getFilteredIncome: (filters) => 
    api.post('/api/income/filter', filters),
  getReferredByList: () => api.get('/api/income/referred-by')
};

export const expenseApi = {
  getAll: () => api.get('/api/expense'),
  getById: (id) => api.get(`/api/expense/${id}`),
  create: (data) => api.post('/api/expense', data),
  update: (id, data) => api.put(`/api/expense/${id}`, data),
  delete: (id) => api.delete(`/api/expense/${id}`),  // This line was missing
  getByDateRange: (startDate, endDate) => 
    api.get(`/api/expense/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getFilteredExpense: (filters) =>
    api.post('/api/expense/filter', filters)
};

export const iqamaPriceApi = {
  getCurrent: () => api.get('/api/iqama-price/current'),
  update: (price) => api.post('/api/iqama-price', { price }),
};

export const userApi = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`)
};

export const nasserApi = {
  getIncome: () => api.get('/api/nasser/income'),
  getExpense: () => api.get('/api/nasser/expense'),
  getIncomeByDateRange: (startDate, endDate) => 
    api.get(`/api/nasser/income/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getExpenseByDateRange: (startDate, endDate) => 
    api.get(`/api/nasser/expense/filter/date?startDate=${startDate}&endDate=${endDate}`),
  getFilteredIncome: (filters) => 
    api.post('/api/nasser/income/filter', filters),
  getFilteredExpense: (filters) =>
    api.post('/api/nasser/expense/filter', filters),
  getReferredByList: () => api.get('/api/nasser/income/referred-by'),
  create: (data) => api.post('/api/nasser/record', { ...data, type: data.iqamaNumber ? 'income' : 'expense' }),
  update: (id, data) => api.put(`/api/nasser/record/${id}`, { ...data, type: data.iqamaNumber ? 'income' : 'expense' }),
  delete: (id, type) => api.delete(`/api/nasser/record/${id}?type=${type}`),
  getById: (id, type) => api.get(`/api/nasser/record/${id}?type=${type}`)
};

export default api;