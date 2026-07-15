"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlarmClockOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hash,
  Pin,
  Link2,
  Mail,
  SquareArrowOutUpRight,
  Tag,
  Trash2,
  UserPlus,
  Users,
  VolumeX,
  Inbox,
  User,
  Cast,
  CircleHelp,
  Dot,
  MessageSquareReply,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EmptyData } from "@/components/empty-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useBulkAction,
  useDeleteTenantConversation,
  useListTenantInboxes,
  useListTenantLabels,
  useTenantConversationLastSeen,
} from "@/hooks/chatwoot/use-chatwoot";

type ConversationTab = "all" | "me" | "unassigned";

export type ConversationAssigneeType = ConversationTab;

type ConversationLabelOption = {
  id: string;
  title: string;
  color: string;
};

const formatConversationLabel = (label: string) =>
  label
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const TAB_CYCLE: ConversationTab[] = ["all", "me", "unassigned"];
const TAB_COLORS: Record<ConversationTab, string> = {
  all: "bg-green-500",
  me: "bg-red-500",
  unassigned: "bg-amber-500",
};
const TAB_LABELS: Record<ConversationTab, string> = {
  all: "Tất cả",
  me: "Của tôi",
  unassigned: "Chưa phân công",
};
const ASSIGNEE_TABS_HELP =
  "Các tab lọc theo nhân sự được phân công xử lý cuộc trò chuyện: Tất cả (mọi người), Của tôi (bạn phụ trách), Chưa phân công (chưa gán cho ai xử lý).";

const LABEL_FALLBACK_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const coerceStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;

const coerceObjectArray = (
  value: unknown,
): Array<Record<string, unknown>> | null =>
  Array.isArray(value) &&
  value.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  )
    ? (value as Array<Record<string, unknown>>)
    : null;

function extractRawLabels(
  response: unknown,
): Array<string | Record<string, unknown>> {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const fromData = root.data as Record<string, unknown> | undefined;
  const chatwoot = fromData?.chatwoot as Record<string, unknown> | undefined;

  const chatwootPayloadObjects = coerceObjectArray(chatwoot?.payload);
  if (chatwootPayloadObjects) return chatwootPayloadObjects;

  const chatwootPayloadStrings = coerceStringArray(chatwoot?.payload);
  if (chatwootPayloadStrings) return chatwootPayloadStrings;

  const dataLabelStrings = coerceStringArray(fromData?.labels);
  if (dataLabelStrings) return dataLabelStrings;

  const dataLabelObjects = coerceObjectArray(fromData?.labels);
  if (dataLabelObjects) return dataLabelObjects;

  const nestedPayloadObjects = coerceObjectArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayloadObjects) return nestedPayloadObjects;

  const nestedPayloadStrings = coerceStringArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayloadStrings) return nestedPayloadStrings;

  return [];
}

function normalizeLabelOption(
  raw: string | Record<string, unknown>,
  index: number,
): ConversationLabelOption | null {
  if (typeof raw === "string") {
    const title = raw.trim();
    return title
      ? {
          id: title,
          title,
          color: LABEL_FALLBACK_COLORS[index % LABEL_FALLBACK_COLORS.length],
        }
      : null;
  }

  const title = String(raw.title ?? raw.label ?? raw.name ?? "").trim();
  if (!title) return null;

  const color = String(raw.color ?? raw.colour ?? raw.hex_color ?? "").trim();

  return {
    id: String(raw.id ?? title),
    title,
    color: color || LABEL_FALLBACK_COLORS[index % LABEL_FALLBACK_COLORS.length],
  };
}

const CONTEXT_MENU_CONTENT_CLASSNAME =
  "min-w-[180px] rounded-lg border bg-background/95 backdrop-blur-sm p-1 shadow-md";
const CONTEXT_MENU_ITEM_CLASSNAME =
  "min-h-7 rounded-md px-2 py-1 text-xs leading-none cursor-pointer transition-colors [&_svg]:size-3.5";
