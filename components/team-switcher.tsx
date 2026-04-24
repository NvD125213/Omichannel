"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { useListTenantTeams } from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";

type SwitcherTeam = {
  name: string;
  logo: React.ElementType;
  plan: string;
};

const DEFAULT_TEAM: SwitcherTeam = {
  name: "Onmichannel",
  logo: Plus,
  plan: "Mặc định",
};

export function TeamSwitcher() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const { data: tenantTeamsResponse } = useListTenantTeams(tenantId);
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const apiTeams = useMemo<SwitcherTeam[]>(() => {
    const payload = (
      tenantTeamsResponse?.data as
        | { chatwoot?: { payload?: unknown } }
        | undefined
    )?.chatwoot?.payload;
    if (!Array.isArray(payload)) return [];

    return payload.reduce<SwitcherTeam[]>((acc, team) => {
      const teamRecord =
        team && typeof team === "object" && !Array.isArray(team)
          ? (team as Record<string, unknown>)
          : null;
      if (!teamRecord) return acc;
      const teamName =
        typeof teamRecord.name === "string" && teamRecord.name.trim().length > 0
          ? teamRecord.name
          : null;
      if (!teamName) return acc;
      acc.push({
        name: teamName,
        logo: Plus,
        plan: "Mặc định",
      });
      return acc;
    }, []);
  }, [tenantTeamsResponse]);
  const availableTeams = useMemo(
    () => (apiTeams.length > 0 ? apiTeams : [DEFAULT_TEAM]),
    [apiTeams],
  );
  const [activeTeam, setActiveTeam] = useState(availableTeams[0]);

  useEffect(() => {
    if (!availableTeams.length) return;
    setActiveTeam((prev) => {
      if (prev && availableTeams.some((team) => team.name === prev.name)) {
        return prev;
      }
      return availableTeams[0];
    });
  }, [availableTeams]);

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group/team relative overflow-hidden data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Gradient Logo Container */}
              <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/20 transition-transform group-hover/team:scale-105">
                <activeTeam.logo className="size-4 text-white" />
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-lg bg-linear-to-br from-white/20 to-transparent" />
              </div>

              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeTeam.name}
                    </span>
                    <span className="truncate text-xs text-white flex items-center gap-1">
                      {activeTeam.plan}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-white transition-colors group-hover/team:text-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-50"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Teams
            </DropdownMenuLabel>
            {availableTeams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-3 p-2.5 cursor-pointer rounded-lg transition-colors"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                  <team.logo className="size-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.plan}
                  </div>
                </div>
                <DropdownMenuShortcut className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                  ⌘{index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-lg">
              <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50">
                <Plus className="size-4 text-muted-foreground" />
              </div>
              <div className="text-muted-foreground font-medium">
                Thêm nhóm mới
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
