"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  BellOff,
  MoreVertical,
  Search,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useToggleTenantConversationStatus } from "@/hooks/chatwoot/use-chatwoot";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatUser } from "../utils/types";
import {
  CHAT_CONVERSATION_STATUS_OPTIONS,
  conversationStatusBadgeStyle,
} from "../utils/conversation-filter";

type ConversationStatusValue = "open" | "pending" | "resolved";

const CONVERSATION_STATUS_OPTIONS = CHAT_CONVERSATION_STATUS_OPTIONS.filter(
  (option) => option.value !== "all" && option.value !== "snoozed",
);

const getConversationStatusValue = (
  status?: string,
): ConversationStatusValue => {
  if (status === "open" || status === "pending" || status === "resolved") {
    return status;
  }
  return "open";
};

function getAvatarInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ChatHeaderProps {
  conversation: ChatConversation | null;
  users: ChatUser[];
  onToggleMute?: () => void;
  onToggleInfo?: () => void;
}

export function ChatHeader({
  conversation,
  users,
  onToggleMute,
}: ChatHeaderProps) {
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const { mutate: toggleConversationStatus, isPending: isTogglingStatus } =
    useToggleTenantConversationStatus();

  const conversationStatus: ConversationStatusValue =
    getConversationStatusValue(conversation?.status);

  const handleStatusChange = (value: ConversationStatusValue) => {
    if (!conversation || !tenantId || value === conversationStatus) return;

    toggleConversationStatus({
      tenantId,
      conversationId: conversation.id,
      data: {
        status: value,
        snoozed_until: null,
      },
    });
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="size-4" />
          Lựa chọn một cuộc hội thoại để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  const getConversationUsers = () =>
    users.filter((userItem) => conversation.participants.includes(userItem.id));

  const conversationUsers = getConversationUsers();
  const primaryUser = conversationUsers[0];

  const getStatusText = () => {
    if (conversation.type === "group") {
      const onlineCount = conversationUsers.filter(
        (userItem) => userItem.status === "online",
      ).length;
      return `${conversation.participants.length} thành viên, ${onlineCount} trực tuyến`;
    }

    if (primaryUser) {
      switch (primaryUser.status) {
        case "online":
          return "Đang hoạt động";
        case "away":
          return "Vắng mặt";
        case "offline":
          return `Hoạt động lần cuối ${new Date(primaryUser.lastSeen).toLocaleDateString("vi-VN")}`;
        default:
          return "";
      }
    }

    return "";
  };

  const getStatusColor = () => {
    if (conversation.type === "group") return "text-muted-foreground";

    switch (primaryUser?.status) {
      case "online":
        return "text-green-600 dark:text-green-400";
      case "away":
        return "text-amber-600 dark:text-amber-400";
      case "offline":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const avatarInitials =
    conversation.type === "group" ? null : getAvatarInitials(conversation.name);
  const hasAvatarImage = Boolean(conversation.avatar?.trim());

  return (
    <div className="flex h-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={`Xem ảnh đại diện của ${conversation.name}`}
          onClick={() => setIsAvatarPreviewOpen(true)}
          className="rounded-full outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>
              {conversation.type === "group" ? (
                <Users className="size-5" />
              ) : (
                avatarInitials
              )}
            </AvatarFallback>
          </Avatar>
        </button>

        <Dialog
          open={isAvatarPreviewOpen}
          onOpenChange={setIsAvatarPreviewOpen}
        >
          <DialogContent
            showCloseButton
            className="max-w-fit gap-0 border-0 bg-transparent p-0 shadow-none sm:max-w-fit"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Ảnh đại diện — {conversation.name}</DialogTitle>
              <DialogDescription>
                Xem ảnh đại diện của cuộc hội thoại
              </DialogDescription>
            </DialogHeader>

            <div className="relative size-80 overflow-hidden sm:size-96">
              {hasAvatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                  {conversation.type === "group" ? (
                    <Users className="size-24" aria-hidden="true" />
                  ) : (
                    <span className="text-6xl font-semibold tracking-tight">
                      {avatarInitials}
                    </span>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{conversation.name}</h2>
            {conversation.isMuted && (
              <BellOff className="size-4 text-muted-foreground" />
            )}
            {conversation.type === "group" && (
              <Badge variant="secondary" className="cursor-pointer text-xs">
                Nhóm
              </Badge>
            )}
          </div>
          <p className={cn("text-sm", getStatusColor())}>{getStatusText()}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Select
          value={conversationStatus}
          onValueChange={(value) =>
            handleStatusChange(value as ConversationStatusValue)
          }
          disabled={!tenantId || isTogglingStatus}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-43 border bg-transparent text-xs dark:bg-transparent",
              conversationStatusBadgeStyle(conversationStatus).text,
              conversationStatusBadgeStyle(conversationStatus).border,
            )}
          >
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent align="end">
            {CONVERSATION_STATUS_OPTIONS.map((option) => {
              const style = conversationStatusBadgeStyle(option.value);
              return (
                <SelectItem key={option.value} value={option.value}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn("size-1.5 rounded-full", style.dot)}
                      aria-hidden
                    />
                    <span className={style.text}>{option.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onToggleMute} className="cursor-pointer">
              {conversation.isMuted ? (
                <>
                  <Bell className="mr-2 size-4" />
                  Bật thông báo
                </>
              ) : (
                <>
                  <BellOff className="mr-2 size-4" />
                  Tắt thông báo
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Search className="mr-2 size-4" />
              Tìm kiếm tin nhắn
            </DropdownMenuItem>
            {conversation.type === "group" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="mr-2 size-4" />
                  Quản lý thành viên
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Xóa cuộc hội thoại
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
