import { DepartmentFormValues } from "@/features/departments/utils/schema";
import apiClient from "@/lib/api-client";

export interface CreateDepartmentResponse {
  status: string;
  status_code: number;
  message: string;
  data: DepartmentFormValues;
}

export interface UpdateDepartmentResponse {
  status: string;
  status_code: number;
  message: string;
  data: DepartmentFormValues;
}

export async function createDepartmentApi(data: DepartmentFormValues) {
  return await apiClient.post<CreateDepartmentResponse>("/departments", data);
}

export async function updateDepartmentApi(data: DepartmentFormValues) {
  return await apiClient.put<UpdateDepartmentResponse>(
    `/departments/${data.id}`,
    data,
  );
}

export async function deleteDepartmentApi(id: string) {
  return await apiClient.delete(`/departments/${id}`);
}
