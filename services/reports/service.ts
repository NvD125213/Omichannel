import apiClient from "@/lib/api-client";

/**
 * Messaging Reports — Postman folder `reports`
 * Base: `{{baseUrl}}/api/v1/messaging/tenants/:tenant_id/reports/...`
 */

export interface ApiResponse<T> {
  status: string;
  status_code: number;
  message: string;
  data: T;
}

/** Payload linh hoạt — schema response trong Postman trống */
export type ReportsJsonPayload = Record<string, unknown> | unknown[] | null;

export type ReportsApiResponse = ApiResponse<ReportsJsonPayload>;

/** GET .../reports/overview */
export interface ReportsOverviewMetricValues {
  conversations_count: number;
  incoming_messages_count: number;
  outgoing_messages_count: number;
  avg_first_response_time: number;
  avg_resolution_time: number;
  resolutions_count: number;
  reply_time: number;
}

export interface ReportsOverviewSummaryData extends ReportsOverviewMetricValues {
  previous?: Partial<ReportsOverviewMetricValues> | null;
}

export interface ReportsOverviewLiveConversations {
  open: number;
  unattended: number;
  unassigned: number;
  pending: number;
}

export interface ReportsOverviewCsat {
  total_count: number;
  ratings_count: Record<string, number>;
  total_sent_messages_count: number;
}

export interface ReportsOverviewSection<T> {
  ok: boolean;
  data: T;
}

export interface ReportsOverviewData {
  tenant_id: string;
  summary: ReportsOverviewSection<ReportsOverviewSummaryData>;
  live_conversations: ReportsOverviewSection<ReportsOverviewLiveConversations>;
  csat: ReportsOverviewSection<ReportsOverviewCsat>;
}

export type GetReportsOverviewResponse = ApiResponse<ReportsOverviewData>;

/** Unix epoch (giây) hoặc ISO date */
export type ReportDateParam = string | number;

export type ReportSummaryType =
  | "account"
  | "agent"
  | "inbox"
  | "label"
  | "team";

export type ReportGroupedKind = "agent" | "team" | "label" | "channel";

export type ReportTimeseriesMetric =
  | "conversations_count"
  | "incoming_messages_count"
  | "outgoing_messages_count"
  | "avg_first_response_time"
  | "avg_resolution_time"
  | "resolutions_count"
  | "bot_resolutions_count"
  | "bot_handoffs_count"
  | "reply_time"
  | (string & {});

export type ReportGroupBy =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year"
  | (string & {});

export interface ReportDateRangeParams {
  since?: ReportDateParam;
  until?: ReportDateParam;
}

export interface GetReportsOverviewParams extends ReportDateRangeParams {
  /** Chỉ tính trong giờ làm việc */
  business_hours?: boolean;
}

export interface GetReportsGroupedSummaryParams extends ReportDateRangeParams {
  /** Chỉ tính trong giờ làm việc */
  business_hours?: boolean;
}

/** Một dòng summary theo agent — thời gian là milliseconds; null = không có dữ liệu */
export interface AgentReportSummary {
  id: number | string;
  conversations_count: number | null;
  resolved_conversations_count: number | null;
  avg_resolution_time: number | null;
  avg_first_response_time: number | null;
  avg_reply_time: number | null;
  name?: string | null;
}

export interface GetReportSummaryParams extends ReportDateRangeParams {
  type: ReportSummaryType;
  /** Id đối tượng khi type != account (agent/team nhận UUID nội bộ) */
  id?: string;
  business_hours?: boolean;
}

export interface GetConversationMetricsAgentsParams {
  /** UUID agent nội bộ — bỏ trống = tất cả agent */
  agent_id?: string;
}

export interface GetConversationTrafficParams extends ReportDateRangeParams {
  /** Offset giờ, ví dụ 7 cho UTC+7 */
  timezone_offset?: string | number;
}

export interface GetCsatMetricsParams extends ReportDateRangeParams {
  agent_id?: string;
}

export interface GetCsatResponsesParams extends ReportDateRangeParams {
  page?: number;
  agent_id?: string;
}

export interface ReportTimeseriesPoint {
  value: number;
  timestamp: number;
}

export interface ReportTimeseriesData {
  tenant_id?: string;
  messaging?: ReportTimeseriesPoint[];
}

export type GetReportTimeseriesResponse = ApiResponse<ReportTimeseriesData>;

export interface GetReportTimeseriesParams extends ReportDateRangeParams {
  metric: ReportTimeseriesMetric;
  type: ReportSummaryType;
  /** Id đối tượng khi type != account */
  id?: string;
  group_by?: ReportGroupBy;
  business_hours?: boolean;
  /** Offset giờ, ví dụ 7 cho UTC+7 */
  timezone_offset?: string | number;
}

const reportsBase = (tenantId: string) =>
  `/messaging/tenants/${encodeURIComponent(tenantId)}/reports`;

/**
 * Gọi API Messaging Reports qua `apiClient` — cùng kiểu `ApiResponse<T>`.
 */
export const reportsService = {
  /**
   * GET .../reports/overview
   * Dashboard Overview — tổng quan theo khoảng thời gian
   */
  getOverview: async (
    tenantId: string,
    params?: GetReportsOverviewParams,
  ): Promise<GetReportsOverviewResponse> => {
    const response = await apiClient.get<GetReportsOverviewResponse>(
      `${reportsBase(tenantId)}/overview`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/summary/:kind
   * Grouped Summary — kind: agent | team | label | channel
   */
  getGroupedSummary: async (
    tenantId: string,
    kind: ReportGroupedKind,
    params?: GetReportsGroupedSummaryParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/summary/${encodeURIComponent(kind)}`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/summary
   * Report Summary — type: account | agent | inbox | label | team
   */
  getSummary: async (
    tenantId: string,
    params: GetReportSummaryParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/summary`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/conversations/agents
   * Conversation Metrics Agents — workload theo agent
   */
  getConversationMetricsAgents: async (
    tenantId: string,
    params?: GetConversationMetricsAgentsParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/conversations/agents`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/conversations
   * Conversation Metrics Account
   */
  getConversationMetrics: async (
    tenantId: string,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/conversations`,
    );
    return response.data;
  },

  /**
   * GET .../reports/conversation-traffic
   * Conversation Traffic theo timezone_offset
   */
  getConversationTraffic: async (
    tenantId: string,
    params?: GetConversationTrafficParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/conversation-traffic`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/csat/metrics
   * CSAT Metrics
   */
  getCsatMetrics: async (
    tenantId: string,
    params?: GetCsatMetricsParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/csat/metrics`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports/csat
   * CSAT Responses (phân trang)
   */
  getCsatResponses: async (
    tenantId: string,
    params?: GetCsatResponsesParams,
  ): Promise<ReportsApiResponse> => {
    const response = await apiClient.get<ReportsApiResponse>(
      `${reportsBase(tenantId)}/csat`,
      { params },
    );
    return response.data;
  },

  /**
   * GET .../reports
   * Report Timeseries — {value, timestamp} theo metric (chart)
   */
  getTimeseries: async (
    tenantId: string,
    params: GetReportTimeseriesParams,
  ): Promise<GetReportTimeseriesResponse> => {
    const response = await apiClient.get<GetReportTimeseriesResponse>(
      reportsBase(tenantId),
      { params },
    );
    return response.data;
  },
};
