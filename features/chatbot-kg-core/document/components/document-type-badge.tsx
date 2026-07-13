"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Braces,
  Code2,
  File,
  FileSpreadsheet,
  FileText,
  FileType2,
  Globe,
  Hash,
  Link2,
  PenLine,
  Upload,
  Webhook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DocumentTableEmptyValue } from "./document-table-empty-value";

type BadgeMeta = {
  label: string;
  Icon: LucideIcon;
  className: string;
};

const contentTypeMap: Record<string, BadgeMeta> = {
  "application/pdf": {
    label: "PDF",
    Icon: FileText,
    className:
      "border-rose-300/60 bg-gradient-to-br from-rose-50 via-rose-100 to-red-200 text-rose-700 shadow-sm shadow-rose-500/15 dark:border-rose-500/40 dark:from-rose-800/60 dark:via-rose-900/50 dark:to-red-800/50 dark:text-rose-200 dark:shadow-none",
  },
  "text/plain": {
    label: "TXT",
    Icon: AlignLeft,
    className:
      "border-slate-300/60 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-700 shadow-sm shadow-slate-500/15 dark:border-slate-500/50 dark:from-slate-700/60 dark:via-slate-800/50 dark:to-slate-900/50 dark:text-slate-200 dark:shadow-none",
  },
  "text/markdown": {
    label: "MD",
    Icon: Hash,
    className:
      "border-violet-300/60 bg-gradient-to-br from-violet-50 via-violet-100 to-purple-200 text-violet-700 shadow-sm shadow-violet-500/15 dark:border-violet-500/40 dark:from-violet-800/60 dark:via-violet-900/50 dark:to-purple-800/50 dark:text-violet-200 dark:shadow-none",
  },
  "application/json": {
    label: "JSON",
    Icon: Braces,
    className:
      "border-amber-300/60 bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-200 text-amber-700 shadow-sm shadow-amber-500/15 dark:border-amber-500/40 dark:from-amber-800/60 dark:via-amber-900/50 dark:to-yellow-800/50 dark:text-amber-200 dark:shadow-none",
  },
  "text/html": {
    label: "HTML",
    Icon: Code2,
    className:
      "border-orange-300/60 bg-gradient-to-br from-orange-50 via-orange-100 to-amber-200 text-orange-700 shadow-sm shadow-orange-500/15 dark:border-orange-500/40 dark:from-orange-800/60 dark:via-orange-900/50 dark:to-amber-800/50 dark:text-orange-200 dark:shadow-none",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    Icon: FileType2,
    className:
      "border-blue-300/60 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 text-blue-700 shadow-sm shadow-blue-500/15 dark:border-blue-500/40 dark:from-blue-800/60 dark:via-blue-900/50 dark:to-indigo-800/50 dark:text-blue-200 dark:shadow-none",
  },
  "application/msword": {
    label: "DOC",
    Icon: FileType2,
    className:
      "border-blue-300/60 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 text-blue-700 shadow-sm shadow-blue-500/15 dark:border-blue-500/40 dark:from-blue-800/60 dark:via-blue-900/50 dark:to-indigo-800/50 dark:text-blue-200 dark:shadow-none",
  },
  "text/csv": {
    label: "CSV",
    Icon: FileSpreadsheet,
    className:
      "border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-200 text-emerald-700 shadow-sm shadow-emerald-500/15 dark:border-emerald-500/40 dark:from-emerald-800/60 dark:via-emerald-900/50 dark:to-teal-800/50 dark:text-emerald-200 dark:shadow-none",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "XLSX",
    Icon: FileSpreadsheet,
    className:
      "border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-200 text-emerald-700 shadow-sm shadow-emerald-500/15 dark:border-emerald-500/40 dark:from-emerald-800/60 dark:via-emerald-900/50 dark:to-teal-800/50 dark:text-emerald-200 dark:shadow-none",
  },
};

