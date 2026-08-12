import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";
import {
  getMyWebcallApi,
  type GetMyWebcallResponse,
} from "@/services/user/get-my-webcall";

/**
 * Softphone config đầy đủ — chỉ fetch khi cần kết nối gọi.
 * Không cache (theo Postman: FE không cache endpoint này).
 */
export function useGetMyWebcall(enabled = true) {
  const token = getAccessToken();

  return useQuery({
    queryKey: ["user", "webcall"],
    queryFn: getMyWebcallApi,
    enabled: enabled && !!token,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    select: (data: GetMyWebcallResponse) => data.data,
  });
}
