"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bot,
  CheckCircle2,
  EllipsisVertical,
  Inbox,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDeleteChatwootAgentBot,
  useListTenantChatwootAgentBots,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import {
  AddAgentBotDialog,
  type AddedAgentBotPayload,
} from "./add-agent-bot-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";

type AgentBotItem = {
  id: string;
  name: string;
  description: string;
  outgoingUrl: string;
  avatarUrl: string;
};

function coerceRecords(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractBotRecords(
  response: unknown,
): Record<string, unknown>[] | null {
  const directArray = coerceRecords(response);
  if (directArray) return directArray;
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const directData = coerceRecords(root.data);
  if (directData) return directData;

  const data = root.data as Record<string, unknown> | undefined;
  const agentBots = coerceRecords(data?.agent_bots);
  if (agentBots) return agentBots;

  const payload = coerceRecords(data?.payload);
  if (payload) return payload;

  const nestedData = coerceRecords(data?.data);
  if (nestedData) return nestedData;

  const nestedAgentBots = coerceRecords(
    (data?.data as Record<string, unknown> | undefined)?.agent_bots,
  );
  if (nestedAgentBots) return nestedAgentBots;

  const nestedPayload = coerceRecords(
    (data?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayload) return nestedPayload;

  const chatwootPayload = coerceRecords(
    (data?.messaging as Record<string, unknown> | undefined)?.payload,
  );
  if (chatwootPayload) return chatwootPayload;

  const chatwootAgentBots = coerceRecords(
    (data?.messaging as Record<string, unknown> | undefined)?.agent_bots,
  );
  if (chatwootAgentBots) return chatwootAgentBots;

  const chatwootNestedAgentBots = coerceRecords(
    (
      (data?.messaging as Record<string, unknown> | undefined)?.data as
        | Record<string, unknown>
        | undefined
    )?.agent_bots,
  );
  if (chatwootNestedAgentBots) return chatwootNestedAgentBots;

  return null;
}

function normalizeBot(
  record: Record<string, unknown>,
  index: number,
): AgentBotItem {
  const id =
    String(record.id ?? record.uuid ?? "").trim() || `agent-bot-${index + 1}`;
  const name = String(record.name ?? "").trim() || `Bot ${index + 1}`;
  const description = String(record.description ?? "").trim();
  const outgoingUrl = String(record.outgoing_url ?? "").trim();
  const avatarUrl = String(record.avatar_url ?? "").trim();
  return { id, name, description, outgoingUrl, avatarUrl };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "BT";
}

function filterBots(bots: AgentBotItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return bots;
  return bots.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.outgoingUrl.toLowerCase().includes(q),
  );
}

export default function AgentBotList() {
  const [query, setQuery] = useState("");
  const [editingBot, setEditingBot] = useState<AddedAgentBotPayload | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [pendingDeleteBot, setPendingDeleteBot] = useState<AgentBotItem | null>(
    null,
  );
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const { data, isLoading, isFetching } =
    useListTenantChatwootAgentBots(tenantId);
  const deleteAgentBotMutation = useDeleteChatwootAgentBot();

  const bots = useMemo(() => {
    const records = extractBotRecords(data);
    if (!records || records.length === 0) return [];
    return records.map(normalizeBot);
  }, [data]);

  const filtered = useMemo(() => filterBots(bots, query), [bots, query]);

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Label htmlFor="agent-bot-search" className="sr-only">
            Tìm kiếm bot
          </Label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="agent-bot-search"
            name="agent-bot-search"
            type="search"
            placeholder="Tìm kiếm bot…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full pl-9"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AddAgentBotDialog />
          <AddAgentBotDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingBot(null);
            }}
            editAgentBot={editingBot}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Đang tải danh sách bot...
          </p>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border bg-card py-8 px-6">
            <EmptyData
              icon={Inbox}
              title="Không có agent bot"
              description="Chưa có bot nào trong hệ thống."
              showButton={false}
            />
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {filtered.map((bot) => (
              <li key={bot.id}>
                <div className="flex min-w-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                  <div className="relative shrink-0">
                    <Avatar className="size-10 rounded-lg bg-sky-100 text-sky-900 sm:size-11 dark:bg-sky-950/40 dark:text-sky-100">
                      <AvatarFallback className="rounded-lg font-medium text-sm">
                        {bot.avatarUrl ? (
                          <img
                            src={bot.avatarUrl}
                            alt={bot.name}
                            className="size-full rounded-lg object-cover"
                          />
                        ) : (
                          initials(bot.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-snug">
                      {bot.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                      {bot.description || "Không có mô tả"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
                      >
                        <Bot className="size-3.5" aria-hidden />
                        Agent Bot
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        Hoạt động
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => {
                        setEditingBot({
                          id: bot.id,
                          name: bot.name,
                          description: bot.description,
                          avatar_url: bot.avatarUrl,
                          outgoing_url: bot.outgoingUrl,
                        });
                        setIsEditDialogOpen(true);
                      }}
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
                          variant="destructive"
                          className="cursor-pointer"
                          disabled={
                            deleteAgentBotMutation.isPending || !tenantId
                          }
                          onClick={() => setPendingDeleteBot(bot)}
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

      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground">Đang đồng bộ dữ liệu...</p>
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDeleteBot)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBot(null);
        }}
        title="Xác nhận xóa bot"
        description={`Xóa bot “${pendingDeleteBot?.name ?? ""}”? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="destructive"
        loading={deleteAgentBotMutation.isPending}
        onConfirm={() => {
          if (!pendingDeleteBot || !tenantId) return;
          deleteAgentBotMutation.mutate(
            {
              tenantId,
              botId: pendingDeleteBot.id,
            },
            {
              onSuccess: () => setPendingDeleteBot(null),
            },
          );
        }}
      />
    </div>
  );
}
