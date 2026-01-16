import apiClient from "@/lib/api-client";
import { LoginRequest, LoginResponse } from "@/lib/auth";

/**
 * Sign in API - Xử lý đăng nhập người dùng
 * @param credentials - Thông tin đăng nhập (username và password)
 * @returns Promise<LoginResponse> - Kết quả đăng nhập bao gồm access_token và refresh_token
 * @throws Error - Nếu đăng nhập thất bại
 */
export async function loginApi(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  // Axios auto-throw for non-2xx, but we also check API status
  if (response.data.status_code !== 200) {
    throw new Error(response.data.message || "Đăng nhập thất bại");
  }

  return response.data;
}
