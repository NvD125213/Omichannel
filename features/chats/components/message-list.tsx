"use client";

import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale/vi";
import {
  AlertTriangle,
  ChevronDown,
  CheckCheck,
  Copy,
  Loader2,
  MoreVertical,
  Paperclip,
  RefreshCw,
  Reply,
  SmilePlus,
  Trash2,
  User2,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquareOff } from "lucide-react";
import { EmptyData } from "@/components/empty-data";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  useListTenantConversationMessages,
  useDeleteTenantConversationMessage,
  chatwootOmniKeys,
} from "@/hooks/chatwoot/use-chatwoot";
import type { ListTenantConversationMessagesResponse } from "@/services/chatwoot/interface";
import type { ChatMessage, ChatUser, PendingMessage, ReplyDraft } from "../utils/types";
import { coerceToDate, getTime } from "@/helpers/format-message-time";
import { MessageAttachment } from "./message-attachment";

const coerceMessageRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

const extractTenantMessagePayload = (
  res: ListTenantConversationMessagesResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const data = res?.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const flatPayload = coerceMessageRecords(data.payload);
  if (flatPayload) return flatPayload;

  const nested = data.data as Record<string, unknown> | undefined;
  const nestedPayload = coerceMessageRecords(nested?.payload);
  if (nestedPayload) return nestedPayload;

  const chatwoot = data.chatwoot as Record<string, unknown> | undefined;
  const chatwootPayloadDirect = coerceMessageRecords(chatwoot?.payload);
  if (chatwootPayloadDirect) return chatwootPayloadDirect;
  const chatwootData = chatwoot?.data as Record<string, unknown> | undefined;
  const chatwootPayload = coerceMessageRecords(chatwootData?.payload);
  if (chatwootPayload) return chatwootPayload;

  const messagesPayload = coerceMessageRecords(data.messages);
  if (messagesPayload) return messagesPayload;

  return null;
};

const removeMessageFromPayload = (
  payload: unknown,
  messageId: string,
): unknown => {
  if (!Array.isArray(payload)) return payload;
  return payload.filter((item) => {
    if (!item || typeof item !== "object") return true;
    const rawId = (item as Record<string, unknown>).id;
    return String(rawId ?? "") !== messageId;
  });
};

const isDeletedMessage = (message: ChatMessage) => {
  if (!message || typeof message !== "object") return false;
  const contentAttributes = message.content_attributes;
  const deletedFlag =
    contentAttributes &&
    typeof contentAttributes === "object" &&
    (contentAttributes as Record<string, unknown>).deleted === true;
  return deletedFlag;
};

