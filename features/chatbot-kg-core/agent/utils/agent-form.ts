import type {
  AgentConfig,
  CreateAgentRequest,
  KgAgent,
  PatchAgentRequest,
} from "@/services/chatbot-kg-core/interfaces";

export interface AgentFormState {
  key: string;
  name: string;
  enabled: boolean;
  temperature: number;
  maxTokens: number;
  lightragMode: string;
  chunkTopK: number;
  systemPrompt: string;
  responseLanguage: string;
  stylePreset: string;
  customInstructions: string;
  queryRewriteEnabled: boolean;
  clarifyWhenAmbiguous: boolean;
  maxHistoryMessages: number;
  maxClarifyingQuestions: number;
  rateLimitPerMinute: number;
  maxConcurrentUsers: number;
  qdrantFetchLimit: number;
  rerankTopK: number;
  rerankEnabled: boolean;
  lightragEnabled: boolean;
  lightragQueryTimeoutMs: number;
  dedupeBySource: boolean;
  businessScopeEnabled: boolean;
  businessScopeMode: string;
  allowSmallTalk: boolean;
  regulationPrompt: string;
  refusalMessage: string;
  faqEnabled: boolean;
  faqSimilarityThreshold: number;
  faqMaxCandidates: number;
  memoryEnabled: boolean;
  greetingOnce: boolean;
  salesConsultingEnabled: boolean;
  maxConsultingTurns: number;
  handoffAfterClarifications: number;
  requiredContactFields: string;
  serviceSuggestions: string;
}

export const agentFormDefaultValues: AgentFormState = {
  key: "",
  name: "",
  enabled: true,
  temperature: 0.7,
  maxTokens: 500,
  lightragMode: "hybrid",
  chunkTopK: 20,
  systemPrompt: "",
  responseLanguage: "auto",
  stylePreset: "consultative",
  customInstructions: "",
  queryRewriteEnabled: true,
  clarifyWhenAmbiguous: false,
  maxHistoryMessages: 8,
  maxClarifyingQuestions: 2,
  rateLimitPerMinute: 100,
  maxConcurrentUsers: 50,
  qdrantFetchLimit: 100,
  rerankTopK: 15,
  rerankEnabled: true,
  lightragEnabled: true,
  lightragQueryTimeoutMs: 3000,
  dedupeBySource: true,
  businessScopeEnabled: true,
  businessScopeMode: "soft",
  allowSmallTalk: true,
  regulationPrompt: "",
  refusalMessage: "",
  faqEnabled: true,
  faqSimilarityThreshold: 0.94,
  faqMaxCandidates: 500,
  memoryEnabled: true,
  greetingOnce: true,
  salesConsultingEnabled: true,
  maxConsultingTurns: 8,
  handoffAfterClarifications: 2,
  requiredContactFields: "name, phone, email",
  serviceSuggestions: "",
};

export const LIGHTRAG_MODE_OPTIONS = [
  { value: "hybrid", label: "hybrid" },
  { value: "local", label: "local" },
  { value: "global", label: "global" },
  { value: "naive", label: "naive" },
  { value: "mix", label: "mix" },
  { value: "bypass", label: "bypass" },
] as const;

export const STYLE_PRESET_OPTIONS = [
  { value: "consultative", label: "consultative" },
  { value: "natural", label: "natural" },
  { value: "friendly", label: "friendly" },
  { value: "professional", label: "professional" },
  { value: "concise", label: "concise" },
  { value: "premium", label: "premium" },
] as const;

export function parseListInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinListInput(values?: string[]) {
  return values?.join(", ") ?? "";
}

function buildAgentConfig(form: AgentFormState): AgentConfig {
  return {
    llm: {
      temperature: form.temperature,
      max_tokens: form.maxTokens,
    },
    lightrag: {
      mode: form.lightragMode,
      chunk_top_k: form.chunkTopK,
      extra: {},
    },
    prompts: {
      system: form.systemPrompt,
      response_language: form.responseLanguage,
    },
    style: {
      preset: form.stylePreset,
      custom_instructions: form.customInstructions || null,
    },
    query_rewrite: {
      enabled: form.queryRewriteEnabled,
      clarify_when_ambiguous: form.clarifyWhenAmbiguous,
      max_history_messages: form.maxHistoryMessages,
      max_clarifying_questions: form.maxClarifyingQuestions,
    },
    behavior: {
      rate_limit_per_minute: form.rateLimitPerMinute,
      max_concurrent_users: form.maxConcurrentUsers,
    },
    retrieval: {
      qdrant_fetch_limit: form.qdrantFetchLimit,
      rerank_top_k: form.rerankTopK,
      rerank_enabled: form.rerankEnabled,
      lightrag_enabled: form.lightragEnabled,
      lightrag_query_timeout_ms: form.lightragQueryTimeoutMs,
      dedupe_by_source: form.dedupeBySource,
    },
    business_scope: {
      enabled: form.businessScopeEnabled,
      mode: form.businessScopeMode,
      allow_small_talk: form.allowSmallTalk,
      regulation_prompt: form.regulationPrompt,
      refusal_message: form.refusalMessage || null,
    },
    faq: {
      enabled: form.faqEnabled,
      similarity_threshold: form.faqSimilarityThreshold,
      max_candidates: form.faqMaxCandidates,
    },
    memory: {
      enabled: form.memoryEnabled,
      greeting_once: form.greetingOnce,
      sales_consulting_enabled: form.salesConsultingEnabled,
      max_consulting_turns: form.maxConsultingTurns,
      handoff_after_clarifications: form.handoffAfterClarifications,
      required_contact_fields: parseListInput(form.requiredContactFields),
      service_suggestions: parseListInput(form.serviceSuggestions),
    },
    chatwoot: {},
  };
}

