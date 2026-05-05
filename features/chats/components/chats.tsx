"use client";

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  Menu,
  X,
  MessagesSquare,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useListTenantConversations } from "@/hooks/chatwoot/use-chatwoot";
import type {
  ListTenantConversationsData,
  ListTenantConversationsParams,
  ListTenantConversationsResponse,
  TenantConversationsListMeta,
} from "@/services/chatwoot/interface";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ChatConversation,
  ChatUser,
  PendingMessage,
  ReplyDraft,
} from "../utils/types";
import { useChat } from "../utils/use-chat";
import { ChatConversationList } from "./chat-conversation-list";
import {
  ChatNotificationSidebar,
  type ConversationSidebarAssigneeFilter,
} from "./chat-notification-sidebar";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { EmptyData } from "@/components/empty-data";
import { StringParam, useQueryParams } from "use-query-params";
import { coerceToDate } from "@/helpers/format-message-time";

/** Params list conversations — GET `/api/v1/chatwoot/tenants/:tenant_id/conversations` */
const TENANT_CONVERSATION_LIST_BASE = {
  status: "open",
  assignee_type: "me",
  page: 1,
  sort_by: "last_activity_at_desc",
} as const satisfies Partial<ListTenantConversationsParams>;

const normalizeConversation = (
  conversation: Record<string, unknown>,
): ChatConversation => {
  const meta = (conversation["meta"] ?? {}) as Record<string, unknown>;
  const sender = (meta.sender ?? {}) as Record<string, unknown>;
  const lastMessage = (conversation["last_non_activity_message"] ??
    {}) as Record<string, unknown>;

  const senderId =
    typeof sender.id === "number" || typeof sender.id === "string"
      ? String(sender.id)
      : typeof conversation.contact_id === "number"
        ? String(conversation.contact_id)
        : "unknown-user";

  const conversationId =
    typeof conversation.id === "number" || typeof conversation.id === "string"
      ? String(conversation.id)
      : typeof conversation.uuid === "string"
        ? conversation.uuid
        : `conversation-${Date.now()}`;

  const name =
    typeof sender.name === "string" && sender.name.length > 0
      ? sender.name
      : `Cuộc trò chuyện #${conversationId}`;

  const avatar =
    (typeof sender.thumbnail === "string" && sender.thumbnail) ||
    (typeof sender.avatar_url === "string" && sender.avatar_url) ||
    "";

  const unreadCount =
    typeof conversation["unread_count"] === "number"
      ? conversation["unread_count"]
      : 0;

  const lastMessageContent =
    (typeof lastMessage.content === "string" && lastMessage.content) ||
    (typeof conversation["last_activity_message"] === "string" &&
      conversation["last_activity_message"]) ||
    "Chưa có tin nhắn";

  const lastMessageTimestamp = coerceToDate(
    lastMessage.created_at ??
      conversation.updated_at ??
      conversation.created_at,
  );

  return {
    id: conversationId,
    type: "direct",
    participants: [senderId],
    name,
    avatar,
    lastMessage: {
      id:
        typeof lastMessage.id === "number" || typeof lastMessage.id === "string"
          ? String(lastMessage.id)
          : `last-${conversationId}`,
      content: lastMessageContent,
      timestamp: String(lastMessageTimestamp),
      senderId,
    },
    unreadCount,
    isPinned: false,
    isMuted: Boolean(conversation["muted"]),
  };
};

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
  return rows;
};

/** Lấy mảng hội thoại từ `ApiResponse.data` (nhiều dạng lồng backend). */
const extractTenantListPayload = (
  res: ListTenantConversationsResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const data = res?.data as ListTenantConversationsData | undefined;
  if (!data) return null;
  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;
  const nested = coerceConversationRecords(data.data?.payload);
  if (nested) return nested;
  const viaChatwoot = coerceConversationRecords(data.chatwoot?.data?.payload);
  if (viaChatwoot) return viaChatwoot;
  return null;
};

const extractTenantListPayloadFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): Record<string, unknown>[] | null => {
  if (!pages || pages.length === 0) return null;

  const merged: Record<string, unknown>[] = [];
  let hasExtractablePayload = false;

  pages.forEach((page) => {
    const payload = extractTenantListPayload(page);
    if (payload !== null) {
      hasExtractablePayload = true;
      merged.push(...payload);
    }
  });

  return hasExtractablePayload ? merged : null;
};

