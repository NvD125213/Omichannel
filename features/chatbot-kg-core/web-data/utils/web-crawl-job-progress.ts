import {
  getStatusProgress,
  getStatusTone,
  isTerminalStatus,
} from "@/features/chatbot-kg-core/document/utils/document-status";
import type { WebCrawlJob } from "@/services/chatbot-kg-core/interfaces";

export const WEB_CRAWL_JOB_POLL_INTERVAL_MS = 60_000;
export const WEB_CRAWL_JOB_REFRESH_MIN_DURATION_MS = 1_000;

export function getCrawlJobProgress(crawl: WebCrawlJob) {
  if (isTerminalStatus(crawl.state)) {
    return getStatusTone(crawl.state) === "success" ? 100 : 100;
  }

  const maxPages = crawl.config?.max_pages;
  const discovered = crawl.stats?.discovered ?? 0;
  const processed =
    (crawl.stats?.accepted ?? 0) +
    (crawl.stats?.failed ?? 0) +
    (crawl.stats?.rejected ?? 0);
  const activity = Math.max(discovered, processed);

  if (maxPages && maxPages > 0) {
    const ratio = Math.round((activity / maxPages) * 100);
    return Math.min(95, Math.max(12, ratio));
  }

  return getStatusProgress(crawl.state);
}

export function getCrawlJobProgressLabel(crawl: WebCrawlJob) {
  if (isTerminalStatus(crawl.state)) {
    return getStatusTone(crawl.state) === "success"
      ? "Job đã hoàn tất"
      : "Job đã kết thúc";
  }

  const discovered = crawl.stats?.discovered ?? 0;
  const accepted = crawl.stats?.accepted ?? 0;
  const maxPages = crawl.config?.max_pages;

  if (maxPages) {
    return `Đang crawl · ${accepted}/${maxPages} trang chấp nhận · ${discovered} phát hiện`;
  }

  return `Đang crawl · ${accepted} chấp nhận · ${discovered} phát hiện`;
}
