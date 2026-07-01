import axios from "axios";

// NOTE: plain action objects are dispatched below instead of importing action
// creators from authSlice.js — importing them here would recreate a module
// cycle (authSlice.js imports the apiClient default export from this file),
// which previously caused a blank page on load. These type strings match
// RTK's auto-generated `${slice.name}/${reducer}` action types exactly.

let store;

export const injectStore = (_store) => {
  store = _store;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = store?.getState()?.auth?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let refreshQueue = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        store.dispatch({ type: "auth/setAccessToken", payload: data.accessToken });

        refreshQueue.forEach(({ resolve }) =>
          resolve(data.accessToken)
        );
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];

        store.dispatch({ type: "auth/logoutLocal" });

        // Guard against a reload loop: assigning location.href to the URL
        // it's already at still forces a full reload, which would remount
        // App.jsx, re-fire the initial /auth/me bootstrap, hit this same
        // 401 -> refresh -> 401 path again, and loop indefinitely.
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
