import { chatwoot_api_client } from "@/lib/chatwoot-api-client";

const client = chatwoot_api_client;

/** Tài khoản trong phạm vi app — GET/PATCH/POST `/api/v1/accounts` */

export interface AppAccount {
  id: number;
  name?: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CreateAppAccountRequest {
  name: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  custom_attributes?: Record<string, unknown>;
}

export interface UpdateAppAccountRequest {
  name?: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  custom_attributes?: Record<string, unknown>;
}

export async function getAppAccountApi(accountId: number) {
  const response = await client.get<AppAccount>(
    `/api/v1/accounts/${accountId}`,
  );
  return response.data;
}

export async function createAppAccountApi(data: CreateAppAccountRequest) {
  const response = await client.post<AppAccount>(`/api/v1/accounts`, data);
  return response.data;
}

export async function updateAppAccountApi(
  accountId: number,
  data: UpdateAppAccountRequest,
) {
  const response = await client.patch<AppAccount>(
    `/api/v1/accounts/${accountId}`,
    data,
  );
  return response.data;
}
