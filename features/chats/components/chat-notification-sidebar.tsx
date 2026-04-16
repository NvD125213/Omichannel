"use client";

import {
  ChevronDown,
  CircleDot,
  FolderKanban,
  Inbox,
  MessageCircle,
  ShieldAlert,
  AtSignIcon,
  Store,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Giá trị filter sẽ map vào query `conversation_type` */
export type ConversationSidebarAssigneeFilter = "me" | "mention" | "unattended";

const menuItems = [
  {
    title: "Hộp thư",
    icon: Inbox,
    url: "#",
    isActive: true,
  },
  {
    title: "Cuộc trò chuyện",
    icon: MessageCircle,
    url: "#",
    isActive: false,
  },
  {
    title: "Kênh",
    icon: FolderKanban,
    url: "#",
    isActive: false,
  },
];

const conversationSubItems: {
  name: string;
  icon: LucideIcon;
  assignee: ConversationSidebarAssigneeFilter;
}[] = [
  { name: "Tất cả", icon: CircleDot, assignee: "me" },
  { name: "Nhắn đến", icon: AtSignIcon, assignee: "mention" },
  { name: "Không giám sát", icon: ShieldAlert, assignee: "unattended" },
];

const channelSubItems = [
  { name: "Chatbot", icon: Store, url: "#" },
  { name: "Zalo OA", icon: MessageCircle, url: "#" },
];

interface ChatNotificationSidebarProps {
  isCollapsed: boolean;
  sidebarConversationAssignee: ConversationSidebarAssigneeFilter;
  isSwitchingMenu?: boolean;
  onSidebarConversationAssigneeChange: (
    value: ConversationSidebarAssigneeFilter,
  ) => void;
}

export function ChatNotificationSidebar({
  isCollapsed,
  sidebarConversationAssignee,
  isSwitchingMenu = false,
  onSidebarConversationAssigneeChange,
}: ChatNotificationSidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-background text-foreground transition-all duration-200 overflow-visible w-full",
      )}
    >
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <section className="space-y-1" aria-label="Main Chat Menu">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={menuItems[0].url}
                className={cn(
                  "flex h-9 items-center rounded-md text-sm transition-colors bg-accent text-accent-foreground font-medium",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-2",
                )}
              >
                <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">Hộp thư</span>}
              </a>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Hộp thư</TooltipContent>
            )}
          </Tooltip>

          <Collapsible defaultOpen>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "group flex h-9 w-full items-center rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed
                      ? "justify-center px-0"
                      : "justify-between px-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center truncate",
                      isCollapsed ? "justify-center" : "gap-3",
                    )}
                  >
                    <MessageCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {!isCollapsed && "Cuộc trò chuyện"}
                  </span>
                  {!isCollapsed && (
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </CollapsibleTrigger>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Cuộc trò chuyện</TooltipContent>
              )}
            </Tooltip>
            <CollapsibleContent
              className={cn(
                "mt-1 space-y-1",
                !isCollapsed && "pl-4",
                isCollapsed && "hidden",
              )}
            >
              {conversationSubItems.map((subItem) => {
                const isActive =
                  sidebarConversationAssignee === subItem.assignee;
                return (
                  <Tooltip key={subItem.name}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          onSidebarConversationAssigneeChange(subItem.assignee)
                        }
                        disabled={
                          isSwitchingMenu ||
                          sidebarConversationAssignee === subItem.assignee
                        }
                        className={cn(
                          "relative flex h-8 w-full items-center rounded-md text-sm transition-colors text-left disabled:pointer-events-none",
                          isActive
                            ? "text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          isSwitchingMenu && "opacity-80",
                          isCollapsed ? "justify-center px-0" : "gap-2 px-2",
                        )}
                        aria-pressed={isActive}
                        aria-label={subItem.name}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="conversation-sidebar-active-item"
                            transition={{
                              type: "spring",
                              stiffness: 360,
                              damping: 32,
                            }}
                            className="absolute inset-0 rounded-md bg-accent"
                            aria-hidden="true"
                          />
                        )}
                        <subItem.icon
                          className="relative z-10 h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {!isCollapsed && (
                          <span className="relative z-10 truncate">
                            {subItem.name}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {subItem.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "group flex h-9 w-full items-center rounded-md px-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed
                      ? "justify-center px-0"
                      : "justify-between px-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center truncate",
                      isCollapsed ? "justify-center" : "gap-3",
                    )}
                  >
                    <FolderKanban
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {!isCollapsed && "Kênh"}
                  </span>
                  {!isCollapsed && (
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </CollapsibleTrigger>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Kênh</TooltipContent>
              )}
            </Tooltip>
            <CollapsibleContent
              className={cn(
                "mt-1 space-y-1",
                !isCollapsed && "pl-4",
                isCollapsed && "hidden",
              )}
            >
              {channelSubItems.map((channel) => (
                <Tooltip key={channel.name}>
                  <TooltipTrigger asChild>
                    <a
                      href={channel.url}
                      className={cn(
                        "flex h-8 items-center rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                        isCollapsed ? "justify-center px-0" : "gap-2 px-2",
                      )}
                    >
                      <channel.icon
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <span className="truncate">{channel.name}</span>
                      )}
                    </a>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{channel.name}</TooltipContent>
                  )}
                </Tooltip>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>
      </div>
    </aside>
  );
}
