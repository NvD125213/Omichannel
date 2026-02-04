"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Grip,
  Clock,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  PauseCircle,
  HelpCircle,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { createElement } from "react";
import type { Ticket } from "../utils/ticket-schema";
import { convertDateTime } from "@/utils/convert-time";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TicketKanbanCardProps {
  ticket?: Ticket;
  isLoading?: boolean;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (id: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":
    case "mở":
      return Circle;
    case "pending":
    case "đang chờ":
      return Clock;
    case "in_progress":
    case "đang xử lý":
      return Loader2;
    case "resolved":
    case "đã giải quyết":
      return CheckCircle2;
    case "closed":
    case "đóng":
      return XCircle;
    case "cancelled":
    case "đã hủy":
      return Ban;
    case "on_hold":
    case "tạm hoãn":
      return PauseCircle;
    default:
      return HelpCircle;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":
    case "mở":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "pending":
    case "đang chờ":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "in_progress":
    case "đang xử lý":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "resolved":
    case "đã giải quyết":
      return "text-green-600 bg-green-50 border-green-200";
    case "closed":
    case "đóng":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "cancelled":
    case "đã hủy":
      return "text-red-600 bg-red-50 border-red-200";
    case "on_hold":
    case "tạm hoãn":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
    case "thấp":
      return "text-blue-700 bg-blue-100 border-blue-200";
    case "medium":
    case "trung bình":
      return "text-cyan-700 bg-cyan-100 border-cyan-200";
    case "high":
    case "cao":
      return "text-orange-700 bg-orange-100 border-orange-200";
    case "urgent":
    case "khẩn cấp":
      return "text-red-700 bg-red-100 border-red-200";
    case "critical":
    case "nghiêm trọng":
      return "text-purple-600 bg-purple-600 border-purple-700 animate-pulse";
    default:
      return "text-gray-700 bg-gray-100 border-gray-200";
  }
};

const tagColors: Record<string, string> = {
  red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  green:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  purple:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  orange:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  pink: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  indigo:
    "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  default: "bg-muted text-muted-foreground border-border",
};

const getStatusName = (status: string) => {
  switch (status?.toLowerCase()) {
    case "new":
    case "mới":
      return "Mới";
    case "open":
    case "đang mở":
      return "Đang mở";
    case "pending":
    case "đang chờ":
      return "Đang chờ";
    case "on hold":
    case "tạm dừng":
      return "Tạm dừng";
    case "resolved":
    case "đã giải quyết":
      return "Đã giải quyết";
    case "closed":
    case "đã đóng":
      return "Đã đóng";
    case "cancelled":
    case "đã hủy":
      return "Đã hủy";
    default:
      return status;
  }
};

export function TicketKanbanCard({
  ticket,
  isLoading,
  onEditTicket,
  onDeleteTicket,
}: TicketKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket?.id || ticket?.code || "temp-id",
    data: {
      type: "ticket",
      ticket,
      priority: ticket?.priority,
    },
    disabled: isLoading || !ticket,
  });

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </Card>
    );
  }

  if (!ticket) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";
  };

  const statusColorClass = getStatusColor(ticket.status);
  const priorityColorClass = getPriorityColor(ticket.priority);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab overflow-hidden border-none py-3 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5",
        isDragging &&
          "opacity-50 ring-2 ring-primary shadow-2xl scale-105 z-50",
        "bg-white dark:bg-zinc-900",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 transition-colors",
          priorityColorClass.split(" ")[1].replace("bg-", "bg-"),
        )}
      />

      <CardContent className="space-y-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-2 pb-1">
              <span className="text-[10px] uppercase text-muted-foreground">
                #{ticket.code}
              </span>
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-1 py-0.5 border shadow-xs transition-colors",
                  statusColorClass,
                )}
              >
                {createElement(getStatusIcon(ticket.status), {
                  className: "size-3",
                })}
                <span className="text-[10px] font-bold">
                  {getStatusName(ticket.status)}
                </span>
              </div>
            </div>

            <h4
              className="text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-primary cursor-pointer transition-colors"
              title={ticket.title}
              onClick={() => onEditTicket?.(ticket)}
            >
              {ticket.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 shrink-0 pl-2">
            <button
              {...attributes}
              {...listeners}
              className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 rounded cursor-grab active:cursor-grabbing touch-none transition-colors"
              title="Kéo để di chuyển (Drag to move)"
            >
              <Grip className="size-4" />
            </button>
          </div>
        </div>

        {ticket.description && (
          <p
            className="text-zinc-500 line-clamp-2 text-xs leading-relaxed"
            title={ticket.description}
          >
            {ticket.description}
          </p>
        )}

        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ticket.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-[10px] font-medium border h-5",
                  tagColors[tag.color || "default"]
                    ? tagColors[tag.color || "default"]
                    : "text-white border-transparent",
                )}
                style={
                  !tagColors[tag.color || "default"] && tag.color
                    ? { backgroundColor: tag.color }
                    : {}
                }
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" title="Người tạo">
              <User className="size-3 text-zinc-400" />

              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 leading-none mb-0.5">
                  Người tạo
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[90px] leading-none">
                  {ticket.created_by_name || "Chưa có"}
                </span>
              </div>
            </div>
          </div>
          {ticket.created_at && (
            <div className="text-[10px] text-zinc-400" title="Ngày tạo">
              {convertDateTime(ticket.created_at, "short").datetime}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2" title="Người được giao">
            <Avatar className="size-5 border border-zinc-200 dark:border-zinc-700">
              <AvatarFallback className="text-[9px] bg-zinc-100 font-bold text-zinc-600">
                {getInitials(ticket.assigned_to_name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 leading-none mb-0.5">
                Đảm nhiệm
              </span>
              <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[90px] leading-none">
                {ticket.assigned_to_name || "Chưa có"}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Link
                  className="flex items-center cursor-pointer w-full"
                  href={`/tickets/${ticket.id || ticket.code}`}
                >
                  <Eye className="mr-2 size-4" />
                  Xem chi tiết
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditTicket?.(ticket)}>
                <Pencil className="mr-2 size-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => ticket.id && onDeleteTicket?.(ticket.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
