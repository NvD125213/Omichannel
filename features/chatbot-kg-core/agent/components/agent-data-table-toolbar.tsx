"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentDataTableToolbarProps {
  title?: string;
  description?: string;
  enabledCount?: number;
  totalCount?: number;
}

export function AgentDataTableToolbar({
  title = "Agent",
  description,
  enabledCount,
  totalCount,
}: AgentDataTableToolbarProps) {
  const showStats =
    enabledCount != null && totalCount != null && totalCount > 0;
  const disabledCount = showStats ? totalCount - enabledCount : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
            {title}
          </h2>
          {showStats ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                {enabledCount} đang bật
              </Badge>
              {disabledCount > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700/50 dark:bg-slate-950/30 dark:text-slate-400"
                >
                  {disabledCount} đã tắt
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className={cn(
            "h-8 cursor-pointer rounded-lg px-3",
            "bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
          )}
          asChild
        >
          <Link href="/ai/agent/actions">
            <Plus className="size-4" />
            Thêm agent
          </Link>
        </Button>
      </div>
    </div>
  );
}
