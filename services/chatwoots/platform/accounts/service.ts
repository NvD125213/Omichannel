import { chatwoot_api_client } from "@/lib/chatwoot-api-client";

const _api_client = chatwoot_api_client;

export interface Account {
  id: number;
  name: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  limits?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export interface ErrorResponse {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface CreateAccountRequest {
  name: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  limits?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export interface UpdateAccountRequest {
  name?: string;
  locale?: string;
  domain?: string;
  support_email?: string;
  status?: string;
  limits?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export const accountApi = {
  create: async (data: CreateAccountRequest) => {
    const response = await _api_client.post<Account>(
      "/platform/api/v1/accounts",
      data,
    );
    return response.data;
  },

  get: async (accountId: number) => {
    const response = await _api_client.get<Account>(
      `/platform/api/v1/accounts/${accountId}`,
    );
    return response.data;
  },

  update: async (accountId: number, data: UpdateAccountRequest) => {
    const response = await _api_client.patch<Account>(
      `/platform/api/v1/accounts/${accountId}`,
      data,
    );
    return response.data;
  },

  delete: async (accountId: number) => {
    const response = await _api_client.delete<void>(
      `/platform/api/v1/accounts/${accountId}`,
    );
    return response.data;
  },
};
