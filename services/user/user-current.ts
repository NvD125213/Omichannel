import apiClient from "@/lib/api-client";

export interface UserCurrentResponse {
  status: number;
  message: string;
  data: {
    id: string;
    username: string;
    email: string;
    fullname: string;
    is_active: number;
    role: string;
    tenant_id: string;
    permissions: string[];
  };
}

export async function getCurrentUserApi() {
  try {
    const response = await apiClient.get<UserCurrentResponse>("/user/current");
    return response.data;
  } catch (error) {
    throw error;
  }
}
