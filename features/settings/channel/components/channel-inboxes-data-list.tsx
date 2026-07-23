"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  Eye,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { IconMoodEmpty } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useListTenantInboxes } from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import { cn } from "@/lib/utils";

export interface ChannelInboxItem {
  id: string;
  name: string;
  avatarUrl?: string;
  channelType: string;
  channelTypeLabel: string;
  websiteUrl?: string;
  email?: string;
  enableAutoAssignment: boolean;
  greetingEnabled: boolean;
  workingHoursEnabled: boolean;
  status: "active" | "inactive";
  timezone?: string;
  provider?: string;
}

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  "Channel::Api": "API",
  "Channel::WebWidget": "Web Widget",
  "Channel::FacebookPage": "Facebook",
  "Channel::Whatsapp": "WhatsApp",
  "Channel::TwilioSms": "SMS",
  "Channel::Sms": "SMS",
  "Channel::Email": "Email",
  "Channel::Telegram": "Telegram",
  "Channel::Line": "LINE",
  "Channel::Instagram": "Instagram",
};

const CHANNEL_TYPE_COLORS: Record<string, string> = {
  "Channel::Api":
    "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  "Channel::WebWidget":
    "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  "Channel::FacebookPage":
    "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  "Channel::Whatsapp":
    "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  "Channel::TwilioSms":
    "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "Channel::Sms":
    "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "Channel::Email":
    "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  "Channel::Telegram":
    "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  "Channel::Line":
    "bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400",
  "Channel::Instagram":
    "bg-pink-500/15 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
};

function coerceObjectArray(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractInboxRecords(response: unknown): Record<string, unknown>[] {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;

  return (
    coerceObjectArray(data?.payload) ??
    coerceObjectArray(data?.inboxes) ??
    coerceObjectArray(
      (data?.chatwoot as Record<string, unknown> | undefined)?.payload,
    ) ??
    coerceObjectArray(data) ??
    []
  );
}

function formatChannelType(channelType: string): string {
  if (!channelType) return "Khác";
  return (
    CHANNEL_TYPE_LABELS[channelType] ??
    channelType.replace(/^Channel::/, "").replace(/([a-z])([A-Z])/g, "$1 $2")
  );
}

function readOptionalString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeStatus(raw: Record<string, unknown>): "active" | "inactive" {
  const status = String(raw.status ?? raw.state ?? "")
    .trim()
    .toLowerCase();
  if (
    status === "inactive" ||
    status === "disabled" ||
    status === "archived" ||
    raw.enabled === false ||
    raw.active === false
  ) {
    return "inactive";
  }
  return "active";
}

function normalizeInbox(
  raw: Record<string, unknown>,
  index: number,
): ChannelInboxItem | null {
  const id = String(raw.id ?? "").trim();
  const name = String(raw.name ?? "").trim();
  if (!id && !name) return null;

  const channelType = String(raw.channel_type ?? "").trim();
  const avatarUrl = readOptionalString(raw.avatar_url);
  const websiteUrl = readOptionalString(
    raw.website_url,
    raw.allowed_domains,
    raw.callback_webhook_url,
  );
  const email = readOptionalString(
    raw.email,
    raw.forward_to_email,
    raw.imap_email,
    raw.smtp_email,
  );
  const timezone = readOptionalString(raw.timezone);
  const provider = readOptionalString(raw.provider);

  return {
    id: id || `inbox-${index + 1}`,
    name: name || `Kênh ${index + 1}`,
    ...(avatarUrl ? { avatarUrl } : {}),
    channelType,
    channelTypeLabel: formatChannelType(channelType),
    ...(websiteUrl ? { websiteUrl } : {}),
    ...(email ? { email } : {}),
    enableAutoAssignment: raw.enable_auto_assignment === true,
    greetingEnabled: raw.greeting_enabled === true,
    workingHoursEnabled: raw.working_hours_enabled === true,
    status: normalizeStatus(raw),
    ...(timezone ? { timezone } : {}),
    ...(provider ? { provider } : {}),
  };
}

function inboxInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function FeatureStatusRow({
  enabled,
  icon: Icon,
  label,
}: {
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 font-medium",
          enabled
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground/70",
        )}
      >
        {enabled ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        {enabled ? "Bật" : "Tắt"}
      </span>
    </div>
  );
}

function MetaLine({
  icon: Icon,
  value,
  emptyLabel,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  emptyLabel: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          value ? iconClassName : "text-muted-foreground/40",
        )}
      />
      {value ? (
        <span className="truncate text-foreground/80">{value}</span>
      ) : (
        <span className="truncate italic text-muted-foreground/50">
          {emptyLabel}
        </span>
      )}
    </div>
  );
}

function ChannelInboxesSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border py-2">
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36 max-w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InboxDetailDialog({
  inbox,
  open,
  onOpenChange,
}: {
  inbox: ChannelInboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!inbox) return null;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Tên inbox", value: inbox.name },
    { label: "Loại kênh", value: inbox.channelTypeLabel },
    { label: "Website / Domain", value: inbox.websiteUrl || "—" },
    { label: "Email", value: inbox.email || "—" },
    {
      label: "Auto Assignment",
      value: inbox.enableAutoAssignment ? "Bật" : "Tắt",
    },
    {
      label: "Working Hours",
      value: inbox.workingHoursEnabled ? "Bật" : "Tắt",
    },
    { label: "Greeting", value: inbox.greetingEnabled ? "Bật" : "Tắt" },
    {
      label: "Trạng thái",
      value: inbox.status === "active" ? "Active" : "Inactive",
    },
    ...(inbox.timezone ? [{ label: "Timezone", value: inbox.timezone }] : []),
    ...(inbox.provider ? [{ label: "Provider", value: inbox.provider }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Avatar className="size-9 rounded-lg border border-border/60">
              {inbox.avatarUrl ? (
                <AvatarImage
                  src={inbox.avatarUrl}
                  alt={inbox.name}
                  className="rounded-lg object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-lg">
                <MessageCircle className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{inbox.name}</span>
          </DialogTitle>
          <DialogDescription>Chi tiết kênh kết nối Chatwoot.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 border-b border-border/50 py-2 last:border-b-0"
            >
              <span className="shrink-0 text-xs text-muted-foreground">
                {row.label}
              </span>
              <span className="text-right text-sm font-medium break-all">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ChannelInboxesDataList() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewingInbox, setViewingInbox] = useState<ChannelInboxItem | null>(
    null,
  );
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";

  const { data, isLoading, isFetching } = useListTenantInboxes(tenantId);

  const inboxes = useMemo(
    () =>
      extractInboxRecords(data)
        .map((raw, index) => normalizeInbox(raw, index))
        .filter((item): item is ChannelInboxItem => item !== null),
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inboxes;
    return inboxes.filter((item) => {
      const haystack = [
        item.name,
        item.channelTypeLabel,
        item.channelType,
        item.websiteUrl,
        item.email,
        item.provider,
        item.timezone,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inboxes, query]);

  const handleEdit = (inbox: ChannelInboxItem) => {
    router.push(`/settings/channel/${inbox.id}/edit`);
  };

  const handleDelete = () => {
    toast.info("Chức năng xóa kênh đang được phát triển");
  };

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md px-1">
          <Label htmlFor="channel-inbox-search" className="sr-only">
            Tìm kiếm kênh
          </Label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="channel-inbox-search"
            type="search"
            placeholder="Tìm theo tên, loại kênh, website, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full pl-9 border border-border rounded-md"
          />
        </div>
      </div>

      {isLoading ? (
        <ChannelInboxesSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-70 items-center justify-center rounded-xl border border-dashed p-10 text-center animate-in fade-in-50">
          <EmptyData
            icon={IconMoodEmpty}
            title={query.trim() ? "Không tìm thấy kênh" : "Chưa có kênh nào"}
            description={
              query.trim()
                ? "Thử đổi từ khóa tìm kiếm."
                : "Các kênh Chatwoot (inbox) sẽ hiển thị tại đây khi được kết nối."
            }
            showButton={false}
            buttonText=""
            onButtonClick={() => {}}
          />
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((inbox) => {
              const typeColor =
                CHANNEL_TYPE_COLORS[inbox.channelType] ??
                "bg-muted text-muted-foreground";
              const isActive = inbox.status === "active";

              return (
                <Card
                  key={inbox.id}
                  className="relative overflow-hidden border py-2"
                >
                  <div className="flex h-full flex-col space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="relative shrink-0">
                          <Avatar className="size-9 rounded-lg border border-border/60 bg-muted">
                            {inbox.avatarUrl ? (
                              <AvatarImage
                                src={inbox.avatarUrl}
                                alt={inbox.name}
                                className="rounded-lg object-cover"
                              />
                            ) : null}
                            <AvatarFallback
                              className={cn(
                                "rounded-lg text-xs font-medium",
                                typeColor,
                              )}
                            >
                              {inbox.avatarUrl ? (
                                inboxInitials(inbox.name)
                              ) : (
                                <MessageCircle className="size-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card",
                              isActive ? "bg-emerald-500" : "bg-rose-400",
                            )}
                            title={isActive ? "Active" : "Inactive"}
                            aria-label={isActive ? "Active" : "Inactive"}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {inbox.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {inbox.channelTypeLabel}
                            {inbox.provider ? ` · ${inbox.provider}` : ""}
                            <span className="text-muted-foreground/40">
                              {" "}
                              ·{" "}
                            </span>
                            <span
                              className={cn(
                                isActive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-500 dark:text-rose-400",
                              )}
                            >
                              {isActive ? "Hoạt động" : "Không hoạt động"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={() => setViewingInbox(inbox)}
                            >
                              <Eye className="size-3.5" />
                              <span className="sr-only">Xem</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(inbox)}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Sửa</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sửa</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                              onClick={handleDelete}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Xóa</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xóa</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="space-y-1.5 rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-2">
                      <MetaLine
                        icon={Globe}
                        value={inbox.websiteUrl}
                        emptyLabel="Chưa có website / domain"
                        iconClassName="text-primary/70"
                      />
                      <MetaLine
                        icon={Mail}
                        value={inbox.email}
                        emptyLabel="Chưa có email"
                        iconClassName="text-primary/70"
                      />
                    </div>

                    <div className="mt-auto space-y-1.5 border-t border-border/50 pt-2.5">
                      <FeatureStatusRow
                        enabled={inbox.enableAutoAssignment}
                        icon={Zap}
                        label="Phân công tự động"
                      />
                      <FeatureStatusRow
                        enabled={inbox.workingHoursEnabled}
                        icon={Clock3}
                        label="Giờ làm việc"
                      />
                      <FeatureStatusRow
                        enabled={inbox.greetingEnabled}
                        icon={MessageCircle}
                        label="Lời chào"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground">Đang đồng bộ dữ liệu...</p>
      ) : null}

      <InboxDetailDialog
        inbox={viewingInbox}
        open={Boolean(viewingInbox)}
        onOpenChange={(open) => {
          if (!open) setViewingInbox(null);
        }}
      />
    </div>
  );
}
