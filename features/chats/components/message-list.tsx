"use client";

import { format, isToday, isYesterday } from "date-fns";
import {
  ChevronDown,
  CheckCheck,
  Copy,
  MoreVertical,
  Reply,
  SmilePlus,
  Trash2,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { cn } from "@/lib/utils";
import { useListTenantConversationMessages } from "@/hooks/chatwoot/use-chatwoot";
import type { ListTenantConversationMessagesResponse } from "@/services/chatwoot/interface";
import type { ChatMessage, ChatUser } from "../utils/types";
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

const normalizeMessage = (
  message: Record<string, unknown>,
  currentConversationId: string,
): ChatMessage => {
  const sender = (message.sender ?? {}) as Record<string, unknown>;
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  return {
    id:
      typeof message.id === "number" || typeof message.id === "string"
        ? String(message.id)
        : `msg-${currentConversationId}-${String(message.created_at ?? message.updated_at ?? message.content ?? "")}`,
    content:
      (typeof message.content === "string" && message.content) ||
      (typeof message.processed_message_content === "string" &&
        message.processed_message_content) ||
      "",
    created_at:
      (typeof message.created_at === "string" && message.created_at) ||
      (typeof message.updated_at === "string" && message.updated_at) ||
      new Date().toISOString(),
    updated_at:
      (typeof message.updated_at === "string" && message.updated_at) ||
      (typeof message.created_at === "string" && message.created_at) ||
      new Date().toISOString(),
    conversation_id:
      typeof message.conversation_id === "number" ||
      typeof message.conversation_id === "string"
        ? String(message.conversation_id)
        : currentConversationId,
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
      })
      .slice(0, 1) as ChatMessage["attachments"],
  };
};

interface MessageListProps {
  messages: ChatMessage[];
  users: ChatUser[];
  currentUserId?: string;
  tenantId?: string;
  conversationId?: string | null;
  initialBeforeMessageId?: number;
}

