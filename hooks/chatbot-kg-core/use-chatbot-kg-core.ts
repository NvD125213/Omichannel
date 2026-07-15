import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type Query,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { chatbotKgCoreService } from "@/services/chatbot-kg-core/v1/service";
import type * as KgCore from "@/services/chatbot-kg-core/interfaces";

/** Query keys — kg-core chatbot omni */
export const chatbotKgCoreKeys = {
  all: ["chatbot-kg-core"] as const,
  health: () => [...chatbotKgCoreKeys.all, "health"] as const,
  graphs: () => [...chatbotKgCoreKeys.all, "graphs"] as const,
  graph: (graphId: string) => [...chatbotKgCoreKeys.graphs(), graphId] as const,
  graphSummary: (graphId: string) =>
    [...chatbotKgCoreKeys.graph(graphId), "summary"] as const,
  documents: (graphId: string, params?: KgCore.PaginationParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "documents", params ?? {}] as const,
  document: (graphId: string, documentId: string) =>
    [...chatbotKgCoreKeys.graph(graphId), "document", documentId] as const,
  documentChunks: (
    graphId: string,
    documentId: string,
    params?: KgCore.PaginationParams,
  ) =>
    [
      ...chatbotKgCoreKeys.document(graphId, documentId),
      "chunks",
      params ?? {},
    ] as const,
  documentJobs: (
    graphId: string,
    documentId: string,
    params?: KgCore.ListDocumentIngestJobsParams,
  ) =>
    [
      ...chatbotKgCoreKeys.document(graphId, documentId),
      "jobs",
      params ?? {},
    ] as const,
  ingestJobs: (graphId: string, params?: KgCore.ListIngestJobsParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "ingest-jobs", params ?? {}] as const,
  ingestJob: (graphId: string, jobId: string) =>
    [...chatbotKgCoreKeys.graph(graphId), "ingest-job", jobId] as const,
  faqs: (graphId: string, params?: KgCore.PaginationParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "faqs", params ?? {}] as const,
  webCrawls: (graphId: string, params?: KgCore.ListWebCrawlsParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "web-crawls", params ?? {}] as const,
  webCrawl: (graphId: string, crawlJobId: string) =>
    [...chatbotKgCoreKeys.graph(graphId), "web-crawl", crawlJobId] as const,
  conflicts: (graphId: string, params?: KgCore.GetConflictsParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "conflicts", params ?? {}] as const,
  graphAgents: (graphId: string, params?: KgCore.PaginationParams) =>
    [...chatbotKgCoreKeys.graph(graphId), "agents", params ?? {}] as const,
  graphAgent: (graphId: string, agentId: string) =>
    [...chatbotKgCoreKeys.graph(graphId), "agent", agentId] as const,
  agents: (params?: KgCore.PaginationParams) =>
    [...chatbotKgCoreKeys.all, "agents", params ?? {}] as const,
  agent: (agentId: string) =>
    [...chatbotKgCoreKeys.all, "agent", agentId] as const,
  agentLeads: (agentId: string, params?: KgCore.ListAgentLeadsParams) =>
    [...chatbotKgCoreKeys.agent(agentId), "leads", params ?? {}] as const,
};

export const useGetHealthReady = () => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.health(),
    queryFn: () => chatbotKgCoreService.getHealthReady(),
  });
};

export const useGetHealthLive = () => {
  return useQuery({
    queryKey: [...chatbotKgCoreKeys.health(), "live"],
    queryFn: () => chatbotKgCoreService.getHealthLive(),
  });
};

export const useListGraphs = (params?: KgCore.PaginationParams) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.graphs(),
    queryFn: () => chatbotKgCoreService.listGraphs(params),
  });
};

export const useGetGraph = (graphId: string) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.graph(graphId),
    queryFn: () => chatbotKgCoreService.getGraph(graphId),
    enabled: !!graphId,
  });
};

export const useGetGraphSummary = (graphId: string) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.graphSummary(graphId),
    queryFn: () => chatbotKgCoreService.getGraphSummary(graphId),
    enabled: !!graphId,
  });
};

export const useListDocuments = (
  graphId: string,
  params?: KgCore.PaginationParams,
  options?: {
    refetchInterval?: number | false;
  },
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.documents(graphId, params),
    queryFn: () => chatbotKgCoreService.listDocuments(graphId, params),
    enabled: !!graphId,
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval,
  });
};

