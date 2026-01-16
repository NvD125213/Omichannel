import { API_BASE_URL, RefreshTokenResponse } from "@/lib/auth";
import axios from "axios";

/**
 * Refresh Access Token API
 * Dùng refresh token để lấy access token mới
 *
 * @param refreshToken - Refresh token hiện tại
 * @returns Promise<RefreshTokenResponse>
 * @throws Error - Nếu refresh token không hợp lệ hoặc hết hạn
 */
export async function refreshTokenApi(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  console.log("🔄 Calling refresh token API...");

  // Sử dụng axios trực tiếp để tránh circular dependency với api-client
  const response = await axios.get<RefreshTokenResponse>(
    `${API_BASE_URL}/auth/access_token`,
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✅ Refresh token response:", response.data);

  if (response.data.status_code !== 200) {
    throw new Error(response.data.message || "Không thể làm mới access token");
  }

  return response.data;
}