const normalizeMessage = (
  message: Record<string, unknown>,
  currentConversationId: string,
  /** Chỉ dùng khi API thiếu id — ổn định theo payload, không dùng Math.random() */
  syntheticSeq?: number,
): ChatMessage => {
  const sender = (message.sender ?? {}) as Record<string, unknown>;
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  return {
    id:
      typeof message.id === "number" || typeof message.id === "string"
        ? String(message.id)
        : `msg-${currentConversationId}-noid-${syntheticSeq ?? 0}-${String(message.created_at ?? message.updated_at ?? "")}`,
    content:
      (typeof message.content === "string" && message.content) ||
      (typeof message.processed_message_content === "string" &&
        message.processed_message_content) ||
      "",
    created_at: String(coerceToDate(message.created_at ?? message.updated_at)),
    updated_at: String(coerceToDate(message.updated_at ?? message.created_at)),
    conversation_id:
      typeof message.conversation_id === "number" ||
      typeof message.conversation_id === "string"
        ? String(message.conversation_id)
        : currentConversationId,
    message_type:
      typeof message.message_type === "number"
        ? message.message_type
        : undefined,
    content_attributes:
      message.content_attributes &&
      typeof message.content_attributes === "object" &&
      !Array.isArray(message.content_attributes)
        ? (message.content_attributes as Record<string, unknown>)
        : undefined,
    sender_id:
      typeof message.sender_id === "number" ||
      typeof message.sender_id === "string"
        ? String(message.sender_id)
        : typeof sender.id === "number"
          ? String(sender.id)
          : undefined,
    sender: {
      id: 1,
      name: typeof sender.name === "string" ? sender.name : undefined,
      available_name:
        typeof sender.available_name === "string"
          ? sender.available_name
          : undefined,
      avatar_url:
        typeof sender.avatar_url === "string" ? sender.avatar_url : undefined,
      type: typeof sender.type === "string" ? sender.type : undefined,
      availability_status:
        typeof sender.availability_status === "string"
          ? sender.availability_status
          : undefined,
      thumbnail:
        typeof sender.thumbnail === "string" ? sender.thumbnail : undefined,
    },
    attachments: attachments
      .map((attachment) => {
        const item =
          attachment && typeof attachment === "object"
            ? (attachment as Record<string, unknown>)
            : {};
        return {
          id:
            typeof item.id === "number" || typeof item.id === "string"
              ? String(item.id)
              : undefined,
          message_id:
            typeof item.message_id === "number" ||
            typeof item.message_id === "string"
              ? String(item.message_id)
              : undefined,
          file_type:
            typeof item.file_type === "string" ? item.file_type : undefined,
          extension:
            typeof item.extension === "string" ? item.extension : undefined,
          data_url:
            typeof item.data_url === "string" ? item.data_url : undefined,
          thumb_url:
            typeof item.thumb_url === "string" ? item.thumb_url : undefined,
          file_size:
            typeof item.file_size === "number" ? item.file_size : undefined,
          width: typeof item.width === "number" ? item.width : undefined,
          height: typeof item.height === "number" ? item.height : undefined,
        };
      }) as ChatMessage["attachments"],
  };
};

const getAvatarInitials = (name?: string) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

interface MessageListProps {
  messages: ChatMessage[];
  users: ChatUser[];
  currentUserId?: string;
  tenantId?: string;
  conversationId?: string | null;
  onReplyToMessage?: (draft: ReplyDraft) => void;
  /** Tin nhắn đang gửi / thất bại (optimistic UI) */
  pendingMessages?: PendingMessage[];
}