export const useGetDocument = (
  graphId: string,
  documentId: string,
  options?: {
    refetchInterval?:
      | number
      | false
      | ((query: Query<KgCore.KgDocument>) => number | false | undefined);
  },
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.document(graphId, documentId),
    queryFn: () => chatbotKgCoreService.getDocument(graphId, documentId),
    enabled: !!graphId && !!documentId,
    refetchInterval: options?.refetchInterval,
  });
};

export const useListDocumentChunks = (
  graphId: string,
  documentId: string,
  params?: KgCore.PaginationParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.documentChunks(graphId, documentId, params),
    queryFn: () =>
      chatbotKgCoreService.listDocumentChunks(graphId, documentId, params),
    enabled: !!graphId && !!documentId,
  });
};

export const useListDocumentIngestJobs = (
  graphId: string,
  documentId: string,
  params?: KgCore.ListDocumentIngestJobsParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.documentJobs(graphId, documentId, params),
    queryFn: () =>
      chatbotKgCoreService.listDocumentIngestJobs(graphId, documentId, params),
    enabled: !!graphId && !!documentId,
  });
};

export const useListIngestJobs = (
  graphId: string,
  params?: KgCore.ListIngestJobsParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.ingestJobs(graphId, params),
    queryFn: () => chatbotKgCoreService.listIngestJobs(graphId, params),
    enabled: !!graphId,
  });
};

export const useGetIngestJob = (graphId: string, jobId: string) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.ingestJob(graphId, jobId),
    queryFn: () => chatbotKgCoreService.getIngestJob(graphId, jobId),
    enabled: !!graphId && !!jobId,
  });
};

export const useListFaqs = (
  graphId: string,
  params?: KgCore.PaginationParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.faqs(graphId, params),
    queryFn: () => chatbotKgCoreService.listFaqs(graphId, params),
    enabled: !!graphId,
    placeholderData: keepPreviousData,
  });
};

export const useListWebCrawls = (
  graphId: string,
  params?: KgCore.ListWebCrawlsParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.webCrawls(graphId, params),
    queryFn: () => chatbotKgCoreService.listWebCrawls(graphId, params),
    enabled: !!graphId,
  });
};

export const useGetWebCrawl = (
  graphId: string,
  crawlJobId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?:
      | number
      | false
      | ((query: Query<KgCore.WebCrawlJob>) => number | false | undefined);
  },
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.webCrawl(graphId, crawlJobId),
    queryFn: () => chatbotKgCoreService.getWebCrawl(graphId, crawlJobId),
    enabled: options?.enabled ?? (!!graphId && !!crawlJobId),
    refetchInterval: options?.refetchInterval,
  });
};

export const useGetConflicts = (
  graphId: string,
  params?: KgCore.GetConflictsParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.conflicts(graphId, params),
    queryFn: () => chatbotKgCoreService.getConflicts(graphId, params),
    enabled: !!graphId,
  });
};

export const useListGraphAgents = (
  graphId: string,
  params?: KgCore.PaginationParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.graphAgents(graphId, params),
    queryFn: () => chatbotKgCoreService.listGraphAgents(graphId, params),
    enabled: !!graphId,
  });
};

export const useGetGraphAgent = (graphId: string, agentId: string) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.graphAgent(graphId, agentId),
    queryFn: () => chatbotKgCoreService.getGraphAgent(graphId, agentId),
    enabled: !!graphId && !!agentId,
  });
};

export const useListAgents = (params?: KgCore.PaginationParams) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.agents(params),
    queryFn: () => chatbotKgCoreService.listAgents(params),
  });
};

export const useGetAgentById = (agentId: string) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.agent(agentId),
    queryFn: () => chatbotKgCoreService.getAgentById(agentId),
    enabled: !!agentId,
  });
};

export const useListAgentLeads = (
  agentId: string,
  params?: KgCore.ListAgentLeadsParams,
) => {
  return useQuery({
    queryKey: chatbotKgCoreKeys.agentLeads(agentId, params),
    queryFn: () => chatbotKgCoreService.listAgentLeads(agentId, params),
    enabled: !!agentId,
    placeholderData: keepPreviousData,
  });
};

