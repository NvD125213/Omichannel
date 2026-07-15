"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellOff, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { StringParam, useQueryParams } from "use-query-params";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatUnreadBadge } from "@/components/chat-unread-badge";
import { useAuth } from "@/contexts/auth-context";
import { useListTenantConversations } from "@/hooks/chatwoot/use-chatwoot";
import { coerceToDate } from "@/helpers/format-message-time";
import {
  formatUnreadBadgeCount,
  useChatUnreadStore,
  useTotalUnread,
} from "@/features/chats/utils/chat-unread-store";
import { cn } from "@/lib/utils";
import type { ListTenantConversationsResponse } from "@/services/chatwoot/interface";
import "./chat-unread-notifications-menu.css";

const MAX_VISIBLE_ITEMS = 6;

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

const extractPayloadFromPage = (
  page: ListTenantConversationsResponse | undefined,
): Record<string, unknown>[] | null => {
  const data = page?.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;
  const nested = coerceConversationRecords(
    (data.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nested) return nested;
  const chatwoot = data.chatwoot as Record<string, unknown> | undefined;
  const chatwootPayload = coerceConversationRecords(chatwoot?.payload);
  if (chatwootPayload) return chatwootPayload;
  const chatwootData = chatwoot?.data as Record<string, unknown> | undefined;
  return coerceConversationRecords(chatwootData?.payload);
};

const parseConversationRecord = (record: Record<string, unknown>) => {
  const id = String(record.id ?? "");
  const meta = (record.meta ?? {}) as Record<string, unknown>;
  const sender = (meta.sender ?? {}) as Record<string, unknown>;
  const lastMessage = (record.last_non_activity_message ?? {}) as Record<
    string,
    unknown
  >;

  const name =
    typeof sender.name === "string" && sender.name.length > 0
      ? sender.name
      : `Cuộc trò chuyện #${id}`;

  const avatar =
    (typeof sender.thumbnail === "string" && sender.thumbnail) ||
    (typeof sender.avatar_url === "string" && sender.avatar_url) ||
    "";

  const preview =
    (typeof lastMessage.content === "string" && lastMessage.content) ||
    (typeof record.last_activity_message === "string" &&
      record.last_activity_message) ||
    `${formatUnreadBadgeCount(
      typeof record.unread_count === "number" ? record.unread_count : 0,
    )} tin nhắn chưa đọc`;

  const timestamp = coerceToDate(
    record.last_activity_at ??
      record.timestamp ??
      record.updated_at ??
      lastMessage.created_at ??
      record.created_at,
  );

  return { id, name, avatar, preview, timestamp };
};

const formatRelativeTime = (date: Date | null) => {
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
};

const buildConversationHref = (conversationId: string) =>
  `/chats?conversation_id=${encodeURIComponent(conversationId)}`;

interface UnreadNotificationItem {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  timestamp: Date | null;
  unreadCount: number;
}

function UnreadPingDot({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn("relative flex items-center justify-center", className)}
    >
      <span
        aria-hidden
        className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"
      />
      <ChatUnreadBadge
        count={count}
        className="relative h-4 min-w-4 bg-primary px-1 text-[10px]"
      />
    </span>
  );
}

function NotificationStatusDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        aria-hidden
        className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}

function NotificationBellTrigger({
  hasUnread,
  totalUnread,
}: {
  hasUnread: boolean;
  totalUnread: number;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-9 overflow-visible text-muted-foreground transition-colors hover:text-foreground"
    >
      <BellRing className={cn("h-5 w-5", hasUnread && "chat-bell-shake")} />

      {hasUnread && (
        <UnreadPingDot
          count={totalUnread}
          className="absolute -top-0.5 -right-0.5 h-4 min-w-4"
        />
      )}

      <span className="sr-only">Mở thông báo</span>
    </Button>
  );
}

