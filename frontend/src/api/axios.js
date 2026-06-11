import axios from 'axios';

const API = axios.create({
  baseURL: 'https://trendora.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor – attach JWT
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trendora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trendora_token');
      localStorage.removeItem('trendora_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  login: (data) => API.post('/api/auth/login', data),
  me: () => API.get('/api/auth/me'),
};

// ── Products API ────────────────────────────────────────────
export const productsAPI = {
  list: (params) => API.get('/api/products', { params }),
  getById: (id) => API.get(`/api/products/${id}`),
  create: (data) => API.post('/api/products', data),
  update: (id, data) => API.put(`/api/products/${id}`, data),
  delete: (id) => API.delete(`/api/products/${id}`),
};

// ── Cart API ────────────────────────────────────────────────
export const cartAPI = {
  get: () => API.get('/api/cart'),
  add: (data) => API.post('/api/cart/add', data),
  remove: (productId) => API.delete(`/api/cart/remove/${productId}`),
};

// ── Orders API ──────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => API.post('/api/orders/create', data),
  myOrders: () => API.get('/api/orders/my-orders'),
  getById: (id) => API.get(`/api/orders/${id}`),
  createPaymentSession: () => API.post('/api/orders/create-payment-session'),
  verifyPayment: (data) => API.post('/api/orders/verify-payment', data),
};

// ── Chatbot API ─────────────────────────────────────────────
export const chatbotAPI = {
  recommend: (data) => API.post('/api/chatbot/recommend', data),
};

// ── Admin API ───────────────────────────────────────────────
export const adminAPI = {
  getUsers: (params) => API.get('/api/admin/users', { params }),
  getOrders: (params) => API.get('/api/admin/orders', { params }),
  getSales: () => API.get('/api/admin/sales'),
  createProduct: (data) => API.post('/api/admin/products', data),
  updateProduct: (id, data) => API.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/api/admin/products/${id}`),
};

export default API;
