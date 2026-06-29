"use client";

import { useAuth } from "@/contexts/auth-context";

export function hasGraphId(graphId?: string | null): graphId is string {
  return typeof graphId === "string" && graphId.trim().length > 0;
}

export function useGraphId() {
  const { user } = useAuth();
  return user?.graph_id ?? "";
}

export function useGraphAccess() {
  const { user, isAuthPending } = useAuth();

  return {
    hasGraphAccess: hasGraphId(user?.graph_id),
    graphId: user?.graph_id ?? "",
    isAuthPending,
  };
}
