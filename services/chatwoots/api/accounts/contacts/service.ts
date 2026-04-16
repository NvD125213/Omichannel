import { chatwoot_api_client } from "@/lib/chatwoot-api-client";
import { cleanParams } from "@/utils/clean-params";

const client = chatwoot_api_client;

/** Phản hồi lỗi JSON thường gặp từ Chatwoot */
export interface ChatwootErrorBody {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface Contact {
  id: number;
  name?: string;
  email?: string | null;
  phone_number?: string | null;
  identifier?: string | null;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ContactsListMeta {
  count?: number;
  current_page?: number;
  [key: string]: unknown;
}

export interface ContactsListResponse {
  meta?: ContactsListMeta;
  payload: Contact[];
}

export interface ContactListQueryParams {
  page?: number;
  sort?: string;
}

export interface CreateContactRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  inbox_id?: number;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export async function listContactsApi(
  accountId: number,
  params?: ContactListQueryParams,
) {
  const queryParams = cleanParams(params ?? {});
  const response = await client.get<ContactsListResponse>(
    `/api/v1/accounts/${accountId}/contacts`,
    { params: queryParams },
  );
  return response.data;
}

export async function createContactApi(
  accountId: number,
  data: CreateContactRequest,
) {
  const response = await client.post<Contact>(
    `/api/v1/accounts/${accountId}/contacts`,
    data,
  );
  return response.data;
}

export async function getContactApi(accountId: number, contactId: number) {
  const response = await client.get<Contact>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`,
  );
  return response.data;
}

export async function updateContactApi(
  accountId: number,
  contactId: number,
  data: UpdateContactRequest,
) {
  const response = await client.patch<Contact>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`,
    data,
  );
  return response.data;
}

export async function deleteContactApi(accountId: number, contactId: number) {
  const response = await client.delete<void>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`,
  );
  return response.data;
}

export async function getContactConversationsApi(
  accountId: number,
  contactId: number,
) {
  const response = await client.get<unknown>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`,
  );
  return response.data;
}
