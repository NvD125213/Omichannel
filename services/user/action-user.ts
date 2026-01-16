import { UserFormValues } from "@/features/users/utils/schema";
import apiClient from "@/lib/api-client";

export interface CreateUserResponse {
  status: string;
  status_code: number;
  message: string;
  data: UserFormValues;
}

export interface UpdateUserResponse {
  status: string;
  status_code: number;
  message: string;
  data: UserFormValues;
}

export async function createUserApi(data: UserFormValues) {
  return await apiClient.post<CreateUserResponse>("/user", data);
}

export async function updateUserApi(data: UserFormValues) {
  return await apiClient.put<UpdateUserResponse>(`/user/${data.id}`, data);
}

export async function deleteUserApi(id: string) {
  return await apiClient.delete(`/user/${id}`);
}
