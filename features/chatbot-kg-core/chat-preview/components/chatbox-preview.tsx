"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Home,
  Loader2,
  MessageCircle,
  Paperclip,
  RotateCcw,
  Send,
  Smile,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGetAgentById,
  useListAgents,
  useListGraphAgents,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { useGraphId } from "@/hooks/use-graph-id";
import { cn } from "@/lib/utils";
import type { ChatMessageRole } from "@/services/chatbot-kg-core/interfaces";
import { AiRobotAvatar } from "./ai-robot-avatar";
import { renderFormattedAnswer } from "../utils/format-answer-content";
import { streamChatCompletions } from "../utils/stream-chat-completion";

const EMOJI_OPTIONS = [
  "😀",
  "😊",
  "👍",
  "🙏",
  "❤️",
  "😂",
  "🤔",
  "👋",
  "✨",
  "🎉",
  "😅",
  "🙂",
] as const;

const motionEase = [0.32, 0.72, 0, 1] as const;

const chatHeaderClass =
  "shrink-0 border-b border-primary/10 bg-accent shadow-[0_1px_0_0_hsl(var(--primary)/0.12)] dark:border-sidebar-border/40 dark:bg-transparent dark:shadow-[0_1px_0_0_hsl(var(--sidebar-border)/0.45)]";

const chatHeaderTitleClass =
  "text-accent-foreground dark:text-sidebar-primary-foreground";

const chatHeaderDividerClass =
  "border-primary/10 dark:border-sidebar-border/40";

const enabledBadgeClass = {
  on: "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm dark:border-emerald-400/70 dark:bg-emerald-400/25 dark:text-emerald-200",
  off: "border-slate-300 bg-slate-100 text-slate-700 shadow-sm dark:border-slate-500/60 dark:bg-slate-400/20 dark:text-slate-200",
};

function AvatarOnlineDot({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span
      className="absolute right-0.5 bottom-0 flex size-2.5 shrink-0"
      aria-hidden
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80" />
      <span className="relative inline-flex size-2.5 animate-pulse rounded-full border-2 border-accent bg-emerald-500 dark:border-card" />
    </span>
  );
}

function AgentStatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        enabled ? enabledBadgeClass.on : enabledBadgeClass.off,
      )}
    >
      {enabled ? "Sẵn sàng" : "Đang tắt"}
    </Badge>
  );
}

type PreviewMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1" aria-label="Đang tư duy">
      <span className="text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
        Đang tư duy
      </span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-1 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function AssistantAvatar({ className }: { className?: string }) {
  return <AiRobotAvatar className={cn("size-8", className)} />;
}

