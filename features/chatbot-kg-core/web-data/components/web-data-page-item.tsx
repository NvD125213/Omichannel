"use client";

import { DotIcon, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WebCrawlPage } from "@/services/chatbot-kg-core/interfaces";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";
import {
  getPageDetailEntries,
  getPageQualityScore,
  getPageReason,
  getPageStatusCategory,
  getPageStatusLabel,
  getPageStatusPillClass,
  hasPageInsightInfo,
} from "../utils/web-crawl-page-meta";
interface WebDataPageItemProps {
  page: WebCrawlPage;
  index: number;
}

function getPageTitle(page: WebCrawlPage) {
  if (page.title?.trim()) return page.title.trim();

  try {
    const url = new URL(page.url);
    const path = url.pathname === "/" ? url.hostname : url.pathname;
    return path || url.hostname;
  } catch {
    return page.url;
  }
}

function getPageTimestamp(page: WebCrawlPage) {
  return page.crawled_at ?? page.updated_at ?? page.created_at ?? null;
}

function PageInsights({
  reason,
  detailEntries,
}: {
  reason: string | null;
  detailEntries: { label: string; value: string }[];
}) {
  const detailLine = detailEntries
    .map((entry) => `${entry.label}: ${entry.value}`)
    .join(" · ");

  return (
    <div className="space-y-2">
      {reason ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed text-muted-foreground/75">
          <span className="shrink-0 font-medium text-foreground">
            Lý do lỗi:
          </span>
          <span className="min-w-0 flex-1 break-all font-bold text-xs text-red-500">
            {reason}
          </span>
        </p>
      ) : null}

      {detailLine ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed text-muted-foreground/75">
          <span className="shrink-0 font-medium text-foreground">
            Chi tiết:
          </span>
          <span className="min-w-0 flex-1 break-all">{detailLine}</span>
        </p>
      ) : null}
    </div>
  );
}

export function WebDataPageItem({ page, index }: WebDataPageItemProps) {
  const statusCategory = getPageStatusCategory(page);
  const timestamp = getPageTimestamp(page);
  const displayTime =
    timestamp && !Number.isNaN(parseApiDateTime(timestamp).getTime())
      ? convertDateTime(timestamp, "short")
      : null;
  const isMutedRow = index % 2 === 0;
  const displayUrl = page.canonical_url?.trim() || page.url;
  const qualityScore = getPageQualityScore(page);
  const reason = getPageReason(page);
  const detailEntries = getPageDetailEntries(page);
  const showInsights = hasPageInsightInfo(page);

  return (
    <article
      className={cn(
        "rounded-xl border border-border/60 px-3 py-3 transition-colors",
        isMutedRow ? "bg-muted/30" : "bg-background",
        "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-semibold leading-snug text-foreground/90">
              {getPageTitle(page)}
            </h4>
            {displayTime ? (
              <time
                dateTime={timestamp ?? undefined}
                className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground/65"
                title={timestamp ?? undefined}
              >
                <DotIcon className="size-3" />
                {displayTime.datetime}
              </time>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={getPageStatusPillClass(statusCategory)}>
              {getPageStatusLabel(statusCategory)}
            </span>
            {page.domain ? (
              <Badge
                variant="outline"
                className="rounded-full border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {page.domain}
              </Badge>
            ) : null}
            {qualityScore != null ? (
              <Badge
                variant="outline"
                className="rounded-full border-sky-200/70 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-400"
              >
                <Sparkles className="size-2.5" />
                {qualityScore.toFixed(1)}
              </Badge>
            ) : null}
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/75">
            <span className="font-medium text-foreground">URL truy cập: </span>{" "}
            {displayUrl}
          </p>

          {showInsights ? (
            <PageInsights reason={reason} detailEntries={detailEntries} />
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg text-muted-foreground/70 hover:text-foreground/80"
          asChild
        >
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mở trang"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}
