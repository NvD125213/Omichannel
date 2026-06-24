"use client";

import { DotIcon, Pencil, Power, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KgFaq } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";

interface FaqDataListItemProps {
  faq: KgFaq;
  index: number;
  onEdit?: (faq: KgFaq) => void;
  onDelete?: (faq: KgFaq) => void;
}

const editButtonClass =
  "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground/80";

const deleteButtonClass =
  "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive";

export function FaqDataListItem({
  faq,
  index,
  onEdit,
  onDelete,
}: FaqDataListItemProps) {
  const createdAt = faq.created_at || faq.updated_at;
  const createdDateTime =
    createdAt && !Number.isNaN(parseApiDateTime(createdAt).getTime())
      ? convertDateTime(createdAt, "short")
      : null;
  const isMutedRow = index % 2 === 0;

  return (
    <article
      className={cn(
        "px-4 py-4 transition-colors sm:px-5",
        isMutedRow ? "bg-muted/50" : "bg-background",
        "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 text-[15px] font-semibold leading-snug tracking-tight text-foreground/90">
            {faq.question}
          </h3>
          {createdDateTime ? (
            <time
              dateTime={createdAt}
              className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground/65"
              title={createdAt}
            >
              <DotIcon className="size-3.5" />
              {createdDateTime.datetime}
            </time>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            faq.enabled
              ? "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-400"
              : "border-border/70 bg-muted/40 text-muted-foreground dark:border-border/60 dark:bg-muted/20",
          )}
        >
          <Power className="size-3" />
          {faq.enabled ? "Đang hoạt động" : "Đã tắt"}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            faq.has_embedding
              ? "border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-400"
              : "border-border/70 bg-muted/40 text-muted-foreground dark:border-border/60 dark:bg-muted/20",
          )}
        >
          <Sparkles className="size-3" />
          {faq.has_embedding ? "Đã embedding" : "Chưa embedding"}
        </Badge>
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground/75">
          <span className="font-medium text-foreground/80">Câu trả lời: </span>
          {faq.answer}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={editButtonClass}
            onClick={() => onEdit?.(faq)}
          >
            <Pencil className="size-3.5" />
            Sửa
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={deleteButtonClass}
            onClick={() => onDelete?.(faq)}
          >
            <Trash2 className="size-3.5" />
            Xóa
          </Button>
        </div>
      </div>
    </article>
  );
}
