"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  Pin,
  Search,
  Users,
  VolumeX,
  Inbox,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const TAB_CYCLE: Array<"mine" | "unread" | "all"> = ["mine", "unread", "all"];
const TAB_COLORS: Record<string, string> = {
  mine: "bg-red-500",
  unread: "bg-amber-500",
  all: "bg-green-500",
};
const TAB_LABELS: Record<string, string> = {
  mine: "Cho bạn",
  unread: "Chưa đọc",
  all: "Tất cả",
};
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMessageTime, getTime } from "@/helpers/format-message-time";
import { cn } from "@/lib/utils";
import type { TenantConversationsListMeta } from "@/services/chatwoot/interface";
import type { ChatConversation, ChatUser } from "../utils/types";
import { useChat } from "../utils/use-chat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationListProps {
  conversations: ChatConversation[];
  users: ChatUser[];
  selectedConversation: string | null;
  isCollapsed?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  /** Meta từ GET conversations (mine_count, all_count, …) */
  conversationsMeta?: TenantConversationsListMeta | null;
  onLoadMore?: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function ChatConversationList({
  conversations,
  users,
  selectedConversation,
  isCollapsed = false,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  conversationsMeta = null,
  onLoadMore,
  onSelectConversation,
}: ConversationListProps) {
  const { searchQuery, setSearchQuery } = useChat();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<"mine" | "unread" | "all">("all");
  const SCROLL_BOTTOM_THRESHOLD = 100;

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
      conversations.filter((conversation) => conversation.type === "direct"),
    [conversations],
  );
  const unreadConversations = useMemo(
    () => conversations.filter((conversation) => conversation.unreadCount > 0),
    [conversations],
  );

  const tabMineCount =
    conversationsMeta?.mine_count ?? mineConversations.length;

  /** Meta Chatwoot không có unread_count — giữ đếm từ mock/local */
  const tabUnreadCount = unreadConversations.length;
  const tabAllCount = conversationsMeta?.all_count ?? conversations.length;
  const isEmptyByMeta = conversationsMeta?.all_count === 0;
  const activeTabCount =
    activeTab === "mine"
      ? tabMineCount
      : activeTab === "unread"
        ? tabUnreadCount
        : tabAllCount;

  const sortedConversations = useMemo(() => {
    const tabFilteredConversations = conversations.filter((conversation) => {
      if (activeTab === "mine") return conversation.type === "direct";
      if (activeTab === "unread") return conversation.unreadCount > 0;
      return true;
    });

    const searchFilteredConversations = tabFilteredConversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return [...searchFilteredConversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      return (
        getTime(b.lastMessage.timestamp) - getTime(a.lastMessage.timestamp)
      );
    });
  }, [activeTab, conversations, searchQuery]);

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
                {activeTab === "mine"
                  ? tabMineCount
                  : activeTab === "unread"
                    ? tabUnreadCount
                    : tabAllCount}
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

        <ScrollArea
          className="flex-1 h-0 min-h-0"
          onScrollCapture={handleConversationScroll}
        >
          <div className="p-2 space-y-2">
            {sortedConversations.map((conversation) => (
              <Tooltip key={conversation.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className={cn(
                      "mx-auto flex size-11 items-center justify-center rounded-xl border transition-colors",
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
                <TooltipContent side="right">
                  {conversation.name}
                </TooltipContent>
              </Tooltip>
            ))}
            {isLoadingMore && (
              <div className="space-y-2 pt-1">
                <Skeleton className="mx-auto size-11 rounded-xl" />
                <Skeleton className="mx-auto size-11 rounded-xl" />
              </div>
            )}
          </div>
        </ScrollArea>
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
        <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
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
        </div>

        <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b shrink-0 min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "mine" | "unread" | "all")
            }
            className="w-full"
          >
            <TabsList className="grid w-full min-h-11 grid-cols-3 gap-1 rounded-2xl bg-primary/10 border border-primary/15 p-1 shadow-inner">
              <TabsTrigger
                value="mine"
                className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
              >
                <span className="truncate text-center">Cho bạn</span>
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                  {tabMineCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
              >
                <span className="truncate text-center">Chưa đọc</span>
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                  {tabUnreadCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
              >
                <span className="truncate text-center">Tất cả</span>
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                  {tabAllCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
      <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
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
      </div>

      <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b shrink-0 min-w-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "mine" | "unread" | "all")
          }
          className="w-full"
        >
          <TabsList className="grid w-full min-h-11 grid-cols-3 gap-1 rounded-2xl bg-primary/10 border border-primary/15 p-1 shadow-inner">
            <TabsTrigger
              value="mine"
              className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
            >
              <span className="truncate text-center">Cho bạn</span>
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                {tabMineCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
            >
              <span className="truncate text-center">Chưa đọc</span>
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                {tabUnreadCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground sm:flex-row sm:gap-1 sm:px-2 sm:py-1.5 sm:text-xs min-w-0"
            >
              <span className="truncate text-center">Tất cả</span>
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[9px] font-semibold tabular-nums text-white sm:size-5 sm:text-[11px]">
                {tabAllCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTabCount === 0 ? (
          <motion.div
            key={`empty-${activeTab}`}
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
            key={`list-${activeTab}-${searchQuery}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1 h-0 min-h-0"
          >
            <div
              className="h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={handleConversationScroll}
            >
              <div className="p-2 space-y-1">
                {sortedConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={cn(
                      "flex min-w-0 items-center gap-2 p-2 sm:gap-3 sm:p-3 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200",
                      selectedConversation === conversation.id
                        ? "bg-primary/10 text-accent-foreground shadow-sm"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative shrink-0">
                      <Avatar
                        className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 transition-all",
                          selectedConversation === conversation.id &&
                            "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                      >
                        <AvatarImage
                          src={conversation.avatar}
                          alt={conversation.name}
                        />
                        <AvatarFallback className="text-sm bg-linear-to-br from-primary/20 to-primary/10">
                          {conversation.type === "group" ? (
                            <Users className="size-5 text-primary" />
                          ) : (
                            conversation.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* Online indicator for direct messages */}
                      {conversation.type === "direct" &&
                        getOnlineStatus(conversation) && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                        )}

                      {/* Group indicator */}
                      {conversation.type === "group" && (
                        <div className="absolute bottom-0 right-0 size-4 bg-blue-500 border-2 border-background rounded-full flex items-center justify-center">
                          <Hash className="size-2 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                          <h3 className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                            {conversation.name}
                          </h3>
                          {conversation.isPinned && (
                            <Pin className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          {conversation.isMuted && (
                            <VolumeX className="size-3 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground tabular-nums sm:text-xs">
                          {formatMessageTime(
                            conversation.lastMessage.timestamp,
                          )}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate pr-1 text-xs text-muted-foreground sm:text-sm">
                          {conversation.lastMessage.content}
                        </p>

                        {/* Unread count */}
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="min-w-[20px] h-5 text-xs cursor-pointer shrink-0"
                          >
                            {conversation.unreadCount > 99
                              ? "99+"
                              : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoadingMore && (
                  <div className="px-2 py-3 space-y-2">
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
