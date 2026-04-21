"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Hash, Pin, Search, Users, VolumeX, Inbox } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMessageTime } from "@/helpers/format-message-time";
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
        new Date(b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.timestamp).getTime()
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
        <div className="p-2 border-b">
          <Select
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "mine" | "unread" | "all")
            }
          >
            <SelectTrigger
              size="sm"
              className="w-full h-8 px-2 text-xs rounded-lg"
              aria-label="Lọc cuộc trò chuyện"
            >
              {activeTab === "all" ? (
                <span className="flex items-center gap-2">
                  {/* <span>Tất cả</span> */}
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabAllCount}
                  </span>
                </span>
              ) : activeTab === "mine" ? (
                <span className="flex items-center gap-2">
                  {/* <span>Dành cho bạn</span> */}
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabMineCount}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {/* <span>Chưa đọc</span> */}
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabUnreadCount}
                  </span>
                </span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span>Tất cả</span>
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabAllCount}
                  </span>
                </span>
              </SelectItem>
              <SelectItem value="mine">
                <span className="flex items-center gap-2">
                  <span>Dành cho bạn</span>
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabMineCount}
                  </span>
                </span>
              </SelectItem>
              <SelectItem value="unread">
                <span className="flex items-center gap-2">
                  <span>Chưa đọc</span>
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold tabular-nums text-white">
                    {tabUnreadCount}
                  </span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 py-3 border-b shrink-0">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        <div className="px-3 pt-3 pb-2 border-b shrink-0">
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>

        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50"
            >
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 cursor-text"
              aria-label="Search Conversations"
            />
          </div>
        </div>

        <div className="px-3 pt-3 pb-2 border-b shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "mine" | "unread" | "all")
            }
            className="w-full"
          >
            <TabsList className="w-full h-11 rounded-2xl bg-primary/10 border border-primary/15 p-1 shadow-inner">
              <TabsTrigger
                value="mine"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground whitespace-nowrap"
              >
                Dành cho bạn
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold tabular-nums text-white">
                  {tabMineCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground whitespace-nowrap"
              >
                Chưa đọc
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold tabular-nums text-white">
                  {tabUnreadCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground whitespace-nowrap"
              >
                Tất cả
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-500 text-xs font-semibold tabular-nums text-white">
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="px-4 py-3 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 cursor-text"
            aria-label="Search Conversations"
          />
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 border-b shrink-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "mine" | "unread" | "all")
          }
          className="w-full"
        >
          <TabsList className="w-full h-11 rounded-2xl bg-primary/10 border border-primary/15 p-1 shadow-inner">
            <TabsTrigger
              value="mine"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            >
              Dành cho bạn
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold tabular-nums text-white">
                {tabMineCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            >
              Chưa đọc
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold tabular-nums text-white">
                {tabUnreadCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            >
              Tất cả
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-500 text-xs font-semibold tabular-nums text-white">
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
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200",
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
                          "h-12 w-12 transition-all",
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
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between mb-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden pr-2">
                          <h3 className="font-medium whitespace-nowrap min-w-0 max-w-[160px] lg:max-w-[180px]">
                            {conversation.name}
                          </h3>
                          {conversation.isPinned && (
                            <Pin className="size-3 text-muted-foreground shrink-0" />
                          )}
                          {conversation.isMuted && (
                            <VolumeX className="size-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                          {formatMessageTime(
                            conversation.lastMessage.timestamp,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <p className="text-sm text-muted-foreground truncate flex-1 min-w-0 max-w-[300px] pr-2">
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
