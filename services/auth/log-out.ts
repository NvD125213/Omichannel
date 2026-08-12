import apiClient from "@/lib/api-client";
import { LogoutResponse } from "@/lib/auth";

/**
 * Logout API — POST /api/v1/auth/logout
 * Thu hồi phiên hiện tại. Cần Bearer access token (apiClient gắn tự động).
 * Response thành công: HTTP 200 (body có thể rỗng theo tài liệu Postman).
 */
export async function logoutApi(): Promise<LogoutResponse | null> {
  const response = await apiClient.post<LogoutResponse | string | null>(
    "/auth/logout",
    undefined,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = response.data;
  if (!data || typeof data === "string") {
    return null;
  }

  return data;
}
