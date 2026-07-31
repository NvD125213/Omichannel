"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Sketch } from "@uiw/react-color";
import {
  ArrowLeft,
  Check,
  Loader2,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useGetTenantInbox,
  useListChatwootAgents,
  useListTenantInboxes,
  useUpdateAccountInboxMembers,
  useUpdateTenantInbox,
} from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";

const REPLY_TIME_OPTIONS = [
  { value: "in_a_few_minutes", label: "Trong vài phút" },
  { value: "in_a_few_hours", label: "Trong vài giờ" },
  { value: "in_a_day", label: "Trong một ngày" },
] as const;

const FEATURE_FLAGS = [
  {
    key: "attachments",
    label: "Hiển thị nút chọn tệp trên widget",
  },
  {
    key: "emoji_picker",
    label: "Hiển thị bộ chọn emoji trên widget",
  },
  {
    key: "end_conversation",
    label: "Cho phép người dùng kết thúc hội thoại từ widget",
  },
  {
    key: "use_inbox_avatar_for_bot",
    label: "Dùng avatar của hộp thư cho bot",
  },
] as const;

type FeatureFlagKey = (typeof FEATURE_FLAGS)[number]["key"];

type InboxEditFormValues = {
  name: string;
  website_url: string;
  widget_color: string;
  welcome_title: string;
  welcome_tagline: string;
  greeting_enabled: boolean;
  greeting_message: string;
  enable_email_collect: boolean;
  allow_messages_after_resolved: boolean;
  lock_to_single_conversation: boolean;
  continuity_via_email: boolean;
  sender_name_type: "friendly" | "professional";
  business_name: string;
  reply_time: string;
  webhook_url: string;
  portal_id: string;
  bubble_position: "left" | "right";
  bubble_type: "standard" | "expanded_bubble";
  launcher_title: string;
  selected_feature_flags: FeatureFlagKey[];
};

type AgentOption = {
  id: string;
  userId: number | null;
  name: string;
  email: string;
  thumbnail?: string;
};

interface ChannelInboxesActionPatchProps {
  inboxId: string;
}

function coerceRecords(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractRecords(response: unknown): Record<string, unknown>[] {
  const direct = coerceRecords(response);
  if (direct) return direct;
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | unknown[] | undefined;
  const fromDataArray = coerceRecords(data);
  if (fromDataArray) return fromDataArray;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return (
      coerceRecords(data.payload) ??
      coerceRecords(data.agents) ??
      coerceRecords(data.inboxes) ??
      coerceRecords(
        (data.chatwoot as Record<string, unknown> | undefined)?.payload,
      ) ??
      []
    );
  }

  return [];
}

