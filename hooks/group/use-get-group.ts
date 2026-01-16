import { useQuery } from "@tanstack/react-query";
import {
  getGroupsApi,
  GroupQueryParams,
  GroupResponseApi,
} from "@/services/group/get-group";

export const useGetGroups = (params: GroupQueryParams) => {
  return useQuery({
    queryKey: ["groups", params],
    queryFn: () => getGroupsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: GroupResponseApi) => data.data,
  });
};
