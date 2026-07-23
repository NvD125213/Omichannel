"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  CheckCircle2,
  Clock3,
  EllipsisVertical,
  Inbox,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDeleteChatwootAgent,
  useListChatwootAgents,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import { AddAgentDialog } from "./add-agent-form";

export type AgentRole = "admin" | "supplier";
export type AgentVerification = "verified" | "pending";
export type AgentAvailability = "available" | "busy" | "offline";

export type AgentItem = {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  verification: AgentVerification;
  availability: AgentAvailability;
  thumbnail?: string;
};

const ROLE_LABEL: Record<AgentRole, string> = {
  admin: "Quản trị viên",
  supplier: "Nhân viên hỗ trợ",
};

const VERIFY_LABEL: Record<AgentVerification, string> = {
  verified: "Đã xác minh",
  pending: "Chờ xác minh",
};

const AVAILABILITY_LABEL: Record<AgentAvailability, string> = {
  available: "Sẵn sàng",
  busy: "Bận",
  offline: "Offline",
};

const ROLE_BADGE_CLASS: Record<AgentRole, string> = {
  admin:
    "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
  supplier:
    "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
};

const VERIFY_BADGE_CLASS: Record<AgentVerification, string> = {
  verified:
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending:
    "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
};

const AVAILABILITY_BADGE_CLASS: Record<AgentAvailability, string> = {
  available:
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  busy: "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300",
  offline:
    "border-red-200 bg-red-100 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function filterAgents(agents: AgentItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return agents;
  return agents.filter(
    (a) =>
      a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
  );
}

