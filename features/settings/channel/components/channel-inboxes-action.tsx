"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Sketch } from "@uiw/react-color";
import {
  ArrowLeft,
  Code2,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  Search,
  Send,
  UsersRound,
} from "lucide-react";
import Stepper, { Step } from "@/components/stepper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCreateAccountInboxMembers,
  useCreateTenantInbox,
  useGetTenantInbox,
  useListChatwootAgents,
  useListTenantInboxes,
  useUpdateAccountInboxMembers,
  useUpdateTenantInbox,
} from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";
import { chatwootService } from "@/services/chatwoot/service";
import channelFormSchema from "./channel-form.json";

type ChannelKey = "website" | "sms" | "email" | "api" | "telegram" | "line";

type FieldType =
  | "text"
  | "textarea"
  | "color"
  | "select"
  | "checkbox"
  | "password"
  | "email"
  | "url";

type ChannelFieldOption = {
  label: string;
  value: string;
};

type ChannelField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  default?: string | boolean;
  options?: ChannelFieldOption[];
};

type ChannelDefinition = {
  channel: ChannelKey;
  name: string;
  fields: ChannelField[];
};

type AgentOption = {
  id: string;
  userId: number | null;
  name: string;
  email: string;
  thumbnail?: string;
};

type ChannelFormValues = Record<string, string | boolean>;

interface ChannelInboxesActionProps {
  inboxId?: string;
}

const CHANNEL_DEFS = channelFormSchema as ChannelDefinition[];

