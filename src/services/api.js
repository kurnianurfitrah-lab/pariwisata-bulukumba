import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

if (typeof window !== 'undefined') {
  localStorage.removeItem('token');
}

api.interceptors.response.use(undefined, (error) => {
  const status = error.response?.status;
  const requestUrl = error.config?.url || '';
  const isAdminRequest = requestUrl.startsWith('/admin/');
  const isAuthenticationRequest =
    requestUrl === '/admin/login' || requestUrl === '/admin/session';

  if (
    status === 401 &&
    isAdminRequest &&
    !isAuthenticationRequest &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/admin/login'
  ) {
    window.location.assign('/admin/login');
  }

  return Promise.reject(error);
});

export default api;