function unwrapRecord(
  value: unknown,
  depth = 0,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || depth > 5) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = unwrapRecord(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  if ("name" in record || "channel_type" in record || "id" in record) {
    return record;
  }

  for (const key of ["payload", "inbox", "chatwoot", "data", "channel"]) {
    const found = unwrapRecord(record[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function extractSingleRecord(
  response: unknown,
): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  return (
    unwrapRecord(root.data) ??
    unwrapRecord(root) ??
    extractRecords(response)[0] ??
    null
  );
}

function toNumericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim();
  if (!raw || !/^-?\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isSuccessResponse(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const statusCode = (response as Record<string, unknown>).status_code;
  return statusCode === 200 || statusCode === 201;
}

function pickString(
  sources: Record<string, unknown>[],
  ...keys: string[]
): string {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return "";
}

function pickBoolean(
  sources: Record<string, unknown>[],
  key: string,
  fallback = false,
): boolean {
  for (const source of sources) {
    if (typeof source[key] === "boolean") return source[key] as boolean;
  }
  return fallback;
}

function normalizeFeatureFlags(value: unknown): FeatureFlagKey[] {
  const allowed = new Set(FEATURE_FLAGS.map((item) => item.key));
  if (!Array.isArray(value)) {
    return ["attachments", "emoji_picker", "end_conversation"];
  }
  return value
    .map((item) => String(item))
    .filter((item): item is FeatureFlagKey =>
      allowed.has(item as FeatureFlagKey),
    );
}

function mapInboxToEditValues(
  record: Record<string, unknown>,
): InboxEditFormValues {
  const channel = (record.channel as Record<string, unknown> | undefined) ?? {};
  const sources = [record, channel];

  const senderRaw = pickString(sources, "sender_name_type");
  const replyRaw = pickString(sources, "reply_time");

  return {
    name: pickString(sources, "name"),
    website_url: pickString(
      sources,
      "website_url",
      "website_domain",
      "allowed_domains",
    ),
    widget_color: pickString(sources, "widget_color") || "#1f93ff",
    welcome_title: pickString(sources, "welcome_title", "welcome_heading"),
    welcome_tagline: pickString(sources, "welcome_tagline"),
    greeting_enabled: pickBoolean(sources, "greeting_enabled", true),
    greeting_message: pickString(sources, "greeting_message"),
    enable_email_collect: pickBoolean(sources, "enable_email_collect", true),
    allow_messages_after_resolved: pickBoolean(
      sources,
      "allow_messages_after_resolved",
      true,
    ),
    lock_to_single_conversation: pickBoolean(
      sources,
      "lock_to_single_conversation",
      false,
    ),
    continuity_via_email: pickBoolean(sources, "continuity_via_email", true),
    sender_name_type: senderRaw === "friendly" ? "friendly" : "professional",
    business_name: pickString(sources, "business_name"),
    reply_time: replyRaw || "in_a_few_minutes",
    webhook_url: pickString(sources, "webhook_url", "callback_webhook_url"),
    portal_id: pickString(sources, "portal_id"),
    bubble_position: "right",
    bubble_type: "expanded_bubble",
    launcher_title:
      pickString(sources, "launcher_title") || "Chat với chúng tôi",
    selected_feature_flags: normalizeFeatureFlags(
      channel.selected_feature_flags ?? record.selected_feature_flags,
    ),
  };
}

function buildUpdatePayload(values: InboxEditFormValues) {
  return {
    name: values.name.trim(),
    enable_email_collect: values.enable_email_collect,
    allow_messages_after_resolved: values.allow_messages_after_resolved,
    greeting_enabled: values.greeting_enabled,
    greeting_message: values.greeting_message.trim() || null,
    portal_id: values.portal_id.trim() || null,
    lock_to_single_conversation: values.lock_to_single_conversation,
    sender_name_type: values.sender_name_type,
    business_name: values.business_name.trim() || null,
    channel: {
      widget_color: values.widget_color || "#1f93ff",
      website_url: values.website_url.trim(),
      webhook_url: values.webhook_url.trim() || null,
      welcome_title: values.welcome_title.trim() || null,
      welcome_tagline: values.welcome_tagline.trim() || null,
      reply_time: values.reply_time,
      continuity_via_email: values.continuity_via_email,
      selected_feature_flags: values.selected_feature_flags,
    },
  };
}

function normalizeAgent(
  record: Record<string, unknown>,
  index: number,
): AgentOption {
  const name = String(record.available_name ?? record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const userId =
    toNumericId(record.user_id) ??
    toNumericId(record.id) ??
    toNumericId(record.account_user_id);
  const id =
    (userId !== null ? String(userId) : "") ||
    String(record.id ?? record.user_id ?? record.uuid ?? "").trim() ||
    email ||
    `agent-${index + 1}`;
  const thumbnail = String(
    record.thumbnail ?? record.avatar_url ?? record.avatarUrl ?? "",
  ).trim();

  return {
    id,
    userId,
    name: name || `Nhân viên ${index + 1}`,
    email: email || "Không có",
    thumbnail: thumbnail || undefined,
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function FieldRow({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 sm:grid-cols-[168px_minmax(0,1fr)] sm:items-start sm:gap-5",
        className,
      )}
    >
      <div className="pt-2 text-sm font-medium text-foreground/90">{label}</div>
      <div className="min-w-0 space-y-1.5">{children}</div>
    </div>
  );
}

function FieldStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

const INPUT_CLASSNAME = "border-border/80 p-2";
const TEXTAREA_CLASSNAME = "border-border/80 p-2";
const SELECT_TRIGGER_CLASSNAME = "w-full border-border/80 p-2";

const defaultValues: InboxEditFormValues = {
  name: "",
  website_url: "",
  widget_color: "#1f93ff",
  welcome_title: "",
  welcome_tagline: "",
  greeting_enabled: true,
  greeting_message: "",
  enable_email_collect: true,
  allow_messages_after_resolved: true,
  lock_to_single_conversation: false,
  continuity_via_email: true,
  sender_name_type: "professional",
  business_name: "",
  reply_time: "in_a_few_minutes",
  webhook_url: "",
  portal_id: "",
  bubble_position: "right",
  bubble_type: "expanded_bubble",
  launcher_title: "Chat với chúng tôi",
  selected_feature_flags: ["attachments", "emoji_picker", "end_conversation"],
};

export function ChannelInboxesActionPatch({
  inboxId,
}: ChannelInboxesActionPatchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  const [activeTab, setActiveTab] = useState("settings");
  const [hydrated, setHydrated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [isWidgetColorOpen, setIsWidgetColorOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);

  const form = useForm<InboxEditFormValues>({
    defaultValues,
  });

  const { data: inboxResponse, isLoading: isLoadingInbox } = useGetTenantInbox(
    tenantId,
    inboxId,
  );
  const { data: inboxesListResponse, isLoading: isLoadingList } =
    useListTenantInboxes(tenantId);
  const { data: agentsResponse, isLoading: isLoadingAgents } =
    useListChatwootAgents(tenantId);

  const updateInbox = useUpdateTenantInbox();
  const updateInboxMembers = useUpdateAccountInboxMembers();

  const agents = useMemo(
    () => extractRecords(agentsResponse).map(normalizeAgent),
    [agentsResponse],
  );

  const filteredAgents = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.email.toLowerCase().includes(q),
    );
  }, [agents, memberSearch]);

  const watched = form.watch();

  useEffect(() => {
    if (hydrated || !tenantId || !inboxId) return;

    let record = extractSingleRecord(inboxResponse);
    if (!record && inboxesListResponse) {
      record =
        extractRecords(inboxesListResponse).find(
          (item) => String(item.id ?? "").trim() === String(inboxId).trim(),
        ) ?? null;
    }

    if (!record) {
      if (isLoadingInbox || isLoadingList) return;
      setHydrated(true);
      return;
    }

    form.reset(mapInboxToEditValues(record));
    setAvatarUrl(
      pickString(
        [record, (record.channel as Record<string, unknown>) ?? {}],
        "avatar_url",
        "thumbnail",
      ),
    );

    const memberIds = new Set<string>();
    const members = coerceRecords(record.members) ?? [];
    for (const member of members) {
      const id =
        toNumericId(member.user_id) ??
        toNumericId(member.id) ??
        toNumericId(member.account_user_id);
      if (id !== null) memberIds.add(String(id));
    }
    setSelectedMemberIds(Array.from(memberIds));
    setHydrated(true);
  }, [
    form,
    hydrated,
    inboxId,
    inboxResponse,
    inboxesListResponse,
    isLoadingInbox,
    isLoadingList,
    tenantId,
  ]);

  const handleBack = () => {
    router.push("/settings/channel");
  };

  const toggleMember = (agentId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      if (checked) {
        if (prev.includes(agentId)) return prev;
        return [...prev, agentId];
      }
      return prev.filter((id) => id !== agentId);
    });
  };

  const handleSaveSettings = form.handleSubmit(async (values) => {
    if (!tenantId) {
      toast.error("Không tìm thấy đơn vị");
      return;
    }
    if (!values.name.trim()) {
      toast.error("Vui lòng nhập tên website");
      return;
    }
    if (!values.website_url.trim()) {
      toast.error("Vui lòng nhập tên miền website");
      return;
    }

    setSavingSettings(true);
    try {
      const res = await updateInbox.mutateAsync({
        tenantId,
        inboxId,
        data: buildUpdatePayload(values),
      });
      if (!isSuccessResponse(res)) return;
    } catch {
      // toast handled by hook
    } finally {
      setSavingSettings(false);
    }
  });

  const handleSaveCollaborators = async () => {
    if (!tenantId) {
      toast.error("Không tìm thấy đơn vị");
      return;
    }

    const numericInboxId = toNumericId(inboxId);
    if (numericInboxId === null) {
      toast.error("Mã hộp thư không hợp lệ");
      return;
    }

    const userIds = selectedMemberIds
      .map((id) => {
        const agent = agents.find((item) => item.id === id);
        return agent?.userId ?? toNumericId(id);
      })
      .filter((id): id is number => id !== null);

    if (selectedMemberIds.length > 0 && userIds.length === 0) {
      console.log("selectedMemberIds", selectedMemberIds);
      toast.error("Không lấy được mã người dùng hợp lệ từ danh sách nhân viên");
      return;
    }

    setSavingMembers(true);
    try {
      const res = await updateInboxMembers.mutateAsync({
        accountId: tenantId,
        data: {
          inbox_id: numericInboxId,
          user_ids: userIds,
        },
      });
      if (!isSuccessResponse(res)) return;
    } catch {
      // toast handled by hook
    } finally {
      setSavingMembers(false);
    }
  };

  const isBusy = savingSettings || savingMembers;

  if (!hydrated && (isLoadingInbox || isLoadingList)) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-120 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 overflow-x-hidden">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={handleBack}
          disabled={isBusy}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Quay lại</span>
        </Button>
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Cập nhật kênh
          </h2>
          <p className="text-sm text-muted-foreground">
            Chỉnh sửa cấu hình widget và cộng tác viên của kênh.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cài đặt
          </TabsTrigger>
          <TabsTrigger
            value="collaborators"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cộng tác viên
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="settings"
          className="mt-0 overflow-x-hidden outline-none"
        >
          <Form {...form}>
            <form onSubmit={handleSaveSettings} className="space-y-6 pb-6">
              <div className="min-w-0 space-y-8">
                <section className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium">Thông tin kênh</h3>
                    <p className="text-sm text-muted-foreground">
                      Cấu hình tên, domain và cách hiển thị người gửi.
                    </p>
                  </div>

                  <FieldRow label="Ảnh đại diện kênh">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="size-14 rounded-full border">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt="Ảnh đại diện" />
                          ) : null}
                          <AvatarFallback className="rounded-full bg-muted">
                            <MessageSquare className="size-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -right-0.5 -bottom-0.5 inline-flex size-5 items-center justify-center rounded-full border bg-background">
                          <Plus className="size-3" />
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ảnh đại diện kênh được lấy từ dữ liệu hiện có.
                      </p>
                    </div>
                  </FieldRow>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Tên website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="Nhập tên website"
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Tên miền website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="https://example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sender_name_type"
                    render={({ field }) => (
                      <FormItem className="gap-0">
                        <FieldRow
                          label={
                            <div className="space-y-1">
                              <FormLabel className="mb-0">
                                Tên người gửi
                              </FormLabel>
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto justify-start p-0 text-xs"
                                onClick={() =>
                                  document
                                    .getElementById("business-name-field")
                                    ?.focus()
                                }
                              >
                                Cấu hình tên doanh nghiệp
                              </Button>
                            </div>
                          }
                        >
                          <div className="grid gap-3">
                            {(
                              [
                                {
                                  value: "friendly" as const,
                                  title: "Thân thiện",
                                  description:
                                    "Thêm tên nhân viên phản hồi vào tên người gửi để tạo cảm giác gần gũi hơn.",
                                  preview: "Linh từ Chatwoot",
                                },
                                {
                                  value: "professional" as const,
                                  title: "Chuyên nghiệp",
                                  description:
                                    "Chỉ dùng tên doanh nghiệp đã cấu hình làm tên người gửi trong email.",
                                  preview:
                                    watched.business_name.trim() ||
                                    "Doanh nghiệp của bạn",
                                },
                              ] as const
                            ).map((option) => {
                              const selected = field.value === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => field.onChange(option.value)}
                                  className={cn(
                                    "w-full rounded-xl border p-4 text-left transition-colors",
                                    selected
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/40",
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={cn(
                                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                        selected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-muted-foreground/40",
                                      )}
                                    >
                                      {selected ? (
                                        <Check className="size-2.5" />
                                      ) : null}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-2">
                                      <div>
                                        <p className="text-sm font-medium">
                                          {option.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {option.description}
                                        </p>
                                      </div>
                                      <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                                        <Avatar className="size-7 shrink-0">
                                          <AvatarFallback className="text-[10px]">
                                            {option.preview.slice(0, 1)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <p className="truncate text-xs">
                                          {option.preview}{" "}
                                          <span className="text-muted-foreground">
                                            &lt;hotro@doanhnghiep.com&gt;
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="portal_id"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Trung tâm trợ giúp</FormLabel>
                            <Select
                              value={field.value || "none"}
                              onValueChange={(value) =>
                                field.onChange(value === "none" ? "" : value)
                              }
                              disabled={isBusy}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={SELECT_TRIGGER_CLASSNAME}
                                >
                                  <SelectValue placeholder="Chọn trung tâm trợ giúp" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  Chọn trung tâm trợ giúp
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Gắn trung tâm trợ giúp với hộp thư này
                            </FormDescription>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Tên doanh nghiệp</FormLabel>
                            <FormControl>
                              <Input
                                id="business-name-field"
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="Nhập tên doanh nghiệp"
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="space-y-5 border-t pt-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium">Tính năng widget</h3>
                    <p className="text-sm text-muted-foreground">
                      Tuỳ chỉnh nội dung và tính năng hiển thị trên widget.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="welcome_title"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Tiêu đề chào mừng</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="Xin chào!"
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="launcher_title"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Tiêu đề nút mở chat</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="Chat với chúng tôi"
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="welcome_tagline"
                    render={({ field }) => (
                      <FormItem className="gap-0">
                        <FieldRow
                          label={<FormLabel>Mô tả chào mừng</FormLabel>}
                        >
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={isBusy}
                              maxLength={255}
                              rows={4}
                              className={cn(
                                TEXTAREA_CLASSNAME,
                                "min-h-24 resize-y",
                              )}
                              placeholder="Chúng tôi sẵn sàng hỗ trợ bạn."
                            />
                          </FormControl>
                          <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground">
                              {String(field.value ?? "").length} / 255
                            </span>
                          </div>
                          <FormMessage />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widget_color"
                    render={({ field }) => (
                      <FormItem className="gap-0">
                        <FieldRow label={<FormLabel>Màu widget</FormLabel>}>
                          <div className="space-y-3 rounded-xl border p-4">
                            <button
                              type="button"
                              onClick={() =>
                                setIsWidgetColorOpen((prev) => !prev)
                              }
                              className="flex w-full items-center justify-between gap-3 text-left"
                              disabled={isBusy}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="inline-flex size-6 shrink-0 rounded-full border"
                                  style={{
                                    backgroundColor: field.value || "#1f93ff",
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium">
                                    {field.value || "#1f93ff"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Mở bảng màu khi cần chỉnh màu widget
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {isWidgetColorOpen ? "Thu gọn" : "Mở ra"}
                              </span>
                            </button>

                            {isWidgetColorOpen ? (
                              <FormControl>
                                <div
                                  className={cn(
                                    "w-fit max-w-full overflow-x-auto rounded-xl border bg-background p-2",
                                    isBusy && "pointer-events-none opacity-60",
                                  )}
                                >
                                  <Sketch
                                    color={field.value || "#1f93ff"}
                                    onChange={(color) =>
                                      field.onChange(color.hex)
                                    }
                                    style={
                                      {
                                        width: 240,
                                        boxShadow: "none",
                                        background: "transparent",
                                        "--sketch-background": "transparent",
                                        "--sketch-box-shadow": "none",
                                        "--sketch-swatch-border-top":
                                          "1px solid hsl(var(--border))",
                                      } as CSSProperties
                                    }
                                    disableAlpha
                                  />
                                </div>
                              </FormControl>
                            ) : null}
                          </div>
                          <FormMessage />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FieldRow label="Nút chat">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bubble_position"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isBusy}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={SELECT_TRIGGER_CLASSNAME}
                                >
                                  <SelectValue placeholder="Vị trí" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="right">
                                  Vị trí: Bên phải
                                </SelectItem>
                                <SelectItem value="left">
                                  Vị trí: Bên trái
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bubble_type"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isBusy}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={SELECT_TRIGGER_CLASSNAME}
                                >
                                  <SelectValue placeholder="Kiểu" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="expanded_bubble">
                                  Kiểu: Bong bóng mở rộng
                                </SelectItem>
                                <SelectItem value="standard">
                                  Kiểu: Chuẩn
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FieldRow>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="reply_time"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Thời gian phản hồi</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isBusy}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={SELECT_TRIGGER_CLASSNAME}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {REPLY_TIME_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Thời gian phản hồi này sẽ hiển thị trên widget
                              chat trực tiếp
                            </FormDescription>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="webhook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FieldStack>
                            <FormLabel>Đường dẫn webhook</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="https://..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FieldStack>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="selected_feature_flags"
                    render={({ field }) => (
                      <FormItem className="gap-0">
                        <FieldRow label={<FormLabel>Tính năng</FormLabel>}>
                          <div className="space-y-3 rounded-xl border p-4">
                            {FEATURE_FLAGS.map((feature) => {
                              const checked = field.value.includes(feature.key);
                              return (
                                <label
                                  key={feature.key}
                                  className="flex cursor-pointer items-start gap-3"
                                >
                                  <Checkbox
                                    checked={checked}
                                    disabled={isBusy}
                                    onCheckedChange={(value) => {
                                      const next = new Set(field.value);
                                      if (value === true) next.add(feature.key);
                                      else next.delete(feature.key);
                                      field.onChange(Array.from(next));
                                    }}
                                  />
                                  <span className="text-sm leading-5">
                                    {feature.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FieldRow>
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-4 border-t pt-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium">Cài đặt hội thoại</h3>
                    <p className="text-sm text-muted-foreground">
                      Các tuỳ chọn xử lý hội thoại và lời chào.
                    </p>
                  </div>

                  {(
                    [
                      {
                        name: "greeting_enabled" as const,
                        label: "Bật lời chào",
                        description: "Gửi lời chào khi bắt đầu hội thoại",
                      },
                      {
                        name: "enable_email_collect" as const,
                        label: "Bật thu thập email",
                        description: "Thu thập email khách trên widget",
                      },
                      {
                        name: "allow_messages_after_resolved" as const,
                        label: "Cho phép nhắn sau khi đã xử lý",
                        description:
                          "Cho phép gửi tin sau khi hội thoại đã giải quyết",
                      },
                      {
                        name: "lock_to_single_conversation" as const,
                        label: "Giới hạn một hội thoại",
                        description: "Giới hạn một hội thoại đang mở",
                      },
                      {
                        name: "continuity_via_email" as const,
                        label: "Tiếp tục qua email",
                        description: "Tiếp tục hội thoại qua email",
                      },
                    ] as const
                  ).map((item) => (
                    <FormField
                      key={item.name}
                      control={form.control}
                      name={item.name}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 rounded-xl border px-4 py-3">
                          <div className="min-w-0 space-y-0.5">
                            <FormLabel className="mb-0">{item.label}</FormLabel>
                            <FormDescription>
                              {item.description}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isBusy}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}

                  <FormField
                    control={form.control}
                    name="greeting_message"
                    render={({ field }) => (
                      <FormItem className="gap-0">
                        <FieldRow
                          label={<FormLabel>Tin nhắn chào mừng</FormLabel>}
                        >
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={isBusy || !watched.greeting_enabled}
                              rows={3}
                              className={cn(
                                TEXTAREA_CLASSNAME,
                                "min-h-20 resize-y",
                              )}
                              placeholder="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FieldRow>
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isBusy}>
                    {savingSettings ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      "Cập nhật cài đặt"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent
          value="collaborators"
          className="mt-0 space-y-4 overflow-x-hidden pb-6 outline-none"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Cộng tác viên</h3>
              <p className="text-sm text-muted-foreground">
                Chọn nhân viên được phép xử lý hội thoại trên kênh này.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedMemberIds.length} đã chọn
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className={cn(INPUT_CLASSNAME, "pl-9")}
              disabled={isBusy}
            />
          </div>

          <div className="overflow-hidden rounded-xl border">
            {isLoadingAgents ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Không tìm thấy nhân viên phù hợp.
              </div>
            ) : (
              <ul className="divide-y">
                {filteredAgents.map((agent) => {
                  const checked = selectedMemberIds.includes(agent.id);
                  return (
                    <li key={agent.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40",
                          checked && "bg-primary/5",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={isBusy}
                          onCheckedChange={(value) =>
                            toggleMember(agent.id, value === true)
                          }
                        />
                        <Avatar className="size-9">
                          {agent.thumbnail ? (
                            <AvatarImage
                              src={agent.thumbnail}
                              alt={agent.name}
                            />
                          ) : null}
                          <AvatarFallback>
                            {initials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {agent.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span translate="no">{agent.email}</span>
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => void handleSaveCollaborators()}
              disabled={isBusy}
            >
              {savingMembers ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Cập nhật cộng tác viên"
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ChannelInboxesActionPatch;
