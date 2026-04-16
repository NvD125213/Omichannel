import { chatwoot_api_client } from "@/lib/chatwoot-api-client";

const client = chatwoot_api_client;

export const notificationsApi = {
  getUnreadMessages: async (account_id: number) => {
    const response = await client.get(
      `/accounts/${account_id}/notifications/unread_count`,
    );
    return response.data;
  },
};
