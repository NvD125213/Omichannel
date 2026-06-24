import type {
  WebCrawlJobStats,
  WebCrawlPage,
} from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";

export interface WebCrawlPageDetailField {
  label: string;
  value: string;
}

export type WebCrawlPageStatusCategory =
  | "found"
  | "ok"
  | "reject"
  | "skip"
  | "fail";

const statPillBaseClass =
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium leading-none";

export const WEB_CRAWL_STAT_CONFIG: Record<
  WebCrawlPageStatusCategory,
  { label: string; pillClass: string }
> = {
  found: {
    label: "Phát hiện",
    pillClass: cn(
      statPillBaseClass,
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/55 dark:bg-slate-800/70 dark:text-slate-200",
    ),
  },
  ok: {
    label: "Chấp nhận",
    pillClass: cn(
      statPillBaseClass,
      "border-emerald-300/90 bg-emerald-100 text-emerald-600 dark:border-emerald-700/60 dark:bg-emerald-900/55 dark:text-emerald-300",
    ),
  },
  reject: {
    label: "Từ chối",
    pillClass: cn(
      statPillBaseClass,
      "border-amber-300/90 bg-amber-100 text-amber-600 dark:border-amber-700/60 dark:bg-amber-900/55 dark:text-amber-300",
    ),
  },
  skip: {
    label: "Bỏ qua",
    pillClass: cn(
      statPillBaseClass,
      "border-sky-300/90 bg-sky-100 text-sky-600 dark:border-sky-700/60 dark:bg-sky-900/55 dark:text-sky-300",
    ),
  },
  fail: {
    label: "Lỗi",
    pillClass: cn(
      statPillBaseClass,
      "border-rose-300/90 bg-rose-100 text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/55 dark:text-rose-300",
    ),
  },
};

export function getCrawlJobStatItems(stats?: WebCrawlJobStats) {
  return (
    [
      ["found", stats?.discovered ?? 0],
      ["ok", stats?.accepted ?? 0],
      ["reject", stats?.rejected ?? 0],
      ["skip", stats?.skipped ?? 0],
      ["fail", stats?.failed ?? 0],
    ] as const
  ).map(([key, value]) => ({
    key,
    value,
    label: WEB_CRAWL_STAT_CONFIG[key].label,
    pillClass: WEB_CRAWL_STAT_CONFIG[key].pillClass,
  }));
}

export function getPageStatusLabel(category: WebCrawlPageStatusCategory) {
  return WEB_CRAWL_STAT_CONFIG[category].label;
}

export function getPageStatusPillClass(category: WebCrawlPageStatusCategory) {
  return WEB_CRAWL_STAT_CONFIG[category].pillClass;
}

export function getPageStatusCategory(
  page: WebCrawlPage,
): WebCrawlPageStatusCategory {
  const status = (page.status ?? page.state ?? "").toLowerCase();

  if (
    status.includes("accept") ||
    status.includes("success") ||
    status.includes("ready") ||
    status.includes("complete") ||
    status === "ok"
  ) {
    return "ok";
  }

  if (status.includes("reject")) return "reject";
  if (status.includes("skip")) return "skip";
  if (status.includes("fail") || status.includes("error")) return "fail";

  return "found";
}

function formatDetailValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

function formatDetailLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isAcceptedWebPage(page: WebCrawlPage) {
  const status = (page.status ?? page.state ?? "").toLowerCase();
  return (
    status.includes("accept") ||
    status.includes("success") ||
    status.includes("ready") ||
    status.includes("done") ||
    status.includes("complete")
  );
}

export function getPageReason(page: WebCrawlPage) {
  return page.reason?.trim() || page.error_message?.trim() || null;
}

export function getPageQualityScore(page: WebCrawlPage) {
  if (page.quality_score == null || Number.isNaN(page.quality_score)) {
    return null;
  }
  return page.quality_score;
}

export function getPageDetailEntries(
  page: WebCrawlPage,
): WebCrawlPageDetailField[] {
  if (isAcceptedWebPage(page)) return [];

  const detail = page.detail;
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return [];
  }

  return Object.entries(detail)
    .map(([key, value]) => {
      const formatted = formatDetailValue(value);
      if (!formatted) return null;

      return {
        label: formatDetailLabel(key),
        value: formatted,
      };
    })
    .filter((entry): entry is WebCrawlPageDetailField => entry != null);
}

export function hasPageInsightInfo(page: WebCrawlPage) {
  return Boolean(getPageReason(page)) || getPageDetailEntries(page).length > 0;
}
