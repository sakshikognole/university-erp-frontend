import axios from 'axios';

// Use a relative base URL so all /api/* calls go through Vite's proxy.
// In Docker: Vite proxy forwards to http://backend-spring:8080
// Locally:   Vite proxy forwards to http://localhost:8080
const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message || 'Request failed'))
);

const bookService = {
  getAll:  (search = '', page = 0, size = 10) =>
    api.get('/books', { params: { search, page, size } }),
  getById: (id)       => api.get(`/books/${id}`),
  create:  (data)     => api.post('/books', data),
  update:  (id, data) => api.put(`/books/${id}`, data),
  delete:  (id)       => api.delete(`/books/${id}`),
};

export default bookService;
