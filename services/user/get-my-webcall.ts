import apiClient from "@/lib/api-client";
import type { UserWebcallConfig } from "@/services/user/user-current";

/**
 * GET /user/webcall — Get My Webcall
 * Lấy full config softphone (sip_password, api_key, ws_server...).
 * FE chỉ gọi khi cần kết nối gọi — không cache.
 */
export type GetMyWebcallData = UserWebcallConfig;

export interface GetMyWebcallResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: GetMyWebcallData;
}

export async function getMyWebcallApi() {
  const response = await apiClient.get<GetMyWebcallResponse>("/user/webcall");
  return response.data;
}
