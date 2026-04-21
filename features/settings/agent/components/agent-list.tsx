"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  EllipsisVertical,
  Inbox,
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
  useUpdateChatwootAgent,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import { AddAgentDialog } from "./add-agent-form";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyData } from "@/components/empty-data";

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
};

const ROLE_LABEL: Record<AgentRole, string> = {
  admin: "Quản trị viên",
  supplier: "Nhà cung cấp",
};

const VERIFY_LABEL: Record<AgentVerification, string> = {
  verified: "Đã xác minh",
  pending: "Đang chờ xác minh",
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
  offline: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
};

const AVATAR_BG = [
  "bg-muted text-foreground",
  "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
];

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
  const name = String(record.name ?? record.available_name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const id =
    String(record.id ?? record.uuid ?? "").trim() ||
    email ||
    `agent-${index + 1}`;

  return {
    id,
    name: name || `Agent ${index + 1}`,
    email: email || "N/A",
    role: rawRole.includes("admin") ? "admin" : "supplier",
    verification: isConfirmed ? "verified" : "pending",
    availability,
  };
}

export default function AgentList() {
  const [query, setQuery] = useState("");
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const {
    data: listAgentsResponse,
    isLoading: isLoadingAgents,
    isFetching: isFetchingAgents,
  } = useListChatwootAgents(tenantId);
  const deleteChatwootAgentMutation = useDeleteChatwootAgent();
  const updateChatwootAgentMutation = useUpdateChatwootAgent();

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
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
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

        <div className="flex shrink-0 items-center gap-3">
          <AddAgentDialog />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {isLoadingAgents ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            Đang tải danh sách đại lý...
          </p>
        ) : filtered.length === 0 ? (
          <div className="py-6">
            <EmptyData
              icon={Inbox}
              title="Không có đại lý"
              description="Chưa có đại lý nào trong hệ thống."
              showButton={false}
            />
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {filtered.map((agent, i) => (
              <li key={agent.id}>
                <div className="flex min-w-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "size-10 rounded-lg sm:size-11",
                        AVATAR_BG[i % AVATAR_BG.length],
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          "rounded-lg font-medium text-sm",
                          AVATAR_BG[i % AVATAR_BG.length],
                        )}
                      >
                        {initials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    {agent.availability === "available" ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                        aria-label="Đang hoạt động"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-snug">
                      {agent.name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-muted-foreground text-xs sm:text-sm"
                      translate="no"
                    >
                      {agent.email}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn("border", ROLE_BADGE_CLASS[agent.role])}
                      >
                        {agent.role === "admin" ? (
                          <ShieldCheck aria-hidden />
                        ) : (
                          <UserRound aria-hidden />
                        )}
                        {ROLE_LABEL[agent.role]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border",
                          VERIFY_BADGE_CLASS[agent.verification],
                        )}
                      >
                        {agent.verification === "verified" ? (
                          <CheckCircle2 aria-hidden />
                        ) : (
                          <Clock3 aria-hidden />
                        )}
                        {VERIFY_LABEL[agent.verification]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border",
                          AVAILABILITY_BADGE_CLASS[agent.availability],
                        )}
                      >
                        {agent.availability === "offline" ? (
                          <XCircle aria-hidden />
                        ) : (
                          <CheckCircle2 aria-hidden />
                        )}
                        {AVAILABILITY_LABEL[agent.availability]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      disabled
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Sửa</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                        >
                          <EllipsisVertical className="size-4" />
                          <span className="sr-only">Hành động</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={
                            updateChatwootAgentMutation.isPending || !tenantId
                          }
                          onClick={() => {
                            updateChatwootAgentMutation.mutate({
                              tenantId,
                              agentId: agent.id,
                              data: {
                                role:
                                  agent.role === "admin"
                                    ? "administrator"
                                    : "agent",
                                availability_status: "available",
                              },
                            });
                          }}
                        >
                          Đặt thành available
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={
                            updateChatwootAgentMutation.isPending || !tenantId
                          }
                          onClick={() => {
                            updateChatwootAgentMutation.mutate({
                              tenantId,
                              agentId: agent.id,
                              data: {
                                role:
                                  agent.role === "admin"
                                    ? "administrator"
                                    : "agent",
                                availability_status: "busy",
                              },
                            });
                          }}
                        >
                          Đặt thành busy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={
                            updateChatwootAgentMutation.isPending || !tenantId
                          }
                          onClick={() => {
                            updateChatwootAgentMutation.mutate({
                              tenantId,
                              agentId: agent.id,
                              data: {
                                role:
                                  agent.role === "admin"
                                    ? "administrator"
                                    : "agent",
                                availability_status: "offline",
                              },
                            });
                          }}
                        >
                          Đặt thành offline
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer"
                          disabled={
                            deleteChatwootAgentMutation.isPending || !tenantId
                          }
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Xóa đại lý “${agent.name}”? Hành động này không thể hoàn tác.`,
                            );
                            if (!confirmed) return;
                            deleteChatwootAgentMutation.mutate({
                              tenantId,
                              agentId: agent.id,
                            });
                          }}
                        >
                          <Trash2 className="size-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {isFetchingAgents && !isLoadingAgents ? (
        <p className="text-muted-foreground text-xs">Đang đồng bộ dữ liệu...</p>
      ) : null}
    </div>
  );
}
