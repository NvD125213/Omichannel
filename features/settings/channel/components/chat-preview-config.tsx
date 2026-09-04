"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ChatPreviewVariantId = "fsel-techie" | "chatwoot-default";

export type ChatPreviewQuickReply = {
  id: string;
  label: string;
};

export type ChatPreviewRuntimeData = {
  assistantName: string;
  avatarUrl?: string;
  greetingMessage: string;
  welcomeTitle?: string;
  welcomeTagline?: string;
  widgetColor?: string;
  replyTimeLabel?: string;
  greetingEnabled?: boolean;
};

export type ChatPreviewTemplate = {
  id: ChatPreviewVariantId;
  label: string;
  description: string;
  client?: string;
  assistantName: string;
  greetingMessage: string;
  quickReplies?: ChatPreviewQuickReply[];
  inputPlaceholder: string;
  inputPlaceholderWithActions?: string;
  showUsageQuota?: boolean;
  usageQuotaLabel?: string;
  showLauncherBubble?: boolean;
  launcherPromptLabel?: string;
  /** File widget loader trong /public/inbox-widgets */
  widgetScriptPath?: string;
  logoPath?: string;
};

export const CHAT_PREVIEW_TEMPLATES: Record<
  ChatPreviewVariantId,
  ChatPreviewTemplate
> = {
  "fsel-techie": {
    id: "fsel-techie",
    label: "FSEL · Trợ lý Techie",
    description: "Khung chat tuỳ chỉnh cho FSEL với quick reply và quota.",
    client: "FSEL",
    assistantName: "Trợ lý Techie",
    greetingMessage: "👋 Chào bạn, mình là Techie - Trợ lý ảo của FSEL.",
    inputPlaceholder: "Vui lòng chọn tài liệu để bắt đầu...",
    inputPlaceholderWithActions: "Soạn tin nhắn...",
    showUsageQuota: true,
    showLauncherBubble: true,
    launcherPromptLabel: "Bạn có cần hỗ trợ gì không?",
    widgetScriptPath: "/inbox-widgets/fsel-techie.js",
    logoPath: "/inbox-logo/fsel/logo-chatbot.svg",
  },
  "chatwoot-default": {
    id: "chatwoot-default",
    label: "Chatwoot mặc định",
    description: "Widget chat chuẩn từ script Chatwoot.",
    assistantName: "Hỗ trợ",
    greetingMessage: "Xin chào! Chúng tôi có thể giúp gì cho bạn?",
    inputPlaceholder: "Nhập tin nhắn...",
    showLauncherBubble: true,
    launcherPromptLabel: "Bạn có cần hỗ trợ gì không?",
  },
};

export const DEFAULT_CHAT_PREVIEW_VARIANT: ChatPreviewVariantId = "fsel-techie";

/** Màu thương hiệu FSEL — đồng bộ logo (#6E85FA, #AAB9FD). */
const FSEL_THEME = {
  primary: "#6E85FA",
  primaryDeep: "#5568E8",
  primaryLight: "#AAB9FD",
  primarySoft: "#EEF1FF",
  primarySurface: "#F5F7FF",
  ink: "#1A2456",
  inkBody: "#2B3674",
  muted: "#7B88B8",
  border: "#D4DCFA",
  borderStrong: "#B8C4F5",
  shadow: "rgba(110, 133, 250, 0.18)",
  shadowStrong: "rgba(110, 133, 250, 0.32)",
} as const;

export const CHAT_PREVIEW_VARIANT_OPTIONS = Object.values(
  CHAT_PREVIEW_TEMPLATES,
);

export const CHAT_PREVIEW_REPLY_TIME_LABELS: Record<string, string> = {
  in_a_few_minutes: "Trong vài phút",
  in_a_few_hours: "Trong vài giờ",
  in_a_day: "Trong một ngày",
};

