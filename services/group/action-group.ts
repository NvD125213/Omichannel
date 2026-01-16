import apiClient from "@/lib/api-client";

export interface GroupFormValues {
  id?: string;
  name: string;
  description?: string;
  tenant_id?: string;
  is_active?: number;
}

export interface CreateGroupResponse {
  status: string;
  status_code: number;
  message: string;
  data: GroupFormValues;
}

export interface UpdateGroupResponse {
  status: string;
  status_code: number;
  message: string;
  data: GroupFormValues;
}

export async function createGroupApi(data: GroupFormValues) {
  return await apiClient.post<CreateGroupResponse>("/groups", data);
}

export async function updateGroupApi(data: GroupFormValues) {
  return await apiClient.put<UpdateGroupResponse>(`/groups/${data.id}`, data);
}

export async function deleteGroupApi(id: string) {
  return await apiClient.delete(`/groups/${id}`);
}
