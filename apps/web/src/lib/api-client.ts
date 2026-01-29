import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getToken, setToken, removeToken } from './auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          setToken(accessToken);
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
  },

  // Tasks
  tasks: {
    list: (projectId: string, params?: any) =>
      apiClient.get(`/tasks`, { params: { projectId, ...params } }),
    get: (id: string) => apiClient.get(`/tasks/${id}`),
    create: (data: any) => apiClient.post('/tasks', data),
    update: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tasks/${id}`),
    start: (id: string) => apiClient.post(`/tasks/${id}/start`),
    complete: (id: string, data?: any) => apiClient.post(`/tasks/${id}/complete`, data),
  },

  // Inspections
  inspections: {
    list: (projectId: string, params?: any) =>
      apiClient.get('/inspections', { params: { projectId, ...params } }),
    get: (id: string) => apiClient.get(`/inspections/${id}`),
    create: (data: any) => apiClient.post('/inspections', data),
    update: (id: string, data: any) => apiClient.put(`/inspections/${id}`, data),
    complete: (id: string) => apiClient.post(`/inspections/${id}/complete`),
    pass: (id: string, data?: any) => apiClient.post(`/inspections/${id}/pass`, data),
    reject: (id: string, data: any) => apiClient.post(`/inspections/${id}/reject`, data),
  },

  // Issues
  issues: {
    list: (projectId: string, params?: any) =>
      apiClient.get('/issues', { params: { projectId, ...params } }),
    get: (id: string) => apiClient.get(`/issues/${id}`),
    create: (data: any) => apiClient.post('/issues', data),
    update: (id: string, data: any) => apiClient.put(`/issues/${id}`, data),
    assign: (id: string, userId: string) => apiClient.post(`/issues/${id}/assign`, { userId }),
  },

  // Deliveries
  deliveries: {
    list: (projectId: string, params?: any) =>
      apiClient.get('/deliveries', { params: { projectId, ...params } }),
    get: (id: string) => apiClient.get(`/deliveries/${id}`),
    create: (data: any) => apiClient.post('/deliveries', data),
    update: (id: string, data: any) => apiClient.put(`/deliveries/${id}`, data),
    confirm: (id: string) => apiClient.post(`/deliveries/${id}/confirm`),
  },

  // Decisions
  decisions: {
    list: (projectId: string, params?: any) =>
      apiClient.get('/decisions', { params: { projectId, ...params } }),
    get: (id: string) => apiClient.get(`/decisions/${id}`),
    create: (data: any) => apiClient.post('/decisions', data),
    approve: (id: string) => apiClient.post(`/decisions/${id}/approve`),
    reject: (id: string, reason?: string) =>
      apiClient.post(`/decisions/${id}/reject`, { reason }),
  },

  // Files
  files: {
    upload: (formData: FormData) =>
      apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    list: (projectId: string) => apiClient.get('/files', { params: { projectId } }),
    getDownloadUrl: (id: string) => apiClient.get(`/files/${id}/download`),
    delete: (id: string) => apiClient.delete(`/files/${id}`),
  },

  // Reports
  reports: {
    dashboard: (projectId: string) => apiClient.get(`/reports/dashboard/${projectId}`),
    tasksSummary: (projectId: string) => apiClient.get(`/reports/tasks-summary/${projectId}`),
    projectHealth: (projectId: string) => apiClient.get(`/reports/project-health/${projectId}`),
    timeline: (projectId: string) => apiClient.get(`/reports/timeline/${projectId}`),
  },

  // Notifications
  notifications: {
    list: (unreadOnly?: boolean) =>
      apiClient.get('/notifications', { params: { unreadOnly } }),
    markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.post('/notifications/mark-all-read'),
  },
};