export type ChatPreviewFormSource = {
  name?: string;
  welcome_title?: string;
  welcome_tagline?: string;
  greeting_message?: string;
  greeting_enabled?: boolean;
  widget_color?: string;
  reply_time?: string;
  avatar_url?: string;
};

export type InboxChatPreviewBundle = {
  runtime: ChatPreviewRuntimeData;
  variantId: ChatPreviewVariantId;
  template: ChatPreviewTemplate;
};

function pickInboxString(
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

function pickInboxBoolean(
  sources: Record<string, unknown>[],
  key: string,
  fallback: boolean,
): boolean {
  for (const source of sources) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function collectCustomAttributeBlobs(
  record: Record<string, unknown>,
): Record<string, unknown>[] {
  const channel = (record.channel as Record<string, unknown> | undefined) ?? {};
  return [record.custom_attributes, channel.custom_attributes].filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractWidgetConfig(
  customBlobs: Record<string, unknown>[],
): Record<string, unknown> {
  for (const blob of customBlobs) {
    const nested =
      blob.chat_widget_config ??
      blob.omnichannel_chat_widget ??
      blob.widget_config;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    if (blob.chat_preview_variant || blob.quick_replies || blob.quickReplies) {
      return blob;
    }
  }
  return {};
}

function normalizeQuickReplies(
  value: unknown,
): ChatPreviewQuickReply[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return { id: `reply-${index}`, label: item.trim() };
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const label = String(record.label ?? record.title ?? "").trim();
        const id = String(record.id ?? `reply-${index}`).trim();
        if (!label) return null;
        return { id, label };
      }
      return null;
    })
    .filter((item): item is ChatPreviewQuickReply => item !== null);

  return items.length ? items : undefined;
}

function resolveVariantId(
  widgetConfig: Record<string, unknown>,
  customBlobs: Record<string, unknown>[],
): ChatPreviewVariantId {
  const candidates = [
    widgetConfig.variant,
    widgetConfig.chat_preview_variant,
    ...customBlobs.map((blob) => blob.chat_preview_variant),
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value === "fsel-techie" || value === "chatwoot-default") {
      return value;
    }
  }

  return DEFAULT_CHAT_PREVIEW_VARIANT;
}

export function mergeChatPreviewTemplate(
  base: ChatPreviewTemplate,
  overrides: Partial<ChatPreviewTemplate> = {},
): ChatPreviewTemplate {
  return { ...base, ...overrides };
}

function buildTemplateOverrides(
  widgetConfig: Record<string, unknown>,
): Partial<ChatPreviewTemplate> {
  const overrides: Partial<ChatPreviewTemplate> = {};
  const quickReplies = normalizeQuickReplies(
    widgetConfig.quick_replies ?? widgetConfig.quickReplies,
  );
  if (quickReplies?.length) overrides.quickReplies = quickReplies;

  const inputPlaceholder = pickInboxString(
    [widgetConfig],
    "input_placeholder",
    "inputPlaceholder",
  );
  if (inputPlaceholder) overrides.inputPlaceholder = inputPlaceholder;

  const inputPlaceholderWithActions = pickInboxString(
    [widgetConfig],
    "input_placeholder_with_actions",
    "inputPlaceholderWithActions",
  );
  if (inputPlaceholderWithActions) {
    overrides.inputPlaceholderWithActions = inputPlaceholderWithActions;
  }

  const usageQuotaLabel = pickInboxString(
    [widgetConfig],
    "usage_quota_label",
    "usageQuotaLabel",
  );
  if (usageQuotaLabel) overrides.usageQuotaLabel = usageQuotaLabel;

  if (typeof widgetConfig.show_usage_quota === "boolean") {
    overrides.showUsageQuota = widgetConfig.show_usage_quota;
  } else if (typeof widgetConfig.showUsageQuota === "boolean") {
    overrides.showUsageQuota = widgetConfig.showUsageQuota;
  }

  const widgetScriptPath = pickInboxString(
    [widgetConfig],
    "widget_script_path",
    "widgetScriptPath",
  );
  if (widgetScriptPath) overrides.widgetScriptPath = widgetScriptPath;

  const logoPath = pickInboxString([widgetConfig], "logo_path", "logoPath");
  if (logoPath) overrides.logoPath = logoPath;

  return overrides;
}

