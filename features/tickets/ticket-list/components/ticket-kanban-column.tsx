"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Ticket } from "../utils/ticket-schema";
import { TicketKanbanCard } from "./ticket-kanban-card";
import { IconTicketOff } from "@tabler/icons-react";
import { useMemo } from "react";

interface TicketKanbanColumnProps {
  id: string; // priority
  title: string;
  tickets?: Ticket[];
  color: string;
  loading?: boolean;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (id: string) => void;
}

export function TicketKanbanColumn({
  id,
  title,
  tickets = [],
  color,
  loading,
  onEditTicket,
  onDeleteTicket,
}: TicketKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      priority: id,
    },
  });

  const itemIds = useMemo(() => tickets.map((t) => t.id || t.code), [tickets]);

  return (
    <div
      className={cn(
        "flex h-full max-h-full min-w-[300px] flex-1 shrink-0 flex-col rounded-xl border transition-all duration-200 bg-slate-50/50 dark:bg-zinc-900/50",
        isOver &&
          "ring-primary ring-2 scale-[1.01] shadow-lg bg-slate-100 dark:bg-zinc-800",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b p-4 rounded-t-xl",
          "bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50",
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full relative", color)}>
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                color,
              )}
            ></span>
          </div>
          <h3
            className={cn(
              "text-sm font-bold tracking-tight text-zinc-700 dark:text-zinc-200",
            )}
          >
            {title}
          </h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold shadow-xs text-white",
              color,
            )}
          >
            {loading ? (
              <Skeleton className="h-4 w-6 rounded-full" />
            ) : (
              tickets.length
            )}
          </span>
        </div>
      </div>

      <ScrollArea className="px-2 pt-2 h-[calc(200px*3)]">
        <div
          ref={setNodeRef}
          className="flex min-h-[200px] flex-col gap-2 pb-2"
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
            disabled={loading}
          >
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TicketKanbanCard key={i} isLoading />
                ))
              : tickets.map((ticket) => (
                  <TicketKanbanCard
                    key={ticket.id || ticket.code}
                    ticket={ticket}
                    onEditTicket={onEditTicket}
                    onDeleteTicket={onDeleteTicket}
                  />
                ))}
          </SortableContext>
          {!loading && tickets.length === 0 && (
            <div
              className={cn(
                "flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed gap-2 transition-colors border-slate-200 dark:border-zinc-800",
                "bg-white/30 dark:bg-zinc-900/10",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm text-slate-400",
                )}
              >
                <IconTicketOff className="size-5 opacity-50" />
              </div>
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider text-slate-400",
                )}
              >
                Trống
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
