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

  const filteredNavGroups = useMemo(() => {
    return filterNavGroupsByPermissions(navGroups, permissions);
  }, [navGroups, permissions]);

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
        {filteredNavGroups.map((nav) => (
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
