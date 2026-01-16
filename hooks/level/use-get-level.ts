import { useQuery } from "@tanstack/react-query";
import {
  getLevelsApi,
  LevelQueryParams,
  LevelResponseApi,
} from "@/services/level/get-level";

export const useGetLevels = (params: LevelQueryParams) => {
  return useQuery({
    queryKey: ["levels", params],
    queryFn: () => getLevelsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: LevelResponseApi) => data.data,
  });
};
