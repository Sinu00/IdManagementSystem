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
  getByMainPerson: (mainPersonId) => 
    axiosInstance.get(`/companies/main-person/${mainPersonId}`),
  getById: (id) => axiosInstance.get(`/companies/${id}`),
  get: (id) => axiosInstance.get(`/companies/${id}`),
  create: (data) => 
    axiosInstance.post('/companies', data),
  update: (id, data) => 
    axiosInstance.put(`/companies/${id}`, data),
  delete: (id) => 
    axiosInstance.delete(`/companies/${id}`)
};

export const individualApi = {
  getAll: () => axiosInstance.get('/individuals'),
  getByCompany: (companyId) => 
    axiosInstance.get(`/individuals/company/${companyId}`),
  get: (id) => axiosInstance.get(`/individuals/${id}`),
  create: (data) => 
    axiosInstance.post('/individuals', data),
  update: (id, data) => 
    axiosInstance.put(`/individuals/${id}`, data),
  delete: (id) => 
    axiosInstance.delete(`/individuals/${id}`),
  getExpired: (mainPersonId) => axiosInstance.get(`/individuals/expired/${mainPersonId}`),
  getExpiringSoon: (mainPersonId) => axiosInstance.get(`/individuals/expiring-soon/${mainPersonId}`),
  getValid: (mainPersonId) => axiosInstance.get(`/individuals/valid/${mainPersonId}`),
};

export const notificationApi = {
  getExpiring: (days = 10) => axiosInstance.get(`/notifications?days=${days}`),
};

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/admin/login', credentials),
}; 