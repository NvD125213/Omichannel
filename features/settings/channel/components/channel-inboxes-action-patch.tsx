"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Sketch } from "@uiw/react-color";
import {
  ArrowLeft,
  Check,
  Copy,
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
import { Card, CardContent } from "@/components/ui/card";
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
import type { UpdateTenantInboxRequest } from "@/services/chatwoot/interface";
import {
  buildChatEmbedScript,
  ChatPreviewFrame,
  ChatPreviewVariantSelect,
  getEmbedScriptFileName,
  resolveChatPreviewFromInbox,
  resolveChatPreviewTemplate,
  type ChatPreviewFormSource,
  type ChatPreviewVariantId,
} from "./chat-preview-config";

const REPLY_TIME_OPTIONS = [
  { value: "in_a_few_minutes", label: "Trong vài phút" },
  { value: "in_a_few_hours", label: "Trong vài giờ" },
  { value: "in_a_day", label: "Trong một ngày" },
] as const;

const FEATURE_FLAGS = [
  {
    key: "attachments",
    label: "Đính kèm tệp",
  },
  {
    key: "emoji_picker",
    label: "Bộ chọn emoji",
  },
  {
    key: "end_conversation",
    label: "Kết thúc hội thoại",
  },
  {
    key: "use_inbox_avatar_for_bot",
    label: "Avatar inbox cho bot",
  },
] as const;

type FeatureFlagKey = (typeof FEATURE_FLAGS)[number]["key"];

type ChannelKey =
  | "website"
  | "sms"
  | "whatsapp"
  | "email"
  | "api"
  | "telegram"
  | "line";

const CHANNEL_TYPE_TO_KEY: Record<string, ChannelKey> = {
  website: "website",
  web_widget: "website",
  "Channel::WebWidget": "website",
  sms: "sms",
  "Channel::Sms": "sms",
  whatsapp: "whatsapp",
  "Channel::Whatsapp": "whatsapp",
  email: "email",
  "Channel::Email": "email",
  api: "api",
  "Channel::Api": "api",
  telegram: "telegram",
  "Channel::Telegram": "telegram",
  line: "line",
  "Channel::Line": "line",
};

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  website: "Website",
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
  api: "API",
  telegram: "Telegram",
  line: "LINE",
};

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
  hmac_mandatory: boolean;
  sender_name_type: "friendly" | "professional";
  business_name: string;
  reply_time: string;
  webhook_url: string;
  portal_id: string;
  bubble_position: "left" | "right";
  bubble_type: "standard" | "expanded_bubble";
  launcher_title: string;
  selected_feature_flags: FeatureFlagKey[];
  phone_number: string;
  provider_api_key: string;
  provider_api_secret: string;
  provider_application_id: string;
  provider_account_id: string;
  phone_number_id: string;
  business_account_id: string;
  email: string;
  bot_token: string;
  line_channel_id: string;
  line_channel_secret: string;
  line_channel_token: string;
};

type AgentOption = {
  id: string;
  /** UUID user gắn với agent — gửi lên inbox_members.user_ids */
  userId: string | null;
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
        (data.messaging as Record<string, unknown> | undefined)?.payload,
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

  for (const key of [
    "payload",
    "inbox",
    "chatwoot",
    "data",
    "channel",
    "messaging",
  ]) {
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

/** UUID / chuỗi id người dùng từ agents (bỏ qua id số thuần). */
function toUuidId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw || /^-?\d+$/.test(raw)) return null;
  return raw;
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

function resolveChannelKey(record: Record<string, unknown>): ChannelKey {
  const channel = (record.channel as Record<string, unknown> | undefined) ?? {};
  const raw =
    record.channel_type ??
    channel.channel_type ??
    channel.type ??
    record.medium ??
    "";
  const key = CHANNEL_TYPE_TO_KEY[String(raw).trim()];
  return key ?? "website";
}

function mapInboxToEditValues(
  record: Record<string, unknown>,
): InboxEditFormValues {
  const channel = (record.channel as Record<string, unknown> | undefined) ?? {};
  const providerConfig =
    (channel.provider_config as Record<string, unknown> | undefined) ??
    (record.provider_config as Record<string, unknown> | undefined) ??
    {};
  const sources = [record, channel, providerConfig];

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
    hmac_mandatory: pickBoolean(sources, "hmac_mandatory", false),
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
    phone_number: pickString(sources, "phone_number"),
    provider_api_key: pickString(sources, "api_key", "provider_api_key"),
    provider_api_secret: pickString(
      sources,
      "api_secret",
      "provider_api_secret",
    ),
    provider_application_id: pickString(
      sources,
      "application_id",
      "provider_application_id",
    ),
    provider_account_id: pickString(
      sources,
      "account_id",
      "provider_account_id",
    ),
    phone_number_id: pickString(sources, "phone_number_id"),
    business_account_id: pickString(sources, "business_account_id"),
    email: pickString(sources, "email"),
    bot_token: pickString(sources, "bot_token"),
    line_channel_id: pickString(sources, "line_channel_id"),
    line_channel_secret: pickString(sources, "line_channel_secret"),
    line_channel_token: pickString(sources, "line_channel_token"),
  };
}

