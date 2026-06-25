"use client";

import {
  Bot,
  Braces,
  CirclePlus,
  Home,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ComboboxMultiple } from "@/components/ui/combobox-multiple";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateGraphAgent,
  useGetAgentById,
  usePatchAgentById,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { cn } from "@/lib/utils";
import { AgentDeleteDialog } from "./agent-data-action-dialog";
import { AGENT_FIELD_HINTS, AgentFieldLabel } from "./agent-field-label";
import {
  normalizeKgAgent,
  agentFormDefaultValues,
  agentToFormState,
  buildAgentPreviewPayload,
  buildCreateAgentRequest,
  buildPatchAgentRequest,
  DEFAULT_RAG_USER_TEMPLATE,
  DEFAULT_REQUIRED_CONTACT_FIELD_OPTIONS,
  LIGHTRAG_MODE_OPTIONS,
  STYLE_PRESET_OPTIONS,
  type AgentFormState,
} from "../utils/agent-form";

const fieldClass =
  "h-9 rounded-lg border-input/80 bg-white shadow-xs dark:bg-transparent";

const textareaClass =
  "min-h-28 rounded-lg border-input/80 bg-white shadow-xs dark:bg-transparent";

const cardClass =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm dark:bg-transparent";

const panelShellClass = "bg-card dark:bg-transparent";

const sectionShellClass =
  "rounded-xl border border-border/60 bg-muted/10 p-4 dark:bg-transparent";

const actionButtonClass = "h-9 rounded-lg";

function AgentFormSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const resolvedOptions =
    value && !options.some((option) => option.value === value)
      ? [...options, { value, label: value }]
      : options;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn(fieldClass, "w-full")}>
        <SelectValue placeholder="Chọn..." />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {resolvedOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="rounded-lg"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AgentConfigJsonPreview({ form }: { form: AgentFormState }) {
  const json = useMemo(() => {
    const payload = buildAgentPreviewPayload(form);
    return JSON.stringify(payload, null, 2);
  }, [form]);

  return (
    <div className={cn(sectionShellClass, "p-3")}>
      <pre className="max-h-full overflow-auto text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/85 thin-scroll">
        {json}
      </pre>
    </div>
  );
}

const RAG_TEMPLATE_PLACEHOLDERS = [
  { token: "{context}", label: "{context}" },
  { token: "{question}", label: "{question}" },
] as const;

const RAG_TEMPLATE_PREVIEW_SAMPLES = {
  context: "[đoạn context trích từ tài liệu...]",
  question: "Gói voice brandname giá bao nhiêu?",
} as const;

function RagTemplatePreview({ template }: { template: string }) {
  const segments = useMemo(() => {
    const parts: Array<{ type: "text" | "sample"; content: string }> = [];
    const pattern = /(\{context\}|\{question\})/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(template)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: template.slice(lastIndex, match.index),
        });
      }

      parts.push({
        type: "sample",
        content:
          match[1] === "{context}"
            ? RAG_TEMPLATE_PREVIEW_SAMPLES.context
            : RAG_TEMPLATE_PREVIEW_SAMPLES.question,
      });
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < template.length) {
      parts.push({ type: "text", content: template.slice(lastIndex) });
    }

    return parts;
  }, [template]);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/88">
      {segments.map((segment, index) =>
        segment.type === "sample" ? (
          <span
            key={`${segment.content}-${index}`}
            className="rounded-md bg-primary/8 px-1.5 py-0.5 text-foreground/92"
          >
            {segment.content}
          </span>
        ) : (
          <span key={`text-${index}`}>{segment.content}</span>
        ),
      )}
    </p>
  );
}

