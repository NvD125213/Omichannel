"use client";

import { CommandSearch, SearchTrigger } from "@/components/command-search";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { ToggleTheme } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ChatUnreadNotificationsMenu } from "@/components/chat-unread-notifications-menu";

export function DashboardHeader() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const [commandSearchOpen, setCommandSearchOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const authParam = searchParams.get("auth");
    if (authParam === "success") {
      toast.success("Signed in successfully!", {
        description: "Welcome back to your dashboard.",
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [mounted, searchParams, router]);

  if (!mounted) {
    return (
      <header className="sticky bg-transparent top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 backdrop-blur-xl ml-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 ml-2 grid h-16 shrink-0 grid-cols-[1fr_minmax(0,42rem)_1fr] items-center gap-2 border-b border-border/50 bg-transparent px-4 backdrop-blur-xl">
      <div className="flex items-center">
        <SidebarTrigger className="-ml-1 text-muted-foreground transition-colors hover:text-foreground" />
      </div>

      <div className="w-full px-2">
        <SearchTrigger
          onClick={() => setCommandSearchOpen(true)}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-end gap-1">
        <ChatUnreadNotificationsMenu />
        <ToggleTheme />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setThemeCustomizerOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Mở tùy chỉnh giao diện</span>
        </Button>
        <ThemeCustomizer
          open={themeCustomizerOpen}
          onOpenChange={setThemeCustomizerOpen}
        />
        <div className="mx-2 h-6 w-px bg-border" />
        <ProfileDropdown />
      </div>

      <CommandSearch
        open={commandSearchOpen}
        onOpenChange={setCommandSearchOpen}
      />
    </header>
  );
}
