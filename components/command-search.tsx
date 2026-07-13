"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { sidebarData } from "@/constants/sidebar-data";
import { chatbotSidebarData } from "@/constants/chatbot-sidebar-data";
import { isChatbotPath } from "@/constants/chatbot-routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { filterNavGroupsByPermissions } from "@/lib/filter-nav-items";
import { flattenNavGroupsForSearch } from "@/lib/flatten-nav-for-search";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const { permissions } = useAuth();
  const pathname = usePathname();
  const isChatbot = isChatbotPath(pathname ?? "");

  const groupedItems = React.useMemo(() => {
    const navGroups = isChatbot
      ? chatbotSidebarData.navGroups
      : sidebarData.navGroups;

    const filteredGroups = filterNavGroupsByPermissions(navGroups, permissions);
    const searchItems = flattenNavGroupsForSearch(filteredGroups);

    return searchItems.reduce(
      (acc, item) => {
        if (!acc[item.group]) {
          acc[item.group] = [];
        }
        acc[item.group].push(item);
        return acc;
      },
      {} as Record<string, typeof searchItems>,
    );
  }, [permissions, isChatbot]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm kiếm trang..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        {Object.entries(groupedItems).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.url} asChild value={item.title}>
                  <Link href={item.url} onClick={() => onOpenChange(false)}>
                    <Icon className="mr-2 size-4 text-muted-foreground" />
                    {item.title}
                  </Link>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-9 w-full min-w-56 items-center justify-start gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground sm:pr-12 md:min-w-72 lg:min-w-96",
        className,
      )}
    >
      <Search className="size-4" />
      <span>Tìm kiếm...</span>
    </button>
  );
}
