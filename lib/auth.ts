import Cookies from "js-cookie";

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Cookie Configuration
// Cấu hình cookie với các options bảo mật
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  // Số ngày cookie tồn tại (7 ngày)
  expires: 7,
  // Chỉ gửi cookie qua HTTPS trên production
  secure: process.env.NODE_ENV === "production",
  // Chống CSRF attacks - cookie chỉ được gửi trong same-site requests
  sameSite: "strict",
  // Cookie có thể truy cập từ tất cả paths
  path: "/",
};

// Refresh token có thời gian sống dài hơn (30 ngày)
const REFRESH_TOKEN_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  ...COOKIE_OPTIONS,
  expires: 30,
};

// Types
export interface LoginRequest {
  username: string;
  password: string;
  name_tenant: string;
}

export interface LoginResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
}

export interface LogoutResponse {
  status: string;
  status_code: number;
  message: string;
  data: null;
}

export interface RefreshTokenResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  } | null;
}

export interface ApiError {
  status: string;
  status_code: number;
  message: string;
}

// Token Keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Lưu tokens vào cookies
 * @param accessToken - Access token từ API
 * @param refreshToken - Refresh token từ API
 *
 * NOTE: Để chuyển sang HttpOnly cookies (an toàn hơn):
 * 1. Tạo API route: /api/auth/set-tokens
 * 2. Server sẽ set cookies với httpOnly: true
 * 3. Client không thể đọc được cookies này (chống XSS)
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== "undefined") {
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, COOKIE_OPTIONS);
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
}

/**
 * Lấy access token từ cookies
 * @returns Access token hoặc null nếu không tồn tại
 */
export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  }
  return null;
}

/**
 * Lấy refresh token từ cookies
 * @returns Refresh token hoặc null nếu không tồn tại
 */
export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  }
  return null;
}

/**
 * Xóa tất cả tokens khỏi cookies (dùng khi logout)
 */
export function clearTokens(): void {
  if (typeof window !== "undefined") {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  }
}

/**
 * Kiểm tra token đã hết hạn chưa
 * @param token - JWT token cần kiểm tra
 * @returns true nếu token đã hết hạn
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    // Thêm buffer 30 giây để tránh race condition
    return Date.now() >= exp - 30000;
  } catch {
    return true;
  }
}

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 * @returns true nếu có access token hợp lệ
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}
