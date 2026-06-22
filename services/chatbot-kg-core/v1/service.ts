import apiChatbotCoreConfig from "@/lib/api-client-chatbot-core";
import { cleanParams } from "@/utils/clean-params";
import type * as KgCore from "../interfaces";

/** API kg-core chatbot omni (Postman collection) */

export const chatbotKgCoreService = {
  /** GET /health/ready — Health Ready */
  getHealthReady: async (): Promise<KgCore.HealthReadyResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.HealthReadyResponse>(
        `/health/ready`,
      );
    return response.data;
  },

  /** GET /health — Health Live */
  getHealthLive: async (): Promise<KgCore.HealthLiveResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.HealthLiveResponse>(`/health`);
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/summary — Graph Summary */
  getGraphSummary: async (
    graphId: string,
  ): Promise<KgCore.GraphSummaryResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.GraphSummaryResponse>(
        `/v1/graphs/${graphId}/summary`,
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents/:document_id/jobs — List Document Ingest Jobs */
  listDocumentIngestJobs: async (
    graphId: string,
    documentId: string,
    params?: KgCore.ListDocumentIngestJobsParams,
  ): Promise<KgCore.ListDocumentIngestJobsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListDocumentIngestJobsResponse>(
        `/v1/graphs/${graphId}/documents/${documentId}/jobs`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents/:document_id/chunks — List Document Chunks */
  listDocumentChunks: async (
    graphId: string,
    documentId: string,
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListDocumentChunksResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListDocumentChunksResponse>(
        `/v1/graphs/${graphId}/documents/${documentId}/chunks`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents/:document_id/preview — Preview Document */
  previewDocument: async (
    graphId: string,
    documentId: string,
    params?: KgCore.PreviewDocumentParams,
  ): Promise<KgCore.DocumentPreviewResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.DocumentPreviewResponse>(
        `/v1/graphs/${graphId}/documents/${documentId}/preview`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents/:document_id/download — Download Document */
  downloadDocument: async (
    graphId: string,
    documentId: string,
  ): Promise<Blob> => {
    const response = await apiChatbotCoreConfig.get<Blob>(
      `/v1/graphs/${graphId}/documents/${documentId}/download`,
      { responseType: "blob" },
    );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents/:document_id — Get Document */
  getDocument: async (
    graphId: string,
    documentId: string,
  ): Promise<KgCore.KgDocument> => {
    const response = await apiChatbotCoreConfig.get<KgCore.KgDocument>(
      `/v1/graphs/${graphId}/documents/${documentId}`,
    );
    return response.data;
  },

  /** PUT /v1/graphs/:graph_id/documents/:document_id — Put Replace Document */
  replaceDocument: async (
    graphId: string,
    documentId: string,
    data: KgCore.UploadDocumentRequest,
  ): Promise<KgCore.KgDocument> => {
    const formData = new FormData();
    formData.append("file", data.file);
    const response = await apiChatbotCoreConfig.put<KgCore.KgDocument>(
      `/v1/graphs/${graphId}/documents/${documentId}`,
      formData,
    );
    return response.data;
  },

  /** DELETE /v1/graphs/:graph_id/documents/:document_id — Delete Document */
  deleteDocument: async (
    graphId: string,
    documentId: string,
  ): Promise<void> => {
    await apiChatbotCoreConfig.delete(
      `/v1/graphs/${graphId}/documents/${documentId}`,
    );
  },

  /** POST /v1/graphs/:graph_id/documents — Upload Document */
  uploadDocument: async (
    graphId: string,
    data: KgCore.UploadDocumentRequest,
  ): Promise<KgCore.KgDocument> => {
    const formData = new FormData();
    formData.append("file", data.file);
    const response = await apiChatbotCoreConfig.post<KgCore.KgDocument>(
      `/v1/graphs/${graphId}/documents`,
      formData,
    );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/documents — List Documents */
  listDocuments: async (
    graphId: string,
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListDocumentsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListDocumentsResponse>(
        `/v1/graphs/${graphId}/documents`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/jobs/:job_id — Get Ingest Job */
  getIngestJob: async (
    graphId: string,
    jobId: string,
  ): Promise<KgCore.IngestJob> => {
    const response = await apiChatbotCoreConfig.get<KgCore.IngestJob>(
      `/v1/graphs/${graphId}/jobs/${jobId}`,
    );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/jobs — List Ingest Jobs */
  listIngestJobs: async (
    graphId: string,
    params?: KgCore.ListIngestJobsParams,
  ): Promise<KgCore.ListIngestJobsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListIngestJobsResponse>(
        `/v1/graphs/${graphId}/jobs`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** POST /v1/graphs/:graph_id/faqs/suggest-variants — Suggest Faq Variants */
  suggestFaqVariants: async (
    graphId: string,
    data: KgCore.SuggestFaqVariantsRequest,
  ): Promise<KgCore.SuggestFaqVariantsResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.SuggestFaqVariantsResponse>(
        `/v1/graphs/${graphId}/faqs/suggest-variants`,
        data,
      );
    return response.data;
  },

  /** PATCH /v1/graphs/:graph_id/faqs/:faq_id — Patch Faq */
  patchFaq: async (
    graphId: string,
    faqId: string,
    data: KgCore.PatchFaqRequest,
  ): Promise<KgCore.KgFaq> => {
    const response = await apiChatbotCoreConfig.patch<KgCore.KgFaq>(
      `/v1/graphs/${graphId}/faqs/${faqId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /v1/graphs/:graph_id/faqs/:faq_id — Delete Faq */
  deleteFaq: async (graphId: string, faqId: string): Promise<void> => {
    await apiChatbotCoreConfig.delete(`/v1/graphs/${graphId}/faqs/${faqId}`);
  },

  /** GET /v1/graphs/:graph_id/faqs — List Faqs */
  listFaqs: async (
    graphId: string,
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListFaqsResponse> => {
    const response = await apiChatbotCoreConfig.get<KgCore.ListFaqsResponse>(
      `/v1/graphs/${graphId}/faqs`,
      { params: cleanParams(params ?? {}) },
    );
    return response.data;
  },

  /** POST /v1/graphs/:graph_id/faqs — Create Faq */
  createFaq: async (
    graphId: string,
    data: KgCore.CreateFaqRequest,
  ): Promise<KgCore.KgFaq> => {
    const response = await apiChatbotCoreConfig.post<KgCore.KgFaq>(
      `/v1/graphs/${graphId}/faqs`,
      data,
    );
    return response.data;
  },

  /** POST /v1/graphs/:graph_id/web-crawls/dry-run — Web Crawl Dry Run */
  webCrawlDryRun: async (
    graphId: string,
    data: KgCore.WebCrawlConfigRequest,
  ): Promise<KgCore.WebCrawlDryRunResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.WebCrawlDryRunResponse>(
        `/v1/graphs/${graphId}/web-crawls/dry-run`,
        data,
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/web-crawls/:crawl_job_id/pages — List Web Crawl Pages */
  listWebCrawlPages: async (
    graphId: string,
    crawlJobId: string,
    params?: KgCore.ListWebCrawlPagesParams,
  ): Promise<KgCore.ListWebCrawlPagesResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListWebCrawlPagesResponse>(
        `/v1/graphs/${graphId}/web-crawls/${crawlJobId}/pages`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/web-crawls/:crawl_job_id — Get Web Crawl */
  getWebCrawl: async (
    graphId: string,
    crawlJobId: string,
  ): Promise<KgCore.WebCrawlJob> => {
    const response = await apiChatbotCoreConfig.get<KgCore.WebCrawlJob>(
      `/v1/graphs/${graphId}/web-crawls/${crawlJobId}`,
    );
    return response.data;
  },

  /** POST /v1/graphs/:graph_id/web-crawls — Create Web Crawl */
  createWebCrawl: async (
    graphId: string,
    data: KgCore.WebCrawlConfigRequest,
  ): Promise<KgCore.CreateWebCrawlResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.CreateWebCrawlResponse>(
        `/v1/graphs/${graphId}/web-crawls`,
        data,
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/web-crawls — List Web Crawls */
  listWebCrawls: async (
    graphId: string,
    params?: KgCore.ListWebCrawlsParams,
  ): Promise<KgCore.ListWebCrawlsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListWebCrawlsResponse>(
        `/v1/graphs/${graphId}/web-crawls`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** POST /v1/graphs/:graph_id/conflicts/:alert_id/resolve — Post Resolve */
  resolveConflict: async (
    graphId: string,
    alertId: string,
  ): Promise<KgCore.ResolveConflictResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.ResolveConflictResponse>(
        `/v1/graphs/${graphId}/conflicts/${alertId}/resolve`,
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/conflicts — Get Conflicts */
  getConflicts: async (
    graphId: string,
    params?: KgCore.GetConflictsParams,
  ): Promise<KgCore.ListConflictsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListConflictsResponse>(
        `/v1/graphs/${graphId}/conflicts`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/agents/:agent_id — Get Agent */
  getGraphAgent: async (
    graphId: string,
    agentId: string,
  ): Promise<KgCore.KgAgent> => {
    const response = await apiChatbotCoreConfig.get<KgCore.KgAgent>(
      `/v1/graphs/${graphId}/agents/${agentId}`,
    );
    return response.data;
  },

  /** PATCH /v1/graphs/:graph_id/agents/:agent_id — Patch Agent */
  patchGraphAgent: async (
    graphId: string,
    agentId: string,
    data: KgCore.PatchAgentRequest,
  ): Promise<KgCore.KgAgent> => {
    const response = await apiChatbotCoreConfig.patch<KgCore.KgAgent>(
      `/v1/graphs/${graphId}/agents/${agentId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /v1/graphs/:graph_id/agents/:agent_id — Delete Agent */
  deleteGraphAgent: async (graphId: string, agentId: string): Promise<void> => {
    await apiChatbotCoreConfig.delete(
      `/v1/graphs/${graphId}/agents/${agentId}`,
    );
  },

  /** POST /v1/graphs/:graph_id/agents — Create Agent */
  createGraphAgent: async (
    graphId: string,
    data: KgCore.CreateAgentRequest,
  ): Promise<KgCore.KgAgent> => {
    const response = await apiChatbotCoreConfig.post<KgCore.KgAgent>(
      `/v1/graphs/${graphId}/agents`,
      data,
    );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id/agents — List Agents */
  listGraphAgents: async (
    graphId: string,
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListGraphAgentsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListGraphAgentsResponse>(
        `/v1/graphs/${graphId}/agents`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/graphs/:graph_id — Get Graph */
  getGraph: async (graphId: string): Promise<KgCore.KgGraph> => {
    const response = await apiChatbotCoreConfig.get<KgCore.KgGraph>(
      `/v1/graphs/${graphId}`,
    );
    return response.data;
  },

  /** PATCH /v1/graphs/:graph_id — Patch Graph */
  patchGraph: async (
    graphId: string,
    data: KgCore.PatchGraphRequest,
  ): Promise<KgCore.KgGraph> => {
    const response = await apiChatbotCoreConfig.patch<KgCore.KgGraph>(
      `/v1/graphs/${graphId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /v1/graphs/:graph_id — Delete Graph */
  deleteGraph: async (graphId: string): Promise<void> => {
    await apiChatbotCoreConfig.delete(`/v1/graphs/${graphId}`);
  },

  /** POST /v1/graphs — Create Graph */
  createGraph: async (
    data: KgCore.CreateGraphRequest,
  ): Promise<KgCore.KgGraph> => {
    const response = await apiChatbotCoreConfig.post<KgCore.KgGraph>(
      `/v1/graphs`,
      data,
    );
    return response.data;
  },

  /** GET /v1/graphs — List Graphs */
  listGraphs: async (
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListGraphsResponse> => {
    const response = await apiChatbotCoreConfig.get<KgCore.ListGraphsResponse>(
      `/v1/graphs`,
      { params: cleanParams(params ?? {}) },
    );
    return response.data;
  },

  /** GET /v1/agents/:agent_id/leads — List Agent Leads */
  listAgentLeads: async (
    agentId: string,
    params?: KgCore.ListAgentLeadsParams,
  ): Promise<KgCore.ListAgentLeadsResponse> => {
    const response =
      await apiChatbotCoreConfig.get<KgCore.ListAgentLeadsResponse>(
        `/v1/agents/${agentId}/leads`,
        { params: cleanParams(params ?? {}) },
      );
    return response.data;
  },

  /** GET /v1/agents/:agent_id — Get Agent Flat */
  getAgentById: async (agentId: string): Promise<KgCore.KgAgent> => {
    const response = await apiChatbotCoreConfig.get<KgCore.KgAgent>(
      `/v1/agents/${agentId}`,
    );
    return response.data;
  },

  /** PATCH /v1/agents/:agent_id — Patch Agent Flat */
  patchAgentById: async (
    agentId: string,
    data: KgCore.PatchAgentRequest,
  ): Promise<KgCore.KgAgent> => {
    const response = await apiChatbotCoreConfig.patch<KgCore.KgAgent>(
      `/v1/agents/${agentId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /v1/agents/:agent_id — Delete Agent Flat */
  deleteAgentById: async (agentId: string): Promise<void> => {
    await apiChatbotCoreConfig.delete(`/v1/agents/${agentId}`);
  },

  /** GET /v1/agents — List All Agents */
  listAgents: async (
    params?: KgCore.PaginationParams,
  ): Promise<KgCore.ListAgentsResponse> => {
    const response = await apiChatbotCoreConfig.get<KgCore.ListAgentsResponse>(
      `/v1/agents`,
      { params: cleanParams(params ?? {}) },
    );
    return response.data;
  },

  /** PATCH /v1/leads/:lead_id — Patch Lead */
  patchLead: async (
    leadId: string,
    data: KgCore.PatchLeadRequest,
  ): Promise<KgCore.KgLead> => {
    const response = await apiChatbotCoreConfig.patch<KgCore.KgLead>(
      `/v1/leads/${leadId}`,
      data,
    );
    return response.data;
  },

  /** POST /v1/chat/completions/stream — Chat Completions Stream */
  chatCompletionsStream: async (
    data: KgCore.ChatCompletionRequest,
  ): Promise<ReadableStream<Uint8Array> | null> => {
    const response = await apiChatbotCoreConfig.post(
      `/v1/chat/completions/stream`,
      data,
      { responseType: "stream" },
    );
    return response.data as ReadableStream<Uint8Array> | null;
  },

  /** POST /v1/chat/completions — Chat Completions */
  chatCompletions: async (
    data: KgCore.ChatCompletionRequest,
  ): Promise<KgCore.ChatCompletionResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.ChatCompletionResponse>(
        `/v1/chat/completions`,
        data,
      );
    return response.data;
  },

  /** POST /v1/integrations/chatwoot/agents/:agent_id/webhook — Chatwoot Agentbot Webhook */
  chatwootAgentbotWebhook: async (
    agentId: string,
    payload?: unknown,
  ): Promise<KgCore.ChatwootWebhookResponse> => {
    const response =
      await apiChatbotCoreConfig.post<KgCore.ChatwootWebhookResponse>(
        `/v1/integrations/chatwoot/agents/${agentId}/webhook`,
        payload,
      );
    return response.data;
  },
};