function NotificationListItem({
  notification,
  onOpenConversation,
}: {
  notification: UnreadNotificationItem;
  onOpenConversation: (conversationId: string) => void;
}) {
  const initials = notification.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenuItem
      className="cursor-pointer rounded-none px-5 py-4 focus:bg-muted/50"
      onSelect={() => {
        onOpenConversation(notification.id);
      }}
    >
      <div className="flex w-full items-start gap-3">
        <Avatar className="size-10 shrink-0">
          {notification.avatar ? (
            <AvatarImage src={notification.avatar} alt={notification.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {notification.name}
          </p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {notification.preview}
          </p>
          {notification.timestamp && (
            <p className="text-xs text-muted-foreground/80">
              {formatRelativeTime(notification.timestamp)}
            </p>
          )}
        </div>

        <NotificationStatusDot />
      </div>
    </DropdownMenuItem>
  );
}

export function ChatUnreadNotificationsMenu() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const [, setQuery] = useQueryParams({
    conversation_id: StringParam,
  });
  const totalUnread = useTotalUnread();
  const unreadEntries = useChatUnreadStore((state) => state.entries);
  const hasUnread = totalUnread > 0;

  const { data: conversationsList } = useListTenantConversations(tenantId, {
    status: "open",
    sort_by: "last_activity_at_desc",
    page: 1,
  });

  /**
   * Chat đọc conversation_id qua use-query-params (WindowHistoryAdapter).
   * Next.js <Link> chỉ cập nhật App Router, không notify adapter → lần click
   * đầu URL/loader đổi nhưng khung chat không đổi. Dùng cùng setQuery với sidebar.
   */
  const openConversation = useCallback(
    (conversationId: string) => {
      if (pathname === "/chats") {
        setQuery({ conversation_id: conversationId }, "replaceIn");
        return;
      }
      router.push(buildConversationHref(conversationId));
    },
    [pathname, router, setQuery],
  );

  const unreadNotifications = useMemo(() => {
    const conversationById = new Map<
      string,
      ReturnType<typeof parseConversationRecord>
    >();
    const pages = conversationsList?.pages ?? [];

    for (const page of pages) {
      const payload = extractPayloadFromPage(page);
      if (!payload) continue;
      for (const record of payload) {
        const parsed = parseConversationRecord(record);
        if (!parsed.id) continue;
        conversationById.set(parsed.id, parsed);
      }
    }

    const items: UnreadNotificationItem[] = [];

    for (const [id, entry] of Object.entries(unreadEntries)) {
      if (entry.unreadCount <= 0) continue;
      const conversation = conversationById.get(id);

      items.push({
        id,
        name: conversation?.name ?? `Cuộc trò chuyện #${id}`,
        avatar: conversation?.avatar ?? "",
        preview:
          conversation?.preview ??
          `${formatUnreadBadgeCount(entry.unreadCount)} tin nhắn chưa đọc`,
        timestamp: conversation?.timestamp ?? null,
        unreadCount: entry.unreadCount,
      });
    }

    return items.sort(
      (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0),
    );
  }, [conversationsList?.pages, unreadEntries]);

  const visibleNotifications = unreadNotifications.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="inline-flex">
          <NotificationBellTrigger
            hasUnread={hasUnread}
            totalUnread={totalUnread}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[22.5rem] overflow-hidden rounded-xl border border-border/60 bg-background p-0 shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-foreground">
              Thông báo
            </h3>
            {hasUnread && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {formatUnreadBadgeCount(totalUnread)} mới
              </span>
            )}
          </div>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BellOff className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Không có thông báo mới
            </p>
            <p className="text-xs text-muted-foreground">
              Tin nhắn chưa đọc sẽ hiển thị tại đây
            </p>
          </div>
        ) : (
          <div className="max-h-88 overflow-y-auto divide-y divide-border/60">
            {visibleNotifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onOpenConversation={openConversation}
              />
            ))}
          </div>
        )}

        <div className="border-t border-border/60 p-4">
          <Button
            asChild
            className="h-10 w-full rounded-lg text-sm font-medium"
          >
            <Link href="/chats">Xem tất cả thông báo</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
