"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  Play,
  AlertCircle,
  Pause,
  CheckCircle,
  XCircle,
  Ban,
  HelpCircle,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Calendar,
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
      return Play;
    case "pending":
    case "đang chờ":
      return Clock;
    case "in_progress":
    case "đang xử lý":
      return AlertCircle;
    case "on_hold":
    case "tạm hoãn":
    case "tạm dừng":
      return Pause;
    case "resolved":
    case "đã giải quyết":
      return CheckCircle;
    case "closed":
    case "đóng":
      return XCircle;
    case "cancelled":
    case "đã hủy":
      return Ban;
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

const getPriorityName = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
    case "thấp":
      return "Thấp";
    case "medium":
    case "trung bình":
      return "Trung bình";
    case "high":
    case "cao":
      return "Cao";
    case "urgent":
    case "khẩn cấp":
      return "Khẩn cấp";
    case "critical":
    case "nghiêm trọng":
      return "Rất khẩn cấp";
    default:
      return priority;
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
    case "open":
    case "đang mở":
      return "Đang mở";
    case "pending":
    case "đang chờ":
      return "Đang chờ";
    case "in_progress":
    case "đang xử lý":
      return "Đang xử lý";
    case "on_hold":
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

  const priorityBarClass =
    priorityColorClass.split(" ")[1]?.replace("bg-", "bg-") || "bg-gray-400";

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={cn(
        "group relative cursor-grab overflow-hidden rounded-xl border border-border/60 bg-transparent shadow-sm transition-all hover:shadow-md hover:border-border p-1",
        isDragging &&
          "opacity-60 ring-2 ring-primary shadow-lg scale-[1.02] z-50 cursor-grabbing",
      )}
    >
      {/* Thanh màu độ ưu tiên bên trái */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-xl",
          priorityBarClass,
        )}
      />

      <CardContent className="p-3 pl-4 space-y-2.5">
        {/* Dòng 1: Mã + Badge trạng thái & ưu tiên */}
        <div className="flex items-center justify-between gap-2 min-h-0">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
            #{ticket.code}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
                statusColorClass,
              )}
            >
              {createElement(getStatusIcon(ticket.status), {
                className: "size-3 shrink-0",
              })}
              <span className="truncate max-w-[72px]">
                {getStatusName(ticket.status)}
              </span>
            </span>
            {ticket.priority && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
                  getPriorityColor(ticket.priority),
                )}
              >
                <span className="size-1.5 rounded-full bg-current shrink-0" />
                {getPriorityName(ticket.priority)}
              </span>
            )}
          </div>
        </div>

        {/* Tiêu đề */}
        <h4
          className="text-sm font-semibold text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors cursor-pointer"
          title={ticket.title}
          onClick={(e) => {
            e.stopPropagation();
            onEditTicket?.(ticket);
          }}
        >
          {ticket.title}
        </h4>

        {ticket.description && (
          <p
            className="text-muted-foreground line-clamp-2 text-xs leading-relaxed"
            title={ticket.description}
          >
            {ticket.description}
          </p>
        )}

        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  "px-1.5 py-0 text-[10px] font-medium h-5 border-0",
                  tagColors[tag.color || "default"] ??
                    "bg-muted text-white/100",
                )}
                style={
                  !tagColors[tag.color || "default"] && tag.color
                    ? { backgroundColor: tag.color }
                    : undefined
                }
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Người tạo + Ngày tạo */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-muted-foreground">
          <div className="flex items-center gap-1.5 min-w-0" title="Người tạo">
            <User className="size-3 shrink-0" />
            <span className="text-[10px] truncate">
              {ticket.created_by_name || "—"}
            </span>
          </div>
          {ticket.created_at && (
            <div className="flex items-center gap-1 shrink-0" title="Ngày tạo">
              <Calendar className="size-3" />
              <span className="text-[10px]">
                {convertDateTime(ticket.created_at, "short").datetime}
              </span>
            </div>
          )}
        </div>

        {/* Chân card: Người đảm nhiệm + Menu */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 min-w-0" title="Đảm nhiệm">
            <Avatar className="size-6 border border-border shrink-0">
              <AvatarFallback className="text-[9px] bg-muted font-medium text-muted-foreground">
                {getInitials(ticket.assigned_to_name || "")}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] font-medium text-foreground truncate">
              {ticket.assigned_to_name || "Chưa giao"}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/tickets/${ticket.id || ticket.code}`}>
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
