"use client";

import { ChevronRight, KeyRound, Power } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KgAgent } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";

interface AgentDataListItemProps {
  agent: KgAgent;
  index: number;
  isActive?: boolean;
  onView?: (agent: KgAgent) => void;
}

const actionButtonClass =
  "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground/80";

const avatarPalette = [
  "bg-violet-100 text-violet-900 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800/50",
  "bg-sky-100 text-sky-900 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/50",
  "bg-emerald-100 text-emerald-900 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50",
  "bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800/50",
];

const enabledBadgeClass =
  "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-emerald-400";

const disabledBadgeClass =
  "border-border/70 bg-muted/40 text-muted-foreground dark:border-border/60 dark:bg-muted/20";

function agentInitials(name: string | null, key: string) {
  const source = (name ?? key).trim();
  const parts = source.split(/[\s-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "AG";
}

export function AgentDataListItem({
  agent,
  index,
  isActive = false,
  onView,
}: AgentDataListItemProps) {
  const displayName = agent.name?.trim() || agent.key;
  const isMutedRow = index % 2 === 0;
  const palette = avatarPalette[index % avatarPalette.length];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onView?.(agent)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView?.(agent);
        }
      }}
      className={cn(
        "group cursor-pointer px-4 py-4 transition-colors sm:px-5",
        isMutedRow
          ? "bg-muted/35 dark:bg-transparent"
          : "bg-background dark:bg-transparent",
        isActive
          ? "bg-primary/5 ring-1 ring-inset ring-primary/15"
          : "hover:bg-muted/45",
      )}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="relative shrink-0">
          <Avatar
            className={cn("size-11 rounded-xl ring-1 sm:size-12", palette)}
          >
            <AvatarFallback
              className={cn(
                "rounded-xl text-sm font-semibold tracking-tight",
                palette,
              )}
            >
              {agentInitials(agent.name, agent.key)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background",
              agent.enabled ? "bg-emerald-500" : "bg-muted-foreground/35",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-[15px] font-semibold leading-snug tracking-tight text-foreground/90">
                {displayName}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-md border border-border/60 bg-muted/25 px-2 py-0.5 text-[11px] text-muted-foreground/90",
                  )}
                  title={agent.key}
                >
                  <KeyRound className="size-3 shrink-0 opacity-70" />
                  <span className="truncate">{agent.key}</span>
                </span>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                agent.enabled ? enabledBadgeClass : disabledBadgeClass,
              )}
            >
              <Power className="size-3" />
              {agent.enabled ? "Đang bật" : "Đã tắt"}
            </Badge>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                actionButtonClass,
                "shrink-0 opacity-80 group-hover:opacity-100",
              )}
              onClick={(event) => {
                event.stopPropagation();
                onView?.(agent);
              }}
            >
              Chi tiết
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
