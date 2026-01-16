import { useQuery } from "@tanstack/react-query";
import {
  getCurrentUserApi,
  UserCurrentResponse,
} from "@/services/user/user-current";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUserApi,
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: UserCurrentResponse) => data.data,
  });
}