function parsePortalId(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function buildUpdatePayload(
  channelKey: ChannelKey,
  values: InboxEditFormValues,
): UpdateTenantInboxRequest {
  const name = values.name.trim();
  const greeting_enabled = values.greeting_enabled;
  const greeting_message = values.greeting_message.trim() || null;
  const portal_id = parsePortalId(values.portal_id);

  const base: UpdateTenantInboxRequest = {
    name,
    greeting_enabled,
    greeting_message,
    portal_id,
    enable_auto_assignment: true,
  };

  switch (channelKey) {
    case "website": {
      const replyTime = values.reply_time.trim() || "in_a_few_minutes";
      return {
        ...base,
        enable_email_collect: values.enable_email_collect,
        allow_messages_after_resolved: values.allow_messages_after_resolved,
        sender_name_type: values.sender_name_type,
        business_name: values.business_name.trim() || null,
        channel: {
          website_url: values.website_url.trim(),
          widget_color: values.widget_color || "#1f93ff",
          welcome_title: values.welcome_title.trim() || null,
          welcome_tagline: values.welcome_tagline.trim() || null,
          reply_time:
            replyTime === "in_a_few_hours" || replyTime === "in_a_day"
              ? replyTime
              : "in_a_few_minutes",
          continuity_via_email: values.continuity_via_email,
          selected_feature_flags: values.selected_feature_flags,
        },
      };
    }
    case "sms": {
      const providerConfig: Record<string, string> = {};
      if (values.provider_api_key.trim()) {
        providerConfig.api_key = values.provider_api_key.trim();
      }
      if (values.provider_api_secret.trim()) {
        providerConfig.api_secret = values.provider_api_secret.trim();
      }
      if (values.provider_application_id.trim()) {
        providerConfig.application_id = values.provider_application_id.trim();
      }
      if (values.provider_account_id.trim()) {
        providerConfig.account_id = values.provider_account_id.trim();
      }
      return {
        ...base,
        lock_to_single_conversation: values.lock_to_single_conversation,
        channel: {
          phone_number: values.phone_number.trim(),
          ...(Object.keys(providerConfig).length > 0
            ? { provider_config: providerConfig }
            : {}),
        },
      };
    }
    case "whatsapp": {
      const providerConfig: {
        api_key?: string;
        phone_number_id?: string;
        business_account_id?: string;
      } = {};
      if (values.provider_api_key.trim()) {
        providerConfig.api_key = values.provider_api_key.trim();
      }
      if (values.phone_number_id.trim()) {
        providerConfig.phone_number_id = values.phone_number_id.trim();
      }
      if (values.business_account_id.trim()) {
        providerConfig.business_account_id = values.business_account_id.trim();
      }
      return {
        ...base,
        lock_to_single_conversation: values.lock_to_single_conversation,
        channel: {
          phone_number: values.phone_number.trim(),
          provider: "whatsapp_cloud",
          ...(Object.keys(providerConfig).length > 0
            ? { provider_config: providerConfig }
            : {}),
        },
      };
    }
    case "email":
      return {
        ...base,
        sender_name_type: values.sender_name_type,
        business_name: values.business_name.trim() || null,
        channel: {
          email: values.email.trim(),
        },
      };
    case "api":
      return {
        ...base,
        lock_to_single_conversation: values.lock_to_single_conversation,
        channel: {
          webhook_url: values.webhook_url.trim() || null,
          hmac_mandatory: values.hmac_mandatory,
        },
      };
    case "telegram": {
      const channel: UpdateTenantInboxRequest["channel"] = {};
      if (values.bot_token.trim()) {
        (channel as { bot_token: string }).bot_token = values.bot_token.trim();
      }
      return {
        ...base,
        lock_to_single_conversation: values.lock_to_single_conversation,
        ...(Object.keys(channel ?? {}).length > 0 ? { channel } : {}),
      };
    }
    case "line": {
      const channel: {
        line_channel_id?: string;
        line_channel_secret?: string;
        line_channel_token?: string;
      } = {};
      if (values.line_channel_id.trim()) {
        channel.line_channel_id = values.line_channel_id.trim();
      }
      if (values.line_channel_secret.trim()) {
        channel.line_channel_secret = values.line_channel_secret.trim();
      }
      if (values.line_channel_token.trim()) {
        channel.line_channel_token = values.line_channel_token.trim();
      }
      return {
        ...base,
        lock_to_single_conversation: values.lock_to_single_conversation,
        ...(Object.keys(channel).length > 0 ? { channel } : {}),
      };
    }
    default: {
      throw new Error(`Unsupported channel: ${String(channelKey)}`);
    }
  }
}

function appendFormDataEntry(
  formData: FormData,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      formData.append(`${key}[]`, String(item));
    }
    return;
  }

  if (typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      appendFormDataEntry(formData, `${key}[${childKey}]`, childValue);
    }
    return;
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }

  formData.append(key, String(value));
}

