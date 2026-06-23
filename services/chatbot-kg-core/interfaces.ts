/**
 * Kiểu dữ liệu kg-core chatbot omni — Postman collection
 * `kg-core chatbot omni` → `{{baseUrl}}/v1/...`
 */

// —— Common ——

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export type LeadStatus = "new" | "contacted" | "closed";

export type ChatMessageRole = "user" | "assistant" | "system";

// —— Health ——

export type HealthReadyResponse = Record<string, unknown>;

export type HealthLiveResponse = Record<string, unknown>;

// —— Graphs ——

export interface KgGraphQuota {
  [key: string]: unknown;
}

export interface KgGraph {
  id: string;
  name: string | null;
  created_at: string;
  tenant_id: string;
  quota?: KgGraphQuota | null;
}

export interface CreateGraphRequest {
  name: string;
  tenant_id: string;
}

export interface PatchGraphRequest {
  name?: string;
  tenant_id?: string;
  quota?: KgGraphQuota | null;
}

export interface ListGraphsResponse {
  items?: KgGraph[];
  total?: number;
  [key: string]: unknown;
}

export interface GraphSummaryDocuments {
  total?: number;
  indexed?: number;
  failed?: number;
  pending?: number;
  [key: string]: unknown;
}

export interface GraphSummaryResponse {
  graph: KgGraph;
  documents?: GraphSummaryDocuments;
  agents?: Record<string, unknown>;
  conflicts?: Record<string, unknown>;
  ingest_jobs?: Record<string, unknown>;
  ingest_queue_size?: number;
  quota?: Record<string, unknown>;
}

// —— Documents ——

export interface KgDocument {
  id: string;
  graph_id: string;
  filename: string;
  content_type: string;
  status: string;
  created_at: string;
  error_message?: string | null;
  source_type?: string;
  source_url?: string | null;
  canonical_url?: string | null;
  title?: string | null;
  content_hash?: string | null;
  quality_score?: number | null;
  source_metadata?: Record<string, unknown> | null;
}

export interface UploadDocumentRequest {
  file: File | Blob;
}

export interface ListDocumentsResponse {
  items?: KgDocument[];
  total?: number;
  [key: string]: unknown;
}

export interface DocumentPreviewResponse {
  document_id: string;
  graph_id: string;
  filename: string;
  source: string;
  text: string;
  truncated: boolean;
  message: string | null;
}

export interface PreviewDocumentParams {
  max_chars?: number;
}

