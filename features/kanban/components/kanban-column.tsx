"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { ColumnStatus, KanbanTask } from "../utils/schema";
import { statusConfig } from "../utils/schema";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  id: ColumnStatus;
  title: string;
  tasks: KanbanTask[];
  onAddTask: (status: ColumnStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  });

  const config = statusConfig[id];

  return (
    <div
      className={cn(
        "flex h-full w-80 shrink-0 flex-col rounded-xl border transition-all duration-200",
        config.bgColor,
        config.borderColor,
        isOver && "ring-primary ring-2 scale-[1.01] shadow-lg",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b p-4 rounded-t-xl",
          "bg-white/50 backdrop-blur-sm",
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full", config.color)} />
          <h3
            className={cn("text-sm font-bold tracking-tight", config.textColor)}
          >
            {title}
          </h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold shadow-xs",
              config.color,
              "text-white",
            )}
          >
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "size-8 rounded-lg hover:bg-white transition-colors",
            config.textColor,
          )}
          onClick={() => onAddTask(id)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pt-2">
        <div
          ref={setNodeRef}
          className="flex min-h-[200px] flex-col gap-2 pb-2"
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div
              className={cn(
                "flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed gap-2 transition-colors",
                config.borderColor,
                "bg-white/30",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full bg-white shadow-sm",
                  config.textColor,
                )}
              >
                <Plus className="size-4 opacity-50" />
              </div>
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  config.textColor,
                )}
              >
                No tasks yet
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
