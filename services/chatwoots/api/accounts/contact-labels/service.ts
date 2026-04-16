import { chatwoot_api_client } from "@/lib/chatwoot-api-client";

const client = chatwoot_api_client;

/**
 * Nhãn gắn trên contact — chỉ `index` + `create` trong routes Chatwoot
 * (GET/POST `/api/v1/accounts/:account_id/contacts/:contact_id/labels`)
 */

export interface ChatwootErrorBody {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface ContactLabelsResponse {
  payload?: string[];
  [key: string]: unknown;
}

export interface SetContactLabelsRequest {
  /** Ghi đè toàn bộ nhãn của contact */
  labels: string[];
}

export async function getContactLabelsApi(
  accountId: number,
  contactId: number,
) {
  const response = await client.get<ContactLabelsResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/labels`,
  );
  return response.data;
}

export async function setContactLabelsApi(
  accountId: number,
  contactId: number,
  data: SetContactLabelsRequest,
) {
  const response = await client.post<ContactLabelsResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/labels`,
    data,
  );
  return response.data;
}
