import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Bills ───────────────────────────────────────────────
export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  generatePDF: (id) => api.post(`/bills/${id}/pdf`, {}, { timeout: 60000 }),
  getNextNumber: () => api.get('/bills/next-number'),
};

// ─── Templates ───────────────────────────────────────────
export const templatesAPI = {
  getAll: () => api.get('/templates'),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  setDefault: (id) => api.post(`/templates/${id}/default`),
  preview: (data) => api.post('/templates/preview', data),
};

// ─── Settings ────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// ─── Backup ──────────────────────────────────────────────
export const backupAPI = {
  create: (path) => api.post('/backup', { path }, { timeout: 120000 }),
  createLocal: (targetPath) => api.post('/backup/local', { targetPath }, { timeout: 180000 }),
  restore: (path) => api.post('/restore', { path }, { timeout: 120000 }),
};

// ─── Uploads ─────────────────────────────────────────────
export const uploadAPI = {
  logo: (formData) =>
    axios.post(`${BASE_URL.replace('/api', '')}/upload/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
  signature: (formData) =>
    axios.post(`${BASE_URL.replace('/api', '')}/upload/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

export default api;
