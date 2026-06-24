"use client";

import { DotIcon, Eye, Globe, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getStatusLabel,
  getStatusTone,
  statusToneClass,
} from "@/features/chatbot-kg-core/document/utils/document-status";
import { cn } from "@/lib/utils";
import type { WebCrawlJob } from "@/services/chatbot-kg-core/interfaces";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";
import { useWebCrawlJobMonitor } from "../hooks/use-web-crawl-job-monitor";
import { getCrawlJobStatItems } from "../utils/web-crawl-page-meta";

interface WebDataListItemProps {
  graphId: string;
  crawl: WebCrawlJob;
  index: number;
  isActive?: boolean;
  onView?: (crawl: WebCrawlJob) => void;
  onCrawlUpdate?: (crawl: WebCrawlJob) => void;
}

const actionButtonClass =
  "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground/80";

const waveProgressTrackClass =
  "relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-400/30 shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)] ring-1 ring-zinc-500/25 dark:bg-zinc-600/35 dark:ring-zinc-500/35";

const waveProgressIndicatorClass =
  "absolute inset-y-0 left-0 w-[38%] animate-dry-run-wave rounded-full bg-linear-to-r from-white/0 via-white/85 to-white/0 dark:via-white/35";

function WebCrawlWaveProgress() {
  return (
    <div className={waveProgressTrackClass} aria-hidden>
      <div className={waveProgressIndicatorClass} />
    </div>
  );
}

function getCrawlTitle(crawl: WebCrawlJob) {
  const seedUrl = crawl.config?.seed_urls?.[0];
  if (!seedUrl) return "Crawl job";

  try {
    return new URL(seedUrl).hostname;
  } catch {
    return seedUrl;
  }
}

function getCrawlTimestamp(crawl: WebCrawlJob) {
  return crawl.completed_at ?? crawl.updated_at ?? crawl.created_at;
}

export function WebDataListItem({
  graphId,
  crawl,
  index,
  isActive = false,
  onView,
  onCrawlUpdate,
}: WebDataListItemProps) {
  const { handleRefresh, isRefreshing, showProgress, progressLabel } =
    useWebCrawlJobMonitor({
      graphId,
      crawl,
      onCrawlUpdate,
    });

  const isTrackingJob = showProgress || isRefreshing;
  const trackingLabel = isRefreshing
    ? "Đang cập nhật tiến độ..."
    : progressLabel;

  const status = crawl.state;
  const statusTone = getStatusTone(status);
  const timestamp = getCrawlTimestamp(crawl);
  const displayTime =
    timestamp && !Number.isNaN(parseApiDateTime(timestamp).getTime())
      ? convertDateTime(timestamp, "short")
      : null;
  const isMutedRow = index % 2 === 0;
  const statItems = getCrawlJobStatItems(crawl.stats);
  const maxPages = crawl.config?.max_pages;
  const domains = crawl.config?.allowed_domains ?? [];

  return (
    <article
      className={cn(
        "px-4 py-4 transition-colors sm:px-5",
        isMutedRow ? "bg-muted/50" : "bg-background",
        isActive
          ? "bg-primary/5 ring-1 ring-inset ring-primary/15"
          : "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 text-[15px] font-semibold leading-snug tracking-tight text-foreground/90">
            {getCrawlTitle(crawl)}
          </h3>
          {displayTime ? (
            <time
              dateTime={timestamp}
              className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground/65"
              title={timestamp}
            >
              <DotIcon className="size-3.5" />
              <span className="font-medium text-foreground">Ngày tạo: </span>
              {displayTime.datetime}
            </time>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium",
            statusToneClass[statusTone],
          )}
        >
          <Globe className="size-3" />
          {getStatusLabel(status)}
        </Badge>

        {statItems.map((item) => (
          <span key={item.key} className={item.pillClass}>
            {item.label} {item.value}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs leading-relaxed text-muted-foreground/65">
            {maxPages != null ? <span>Giới hạn {maxPages} trang</span> : null}
            {maxPages != null && crawl.config?.max_depth != null ? (
              <span> · </span>
            ) : null}
            {crawl.config?.max_depth != null ? (
              <span>Độ sâu {crawl.config.max_depth}</span>
            ) : null}
            {(crawl.config?.approved_urls?.length ?? 0) > 0 ? (
              <span> · {crawl.config!.approved_urls!.length} URL duyệt</span>
            ) : null}
          </p>

          {isTrackingJob ? (
            <div className="space-y-1.5 pr-1">
              <p className="text-[11px] leading-relaxed text-muted-foreground/75">
                {trackingLabel}
              </p>
              <WebCrawlWaveProgress />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 self-end sm:pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={actionButtonClass}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Làm mới
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={actionButtonClass}
            onClick={() => onView?.(crawl)}
            disabled={isRefreshing}
          >
            <Eye className="size-3.5" />
            Xem trang
          </Button>
        </div>
      </div>

      {crawl.error_message ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-rose-600/80 dark:text-rose-400/80">
          <span className="font-medium">Lỗi: </span>
          {crawl.error_message}
        </p>
      ) : null}

      <p
        className="truncate font-mono text-[10px] text-muted-foreground/55"
        title={crawl.id}
      >
        Job ID: {crawl.id}
      </p>
    </article>
  );
}
