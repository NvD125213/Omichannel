import apiClient from "@/lib/api-client";
import { LogoutResponse } from "@/lib/auth";

export async function logoutApi(): Promise<LogoutResponse> {
  try {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    throw error;
  }
}