export function buildCreateAgentRequest(
  form: AgentFormState,
): CreateAgentRequest | null {
  const key = form.key.trim();
  if (!key) return null;

  return {
    key,
    name: form.name.trim() || null,
    enabled: form.enabled,
    config: buildAgentConfig(form),
  };
}

export function buildPatchAgentRequest(
  form: AgentFormState,
): PatchAgentRequest {
  return {
    key: form.key.trim() || undefined,
    name: form.name.trim() || null,
    enabled: form.enabled,
    config: buildAgentConfig(form),
  };
}

export function buildAgentPreviewPayload(form: AgentFormState) {
  return {
    key: form.key.trim() || null,
    name: form.name.trim() || null,
    enabled: form.enabled,
    config: buildAgentConfig(form),
  };
}

export function agentToFormState(agent: KgAgent): AgentFormState {
  const config = (agent.config ?? {}) as AgentConfig;

  return {
    key: agent.key,
    name: agent.name ?? "",
    enabled: agent.enabled,
    temperature: config.llm?.temperature ?? agentFormDefaultValues.temperature,
    maxTokens: config.llm?.max_tokens ?? agentFormDefaultValues.maxTokens,
    lightragMode: config.lightrag?.mode ?? agentFormDefaultValues.lightragMode,
    chunkTopK: config.lightrag?.chunk_top_k ?? agentFormDefaultValues.chunkTopK,
    systemPrompt: config.prompts?.system ?? "",
    responseLanguage:
      config.prompts?.response_language ??
      agentFormDefaultValues.responseLanguage,
    stylePreset: config.style?.preset ?? agentFormDefaultValues.stylePreset,
    customInstructions: config.style?.custom_instructions ?? "",
    queryRewriteEnabled:
      config.query_rewrite?.enabled ??
      agentFormDefaultValues.queryRewriteEnabled,
    clarifyWhenAmbiguous:
      config.query_rewrite?.clarify_when_ambiguous ??
      agentFormDefaultValues.clarifyWhenAmbiguous,
    maxHistoryMessages:
      config.query_rewrite?.max_history_messages ??
      agentFormDefaultValues.maxHistoryMessages,
    maxClarifyingQuestions:
      config.query_rewrite?.max_clarifying_questions ??
      agentFormDefaultValues.maxClarifyingQuestions,
    rateLimitPerMinute:
      config.behavior?.rate_limit_per_minute ??
      agentFormDefaultValues.rateLimitPerMinute,
    maxConcurrentUsers:
      config.behavior?.max_concurrent_users ??
      agentFormDefaultValues.maxConcurrentUsers,
    qdrantFetchLimit:
      config.retrieval?.qdrant_fetch_limit ??
      agentFormDefaultValues.qdrantFetchLimit,
    rerankTopK:
      config.retrieval?.rerank_top_k ?? agentFormDefaultValues.rerankTopK,
    rerankEnabled:
      config.retrieval?.rerank_enabled ?? agentFormDefaultValues.rerankEnabled,
    lightragEnabled:
      config.retrieval?.lightrag_enabled ??
      agentFormDefaultValues.lightragEnabled,
    lightragQueryTimeoutMs:
      config.retrieval?.lightrag_query_timeout_ms ??
      agentFormDefaultValues.lightragQueryTimeoutMs,
    dedupeBySource:
      config.retrieval?.dedupe_by_source ??
      agentFormDefaultValues.dedupeBySource,
    businessScopeEnabled:
      config.business_scope?.enabled ??
      agentFormDefaultValues.businessScopeEnabled,
    businessScopeMode:
      config.business_scope?.mode ?? agentFormDefaultValues.businessScopeMode,
    allowSmallTalk:
      config.business_scope?.allow_small_talk ??
      agentFormDefaultValues.allowSmallTalk,
    regulationPrompt: config.business_scope?.regulation_prompt ?? "",
    refusalMessage: config.business_scope?.refusal_message ?? "",
    faqEnabled: config.faq?.enabled ?? agentFormDefaultValues.faqEnabled,
    faqSimilarityThreshold:
      config.faq?.similarity_threshold ??
      agentFormDefaultValues.faqSimilarityThreshold,
    faqMaxCandidates:
      config.faq?.max_candidates ?? agentFormDefaultValues.faqMaxCandidates,
    memoryEnabled:
      config.memory?.enabled ?? agentFormDefaultValues.memoryEnabled,
    greetingOnce:
      config.memory?.greeting_once ?? agentFormDefaultValues.greetingOnce,
    salesConsultingEnabled:
      config.memory?.sales_consulting_enabled ??
      agentFormDefaultValues.salesConsultingEnabled,
    maxConsultingTurns:
      config.memory?.max_consulting_turns ??
      agentFormDefaultValues.maxConsultingTurns,
    handoffAfterClarifications:
      config.memory?.handoff_after_clarifications ??
      agentFormDefaultValues.handoffAfterClarifications,
    requiredContactFields: joinListInput(
      config.memory?.required_contact_fields,
    ),
    serviceSuggestions: joinListInput(config.memory?.service_suggestions),
  };
}
