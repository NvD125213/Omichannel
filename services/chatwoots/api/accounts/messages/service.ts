import { chatwoot_api_client } from "@/lib/chatwoot-api-client";
import { cleanParams } from "@/utils/clean-params";

const client = chatwoot_api_client;

/**
 * Tin nhắn trong conversation — `/api/v1/accounts/:account_id/conversations/:conversation_id/messages`
 * (index, create, update, destroy + member: translate, retry)
 */

export interface ChatwootErrorBody {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface Message {
  id: number;
  content?: string | null;
  message_type?: number;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  conversation_id?: number;
  sender?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  private?: boolean;
  [key: string]: unknown;
}

export interface MessagesListMeta {
  [key: string]: unknown;
}

export interface MessagesListResponse {
  meta?: MessagesListMeta;
  payload?: Message[];
  [key: string]: unknown;
}

export interface MessagesListQueryParams {
  /** Lấy tin nhắn trước id này (phân trang) */
  before?: number;
  /** Lấy tin nhắn sau id này */
  after?: number;
}

export interface CreateMessageRequest {
  content: string;
  /** 0 incoming, 1 outgoing, 2 activity, 3 template... (tuỳ bản Chatwoot) */
  message_type?: number;
  private?: boolean;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  template_params?: Record<string, unknown>;
  attachments?: unknown[];
}

export interface UpdateMessageRequest {
  content?: string;
  content_attributes?: Record<string, unknown>;
}

export async function listMessagesApi(
  accountId: number,
  conversationId: number,
  params?: MessagesListQueryParams,
) {
  const queryParams = cleanParams(params ?? {});
  const response = await client.get<MessagesListResponse>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    { params: queryParams },
  );
  return response.data;
}

export async function createMessageApi(
  accountId: number,
  conversationId: number,
  data: CreateMessageRequest,
) {
  const response = await client.post<Message>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    data,
  );
  return response.data;
}

export async function updateMessageApi(
  accountId: number,
  conversationId: number,
  messageId: number,
  data: UpdateMessageRequest,
) {
  const response = await client.patch<Message>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages/${messageId}`,
    data,
  );
  return response.data;
}

export async function deleteMessageApi(
  accountId: number,
  conversationId: number,
  messageId: number,
) {
  const response = await client.delete<void>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages/${messageId}`,
  );
  return response.data;
}
