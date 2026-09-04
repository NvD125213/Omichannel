"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetTenantInbox,
  useListAccountInboxMembers,
  useListChatwootAgents,
  useListTenantInboxes,
  useUpdateAccountInboxMembers,
  useUpdateTenantInbox,
} from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";
import type { UpdateTenantInboxRequest } from "@/services/chatwoot/interface";
import {
  InboxCollaboratorsTab,
  InboxConfigurationTab,
  InboxSettingsTab,
} from "./patch-components";
import {
  CHANNEL_LABELS,
  CHANNEL_TYPE_TO_KEY,
  FEATURE_FLAGS,
  type AgentOption,
  type ChannelKey,
  type FeatureFlagKey,
  type InboxEditFormValues,
} from "./patch-components/shared";

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
    const messaging = data.messaging as
      | Record<string, unknown>
      | unknown[]
      | undefined;
    return (
      coerceRecords(data.payload) ??
      coerceRecords(data.agents) ??
      coerceRecords(data.members) ??
      coerceRecords(data.inbox_members) ??
      coerceRecords(data.inboxes) ??
      coerceRecords(messaging) ??
      coerceRecords(
        messaging && !Array.isArray(messaging) ? messaging.payload : null,
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
    website_url: pickString(sources, "website_url", "website_domain"),
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
    hmac_token: pickString(sources, "hmac_token"),
    allowed_domains: pickString(
      sources,
      "allowed_domains",
      "whitelisted_domains",
    ),
    widget_enabled_in_mobile_apps: pickBoolean(
      sources,
      "widget_enabled_in_mobile_apps",
      false,
    ),
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
          allowed_domains: values.allowed_domains.trim() || null,
          widget_enabled_in_mobile_apps: values.widget_enabled_in_mobile_apps,
          hmac_mandatory: values.hmac_mandatory,
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

/** PATCH chỉ phần Configuration — khớp payload Chatwoot channel.allowed_domains */
function buildConfigurationPayload(
  values: InboxEditFormValues,
): UpdateTenantInboxRequest {
  return {
    hmac_mandatory: values.hmac_mandatory,
    channel: {
      allowed_domains: values.allowed_domains.trim() || null,
      widget_enabled_in_mobile_apps: values.widget_enabled_in_mobile_apps,
      hmac_mandatory: values.hmac_mandatory,
    },
  };
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
  const name = String(record.name ?? record.available_name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const userId =
    toUuidId(record.user_id) ??
    toUuidId(record.uuid) ??
    toUuidId(record.id) ??
    toUuidId(record.account_user_id);
  const numericIdRaw =
    toNumericId(record.id) ??
    toNumericId(record.user_id) ??
    toNumericId(record.account_user_id);
  const numericId = numericIdRaw === null ? null : String(numericIdRaw);
  const id =
    userId ||
    numericId ||
    String(record.id ?? record.user_id ?? record.uuid ?? "").trim() ||
    email ||
    `agent-${index + 1}`;
  const thumbnail = pickAgentThumbnail(record);

  return {
    id,
    userId,
    numericId,
    name: name || `Nhân viên ${index + 1}`,
    email: email || "Không có",
    thumbnail,
  };
}

/** Avatar agent chuẩn từ API: field `thumbnail`. */
function pickAgentThumbnail(
  record: Record<string, unknown>,
): string | undefined {
  const raw = String(
    record.thumbnail ?? record.avatar_url ?? record.avatarUrl ?? "",
  ).trim();
  return raw || undefined;
}

function collectIdentityKeys(record: Record<string, unknown>): string[] {
  const keys = new Set<string>();
  for (const value of [
    record.user_id,
    record.uuid,
    record.id,
    record.account_user_id,
    record.email,
  ]) {
    const raw = String(value ?? "")
      .trim()
      .toLowerCase();
    if (raw) keys.add(raw);
  }
  return Array.from(keys);
}

function agentIdentityKeys(agent: AgentOption): string[] {
  return [agent.id, agent.userId, agent.numericId, agent.email]
    .map((value) =>
      String(value ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

function extractInboxMemberRecords(
  response: unknown,
  inboxRecord: Record<string, unknown> | null,
): Record<string, unknown>[] {
  const fromApi = extractRecords(response);
  if (fromApi.length > 0) return fromApi;
  if (!inboxRecord) return [];
  return (
    coerceRecords(inboxRecord.members) ??
    coerceRecords(inboxRecord.inbox_members) ??
    coerceRecords(inboxRecord.agents) ??
    []
  );
}

function resolveSelectedAgentIds(
  members: Record<string, unknown>[],
  agents: AgentOption[],
): string[] {
  if (members.length === 0 || agents.length === 0) return [];

  const memberKeys = new Set(members.flatMap(collectIdentityKeys));
  return agents
    .filter((agent) =>
      agentIdentityKeys(agent).some((key) => memberKeys.has(key)),
    )
    .map((agent) => agent.id);
}

/** Ưu tiên `thumbnail` từ inbox_members khi list agents thiếu avatar. */
function enrichAgentsWithMemberThumbnails(
  agents: AgentOption[],
  members: Record<string, unknown>[],
): AgentOption[] {
  if (agents.length === 0 || members.length === 0) return agents;

  const thumbnailByKey = new Map<string, string>();
  for (const member of members) {
    const thumb = pickAgentThumbnail(member);
    if (!thumb) continue;
    for (const key of collectIdentityKeys(member)) {
      thumbnailByKey.set(key, thumb);
    }
  }
  if (thumbnailByKey.size === 0) return agents;

  return agents.map((agent) => {
    const fromMember = agentIdentityKeys(agent)
      .map((key) => thumbnailByKey.get(key))
      .find(Boolean);
    const thumbnail = fromMember || agent.thumbnail;
    return thumbnail === agent.thumbnail ? agent : { ...agent, thumbnail };
  });
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
  hmac_token: "",
  allowed_domains: "",
  widget_enabled_in_mobile_apps: false,
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
  const [inboxRecord, setInboxRecord] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [membersHydrated, setMembersHydrated] = useState(false);
  const [isWidgetColorOpen, setIsWidgetColorOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingConfiguration, setSavingConfiguration] = useState(false);
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
  const {
    data: inboxMembersResponse,
    isLoading: isLoadingInboxMembers,
    isError: isInboxMembersError,
  } = useListAccountInboxMembers(tenantId, inboxId);

  const updateInbox = useUpdateTenantInbox();
  const updateInboxMembers = useUpdateAccountInboxMembers();

  const inboxMemberRecords = useMemo(
    () => extractInboxMemberRecords(inboxMembersResponse, inboxRecord),
    [inboxMembersResponse, inboxRecord],
  );

  const agents = useMemo(() => {
    const fromAgents = extractRecords(agentsResponse).map(normalizeAgent);
    return enrichAgentsWithMemberThumbnails(fromAgents, inboxMemberRecords);
  }, [agentsResponse, inboxMemberRecords]);

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

  useEffect(() => {
    if (membersHydrated || !tenantId || !inboxId || !hydrated) return;
    if (isLoadingAgents || (isLoadingInboxMembers && !isInboxMembersError))
      return;

    const memberRecords = inboxMemberRecords;
    setSelectedMemberIds(resolveSelectedAgentIds(memberRecords, agents));
    setMembersHydrated(true);
  }, [
    agents,
    hydrated,
    inboxId,
    inboxMemberRecords,
    isInboxMembersError,
    isLoadingAgents,
    isLoadingInboxMembers,
    membersHydrated,
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

  const handleSaveConfiguration = form.handleSubmit(async (values) => {
    if (!tenantId) {
      toast.error("Không tìm thấy đơn vị");
      return;
    }

    setSavingConfiguration(true);
    try {
      const res = await updateInbox.mutateAsync({
        tenantId,
        inboxId,
        data: buildConfigurationPayload(values),
      });
      if (!isSuccessResponse(res)) return;

      const updatedRecord = extractSingleRecord(res);
      if (updatedRecord) {
        const nextToken = pickString(
          [
            updatedRecord,
            (updatedRecord.channel as Record<string, unknown>) ?? {},
          ],
          "hmac_token",
        );
        if (nextToken) form.setValue("hmac_token", nextToken);
      }
    } catch {
      // toast handled by hook
    } finally {
      setSavingConfiguration(false);
    }
  });

  const handleCopyHmacToken = async () => {
    const token = form.getValues("hmac_token").trim();
    if (!token) {
      toast.error("Chưa có secret key");
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Đã sao chép secret key");
    } catch {
      toast.error("Không thể sao chép secret key");
    }
  };

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

  const isBusy = savingSettings || savingConfiguration || savingMembers;

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
          <TabsTrigger
            value="configuration"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cấu hình
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="settings"
          className="mt-0 overflow-x-hidden outline-none"
        >
          <InboxSettingsTab
            form={form}
            channelKey={channelKey}
            isBusy={isBusy}
            savingSettings={savingSettings}
            activeAvatarUrl={activeAvatarUrl}
            inboxRecord={inboxRecord}
            widgetScript={widgetScript}
            isWidgetColorOpen={isWidgetColorOpen}
            setIsWidgetColorOpen={setIsWidgetColorOpen}
            onAvatarFileSelect={handleAvatarFileSelect}
            onSubmit={handleSaveSettings}
            watched={{
              name: watched.name,
              welcome_title: watched.welcome_title,
              welcome_tagline: watched.welcome_tagline,
              widget_color: watched.widget_color,
              reply_time: watched.reply_time,
              greeting_enabled: watched.greeting_enabled,
              greeting_message: watched.greeting_message,
            }}
          />
        </TabsContent>

        <TabsContent
          value="collaborators"
          className="mt-0 space-y-4 overflow-x-hidden pb-6 outline-none"
        >
          <InboxCollaboratorsTab
            agents={agents}
            selectedMemberIds={selectedMemberIds}
            isLoadingAgents={isLoadingAgents}
            membersHydrated={membersHydrated}
            isBusy={isBusy}
            savingMembers={savingMembers}
            onToggleMember={toggleMember}
            onSave={() => void handleSaveCollaborators()}
          />
        </TabsContent>

        <TabsContent
          value="configuration"
          className="mt-0 w-full overflow-x-hidden pb-6 outline-none"
        >
          <InboxConfigurationTab
            form={form}
            isBusy={isBusy}
            savingConfiguration={savingConfiguration}
            onSubmit={handleSaveConfiguration}
            onCopyHmacToken={() => void handleCopyHmacToken()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ChannelInboxesActionPatch;
