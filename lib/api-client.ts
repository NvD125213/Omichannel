import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";
import { refreshTokenApi } from "@/services/auth/refresh-token";
import { triggerRedirectToLogin } from "./navigation-events";

// API Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Mutex để tránh race condition khi refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

function getRefreshErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; status_code?: number }
      | undefined;
    if (data?.message) return data.message;
  }

  return "Không thể làm mới phiên đăng nhập";
}

// Request Interceptor - Automatically attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response Interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
        })
      | undefined;

    // Nếu không có originalRequest, reject ngay
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token expired
    // Bỏ qua refresh cho logout để tránh vòng lặp khi đăng xuất
    const requestUrl = originalRequest.url ?? "";
    const isLogoutRequest = requestUrl.includes("/auth/logout");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLogoutRequest
    ) {
      if (isRefreshing) {
        // Nếu đang refresh, thêm request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        toast.error("Phiên đăng nhập đã hết hạn");
        clearTokens();
        triggerRedirectToLogin();
        return Promise.reject(new Error("No refresh token available"));
      }

      try {
        const data = await refreshTokenApi(refreshToken);

        if (data.data) {
          const { access_token, refresh_token } = data.data;
          setTokens(access_token, refresh_token);

          // Process queued requests
          processQueue(null, access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        }

        throw new Error("Không nhận được dữ liệu token mới");
      } catch (refreshError) {
        const message = getRefreshErrorMessage(refreshError);
        console.error("Refresh token failed:", refreshError);
        toast.error(message);
        processQueue(
          refreshError instanceof Error ? refreshError : new Error(message),
          null,
        );
        clearTokens();
        triggerRedirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "Có lỗi xảy ra";

    // Giữ lại AxiosError để phía UI có thể đọc status, data (ví dụ để parse lỗi 422)
    if (errorMessage && error.message !== errorMessage) {
      error.message = errorMessage;
    }

    return Promise.reject(error);
  },
);

export default apiClient;

// Export types for convenience
export type { AxiosError, AxiosResponse };
