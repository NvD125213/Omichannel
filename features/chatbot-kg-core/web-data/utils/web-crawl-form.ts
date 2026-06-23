import type { WebCrawlConfigRequest } from "@/services/chatbot-kg-core/interfaces";

export interface WebCrawlFormState {
  seedUrls: string;
  allowedDomains: string[];
  includePaths: string[];
  blockPaths: string[];
  maxPages: number;
  maxDepth: number;
  minQuality: number;
  chunkTokens: number;
  overlap: number;
  respectRobots: boolean;
  forceRecrawl: boolean;
}

export const DEFAULT_INCLUDE_PATHS = ["/docs"];

export const DEFAULT_BLOCK_PATHS = ["/duong-dan-bi-chan"];

export const DEFAULT_INCLUDE_PATH_OPTIONS = [...DEFAULT_INCLUDE_PATHS];
export const DEFAULT_BLOCK_PATH_OPTIONS = [...DEFAULT_BLOCK_PATHS];

export const webCrawlFormDefaultValues: WebCrawlFormState = {
  seedUrls: "",
  allowedDomains: [],
  includePaths: [...DEFAULT_INCLUDE_PATHS],
  blockPaths: [...DEFAULT_BLOCK_PATHS],
  maxPages: 10,
  maxDepth: 0,
  minQuality: 3,
  chunkTokens: 900,
  overlap: 120,
  respectRobots: true,
  forceRecrawl: false,
};

export function parseMultilineInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function stripTrailingSlash(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/\/+$/, "");
}

export function ensureLeadingSlash(value: string) {
  const trimmed = value.trim().replace(/,+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function buildWebCrawlConfig(
  form: WebCrawlFormState,
  approvedUrls: string[] = [],
): WebCrawlConfigRequest | null {
  const seedUrls = parseMultilineInput(form.seedUrls).map(stripTrailingSlash);
  if (seedUrls.length === 0) return null;

  return {
    seed_urls: seedUrls,
    allowed_domains: form.allowedDomains.length
      ? form.allowedDomains
      : undefined,
    include_paths: form.includePaths.length ? form.includePaths : null,
    block_paths: form.blockPaths.length ? form.blockPaths : null,
    approved_urls: approvedUrls.length ? approvedUrls : null,
    max_pages: form.maxPages,
    max_depth: form.maxDepth,
    min_quality_score: form.minQuality,
    chunk_max_tokens: form.chunkTokens,
    chunk_overlap_tokens: form.overlap,
    respect_robots_txt: form.respectRobots,
    force_recrawl: form.forceRecrawl,
  };
}

export function extractDomainsFromSeedUrls(seedUrlsText: string) {
  const domains = new Set<string>();

  for (const url of parseMultilineInput(seedUrlsText)) {
    try {
      domains.add(new URL(url).hostname);
    } catch {
      // skip invalid URLs
    }
  }

  return Array.from(domains);
}
