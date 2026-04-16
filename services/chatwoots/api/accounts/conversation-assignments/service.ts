import { chatwoot_api_client } from "@/lib/chatwoot-api-client";

const client = chatwoot_api_client;

/** POST `/api/v1/accounts/:account_id/conversations/:conversation_id/assignments` */

export interface AssignConversationRequest {
  assignee_id?: number;
  team_id?: number;
}

export async function assignConversationApi(
  accountId: number,
  conversationId: number,
  data: AssignConversationRequest,
) {
  const response = await client.post<unknown>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/assignments`,
    data,
  );
  return response.data;
}
