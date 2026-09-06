import { springApi } from './api';

// springApi already has the correct base URL (VITE_SPRING_API_URL/api in
// production, /api proxy in local/Docker dev) and the response interceptor
// that unwraps res.data, so callers receive the body directly.
const bookService = {
  getAll:  (search = '', page = 0, size = 10) =>
    springApi.get('/books', { params: { search, page, size } }),
  getById: (id)       => springApi.get(`/books/${id}`),
  create:  (data)     => springApi.post('/books', data),
  update:  (id, data) => springApi.put(`/books/${id}`, data),
  delete:  (id)       => springApi.delete(`/books/${id}`),
};

export default bookService;