function AgentSelect({
  value,
  onChange,
  agents,
  isLoading,
  triggerClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  agents: Array<{
    id: string;
    key: string;
    name: string | null;
    enabled: boolean;
  }>;
  isLoading: boolean;
  triggerClassName?: string;
}) {
  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-lg sm:w-[200px]" />;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id="preview-agent-select"
        className={cn(
          "h-8 rounded-lg border-primary/15 dark:bg-transparent  text-sm text-foreground shadow-none transition-colors duration-200 ease-out hover:bg-accent focus:ring-primary/20 dark:border-sidebar-border/45 dark:hover:bg-sidebar-accent bg-white",
          triggerClassName,
        )}
      >
        <SelectValue placeholder="Chọn agent..." />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-black/[0.08] dark:border-white/[0.08]">
        {agents.map((item) => (
          <SelectItem key={item.id} value={item.id} className="rounded-lg">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{item.name || item.key}</span>
              {!item.enabled ? (
                <span className="text-[10px] text-muted-foreground">tắt</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ChatBubble({
  message,
  isTyping = false,
}: {
  message: PreviewMessage;
  isTyping?: boolean;
}) {
  const isUser = message.role === "user";

  const bubbleClassName = cn(
    isUser
      ? "rounded-[18px] rounded-br-[6px] bg-zinc-900 px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
      : "rounded-[18px] rounded-bl-[6px] bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100",
    !isUser && isTyping
      ? "w-fit px-2.5 py-1.5 text-[11px] leading-none"
      : !isUser
        ? "w-fit max-w-full px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
        : "",
  );

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: motionEase }}
        className="flex w-full justify-end"
      >
        <div className="max-w-[85%] space-y-1 sm:max-w-[72%]">
          <div className={bubbleClassName}>{message.content}</div>
          <p className="px-1 text-right text-[10px] text-zinc-400">
            {format(message.createdAt, "HH:mm", { locale: vi })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: motionEase }}
      className="flex w-full justify-start"
    >
      <div className="grid w-fit max-w-[85%] grid-cols-[auto_auto] gap-x-2.5 gap-y-1 sm:max-w-[72%]">
        <div className="col-start-2 row-start-1">
          <span className="px-0.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Trợ lý
          </span>
        </div>

        <div className="col-start-1 row-start-2 self-end pb-0.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            <AssistantAvatar className="size-9" />
          </span>
        </div>

        <div className="col-start-2 row-start-2 w-fit max-w-full space-y-1">
          <div className={bubbleClassName}>
            {isTyping ? <TypingDots /> : renderFormattedAnswer(message.content)}
          </div>

          {!isTyping ? (
            <p className="px-0.5 text-[10px] text-zinc-400">
              {format(message.createdAt, "HH:mm", { locale: vi })}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function StreamingAssistantBubble({ content }: { content: string }) {
  const isTyping = content.length === 0;

  return (
    <ChatBubble
      message={{
        id: "streaming",
        role: "assistant",
        content,
        createdAt: new Date(),
      }}
      isTyping={isTyping}
    />
  );
}

function createMessageId() {
  return crypto.randomUUID();
}

export function ChatboxPreview() {
  const graphId = useGraphId();

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [sessionId, setSessionId] = useState(() => createMessageId());
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: listGraphAgentsData, isLoading: isLoadingListGraphAgents } =
    useListGraphAgents(graphId, {
      limit: 100,
      offset: 0,
    });

  const agents = useMemo(
    () => listGraphAgentsData?.items ?? [],
    [listGraphAgentsData?.items],
  );

  const { data: agent, isLoading: isLoadingAgent } =
    useGetAgentById(selectedAgentId);

  const selectedAgentMeta = agents.find((item) => item.id === selectedAgentId);
  const agentTitle =
    agent?.name?.trim() ||
    selectedAgentMeta?.name?.trim() ||
    selectedAgentMeta?.key ||
    "Trợ lý AI";

  useEffect(() => {
    if (selectedAgentId || agents.length === 0) return;
    const firstEnabled = agents.find((item) => item.enabled) ?? agents[0];
    if (firstEnabled) setSelectedAgentId(firstEnabled.id);
  }, [agents, selectedAgentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, streamingContent]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setSessionId(createMessageId());
    setDraft("");
    setAttachedFiles([]);
    setStreamingContent("");
    setIsSending(false);
  }, []);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    resetConversation();
  };

  const handleCloseWidget = () => {
    resetConversation();
  };

  const handleInsertEmoji = (emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    setEmojiOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setAttachedFiles((current) => [...current, ...files].slice(0, 5));
    event.target.value = "";
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedAgentId || isSending) return;

    const attachmentNote =
      attachedFiles.length > 0
        ? `\n\n[Đính kèm: ${attachedFiles.map((file) => file.name).join(", ")}]`
        : "";

    const userMessage: PreviewMessage = {
      id: createMessageId(),
      role: "user",
      content: content + attachmentNote,
      createdAt: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setAttachedFiles([]);
    setIsSending(true);
    setStreamingContent("");

    try {
      let streamedAnswer = "";
      const answer = await streamChatCompletions(
        {
          agent_id: selectedAgentId,
          graph_id: agent?.graph_id || graphId || undefined,
          session_id: sessionId,
          channel: "preview",
          messages: nextMessages.map((item) => ({
            role: item.role,
            content: item.content,
          })),
        },
        (chunk) => {
          streamedAnswer += chunk;
          setStreamingContent((current) => current + chunk);
        },
      );

      const finalAnswer =
        answer || streamedAnswer || "Không có phản hồi từ agent.";

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: finalAnswer,
          createdAt: new Date(),
        },
      ]);
    } catch {
      setMessages((current) =>
        current.filter((item) => item.id !== userMessage.id),
      );
      setDraft(content);
      toast.error("Gửi tin nhắn thất bại");
    } finally {
      setStreamingContent("");
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const canSend = Boolean(selectedAgentId && draft.trim() && !isSending);

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <AppBreadcrumb
          items={[
            {
              label: "Trang chủ",
              href: "/ai/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "Khung chat người dùng",
              href: "/ai/chat-preview",
              icon: <MessageCircle className="size-4" />,
            },
          ]}
        />
      </div>

      <div className="flex h-0 min-h-0 flex-1 flex-col px-4 pb-4">
        <motion.div
          layout
          className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-black/[0.08] bg-white  dark:border-white/[0.08] dark:bg-transparent dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: motionEase }}
        >
          <header className={chatHeaderClass}>
            <div className="flex flex-col sm:flex-row sm:items-stretch">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground dark:bg-sidebar-primary dark:text-sidebar-primary-foreground">
                  <Bot className="size-[18px]" />
                  <AvatarOnlineDot
                    active={Boolean(selectedAgentMeta?.enabled)}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  {isLoadingAgent && selectedAgentId ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-2">
                      <h2
                        className={cn(
                          "min-w-0 truncate text-base font-semibold tracking-tight",
                          chatHeaderTitleClass,
                        )}
                      >
                        {agentTitle}
                      </h2>
                      {selectedAgentMeta ? (
                        <AgentStatusBadge enabled={selectedAgentMeta.enabled} />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2.5 sm:justify-end sm:border-t-0 sm:px-5 sm:py-0",
                  chatHeaderDividerClass,
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                  <AgentSelect
                    value={selectedAgentId}
                    onChange={handleAgentChange}
                    agents={agents}
                    isLoading={isLoadingListGraphAgents}
                    triggerClassName="h-8 w-full min-w-0 sm:w-[200px]"
                  />
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary dark:text-sidebar-foreground/75 dark:hover:bg-sidebar-accent dark:hover:text-sidebar-foreground"
                      onClick={handleCloseWidget}
                      aria-label="Làm mới hội thoại"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Làm mới hội thoại
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          <div className="relative flex h-0 min-h-0 flex-1 flex-col">
            <div className="flex h-0 min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-5 thin-scroll">
              {messages.length === 0 && !isSending ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-20 items-center justify-center">
                    <AiRobotAvatar className="size-20" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Bắt đầu cuộc hội thoại
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Gửi câu hỏi để kiểm tra phản hồi của agent đã chọn
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <ChatBubble key={message.id} message={message} />
                    ))}
                  </AnimatePresence>

                  {isSending ? (
                    <StreamingAssistantBubble content={streamingContent} />
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-black/[0.06] px-4 py-4 dark:border-white/[0.06]">
              {attachedFiles.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {attachedFiles.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <Paperclip className="size-3 shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() =>
                          setAttachedFiles((current) =>
                            current.filter((item) => item !== file),
                          )
                        }
                        aria-label={`Xóa ${file.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-2 rounded-2xl border border-black/[0.08] bg-zinc-50/80 px-2 py-2 transition-colors duration-200 focus-within:border-zinc-300 focus-within:bg-white dark:border-white/[0.08] dark:bg-zinc-900/50 dark:focus-within:border-zinc-600 dark:focus-within:bg-zinc-900">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-xl text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedAgentId || isSending}
                  aria-label="Đính kèm tệp"
                >
                  <Paperclip className="size-4" />
                </Button>

                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedAgentId
                      ? "Nhập tin nhắn..."
                      : "Chọn agent để bắt đầu"
                  }
                  disabled={!selectedAgentId || isSending}
                  rows={1}
                  className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
                />

                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 rounded-xl text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      disabled={!selectedAgentId || isSending}
                      aria-label="Chèn emoji"
                    >
                      <Smile className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    side="top"
                    className="w-auto rounded-xl border-black/[0.08] p-2 dark:border-white/[0.08]"
                  >
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex size-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => handleInsertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    "size-9 shrink-0 rounded-xl transition-all duration-200 ease-out active:scale-[0.96]",
                    canSend
                      ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                  )}
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  aria-label="Gửi tin nhắn"
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 px-1">
                <p className="text-[10px] text-zinc-400">
                  Enter gửi · Shift + Enter xuống dòng
                </p>
                {selectedAgentId ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 text-[10px] text-zinc-400"
                    asChild
                  >
                    <Link
                      href={`/ai/agent/actions?agent_id=${selectedAgentId}`}
                    >
                      Cấu hình agent
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
