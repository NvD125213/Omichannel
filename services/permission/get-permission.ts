import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface GetPermissionsParams {
  /** ID của quyền */
  id?: string | number;
  /** Từ khóa tìm kiếm */
  search?: string;
  /** Chỉ lấy quyền tenant được phép gán */
  for_assign?: boolean;
}

export interface PermissionResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: any[];
}

export async function getPermissionsApi(params?: GetPermissionsParams) {
  const response = await apiClient.get<PermissionResponseApi>(
    "/permissions/all",
    {
      params: params ? cleanParams(params) : undefined,
    },
  );
  return response.data;
}

export async function getPermissionsByRoleApi(roleId: string) {
  const response = await apiClient.get<PermissionResponseApi>(
    `/role-permission/${roleId}`,
  );
  return response.data;
}