export interface ListDocumentChunksResponse {
  items?: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export type ListDocumentIngestJobsParams = PaginationParams;

export interface ListDocumentIngestJobsResponse {
  items?: IngestJob[];
  total?: number;
  [key: string]: unknown;
}

// —— Ingest jobs ——

export interface IngestJobDetail {
  [key: string]: unknown;
}

export interface IngestJob {
  id: string;
  graph_id: string;
  document_id: string;
  state: string;
  created_at: string;
  updated_at: string;
  detail?: IngestJobDetail | null;
}

export interface ListIngestJobsParams extends PaginationParams {
  state?: string;
  document_id?: string;
}

export interface ListIngestJobsResponse {
  items?: IngestJob[];
  total?: number;
  [key: string]: unknown;
}

// —— FAQs ——

export interface KgFaq {
  id: string;
  graph_id: string;
  question: string;
  answer: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  question_variants?: string[];
  variant_count?: number;
  source_metadata?: Record<string, unknown> | null;
  has_embedding?: boolean;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
  enabled?: boolean;
  question_variants?: string[];
  source_metadata?: Record<string, unknown> | null;
}

export interface PatchFaqRequest {
  question?: string;
  answer?: string;
  enabled?: boolean | null;
  question_variants?: string[] | null;
  source_metadata?: Record<string, unknown> | null;
}

export interface SuggestFaqVariantsRequest {
  question: string;
  answer: string;
  count?: number;
}

export interface SuggestFaqVariantsResponse {
  variants: string[];
}

export interface ListFaqsResponse {
  items?: KgFaq[];
  total?: number;
  [key: string]: unknown;
}

// —— Web crawls ——

export interface WebCrawlConfigRequest {
  seed_urls: string[];
  allowed_domains?: string[];
  include_paths?: string[] | null;
  block_paths?: string[] | null;
  approved_urls?: string[] | null;
  max_pages?: number;
  max_depth?: number;
  respect_robots_txt?: boolean;
  force_recrawl?: boolean;
  request_timeout_seconds?: number | null;
  min_quality_score?: number;
  chunk_max_tokens?: number;
  chunk_overlap_tokens?: number;
}

export interface WebCrawlDryRunItem {
  url: string;
  canonical_url: string;
  source: string;
  domain: string | null;
  lastmod: string | null;
}

export interface WebCrawlDryRunResponse {
  items: WebCrawlDryRunItem[];
  total: number;
  rejected?: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export interface WebCrawlJobConfig {
  seed_urls?: string[];
  allowed_domains?: string[];
  include_paths?: string[] | null;
  block_paths?: string[] | null;
  approved_urls?: string[] | null;
  max_pages?: number;
  max_depth?: number;
  respect_robots_txt?: boolean;
  force_recrawl?: boolean;
  request_timeout_seconds?: number | null;
  min_quality_score?: number;
  chunk_max_tokens?: number;
  chunk_overlap_tokens?: number;
}

export interface WebCrawlJobStats {
  failed?: number;
  skipped?: number;
  accepted?: number;
  rejected?: number;
  discovered?: number;
  discovery_rejected?: number;
}

export interface WebCrawlJob {
  id: string;
  graph_id: string;
  state: string;
  config?: WebCrawlJobConfig;
  stats?: WebCrawlJobStats;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CreateWebCrawlResponse {
  crawl_job_id: string;
  state: string;
}

export interface ListWebCrawlsParams extends PaginationParams {
  state?: string;
}

export interface ListWebCrawlsResponse {
  items?: WebCrawlJob[];
  total?: number;
  [key: string]: unknown;
}

export interface WebCrawlPage {
  id?: string;
  crawl_job_id?: string;
  graph_id?: string;
  document_id?: string | null;
  url: string;
  canonical_url?: string | null;
  title?: string | null;
  domain?: string | null;
  status?: string;
  state?: string;
  reason?: string | null;
  quality_score?: number | null;
  content_hash?: string | null;
  detail?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  crawled_at?: string | null;
  error_message?: string | null;
  source?: string | null;
  [key: string]: unknown;
}

export interface ListWebCrawlPagesParams extends PaginationParams {
  status?: string;
}

export interface ListWebCrawlPagesResponse {
  items?: WebCrawlPage[];
  total?: number;
  [key: string]: unknown;
}

// —— Conflicts ——

export interface GetConflictsParams {
  resolved?: boolean;
}

export interface ListConflictsResponse {
  items?: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export interface ResolveConflictResponse {
  [key: string]: unknown;
}

// —— Agents ——

export interface AgentLlmConfig {
  temperature?: number | null;
  top_p?: number | null;
  max_tokens?: number | null;
  frequency_penalty?: number | null;
  presence_penalty?: number | null;
}

export interface AgentLightragConfig {
  mode?: string;
  top_k?: number;
  chunk_top_k?: number;
  max_entity_tokens?: number;
  max_relation_tokens?: number;
  max_total_tokens?: number;
  cosine_threshold?: number | null;
  related_chunk_number?: number;
  extra?: Record<string, unknown>;
}

export interface AgentPromptsConfig {
  system?: string;
  rag_user_template?: string;
  response_language?: string;
}

export interface AgentStyleConfig {
  preset?: string;
  custom_instructions?: string | null;
}

export interface AgentQueryRewriteConfig {
  enabled?: boolean;
  clarify_when_ambiguous?: boolean;
  max_history_messages?: number;
  max_clarifying_questions?: number;
  system_prompt?: string | null;
}

export interface AgentBehaviorConfig {
  rate_limit_per_minute?: number;
  max_concurrent_users?: number | null;
  langgraph_enabled?: boolean;
}

export interface AgentRetrievalConfig {
  qdrant_fetch_limit?: number | null;
  rerank_top_k?: number | null;
  rerank_enabled?: boolean;
  lightrag_enabled?: boolean;
  lightrag_query_timeout_ms?: number | null;
  min_score?: number | null;
  dedupe_by_source?: boolean;
}

export interface AgentBusinessScopeConfig {
  enabled?: boolean;
  mode?: string;
  allow_small_talk?: boolean;
  regulation_prompt?: string;
  refusal_message?: string | null;
}

export interface AgentFaqConfig {
  enabled?: boolean;
  similarity_threshold?: number;
  max_candidates?: number;
}

export interface AgentMemoryConfig {
  enabled?: boolean;
  greeting_once?: boolean;
  sales_consulting_enabled?: boolean;
  max_consulting_turns?: number;
  handoff_after_clarifications?: number;
  required_contact_fields?: string[];
  service_suggestions?: string[];
}

export interface AgentConfig {
  llm?: AgentLlmConfig;
  lightrag?: AgentLightragConfig;
  prompts?: AgentPromptsConfig;
  style?: AgentStyleConfig;
  query_rewrite?: AgentQueryRewriteConfig;
  behavior?: AgentBehaviorConfig;
  retrieval?: AgentRetrievalConfig;
  business_scope?: AgentBusinessScopeConfig;
  faq?: AgentFaqConfig;
  memory?: AgentMemoryConfig;
  [key: string]: unknown;
}

export interface KgAgent {
  id: string;
  graph_id: string;
  key: string;
  name: string | null;
  enabled: boolean;
  config?: AgentConfig | Record<string, unknown>;
}

export interface CreateAgentRequest {
  key: string;
  name?: string | null;
  enabled?: boolean;
  config?: AgentConfig;
}

export interface PatchAgentRequest {
  key?: string;
  name?: string | null;
  enabled?: boolean;
  config?: AgentConfig | null;
}

export interface ListGraphAgentsResponse {
  items?: KgAgent[];
  total?: number;
  [key: string]: unknown;
}

export interface ListAgentsResponse {
  items?: KgAgent[];
  total?: number;
  [key: string]: unknown;
}

// —— Leads ——

export interface KgLead {
  id: string;
  agent_id: string;
  graph_id: string | null;
  channel: string;
  session_id: string;
  name: string;
  phone: string;
  email: string | null;
  need: string | null;
  stage: string | null;
  status: string;
  memory_snapshot?: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ListAgentLeadsParams extends PaginationParams {
  status?: LeadStatus | string;
}

export interface ListAgentLeadsResponse {
  items?: KgLead[];
  total?: number;
  [key: string]: unknown;
}

export interface PatchLeadRequest {
  status?: LeadStatus | string;
}

// —— Chat ——

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatCompletionRequest {
  agent_id: string;
  messages: ChatMessage[];
  graph_id?: string;
  stream?: boolean;
  session_id?: string;
  channel?: string;
  include_citations?: boolean;
}

export interface ChatCitation {
  [key: string]: unknown;
}

export interface ChatCompletionResponse {
  answer: string;
  answer_parts?: string[];
  citations?: ChatCitation[];
  retrieval_meta?: Record<string, unknown> | null;
  agent_id: string;
  needs_clarification?: boolean;
  clarifying_questions?: string[];
  original_query?: string;
  rewritten_query?: string | null;
  memory_meta?: Record<string, unknown> | null;
}

// —— Integrations ——

export interface ChatwootWebhookResponse {
  [key: string]: unknown;
}