const CONTEXT_MENU_SUB_TRIGGER_CLASSNAME =
  "min-h-7 rounded-md px-2 py-1 text-xs leading-none cursor-pointer transition-colors [&_svg]:size-3.5";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatConversationTimeParts,
  getTime,
} from "@/helpers/format-message-time";
import { cn } from "@/lib/utils";
import type { TenantConversationsListMeta } from "@/services/chatwoot/interface";
import type { ChatConversation, ChatUser } from "../utils/types";
import { clearConversationUnreadInListCache } from "../utils/chatwoot-realtime-cache";
import { useChatUnreadStore } from "../utils/chat-unread-store";
import { useChat } from "../utils/use-chat";
import { motion, AnimatePresence } from "framer-motion";

interface TenantInboxItem {
  id?: number | string;
  name?: string;
}

interface ConversationListProps {
  tenantId: string;
  conversations: ChatConversation[];
  users: ChatUser[];
  selectedConversation: string | null;
  isCollapsed?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  /** Ẩn tab khi đang lọc bằng filter API — chỉ hiển thị danh sách "Tất cả" */
  hideTabs?: boolean;
  /** Đổi khi chuyển menu sidebar — reset scroll và tab về đầu danh sách */
  listScrollResetKey?: string;
  /** Meta từ GET conversations (mine_count, all_count, …) */
  conversationsMeta?: TenantConversationsListMeta | null;
  /** assignee_type đang gửi lên API: all | me | unassigned */
  assigneeType?: ConversationAssigneeType;
  onAssigneeTypeChange?: (assigneeType: ConversationAssigneeType) => void;
  onLoadMore?: () => void;
  onSelectConversation: (conversationId: string) => void;
  onConversationDeleted?: (conversationId: string) => void;
}

