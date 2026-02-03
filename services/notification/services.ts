import apiClient from "@/lib/api-client";

// Xử lý request
export interface SendMessageRequest {
  user_id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: "info";
  data: Record<string, unknown>;
}

export interface SendBroadcastRequest {
  title: string;
  message: string;
  type: "system";
  data: Record<string, unknown>;
}

export interface MarkNotificationRequest {
  notification_id: string;
}
// Xử lý params
export interface GetNotificationsHistoryParams {
  page: number;
  page_size: number;
  unread_only: boolean;
}

// Xử lý service
export const notificationService = {
  sendMessage: async (data: SendMessageRequest) => {
    const response = await apiClient.post("/notifications", data);
    return response.data;
  },

  sendBroadcast: async (data: SendBroadcastRequest) => {
    const response = await apiClient.post("/notifications/broadcast", data);
    return response.data;
  },

  getOnlineUsers: async () => {
    const response = await apiClient.get("/notifications/online-users");
    return response.data;
  },

  getOnlineUserById: async (user_id: string) => {
    const response = await apiClient.get(
      `/notifications/user/${user_id}/online`,
    );
    return response.data;
  },

  getNotificationsHistory: async (params: GetNotificationsHistoryParams) => {
    const response = await apiClient.get(`/notifications/history`, { params });
    return response.data;
  },

  markNotification: async (notification_id: string) => {
    const response = await apiClient.post(
      `/notifications/${notification_id}/read`,
    );
    return response.data;
  },

  readAllNotifications: async () => {
    const response = await apiClient.post(`/notifications/read-all`);
    return response.data;
  },

  getWSStatus: async () => {
    const response = await apiClient.get("/notifications/ws/status");
    return response.data;
  },
};