const CHANNEL_META: Record<
  ChannelKey,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  website: {
    title: "Website",
    description: "Widget chat nhúng trên website của bạn.",
    icon: Globe,
    color:
      "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  },
  sms: {
    title: "SMS",
    description: "Kênh SMS qua Twilio Messaging.",
    icon: MessageSquareText,
    color:
      "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
  email: {
    title: "Email",
    description: "Nhận và trả lời yêu cầu hỗ trợ qua email.",
    icon: Mail,
    color:
      "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  },
  api: {
    title: "API",
    description: "Kênh API / webhook tùy chỉnh (Zalo OA, …).",
    icon: Code2,
    color:
      "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  telegram: {
    title: "Telegram",
    description: "Kết nối bot Telegram qua BotFather token.",
    icon: Send,
    color:
      "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  },
  line: {
    title: "LINE",
    description: "Kết nối kênh LINE Messaging API.",
    icon: MessageCircle,
    color:
      "bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400",
  },
};

const CHANNEL_TYPE_TO_KEY: Record<string, ChannelKey> = {
  "Channel::WebWidget": "website",
  "Channel::Api": "api",
  "Channel::Email": "email",
  "Channel::TwilioSms": "sms",
  "Channel::Sms": "sms",
  "Channel::Telegram": "telegram",
  "Channel::Line": "line",
  website: "website",
  web_widget: "website",
  api: "api",
  email: "email",
  sms: "sms",
  telegram: "telegram",
  line: "line",
};

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

function findNumericIdInValue(
  value: unknown,
  depth = 0,
  keys: string[] = ["id", "inbox_id", "chatwoot_inbox_id", "cw_inbox_id"],
): number | null {
  if (value == null || depth > 6) return null;

  if (typeof value === "number" || typeof value === "string") {
    return toNumericId(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumericIdInValue(item, depth + 1, keys);
      if (found !== null) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      const found = toNumericId(record[key]);
      if (found !== null) return found;
    }
    for (const nested of Object.values(record)) {
      if (nested && typeof nested === "object") {
        const found = findNumericIdInValue(nested, depth + 1, keys);
        if (found !== null) return found;
      }
    }
  }

  return null;
}

function extractNumericInboxId(
  response: unknown,
  fallback?: string,
): number | null {
  const fromResponse = findNumericIdInValue(response);
  if (fromResponse !== null) return fromResponse;
  return toNumericId(fallback);
}

function isSuccessResponse(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const statusCode = (response as Record<string, unknown>).status_code;
  return statusCode === 200 || statusCode === 201;
}

function buildDefaultValues(
  def: ChannelDefinition | undefined,
): ChannelFormValues {
  const values: ChannelFormValues = {};
  if (!def) return values;
  for (const field of def.fields) {
    if (field.type === "checkbox") {
      values[field.key] = Boolean(field.default ?? false);
    } else if (field.type === "color") {
      values[field.key] = String(field.default ?? "#1f93ff");
    } else if (field.type === "select") {
      values[field.key] = String(
        field.default ?? field.options?.[0]?.value ?? "",
      );
    } else {
      values[field.key] = String(field.default ?? "");
    }
  }
  return values;
}

function mapInboxToFormValues(
  record: Record<string, unknown>,
  channelKey: ChannelKey,
): ChannelFormValues {
  const def = CHANNEL_DEFS.find((item) => item.channel === channelKey);
  const values = buildDefaultValues(def);
  const channel =
    (record.channel as Record<string, unknown> | undefined) ?? record;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = record[key] ?? channel[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return value;
      }
    }
    return undefined;
  };

  switch (channelKey) {
    case "website":
      values.website_name = String(pick("name", "website_name") ?? "");
      values.website_domain = String(
        pick("website_url", "website_domain", "allowed_domains") ?? "",
      );
      values.widget_color = String(pick("widget_color") ?? "#1f93ff");
      values.welcome_heading = String(
        pick("welcome_title", "welcome_heading") ?? "",
      );
      values.welcome_tagline = String(pick("welcome_tagline") ?? "");
      values.enable_channel_greeting =
        pick("greeting_enabled") === true ||
        pick("enable_channel_greeting") === "enabled"
          ? "enabled"
          : "disabled";
      values.greeting_message = String(pick("greeting_message") ?? "");
      break;
    case "sms":
      values.api_provider = String(
        pick("provider", "api_provider") ?? "twilio",
      );
      values.inbox_name = String(pick("name", "inbox_name") ?? "");
      values.phone_number = String(pick("phone_number") ?? "");
      values.account_sid = String(pick("account_sid") ?? "");
      values.auth_token = String(pick("auth_token") ?? "");
      values.use_twilio_messaging_service = Boolean(
        pick("messaging_service_sid"),
      );
      values.use_api_key_authentication = false;
      break;
    case "email":
      values.channel_name = String(pick("name", "channel_name") ?? "");
      values.email = String(pick("email", "forward_to_email") ?? "");
      break;
    case "api":
      values.channel_name = String(pick("name", "channel_name") ?? "");
      values.webhook_url = String(
        pick("webhook_url", "callback_webhook_url") ?? "",
      );
      break;
    case "telegram":
      values.bot_token = String(pick("bot_token") ?? "");
      break;
    case "line":
      values.channel_name = String(pick("name", "channel_name") ?? "");
      values.line_channel_id = String(pick("line_channel_id") ?? "");
      values.line_channel_secret = String(pick("line_channel_secret") ?? "");
      values.line_channel_token = String(pick("line_channel_token") ?? "");
      break;
  }

  return values;
}

function buildInboxPayload(channelKey: ChannelKey, values: ChannelFormValues) {
  const str = (key: string) => String(values[key] ?? "").trim();
  const bool = (key: string) => Boolean(values[key]);

  const base: Record<string, unknown> = {
    channel_type: channelKey,
  };

  switch (channelKey) {
    case "website":
      return {
        ...base,
        name: str("website_name"),
        greeting_enabled: values.enable_channel_greeting === "enabled",
        greeting_message: str("greeting_message"),
        channel: {
          type: "web_widget",
          website_url: str("website_domain"),
          widget_color: str("widget_color") || "#1f93ff",
          welcome_title: str("welcome_heading") || null,
          welcome_tagline: str("welcome_tagline") || null,
        },
      };
    case "sms":
      return {
        ...base,
        name: str("inbox_name"),
        channel: {
          type: "sms",
          provider: str("api_provider") || "twilio",
          phone_number: str("phone_number"),
          account_sid: str("account_sid"),
          auth_token: str("auth_token"),
          use_twilio_messaging_service: bool("use_twilio_messaging_service"),
          use_api_key_authentication: bool("use_api_key_authentication"),
        },
      };
    case "email":
      return {
        ...base,
        name: str("channel_name"),
        channel: {
          type: "email",
          email: str("email"),
        },
      };
    case "api":
      return {
        ...base,
        name: str("channel_name"),
        channel: {
          type: "api",
          webhook_url: str("webhook_url"),
        },
      };
    case "telegram":
      return {
        ...base,
        name: "Telegram",
        channel: {
          type: "telegram",
          bot_token: str("bot_token"),
        },
      };
    case "line":
      return {
        ...base,
        name: str("channel_name"),
        channel: {
          type: "line",
          line_channel_id: str("line_channel_id"),
          line_channel_secret: str("line_channel_secret"),
          line_channel_token: str("line_channel_token"),
        },
      };
    default:
      return base;
  }
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
    name: name || `Agent ${index + 1}`,
    email: email || "N/A",
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

function resolveChannelKey(raw: unknown): ChannelKey | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return CHANNEL_TYPE_TO_KEY[value] ?? null;
}

export function ChannelInboxesAction({ inboxId }: ChannelInboxesActionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const isEdit = Boolean(inboxId);

  const [currentStep, setCurrentStep] = useState(isEdit ? 2 : 1);
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | null>(
    null,
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [inboxHydrated, setInboxHydrated] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);

  const selectedDef = useMemo(
    () => CHANNEL_DEFS.find((item) => item.channel === selectedChannel),
    [selectedChannel],
  );

  const form = useForm<ChannelFormValues>({
    defaultValues: {},
  });

  const { data: inboxResponse, isLoading: isLoadingInbox } = useGetTenantInbox(
    tenantId,
    inboxId ?? "",
  );
  const { data: inboxesListResponse, isLoading: isLoadingInboxesList } =
    useListTenantInboxes(tenantId);
  const { data: agentsResponse, isLoading: isLoadingAgents } =
    useListChatwootAgents(tenantId);

  const createInbox = useCreateTenantInbox();
  const updateInbox = useUpdateTenantInbox();
  const createInboxMembers = useCreateAccountInboxMembers();
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

  useEffect(() => {
    if (!selectedDef) return;
    if (isEdit && !inboxHydrated) return;
    if (isEdit) return;
    form.reset(buildDefaultValues(selectedDef));
  }, [form, inboxHydrated, isEdit, selectedDef]);

  useEffect(() => {
    if (!isEdit || !inboxId || inboxHydrated) return;

    let record = extractSingleRecord(inboxResponse);
    if (!record && inboxesListResponse) {
      record =
        extractRecords(inboxesListResponse).find(
          (item) => String(item.id ?? "").trim() === inboxId,
        ) ?? null;
    }

    if (!record) {
      if (isLoadingInbox || isLoadingInboxesList) return;
      setInboxHydrated(true);
      return;
    }

    const channelKey =
      resolveChannelKey(record.channel_type) ??
      resolveChannelKey(
        (record.channel as Record<string, unknown> | undefined)?.type,
      ) ??
      "api";

    setSelectedChannel(channelKey);
    form.reset(mapInboxToFormValues(record, channelKey));
    setInboxHydrated(true);
  }, [
    form,
    inboxHydrated,
    inboxId,
    inboxResponse,
    inboxesListResponse,
    isEdit,
    isLoadingInbox,
    isLoadingInboxesList,
  ]);

  const handleBackToList = () => {
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

  const validateChannelFields = () => {
    if (!selectedDef) {
      toast.error("Vui lòng chọn loại kênh");
      setCurrentStep(1);
      return false;
    }

    const values = form.getValues();
    for (const field of selectedDef.fields) {
      if (!field.required) continue;
      const value = values[field.key];
      if (field.type === "checkbox") continue;
      if (typeof value !== "string" || !value.trim()) {
        form.setError(field.key, {
          type: "required",
          message: `${field.label} không được để trống`,
        });
        toast.error(`Vui lòng nhập ${field.label}`);
        setCurrentStep(2);
        return false;
      }
    }
    return true;
  };

  const handleSubmitAll = async () => {
    if (!tenantId) {
      toast.error("Không tìm thấy tenant");
      return false;
    }
    if (!selectedChannel || !validateChannelFields()) return false;

    setSubmitting(true);
    try {
      const formValues = form.getValues();
      const payload = buildInboxPayload(selectedChannel, formValues);
      const inboxName = String(payload.name ?? "").trim();
      let resolvedInboxId: number | null = null;

      if (isEdit && inboxId) {
        const res = await updateInbox.mutateAsync({
          tenantId,
          inboxId,
          data: payload,
        });
        if (!isSuccessResponse(res)) return false;
        resolvedInboxId = extractNumericInboxId(res, inboxId);
      } else {
        const res = await createInbox.mutateAsync({
          tenantId,
          data: payload,
        });
        if (!isSuccessResponse(res)) return false;
        resolvedInboxId = extractNumericInboxId(res);

        // Fallback: lấy inbox_id từ danh sách nếu response tạo không trả id số
        if (resolvedInboxId === null) {
          try {
            const listRes = await chatwootService.listTenantInboxes(tenantId);
            const records = extractRecords(listRes);
            const matched = [...records]
              .reverse()
              .find(
                (item) =>
                  !inboxName ||
                  String(item.name ?? "").trim() === inboxName,
              );
            resolvedInboxId = extractNumericInboxId(
              matched ? { data: matched } : listRes,
            );
          } catch {
            // ignore list fallback errors; handled below
          }
        }
      }

      const userIds = selectedMemberIds
        .map((selectedId) => {
          const agent = agents.find((item) => item.id === selectedId);
          return agent?.userId ?? toNumericId(selectedId);
        })
        .filter((id): id is number => id !== null);

      // Luôn gọi inbox_members sau khi tạo/cập nhật kênh nếu đã chọn agent
      if (selectedMemberIds.length > 0) {
        if (userIds.length === 0) {
          toast.error("Không lấy được user_ids hợp lệ từ danh sách agent");
          return false;
        }

        if (resolvedInboxId === null) {
          toast.error("Không lấy được inbox_id để gán nhân viên");
          return false;
        }

        const membersPayload = {
          inbox_id: resolvedInboxId,
          user_ids: userIds,
        };

        const membersRes = isEdit
          ? await updateInboxMembers.mutateAsync({
              accountId: tenantId,
              data: membersPayload,
            })
          : await createInboxMembers.mutateAsync({
              accountId: tenantId,
              data: membersPayload,
            });

        if (!isSuccessResponse(membersRes)) return false;
      }

      setCurrentStep(4);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const isBootstrapping = isEdit && !inboxHydrated;
  const isBusy =
    submitting ||
    createInbox.isPending ||
    updateInbox.isPending ||
    createInboxMembers.isPending ||
    updateInboxMembers.isPending;
  const isSuccessStep = currentStep === 4;

  if (isBootstrapping) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-105 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={handleBackToList}
          disabled={isBusy}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Quay lại</span>
        </Button>
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? "Cập nhật kênh" : "Tạo kênh mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Chỉnh sửa thông tin kênh và nhân viên phụ trách."
              : "Chọn loại kênh, điền thông tin rồi gán nhân viên xử lý."}
          </p>
        </div>
      </div>

      <Stepper
        key={inboxId ?? "create"}
        initialStep={isEdit ? 2 : 1}
        activeStep={currentStep}
        onStepChange={(step) => {
          if (isSuccessStep) return;
          if (isEdit && step === 1) return;
          setCurrentStep(step);
        }}
        backButtonText="Quay lại"
        nextButtonText={
          currentStep === 3
            ? isEdit
              ? "Cập nhật kênh"
              : "Tạo kênh"
            : "Tiếp tục"
        }
        completeButtonText="Về danh sách"
        disableStepIndicators={isSuccessStep || isBusy}
        hideFooter={isSuccessStep}
        contentClassName="px-0.5"
        backButtonProps={{
          disabled: isBusy || isSuccessStep || (isEdit && currentStep === 2),
        }}
        nextButtonProps={{
          disabled:
            isBusy || isSuccessStep || (currentStep === 1 && !selectedChannel),
          onClick: (event) => {
            if (currentStep === 1) {
              if (!selectedChannel) {
                event.preventDefault();
                toast.error("Vui lòng chọn loại kênh");
              }
              return;
            }

            if (currentStep === 2) {
              if (!validateChannelFields()) {
                event.preventDefault();
              }
              return;
            }

            if (currentStep === 3) {
              event.preventDefault();
              void handleSubmitAll();
              return;
            }

            if (currentStep === 4) {
              event.preventDefault();
              handleBackToList();
            }
          },
        }}
      >
        <Step>
          <div className="space-y-4 px-1 pb-2 sm:px-1.5">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Chọn kênh</h3>
              <p className="text-sm text-muted-foreground">
                Chọn loại kênh bạn muốn kết nối với hệ thống.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CHANNEL_DEFS.map((def) => {
                const meta = CHANNEL_META[def.channel];
                const Icon = meta.icon;
                const selected = selectedChannel === def.channel;

                return (
                  <button
                    key={def.channel}
                    type="button"
                    disabled={isBusy || isEdit}
                    onClick={() => {
                      setSelectedChannel(def.channel);
                      form.reset(buildDefaultValues(def));
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-primary/40 hover:bg-muted/30",
                      (isBusy || isEdit) && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        meta.color,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{meta.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-4 px-1 pb-2 sm:px-1.5">
            <div className="space-y-1">
              <h3 className="text-base font-medium">
                {isEdit ? "Cập nhật thông tin kênh" : "Điền thông tin kênh"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedChannel
                  ? `Cấu hình cho ${CHANNEL_META[selectedChannel].title}.`
                  : "Vui lòng chọn loại kênh ở bước trước."}
              </p>
            </div>

            {!selectedDef ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Chưa chọn kênh. Quay lại bước 1 để tiếp tục.
              </div>
            ) : (
              <Form {...form}>
                <div className="space-y-4">
                  {selectedDef.fields.map((field) => (
                    <FormField
                      key={field.key}
                      control={form.control}
                      name={field.key}
                      rules={
                        field.required && field.type !== "checkbox"
                          ? {
                              required: `${field.label} không được để trống`,
                            }
                          : undefined
                      }
                      render={({ field: rhfField }) => (
                        <FormItem>
                          {field.type === "checkbox" ? (
                            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-primary/5 px-3 py-3">
                              <div className="space-y-0.5 pr-4">
                                <FormLabel className="text-sm font-medium">
                                  {field.label}
                                  {field.required ? (
                                    <span className="text-destructive"> *</span>
                                  ) : null}
                                </FormLabel>
                                {field.helperText ? (
                                  <FormDescription>
                                    {field.helperText}
                                  </FormDescription>
                                ) : null}
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(rhfField.value)}
                                  onCheckedChange={(checked) =>
                                    rhfField.onChange(checked === true)
                                  }
                                  disabled={isBusy || isSuccessStep}
                                />
                              </FormControl>
                            </div>
                          ) : (
                            <>
                              <FormLabel>
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive"> *</span>
                                ) : null}
                              </FormLabel>
                              <FormControl>
                                {field.type === "textarea" ? (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    maxLength={field.maxLength}
                                    rows={4}
                                    className="border-2 border-border"
                                    disabled={isBusy || isSuccessStep}
                                    value={String(rhfField.value ?? "")}
                                    onChange={rhfField.onChange}
                                    onBlur={rhfField.onBlur}
                                    name={rhfField.name}
                                    ref={rhfField.ref}
                                  />
                                ) : field.type === "select" ? (
                                  <Select
                                    value={String(rhfField.value ?? "")}
                                    onValueChange={rhfField.onChange}
                                    disabled={isBusy || isSuccessStep}
                                  >
                                    <SelectTrigger className="w-full border-2 border-border">
                                      <SelectValue
                                        placeholder={
                                          field.placeholder || "Chọn giá trị"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(field.options ?? []).map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : field.type === "color" ? (
                                  <div
                                    className={cn(
                                      "w-full",
                                      (isBusy || isSuccessStep) &&
                                        "pointer-events-none opacity-60",
                                    )}
                                  >
                                    <Sketch
                                      color={String(
                                        rhfField.value || "#1f93ff",
                                      )}
                                      onChange={(color) => {
                                        rhfField.onChange(color.hex);
                                      }}
                                      style={
                                        {
                                          width: "100%",
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
                                ) : (
                                  <Input
                                    type={
                                      field.type === "password"
                                        ? "password"
                                        : field.type === "email"
                                          ? "email"
                                          : field.type === "url"
                                            ? "url"
                                            : "text"
                                    }
                                    placeholder={field.placeholder}
                                    maxLength={field.maxLength}
                                    className="border-2 border-border"
                                    disabled={isBusy || isSuccessStep}
                                    value={String(rhfField.value ?? "")}
                                    onChange={rhfField.onChange}
                                    onBlur={rhfField.onBlur}
                                    name={rhfField.name}
                                    ref={rhfField.ref}
                                  />
                                )}
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription>
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                            </>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </Form>
            )}
          </div>
        </Step>

        <Step>
          <div className="space-y-4 px-1 pb-2 sm:px-1.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-medium">Thêm nhân viên</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn nhân viên được phép xử lý hội thoại trên kênh này.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full">
                {selectedMemberIds.length} đã chọn
              </Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="border-2 border-border pl-9"
                disabled={isBusy || isSuccessStep}
              />
            </div>

            <div className="max-h-90 overflow-y-auto rounded-xl border border-border/70 bg-muted/30 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoadingAgents ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-52" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <UsersRound className="size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Không có nhân viên</p>
                  <p className="text-xs text-muted-foreground">
                    {memberSearch.trim()
                      ? "Thử đổi từ khóa tìm kiếm."
                      : "Hãy thêm nhân viên hỗ trợ trước khi gán vào kênh."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {filteredAgents.map((agent) => {
                    const checked = selectedMemberIds.includes(agent.id);
                    return (
                      <li key={agent.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-background/70",
                            checked && "bg-primary/5",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleMember(agent.id, value === true)
                            }
                            disabled={isBusy || isSuccessStep}
                          />
                          <Avatar className="size-9 rounded-lg border border-border/60">
                            {agent.thumbnail ? (
                              <AvatarImage
                                src={agent.thumbnail}
                                alt={agent.name}
                                className="rounded-lg object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="rounded-lg text-xs">
                              {initials(agent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {agent.name}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
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

            {isBusy ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Đang lưu kênh...
              </p>
            ) : null}
          </div>
        </Step>

        <Step>
          <div className="flex flex-col items-center py-6">
            <div className="h-60 w-60 overflow-hidden">
              <DotLottieReact
                src="/success/success2.lottie"
                autoplay
                loop={false}
                speed={0.5}
                className="h-full w-full scale-110 origin-center"
              />
            </div>

            <div className="-mt-8 flex max-w-md flex-col items-center gap-4 text-center">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight">
                  {isEdit ? "Cập nhật kênh thành công" : "Tạo kênh thành công"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "Thông tin kênh đã được lưu."
                    : "Kênh mới đã sẵn sàng để tiếp nhận hội thoại."}
                </p>
              </div>

              <Button type="button" onClick={handleBackToList}>
                Về danh sách
              </Button>
            </div>
          </div>
        </Step>
      </Stepper>
    </div>
  );
}

export default ChannelInboxesAction;
