"use client";

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  Sidebar as UISidebar,
} from "@/components/ui/sidebar";
import { sidebarData } from "@/constants/sidebar-data";
import { useAuth } from "@/contexts/auth-context";
import { useSidebarConfig } from "@/contexts/sidebar-context";
import {
  formatUnreadBadgeCount,
  useTotalUnread,
} from "@/features/chats/utils/chat-unread-store";
import type { NavGroup } from "@/lib/types";
import React, { useMemo } from "react";
import { NavGroup as NavGroupComponent } from "./nav-group";
import { TeamSwitcher } from "./team-switcher";
import { filterNavGroupsByPermissions } from "@/lib/filter-nav-items";

type AppSidebarProps = React.ComponentProps<typeof UISidebar> & {
  navGroups?: NavGroup[];
};

export default function AppSidebar({
  navGroups = sidebarData.navGroups,
  ...props
}: AppSidebarProps) {
  const { permissions } = useAuth();
  const { config } = useSidebarConfig();
  const totalUnread = useTotalUnread();

  const filteredNavGroups = useMemo(() => {
    return filterNavGroupsByPermissions(navGroups, permissions);
  }, [navGroups, permissions]);

  const navGroupsWithUnreadBadges = useMemo(() => {
    if (totalUnread <= 0) return filteredNavGroups;

    return filteredNavGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if ("url" in item && item.url === "/chats") {
          return {
            ...item,
            badge: formatUnreadBadgeCount(totalUnread),
          };
        }

        if ("items" in item && item.items) {
          return {
            ...item,
            items: item.items.map((subItem) =>
              subItem.url === "/chats"
                ? {
                    ...subItem,
                    badge: formatUnreadBadgeCount(totalUnread),
                  }
                : subItem,
            ),
          };
        }

        return item;
      }),
    }));
  }, [filteredNavGroups, totalUnread]);

  return (
    <UISidebar
      variant={config.variant}
      collapsible={config.collapsible}
      side={config.side}
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroupsWithUnreadBadges.map((nav) => (
          <NavGroupComponent key={nav.title} {...nav} />
        ))}
      </SidebarContent>
      {/* <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar || "",
            }}
          />
        )}
      </SidebarFooter> */}
      {/* <SidebarRail /> */}
    </UISidebar>
  );
}
