"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  chatbotKgCoreKeys,
  useGetWebCrawl,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { isTerminalStatus } from "@/features/chatbot-kg-core/document/utils/document-status";
import { chatbotKgCoreService } from "@/services/chatbot-kg-core/v1/service";
import type { WebCrawlJob } from "@/services/chatbot-kg-core/interfaces";
import {
  getCrawlJobProgress,
  getCrawlJobProgressLabel,
  WEB_CRAWL_JOB_POLL_INTERVAL_MS,
  WEB_CRAWL_JOB_REFRESH_MIN_DURATION_MS,
} from "../utils/web-crawl-job-progress";

interface UseWebCrawlJobMonitorOptions {
  graphId: string;
  crawl: WebCrawlJob;
  onCrawlUpdate?: (crawl: WebCrawlJob) => void;
}

export function useWebCrawlJobMonitor({
  graphId,
  crawl,
  onCrawlUpdate,
}: UseWebCrawlJobMonitorOptions) {
  const queryClient = useQueryClient();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data } = useGetWebCrawl(graphId, crawl.id, {
    enabled: !!graphId && !!crawl.id && isMonitoring,
    refetchInterval: (query) => {
      if (!isMonitoring) return false;

      const state = query.state.data?.state ?? crawl.state;
      if (isTerminalStatus(state)) return false;

      return WEB_CRAWL_JOB_POLL_INTERVAL_MS;
    },
  });

  const liveCrawl = data ?? crawl;
  const isProcessing = !isTerminalStatus(liveCrawl.state);
  const showProgress = isMonitoring && isProcessing;
  const progress = getCrawlJobProgress(liveCrawl);
  const progressLabel = getCrawlJobProgressLabel(liveCrawl);

  useEffect(() => {
    if (!data) return;
    onCrawlUpdate?.(data);
  }, [data, onCrawlUpdate]);

  useEffect(() => {
    if (isMonitoring && isTerminalStatus(liveCrawl.state)) {
      setIsMonitoring(false);
    }
  }, [isMonitoring, liveCrawl.state]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsMonitoring(true);
    setIsRefreshing(true);
    const startedAt = Date.now();

    try {
      const updatedCrawl = await queryClient.fetchQuery({
        queryKey: chatbotKgCoreKeys.webCrawl(graphId, crawl.id),
        queryFn: () => chatbotKgCoreService.getWebCrawl(graphId, crawl.id),
      });
      onCrawlUpdate?.(updatedCrawl);
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(
        0,
        WEB_CRAWL_JOB_REFRESH_MIN_DURATION_MS - elapsed,
      );

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setIsRefreshing(false);
    }
  }, [crawl.id, graphId, isRefreshing, onCrawlUpdate, queryClient]);

  return {
    handleRefresh,
    isRefreshing,
    isMonitoring,
    showProgress,
    progress,
    progressLabel,
    isProcessing,
  };
}
