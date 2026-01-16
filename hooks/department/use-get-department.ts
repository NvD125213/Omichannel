import { useQuery } from "@tanstack/react-query";
import {
  getDepartmentsApi,
  DepartmentQueryParams,
  DepartmentResponseApi,
  getDepartmentDetailApi,
  DepartmentDetailResponseApi,
} from "@/services/department/get-deparment";

export const useGetDepartments = (params: DepartmentQueryParams) => {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => getDepartmentsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: DepartmentResponseApi) => data.data,
  });
};

export const useGetDepartmentDetail = (id: string) => {
  return useQuery({
    queryKey: ["department-detail", id],
    queryFn: () => getDepartmentDetailApi(id),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: DepartmentDetailResponseApi) => data.data,
  });
};
