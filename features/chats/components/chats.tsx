"use client";

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  Menu,
  X,
  MessagesSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useListTenantConversations,
} from "@/hooks/chatwoot/use-chatwoot";
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
import type { ChatConversation, ChatMessage, ChatUser } from "../utils/types";
import { useChat } from "../utils/use-chat";
import { ChatConversationList } from "./chat-conversation-list";
import {
  ChatNotificationSidebar,
  type ConversationSidebarAssigneeFilter,
} from "./chat-notification-sidebar";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatProps {
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  users: ChatUser[];
}

/** Params list conversations — GET `/api/v1/chatwoot/tenants/:tenant_id/conversations` */
const TENANT_CONVERSATION_LIST_BASE = {
  status: "open",
  assignee_type: "me",
  page: 1,
  sort_by: "last_activity_at_desc",
} as const satisfies Partial<ListTenantConversationsParams>;

const toIsoString = (value: unknown): string => {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") {
    // Chatwoot có thể trả unix timestamp (giây) cho một số field thời gian
    return new Date(value * 1000).toISOString();
  }
  return new Date().toISOString();
};

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

  const lastMessageTimestamp = toIsoString(
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
      timestamp: lastMessageTimestamp,
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

export function Chat({ conversations, messages, users }: ChatProps) {
  // Biến state để lọc danh sách hội thoại theo assignee
  const [sidebarConversationAssignee, setSidebarConversationAssignee] =
    useState<ConversationSidebarAssigneeFilter>("me");

  // Tham số query params cho API lấy danh sách hội thoại
  const conversationListQueryParams = useMemo(
    () =>
      ({
        ...TENANT_CONVERSATION_LIST_BASE,
        conversation_type: sidebarConversationAssignee,
      }) satisfies ListTenantConversationsParams,
    [sidebarConversationAssignee],
  );

  // Lấy thông tin user đang đăng nhập
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  // Lấy danh sách conversations từ API
  const {
    data: chatwootConversationsList,
    isLoading: isChatwootLoading,
    isFetching: isChatwootFetching,
  } = useListTenantConversations(tenantId, conversationListQueryParams);

  // Lấy payload từ data trả về (thành phần trong response là payload)
  const chatwootPayload = useMemo(
    () => extractTenantListPayload(chatwootConversationsList),
    [chatwootConversationsList],
  );

  // Map payload thành dạng ChatConversation
  const mappedChatwootConversations = useMemo(
    () => (chatwootPayload ?? []).map(normalizeConversation),
    [chatwootPayload],
  );

  // Chỉ fallback về mock khi response chưa có payload (chưa load / shape khác),
  // nếu payload rỗng thì vẫn tôn trọng API để UI hiển thị rỗng.
  const displayConversations = useMemo(
    () =>
      chatwootPayload !== null ? mappedChatwootConversations : conversations,
    [chatwootPayload, mappedChatwootConversations, conversations],
  );

  // Lấy meta từ data trả về (thành phần trong response là meta)
  const chatwootConversationsMeta = useMemo(() => {
    const apiMeta = extractTenantListMeta(chatwootConversationsList);
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
    chatwootConversationsList,
    chatwootPayload,
    mappedChatwootConversations.length,
    sidebarConversationAssignee,
  ]);

  // Lấy store chat từ context
  const chatStore = useChat();
  const {
    selectedConversation,
    setSelectedConversation,
    setConversations,
    setMessages,
    setUsers,
    addMessage,
    toggleMute,
  } = chatStore;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationSidebarCollapsed, setIsNotificationSidebarCollapsed] =
    useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] =
    useState(false);

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
    setUsers(users);

    Object.entries(messages).forEach(
      ([conversationId, conversationMessages]) => {
        setMessages(conversationId, conversationMessages);
      },
    );

    if (!selectedConversation && displayConversations.length > 0) {
      setSelectedConversation(displayConversations[0].id);
    }
  }, [
    displayConversations,
    messages,
    users,
    selectedConversation,
    setConversations,
    setMessages,
    setUsers,
    setSelectedConversation,
  ]);

  // Lấy conversation sau khi đã chọn
  const currentConversation = displayConversations.find(
    (conv) => conv.id === selectedConversation,
  );

  const storeMessages = chatStore.messages;
  const currentMessages = selectedConversation
    ? storeMessages[selectedConversation] || messages[selectedConversation] || []
    : [];

  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      sender_id: "current-user",
    };

    addMessage(selectedConversation, newMessage);
  };

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
      ? "lg:w-[calc(13.333333%+4rem)]"
      : isNotificationSidebarCollapsed && !isConversationListCollapsed
        ? "lg:w-[calc(26.666667%+4rem)]"
        : "lg:w-32";

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={200}>
      <div className="h-[calc(95vh-180px)] min-h-[500px] flex rounded-xl border shadow-sm overflow-hidden bg-background">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "w-100 border-r bg-background shrink-0 fixed inset-y-0 left-0 z-50 transition-[width,transform] duration-500 ease-in-out lg:relative lg:block",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
            sidebarDesktopWidthClass,
          )}
        >
          <div className="h-16 px-4 border-b flex items-center justify-between gap-2 overflow-hidden bg-background">
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
                <div className="flex items-center rounded-md border bg-muted/30 p-1">
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
                    ? "w-[calc(100%-4rem)]"
                    : "w-1/3",
              )}
            >
              <ChatNotificationSidebar
                isCollapsed={isNotificationSidebarCollapsed}
                sidebarConversationAssignee={sidebarConversationAssignee}
                isSwitchingMenu={isChatwootFetching && !isChatwootLoading}
                onSidebarConversationAssigneeChange={
                  setSidebarConversationAssignee
                }
              />
            </div>
            <div
              className={cn(
                "min-w-0 border-l bg-background transition-[width] duration-500 ease-in-out",
                isConversationListCollapsed
                  ? "w-16"
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
                conversationsMeta={chatwootConversationsMeta}
                onSelectConversation={(id: string) => {
                  setSelectedConversation(id);
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="flex items-center h-16 px-4 border-b bg-background">
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
                />

                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder={`Message ${currentConversation?.name || ""}...`}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to Chat
                  </h3>
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
