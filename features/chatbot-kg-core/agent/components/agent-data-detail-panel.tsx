"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, Loader2 } from "lucide-react";
import { useGetAgentById } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type {
  AgentConfig,
  KgAgent,
} from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";

const readOnlyInputClass =
  "min-h-7 rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-2 py-1 text-sm text-foreground/88 shadow-none read-only:cursor-default read-only:opacity-100 focus-visible:ring-0";

const readOnlyTextareaClass =
  "min-h-24 resize-none rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground/88 shadow-none read-only:cursor-default read-only:opacity-100 focus-visible:ring-0";

const sectionAccentMap: Record<string, { border: string; header: string }> = {
  "Mô hình LLM": {
    border: "border-l-violet-400/80",
    header: "bg-violet-50/70 dark:bg-violet-950/15",
  },
  LightRAG: {
    border: "border-l-sky-400/80",
    header: "bg-sky-50/70 dark:bg-sky-950/15",
  },
  Prompt: {
    border: "border-l-amber-400/80",
    header: "bg-amber-50/60 dark:bg-amber-950/15",
  },
  "Phong cách": {
    border: "border-l-rose-400/80",
    header: "bg-rose-50/60 dark:bg-rose-950/15",
  },
  "Viết lại truy vấn": {
    border: "border-l-cyan-400/80",
    header: "bg-cyan-50/60 dark:bg-cyan-950/15",
  },
  "Hành vi": {
    border: "border-l-orange-400/80",
    header: "bg-orange-50/60 dark:bg-orange-950/15",
  },
  "Truy hồi": {
    border: "border-l-indigo-400/80",
    header: "bg-indigo-50/60 dark:bg-indigo-950/15",
  },
  "Phạm vi nghiệp vụ": {
    border: "border-l-teal-400/80",
    header: "bg-teal-50/60 dark:bg-teal-950/15",
  },
  FAQ: {
    border: "border-l-lime-400/80",
    header: "bg-lime-50/60 dark:bg-lime-950/15",
  },
  "Bộ nhớ hội thoại": {
    border: "border-l-fuchsia-400/80",
    header: "bg-fuchsia-50/60 dark:bg-fuchsia-950/15",
  },
  "Tổng quan": {
    border: "border-l-primary/70",
    header: "bg-primary/8 dark:bg-primary/10",
  },
};

const enabledBadgeClass = {
  on: "border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-emerald-400",
  off: "border border-border/70 bg-accent/40 text-accent-foreground/80 dark:border-sidebar-border/50 dark:bg-transparent dark:text-sidebar-foreground/80",
};

const sectionShellClass =
  "overflow-hidden rounded-xl border border-border/70 bg-background dark:bg-transparent";

const sectionHeaderClass =
  "border-b border-border/50 px-3 py-2.5 dark:bg-transparent";

function hasDisplayValue(value: unknown) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function formatBoolean(value: boolean) {
  return value ? "Bật" : "Tắt";
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return formatBoolean(value);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function ReadOnlyValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return <div className={cn(readOnlyInputClass, className)}>{value}</div>;
}

function AgentDetailField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5 px-0.5">
        <Label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </Label>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
      <div className="rounded-xl border border-border/60 p-1 dark:border-border/50">
        <div className="rounded-[calc(0.75rem-0.125rem)] bg-background dark:bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const accent = sectionAccentMap[title] ?? sectionAccentMap["Tổng quan"];

  return (
    <section
      className={cn(
        sectionShellClass,
        "border-l-[3px]",
        accent.border,
      )}
    >
      <div className={cn(sectionHeaderClass, accent.header)}>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-foreground/75 uppercase">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ConfigRowCompact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-border/40 px-3 py-2.5 last:border-b-0 sm:border-r sm:last:border-r-0">
      <Label className="mb-1 block text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
        {label}
      </Label>
      <ReadOnlyValue value={value} />
    </div>
  );
}

function ConfigRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="border-t border-border/40 px-3 py-2.5 first:border-t-0">
      <Label className="mb-1.5 block text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
        {label}
      </Label>
      {multiline ? (
        <Textarea readOnly value={value} className={readOnlyTextareaClass} />
      ) : (
        <ReadOnlyValue value={value} />
      )}
    </div>
  );
}