/** Gộp dữ liệu inbox API + form đang chỉnh để render preview / script nhúng. */
export function resolveChatPreviewFromInbox(
  record: Record<string, unknown> | null | undefined,
  form?: ChatPreviewFormSource | null,
  options?: {
    avatarUrl?: string;
    replyTimeLabel?: string;
  },
): InboxChatPreviewBundle {
  const channel =
    (record?.channel as Record<string, unknown> | undefined) ?? {};
  const sources = record ? [record, channel] : [];
  const customBlobs = record ? collectCustomAttributeBlobs(record) : [];
  const widgetConfig = extractWidgetConfig(customBlobs);
  const variantId = resolveVariantId(widgetConfig, customBlobs);
  const baseTemplate = CHAT_PREVIEW_TEMPLATES[variantId];
  const template = mergeChatPreviewTemplate(
    baseTemplate,
    buildTemplateOverrides(widgetConfig),
  );

  const pickField = (
    formKey: keyof ChatPreviewFormSource,
    ...recordKeys: string[]
  ): string => {
    const formValue = form?.[formKey];
    if (typeof formValue === "string" && formValue.trim()) {
      return formValue.trim();
    }
    return pickInboxString(sources, ...recordKeys);
  };

  const greetingEnabled =
    form?.greeting_enabled ??
    pickInboxBoolean(sources, "greeting_enabled", true);

  const replyTimeRaw =
    form?.reply_time?.trim() || pickInboxString(sources, "reply_time");
  const replyTimeLabel =
    options?.replyTimeLabel ??
    CHAT_PREVIEW_REPLY_TIME_LABELS[replyTimeRaw] ??
    CHAT_PREVIEW_REPLY_TIME_LABELS.in_a_few_minutes;

  const recordAvatar = pickInboxString(sources, "avatar_url", "thumbnail");
  const avatarUrl =
    form?.avatar_url?.trim() ||
    options?.avatarUrl?.trim() ||
    recordAvatar ||
    template.logoPath ||
    undefined;

  const assistantName =
    pickField("name", "name") ||
    pickField("welcome_title", "welcome_title", "welcome_heading") ||
    template.assistantName;

  const greetingMessage = greetingEnabled
    ? pickField("greeting_message", "greeting_message") ||
      template.greetingMessage
    : "";

  const runtime: ChatPreviewRuntimeData = {
    assistantName,
    avatarUrl,
    greetingMessage,
    welcomeTitle: pickField(
      "welcome_title",
      "welcome_title",
      "welcome_heading",
    ),
    welcomeTagline: pickField("welcome_tagline", "welcome_tagline"),
    widgetColor: pickField("widget_color", "widget_color") || "#1f93ff",
    replyTimeLabel,
    greetingEnabled,
  };

  return { runtime, variantId, template };
}

export function resolveChatPreviewTemplate(
  variantId: ChatPreviewVariantId,
  record?: Record<string, unknown> | null,
): ChatPreviewTemplate {
  const base = CHAT_PREVIEW_TEMPLATES[variantId];
  if (!record) return base;
  const customBlobs = collectCustomAttributeBlobs(record);
  const widgetConfig = extractWidgetConfig(customBlobs);
  return mergeChatPreviewTemplate(base, buildTemplateOverrides(widgetConfig));
}