export function MessageList({
  messages,
  users,
  currentUserId = "current-user",
  tenantId = "",
  conversationId = null,
  initialBeforeMessageId,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const pendingPrependScrollAdjustmentRef = useRef<{
    element: HTMLDivElement;
    previousScrollHeight: number;
    previousScrollTop: number;
  } | null>(null);
  const [showBackToLatestButton, setShowBackToLatestButton] = useState(false);
  const isInitialLoadRef = useRef(true);
  const previousConversationRef = useRef<string | null>(conversationId);
  const SCROLL_TOP_THRESHOLD = 80;
  const SHOW_BACK_TO_LATEST_THRESHOLD = 140;

  const messageQueryParams = useMemo(
    () =>
      typeof initialBeforeMessageId === "number" &&
      Number.isFinite(initialBeforeMessageId)
        ? ({ before: initialBeforeMessageId } as const)
        : undefined,
    [initialBeforeMessageId],
  );

  const {
    data: tenantMessagesResponse,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListTenantConversationMessages(
    tenantId,
    conversationId ?? "",
    messageQueryParams,
  );

  const apiMessages = useMemo(() => {
    if (!conversationId) return [];
    const pages = tenantMessagesResponse?.pages ?? [];
    if (pages.length === 0) return [];

    const mergedPayload = pages.flatMap(
      (page) => extractTenantMessagePayload(page) ?? [],
    );
    if (mergedPayload.length === 0) return [];

    return mergedPayload
      .map((message) => normalizeMessage(message, conversationId))
      .sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime(),
      );
  }, [tenantMessagesResponse, conversationId]);

  const resolvedMessages = useMemo(() => {
    if (apiMessages.length === 0) return messages;
    if (messages.length === 0) return apiMessages;

    const merged = new Map<string, ChatMessage>();
    for (const message of apiMessages) {
      merged.set(String(message.id ?? ""), message);
    }
    for (const message of messages) {
      merged.set(
        String(
          message.id ??
            `local-${message.conversation_id ?? ""}-${message.created_at ?? message.updated_at ?? message.content ?? ""}`,
        ),
        message,
      );
    }
    return Array.from(merged.values()).sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime(),
    );
  }, [apiMessages, messages]);

  useEffect(() => {
    if (conversationId !== previousConversationRef.current) {
      isInitialLoadRef.current = true;
      previousConversationRef.current = conversationId;
      previousLastMessageIdRef.current = null;
      pendingPrependScrollAdjustmentRef.current = null;
      setShowBackToLatestButton(false);
    }
  }, [conversationId]);

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
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      return;
    }

    if (
      resolvedMessages.length > previousMessageCountRef.current &&
      previousLastMessageIdRef.current !== latestMessageId &&
      bottomRef.current
    ) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }

    previousMessageCountRef.current = resolvedMessages.length;
    previousLastMessageIdRef.current = latestMessageId;
  }, [resolvedMessages]);

  useEffect(() => {
    if (isFetchingNextPage) return;
    const pendingState = pendingPrependScrollAdjustmentRef.current;
    if (!pendingState) return;

    pendingPrependScrollAdjustmentRef.current = null;
    if (!pendingState.element.isConnected) return;

    const nextScrollHeight = pendingState.element.scrollHeight;
    const heightDelta = nextScrollHeight - pendingState.previousScrollHeight;
    pendingState.element.scrollTop =
      pendingState.previousScrollTop + heightDelta;
  }, [isFetchingNextPage, resolvedMessages]);

  const handleScrollCapture = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLDivElement)) return;
    scrollViewportRef.current = target;
    const distanceToBottom =
      target.scrollHeight - (target.scrollTop + target.clientHeight);
    setShowBackToLatestButton(distanceToBottom > SHOW_BACK_TO_LATEST_THRESHOLD);

    if (!hasNextPage || isFetchingNextPage) return;
    if (target.scrollTop > SCROLL_TOP_THRESHOLD) return;

    pendingPrependScrollAdjustmentRef.current = {
      element: target,
      previousScrollHeight: target.scrollHeight,
      previousScrollTop: target.scrollTop,
    };
    void fetchNextPage();
  };

  const handleBackToLatestMessage = () => {
    const viewport =
      scrollViewportRef.current ??
      (scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLDivElement | null) ??
      null;

    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      setShowBackToLatestButton(false);
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowBackToLatestButton(false);
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
    message.created_at ?? message.updated_at ?? new Date().toISOString();

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
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM d, HH:mm");
    }
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

  const groupMessagesByDay = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];

    msgs.forEach((message) => {
      const messageDate = format(
        new Date(getMessageTimestamp(message)),
        "yyyy-MM-dd",
      );
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        });
      }
    });

    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "EEEE, MMMM d");
    }
  };

  const messageGroups = groupMessagesByDay(resolvedMessages);

  return (
    <div className="relative flex-1 min-h-0">
      <ScrollArea
        className="h-full overflow-auto"
        ref={scrollAreaRef}
        onScrollCapture={handleScrollCapture}
      >
        <div className="space-y-4 py-4 px-4">
          {messageGroups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center py-4">
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
                  {formatDateHeader(group.date)}
                </div>
              </div>

              <div className="space-y-3">
                {group.messages.map((message, messageIndex) => {
                  const senderId = getMessageSenderId(message);
                  const isCustomerMessage = message.sender?.type !== "user";
                  const isOwnMessage =
                    message.sender?.type === "user" ||
                    senderId === currentUserId;
                  const user = getUserById(senderId, isOwnMessage);

                  const showName =
                    isCustomerMessage && shouldShowName(message, messageIndex);
                  const isConsecutive = isConsecutiveMessage(
                    message,
                    messageIndex,
                  );
                  const messageId = getMessageId(message, messageIndex);
                  const messageTimestamp = getMessageTimestamp(message);
                  const messageContent = getMessageContent(message);
                  const attachments = Array.isArray(message.attachments)
                    ? message.attachments
                    : [];

                  return (
                    <div
                      key={messageId}
                      className={cn(
                        "flex gap-3 group",
                        isOwnMessage && "flex-row-reverse",
                        // isConsecutive && !isOwnMessage && "ml-12",
                      )}
                    >
                      <div className="w-8">
                        <Avatar className="size-8 cursor-pointer">
                          <AvatarImage />
                          <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10">
                            G
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div
                        className={cn(
                          "min-w-0 max-w-[70%]",
                          isOwnMessage
                            ? "w-fit flex flex-col items-end"
                            : "w-full",
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
                            "group/message flex items-center gap-2",
                            isOwnMessage
                              ? "justify-end w-auto"
                              : "justify-start w-full",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1 opacity-0 transition-all duration-200 pointer-events-none group-hover/message:opacity-100 group-hover/message:pointer-events-auto",
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

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full bg-background/95 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                            >
                              <Reply className="size-4" />
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
                                <DropdownMenuItem className="cursor-pointer">
                                  <Reply className="size-4" />
                                  Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Copy className="size-4" />
                                  Copy
                                </DropdownMenuItem>
                                {isOwnMessage && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                      <Trash2 className="size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm w-fit max-w-full wrap-break-word whitespace-pre-wrap",
                              isOwnMessage ? "order-2" : "order-1",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground rounded-br-md ml-auto"
                                : "bg-muted rounded-bl-md",
                              isConsecutive && "mt-1",
                            )}
                          >
                            <p>{messageContent}</p>

                            {attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {attachments.map(
                                  (attachment, attachmentIndex) => (
                                    <MessageAttachment
                                      key={`${messageId}-attachment-${attachment.id ?? attachmentIndex}`}
                                      attachment={attachment}
                                      isOwnMessage={isOwnMessage}
                                    />
                                  ),
                                )}
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
                  );
                })}
              </div>
            </div>
          ))}

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
    </div>
  );
}
