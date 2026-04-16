import { chatwoot_api_client } from "@/lib/chatwoot-api-client";
import { cleanParams } from "@/utils/clean-params";

const _api_client = chatwoot_api_client;

export interface AccountUser {
  id?: number;
  user_id?: number;
  account_id?: number;
  role?: string;
}

export interface AccountUsersQueryParams {
  account_id: number;
}

export interface CreateAccountUserRequest {
  user_id: number;
  role: "administrator" | "agent";
}

export const accountUsersApi = {
  getList: async (params: AccountUsersQueryParams) => {
    const queryParams = cleanParams(params);
    const response = await _api_client.get<AccountUser[]>(
      `/platform/api/v1/accounts/${params.account_id}/account_users`,
      { params: queryParams },
    );
    return response.data;
  },

  create: async (accountId: number, data: CreateAccountUserRequest) => {
    const response = await _api_client.post<AccountUser>(
      `/platform/api/v1/accounts/${accountId}/account_users`,
      data,
    );
    return response.data;
  },

  delete: async (accountId: number, userId: number) => {
    const response = await _api_client.delete<void>(
      `/platform/api/v1/accounts/${accountId}/account_users`,
      {
        data: { user_id: userId },
      },
    );
    return response.data;
  },
};
