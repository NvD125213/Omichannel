import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface DepartmentResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    departments: {
      id: string;
      name: string;
      description: string;
      tenant_id: string;
      department_order: number;
    }[];
    total_pages: number;
    total_records: number;
  };
}

export interface DepartmentDetailResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    id: string;
    name: string;
    description: string;
    tenant_id: string;
    groups: {
      id: string;
      name: string;
      department_id: string;
      tenant_id: string;
      description: string;
      is_active: number;
    }[];
  };
}

export interface DepartmentQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getDepartmentsApi(params: DepartmentQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<DepartmentResponseApi>("/departments", {
    params: queryParams,
  });
  return response.data;
}

export async function getDepartmentDetailApi(id: string) {
  const response = await apiClient.get<DepartmentDetailResponseApi>(
    `/departments/${id}/detail`,
  );
  return response.data;
}