export function resolveAssetUrl(
  origin: string,
  url?: string,
): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!origin) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function buildChatPreviewRuntimeData(
  template: ChatPreviewTemplate,
  inbox?: Partial<ChatPreviewRuntimeData>,
): ChatPreviewRuntimeData {
  return {
    assistantName:
      inbox?.assistantName?.trim() ||
      inbox?.welcomeTitle?.trim() ||
      template.assistantName,
    avatarUrl: inbox?.avatarUrl || template.logoPath,
    greetingMessage:
      inbox?.greetingEnabled === false
        ? ""
        : inbox?.greetingMessage?.trim() || template.greetingMessage,
    welcomeTitle: inbox?.welcomeTitle,
    welcomeTagline: inbox?.welcomeTagline,
    widgetColor: inbox?.widgetColor || "#1f93ff",
    replyTimeLabel: inbox?.replyTimeLabel,
    greetingEnabled: inbox?.greetingEnabled ?? true,
  };
}

export type ChatwootEmbedCredentials = {
  baseUrl: string;
  websiteToken: string;
};

/** Lấy baseUrl + websiteToken từ script Chatwoot gốc. */
export function parseChatwootEmbedScript(
  script: string,
): ChatwootEmbedCredentials | null {
  const baseUrlMatch = script.match(/BASE_URL\s*=\s*["']([^"']+)["']/i);
  const tokenMatch = script.match(/websiteToken:\s*['"]([^'"]+)['"]/i);
  if (!baseUrlMatch?.[1] || !tokenMatch?.[1]) return null;
  return {
    baseUrl: baseUrlMatch[1].replace(/\/$/, ""),
    websiteToken: tokenMatch[1],
  };
}

export function getEmbedScriptFileName(
  variantId: ChatPreviewVariantId,
): string {
  if (variantId === "fsel-techie") return "fsel-techie-embed.html";
  return "chatwoot-embed.html";
}

/** Sinh script nhúng theo variant — FSEL gộp config + loader thành 1 thẻ <script>. */
export function buildChatEmbedScript(
  variantId: ChatPreviewVariantId,
  options: {
    baseScript: string;
    template: ChatPreviewTemplate;
    data: ChatPreviewRuntimeData;
    widgetAssetsOrigin: string;
  },
): string {
  const trimmedBase = options.baseScript.trim();

  if (variantId === "chatwoot-default") {
    return trimmedBase;
  }

  const credentials = parseChatwootEmbedScript(trimmedBase);
  if (!credentials) {
    return [
      "<!-- Không đọc được websiteToken/baseUrl từ script Chatwoot gốc. -->",
      "<!-- Hãy tải lại inbox hoặc dùng khung Chatwoot mặc định. -->",
      trimmedBase,
    ].join("\n");
  }

  const widgetScriptPath =
    options.template.widgetScriptPath || "/inbox-widgets/fsel-techie.js";
  const widgetScriptUrl = `${options.widgetAssetsOrigin.replace(/\/$/, "")}${widgetScriptPath}`;
  const logoUrl =
    resolveAssetUrl(options.widgetAssetsOrigin, options.data.avatarUrl) ??
    resolveAssetUrl(options.widgetAssetsOrigin, options.template.logoPath);

  const config = {
    variant: variantId,
    baseUrl: credentials.baseUrl,
    websiteToken: credentials.websiteToken,
    /** Base OmniHub API (`NEXT_PUBLIC_API_BASE_URL`) — GET/POST live-chat personas */
    omniApiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
      /\/$/,
      "",
    ),
    assistantName: options.data.assistantName || options.template.assistantName,
    // Không fallback template khi greeting tắt / rỗng ("" là hợp lệ)
    greetingMessage:
      typeof options.data.greetingMessage === "string"
        ? options.data.greetingMessage
        : options.template.greetingMessage,
    /** Hiện phía trên nút chọn persona (thay greeting_message) */
    welcomeTagline:
      typeof options.data.welcomeTagline === "string"
        ? options.data.welcomeTagline
        : "",
    logoUrl,
    /** Fallback khi API personas lỗi / trống */
    quickReplies: options.template.quickReplies ?? [],
    inputPlaceholder: options.template.inputPlaceholder,
    inputPlaceholderWithActions:
      options.template.inputPlaceholderWithActions ||
      options.template.inputPlaceholder,
    showUsageQuota: options.template.showUsageQuota ?? false,
    usageQuotaLabel: options.template.usageQuotaLabel ?? "",
    launcherPromptLabel: options.template.launcherPromptLabel ?? "",
    primaryColor: FSEL_THEME.primary,
  };

  const configJson = JSON.stringify(config, null, 2);
  const widgetUrlJson = JSON.stringify(widgetScriptUrl);

  return [
    `<!-- ${options.template.label} · 1 script nhúng (config + loader) -->`,
    "<script>",
    "(function () {",
    "  if (window.__OMNICHANNEL_CHAT_WIDGET_BOOTSTRAPPED__) return;",
    "  window.__OMNICHANNEL_CHAT_WIDGET_BOOTSTRAPPED__ = true;",
    `  window.__OMNICHANNEL_CHAT_WIDGET__ = ${configJson};`,
    "",
    `  var src = ${widgetUrlJson};`,
    "  if (document.querySelector('script[data-omni-fsel-widget=\"1\"]')) return;",
    '  var s = document.createElement("script");',
    "  s.src = src;",
    "  s.async = true;",
    '  s.dataset.omniFselWidget = "1";',
    "  (document.head || document.body).appendChild(s);",
    "})();",
    "</script>",
  ].join("\n");
}