const sourceTypeMap: Record<string, BadgeMeta> = {
  upload: {
    label: "Tải lên",
    Icon: Upload,
    className:
      "border-sky-300/60 bg-gradient-to-br from-sky-50 via-sky-100 to-blue-200 text-sky-700 shadow-sm shadow-sky-500/15 dark:border-sky-500/40 dark:from-sky-800/60 dark:via-sky-900/50 dark:to-blue-800/50 dark:text-sky-200 dark:shadow-none",
  },
  file: {
    label: "Tệp",
    Icon: File,
    className:
      "border-primary/20 bg-gradient-to-br from-background via-accent/50 to-muted/40 text-accent-foreground/80 dark:border-sidebar-border/40 dark:from-primary/20 dark:via-primary/12 dark:to-primary/5 dark:text-sidebar-foreground/80",
  },
  web: {
    label: "Web",
    Icon: Globe,
    className:
      "border-cyan-300/60 bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-200 text-cyan-700 shadow-sm shadow-cyan-500/15 dark:border-cyan-500/40 dark:from-cyan-800/60 dark:via-cyan-900/50 dark:to-sky-800/50 dark:text-cyan-200 dark:shadow-none",
  },
  web_crawl: {
    label: "Crawl web",
    Icon: Globe,
    className:
      "border-cyan-300/60 bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-200 text-cyan-700 shadow-sm shadow-cyan-500/15 dark:border-cyan-500/40 dark:from-cyan-800/60 dark:via-cyan-900/50 dark:to-sky-800/50 dark:text-cyan-200 dark:shadow-none",
  },
  crawl: {
    label: "Crawl",
    Icon: Globe,
    className:
      "border-cyan-300/60 bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-200 text-cyan-700 shadow-sm shadow-cyan-500/15 dark:border-cyan-500/40 dark:from-cyan-800/60 dark:via-cyan-900/50 dark:to-sky-800/50 dark:text-cyan-200 dark:shadow-none",
  },
  url: {
    label: "URL",
    Icon: Link2,
    className:
      "border-indigo-300/60 bg-gradient-to-br from-indigo-50 via-indigo-100 to-violet-200 text-indigo-700 shadow-sm shadow-indigo-500/15 dark:border-indigo-500/40 dark:from-indigo-800/60 dark:via-indigo-900/50 dark:to-violet-800/50 dark:text-indigo-200 dark:shadow-none",
  },
  api: {
    label: "API",
    Icon: Webhook,
    className:
      "border-fuchsia-300/60 bg-gradient-to-br from-fuchsia-50 via-fuchsia-100 to-pink-200 text-fuchsia-700 shadow-sm shadow-fuchsia-500/15 dark:border-fuchsia-500/40 dark:from-fuchsia-800/60 dark:via-fuchsia-900/50 dark:to-pink-800/50 dark:text-fuchsia-200 dark:shadow-none",
  },
  manual: {
    label: "Thủ công",
    Icon: PenLine,
    className:
      "border-zinc-300/60 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 text-zinc-700 shadow-sm shadow-zinc-500/15 dark:border-zinc-500/50 dark:from-zinc-700/60 dark:via-zinc-800/50 dark:to-zinc-900/50 dark:text-zinc-200 dark:shadow-none",
  },
};

const defaultContentTypeMeta: BadgeMeta = {
  label: "FILE",
  Icon: File,
  className:
    "border-primary/20 bg-gradient-to-br from-background via-accent/50 to-muted/40 text-accent-foreground/80 dark:border-sidebar-border/40 dark:from-primary/20 dark:via-primary/12 dark:to-primary/5 dark:text-sidebar-foreground/80",
};

const defaultSourceTypeMeta: BadgeMeta = {
  label: "Không rõ",
  Icon: File,
  className:
    "border-primary/20 bg-gradient-to-br from-background via-muted/60 to-muted/40 text-muted-foreground dark:border-sidebar-border/40 dark:from-primary/15 dark:via-primary/10 dark:to-primary/5",
};

function formatContentTypeLabel(contentType: string) {
  const normalized = contentType.toLowerCase().trim();
  if (contentTypeMap[normalized]) return contentTypeMap[normalized].label;

  if (normalized.includes("/")) {
    const subtype = normalized.split("/")[1]?.split("+")[0] ?? normalized;
    return subtype.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) || "FILE";
  }

  return normalized.toUpperCase().slice(0, 6);
}

function formatSourceTypeLabel(sourceType: string) {
  const normalized = sourceType.toLowerCase().trim().replace(/[-\s]+/g, "_");
  if (sourceTypeMap[normalized]) return sourceTypeMap[normalized].label;

  return sourceType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getContentTypeMeta(contentType?: string | null): BadgeMeta {
  if (!contentType) return defaultContentTypeMeta;

  const normalized = contentType.toLowerCase().trim();
  const mapped = contentTypeMap[normalized];

  if (mapped) return mapped;

  return {
    ...defaultContentTypeMeta,
    label: formatContentTypeLabel(contentType),
  };
}

function getSourceTypeMeta(sourceType?: string | null): BadgeMeta {
  if (!sourceType) return defaultSourceTypeMeta;

  const normalized = sourceType.toLowerCase().trim().replace(/[-\s]+/g, "_");
  const mapped = sourceTypeMap[normalized];

  if (mapped) return mapped;

  return {
    ...defaultSourceTypeMeta,
    label: formatSourceTypeLabel(sourceType),
  };
}

function TypeBadge({
  meta,
  title,
}: {
  meta: BadgeMeta;
  title?: string;
}) {
  const { label, Icon, className } = meta;

  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(
        "w-fit gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        className,
      )}
    >
      <Icon className="size-3 shrink-0 opacity-90" />
      <span className="max-w-24 truncate">{label}</span>
    </Badge>
  );
}

export function DocumentContentTypeBadge({
  contentType,
}: {
  contentType?: string | null;
}) {
  if (!contentType) {
    return <DocumentTableEmptyValue />;
  }

  return (
    <TypeBadge
      meta={getContentTypeMeta(contentType)}
      title={contentType}
    />
  );
}

export function DocumentSourceTypeBadge({
  sourceType,
}: {
  sourceType?: string | null;
}) {
  if (!sourceType) {
    return <DocumentTableEmptyValue />;
  }

  return (
    <TypeBadge
      meta={getSourceTypeMeta(sourceType)}
      title={sourceType}
    />
  );
}