export const useCreateGraph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KgCore.CreateGraphRequest) =>
      chatbotKgCoreService.createGraph(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const usePatchGraph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.PatchGraphRequest;
    }) => chatbotKgCoreService.patchGraph(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDeleteGraph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (graphId: string) => chatbotKgCoreService.deleteGraph(graphId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.UploadDocumentRequest;
    }) => chatbotKgCoreService.uploadDocument(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useReplaceDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      documentId,
      data,
    }: {
      graphId: string;
      documentId: string;
      data: KgCore.UploadDocumentRequest;
    }) => chatbotKgCoreService.replaceDocument(graphId, documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      documentId,
    }: {
      graphId: string;
      documentId: string;
    }) => chatbotKgCoreService.deleteDocument(graphId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.CreateFaqRequest;
    }) => chatbotKgCoreService.createFaq(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const usePatchFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      faqId,
      data,
    }: {
      graphId: string;
      faqId: string;
      data: KgCore.PatchFaqRequest;
    }) => chatbotKgCoreService.patchFaq(graphId, faqId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ graphId, faqId }: { graphId: string; faqId: string }) =>
      chatbotKgCoreService.deleteFaq(graphId, faqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useSuggestFaqVariants = () => {
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.SuggestFaqVariantsRequest;
    }) => chatbotKgCoreService.suggestFaqVariants(graphId, data),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useCreateWebCrawl = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.WebCrawlConfigRequest;
    }) => chatbotKgCoreService.createWebCrawl(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useWebCrawlDryRun = () => {
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.WebCrawlConfigRequest;
    }) => chatbotKgCoreService.webCrawlDryRun(graphId, data),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useResolveConflict = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ graphId, alertId }: { graphId: string; alertId: string }) =>
      chatbotKgCoreService.resolveConflict(graphId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useCreateGraphAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      data,
    }: {
      graphId: string;
      data: KgCore.CreateAgentRequest;
    }) => chatbotKgCoreService.createGraphAgent(graphId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const usePatchGraphAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      graphId,
      agentId,
      data,
    }: {
      graphId: string;
      agentId: string;
      data: KgCore.PatchAgentRequest;
    }) => chatbotKgCoreService.patchGraphAgent(graphId, agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDeleteGraphAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ graphId, agentId }: { graphId: string; agentId: string }) =>
      chatbotKgCoreService.deleteGraphAgent(graphId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const usePatchAgentById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string;
      data: KgCore.PatchAgentRequest;
    }) => chatbotKgCoreService.patchAgentById(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDeleteAgentById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) =>
      chatbotKgCoreService.deleteAgentById(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const usePatchLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      data,
    }: {
      leadId: string;
      data: KgCore.PatchLeadRequest;
    }) => chatbotKgCoreService.patchLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKgCoreKeys.all });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useChatCompletions = () => {
  return useMutation({
    mutationFn: (data: KgCore.ChatCompletionRequest) =>
      chatbotKgCoreService.chatCompletions(data),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useChatCompletionsStream = () => {
  return useMutation({
    mutationFn: (data: KgCore.ChatCompletionRequest) =>
      chatbotKgCoreService.chatCompletionsStream(data),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useChatwootAgentbotWebhook = () => {
  return useMutation({
    mutationFn: ({
      agentId,
      payload,
    }: {
      agentId: string;
      payload?: unknown;
    }) => chatbotKgCoreService.chatwootAgentbotWebhook(agentId, payload),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi gọi kg-core API");
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: ({
      graphId,
      documentId,
    }: {
      graphId: string;
      documentId: string;
    }) => chatbotKgCoreService.downloadDocument(graphId, documentId),
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi tải tài liệu");
    },
  });
};

export const usePreviewDocument = (
  graphId: string,
  documentId: string,
  params?: KgCore.PreviewDocumentParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [
      ...chatbotKgCoreKeys.document(graphId, documentId),
      "preview",
      params ?? {},
    ],
    queryFn: () =>
      chatbotKgCoreService.previewDocument(graphId, documentId, params),
    enabled: (options?.enabled ?? true) && !!graphId && !!documentId,
  });
};

export const useListWebCrawlPages = (
  graphId: string,
  crawlJobId: string,
  params?: KgCore.ListWebCrawlPagesParams,
) => {
  return useQuery({
    queryKey: [
      ...chatbotKgCoreKeys.webCrawl(graphId, crawlJobId),
      "pages",
      params ?? {},
    ],
    queryFn: () =>
      chatbotKgCoreService.listWebCrawlPages(graphId, crawlJobId, params),
    enabled: !!graphId && !!crawlJobId,
  });
};
