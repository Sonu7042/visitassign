import axios from 'axios';

// Keep browser requests same-origin. Vite proxies this path locally and
// vercel.json proxies it to the separately deployed API in production.
const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

const TOKEN_KEY = 'accessToken';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);

export const setAccessToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Holds the in-flight refresh request so concurrent 401s share a single retry.
let refreshPromise = null;
let onAuthFailure = null;

export const registerAuthFailureHandler = (handler) => {
  onAuthFailure = handler;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || config._retry || config.url?.includes('/auth/')) {
      throw error;
    }

    config._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axiosClient
          .post('/auth/refresh-token')
          .then((res) => {
            const token = res.data?.data?.accessToken;
            setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const token = await refreshPromise;
      if (!token) throw error;

      config.headers.Authorization = `Bearer ${token}`;
      return axiosClient(config);
    } catch (refreshError) {
      setAccessToken(null);
      if (onAuthFailure) onAuthFailure();
      throw refreshError;
    }
  }
);

export default axiosClient;