export function ChatConversationList({
  tenantId,
  conversations,
  users,
  selectedConversation,
  isCollapsed = false,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  hideTabs = false,
  listScrollResetKey,
  conversationsMeta = null,
  assigneeType = "all",
  onAssigneeTypeChange,
  onLoadMore,
  onSelectConversation,
  onConversationDeleted,
}: ConversationListProps) {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery, markAsRead } = useChat();
  const clearUnread = useChatUnreadStore((state) => state.clearUnread);
  const { data: inboxData } = useListTenantInboxes(tenantId);
  const { data: labelData } = useListTenantLabels(tenantId);
  const { mutate: deleteConversation, isPending: isDeletingConversation } =
    useDeleteTenantConversation();

  const inboxNameById = useMemo(() => {
    const inboxPayload = (
      inboxData?.data as { chatwoot?: { payload?: unknown } } | undefined
    )?.chatwoot?.payload;
    const inboxes: TenantInboxItem[] = Array.isArray(inboxPayload)
      ? (inboxPayload as TenantInboxItem[])
      : [];

    const map = new Map<number, string>();
    for (const inbox of inboxes) {
      const inboxId =
        typeof inbox.id === "number"
          ? inbox.id
          : typeof inbox.id === "string"
            ? Number(inbox.id)
            : Number.NaN;
      if (!Number.isFinite(inboxId)) continue;

      const inboxName =
        typeof inbox.name === "string" && inbox.name.length > 0
          ? inbox.name
          : "Kênh chưa đặt tên";
      map.set(inboxId, inboxName);
    }
    return map;
  }, [inboxData]);
  const { mutate: bulkAction, isPending: isBulkActionPending } =
    useBulkAction();
  const { mutate: updateConversationLastSeen } =
    useTenantConversationLastSeen();
  const lastSeenRequestRef = useRef<string | null>(null);
  const conversationListScrollRef = useRef<HTMLDivElement>(null);
  const listScrollResetKeyRef = useRef(listScrollResetKey);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [activeTab, setActiveTabLocal] =
    useState<ConversationTab>(assigneeType);
  const SCROLL_BOTTOM_THRESHOLD = 100;

  const setActiveTab = useCallback(
    (tab: ConversationTab) => {
      setActiveTabLocal(tab);
      onAssigneeTypeChange?.(tab);
    },
    [onAssigneeTypeChange],
  );

  useEffect(() => {
    setActiveTabLocal(assigneeType);
  }, [assigneeType]);

  useEffect(() => {
    conversationListScrollRef.current?.scrollTo({ top: 0 });
  }, [assigneeType]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
      }
    }, 300);

    return () => window.clearTimeout(debounceTimer);
  }, [searchInput, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (!listScrollResetKey) return;
    if (listScrollResetKeyRef.current === listScrollResetKey) return;

    listScrollResetKeyRef.current = listScrollResetKey;
    conversationListScrollRef.current?.scrollTo({ top: 0 });
    if (!hideTabs) {
      setActiveTabLocal("all");
      onAssigneeTypeChange?.("all");
    }
  }, [hideTabs, listScrollResetKey, onAssigneeTypeChange]);

  const handleConversationScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || isLoadingMore) return;
      const target = event.currentTarget;
      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - SCROLL_BOTTOM_THRESHOLD;
      if (reachedBottom) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  const mineConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const assigneeId = conversation.meta?.assignee?.id;
        return Boolean(assigneeId);
      }),
    [conversations],
  );

  const unassignedConversations = useMemo(
    () =>
      conversations.filter((conversation) => !conversation.meta?.assignee?.id),
    [conversations],
  );

  const syncConversationReadState = useCallback(
    (conversationId: string) => {
      if (!conversationId) return;

      markAsRead(conversationId);
      clearUnread(conversationId);

      if (!tenantId) return;

      clearConversationUnreadInListCache(queryClient, tenantId, conversationId);

      const requestKey = `${tenantId}:${conversationId}`;
      if (lastSeenRequestRef.current === requestKey) return;

      lastSeenRequestRef.current = requestKey;
      updateConversationLastSeen({ tenantId, conversationId });
    },
    [
      clearUnread,
      markAsRead,
      queryClient,
      tenantId,
      updateConversationLastSeen,
    ],
  );

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      syncConversationReadState(conversationId);
      onSelectConversation(conversationId);
    },
    [onSelectConversation, syncConversationReadState],
  );

  useEffect(() => {
    if (!selectedConversation) return;
    syncConversationReadState(selectedConversation);
  }, [selectedConversation, syncConversationReadState]);

  const tabMeCount =
    conversationsMeta?.mine_count ??
    (assigneeType === "me" ? conversations.length : mineConversations.length);
  const tabUnassignedCount =
    conversationsMeta?.unassigned_count ??
    (assigneeType === "unassigned"
      ? conversations.length
      : unassignedConversations.length);
  const tabAllCount =
    conversationsMeta?.all_count ??
    (assigneeType === "all" ? conversations.length : conversations.length);
  const isEmptyByMeta = conversationsMeta?.all_count === 0;
  const tabCounts: Record<ConversationTab, number> = {
    all: tabAllCount,
    me: tabMeCount,
    unassigned: tabUnassignedCount,
  };
  const effectiveTab: ConversationTab = hideTabs ? "all" : activeTab;
  const activeTabCount = tabCounts[effectiveTab];

  const sortedConversations = useMemo(() => {
    // Danh sách đã được lọc theo assignee_type phía API — tab chỉ hiển thị/search/sort.
    const searchFilteredConversations = conversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return [...searchFilteredConversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      return (
        getTime(b.lastMessage.timestamp) - getTime(a.lastMessage.timestamp)
      );
    });
  }, [conversations, searchQuery]);

  const conversationItemRefs = useRef(new Map<string, HTMLElement>());
  const loadMoreForScrollRef = useRef<string | null>(null);
  const previousSelectedConversationRef = useRef<string | null>(null);

  const registerConversationItemRef = useCallback(
    (conversationId: string, node: HTMLElement | null) => {
      if (node) {
        conversationItemRefs.current.set(conversationId, node);
      } else {
        conversationItemRefs.current.delete(conversationId);
      }
    },
    [],
  );

  const scrollSelectedConversationIntoView = useCallback(() => {
    if (!selectedConversation) return false;

    const node = conversationItemRefs.current.get(selectedConversation);
    if (!node) return false;

    node.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation || isLoading) return;

    const selectionChanged =
      previousSelectedConversationRef.current !== selectedConversation;
    previousSelectedConversationRef.current = selectedConversation;

    const isVisibleInList = sortedConversations.some(
      (conversation) => conversation.id === selectedConversation,
    );

    if (isVisibleInList) {
      loadMoreForScrollRef.current = null;
      if (!selectionChanged) return;

      const frame = requestAnimationFrame(() => {
        scrollSelectedConversationIntoView();
      });
      return () => cancelAnimationFrame(frame);
    }

    const conversationInData = conversations.find(
      (conversation) => conversation.id === selectedConversation,
    );

    if (conversationInData) {
      loadMoreForScrollRef.current = null;
      // Chỉ tự chuyển sang tab "Tất cả" khi *chọn* hội thoại mới từ URL/deep-link,
      // không reset tab khi người dùng chủ động đổi tab.
      if (selectionChanged && activeTab !== "all") {
        setActiveTab("all");
      }
      return;
    }

    if (
      hasMore &&
      onLoadMore &&
      !isLoadingMore &&
      loadMoreForScrollRef.current !== selectedConversation
    ) {
      loadMoreForScrollRef.current = selectedConversation;
      onLoadMore();
    }
  }, [
    activeTab,
    conversations,
    hasMore,
    isLoading,
    isLoadingMore,
    onLoadMore,
    scrollSelectedConversationIntoView,
    selectedConversation,
    setActiveTab,
    sortedConversations,
  ]);

  const availableAgents = useMemo(() => users.slice(0, 5), [users]);
  const labelOptions = useMemo(
    () =>
      extractRawLabels(labelData)
        .map((raw, index) => normalizeLabelOption(raw, index))
        .filter((label): label is ConversationLabelOption => label !== null),
    [labelData],
  );
  const labelColorMap = useMemo(
    () => new Map(labelOptions.map((label) => [label.title, label.color])),
    [labelOptions],
  );

  const buildConversationUrl = useCallback((conversationId: string) => {
    if (typeof window === "undefined") return "";

    const url = new URL(window.location.href);
    url.searchParams.set("conversation_id", conversationId);
    url.searchParams.delete("conversationId");
    return url.toString();
  }, []);

  const showConversationActionToast = useCallback(
    (title: string, description: string) => {
      toast.success(title, { description });
    },
    [],
  );

  const handleOpenConversationInNewTab = useCallback(
    (conversation: ChatConversation) => {
      const url = buildConversationUrl(conversation.id);
      if (!url) return;

      window.open(url, "_blank", "noopener,noreferrer");
      showConversationActionToast(
        "Đã mở cuộc trò chuyện trong tab mới",
        `Cuộc trò chuyện với ${conversation.name} đã được mở ở tab mới.`,
      );
    },
    [buildConversationUrl, showConversationActionToast],
  );

  const handleCopyConversationLink = useCallback(
    async (conversation: ChatConversation) => {
      const url = buildConversationUrl(conversation.id);
      if (!url) return;

      try {
        await navigator.clipboard.writeText(url);
        showConversationActionToast(
          "Đã sao chép liên kết hội thoại",
          `Liên kết của cuộc trò chuyện với ${conversation.name} đã được sao chép.`,
        );
      } catch {
        toast.error("Không thể sao chép liên kết", {
          description: "Trình duyệt đã chặn quyền truy cập clipboard.",
        });
      }
    },
    [buildConversationUrl, showConversationActionToast],
  );

  const handleDeleteConversation = useCallback(
    (conversation: ChatConversation) => {
      if (!tenantId.trim() || isDeletingConversation) return;

      deleteConversation(
        { tenantId, conversationId: conversation.id },
        {
          onSuccess: (res) => {
            const statusCode = res?.status_code ?? 200;
            if (statusCode !== 200 && statusCode !== 204) return;
            onConversationDeleted?.(conversation.id);
          },
        },
      );
    },
    [
      deleteConversation,
      isDeletingConversation,
      onConversationDeleted,
      tenantId,
    ],
  );

  const handleToggleConversationLabel = useCallback(
    (conversation: ChatConversation, label: ConversationLabelOption) => {
      if (!tenantId.trim()) return;

      const hasLabel = conversation.labels.includes(label.title);

      bulkAction({
        tenantId,
        data: {
          type: "Conversation",
          ids: [conversation.id],
          labels: hasLabel ? { remove: [label.title] } : { add: [label.title] },
        },
      });
    },
    [bulkAction, tenantId],
  );

  const renderConversationContextMenuContent = (
    conversation: ChatConversation,
  ) => (
    <ContextMenuContent className={CONTEXT_MENU_CONTENT_CLASSNAME}>
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() =>
          showConversationActionToast(
            "Đã đánh dấu chưa đọc",
            `Cuộc trò chuyện với ${conversation.name} đã được đánh dấu chưa đọc.`,
          )
        }
      >
        <Mail />
        Đánh dấu chưa đọc
      </ContextMenuItem>
      <ContextMenuSeparator className="my-1" />
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() =>
          showConversationActionToast(
            "Đã đánh dấu đã xử lý",
            `Cuộc trò chuyện với ${conversation.name} đã được chuyển sang trạng thái đã xử lý.`,
          )
        }
      >
        <Check />
        Đã xử lý
      </ContextMenuItem>
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() =>
          showConversationActionToast(
            "Đã đánh dấu đang chờ",
            `Cuộc trò chuyện với ${conversation.name} đang ở trạng thái chờ xử lý.`,
          )
        }
      >
        <Clock3 />
        Đánh dấu chờ
      </ContextMenuItem>
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() =>
          showConversationActionToast(
            "Đã tạm ẩn cuộc trò chuyện",
            `Bạn sẽ không nhận làm phiền ngay cho cuộc trò chuyện với ${conversation.name}.`,
          )
        }
      >
        <AlarmClockOff />
        Tạm ẩn
      </ContextMenuItem>
      <ContextMenuSeparator className="my-1" />
      <ContextMenuSub>
        <ContextMenuSubTrigger className={CONTEXT_MENU_SUB_TRIGGER_CLASSNAME}>
          <Tag />
          Gán nhãn
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-40 rounded-lg p-1">
          {labelOptions.length > 0 ? (
            labelOptions.map((label) => {
              const hasLabel = conversation.labels.includes(label.title);

              return (
                <ContextMenuItem
                  key={label.id}
                  disabled={isBulkActionPending}
                  className={CONTEXT_MENU_ITEM_CLASSNAME}
                  onSelect={() =>
                    handleToggleConversationLabel(conversation, label)
                  }
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">
                    {formatConversationLabel(label.title)}
                  </span>
                  {hasLabel && <Check className="size-3.5 text-primary" />}
                </ContextMenuItem>
              );
            })
          ) : (
            <ContextMenuItem disabled className={CONTEXT_MENU_ITEM_CLASSNAME}>
              Chưa có nhãn
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger className={CONTEXT_MENU_SUB_TRIGGER_CLASSNAME}>
          <UserPlus />
          Gán nhân viên
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-44 rounded-lg p-1">
          {availableAgents.length > 0 ? (
            availableAgents.map((agent) => (
              <ContextMenuItem
                key={agent.id}
                className={CONTEXT_MENU_ITEM_CLASSNAME}
                onSelect={() =>
                  showConversationActionToast(
                    `Đã gán cho ${agent.name}`,
                    `Cuộc trò chuyện với ${conversation.name} đã được gán cho ${agent.name}.`,
                  )
                }
              >
                {agent.name}
              </ContextMenuItem>
            ))
          ) : (
            <ContextMenuItem disabled className={CONTEXT_MENU_ITEM_CLASSNAME}>
              Chưa có nhân viên
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator className="my-1" />
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() => handleOpenConversationInNewTab(conversation)}
      >
        <SquareArrowOutUpRight />
        Mở tab mới
      </ContextMenuItem>
      <ContextMenuItem
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        onSelect={() => void handleCopyConversationLink(conversation)}
      >
        <Link2 />
        Sao chép liên kết
      </ContextMenuItem>
      <ContextMenuSeparator className="my-1" />
      <ContextMenuItem
        variant="destructive"
        className={CONTEXT_MENU_ITEM_CLASSNAME}
        disabled={isDeletingConversation || !tenantId.trim()}
        onSelect={() => handleDeleteConversation(conversation)}
      >
        <Trash2 />
        {isDeletingConversation ? "Đang xóa..." : "Xóa cuộc trò chuyện"}
      </ContextMenuItem>
    </ContextMenuContent>
  );

  const renderConversationTabs = () => (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-w-0 shrink-0 border-b px-2 pb-2 pt-2 sm:pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Giải thích tab phân công"
              className="absolute top-2 right-1 z-10 inline-flex items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
            >
              <CircleHelp
                className="size-3.5 bg-primary text-white rounded-full"
                strokeWidth={2.5}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            sideOffset={6}
            className="max-w-64 rounded-md px-2.5 py-2 text-xs leading-relaxed"
          >
            {ASSIGNEE_TABS_HELP}
          </TooltipContent>
        </Tooltip>

        <div className="grid w-full grid-cols-3 gap-1.5 rounded-2xl border border-primary/15 bg-primary/10 p-1.5 pr-6 shadow-inner">
          {TAB_CYCLE.map((tab) => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab];
            const countLabel = count > 99 ? "99+" : String(count);

            return (
              <Tooltip key={tab} delayDuration={3000}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={TAB_LABELS[tab]}
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex h-10 min-w-0 w-full items-center justify-center rounded-xl border px-2 transition-all duration-200",
                      isActive
                        ? [
                            "border-primary/20",
                            "bg-primary/8",
                            "text-primary",
                            "backdrop-blur-sm",
                          ]
                        : [
                            "border-transparent",
                            "text-muted-foreground",
                            "hover:border-border/60",
                            "hover:bg-background/60",
                            "hover:text-foreground",
                          ],
                    )}
                  >
                    <span className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5">
                      <span className="min-w-0 truncate text-xs py-1 font-bold leading-none">
                        {TAB_LABELS[tab]}
                      </span>
                      <span
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none tabular-nums text-white",
                          TAB_COLORS[tab],
                        )}
                      >
                        {countLabel}
                      </span>
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {TAB_LABELS[tab]}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );

  const getOnlineStatus = (conversation: ChatConversation) => {
    if (
      conversation.type === "direct" &&
      conversation.participants.length >= 1
    ) {
      const participantId = conversation.participants[0];
      const user = users.find((u) => u.id === participantId);
      return user?.status === "online";
    }
    return false;
  };
  if (isCollapsed) {
    if (isLoading) {
      return (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="p-2 space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="mx-auto">
                <Skeleton className="size-11 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Compact tab slider for collapsed sidebar */}
        {!hideTabs && (
          <div className="flex items-center justify-between gap-0.5 border-b px-1 py-1.5">
            <button
              type="button"
              aria-label="Tab trước"
              onClick={() => {
                const idx = TAB_CYCLE.indexOf(activeTab);
                setActiveTab(
                  TAB_CYCLE[(idx - 1 + TAB_CYCLE.length) % TAB_CYCLE.length],
                );
              }}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
              >
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white",
                    TAB_COLORS[activeTab],
                  )}
                >
                  {tabCounts[activeTab]}
                </span>
                <span className="truncate text-center text-[9px] leading-none text-muted-foreground">
                  {TAB_LABELS[activeTab]}
                </span>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              aria-label="Tab tiếp theo"
              onClick={() => {
                const idx = TAB_CYCLE.indexOf(activeTab);
                setActiveTab(TAB_CYCLE[(idx + 1) % TAB_CYCLE.length]);
              }}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}

        <TooltipProvider delayDuration={120}>
          <ScrollArea
            className="flex-1 h-0 min-h-0"
            onScrollCapture={handleConversationScroll}
          >
            <div className="p-2 space-y-2">
              {sortedConversations.map((conversation) => (
                <ContextMenu key={conversation.id}>
                  <ContextMenuTrigger asChild>
                    <motion.div
                      ref={(node) =>
                        registerConversationItemRef(conversation.id, node)
                      }
                      className="mx-auto w-fit"
                      data-conversation-id={conversation.id}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectConversation(conversation.id)
                            }
                            className={cn(
                              "flex size-11 items-center justify-center rounded-xl border transition-colors",
                              selectedConversation === conversation.id
                                ? "border-primary bg-primary/10"
                                : "border-transparent hover:bg-accent",
                            )}
                            aria-label={conversation.name}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={conversation.avatar}
                                alt={conversation.name}
                              />
                              <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10">
                                {conversation.type === "group" ? (
                                  <Users className="size-4 text-primary" />
                                ) : (
                                  conversation.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="center"
                          sideOffset={8}
                          className="max-w-56 px-2 py-1 text-[11px]"
                        >
                          {conversation.name}
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  </ContextMenuTrigger>
                  {renderConversationContextMenuContent(conversation)}
                </ContextMenu>
              ))}
              {isLoadingMore && (
                <div className="space-y-2 pt-1">
                  <Skeleton className="mx-auto size-11 rounded-xl" />
                  <Skeleton className="mx-auto size-11 rounded-xl" />
                </div>
              )}
            </div>
          </ScrollArea>
        </TooltipProvider>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b shrink-0">
          <Skeleton className="h-11 w-full min-w-0 rounded-2xl" />
        </div>

        <div className="flex-1 min-h-0 p-2 space-y-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="flex min-w-0 items-center gap-2 p-2 sm:gap-3 sm:p-3 rounded-xl border border-border/50"
            >
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
              <Skeleton className="h-4 w-12 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEmptyByMeta) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:left-3" />
            <Input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-0 pl-8 sm:pl-9 cursor-text text-sm"
              aria-label="Search Conversations"
            />
          </div>
        </div> */}

        {!hideTabs && renderConversationTabs()}
        <div className="flex-1 p-3">
          <EmptyData
            icon={Inbox}
            title="Không có cuộc trò chuyện"
            description="Hiện tại chưa có dữ liệu hội thoại theo bộ lọc đang chọn."
            showButton={false}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Search */}
      {/* <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:left-3" />
          <Input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 pl-8 sm:pl-9 cursor-text text-sm"
            aria-label="Search Conversations"
          />
        </div>
      </div> */}

      {!hideTabs && renderConversationTabs()}

      {/* Conversations */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTabCount === 0 ? (
          <motion.div
            key={`empty-${effectiveTab}`}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="flex-1 p-3"
          >
            <EmptyData
              icon={Inbox}
              title="Không có cuộc trò chuyện"
              description="Hiện tại chưa có dữ liệu hội thoại theo bộ lọc đang chọn."
              showButton={false}
              className="h-full"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`list-${listScrollResetKey ?? effectiveTab}-${searchQuery}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1 h-0 min-h-0"
          >
            <div
              ref={conversationListScrollRef}
              className="h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={handleConversationScroll}
            >
              <div className="space-y-0.5 p-1.5 sm:p-2">
                {sortedConversations.map((conversation) => {
                  const conversationTime = formatConversationTimeParts(
                    conversation.lastMessage.timestamp,
                  );
                  const assigneeAvailableName =
                    conversation.meta?.assignee?.availableName?.trim() ||
                    conversation.meta?.assignee?.name?.trim() ||
                    "";
                  const inboxDisplayName =
                    conversation.inboxId !== undefined &&
                    Number.isFinite(conversation.inboxId)
                      ? (inboxNameById.get(conversation.inboxId) ??
                        "Kênh chưa đặt tên")
                      : conversation.meta?.channel?.trim() ||
                        "Kênh chưa đặt tên";
                  const isSelected = selectedConversation === conversation.id;
                  const hasUnread = conversation.unreadCount > 0 && !isSelected;
                  const visibleLabels = conversation.labels.slice(0, 3);
                  const hiddenLabelCount = Math.max(
                    0,
                    conversation.labels.length - visibleLabels.length,
                  );

                  return (
                    <ContextMenu key={conversation.id}>
                      <ContextMenuTrigger asChild>
                        <motion.div
                          ref={(node) =>
                            registerConversationItemRef(conversation.id, node)
                          }
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          data-conversation-id={conversation.id}
                          className={cn(
                            "group relative flex min-w-0 cursor-pointer items-start gap-2.5 overflow-hidden rounded-xl px-2.5 py-2.5 transition-colors duration-200 sm:gap-3 sm:px-3 sm:py-3",
                            isSelected
                              ? "bg-primary/10 shadow-[inset_3px_0_0_0] shadow-primary"
                              : "hover:bg-accent/60",
                          )}
                          onClick={() =>
                            handleSelectConversation(conversation.id)
                          }
                        >
                          <div className="relative mt-0.5 shrink-0">
                            <Avatar
                              className={cn(
                                "size-11 transition-shadow sm:size-12",
                                isSelected &&
                                  "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                              )}
                            >
                              <AvatarImage
                                src={conversation.avatar}
                                alt={conversation.name}
                              />
                              <AvatarFallback className="bg-linear-to-br from-primary/25 to-primary/10 text-xs font-semibold text-primary">
                                {conversation.type === "group" ? (
                                  <Users className="size-5" />
                                ) : (
                                  conversation.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                )}
                              </AvatarFallback>
                            </Avatar>

                            {conversation.type === "direct" &&
                              getOnlineStatus(conversation) && (
                                <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
                              )}

                            {conversation.type === "group" && (
                              <span className="absolute right-0 bottom-0 flex size-3.5 items-center justify-center rounded-full border-2 border-background bg-sky-500">
                                <Hash className="size-2 text-white" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex min-w-0 items-center gap-1">
                              <h3
                                className={cn(
                                  "min-w-0 flex-1 truncate text-sm leading-5 sm:text-[15px]",
                                  hasUnread
                                    ? "font-bold text-foreground"
                                    : "font-medium text-foreground",
                                )}
                              >
                                {conversation.name}
                              </h3>
                              {conversation.isPinned && (
                                <Pin className="size-3.5 shrink-0 text-foreground/55" />
                              )}
                              {conversation.isMuted && (
                                <VolumeX className="size-3.5 shrink-0 text-foreground/55" />
                              )}
                              {hasUnread && (
                                <span className="relative ml-0.5 inline-flex size-5 shrink-0 items-center justify-center">
                                  <span
                                    aria-hidden
                                    className="absolute inline-flex size-full rounded-full bg-emerald-500/45 animate-ping"
                                  />
                                  <Badge
                                    variant="default"
                                    className="relative z-10 h-5 min-w-5 justify-center rounded-full border-0 bg-emerald-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_0_3px_rgba(16,185,129,0.22)]"
                                  >
                                    {conversation.unreadCount > 99
                                      ? "99+"
                                      : conversation.unreadCount}
                                  </Badge>
                                </span>
                              )}
                            </div>

                            <div className="flex min-w-0 items-center">
                              <MessageSquareReply
                                className={cn(
                                  "size-3.5 shrink-0 mr-1",
                                  hasUnread
                                    ? "text-foreground/70"
                                    : "text-foreground/45",
                                )}
                                aria-hidden
                              />
                              <p
                                className={cn(
                                  "min-w-0 truncate text-[11px] leading-4 sm:text-xs",
                                  hasUnread
                                    ? "font-bold"
                                    : "font-normal text-foreground/65",
                                )}
                              >
                                {conversation.lastMessage.content ||
                                  "Chưa có tin nhắn"}
                              </p>
                              <span
                                className={cn(
                                  hasUnread
                                    ? "text-foreground/50"
                                    : "text-foreground/35",
                                )}
                                aria-hidden
                              >
                                <Dot className="size-3.5 shrink-0" />
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 text-xs pt-0.5 leading-none tabular-nums",
                                  hasUnread
                                    ? "font-bold text-foreground/70"
                                    : "font-medium text-foreground/50",
                                )}
                              >
                                {conversationTime}
                              </span>
                            </div>

                            {(visibleLabels.length > 0 ||
                              inboxDisplayName ||
                              assigneeAvailableName) && (
                              <div className="flex min-w-0 flex-wrap items-center gap-1.5 pt-0.5">
                                {visibleLabels.map((label) => {
                                  const labelColor =
                                    labelColorMap.get(label) ?? "#64748b";
                                  return (
                                    <span
                                      key={`${conversation.id}-${label}`}
                                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap"
                                      style={{
                                        color: labelColor,
                                        backgroundColor: `${labelColor}18`,
                                        boxShadow: `inset 0 0 0 1px ${labelColor}33`,
                                      }}
                                    >
                                      <span
                                        className="size-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: labelColor }}
                                        aria-hidden
                                      />
                                      <span>
                                        {formatConversationLabel(label)}
                                      </span>
                                    </span>
                                  );
                                })}

                                {hiddenLabelCount > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/60">
                                    +{hiddenLabelCount}
                                  </span>
                                )}

                                <span className="ml-auto flex min-w-0 max-w-full items-center gap-2 text-[10px] font-medium text-foreground/55">
                                  <span className="inline-flex min-w-0 items-center gap-1">
                                    <Cast className="size-3 shrink-0 opacity-80" />
                                    <span className="whitespace-nowrap">
                                      {inboxDisplayName}
                                    </span>
                                  </span>
                                  {assigneeAvailableName ? (
                                    <span className="inline-flex min-w-0 items-center gap-1">
                                      <User className="size-3 shrink-0 opacity-80" />
                                      <span className="whitespace-nowrap">
                                        {assigneeAvailableName}
                                      </span>
                                    </span>
                                  ) : null}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </ContextMenuTrigger>

                      {renderConversationContextMenuContent(conversation)}
                    </ContextMenu>
                  );
                })}
                {isLoadingMore && (
                  <div className="space-y-2 px-2 py-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
