"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDocument,
  useListDocumentIngestJobs,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { cn } from "@/lib/utils";
import {
  getStatusLabel,
  getStatusProgress,
  getStatusTone,
  isTerminalStatus,
  statusToneClass,
} from "../utils/document-status";
import { DOCUMENT_PROCESSING_POLL_INTERVAL_MS } from "../utils/document-polling";

interface DocumentInteractiveProgressProps {
  graphId: string;
  documentId: string;
  filename?: string;
  className?: string;
  onStatusChange?: (status: string) => void;
}

export function DocumentInteractiveProgress({
  graphId,
  documentId,
  filename,
  className,
  onStatusChange,
}: DocumentInteractiveProgressProps) {
  const {
    data: document,
    isLoading,
    isFetching,
    refetch,
  } = useGetDocument(graphId, documentId, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && isTerminalStatus(status)) return false;
      return DOCUMENT_PROCESSING_POLL_INTERVAL_MS;
    },
  });

  const status = document?.status ?? "queued";
  const displayName = document?.filename ?? filename ?? "Tài liệu";
  const tone = getStatusTone(status);
  const progress = getStatusProgress(status);
  const isProcessing = !isTerminalStatus(status);

  const { data: jobsData } = useListDocumentIngestJobs(graphId, documentId, {
    limit: 1,
  });

  const latestJob = jobsData?.items?.[0];
  const jobState = latestJob?.state;

  useEffect(() => {
    if (document?.status) {
      onStatusChange?.(document.status);
    }
  }, [document?.status, onStatusChange]);

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/15 bg-accent/25 p-4 shadow-sm dark:border-sidebar-border/40 dark:bg-primary/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Tiến trình xử lý
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0 rounded-lg"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Làm mới trạng thái"
        >
          {isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusToneClass[tone],
              )}
            >
              {getStatusLabel(status)}
            </Badge>

            {jobState && (
              <span className="text-xs text-muted-foreground">
                Job: {getStatusLabel(jobState)}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isProcessing ? "Đang xử lý tài liệu..." : "Hoàn tất"}
              </span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className={cn(
                "h-1.5",
                isProcessing && "**:data-[slot=progress-indicator]:animate-pulse",
              )}
            />
          </div>

          {document?.error_message && (
            <p className="rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/35 dark:text-rose-400">
              {document.error_message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
