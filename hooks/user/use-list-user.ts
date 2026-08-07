import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllUserApi, GetAllUserQuery } from "@/services/user/get-all-user";

export function useListUser(
  params: GetAllUserQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getAllUserApi(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    enabled: options?.enabled,
  });
}
