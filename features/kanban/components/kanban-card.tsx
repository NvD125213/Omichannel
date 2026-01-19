"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { KanbanTask } from "../utils/schema";
import { statusConfig } from "../utils/schema";

interface KanbanCardProps {
  task: KanbanTask;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = statusConfig[task.status];
  const priorityColors = {
    low: "border-slate-200 text-slate-500 bg-slate-50",
    medium: "border-blue-200 text-blue-600 bg-blue-50",
    high: "border-rose-200 text-rose-600 bg-rose-50",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab overflow-hidden border-none py-3 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5",
        isDragging && "opacity-50 ring-2 ring-primary shadow-2xl scale-105",
        "bg-white dark:bg-zinc-900",
      )}
    >
      {/* Accent Strip */}
      <div className={cn("absolute inset-y-0 left-0 w-1", status.color)} />

      <CardContent className="space-y-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="flex-1 text-[13px] font-bold leading-snug text-zinc-800 dark:text-zinc-200">
            {task.title}
          </h4>
          <button
            {...attributes}
            {...listeners}
            className="text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-500 shrink-0 cursor-grab touch-none"
          >
            <GripVertical className="size-4" />
          </button>
        </div>

        {task.description && (
          <p className="text-zinc-500 line-clamp-2 text-xs leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignee && (
              <Avatar className="size-7 border-2 border-white dark:border-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800 shadow-sm">
                <AvatarImage
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                />
                <AvatarFallback className="text-[10px] bg-zinc-100 font-bold">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 h-5 border shadow-sm",
                priorityColors[task.priority],
              )}
            >
              {task.priority}
            </Badge>

            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 border shadow-xs transition-colors",
                status.bgColor,
                status.borderColor,
              )}
            >
              <div
                className={cn(
                  "size-1.5 rounded-full animate-pulse",
                  status.color,
                )}
              />
              <span className={cn("text-[10px] font-bold", status.textColor)}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
