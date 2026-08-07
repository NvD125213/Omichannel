import apiClient from "@/lib/api-client";

export type CallDirection = "inbound" | "outbound" | string;

export interface CallLog {
  id?: string;
  sip_call_id: string;
  provider_call_id?: string | null;
  phone_number: string;
  from_number?: string | null;
  to_number?: string | null;
  hotline?: string | null;
  customer_id: string | null;
  ticket_id: string | null;
  user_id: string | null;
  direction: CallDirection | null;
  status: string | null;
  started_at: string | null;
  answered_at?: string | null;
  ended_at: string | null;
  duration: number | null;
  billsec?: number | null;
  recording_url: string | null;
  meta_data: Record<string, unknown> | null;
  source?: string | null;
  tenant_id: string | null;
  tenant_name?: string | null;
  username_action_call?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCallLogRequest {
  sip_call_id: string;
  provider_call_id?: string | null;
  phone_number?: string;
  from_number?: string | null;
  to_number?: string | null;
  hotline?: string | null;
  customer_id?: string | null;
  ticket_id?: string | null;
  user_id?: string | null;
  direction?: CallDirection | null;
  status?: string | null;
  started_at?: string | null;
  answered_at?: string | null;
  ended_at?: string | null;
  duration?: number | null;
  billsec?: number | null;
  recording_url?: string | null;
  meta_data?: Record<string, unknown> | null;
  source?: string | null;
  tenant_id?: string | null;
}

export interface UpdateCallLogRequest {
  phone_number?: string | null;
  from_number?: string | null;
  to_number?: string | null;
  hotline?: string | null;
  tenant_id?: string | null;
  customer_id?: string | null;
  ticket_id?: string | null;
  user_id?: string | null;
  direction?: CallDirection | null;
  status?: string | null;
  source?: string | null;
  started_at?: string | null;
  answered_at?: string | null;
  ended_at?: string | null;
  duration?: number | null;
  billsec?: number | null;
  recording_url?: string | null;
  meta_data?: Record<string, unknown> | null;
}

export interface ApiResponse<T> {
  status: string;
  status_code: number;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GetCallLogsParams {
  page?: number;
  page_size?: number;
  search?: string;
  direction?: CallDirection;
  status?: string;
  tenant_id?: string;
  ticket_id?: string;
  customer_id?: string;
}

export type GetCallLogsResponse = ApiResponse<
  Pagination & {
    items: CallLog[];
  }
>;

export type GetCallLogByIdResponse = ApiResponse<CallLog>;

export type CreateCallLogResponse = ApiResponse<CallLog>;

export type UpdateCallLogResponse = ApiResponse<CallLog>;

export const callLogService = {
  /** GET /api/v1/call-logs — danh sách cuộc gọi (phân trang + lọc) */
  getCallLogs: async (
    params?: GetCallLogsParams,
  ): Promise<GetCallLogsResponse> => {
    const response = await apiClient.get<GetCallLogsResponse>("/call-logs", {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/call-logs/:sip_call_id — chi tiết theo sip_call_id */
  getCallLogById: async (
    sipCallId: string,
  ): Promise<GetCallLogByIdResponse> => {
    const response = await apiClient.get<GetCallLogByIdResponse>(
      `/call-logs/${encodeURIComponent(sipCallId)}`,
    );
    return response.data;
  },

  /** POST /api/v1/call-logs — tạo bản ghi cuộc gọi */
  createCallLog: async (
    data: CreateCallLogRequest,
  ): Promise<CreateCallLogResponse> => {
    const response = await apiClient.post<CreateCallLogResponse>(
      "/call-logs",
      data,
    );
    return response.data;
  },

  /** PUT /api/v1/call-logs/:sip_call_id — cập nhật trạng thái / metadata */
  updateCallLog: async (
    sipCallId: string,
    data: UpdateCallLogRequest,
  ): Promise<UpdateCallLogResponse> => {
    const response = await apiClient.put<UpdateCallLogResponse>(
      `/call-logs/${encodeURIComponent(sipCallId)}`,
      data,
    );
    return response.data;
  },
};
