"use client";

import { RouteLoadingScreen } from "@/components/route-loading-screen";
import { AUTH_RECOVER_SESSION_KEY } from "@/constants/auth-navigation";
import { useGraphAccess } from "@/hooks/use-graph-id";
import { hardRedirect } from "@/lib/hard-redirect";
import { useLayoutEffect } from "react";

export function ChatbotGraphGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasGraphAccess, isAuthPending } = useGraphAccess();

  useLayoutEffect(() => {
    if (isAuthPending || hasGraphAccess) return;

    try {
      sessionStorage.setItem(AUTH_RECOVER_SESSION_KEY, "1");
    } catch {
      // ignore
    }

    hardRedirect("/not-found");
  }, [hasGraphAccess, isAuthPending]);

  if (isAuthPending) {
    return <RouteLoadingScreen message="Đang xác thực phiên đăng nhập..." />;
  }

  if (!hasGraphAccess) {
    return <RouteLoadingScreen message="Đang chuyển hướng..." />;
  }

  return <>{children}</>;
}