function ConfigRowsGroup({
  entries,
}: {
  entries: Array<{ label: string; value: unknown; multiline?: boolean }>;
}) {
  const visible = entries.filter((entry) => hasDisplayValue(entry.value));
  const shortRows = visible.filter((entry) => !entry.multiline);
  const longRows = visible.filter((entry) => entry.multiline);

  if (visible.length === 0) return null;

  return (
    <>
      {shortRows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {shortRows.map((entry) => (
            <ConfigRowCompact
              key={entry.label}
              label={entry.label}
              value={formatValue(entry.value)}
            />
          ))}
        </div>
      ) : null}
      {longRows.map((entry) => (
        <ConfigRow
          key={entry.label}
          label={entry.label}
          value={formatValue(entry.value)}
          multiline
        />
      ))}
    </>
  );
}

function OverviewMetaItem({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
      {Icon ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-800/40 dark:bg-violet-950/25 dark:text-violet-300">
          <Icon className="size-3.5" />
        </span>
      ) : null}
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
          {label}
        </p>
        <p
          className={cn(
            "text-sm leading-snug break-all text-foreground/90",
            mono && "font-mono text-xs",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

interface AgentOverviewSectionProps {
  agent: KgAgent;
}

function AgentOverviewSection({ agent }: AgentOverviewSectionProps) {
  return (
    <ConfigSection
      title="Tổng quan"
      description="Trạng thái hoạt động và key agent"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2.5 border-b border-border/40 px-3 py-2.5 sm:border-r sm:border-b-0">
          <Label className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
            Trạng thái
          </Label>
          <Badge
            variant="outline"
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
              agent.enabled ? enabledBadgeClass.on : enabledBadgeClass.off,
            )}
          >
            {agent.enabled ? "Đang bật" : "Đã tắt"}
          </Badge>
        </div>
        <OverviewMetaItem label="Key" value={agent.key} icon={KeyRound} mono />
      </div>
    </ConfigSection>
  );
}

function AgentConfigSections({ config }: { config: AgentConfig }) {
  const sections = [
    {
      title: "Mô hình LLM",
      description: "Tham số sinh văn bản",
      entries: [
        { label: "Temperature", value: config.llm?.temperature },
        { label: "Max tokens", value: config.llm?.max_tokens },
        { label: "Top P", value: config.llm?.top_p },
        { label: "Frequency penalty", value: config.llm?.frequency_penalty },
        { label: "Presence penalty", value: config.llm?.presence_penalty },
      ],
    },
    {
      title: "LightRAG",
      description: "Cấu hình truy vấn đồ thị tri thức",
      entries: [
        { label: "Mode", value: config.lightrag?.mode },
        { label: "Chunk top K", value: config.lightrag?.chunk_top_k },
        { label: "Top K", value: config.lightrag?.top_k },
        { label: "Cosine threshold", value: config.lightrag?.cosine_threshold },
      ],
    },
    {
      title: "Prompt",
      description: "Hướng dẫn hệ thống và ngôn ngữ",
      entries: [
        {
          label: "System prompt",
          value: config.prompts?.system,
          multiline: true,
        },
        { label: "Ngôn ngữ phản hồi", value: config.prompts?.response_language },
        {
          label: "RAG user template",
          value: config.prompts?.rag_user_template,
          multiline: true,
        },
      ],
    },
    {
      title: "Phong cách",
      description: "Preset và hướng dẫn bổ sung",
      entries: [
        { label: "Preset", value: config.style?.preset },
        {
          label: "Hướng dẫn tùy chỉnh",
          value: config.style?.custom_instructions,
          multiline: true,
        },
      ],
    },
    {
      title: "Viết lại truy vấn",
      description: "Làm rõ câu hỏi trước khi truy vấn",
      entries: [
        { label: "Bật rewrite", value: config.query_rewrite?.enabled },
        {
          label: "Làm rõ khi mơ hồ",
          value: config.query_rewrite?.clarify_when_ambiguous,
        },
        {
          label: "Tối đa tin nhắn lịch sử",
          value: config.query_rewrite?.max_history_messages,
        },
        {
          label: "Tối đa câu hỏi làm rõ",
          value: config.query_rewrite?.max_clarifying_questions,
        },
      ],
    },
    {
      title: "Hành vi",
      description: "Giới hạn tải và xử lý",
      entries: [
        {
          label: "Giới hạn request/phút",
          value: config.behavior?.rate_limit_per_minute,
        },
        {
          label: "Tối đa người dùng đồng thời",
          value: config.behavior?.max_concurrent_users,
        },
        { label: "LangGraph", value: config.behavior?.langgraph_enabled },
      ],
    },
    {
      title: "Truy hồi",
      description: "Qdrant, rerank và LightRAG",
      entries: [
        { label: "Qdrant fetch limit", value: config.retrieval?.qdrant_fetch_limit },
        { label: "Rerank top K", value: config.retrieval?.rerank_top_k },
        { label: "Bật rerank", value: config.retrieval?.rerank_enabled },
        { label: "Bật LightRAG", value: config.retrieval?.lightrag_enabled },
        {
          label: "Timeout LightRAG (ms)",
          value: config.retrieval?.lightrag_query_timeout_ms,
        },
        { label: "Min score", value: config.retrieval?.min_score },
        {
          label: "Dedupe theo nguồn",
          value: config.retrieval?.dedupe_by_source,
        },
      ],
    },
    {
      title: "Phạm vi nghiệp vụ",
      description: "Giới hạn chủ đề trả lời",
      entries: [
        { label: "Bật phạm vi", value: config.business_scope?.enabled },
        { label: "Mode", value: config.business_scope?.mode },
        {
          label: "Cho phép small talk",
          value: config.business_scope?.allow_small_talk,
        },
        {
          label: "Quy định phạm vi",
          value: config.business_scope?.regulation_prompt,
          multiline: true,
        },
        {
          label: "Thông báo từ chối",
          value: config.business_scope?.refusal_message,
          multiline: true,
        },
      ],
    },
    {
      title: "FAQ",
      description: "Trả lời câu hỏi thường gặp",
      entries: [
        { label: "Bật FAQ", value: config.faq?.enabled },
        {
          label: "Ngưỡng tương đồng",
          value: config.faq?.similarity_threshold,
        },
        { label: "Tối đa ứng viên", value: config.faq?.max_candidates },
      ],
    },
    {
      title: "Bộ nhớ hội thoại",
      description: "Tư vấn và thu thập liên hệ",
      entries: [
        { label: "Bật memory", value: config.memory?.enabled },
        { label: "Chào một lần", value: config.memory?.greeting_once },
        {
          label: "Tư vấn bán hàng",
          value: config.memory?.sales_consulting_enabled,
        },
        {
          label: "Tối đa lượt tư vấn",
          value: config.memory?.max_consulting_turns,
        },
        {
          label: "Chuyển người sau làm rõ",
          value: config.memory?.handoff_after_clarifications,
        },
        {
          label: "Trường liên hệ bắt buộc",
          value: config.memory?.required_contact_fields,
        },
        {
          label: "Gợi ý dịch vụ",
          value: config.memory?.service_suggestions,
        },
      ],
    },
  ];

  const visibleSections = sections.filter((section) => {
    const entries = section.entries;
    return entries.some((entry) => hasDisplayValue(entry.value));
  });

  if (visibleSections.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground/65">
        không có dữ liệu cấu hình
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleSections.map((section) => (
        <ConfigSection
          key={section.title}
          title={section.title}
          description={section.description}
        >
          <ConfigRowsGroup entries={section.entries} />
        </ConfigSection>
      ))}
    </div>
  );
}

interface AgentDataDetailPanelProps {
  agent: KgAgent;
}

export function AgentDataDetailPanel({ agent }: AgentDataDetailPanelProps) {
  const { data: liveAgent, isLoading } = useGetAgentById(agent.id);

  const resolved = liveAgent ?? agent;
  const config = (resolved.config ?? {}) as AgentConfig;
  const hasConfig = hasDisplayValue(config) && Object.keys(config).length > 0;

  return (
    <div className="space-y-3 dark:bg-transparent">
      {isLoading && !liveAgent && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground dark:bg-transparent">
          <Loader2 className="size-3.5 animate-spin" />
          Đang tải thông tin agent...
        </div>
      )}

      {hasDisplayValue(resolved.name) && (
        <AgentDetailField label="Tên agent">
          <ReadOnlyValue value={resolved.name!} />
        </AgentDetailField>
      )}

      <AgentOverviewSection agent={resolved} />

      {hasConfig ? (
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Cấu hình
            </p>
            <p className="text-xs text-muted-foreground/80">
              Tham số vận hành agent theo nhóm chức năng
            </p>
          </div>

          {isLoading && !liveAgent ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : (
            <AgentConfigSections config={config} />
          )}
        </div>
      ) : null}
    </div>
  );
}