function buildUpdateFormData(
  channelKey: ChannelKey,
  values: InboxEditFormValues,
  avatarFile: File,
): FormData {
  const payload = buildUpdatePayload(channelKey, values);
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  for (const [key, value] of Object.entries(payload)) {
    appendFormDataEntry(formData, key, value);
  }

  return formData;
}

function normalizeAgent(
  record: Record<string, unknown>,
  index: number,
): AgentOption {
  const name = String(record.available_name ?? record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const userId =
    toUuidId(record.user_id) ??
    toUuidId(record.uuid) ??
    toUuidId(record.id) ??
    toUuidId(record.account_user_id);
  const id =
    userId ||
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

const INPUT_CLASSNAME = "border-border/80 p-2";
const TEXTAREA_CLASSNAME = "border-border/80 p-2";
const SELECT_TRIGGER_CLASSNAME = "w-full border-border/80 p-2";

function InboxAvatarSetup({
  displayUrl,
  disabled,
  uploadInputId,
  onFileSelect,
}: {
  displayUrl?: string;
  disabled?: boolean;
  uploadInputId: string;
  onFileSelect: (file: File) => void;
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onFileSelect(file);
  };

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={uploadInputId}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <Avatar className="size-14 rounded-full border border-border/80 bg-background">
          {displayUrl ? (
            <AvatarImage
              src={displayUrl}
              alt="Ảnh đại diện"
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="rounded-full bg-muted">
            <MessageSquare className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
          <Plus className="size-3.5" />
        </span>
        <input
          id={uploadInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={handleFileChange}
        />
      </label>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">Ảnh đại diện</p>
        <p className="text-[11px] leading-4 text-muted-foreground">
          Nhấn dấu cộng để tải ảnh lên widget chat.
        </p>
      </div>
    </div>
  );
}

function WebsiteChatPreview({
  inboxRecord,
  formValues,
  script,
}: {
  inboxRecord: Record<string, unknown> | null;
  formValues: ChatPreviewFormSource;
  script: string;
}) {
  const [previewTab, setPreviewTab] = useState("widget");
  const resolved = useMemo(
    () => resolveChatPreviewFromInbox(inboxRecord, formValues),
    [formValues, inboxRecord],
  );
  const [previewVariant, setPreviewVariant] = useState<ChatPreviewVariantId>(
    resolved.variantId,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPreviewVariant(resolved.variantId);
  }, [resolved.variantId]);

  const previewTemplate = useMemo(
    () => resolveChatPreviewTemplate(previewVariant, inboxRecord),
    [inboxRecord, previewVariant],
  );

  const previewData = resolved.runtime;

  const widgetAssetsOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const embedScript = useMemo(
    () =>
      buildChatEmbedScript(previewVariant, {
        baseScript: script,
        template: previewTemplate,
        data: previewData,
        widgetAssetsOrigin,
      }),
    [previewData, previewTemplate, previewVariant, script, widgetAssetsOrigin],
  );

  const scriptText =
    embedScript.trim() || "// Script sẽ xuất hiện sau khi inbox tải xong.";
  const scriptLines = useMemo(() => scriptText.split("\n"), [scriptText]);
  const scriptFileName = getEmbedScriptFileName(previewVariant);

  const handleCopy = async () => {
    if (!embedScript.trim()) {
      toast.error("Chưa có script nhúng");
      return;
    }
    try {
      await navigator.clipboard.writeText(embedScript);
      setCopied(true);
      toast.success("Đã sao chép script");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Không sao chép được script");
    }
  };

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background">
        <Tabs
          value={previewTab}
          onValueChange={setPreviewTab}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="border-b border-border/70 px-4 pt-4">
            <div className="mb-3 space-y-0.5">
              <h3 className="text-sm font-medium">Widget & nhúng</h3>
              <p className="text-xs text-muted-foreground">
                Xem trước UI và script nhúng theo khung đã chọn.
              </p>
            </div>
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger
                value="widget"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Xem trước
              </TabsTrigger>
              <TabsTrigger
                value="script"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Script nhúng
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="widget" className="mt-0 flex-1 p-4 outline-none">
            <div className="space-y-3 rounded-xl bg-[#f4f4f5] p-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground/90">
                  Khung chat tuỳ chỉnh
                </p>
                <ChatPreviewVariantSelect
                  value={previewVariant}
                  onChange={setPreviewVariant}
                />
                <p className="text-[11px] text-muted-foreground">
                  {previewTemplate.description}
                </p>
              </div>

              <ChatPreviewFrame
                variantId={previewVariant}
                data={previewData}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="script"
            className="mt-0 flex min-h-0 flex-1 flex-col p-4 outline-none"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex shrink-0 items-center justify-between border-b border-[#2b2b2b] bg-[#252526] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 shrink-0 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 shrink-0 rounded-full bg-[#28c840]" />
                  <span className="ml-1 truncate font-mono text-[11px] text-[#cccccc]">
                    {scriptFileName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-[11px] text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white"
                  onClick={() => void handleCopy()}
                  disabled={!embedScript.trim()}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Sao chép
                </Button>
              </div>

              <div className="flex min-h-0 flex-1 overflow-auto">
                <div className="sticky left-0 shrink-0 border-r border-[#2b2b2b] bg-[#1e1e1e] px-3 py-3 text-right font-mono text-[11px] leading-5 text-[#858585] select-none">
                  {scriptLines.map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
                <pre className="min-w-0 flex-1 overflow-x-auto p-3 font-mono text-[11px] leading-5 text-[#d4d4d4]">
                  <code>{scriptText}</code>
                </pre>
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-[#007acc] bg-[#007acc] px-3 py-1 text-[10px] text-white">
                <span>HTML</span>
                <span>{scriptLines.length} dòng · UTF-8</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

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
  hmac_mandatory: false,
  sender_name_type: "professional",
  business_name: "",
  reply_time: "in_a_few_minutes",
  webhook_url: "",
  portal_id: "",
  bubble_position: "right",
  bubble_type: "expanded_bubble",
  launcher_title: "Chat với chúng tôi",
  selected_feature_flags: ["attachments", "emoji_picker", "end_conversation"],
  phone_number: "",
  provider_api_key: "",
  provider_api_secret: "",
  provider_application_id: "",
  provider_account_id: "",
  phone_number_id: "",
  business_account_id: "",
  email: "",
  bot_token: "",
  line_channel_id: "",
  line_channel_secret: "",
  line_channel_token: "",
};

export function ChannelInboxesActionPatch({
  inboxId,
}: ChannelInboxesActionPatchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  const [activeTab, setActiveTab] = useState("settings");
  const [hydrated, setHydrated] = useState(false);
  const [channelKey, setChannelKey] = useState<ChannelKey>("website");
  const [widgetScript, setWidgetScript] = useState("");
  const [inboxRecord, setInboxRecord] = useState<Record<string, unknown> | null>(
    null,
  );
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
  const activeAvatarUrl = avatarPreviewUrl || avatarDisplayUrl;

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleAvatarFileSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

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
    setChannelKey(resolveChannelKey(record));
    setInboxRecord(record);
    setAvatarDisplayUrl(
      pickString(
        [record, (record.channel as Record<string, unknown>) ?? {}],
        "avatar_url",
        "thumbnail",
      ),
    );
    setAvatarFile(null);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setWidgetScript(
      pickString(
        [record, (record.channel as Record<string, unknown>) ?? {}],
        "web_widget_script",
      ),
    );

    const memberIds = new Set<string>();
    const members = coerceRecords(record.members) ?? [];
    for (const member of members) {
      const id =
        toUuidId(member.user_id) ??
        toUuidId(member.uuid) ??
        toUuidId(member.id) ??
        toUuidId(member.account_user_id) ??
        String(
          member.user_id ?? member.id ?? member.account_user_id ?? "",
        ).trim();
      if (id) memberIds.add(id);
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
      toast.error("Vui lòng nhập tên kênh");
      return;
    }

    if (channelKey === "website" && !values.website_url.trim()) {
      toast.error("Vui lòng nhập website URL");
      return;
    }
    if (
      (channelKey === "sms" || channelKey === "whatsapp") &&
      !values.phone_number.trim()
    ) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (channelKey === "email" && !values.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (channelKey === "line" && !values.line_channel_id.trim()) {
      toast.error("Vui lòng nhập LINE Channel ID");
      return;
    }

    setSavingSettings(true);
    try {
      const payload = avatarFile
        ? buildUpdateFormData(channelKey, values, avatarFile)
        : buildUpdatePayload(channelKey, values);
      const res = await updateInbox.mutateAsync({
        tenantId,
        inboxId,
        data: payload,
      });
      if (!isSuccessResponse(res)) return;

      const updatedRecord = extractSingleRecord(res);
      if (updatedRecord) {
        const nextAvatar = pickString(
          [
            updatedRecord,
            (updatedRecord.channel as Record<string, unknown>) ?? {},
          ],
          "avatar_url",
          "thumbnail",
        );
        if (nextAvatar) setAvatarDisplayUrl(nextAvatar);
      }
      if (avatarFile) {
        setAvatarFile(null);
        setAvatarPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return null;
        });
      }
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
        return agent?.userId ?? toUuidId(id) ?? (id || null);
      })
      .filter((id): id is string => Boolean(id));

    if (selectedMemberIds.length > 0 && userIds.length === 0) {
      toast.error(
        "Không lấy được UUID người dùng hợp lệ từ danh sách nhân viên",
      );
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
            Chỉnh sửa cấu hình {CHANNEL_LABELS[channelKey]} và cộng tác viên.
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
              <div
                className={cn(
                  "grid gap-4",
                  channelKey === "website" &&
                    "xl:grid-cols-[minmax(0,1fr)_minmax(352px,0.666fr)] xl:items-stretch xl:min-h-128",
                )}
              >
                <Card className="flex h-full min-w-0 flex-col gap-0 border-border/70 bg-card py-0 shadow-none">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-4 sm:p-5">
                    {channelKey === "website" ? (
                      <section className="space-y-3">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-medium">
                            Cấu hình widget
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Chỉnh sửa bên trái, xem trước bên phải.
                          </p>
                        </div>

                        <InboxAvatarSetup
                          displayUrl={activeAvatarUrl}
                          disabled={isBusy}
                          uploadInputId="inbox-website-avatar-upload"
                          onFileSelect={handleAvatarFileSelect}
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Tên kênh
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={isBusy}
                                    className={INPUT_CLASSNAME}
                                    placeholder="Nhập tên kênh"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="website_url"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Website URL
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={isBusy}
                                    className={INPUT_CLASSNAME}
                                    placeholder="https://example.com"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="welcome_title"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Tiêu đề chào mừng
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={isBusy}
                                    className={INPUT_CLASSNAME}
                                    placeholder="Xin chào!"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="reply_time"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Thời gian phản hồi
                                </FormLabel>
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="welcome_tagline"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Mô tả chào mừng
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  disabled={isBusy}
                                  maxLength={255}
                                  rows={2}
                                  className={cn(
                                    TEXTAREA_CLASSNAME,
                                    "min-h-14 resize-y",
                                  )}
                                  placeholder="Chúng tôi sẵn sàng hỗ trợ bạn."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                          <FormField
                            control={form.control}
                            name="widget_color"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Màu widget
                                </FormLabel>
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsWidgetColorOpen((prev) => !prev)
                                    }
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border/80 px-2.5 py-1.5"
                                  >
                                    <span
                                      className="size-5 rounded-full border"
                                      style={{
                                        backgroundColor:
                                          field.value || "#1f93ff",
                                      }}
                                    />
                                    <span className=" text-xs">
                                      {field.value || "#1f93ff"}
                                    </span>
                                  </button>
                                  {isWidgetColorOpen ? (
                                    <FormControl>
                                      <div
                                        className={cn(
                                          "w-fit overflow-x-auto rounded-xl border bg-background p-2",
                                          isBusy &&
                                            "pointer-events-none opacity-60",
                                        )}
                                      >
                                        <Sketch
                                          color={field.value || "#1f93ff"}
                                          onChange={(color) =>
                                            field.onChange(color.hex)
                                          }
                                          style={
                                            {
                                              width: 220,
                                              boxShadow: "none",
                                              background: "transparent",
                                              "--sketch-background":
                                                "transparent",
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
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="greeting_message"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <FormLabel className="text-xs">
                                    Tin nhắn chào
                                  </FormLabel>
                                  <FormField
                                    control={form.control}
                                    name="greeting_enabled"
                                    render={({ field: toggle }) => (
                                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                        <FormLabel className="text-xs text-muted-foreground">
                                          Bật
                                        </FormLabel>
                                        <FormControl>
                                          <Switch
                                            checked={toggle.value}
                                            onCheckedChange={toggle.onChange}
                                            disabled={isBusy}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    disabled={
                                      isBusy || !watched.greeting_enabled
                                    }
                                    rows={2}
                                    className={cn(
                                      TEXTAREA_CLASSNAME,
                                      "min-h-14 resize-y",
                                    )}
                                    placeholder="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {(
                            [
                              {
                                name: "enable_email_collect" as const,
                                label: "Thu thập email",
                              },
                              {
                                name: "allow_messages_after_resolved" as const,
                                label: "Nhắn sau khi xử lý",
                              },
                              {
                                name: "continuity_via_email" as const,
                                label: "Tiếp tục qua email",
                              },
                            ] as const
                          ).map((item) => (
                            <FormField
                              key={item.name}
                              control={form.control}
                              name={item.name}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                                  <FormLabel className="mb-0 text-xs font-normal">
                                    {item.label}
                                  </FormLabel>
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
                        </div>

                        <FormField
                          control={form.control}
                          name="selected_feature_flags"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Tính năng widget
                              </FormLabel>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {FEATURE_FLAGS.map((feature) => {
                                  const checked = field.value.includes(
                                    feature.key,
                                  );
                                  return (
                                    <label
                                      key={feature.key}
                                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2"
                                    >
                                      <Checkbox
                                        checked={checked}
                                        disabled={isBusy}
                                        onCheckedChange={(value) => {
                                          const next = new Set(field.value);
                                          if (value === true)
                                            next.add(feature.key);
                                          else next.delete(feature.key);
                                          field.onChange(Array.from(next));
                                        }}
                                      />
                                      <span className="text-xs leading-4">
                                        {feature.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </section>
                    ) : (
                      <>
                        <section className="space-y-4">
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-medium">
                              Thông tin kênh
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Cấu hình kênh {CHANNEL_LABELS[channelKey]}.
                            </p>
                          </div>

                          <InboxAvatarSetup
                            displayUrl={activeAvatarUrl}
                            disabled={isBusy}
                            uploadInputId="inbox-channel-avatar-upload"
                            onFileSelect={handleAvatarFileSelect}
                          />

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="gap-1.5">
                                  <FormLabel className="text-xs">
                                    Tên kênh
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={isBusy}
                                      className={INPUT_CLASSNAME}
                                      placeholder="Nhập tên kênh"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {channelKey === "email" ? (
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Email
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="email"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="support@example.com"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : null}

                            {channelKey === "api" ? (
                              <FormField
                                control={form.control}
                                name="webhook_url"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Webhook URL
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="https://example.com/webhook"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : null}

                            {channelKey === "sms" ||
                            channelKey === "whatsapp" ? (
                              <FormField
                                control={form.control}
                                name="phone_number"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Số điện thoại
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="+15551234567"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : null}

                            {channelKey === "telegram" ? (
                              <FormField
                                control={form.control}
                                name="bot_token"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5 sm:col-span-2">
                                    <FormLabel className="text-xs">
                                      Bot Token
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : null}
                          </div>

                          {channelKey === "sms" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="provider_api_key"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Provider API Key
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="provider_api_secret"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Provider API Secret
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="provider_application_id"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Application ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="your-application-id"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="provider_account_id"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Account ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="your-account-id"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : null}

                          {channelKey === "whatsapp" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="provider_api_key"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      API Key
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="phone_number_id"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Phone Number ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="your-phone-number-id"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="business_account_id"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Business Account ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="your-business-account-id"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : null}

                          {channelKey === "line" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="line_channel_id"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      LINE Channel ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="1234567890"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="line_channel_secret"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      LINE Channel Secret
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="line_channel_token"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5 sm:col-span-2">
                                    <FormLabel className="text-xs">
                                      LINE Channel Token
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="password"
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : null}

                          {channelKey === "api" ? (
                            <FormField
                              control={form.control}
                              name="hmac_mandatory"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                  <FormLabel className="mb-0 text-xs font-normal">
                                    Bắt buộc HMAC
                                  </FormLabel>
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
                          ) : null}

                          {channelKey === "email" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="sender_name_type"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Tên người gửi
                                    </FormLabel>
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
                                        <SelectItem value="friendly">
                                          Thân thiện
                                        </SelectItem>
                                        <SelectItem value="professional">
                                          Chuyên nghiệp
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="business_name"
                                render={({ field }) => (
                                  <FormItem className="gap-1.5">
                                    <FormLabel className="text-xs">
                                      Tên doanh nghiệp
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isBusy}
                                        className={INPUT_CLASSNAME}
                                        placeholder="Nhập tên doanh nghiệp"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : null}
                        </section>

                        <section className="space-y-3 border-t pt-4">
                          <h3 className="text-sm font-medium">
                            Cài đặt hội thoại
                          </h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(
                              [
                                {
                                  name: "greeting_enabled" as const,
                                  label: "Bật lời chào",
                                  channels: null as ChannelKey[] | null,
                                },
                                {
                                  name: "lock_to_single_conversation" as const,
                                  label: "Giới hạn một hội thoại",
                                  channels: [
                                    "api",
                                    "line",
                                    "telegram",
                                    "whatsapp",
                                    "sms",
                                  ] as ChannelKey[] | null,
                                },
                              ] as const
                            )
                              .filter(
                                (item) =>
                                  !item.channels ||
                                  item.channels.includes(channelKey),
                              )
                              .map((item) => (
                                <FormField
                                  key={item.name}
                                  control={form.control}
                                  name={item.name}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                      <FormLabel className="mb-0 text-xs font-normal">
                                        {item.label}
                                      </FormLabel>
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
                          </div>
                          <FormField
                            control={form.control}
                            name="greeting_message"
                            render={({ field }) => (
                              <FormItem className="gap-1.5">
                                <FormLabel className="text-xs">
                                  Tin nhắn chào
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    disabled={
                                      isBusy || !watched.greeting_enabled
                                    }
                                    rows={2}
                                    className={cn(
                                      TEXTAREA_CLASSNAME,
                                      "min-h-14 resize-y",
                                    )}
                                    placeholder="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </section>
                      </>
                    )}

                    <div className="mt-auto flex justify-end pt-1">
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
                  </CardContent>
                </Card>

                {channelKey === "website" ? (
                  <WebsiteChatPreview
                    inboxRecord={inboxRecord}
                    formValues={{
                      name: watched.name,
                      avatar_url: activeAvatarUrl,
                      welcome_title: watched.welcome_title,
                      welcome_tagline: watched.welcome_tagline,
                      widget_color: watched.widget_color,
                      reply_time: watched.reply_time,
                      greeting_enabled: watched.greeting_enabled,
                      greeting_message: watched.greeting_message,
                    }}
                    script={widgetScript}
                  />
                ) : null}
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
