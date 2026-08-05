import apiClient from "@/lib/api-client";
import {
  getAllUserApi,
  type GetAllUserResponse,
} from "@/services/user/get-all-user";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  fullname: string;
  role: string;
  level: string;
  tenant_id: string;
  is_active: number;
  permissions?: string[];
}

export interface GetUserByIdResponse {
  status?: string | number;
  status_code?: number;
  message?: string;
  data: AppUser;
}

function isAppUser(value: unknown): value is AppUser {
  return (
    !!value && typeof value === "object" && "id" in value && "username" in value
  );
}

/** Lấy user theo id: ưu tiên GET /user/:id, fallback /user/all?id= */
export async function getUserByIdApi(userId: string): Promise<AppUser | null> {
  if (!userId.trim()) return null;

  try {
    const response = await apiClient.get<GetUserByIdResponse | AppUser>(
      `/user/${encodeURIComponent(userId)}`,
    );
    const body = response.data as GetUserByIdResponse | AppUser;
    if (isAppUser(body)) return body;
    if (isAppUser((body as GetUserByIdResponse).data)) {
      return (body as GetUserByIdResponse).data;
    }
  } catch {
    /* fallback list */
  }

  try {
    const list: GetAllUserResponse = await getAllUserApi({
      id: userId,
      page: 1,
      page_size: 50,
    });
    const items = list?.data?.items ?? [];
    return items.find((u) => u.id === userId) ?? null;
  } catch {
    return null;
  }
}
