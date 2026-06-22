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
      "border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/35 dark:text-rose-400",
  },
  "text/plain": {
    label: "TXT",
    Icon: AlignLeft,
    className:
      "border-slate-200/70 bg-slate-50 text-slate-700 dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-slate-300",
  },
  "text/markdown": {
    label: "MD",
    Icon: Hash,
    className:
      "border-violet-200/70 bg-violet-50 text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/35 dark:text-violet-400",
  },
  "application/json": {
    label: "JSON",
    Icon: Braces,
    className:
      "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-400",
  },
  "text/html": {
    label: "HTML",
    Icon: Code2,
    className:
      "border-orange-200/70 bg-orange-50 text-orange-700 dark:border-orange-800/50 dark:bg-orange-950/35 dark:text-orange-400",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    Icon: FileType2,
    className:
      "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/35 dark:text-blue-400",
  },
  "application/msword": {
    label: "DOC",
    Icon: FileType2,
    className:
      "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/35 dark:text-blue-400",
  },
  "text/csv": {
    label: "CSV",
    Icon: FileSpreadsheet,
    className:
      "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-400",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "XLSX",
    Icon: FileSpreadsheet,
    className:
      "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-400",
  },
};

const sourceTypeMap: Record<string, BadgeMeta> = {
  upload: {
    label: "Tải lên",
    Icon: Upload,
    className:
      "border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-400",
  },
  file: {
    label: "Tệp",
    Icon: File,
    className:
      "border-primary/15 bg-accent/40 text-accent-foreground/80 dark:border-sidebar-border/40 dark:bg-primary/10 dark:text-sidebar-foreground/80",
  },
  web: {
    label: "Web",
    Icon: Globe,
    className:
      "border-cyan-200/70 bg-cyan-50 text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/35 dark:text-cyan-400",
  },
  web_crawl: {
    label: "Crawl web",
    Icon: Globe,
    className:
      "border-cyan-200/70 bg-cyan-50 text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/35 dark:text-cyan-400",
  },
  crawl: {
    label: "Crawl",
    Icon: Globe,
    className:
      "border-cyan-200/70 bg-cyan-50 text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/35 dark:text-cyan-400",
  },
  url: {
    label: "URL",
    Icon: Link2,
    className:
      "border-indigo-200/70 bg-indigo-50 text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/35 dark:text-indigo-400",
  },
  api: {
    label: "API",
    Icon: Webhook,
    className:
      "border-fuchsia-200/70 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800/50 dark:bg-fuchsia-950/35 dark:text-fuchsia-400",
  },
  manual: {
    label: "Thủ công",
    Icon: PenLine,
    className:
      "border-zinc-200/70 bg-zinc-50 text-zinc-700 dark:border-zinc-700/50 dark:bg-zinc-900/40 dark:text-zinc-300",
  },
};

const defaultContentTypeMeta: BadgeMeta = {
  label: "FILE",
  Icon: File,
  className:
    "border-primary/15 bg-accent/40 text-accent-foreground/80 dark:border-sidebar-border/40 dark:bg-primary/10 dark:text-sidebar-foreground/80",
};

const defaultSourceTypeMeta: BadgeMeta = {
  label: "Không rõ",
  Icon: File,
  className:
    "border-primary/15 bg-muted/40 text-muted-foreground dark:border-sidebar-border/40 dark:bg-primary/10",
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
