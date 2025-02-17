import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
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

export const mainPersonApi = {
  getAll: () => axiosInstance.get('/main-persons'),
  create: (data) => axiosInstance.post('/main-persons', data),
  update: (id, data) => axiosInstance.put(`/main-persons/${id}`, data),
};

export const companyApi = {
  getAll: () => axiosInstance.get('/companies'),
  getStats: () => axiosInstance.get('/companies/stats'),
  getById: (id) => axiosInstance.get(`/companies/${id}`),
  getByMainPerson: (mainPersonId) => 
    axiosInstance.get(`/companies?mainPersonId=${mainPersonId}`),
  create: (data) => axiosInstance.post('/companies', data),
  update: (id, data) => axiosInstance.put(`/companies/${id}`, data),
  delete: (id) => axiosInstance.delete(`/companies/${id}`),
};

export const individualApi = {
  getAll: () => axiosInstance.get('/individuals'),
  getByCompany: (companyId) => 
    axiosInstance.get(`/individuals/company/${companyId}`),
  get: (id) => axiosInstance.get(`/individuals/${id}`),
  create: (data) => axiosInstance.post('/individuals', data),
  update: (id, data) => axiosInstance.put(`/individuals/${id}`, data),
  delete: (id) => axiosInstance.delete(`/individuals/${id}`),
};

export const notificationApi = {
  getExpiring: (days = 10) => axiosInstance.get(`/notifications?days=${days}`),
};

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/admin/login', credentials),
}; 