function RagUserTemplateField({
  enabled,
  value,
  onEnabledChange,
  onValueChange,
}: {
  enabled: boolean;
  value: string;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onValueChange(`${value}${token}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onValueChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-colors",
          enabled
            ? "border-primary/20 bg-primary/3 dark:bg-transparent"
            : "border-border/60 bg-muted/15 dark:bg-transparent",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
              enabled
                ? "border-primary/20 bg-primary/10"
                : "border-border/60 bg-background/80 dark:bg-transparent",
            )}
          >
            <Braces
              className={cn(
                "size-4",
                enabled ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground/90">
              Tùy chỉnh RAG user template
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Một lượt user gửi cho LLM sau khi retrieval
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(checked);
            if (checked && !value.trim()) {
              onValueChange(DEFAULT_RAG_USER_TEMPLATE);
            }
          }}
          aria-label="Bật tùy chỉnh RAG user template"
        />
      </div>

      {enabled ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border/60 dark:bg-transparent">
            <Textarea
              ref={textareaRef}
              id="rag-user-template"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              spellCheck={false}
              className={cn(
                textareaClass,
                "min-h-44 resize-y rounded-none border-0 bg-background/70 px-4 py-3.5 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent",
              )}
            />

            <div className="space-y-3 border-t border-border/50 bg-muted/10 px-4 py-3 dark:bg-transparent">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground/85">
                  Chèn placeholder
                </span>
                {RAG_TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder.token}
                    type="button"
                    onClick={() => insertPlaceholder(placeholder.token)}
                    className="inline-flex h-7 items-center rounded-md bg-primary/8 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/12"
                  >
                    {placeholder.label}
                  </button>
                ))}
              </div>

              <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                Không dùng {"{query}"} hay {"{{context}}"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="border-b border-border/50 bg-muted/10 px-4 py-2.5 dark:bg-transparent">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/85 uppercase">
                Xem trước (ví dụ)
              </p>
            </div>
            <div className="bg-muted/10 px-4 py-3.5 dark:bg-transparent">
              <RagTemplatePreview template={value} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", sectionShellClass)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground/90">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type AgentFormMode = "create" | "patch";

export function AgentDataAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const graphId = process.env.NEXT_PUBLIC_TEST_GRAPH_ID ?? "";

  const agentId = searchParams.get("agent_id") ?? "";
  const mode: AgentFormMode = agentId ? "patch" : "create";
  const isEditMode = mode === "patch";

  const [form, setForm] = useState<AgentFormState>(agentFormDefaultValues);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hydratedAgentIdRef = useRef<string | null>(null);

  const {
    data: agentResponse,
    isLoading: isLoadingAgent,
    isError: isAgentError,
  } = useGetAgentById(agentId);

  const agent = useMemo(
    () => normalizeKgAgent(agentResponse) ?? agentResponse ?? null,
    [agentResponse],
  );

  const { mutateAsync: createAgent, isPending: isCreating } =
    useCreateGraphAgent();
  const { mutateAsync: patchAgent, isPending: isPatching } =
    usePatchAgentById();

  const isSubmitting = isCreating || isPatching;
  const pageTitle = isEditMode ? "Cập nhật agent" : "Agent mới";

  const breadcrumbActionLabel = useMemo(() => {
    if (mode === "create") return "Tạo mới agent";

    const displayName =
      agent?.name?.trim() ||
      agent?.key?.trim() ||
      form.name.trim() ||
      form.key.trim();

    return displayName ? (
      <>
        <span className="font-medium text-primary">{displayName}</span>
      </>
    ) : (
      "Cập nhật agent"
    );
  }, [mode, agent, form.name, form.key]);

  useEffect(() => {
    hydratedAgentIdRef.current = null;

    if (mode === "create") {
      setForm(agentFormDefaultValues);
    }
  }, [mode, agentId]);

  useEffect(() => {
    if (mode !== "patch" || !agent) return;
    if (hydratedAgentIdRef.current === agent.id) return;

    setForm(agentToFormState(agent));
    hydratedAgentIdRef.current = agent.id;
  }, [mode, agent]);

  useEffect(() => {
    if (mode !== "patch" || agent || isLoadingAgent || !isAgentError) return;
    toast.error("Không tải được thông tin agent để chỉnh sửa");
  }, [mode, agent, isLoadingAgent, isAgentError]);

  const updateForm = <K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleResetForm = () => {
    if (isEditMode && agent) {
      setForm(agentToFormState(agent));
      return;
    }
    setForm(agentFormDefaultValues);
  };

  const handleSubmit = async () => {
    if (mode === "patch") {
      if (!agentId) return;
      const payload = buildPatchAgentRequest(form);
      await patchAgent({ agentId, data: payload });
      toast.success("Đã cập nhật agent");
      router.push("/ai/agent");
      return;
    }

    const payload = buildCreateAgentRequest(form);
    if (!payload || !graphId) {
      toast.error("Vui lòng nhập key agent");
      return;
    }

    await createAgent({ graphId, data: payload });
    toast.success("Đã tạo agent");
    router.push("/ai/agent");
  };

  const showLoading = mode === "patch" && isLoadingAgent && !agent;

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <AppBreadcrumb
          items={[
            {
              label: "Trang chủ",
              href: "/ai/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "Agent",
              href: "/ai/agent",
              icon: <Bot className="size-4" />,
            },
            {
              label: breadcrumbActionLabel as string,
              href: isEditMode
                ? `/ai/agent/actions?agent_id=${agentId}`
                : "/ai/agent/actions",
              icon:
                mode === "create" ? (
                  <CirclePlus className="size-4" />
                ) : (
                  <Pencil className="size-4" />
                ),
            },
          ]}
        />
      </div>

      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
        <Card className={cardClass}>
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-2">
            <div className="flex min-h-0 flex-col border-border/60 xl:border-r">
              <div
                className={cn(
                  "shrink-0 border-b border-border/60 px-5 py-4",
                  panelShellClass,
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Bot className="size-4 text-primary/70" />
                    {pageTitle}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={handleResetForm}
                    aria-label="Đặt lại form"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "flex h-0 min-h-0 flex-1 flex-col overflow-hidden",
                  panelShellClass,
                )}
              >
                <div className="flex h-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-4 thin-scroll">
                  {showLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-full rounded-lg" />
                      <Skeleton className="h-9 w-full rounded-lg" />
                      <Skeleton className="h-28 w-full rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <FormSection
                        title="Thông tin cơ bản"
                        description="Định danh và trạng thái agent"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="agent-key"
                              label="Key"
                              hint={AGENT_FIELD_HINTS.key}
                            />
                            <Input
                              id="agent-key"
                              value={form.key}
                              disabled={isEditMode}
                              onChange={(event) =>
                                updateForm("key", event.target.value)
                              }
                              placeholder="agent-cgv"
                              className={cn(fieldClass, "font-mono")}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="agent-name"
                              label="Tên agent"
                              hint={AGENT_FIELD_HINTS.name}
                            />
                            <Input
                              id="agent-name"
                              value={form.name}
                              onChange={(event) =>
                                updateForm("name", event.target.value)
                              }
                              placeholder="Agent tư vấn CGV"
                              className={fieldClass}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Checkbox
                            checked={form.enabled}
                            onCheckedChange={(checked) =>
                              updateForm("enabled", checked === true)
                            }
                          />
                          Đang bật
                        </label>
                      </FormSection>

                      <FormSection title="Mô hình LLM">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="temperature"
                              label="Độ sáng tạo"
                              hint={AGENT_FIELD_HINTS.temperature}
                            />
                            <Input
                              id="temperature"
                              type="number"
                              step="0.1"
                              min={0}
                              max={2}
                              value={form.temperature}
                              onChange={(event) =>
                                updateForm(
                                  "temperature",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="max-tokens"
                              label="Độ dài phản hồi tối đa"
                              hint={AGENT_FIELD_HINTS.maxTokens}
                            />
                            <Input
                              id="max-tokens"
                              type="number"
                              min={1}
                              value={form.maxTokens}
                              onChange={(event) =>
                                updateForm(
                                  "maxTokens",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Thiết lập tìm kiếm thông minh">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="lightrag-mode"
                              label="Chế độ"
                              hint={AGENT_FIELD_HINTS.lightragMode}
                            />
                            <AgentFormSelect
                              id="lightrag-mode"
                              value={form.lightragMode}
                              options={LIGHTRAG_MODE_OPTIONS}
                              onChange={(value) =>
                                updateForm("lightragMode", value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="chunk-top-k"
                              label="Số chunk tối đa"
                              hint={AGENT_FIELD_HINTS.chunkTopK}
                            />
                            <Input
                              id="chunk-top-k"
                              type="number"
                              min={1}
                              value={form.chunkTopK}
                              onChange={(event) =>
                                updateForm(
                                  "chunkTopK",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="qdrant-fetch-limit"
                              label="Giới hạn lấy từ Qdrant"
                            />
                            <Input
                              id="qdrant-fetch-limit"
                              type="number"
                              min={1}
                              value={form.qdrantFetchLimit}
                              onChange={(event) =>
                                updateForm(
                                  "qdrantFetchLimit",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="rerank-top-k"
                              label="Số kết quả rerank tối đa"
                            />
                            <Input
                              id="rerank-top-k"
                              type="number"
                              min={1}
                              value={form.rerankTopK}
                              onChange={(event) =>
                                updateForm(
                                  "rerankTopK",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.rerankEnabled}
                              onCheckedChange={(checked) =>
                                updateForm("rerankEnabled", checked === true)
                              }
                            />
                            Bật rerank
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.lightragEnabled}
                              onCheckedChange={(checked) =>
                                updateForm("lightragEnabled", checked === true)
                              }
                            />
                            Bật LightRAG
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.dedupeBySource}
                              onCheckedChange={(checked) =>
                                updateForm("dedupeBySource", checked === true)
                              }
                            />
                            Dedupe theo nguồn
                          </label>
                        </div>
                      </FormSection>

                      <FormSection title="Prompt & phong cách">
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="system-prompt"
                            label="System prompt"
                            hint={AGENT_FIELD_HINTS.systemPrompt}
                          />
                          <Textarea
                            id="system-prompt"
                            value={form.systemPrompt}
                            onChange={(event) =>
                              updateForm("systemPrompt", event.target.value)
                            }
                            className={textareaClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="style-preset"
                            label="Style preset"
                            hint={AGENT_FIELD_HINTS.stylePreset}
                          />
                          <AgentFormSelect
                            id="style-preset"
                            value={form.stylePreset}
                            options={STYLE_PRESET_OPTIONS}
                            onChange={(value) =>
                              updateForm("stylePreset", value)
                            }
                          />
                        </div>
                        <RagUserTemplateField
                          enabled={form.ragUserTemplateEnabled}
                          value={form.ragUserTemplate}
                          onEnabledChange={(enabled) =>
                            updateForm("ragUserTemplateEnabled", enabled)
                          }
                          onValueChange={(value) =>
                            updateForm("ragUserTemplate", value)
                          }
                        />
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="custom-instructions"
                            label="Hướng dẫn tùy chỉnh"
                            hint={AGENT_FIELD_HINTS.customInstructions}
                          />
                          <Textarea
                            id="custom-instructions"
                            value={form.customInstructions}
                            onChange={(event) =>
                              updateForm(
                                "customInstructions",
                                event.target.value,
                              )
                            }
                            className={textareaClass}
                          />
                        </div>
                      </FormSection>

                      <FormSection title="Hành vi & phạm vi">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="rate-limit"
                              label="Giới hạn request/phút"
                            />
                            <Input
                              id="rate-limit"
                              type="number"
                              min={1}
                              value={form.rateLimitPerMinute}
                              onChange={(event) =>
                                updateForm(
                                  "rateLimitPerMinute",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="max-concurrent-users"
                              label="Người dùng đồng thời"
                            />
                            <Input
                              id="max-concurrent-users"
                              type="number"
                              min={1}
                              value={form.maxConcurrentUsers}
                              onChange={(event) =>
                                updateForm(
                                  "maxConcurrentUsers",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.queryRewriteEnabled}
                              onCheckedChange={(checked) =>
                                updateForm(
                                  "queryRewriteEnabled",
                                  checked === true,
                                )
                              }
                            />
                            Viết lại truy vấn
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.businessScopeEnabled}
                              onCheckedChange={(checked) =>
                                updateForm(
                                  "businessScopeEnabled",
                                  checked === true,
                                )
                              }
                            />
                            Phạm vi nghiệp vụ
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.allowSmallTalk}
                              onCheckedChange={(checked) =>
                                updateForm("allowSmallTalk", checked === true)
                              }
                            />
                            Cho phép small talk
                          </label>
                        </div>
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="regulation-prompt"
                            label="Quy định phạm vi"
                            hint={AGENT_FIELD_HINTS.regulationPrompt}
                          />
                          <Textarea
                            id="regulation-prompt"
                            value={form.regulationPrompt}
                            onChange={(event) =>
                              updateForm("regulationPrompt", event.target.value)
                            }
                            className={textareaClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="refusal-message"
                            label="Thông báo từ chối"
                            hint={AGENT_FIELD_HINTS.refusalMessage}
                          />
                          <Textarea
                            id="refusal-message"
                            value={form.refusalMessage}
                            onChange={(event) =>
                              updateForm("refusalMessage", event.target.value)
                            }
                            className={cn(textareaClass, "min-h-20")}
                          />
                        </div>
                      </FormSection>

                      <FormSection title="FAQ & memory">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="faq-threshold"
                              label="FAQ similarity threshold"
                            />
                            <Input
                              id="faq-threshold"
                              type="number"
                              step="0.01"
                              min={0}
                              max={1}
                              value={form.faqSimilarityThreshold}
                              onChange={(event) =>
                                updateForm(
                                  "faqSimilarityThreshold",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <AgentFieldLabel
                              htmlFor="faq-max-candidates"
                              label="FAQ max candidates"
                            />
                            <Input
                              id="faq-max-candidates"
                              type="number"
                              min={1}
                              value={form.faqMaxCandidates}
                              onChange={(event) =>
                                updateForm(
                                  "faqMaxCandidates",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className={fieldClass}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.faqEnabled}
                              onCheckedChange={(checked) =>
                                updateForm("faqEnabled", checked === true)
                              }
                            />
                            Bật FAQ
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.memoryEnabled}
                              onCheckedChange={(checked) =>
                                updateForm("memoryEnabled", checked === true)
                              }
                            />
                            Bật memory
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.salesConsultingEnabled}
                              onCheckedChange={(checked) =>
                                updateForm(
                                  "salesConsultingEnabled",
                                  checked === true,
                                )
                              }
                            />
                            Tư vấn bán hàng
                          </label>
                        </div>
                        <ComboboxMultiple
                          id="required-contact-fields"
                          label="Trường liên hệ bắt buộc"
                          hint={AGENT_FIELD_HINTS.requiredContactFields}
                          value={form.requiredContactFields}
                          onValueChange={(value) =>
                            updateForm("requiredContactFields", value)
                          }
                          options={[...DEFAULT_REQUIRED_CONTACT_FIELD_OPTIONS]}
                          placeholder="Nhập trường rồi nhấn Enter, ví dụ phone"
                          chipsClassName="dark:bg-transparent"
                        />
                        <div className="space-y-2">
                          <AgentFieldLabel
                            htmlFor="service-suggestions"
                            label="Gợi ý dịch vụ"
                            hint={AGENT_FIELD_HINTS.serviceSuggestions}
                          />
                          <Textarea
                            id="service-suggestions"
                            value={form.serviceSuggestions}
                            onChange={(event) =>
                              updateForm(
                                "serviceSuggestions",
                                event.target.value,
                              )
                            }
                            className={cn(textareaClass, "min-h-20")}
                          />
                        </div>
                      </FormSection>
                    </>
                  )}
                </div>

                <div
                  className={cn(
                    "shrink-0 flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-4",
                    panelShellClass,
                  )}
                >
                  <Button
                    type="button"
                    className={cn(actionButtonClass, "min-w-[120px]")}
                    onClick={handleSubmit}
                    disabled={isSubmitting || showLoading}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isEditMode ? "Cập nhật" : "Tạo agent"}
                  </Button>
                  {isEditMode ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className={actionButtonClass}
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isSubmitting || !agent}
                    >
                      <Trash2 className="size-4" />
                      Xóa
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(actionButtonClass, "ml-auto")}
                    asChild
                  >
                    <Link href="/ai/agent">Quay lại danh sách</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col">
              <div
                className={cn(
                  "shrink-0 border-b border-border/60 px-5 py-4",
                  panelShellClass,
                )}
              >
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="size-4 text-primary/70" />
                  Xem trước cấu hình
                </CardTitle>
              </div>
              <div className="flex h-0 min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-4 thin-scroll">
                <AgentConfigJsonPreview form={form} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <AgentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        agent={agent ?? null}
        onDeleted={() => router.push("/ai/agent")}
      />
    </div>
  );
}
