"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { WebCrawlDryRunItem } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";

interface WebDataDryRunListItemProps {
  item: WebCrawlDryRunItem;
  index: number;
  approved?: boolean;
  onApprovedChange?: (approved: boolean) => void;
  onDelete?: (item: WebCrawlDryRunItem) => void;
}

export function WebDataDryRunListItem({
  item,
  index,
  approved = false,
  onApprovedChange,
  onDelete,
}: WebDataDryRunListItemProps) {
  const isMutedRow = index % 2 === 0;
  const lastmod =
    item.lastmod &&
    !Number.isNaN(parseApiDateTime(item.lastmod).getTime())
      ? convertDateTime(item.lastmod, "short").datetime
      : "—";

  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-2 px-4 py-3 transition-colors sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto] sm:items-center sm:gap-3 sm:px-5",
        isMutedRow ? "bg-muted/50" : "bg-background",
        "hover:bg-muted/40",
      )}
    >
      <div className="flex items-center sm:justify-center">
        <Checkbox
          checked={approved}
          onCheckedChange={(checked) => onApprovedChange?.(checked === true)}
          aria-label={`Duyệt URL ${item.url}`}
        />
      </div>
      <p className="min-w-0 truncate text-sm text-foreground/90" title={item.url}>
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
          URL
        </span>
        {item.url}
      </p>
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
          Miền
        </span>
        {item.domain ?? "—"}
      </p>
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
          Nguồn
        </span>
        {item.source}
      </p>
      <p className="min-w-0 truncate text-sm tabular-nums text-muted-foreground">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
          Cập nhật
        </span>
        {lastmod}
      </p>
      <div className="flex shrink-0 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-amber-600/75 transition-colors hover:bg-amber-500/8 hover:text-amber-600"
          onClick={() => onDelete?.(item)}
          aria-label="Xóa URL"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
