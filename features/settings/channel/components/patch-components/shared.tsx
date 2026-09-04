"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  MessageSquare,
  Plus,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  buildChatEmbedScript,
  ChatPreviewFrame,
  ChatPreviewVariantSelect,
  getEmbedScriptFileName,
  resolveChatPreviewFromInbox,
  resolveChatPreviewTemplate,
  type ChatPreviewFormSource,
  type ChatPreviewVariantId,
} from "../chat-preview-config";

export const REPLY_TIME_OPTIONS = [
  { value: "in_a_few_minutes", label: "Trong vài phút" },
  { value: "in_a_few_hours", label: "Trong vài giờ" },
  { value: "in_a_day", label: "Trong một ngày" },
] as const;

export const FEATURE_FLAGS = [
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

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number]["key"];

export type ChannelKey =
  | "website"
  | "sms"
  | "whatsapp"
  | "email"
  | "api"
  | "telegram"
  | "line";

export const CHANNEL_TYPE_TO_KEY: Record<string, ChannelKey> = {
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

export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  website: "Website",
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
  api: "API",
  telegram: "Telegram",
  line: "LINE",
};

export type InboxEditFormValues = {
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
  hmac_token: string;
  allowed_domains: string;
  widget_enabled_in_mobile_apps: boolean;
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

export type AgentOption = {
  id: string;
  /** UUID user gắn với agent — gửi lên inbox_members.user_ids */
  userId: string | null;
  /** id số từ Chatwoot agent (để khớp payload inbox_members) */
  numericId: string | null;
  name: string;
  email: string;
  thumbnail?: string;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export const INPUT_CLASSNAME = "border-border/80 p-2";
export const TEXTAREA_CLASSNAME = "border-border/80 p-2";
export const SELECT_TRIGGER_CLASSNAME = "w-full border-border/80 p-2";

export function parseAllowedDomains(value: string): string[] {
  if (!value.trim()) return [];
  const seen = new Set<string>();
  const domains: string[] = [];
  for (const part of value.split(/[,;\n]+/)) {
    const domain = part.trim();
    if (!domain) continue;
    const key = domain.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    domains.push(domain);
  }
  return domains;
}

export function serializeAllowedDomains(domains: string[]): string {
  return domains.join(",");
}

export function AllowedDomainsTagsInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const domains = useMemo(() => parseAllowedDomains(value), [value]);

  const commitDraft = () => {
    const nextParts = parseAllowedDomains(draft);
    if (nextParts.length === 0) {
      setDraft("");
      return;
    }
    const merged = parseAllowedDomains(
      serializeAllowedDomains([...domains, ...nextParts]),
    );
    onChange(serializeAllowedDomains(merged));
    setDraft("");
  };

  const removeDomain = (domain: string) => {
    onChange(
      serializeAllowedDomains(
        domains.filter((item) => item.toLowerCase() !== domain.toLowerCase()),
      ),
    );
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-2 rounded-md border border-border/80 bg-background p-2",
          disabled && "opacity-60",
        )}
      >
        {domains.map((domain) => (
          <Badge
            key={domain}
            variant="secondary"
            className="max-w-full gap-1 rounded-md px-2 py-1 text-xs font-normal"
            translate="no"
          >
            <span className="truncate">{domain}</span>
            <button
              type="button"
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
              aria-label={`Xóa ${domain}`}
              disabled={disabled}
              onClick={() => removeDomain(domain)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commitDraft();
              return;
            }
            if (
              event.key === "Backspace" &&
              !draft &&
              domains.length > 0
            ) {
              removeDomain(domains[domains.length - 1]!);
            }
          }}
          onBlur={commitDraft}
          placeholder={
            domains.length === 0
              ? "Nhập tên miền rồi nhấn Enter hoặc Thêm"
              : "Thêm tên miền…"
          }
          className="h-8 min-w-40 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={commitDraft}
        >
          <Plus className="size-3.5" />
          Thêm tên miền
        </Button>
      </div>
    </div>
  );
}

export function InboxAvatarSetup({
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

export function WebsiteChatPreview({
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

              <ChatPreviewFrame variantId={previewVariant} data={previewData} />
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
