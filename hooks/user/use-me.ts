import { useQuery } from "@tanstack/react-query";
import {
  getCurrentUserApi,
  UserCurrentResponse,
} from "@/services/user/user-current";
import { getAccessToken } from "@/lib/auth";

export function useMe() {
  const token = getAccessToken();

  return useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUserApi,
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: UserCurrentResponse) => data.data,
    enabled: !!token, // Only run query if there's a valid token
  });
}
