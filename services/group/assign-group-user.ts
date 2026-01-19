import apiClient from "@/lib/api-client";

export interface UserGroupRequest {
  items: {
    user_id: string;
    group_id: string;
  }[];
}

export interface UserGroupRemoveRequest {
  user_id: string;
  group_id: string;
}

export async function assignGroupUserApi(request: UserGroupRequest) {
  return await apiClient.post(
    "/user_group/assign-multiple-users-to-groups",
    request,
  );
}

export async function removeGroupUserApi(request: UserGroupRemoveRequest) {
  return await apiClient.delete("/user_group/remove-user-from-group", {
    data: request,
  });
}
