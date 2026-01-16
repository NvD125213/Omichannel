import { RoleFormValues } from "@/features/roles/utils/schema";
import apiClient from "@/lib/api-client";

export interface CreateRoleResponse {
  status: string;
  status_code: number;
  message: string;
  data: RoleFormValues;
}

export interface UpdateRoleResponse {
  status: string;
  status_code: number;
  message: string;
  data: RoleFormValues;
}

export async function createRoleApi(data: RoleFormValues) {
  return await apiClient.post<CreateRoleResponse>("/roles", data);
}

export async function updateRoleApi(data: RoleFormValues) {
  return await apiClient.put<UpdateRoleResponse>(`/roles/${data.id}`, data);
}

export async function deleteRoleApi(id: string) {
  return await apiClient.delete(`/roles/${id}`);
}
