import { API_BASE_URL, RefreshTokenResponse } from "@/lib/auth";
import axios from "axios";

/**
 * Refresh Access Token API
 * Dùng refresh token để lấy access token mới
 *
 * Lưu ý: API có thể trả HTTP 200 nhưng body lỗi, ví dụ:
 * { status: "error", status_code: 401, message: "Token đã bị vô hiệu hóa", data: null }
 *
 * @param refreshToken - Refresh token hiện tại
 * @returns Promise<RefreshTokenResponse>
 * @throws Error - Nếu refresh token không hợp lệ hoặc hết hạn (message lấy từ API)
 */
export async function refreshTokenApi(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  // Sử dụng axios trực tiếp để tránh circular dependency với api-client
  const response = await axios.get<RefreshTokenResponse>(
    `${API_BASE_URL}/auth/access_token`,
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const data = response.data;
  const isBusinessError =
    data.status === "error" || data.status_code !== 200 || data.data == null;

  if (isBusinessError) {
    throw new Error("Phiên đăng nhập đã bị vô hiệu hóa!");
  }

  return data;
}
