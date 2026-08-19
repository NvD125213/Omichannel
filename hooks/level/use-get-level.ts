import { useQuery } from "@tanstack/react-query";
import {
  getLevelsApi,
  LevelQueryParams,
  LevelResponseApi,
} from "@/services/level/get-level";

export const useGetLevels = (
  params: LevelQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["levels", params],
    queryFn: () => getLevelsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled ?? true,
    select: (data: LevelResponseApi) => data.data,
  });
};