export function MessageList({
  messages,
  users,
  currentUserId = "current-user",
  tenantId = "",
  conversationId = null,
  onReplyToMessage,
  pendingMessages = [],
}: MessageListProps) {
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const previousPendingCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const pendingPrependScrollAdjustmentRef = useRef<{
    element: HTMLDivElement;
    previousScrollHeight: number;
    previousScrollTop: number;
  } | null>(null);
  const [showBackToLatestButton, setShowBackToLatestButton] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState<{
    id: string;
    isCustomer: boolean;
  } | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousConversationRef = useRef<string | null>(conversationId);
  const prependLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const SCROLL_TOP_THRESHOLD = 10;
  const PREPEND_LOAD_DEBOUNCE_MS = 120;
  const SHOW_BACK_TO_LATEST_THRESHOLD = 140;

  const {
    data: tenantMessagesResponse,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
  } = useListTenantConversationMessages(
    tenantId,
    conversationId ?? "",
    undefined,
  );

  const loadOlderGuardRef = useRef({
    hasNextPage: false,
    isFetchingNextPage: false,
  });
  loadOlderGuardRef.current = { hasNextPage, isFetchingNextPage };

  const {
    mutate: deleteTenantConversationMessage,
    isPending: isDeletingMessage,
  } = useDeleteTenantConversationMessage();

  const apiMessages = useMemo(() => {
    if (!conversationId) return [];
    const pages = tenantMessagesResponse?.pages ?? [];
    if (pages.length === 0) return [];

    const compareTimeThenId = (a: ChatMessage, b: ChatMessage) => {
      const diff = getTime(a.created_at) - getTime(b.created_at);
      if (diff !== 0) return diff;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    };

    let syntheticSeq = 0;
    const chronological: ChatMessage[] = [];
    const seenIds = new Set<string>();

    for (let i = pages.length - 1; i >= 0; i -= 1) {
      const raw = extractTenantMessagePayload(pages[i]) ?? [];
      const batch = raw.map((message) =>
        normalizeMessage(
          message as Record<string, unknown>,
          conversationId,
          syntheticSeq++,
        ),
      );
      batch.sort(compareTimeThenId);
      for (const m of batch) {
        const id = String(m.id ?? "");
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        chronological.push(m);
      }
    }

    return chronological;
  }, [tenantMessagesResponse, conversationId]);

  const resolvedMessages = useMemo(() => {
    if (apiMessages.length === 0) return messages;
    if (messages.length === 0) return apiMessages;

    // Local/optimistic trước, API sau: cùng id thì tin từ server (trang mới / before mới) phải thắng,
    // tránh Zustand hoặc mock props ghi đè nội dung đã cập nhật từ API.
    const merged = new Map<string, ChatMessage>();
    for (const message of messages) {
      merged.set(
        String(
          message.id ??
            `local-${message.conversation_id ?? ""}-${message.created_at ?? message.updated_at ?? message.content ?? ""}`,
        ),
        message,
      );
    }
    for (const message of apiMessages) {
      merged.set(String(message.id ?? ""), message);
    }
    return Array.from(merged.values()).sort((a, b) => {
      const diff = getTime(a.created_at) - getTime(b.created_at);
      if (diff !== 0) return diff;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });
  }, [apiMessages, messages]);

  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of resolvedMessages) {
      if (m.id) map.set(String(m.id), m);
    }
    return map;
  }, [resolvedMessages]);

  useEffect(() => {
    if (conversationId !== previousConversationRef.current) {
      isInitialLoadRef.current = true;
      previousConversationRef.current = conversationId;
      previousLastMessageIdRef.current = null;
      previousPendingCountRef.current = 0;
      pendingPrependScrollAdjustmentRef.current = null;
      if (prependLoadTimeoutRef.current) {
        clearTimeout(prependLoadTimeoutRef.current);
        prependLoadTimeoutRef.current = null;
      }
      setShowBackToLatestButton(false);
      setDeletedMessageIds(new Set());
      setPendingDeleteMessage(null);
    }
  }, [conversationId]);

  useEffect(
    () => () => {
      if (prependLoadTimeoutRef.current) {
        clearTimeout(prependLoadTimeoutRef.current);
        prependLoadTimeoutRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (resolvedMessages.length === 0) return;

    const latestMessage = resolvedMessages[resolvedMessages.length - 1];
    const latestMessageId = String(
      latestMessage.id ??
        `latest-${latestMessage.conversation_id ?? ""}-${latestMessage.created_at ?? latestMessage.updated_at ?? latestMessage.content ?? ""}`,
    );

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousMessageCountRef.current = resolvedMessages.length;
      previousLastMessageIdRef.current = latestMessageId;
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
      return;
    }

    const hasNewMessage =
      resolvedMessages.length > previousMessageCountRef.current &&
      previousLastMessageIdRef.current !== latestMessageId;

    if (hasNewMessage) {
      // Đọc vị trí DOM thực tế ngay lúc này — không dùng ref stale từ lần scroll cũ
      requestAnimationFrame(() => {
        const vp = getViewport();
        if (!vp) {
          scrollToBottom("smooth");
          return;
        }
        const distanceToBottom =
          vp.scrollHeight - (vp.scrollTop + vp.clientHeight);
        const nearBottom = distanceToBottom <= SHOW_BACK_TO_LATEST_THRESHOLD;

        // Đồng bộ lại ref và button cho nhất quán
        isNearBottomRef.current = nearBottom;
        setShowBackToLatestButton(!nearBottom);

        if (nearBottom) {
          scrollToBottom("smooth");
        }
      });
    }

    previousMessageCountRef.current = resolvedMessages.length;
    previousLastMessageIdRef.current = latestMessageId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMessages]);

  useEffect(() => {
    const pendingInConversation = pendingMessages.filter(
      (pm) => pm.conversationId === conversationId,
    );
    const currentPendingCount = pendingInConversation.length;
    const hasNewPending = currentPendingCount > previousPendingCountRef.current;

    if (hasNewPending) {
      // Người dùng vừa gửi tin (optimistic) => luôn kéo xuống tin vừa gửi.
      requestAnimationFrame(() => {
        const vp = getViewport();
        if (vp) {
          vp.scrollTo({ top: vp.scrollHeight, behavior: "smooth" });
        } else {
          bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
        isNearBottomRef.current = true;
        setShowBackToLatestButton(false);
      });
    }

    previousPendingCountRef.current = currentPendingCount;
  }, [conversationId, pendingMessages]);

  useEffect(() => {
    if (isFetchingNextPage) return;
    const pendingState = pendingPrependScrollAdjustmentRef.current;
    if (!pendingState) return;

    pendingPrependScrollAdjustmentRef.current = null;

    let cancelled = false;
    const applyScrollAnchor = () => {
      if (cancelled || !pendingState.element.isConnected) return;
      const nextScrollHeight = pendingState.element.scrollHeight;
      const heightDelta = nextScrollHeight - pendingState.previousScrollHeight;
      pendingState.element.scrollTop =
        pendingState.previousScrollTop + heightDelta;
    };

    const outerRaf = requestAnimationFrame(() => {
      requestAnimationFrame(applyScrollAnchor);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRaf);
    };
  }, [isFetchingNextPage, resolvedMessages]);

  const handleScrollCapture = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLDivElement)) return;
    scrollViewportRef.current = target;
    const distanceToBottom =
      target.scrollHeight - (target.scrollTop + target.clientHeight);
    isNearBottomRef.current = distanceToBottom <= SHOW_BACK_TO_LATEST_THRESHOLD;
    setShowBackToLatestButton(distanceToBottom > SHOW_BACK_TO_LATEST_THRESHOLD);

    if (target.scrollTop > SCROLL_TOP_THRESHOLD) {
      if (prependLoadTimeoutRef.current) {
        clearTimeout(prependLoadTimeoutRef.current);
        prependLoadTimeoutRef.current = null;
      }
      return;
    }

    if (!hasNextPage || isFetchingNextPage) return;
    if (prependLoadTimeoutRef.current) return;

    prependLoadTimeoutRef.current = setTimeout(() => {
      prependLoadTimeoutRef.current = null;
      const { hasNextPage: canLoad, isFetchingNextPage: fetching } =
        loadOlderGuardRef.current;
      if (!canLoad || fetching) return;
      const viewport =
        scrollViewportRef.current ?? (target.isConnected ? target : null);
      if (!viewport || !(viewport instanceof HTMLDivElement)) return;
      if (viewport.scrollTop > SCROLL_TOP_THRESHOLD) return;

      pendingPrependScrollAdjustmentRef.current = {
        element: viewport,
        previousScrollHeight: viewport.scrollHeight,
        previousScrollTop: viewport.scrollTop,
      };
      void fetchNextPage();
    }, PREPEND_LOAD_DEBOUNCE_MS);
  };

  const getViewport = (): HTMLDivElement | null => {
    if (scrollViewportRef.current?.isConnected) return scrollViewportRef.current;
    const vp = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;
    if (vp) scrollViewportRef.current = vp;
    return vp ?? null;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const vp = getViewport();
    if (vp) {
      vp.scrollTo({ top: vp.scrollHeight, behavior });
    } else {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    }
  };

  const handleBackToLatestMessage = () => {
    scrollToBottom("smooth");
    setShowBackToLatestButton(false);
    isNearBottomRef.current = true;
  };

  const getMessageSenderId = (message: ChatMessage): string => {
    if (typeof message.sender_id === "string" && message.sender_id.length > 0) {
      return message.sender_id;
    }
    if (typeof message.sender?.id === "number") {
      return String(message.sender.id);
    }
    return "unknown-user";
  };

  const getMessageTimestamp = (message: ChatMessage): string =>
    String(coerceToDate(message.created_at ?? message.updated_at));

  const getMessageContent = (message: ChatMessage): string =>
    message.content ?? message.processed_message_content ?? "";

  const getMessageId = (message: ChatMessage, index: number): string =>
    message.id ? String(message.id) : `message-${index}`;

  const getUserById = (userId: string, isOwnMessage: boolean) => {
    if (isOwnMessage) {
      return {
        id: currentUserId,
        name: "You",
        avatar: "https://github.com/shadcn.png",
        status: "online" as const,
        email: "you@example.com",
        lastSeen: new Date().toISOString(),
        role: "Developer",
        department: "Engineering",
      };
    }
    return users.find((user) => user.id === userId);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = coerceToDate(timestamp);
    if (!date) return "--";
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    if (isYesterday(date)) {
      return `Hôm qua ${format(date, "HH:mm")}`;
    }
    return format(date, "EEEE, d 'tháng' M 'năm' yyyy, HH:mm", { locale: vi });
  };

  const shouldShowName = (message: ChatMessage, index: number) => {
    const senderId = getMessageSenderId(message);
    if (senderId === currentUserId) return false;
    if (index === 0) return true;

    const prevMessage = resolvedMessages[index - 1];
    return getMessageSenderId(prevMessage) !== senderId;
  };

  const isConsecutiveMessage = (message: ChatMessage, index: number) => {
    if (index === 0) return false;

    const prevMessage = resolvedMessages[index - 1];
    const timeDiff =
      new Date(getMessageTimestamp(message)).getTime() -
      new Date(getMessageTimestamp(prevMessage)).getTime();

    return (
      getMessageSenderId(prevMessage) === getMessageSenderId(message) &&
      timeDiff < 5 * 60 * 1000
    );
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(`${dateString}T12:00:00`);
    if (isToday(date)) {
      return "Hôm nay";
    }
    if (isYesterday(date)) {
      return "Hôm qua";
    }
    return format(date, "EEEE, d 'tháng' M 'năm' yyyy", { locale: vi });
  };

  const requestDeleteMessage = (
    messageId: string,
    isCustomerMessageToDelete: boolean,
  ) => {
    if (!tenantId.trim() || !conversationId?.trim() || !messageId.trim())
      return;
    setPendingDeleteMessage({
      id: messageId,
      isCustomer: isCustomerMessageToDelete,
    });
  };

  const handleConfirmDeleteMessage = () => {
    if (
      !pendingDeleteMessage ||
      !tenantId.trim() ||
      !conversationId?.trim() ||
      !pendingDeleteMessage.id.trim()
    ) {
      return;
    }

    const messageId = pendingDeleteMessage.id;
    setDeletedMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });

    deleteTenantConversationMessage(
      {
        tenantId,
        conversationId,
        messageId: pendingDeleteMessage.id,
      },
      {
        onSuccess: () => {
          setPendingDeleteMessage(null);
          queryClient.setQueriesData(
            {
              queryKey: chatwootOmniKeys.tenantConversationMessages(
                tenantId,
                conversationId,
              ),
            },
            (oldData: unknown) => {
              if (!oldData || typeof oldData !== "object") return oldData;
              const data = oldData as {
                pages?: Array<{
                  data?: Record<string, unknown>;
                }>;
              };
              if (!Array.isArray(data.pages)) return oldData;

              return {
                ...data,
                pages: data.pages.map((page) => {
                  const pageData = page?.data;
                  if (!pageData || typeof pageData !== "object") return page;

                  const nextPageData = { ...pageData };
                  nextPageData.payload = removeMessageFromPayload(
                    nextPageData.payload,
                    messageId,
                  );

                  const nestedData =
                    nextPageData.data &&
                    typeof nextPageData.data === "object" &&
                    !Array.isArray(nextPageData.data)
                      ? { ...(nextPageData.data as Record<string, unknown>) }
                      : null;
                  if (nestedData) {
                    nestedData.payload = removeMessageFromPayload(
                      nestedData.payload,
                      messageId,
                    );
                    nextPageData.data = nestedData;
                  }

                  const chatwootData =
                    nextPageData.chatwoot &&
                    typeof nextPageData.chatwoot === "object" &&
                    !Array.isArray(nextPageData.chatwoot)
                      ? {
                          ...(nextPageData.chatwoot as Record<string, unknown>),
                        }
                      : null;
                  if (chatwootData) {
                    chatwootData.payload = removeMessageFromPayload(
                      chatwootData.payload,
                      messageId,
                    );

                    const chatwootNestedData =
                      chatwootData.data &&
                      typeof chatwootData.data === "object" &&
                      !Array.isArray(chatwootData.data)
                        ? { ...(chatwootData.data as Record<string, unknown>) }
                        : null;
                    if (chatwootNestedData) {
                      chatwootNestedData.payload = removeMessageFromPayload(
                        chatwootNestedData.payload,
                        messageId,
                      );
                      chatwootData.data = chatwootNestedData;
                    }

                    nextPageData.chatwoot = chatwootData;
                  }

                  nextPageData.messages = removeMessageFromPayload(
                    nextPageData.messages,
                    messageId,
                  );

                  return {
                    ...page,
                    data: nextPageData,
                  };
                }),
              };
            },
          );

          queryClient.invalidateQueries({
            queryKey: chatwootOmniKeys.tenantConversation(
              tenantId,
              conversationId,
            ),
          });
        },
        onError: () => {
          setDeletedMessageIds((prev) => {
            const next = new Set(prev);
            next.delete(messageId);
            return next;
          });
        },
      },
    );
  };

  if (isLoadingMessages && resolvedMessages.length === 0) {
    return (
      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin opacity-40" />
          <p className="text-sm">Đang tải tin nhắn…</p>
        </div>
      </div>
    );
  }

  const activePending = pendingMessages.filter(
    (pm) => pm.conversationId === conversationId,
  );

  if (!isLoadingMessages && resolvedMessages.length === 0 && activePending.length === 0) {
    return (
      <div className="relative flex-1 min-h-0">
        <EmptyData
          icon={MessageSquareOff}
          title="Chưa có tin nhắn"
          description="Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên."
          showButton={false}
          className="h-full"
        />
      </div>
    );
  }

  // Khi chưa có API messages nhưng có pending, vẫn hiển thị khung list
  const showEmptyShell = !isLoadingMessages && resolvedMessages.length === 0 && activePending.length > 0;

  return (
    <div className="relative flex-1 min-h-0">
      <ScrollArea
        className="h-full overflow-auto"
        ref={scrollAreaRef}
        onScrollCapture={!showEmptyShell ? handleScrollCapture : undefined}
      >
        <div className="flex min-w-0 flex-col gap-3 px-4 py-4">
          {isFetchingNextPage && conversationId ? (
            <div
              className="flex shrink-0 justify-center py-1"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Loader2
                  className="size-3.5 animate-spin shrink-0"
                  aria-hidden
                />
                <span>Đang tải tin nhắn cũ…</span>
              </div>
            </div>
          ) : null}
          {resolvedMessages.map((message, globalIndex) => {
            const messageDateKey = format(
              new Date(getMessageTimestamp(message)),
              "yyyy-MM-dd",
            );
            const prevMessage =
              globalIndex > 0 ? resolvedMessages[globalIndex - 1] : null;
            const prevDateKey = prevMessage
              ? format(new Date(getMessageTimestamp(prevMessage)), "yyyy-MM-dd")
              : null;
            const showDaySeparator = prevDateKey !== messageDateKey;

            const messageId = getMessageId(message, globalIndex);
            const isDeletedByPayload = isDeletedMessage(message);
            const isDeleted =
              isDeletedByPayload || deletedMessageIds.has(messageId);
            const isSystemMessage = message.message_type === 2;

            if (isSystemMessage) {
              return (
                <Fragment key={messageId}>
                  {showDaySeparator && (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
                        {formatDateHeader(messageDateKey)}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center py-1">
                    <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {getMessageContent(message) || "Thông báo hệ thống"}
                    </div>
                  </div>
                </Fragment>
              );
            }

            const senderId = getMessageSenderId(message);
            const isCustomerMessage = message.sender?.type !== "user";
            const isOwnMessage =
              message.sender?.type === "user" || senderId === currentUserId;
            const user = getUserById(senderId, isOwnMessage);
            const avatarName =
              user?.name ??
              message.sender?.available_name ??
              message.sender?.name ??
              "Guest";
            const avatarSrc =
              message.sender?.avatar_url ??
              message.sender?.thumbnail ??
              user?.avatar;

            const showName =
              isCustomerMessage && shouldShowName(message, globalIndex);
            const isConsecutive = isConsecutiveMessage(message, globalIndex);
            const messageTimestamp = getMessageTimestamp(message);
            const messageContent = getMessageContent(message);
            const attachments = Array.isArray(message.attachments)
              ? message.attachments
              : [];

            const inReplyToRaw = message.content_attributes?.in_reply_to;
            const replyParentId =
              inReplyToRaw !== undefined && inReplyToRaw !== null
                ? String(inReplyToRaw)
                : null;
            const quotedMessage =
              replyParentId != null
                ? (messageById.get(replyParentId) ?? null)
                : null;
            const quotedSenderId = quotedMessage
              ? getMessageSenderId(quotedMessage)
              : "";
            const quotedLabel =
              quotedMessage != null
                ? (() => {
                    const qOwn = quotedSenderId === currentUserId;
                    const qu = getUserById(quotedSenderId, qOwn);
                    return (
                      qu?.name ??
                      quotedMessage.sender?.available_name ??
                      quotedMessage.sender?.name ??
                      (qOwn ? "Bạn" : "Khách")
                    );
                  })()
                : replyParentId != null
                  ? `Tin #${replyParentId}`
                  : "";
            const quotedPreview =
              quotedMessage != null
                ? getMessageContent(quotedMessage).trim() ||
                  (quotedMessage.attachments?.length ? "Đính kèm" : "") ||
                  "(Không có nội dung)"
                : replyParentId != null
                  ? "Tải thêm tin nhắn cũ nếu chưa thấy nội dung trích dẫn."
                  : "";

            return (
              <Fragment key={messageId}>
                {showDaySeparator && (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
                      {formatDateHeader(messageDateKey)}
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "group flex w-full min-w-0 gap-3",
                    isOwnMessage && "flex-row-reverse",
                  )}
                >
                  {!isOwnMessage && (
                    <div className="w-8 shrink-0">
                      <Avatar className="size-8 cursor-pointer">
                        <AvatarImage src={avatarSrc} alt={avatarName} />
                        <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10">
                          {getAvatarInitials(avatarName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex min-w-0 w-full flex-col max-w-[min(88%,42rem)] sm:max-w-[min(80%,42rem)]",
                      isOwnMessage && "ml-auto items-end",
                    )}
                  >
                    {showName && user && isCustomerMessage && (
                      <div className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                        <User2 className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{user.name}</span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "group/message flex min-w-0 w-full flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center",
                        isOwnMessage
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      {!isDeleted && (
                        <div
                          className={cn(
                            "flex shrink-0 items-center gap-1 opacity-0 transition-all duration-200 pointer-events-none group-hover/message:opacity-100 group-hover/message:pointer-events-auto",
                            isOwnMessage ? "order-1 mr-2" : "order-2 ml-2",
                          )}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full bg-background/95 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                          >
                            <SmilePlus className="size-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full bg-background/95 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align={isOwnMessage ? "start" : "end"}
                            >
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={!onReplyToMessage}
                                onClick={() =>
                                  onReplyToMessage?.({
                                    messageId,
                                    preview:
                                      messageContent.trim().slice(0, 280) ||
                                      (attachments.length > 0
                                        ? "Đính kèm"
                                        : ""),
                                    senderLabel: avatarName,
                                  })
                                }
                              >
                                <Reply className="size-4" />
                                Phản hồi
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Copy className="size-4" />
                                Sao chép tin nhắn
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                disabled={isDeletingMessage}
                                onClick={() =>
                                  requestDeleteMessage(
                                    messageId,
                                    isCustomerMessage,
                                  )
                                }
                              >
                                <Trash2 className="size-4 text-destructive" />
                                Xóa tin nhắn
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      <div
                        className={cn(
                          "min-w-0 w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap wrap-anywhere",
                          isOwnMessage ? "order-2" : "order-1",
                          isDeleted
                            ? "bg-muted/60 text-muted-foreground italic"
                            : isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-md ml-auto"
                              : "bg-muted rounded-bl-md",
                          isConsecutive && "mt-1",
                        )}
                      >
                        {replyParentId && !isDeleted && (
                          <div
                            className={cn(
                              "mb-2 flex min-w-0 gap-2 rounded-md px-2 py-1.5 text-left",
                              isOwnMessage
                                ? "bg-primary-foreground/15 border-l-4 border-primary-foreground/40"
                                : "border-l-4 border-primary bg-black/4 dark:bg-white/6",
                            )}
                          >
                            <Reply className="mt-0.5 size-3.5 shrink-0 opacity-80" />
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "truncate text-xs font-semibold",
                                  isOwnMessage
                                    ? "text-primary-foreground"
                                    : "text-foreground",
                                )}
                              >
                                {quotedLabel}
                              </p>
                              <p
                                className={cn(
                                  "line-clamp-2 text-xs",
                                  isOwnMessage
                                    ? "text-primary-foreground/90"
                                    : "text-muted-foreground",
                                )}
                              >
                                {quotedPreview}
                              </p>
                            </div>
                          </div>
                        )}

                        {isDeleted ? (
                          <p>Tin nhắn đã bị xóa</p>
                        ) : messageContent?.trim() ? (
                          <p>{messageContent.trim()}</p>
                        ) : null}

                        {attachments.length > 0 && !isDeleted && (
                          <div
                            className={cn(
                              "flex max-w-full flex-wrap gap-2",
                              messageContent?.trim() ? "mt-2" : "",
                            )}
                          >
                            {attachments.map((attachment, attachmentIndex) => (
                              <MessageAttachment
                                key={`${messageId}-attachment-${attachment.id ?? attachmentIndex}`}
                                attachment={attachment}
                                isOwnMessage={isOwnMessage}
                              />
                            ))}
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isOwnMessage
                              ? "text-primary-foreground/70 justify-end"
                              : "text-muted-foreground",
                          )}
                        >
                          <span>{formatMessageTime(messageTimestamp)}</span>
                          {isOwnMessage && (
                            <div className="flex">
                              <CheckCheck className="size-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}

          {/* ── Optimistic / pending messages ─────────────────────────────── */}
          {pendingMessages
            .filter((pm) => pm.conversationId === conversationId)
            .map((pm) => {
              const isFailed = pm.status === "failed";
              return (
                <div key={pm.id} className="flex gap-3 flex-row-reverse">
                  <div className="ml-auto flex min-w-0 w-full max-w-[min(88%,42rem)] flex-col items-end sm:max-w-[min(80%,42rem)]">
                    <div
                      className={cn(
                        "min-w-0 max-w-full rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere",
                        isFailed
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {pm.content ? <p>{pm.content}</p> : null}
                      {pm.filesCount > 0 && (
                        <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
                          <Paperclip className="size-3" />
                          <span>{pm.filesCount} tệp đính kèm</span>
                        </div>
                      )}
                    </div>

                    {isFailed ? (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="size-3 text-destructive" />
                        <span className="text-destructive">Gửi thất bại</span>
                        {pm.retry && (
                          <button
                            type="button"
                            onClick={() => void pm.retry?.()}
                            className="ml-1 flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            <RefreshCw className="size-3" />
                            Thử lại
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {showBackToLatestButton && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleBackToLatestMessage}
          className="absolute bottom-4 right-4 z-20 gap-1.5 rounded-full shadow-md"
        >
          <ChevronDown className="size-4" />
          Trở lại
        </Button>
      )}
      <ConfirmDialog
        open={Boolean(pendingDeleteMessage)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMessage(null);
        }}
        title="Xác nhận xóa tin nhắn"
        description={
          pendingDeleteMessage?.isCustomer
            ? "Tin nhắn khách sẽ bị xóa ở phía bạn và không thể khôi phục. Bạn vẫn muốn tiếp tục xóa tin nhắn này?"
            : "Tin nhắn sẽ bị xóa và không thể khôi phục. Bạn vẫn muốn tiếp tục xóa tin nhắn này?"
        }
        confirmText="Xóa tin nhắn"
        cancelText="Hủy"
        confirmVariant="destructive"
        loading={isDeletingMessage}
        onConfirm={handleConfirmDeleteMessage}
      />
    </div>
  );
}
