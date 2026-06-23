"use client";

import {
  CheckCircle2,
  DotIcon,
  Eye,
  Globe,
  Layers,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getStatusLabel,
  getStatusTone,
  statusToneClass,
} from "@/features/chatbot-kg-core/document/utils/document-status";
import { cn } from "@/lib/utils";
import type { WebCrawlJob } from "@/services/chatbot-kg-core/interfaces";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";
import { useWebCrawlJobMonitor } from "../hooks/use-web-crawl-job-monitor";

interface WebDataListItemProps {
  graphId: string;
  crawl: WebCrawlJob;
  index: number;
  isActive?: boolean;
  onView?: (crawl: WebCrawlJob) => void;
  onCrawlUpdate?: (crawl: WebCrawlJob) => void;
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

function formatStat(value: number | undefined) {
  return value ?? 0;
}

export function WebDataListItem({
  graphId,
  crawl,
  index,
  isActive = false,
  onView,
  onCrawlUpdate,
}: WebDataListItemProps) {
  const { handleRefresh, isRefreshing, showProgress, progress, progressLabel } =
    useWebCrawlJobMonitor({
      graphId,
      crawl,
      onCrawlUpdate,
    });

  const status = crawl.state;
  const statusTone = getStatusTone(status);
  const timestamp = getCrawlTimestamp(crawl);
  const displayTime =
    timestamp && !Number.isNaN(parseApiDateTime(timestamp).getTime())
      ? convertDateTime(timestamp, "short")
      : null;
  const isMutedRow = index % 2 === 0;
  const stats = crawl.stats;
  const accepted = formatStat(stats?.accepted);
  const discovered = formatStat(stats?.discovered);
  const failed = formatStat(stats?.failed);
  const rejected = formatStat(stats?.rejected);
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
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            statusToneClass[statusTone],
          )}
        >
          <Globe className="size-3" />
          {getStatusLabel(status)}
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-border/60 dark:bg-muted/20"
        >
          <Layers className="size-3" />
          Phát hiện {discovered} URL
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3" />
          {accepted} chấp nhận
        </Badge>

        {failed > 0 ? (
          <Badge
            variant="outline"
            className="rounded-full border-rose-200/70 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/35 dark:text-rose-400"
          >
            <XCircle className="size-3" />
            {failed} lỗi
          </Badge>
        ) : null}
        {rejected > 0 ? (
          <Badge
            variant="outline"
            className="rounded-full border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-400"
          >
            {rejected} từ chối
          </Badge>
        ) : null}
        {domains.length > 0 ? (
          <Badge
            variant="outline"
            className="rounded-full border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {domains.join(", ")}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
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
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground/80"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Làm mới tiến độ job"
          >
            {isRefreshing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground/80"
            onClick={() => onView?.(crawl)}
            aria-label="Xem trang"
          >
            <Eye className="size-3.5" />
          </Button>
        </div>
      </div>

      {showProgress ? (
        <div className="mt-3 space-y-1.5 rounded-xl border border-primary/10 bg-accent/20 px-3 py-2.5 dark:border-sidebar-border/40 dark:bg-primary/10">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">{progressLabel}</span>
            <span className="shrink-0 tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 **:data-[slot=progress-indicator]:animate-pulse"
          />
          <p className="text-[11px] text-muted-foreground/80">
            Tự động cập nhật mỗi phút khi job đang chạy
          </p>
        </div>
      ) : null}

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