function formatPreviewTimestamp(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

function ChatPreviewLauncherBubble({
  isOpen,
  color,
  logoSrc,
  promptLabel,
  variantId,
  onToggle,
  onOpen,
}: {
  isOpen: boolean;
  color: string;
  logoSrc?: string;
  promptLabel?: string;
  variantId: ChatPreviewVariantId;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const isFsel = variantId === "fsel-techie";

  return (
    <div className="flex items-end justify-end gap-2.5 pt-2">
      {!isOpen && promptLabel ? (
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "max-w-[calc(100%-3.5rem)] rounded-2xl border px-3.5 py-2.5 text-left text-xs leading-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
            isFsel
              ? "border-[#D4DCFA] bg-white font-medium text-[#1A2456] shadow-[0_8px_22px_rgba(110,133,250,0.14)] hover:border-[#B8C4F5] hover:shadow-[0_10px_28px_rgba(110,133,250,0.2)]"
              : "border-black/8 bg-white font-medium text-[#1f2937] shadow-[0_8px_20px_rgba(15,23,42,0.1)] hover:border-black/12",
          )}
        >
          {promptLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex size-12 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95",
          isOpen && "ring-2 ring-white/90 ring-offset-2 ring-offset-[#F5F7FF]",
          isFsel
            ? "shadow-[0_12px_28px_rgba(110,133,250,0.38)]"
            : "shadow-[0_10px_24px_rgba(15,23,42,0.18)]",
        )}
        style={{ backgroundColor: color }}
        aria-label={isOpen ? "Đóng khung chat" : "Mở khung chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <MessageSquare className="size-5" />
        )}
      </button>
    </div>
  );
}

