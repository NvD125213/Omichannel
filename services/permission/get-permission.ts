import apiClient from "@/lib/api-client";

export interface PermissionResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: any[];
}

export async function getPermissionsApi() {
  const response =
    await apiClient.get<PermissionResponseApi>("/permissions/all");
  return response.data;
}

export async function getPermissionsByRoleApi(roleId: string) {
  const response = await apiClient.get<PermissionResponseApi>(
    `/role-permission/${roleId}`,
  );
  return response.data;
}
