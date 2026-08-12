import { useQuery } from "@tanstack/react-query";
import {
  reportsService,
  type GetConversationMetricsAgentsParams,
  type GetConversationTrafficParams,
  type GetCsatMetricsParams,
  type GetCsatResponsesParams,
  type GetReportSummaryParams,
  type GetReportTimeseriesParams,
  type GetReportsGroupedSummaryParams,
  type GetReportsOverviewParams,
  type ReportGroupedKind,
} from "@/services/reports/service";

const QUERY_KEY = "messaging-reports";

export const useGetReportsOverview = (
  tenantId: string,
  params?: GetReportsOverviewParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "overview", tenantId, params],
    queryFn: () => reportsService.getOverview(tenantId, params),
    enabled: enabled && !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetReportsGroupedSummary = (
  tenantId: string,
  kind: ReportGroupedKind,
  params?: GetReportsGroupedSummaryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "grouped-summary", tenantId, kind, params],
    queryFn: () => reportsService.getGroupedSummary(tenantId, kind, params),
    enabled: enabled && !!tenantId && !!kind,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetReportSummary = (
  tenantId: string,
  params: GetReportSummaryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "summary", tenantId, params],
    queryFn: () => reportsService.getSummary(tenantId, params),
    enabled: enabled && !!tenantId && !!params?.type,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetConversationMetricsAgents = (
  tenantId: string,
  params?: GetConversationMetricsAgentsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "conversations-agents", tenantId, params],
    queryFn: () =>
      reportsService.getConversationMetricsAgents(tenantId, params),
    enabled: enabled && !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetConversationMetrics = (tenantId: string, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEY, "conversations", tenantId],
    queryFn: () => reportsService.getConversationMetrics(tenantId),
    enabled: enabled && !!tenantId,
  });
};

export const useGetConversationTraffic = (
  tenantId: string,
  params?: GetConversationTrafficParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "conversation-traffic", tenantId, params],
    queryFn: () => reportsService.getConversationTraffic(tenantId, params),
    enabled: enabled && !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCsatMetrics = (
  tenantId: string,
  params?: GetCsatMetricsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "csat-metrics", tenantId, params],
    queryFn: () => reportsService.getCsatMetrics(tenantId, params),
    enabled: enabled && !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCsatResponses = (
  tenantId: string,
  params?: GetCsatResponsesParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "csat", tenantId, params],
    queryFn: () => reportsService.getCsatResponses(tenantId, params),
    enabled: enabled && !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetReportTimeseries = (
  tenantId: string,
  params: GetReportTimeseriesParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "timeseries", tenantId, params],
    queryFn: () => reportsService.getTimeseries(tenantId, params),
    enabled: enabled && !!tenantId && !!params?.metric && !!params?.type,
    placeholderData: (previousData) => previousData,
  });
};