const extractTenantListMeta = (
  res: ListTenantConversationsResponse | null | undefined,
): TenantConversationsListMeta | null => {
  const data = res?.data as ListTenantConversationsData | undefined;
  if (!data) return null;
  if (data.meta && typeof data.meta === "object") return data.meta;
  if (data.data?.meta && typeof data.data.meta === "object")
    return data.data.meta;
  if (
    data.chatwoot?.data?.meta &&
    typeof data.chatwoot.data.meta === "object"
  ) {
    return data.chatwoot.data.meta;
  }
  return null;
};

const extractTenantListMetaFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): TenantConversationsListMeta | null => {
  if (!pages || pages.length === 0) return null;
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    const meta = extractTenantListMeta(pages[i]);
    if (meta) return meta;
  }
  return null;
};

export function Chat() {
  const users: ChatUser[] = [];
  const [query, setQuery] = useQueryParams({
    conversation_id: StringParam,
  });
  const selectedConversationFromQuery = query.conversation_id ?? null;

  // Biến state để lọc danh sách hội thoại theo assignee
  const [sidebarConversationAssignee, setSidebarConversationAssignee] =
    useState<ConversationSidebarAssigneeFilter>("me");
  const [sidebarInboxId, setSidebarInboxId] = useState<number | null>(null);

  // Tham số query params cho API lấy danh sách hội thoại
  const conversationListQueryParams = useMemo(
    () =>
      ({
        ...TENANT_CONVERSATION_LIST_BASE,
        ...(typeof sidebarInboxId === "number"
          ? {}
          : { conversation_type: sidebarConversationAssignee }),
        ...(typeof sidebarInboxId === "number"
          ? { inbox_id: sidebarInboxId }
          : {}),
      }) satisfies ListTenantConversationsParams,
    [sidebarConversationAssignee, sidebarInboxId],
  );

  // Lấy thông tin user đang đăng nhập
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  // Lấy danh sách conversations từ API
  const {
    data: chatwootConversationsList,
    isLoading: isChatwootLoading,
    isFetching: isChatwootFetching,
    isFetchingNextPage: isChatwootFetchingNextPage,
    fetchNextPage: fetchNextConversationPage,
    hasNextPage: hasNextConversationPage,
  } = useListTenantConversations(tenantId, conversationListQueryParams);

  const chatwootConversationPages = chatwootConversationsList?.pages;

  // Lấy payload từ data trả về (thành phần trong response là payload)
  const chatwootPayload = useMemo(
    () => extractTenantListPayloadFromPages(chatwootConversationPages),
    [chatwootConversationPages],
  );

  // Map payload thành dạng ChatConversation
  const mappedChatwootConversations = useMemo(
    () => (chatwootPayload ?? []).map(normalizeConversation),
    [chatwootPayload],
  );

  const displayConversations = useMemo(
    () => mappedChatwootConversations,
    [mappedChatwootConversations],
  );

  // Lấy meta từ data trả về (thành phần trong response là meta)
  const chatwootConversationsMeta = useMemo(() => {
    const apiMeta = extractTenantListMetaFromPages(chatwootConversationPages);
    if (apiMeta) return apiMeta;

    // API có payload nhưng không trả meta -> tạo meta fallback để UI tab hiển thị đúng.
    if (chatwootPayload !== null) {
      const total = mappedChatwootConversations.length;
      return {
        mine_count: sidebarConversationAssignee === "me" ? total : 0,
        assigned_count: sidebarConversationAssignee === "me" ? total : 0,
        unassigned_count:
          sidebarConversationAssignee === "unattended" ? total : 0,
        all_count: total,
      } satisfies TenantConversationsListMeta;
    }

    return null;
  }, [
    chatwootConversationPages,
    chatwootPayload,
    mappedChatwootConversations.length,
    sidebarConversationAssignee,
  ]);

  const handleLoadMoreConversations = useCallback(() => {
    if (!hasNextConversationPage || isChatwootFetchingNextPage) return;
    void fetchNextConversationPage();
  }, [
    fetchNextConversationPage,
    hasNextConversationPage,
    isChatwootFetchingNextPage,
  ]);

  // Lấy store chat từ context
  const chatStore = useChat();
  const {
    selectedConversation: selectedConversationInStore,
    setSelectedConversation,
    setConversations,
    toggleMute,
  } = chatStore;
  const selectedConversation = selectedConversationFromQuery;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationSidebarCollapsed, setIsNotificationSidebarCollapsed] =
    useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] =
    useState(false);
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  useEffect(() => {
    setReplyDraft(null);
    setPendingMessages([]);
  }, [selectedConversation]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" ? window.innerWidth : 0 >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    setConversations(displayConversations);
  }, [displayConversations, setConversations]);

  useEffect(() => {
    if (selectedConversationInStore !== selectedConversation) {
      setSelectedConversation(selectedConversation);
    }
  }, [
    selectedConversation,
    selectedConversationInStore,
    setSelectedConversation,
  ]);

  // Lấy conversation sau khi đã chọn
  const currentConversation = displayConversations.find(
    (conv) => conv.id === selectedConversation,
  );

  const storeMessages = chatStore.messages;
  const currentMessages = useMemo(
    () => (selectedConversation ? storeMessages[selectedConversation] ?? [] : []),
    [selectedConversation, storeMessages],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSendMessage = (_content: string) => {
    // Tin nhắn thực sẽ xuất hiện sau khi React Query invalidate và refetch
  };

  const handleBeforeSend = useCallback(
    (id: string, content: string, filesCount: number) => {
      if (!selectedConversation) return;
      setPendingMessages((prev) => [
        ...prev,
        {
          id,
          content,
          filesCount,
          created_at: new Date().toISOString(),
          status: "sending",
          conversationId: selectedConversation,
        },
      ]);
    },
    [selectedConversation],
  );

  const handleSendResult = useCallback(
    (id: string, succeeded: boolean, retry?: () => Promise<void>) => {
      if (succeeded) {
        // Xóa tin nhắn tạm sau khi query refetch xong (~1s)
        setTimeout(() => {
          setPendingMessages((prev) => prev.filter((m) => m.id !== id));
        }, 1200);
      } else {
        setPendingMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "failed", retry } : m)),
        );
      }
    },
    [],
  );

  const handleToggleMute = () => {
    if (selectedConversation) {
      toggleMute(selectedConversation);
    }
  };

  const isSidebarContentCollapsed =
    isNotificationSidebarCollapsed && isConversationListCollapsed;
  const isSidebarFullyExpanded =
    !isNotificationSidebarCollapsed && !isConversationListCollapsed;
  const sidebarDesktopWidthClass = isSidebarFullyExpanded
    ? "lg:w-2/5"
    : !isNotificationSidebarCollapsed && isConversationListCollapsed
      ? "lg:w-[calc(13.333333%+5rem)]"
      : isNotificationSidebarCollapsed && !isConversationListCollapsed
        ? "lg:w-[calc(26.666667%+4rem)]"
        : "lg:w-36";

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={200}>
      <div className="flex min-h-0 flex-1 w-full rounded-xl border shadow-sm overflow-hidden">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "w-100 border-r shrink-0 fixed inset-y-0 left-0 z-50 transition-[width,transform] duration-500 ease-in-out lg:relative lg:block",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
            sidebarDesktopWidthClass,
          )}
        >
          <div className="h-16 px-4 border-b flex items-center justify-between gap-2 overflow-hidden">
            <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold leading-none">
              <MessagesSquare
                className={cn(
                  "size-4 shrink-0",
                  isSidebarContentCollapsed ? "ml-2" : "ml-0",
                )}
              />
              {!isSidebarContentCollapsed && (
                <span
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap transition-opacity duration-300",
                  )}
                >
                  Danh sách trò chuyện
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              {isSidebarFullyExpanded || isSidebarContentCollapsed ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const nextCollapsed = !isSidebarContentCollapsed;
                        setIsNotificationSidebarCollapsed(nextCollapsed);
                        setIsConversationListCollapsed(nextCollapsed);
                      }}
                      className="cursor-pointer ml-auto"
                      aria-label={
                        isSidebarContentCollapsed
                          ? "Mở danh sách trò chuyện"
                          : "Thu gọn danh sách trò chuyện"
                      }
                    >
                      {isSidebarContentCollapsed ? (
                        <ArrowRightCircleIcon className="size-5" />
                      ) : (
                        <ArrowLeftCircleIcon className="size-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSidebarContentCollapsed
                      ? "Mở danh sách trò chuyện"
                      : "Thu gọn danh sách trò chuyện"}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center rounded-md border p-1">
                  <Button
                    variant={
                      !isNotificationSidebarCollapsed ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() =>
                      setIsNotificationSidebarCollapsed((prev) => !prev)
                    }
                    className="h-7 px-2 text-xs"
                    aria-label={
                      isNotificationSidebarCollapsed
                        ? "Mở sidebar thông báo"
                        : "Đóng sidebar thông báo"
                    }
                  >
                    Sidebar
                  </Button>
                  <Button
                    variant={
                      !isConversationListCollapsed ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() =>
                      setIsConversationListCollapsed((prev) => !prev)
                    }
                    className="h-7 px-2 text-xs"
                    aria-label={
                      isConversationListCollapsed
                        ? "Mở danh sách trò chuyện"
                        : "Đóng danh sách trò chuyện"
                    }
                  >
                    Danh sách
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="cursor-pointer lg:hidden"
                aria-label="Đóng danh sách trò chuyện"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(100%-64px)]">
            <div
              className={cn(
                "shrink-0 transition-[width] duration-500 ease-in-out",
                isNotificationSidebarCollapsed
                  ? "w-16"
                  : isConversationListCollapsed
                    ? "w-[calc(100%-5rem)]"
                    : "w-1/3",
              )}
            >
              <ChatNotificationSidebar
                tenantId={tenantId}
                isCollapsed={isNotificationSidebarCollapsed}
                sidebarConversationAssignee={sidebarConversationAssignee}
                sidebarInboxId={sidebarInboxId}
                isSwitchingMenu={isChatwootFetching && !isChatwootLoading}
                onSidebarConversationAssigneeChange={
                  setSidebarConversationAssignee
                }
                onSidebarInboxChange={setSidebarInboxId}
              />
            </div>
            <div
              className={cn(
                "min-w-0 border-l transition-[width] duration-500 ease-in-out",
                isConversationListCollapsed
                  ? "w-20"
                  : isNotificationSidebarCollapsed
                    ? "w-[calc(100%-4rem)]"
                    : "flex-1",
              )}
            >
              <ChatConversationList
                conversations={displayConversations}
                users={users}
                selectedConversation={selectedConversation}
                isCollapsed={isConversationListCollapsed}
                isLoading={isChatwootLoading}
                isLoadingMore={isChatwootFetchingNextPage}
                hasMore={Boolean(hasNextConversationPage)}
                conversationsMeta={chatwootConversationsMeta}
                onLoadMore={handleLoadMoreConversations}
                onSelectConversation={(id: string) => {
                  setQuery({ conversation_id: id }, "replaceIn");
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center h-16 px-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="cursor-pointer lg:hidden mr-2"
            >
              <Menu className="size-4" />
            </Button>

            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                users={users}
                onToggleMute={handleToggleMute}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <MessageList
                  messages={currentMessages}
                  users={users}
                  tenantId={tenantId}
                  conversationId={selectedConversation}
                  onReplyToMessage={setReplyDraft}
                  pendingMessages={pendingMessages}
                />

                <MessageInput
                  tenantId={tenantId}
                  conversationId={selectedConversation}
                  onSendMessage={handleSendMessage}
                  placeholder={`Message ${currentConversation?.name || ""}...`}
                  replyDraft={replyDraft}
                  onClearReply={() => setReplyDraft(null)}
                  onBeforeSend={handleBeforeSend}
                  onSendResult={handleSendResult}
                />
              </>
            ) : (
              <div className="flex-1 p-4">
                <EmptyData
                  icon={MessagesSquare}
                  title="Chưa chọn cuộc trò chuyện"
                  description="Vui lòng chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu."
                  showButton={false}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
