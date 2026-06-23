import type { WebCrawlPage } from "@/services/chatbot-kg-core/interfaces";

export interface WebCrawlPageDetailField {
  label: string;
  value: string;
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