function coerceRecords(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractAgentRecords(
  response: unknown,
): Record<string, unknown>[] | null {
  const directArray = coerceRecords(response);
  if (directArray) return directArray;
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const directData = coerceRecords(root.data);
  if (directData) return directData;

  const data = root.data as Record<string, unknown> | undefined;
  const payload = coerceRecords(data?.payload);
  if (payload) return payload;

  const agents = coerceRecords(data?.agents);
  if (agents) return agents;

  const nestedData = coerceRecords(data?.data);
  if (nestedData) return nestedData;

  const nestedPayload = coerceRecords(
    (data?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayload) return nestedPayload;

  const chatwootPayload = coerceRecords(
    (data?.chatwoot as Record<string, unknown> | undefined)?.payload,
  );
  if (chatwootPayload) return chatwootPayload;

  const chatwootNestedPayload = coerceRecords(
    (
      (data?.chatwoot as Record<string, unknown> | undefined)?.data as
        | Record<string, unknown>
        | undefined
    )?.payload,
  );
  if (chatwootNestedPayload) return chatwootNestedPayload;

  return null;
}

function normalizeAgent(
  record: Record<string, unknown>,
  index: number,
): AgentItem {
  const rawRole = String(record.role ?? "").toLowerCase();
  const rawStatus = String(record.availability_status ?? "").toLowerCase();
  const availability: AgentAvailability =
    rawStatus === "busy"
      ? "busy"
      : rawStatus === "offline"
        ? "offline"
        : "available";
  const isConfirmed = Boolean(record.confirmed);
  const name = String(record.available_name ?? record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const id =
    String(record.id ?? record.uuid ?? "").trim() ||
    email ||
    `agent-${index + 1}`;
  const thumbnail = String(
    record.thumbnail ?? record.avatar_url ?? record.avatarUrl ?? "",
  ).trim();

  return {
    id,
    name: name || `Agent ${index + 1}`,
    email: email || "N/A",
    role: rawRole.includes("admin") ? "admin" : "supplier",
    verification: isConfirmed ? "verified" : "pending",
    availability,
    thumbnail: thumbnail || undefined,
  };
}

function AgentListSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="border py-2">
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-32 max-w-full" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-3 w-40 max-w-full" />
            <Skeleton className="h-8 w-full" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AgentList() {
  const [query, setQuery] = useState("");
  const [editingAgent, setEditingAgent] = useState<AgentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [pendingDeleteAgent, setPendingDeleteAgent] =
    useState<AgentItem | null>(null);
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const {
    data: listAgentsResponse,
    isLoading: isLoadingAgents,
    isFetching: isFetchingAgents,
  } = useListChatwootAgents(tenantId);
  const deleteChatwootAgentMutation = useDeleteChatwootAgent();

  const agents = useMemo(() => {
    const records = extractAgentRecords(listAgentsResponse);
    if (!records || records.length === 0) return [];
    return records.map(normalizeAgent);
  }, [listAgentsResponse]);

  const filtered = useMemo(() => filterAgents(agents, query), [agents, query]);

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Label htmlFor="agent-search" className="sr-only">
            Tìm kiếm nhân viên
          </Label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="agent-search"
            name="agent-search"
            type="search"
            placeholder="Tìm kiếm nhân viên…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full pl-9"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AddAgentDialog />
          <AddAgentDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingAgent(null);
            }}
            editAgent={
              editingAgent
                ? {
                    id: editingAgent.id,
                    name: editingAgent.name,
                    email: editingAgent.email,
                    role: editingAgent.role,
                  }
                : null
            }
          />
        </div>
      </div>

      <div>
        {isLoadingAgents ? (
          <AgentListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-md border bg-card py-8">
            <EmptyData
              icon={Inbox}
              title={
                query.trim() ? "Không tìm thấy nhân viên" : "Chưa có nhân viên"
              }
              description={
                query.trim()
                  ? "Thử đổi từ khóa tìm kiếm hoặc thêm nhân viên mới."
                  : "Thêm nhân viên hỗ trợ để bắt đầu tiếp nhận và trả lời tin nhắn."
              }
              showButton={false}
            />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((agent) => (
              <Card
                key={agent.id}
                className="relative overflow-hidden border py-2"
              >
                <div className="space-y-2.5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative shrink-0">
                        <Avatar className="size-9 rounded-lg border border-border/60 bg-muted">
                          {agent.thumbnail ? (
                            <AvatarImage
                              src={agent.thumbnail}
                              alt={agent.name}
                              className="rounded-lg object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-muted font-medium text-xs text-foreground">
                            {initials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card",
                            agent.availability === "available" &&
                              "bg-emerald-500",
                            agent.availability === "busy" && "bg-orange-500",
                            agent.availability === "offline" && "bg-slate-400",
                          )}
                          aria-label={AVAILABILITY_LABEL[agent.availability]}
                        />
                      </div>
                      <span className="truncate text-sm font-semibold">
                        {agent.name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingAgent(agent);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Sửa</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <EllipsisVertical className="size-3.5" />
                            <span className="sr-only">Hành động</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={
                              deleteChatwootAgentMutation.isPending || !tenantId
                            }
                            onClick={() => setPendingDeleteAgent(agent)}
                          >
                            <Trash2 className="size-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                    <p
                      className="truncate text-xs text-muted-foreground"
                      translate="no"
                    >
                      {agent.email}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlignLeft className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {ROLE_LABEL[agent.role]} -{" "}
                      {VERIFY_LABEL[agent.verification]}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium",
                        ROLE_BADGE_CLASS[agent.role],
                      )}
                    >
                      {agent.role === "admin" ? (
                        <ShieldCheck className="size-3" aria-hidden />
                      ) : (
                        <UserRound className="size-3" aria-hidden />
                      )}
                      {ROLE_LABEL[agent.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium",
                        VERIFY_BADGE_CLASS[agent.verification],
                      )}
                    >
                      {agent.verification === "verified" ? (
                        <CheckCircle2 className="size-3" aria-hidden />
                      ) : (
                        <Clock3 className="size-3" aria-hidden />
                      )}
                      {VERIFY_LABEL[agent.verification]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium",
                        AVAILABILITY_BADGE_CLASS[agent.availability],
                      )}
                    >
                      {agent.availability === "offline" ? (
                        <XCircle className="size-3" aria-hidden />
                      ) : (
                        <CheckCircle2 className="size-3" aria-hidden />
                      )}
                      {AVAILABILITY_LABEL[agent.availability]}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isFetchingAgents && !isLoadingAgents ? (
        <p className="text-xs text-muted-foreground">Đang đồng bộ dữ liệu...</p>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteAgent)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAgent(null);
        }}
        title="Xác nhận xóa nhân viên"
        description={`Xóa nhân viên “${pendingDeleteAgent?.name ?? ""}”? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="destructive"
        loading={deleteChatwootAgentMutation.isPending}
        onConfirm={() => {
          if (!pendingDeleteAgent || !tenantId) return;
          deleteChatwootAgentMutation.mutate(
            {
              tenantId,
              agentId: pendingDeleteAgent.id,
            },
            {
              onSuccess: () => setPendingDeleteAgent(null),
            },
          );
        }}
      />
    </div>
  );
}