function FselTechieChatPreview({
  template,
  data,
  onClose,
}: {
  template: ChatPreviewTemplate;
  data: ChatPreviewRuntimeData;
  onClose?: () => void;
}) {
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const assistantName = data.assistantName || template.assistantName;
  const prePersonaIntro =
    data.welcomeTagline?.trim() ||
    "Chúng tôi sẵn sàng hỗ trợ bạn.";
  const logoSrc = data.avatarUrl || template.logoPath;
  const timestamp = useMemo(() => formatPreviewTimestamp(), []);
  const quickReplyCount = template.quickReplies?.length ?? 0;
  /** Giữ vùng chat cố định sau khi chọn quick reply (4 nút ≈ 12.5rem). */
  const messageAreaMinHeight =
    quickReplyCount > 0
      ? `${Math.max(quickReplyCount * 2.65 + (quickReplyCount - 1) * 0.5, 10)}rem`
      : "10rem";

  return (
    <div className="flex min-h-[26rem] flex-col overflow-hidden rounded-[20px] border border-[#D4DCFA] bg-white shadow-[0_16px_40px_rgba(110,133,250,0.18),0_4px_12px_rgba(26,36,86,0.05)]">
      <div className="flex items-center justify-between border-b border-[#D4DCFA] bg-gradient-to-b from-white to-[#F5F7FF] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF1FF] ring-2 ring-[#D4DCFA] shadow-[0_2px_8px_rgba(110,133,250,0.18)]">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={assistantName}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <MessageSquare className="size-4 text-[#6E85FA]" />
            )}
          </div>
          <p className="truncate text-sm font-bold tracking-[-0.01em] text-[#1A2456]">
            {assistantName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-7 items-center justify-center rounded-md text-[#7B88B8] transition-colors duration-200 hover:bg-[#EEF1FF]"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-2 bg-[#F5F7FF] px-4 py-4">
        <div className="max-w-[80%] shrink-0 space-y-1">
          <div className="flex items-center justify-between gap-2 px-3 text-[11px] leading-none">
            <span className="min-w-0 truncate font-semibold text-[#1A2456]">
              {assistantName}
            </span>
            <span className="shrink-0 font-medium text-[#7B88B8]">
              {timestamp}
            </span>
          </div>

          {prePersonaIntro ? (
            <div className="rounded-xl border border-[#D4DCFA] bg-white px-3 py-2.5 text-sm font-medium leading-5 text-[#2B3674] shadow-[0_2px_10px_rgba(110,133,250,0.12)]">
              {prePersonaIntro}
            </div>
          ) : null}
        </div>

        <div
          className="min-h-0 flex-1"
          style={{ minHeight: messageAreaMinHeight }}
        >
          {showQuickReplies && quickReplyCount > 0 ? (
            <div className="space-y-2">
              {template.quickReplies!.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setShowQuickReplies(false)}
                  className="w-full rounded-xl border border-[#D4DCFA] bg-white px-3 py-2.5 text-center text-sm font-semibold text-[#1A2456] shadow-[0_2px_8px_rgba(110,133,250,0.08)] transition-all duration-200 hover:scale-[1.005] hover:border-[#B8C4F5] hover:bg-[#EEF1FF] hover:shadow-[0_4px_14px_rgba(110,133,250,0.18)] active:scale-[0.995]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[inherit]" aria-hidden />
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#D4DCFA] bg-white px-4 py-3">
        <div className="mb-2 min-h-4">
          {template.showUsageQuota && !showQuickReplies ? (
            <p className="text-center text-[11px] font-medium text-[#7B88B8]">
              {template.usageQuotaLabel}
            </p>
          ) : template.showUsageQuota ? (
            <p className="invisible text-center text-[11px] font-medium">
              {template.usageQuotaLabel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="min-h-9 flex-1 rounded-xl border border-[#B8C4F5] bg-white px-3 py-4 text-xs font-medium text-[#7B88B8] shadow-[inset_0_1px_2px_rgba(110,133,250,0.07)]">
            {showQuickReplies
              ? template.inputPlaceholder
              : template.inputPlaceholderWithActions ||
                template.inputPlaceholder}
          </div>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#6E85FA] text-white shadow-[0_4px_14px_rgba(110,133,250,0.32)] transition-all duration-200 hover:brightness-95 active:scale-95"
            aria-label="Gửi tin nhắn"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatwootDefaultChatPreview({
  data,
  onClose,
}: {
  data: ChatPreviewRuntimeData;
  onClose?: () => void;
}) {
  const color = data.widgetColor || "#1f93ff";
  const assistantName = data.assistantName || "Hỗ trợ";

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
      <div
        className="flex items-center gap-3 px-4 py-3 text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]"
        style={{ backgroundColor: color }}
      >
        <Avatar className="size-9 border border-white/30">
          {data.avatarUrl ? (
            <AvatarImage src={data.avatarUrl} alt={assistantName} />
          ) : null}
          <AvatarFallback className="bg-white/20 text-white">
            <MessageSquare className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {data.welcomeTitle?.trim() || assistantName}
          </p>
          {data.replyTimeLabel ? (
            <p className="truncate text-xs text-white/80">
              Thường phản hồi {data.replyTimeLabel.toLowerCase()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/15"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-70 space-y-3 bg-[#fafafa] px-4 py-4">
        <div className="rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)] ring-1 ring-black/8">
          <p className="text-sm font-semibold text-[#1f2937]">
            {data.welcomeTitle?.trim() || "Xin chào"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#6b7280]">
            {data.welcomeTagline?.trim() || "Chúng tôi sẵn sàng hỗ trợ bạn."}
          </p>
        </div>

        {data.greetingEnabled !== false && data.greetingMessage ? (
          <div className="flex gap-2">
            <Avatar className="size-7 shrink-0">
              {data.avatarUrl ? (
                <AvatarImage src={data.avatarUrl} alt={assistantName} />
              ) : null}
              <AvatarFallback className="bg-muted text-[10px]">
                {assistantName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-sm font-medium text-[#1f2937] shadow-[0_2px_8px_rgba(15,23,42,0.06)] ring-1 ring-black/8">
              {data.greetingMessage}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-black/8 px-3 py-3">
        <div className="flex items-center gap-2 rounded-full border border-black/8 bg-[#f3f4f6] px-3 py-2 text-xs font-medium text-[#6b7280] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="flex-1">Nhập tin nhắn...</span>
          <span
            className="inline-flex size-6 items-center justify-center rounded-full text-white shadow-[0_2px_8px_rgba(15,23,42,0.2)]"
            style={{ backgroundColor: color }}
          >
            <Send className="size-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChatPreviewFrame({
  variantId,
  data,
  className,
}: {
  variantId: ChatPreviewVariantId;
  data: ChatPreviewRuntimeData;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const template = CHAT_PREVIEW_TEMPLATES[variantId];
  const launcherColor =
    variantId === "fsel-techie"
      ? FSEL_THEME.primary
      : data.widgetColor || "#1f93ff";
  const launcherLogo = data.avatarUrl || template.logoPath || undefined;
  const showLauncher = template.showLauncherBubble !== false;

  const handleToggle = () => setIsOpen((prev) => !prev);
  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  return (
    <div className={cn("mx-auto flex w-full max-w-100 flex-col", className)}>
      <div className="pb-4">
        <div
          className={cn(
            "transition-opacity duration-200",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!isOpen}
        >
          {variantId === "fsel-techie" ? (
            <FselTechieChatPreview
              template={template}
              data={data}
              onClose={handleClose}
            />
          ) : (
            <ChatwootDefaultChatPreview data={data} onClose={handleClose} />
          )}
        </div>
      </div>

      {showLauncher ? (
        <ChatPreviewLauncherBubble
          isOpen={isOpen}
          color={launcherColor}
          logoSrc={launcherLogo}
          promptLabel={template.launcherPromptLabel}
          variantId={variantId}
          onToggle={handleToggle}
          onOpen={handleOpen}
        />
      ) : null}
    </div>
  );
}

export function ChatPreviewVariantSelect({
  value,
  onChange,
  disabled,
}: {
  value: ChatPreviewVariantId;
  onChange: (value: ChatPreviewVariantId) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ChatPreviewVariantId)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-full border-border/80 text-xs">
        <SelectValue placeholder="Chọn khung chat" />
      </SelectTrigger>
      <SelectContent>
        {CHAT_PREVIEW_VARIANT_OPTIONS.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
