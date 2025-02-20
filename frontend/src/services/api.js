import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
    api.get(`/income/filter/date?startDate=${startDate}&endDate=${endDate}`)
};

export const expenseApi = {
  getAll: () => api.get('/expense'),
  getById: (id) => api.get(`/expense/${id}`),
  create: (data) => api.post('/expense', data),
  update: (id, data) => api.put(`/expense/${id}`, data),
  delete: (id) => api.delete(`/expense/${id}`),
  getByDateRange: (startDate, endDate) => 
    api.get(`/expense/filter/date?startDate=${startDate}&endDate=${endDate}`)
};

export default api; 