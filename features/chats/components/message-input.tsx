"use client";

import {
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  Headphones,
  ImageIcon,
  Paperclip,
  Reply,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCreateTenantConversationMessage,
  useToggleTenantConversationTyping,
} from "@/hooks/chatwoot/use-chatwoot";
import EmojiPicker from "emoji-picker-react";
import type { ReplyDraft } from "../utils/types";

// ─── file type helpers ────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mkv", "mov", "avi", "wmv"]);
const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "bz2"]);
const CODE_EXTS = new Set([
  "js",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "go",
  "java",
  "c",
  "cpp",
  "cs",
  "php",
  "html",
  "css",
  "json",
  "yml",
  "yaml",
  "sh",
]);
const SHEET_EXTS = new Set(["xls", "xlsx", "csv", "ods"]);

type FileKind =
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "code"
  | "sheet"
  | "pdf"
  | "generic";

function getExt(file: File): string {
  return (file.name.split(".").pop() ?? "").toLowerCase();
}

function classifyFile(file: File): FileKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  const ext = getExt(file);
  if (IMAGE_EXTS.has(ext)) return "image";
  if (AUDIO_EXTS.has(ext)) return "audio";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (ARCHIVE_EXTS.has(ext)) return "archive";
  if (CODE_EXTS.has(ext)) return "code";
  if (SHEET_EXTS.has(ext)) return "sheet";
  return "generic";
}

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const KIND_ICON: Record<FileKind, React.ElementType> = {
  image: ImageIcon,
  audio: Headphones,
  video: Film,
  archive: FileArchive,
  code: FileCode,
  sheet: FileSpreadsheet,
  pdf: FileText,
  generic: File,
};

const KIND_COLOR: Record<FileKind, string> = {
  image: "text-sky-500 bg-sky-50 dark:bg-sky-950/40",
  audio: "text-purple-500 bg-purple-50 dark:bg-purple-950/40",
  video: "text-pink-500 bg-pink-50 dark:bg-pink-950/40",
  archive: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
  code: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
  sheet: "text-green-500 bg-green-50 dark:bg-green-950/40",
  pdf: "text-red-500 bg-red-50 dark:bg-red-950/40",
  generic: "text-muted-foreground bg-muted",
};

// ─── staged file entry ────────────────────────────────────────────────────────

interface StagedFile {
  id: string;
  file: File;
  kind: FileKind;
  previewUrl: string | null; // object URL for images
}

// ─── component ────────────────────────────────────────────────────────────────

interface MessageInputProps {
  tenantId: string;
  conversationId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  replyDraft?: ReplyDraft | null;
  onClearReply?: () => void;
  /** Gọi trước khi gửi để hiển thị tin nhắn optimistic */
  onBeforeSend?: (tempId: string, content: string, filesCount: number) => void;
  /** Gọi sau khi API trả về: succeeded=true hoặc false kèm hàm retry */
  onSendResult?: (
    tempId: string,
    succeeded: boolean,
    retry?: () => Promise<void>,
  ) => void;
}

export function MessageInput({
  tenantId,
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
  replyDraft = null,
  onClearReply,
  onBeforeSend,
  onSendResult,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);

  const { mutateAsync: createTenantConversationMessageAsync } =
    useCreateTenantConversationMessage();
  const { mutate: toggleTenantConversationTyping } =
    useToggleTenantConversationTyping();

  const isComposerDisabled = disabled;
  const canSend =
    !isComposerDisabled &&
    (message.trim().length > 0 || stagedFiles.length > 0);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const emitTypingStatus = useCallback(
    (status: "on" | "off") => {
      if (!tenantId.trim() || !conversationId.trim()) return;
      toggleTenantConversationTyping({
        tenantId,
        conversationId,
        data: { typing_status: status },
      });
    },
    [conversationId, tenantId, toggleTenantConversationTyping],
  );

  const scheduleTypingOff = useCallback(() => {
    clearTypingTimeout();
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingActiveRef.current) {
        emitTypingStatus("off");
        isTypingActiveRef.current = false;
      }
    }, 10000);
  }, [clearTypingTimeout, emitTypingStatus]);

  useEffect(() => {
    return () => {
      clearTypingTimeout();
      if (isTypingActiveRef.current) {
        emitTypingStatus("off");
        isTypingActiveRef.current = false;
      }
    };
  }, [clearTypingTimeout, emitTypingStatus]);

  // emoji click-outside / escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!emojiContainerRef.current?.contains(target))
        setShowEmojiPicker(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showEmojiPicker]);

  // Build reply attributes (memoised)
  const replyAttributes = useMemo(() => {
    if (!replyDraft) return {};
    const id = Number.parseInt(String(replyDraft.messageId), 10);
    if (!Number.isFinite(id)) return {};
    return { in_reply_to: id, in_reply_to_external_id: null as string | null };
  }, [replyDraft]);

  const afterSend = useCallback(
    (sentContent: string) => {
      onSendMessage(sentContent);
      setMessage("");
      setStagedFiles((prev) => {
        prev.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        return [];
      });
      onClearReply?.();
      clearTypingTimeout();
      if (isTypingActiveRef.current) {
        emitTypingStatus("off");
        isTypingActiveRef.current = false;
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [clearTypingTimeout, emitTypingStatus, onClearReply, onSendMessage],
  );

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!canSend || !tenantId.trim() || !conversationId.trim()) return;

    // Chụp snapshot dữ liệu trước khi clear input
    const capturedContent = trimmedMessage;
    const capturedFiles = stagedFiles.map((sf) => sf.file);
    const capturedReplyAttrs = { ...replyAttributes };
    const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Thông báo hiển thị optimistic message ngay lập tức
    onBeforeSend?.(tempId, capturedContent, capturedFiles.length);

    // Xoá input ngay (optimistic clear)
    afterSend(trimmedMessage);

    // Hàm thực hiện request – có thể gọi lại khi retry
    const executeRequest = async () => {
      if (capturedFiles.length > 0) {
        const formData = new FormData();
        formData.append("content", capturedContent);
        formData.append("message_type", "outgoing");
        formData.append("private", "false");
        formData.append("content_type", "text");
        if ("in_reply_to" in capturedReplyAttrs) {
          formData.append(
            "content_attributes[in_reply_to]",
            String(capturedReplyAttrs.in_reply_to),
          );
          formData.append("content_attributes[in_reply_to_external_id]", "");
        }
        capturedFiles.forEach((file) => formData.append("attachments[]", file));
        await createTenantConversationMessageAsync({
          tenantId,
          conversationId,
          data: formData,
        });
      } else {
        if (!capturedContent) return;
        await createTenantConversationMessageAsync({
          tenantId,
          conversationId,
          data: {
            content: capturedContent,
            message_type: "outgoing",
            private: false,
            content_type: "text",
            content_attributes: capturedReplyAttrs,
          },
        });
      }
    };

    try {
      await executeRequest();
      onSendResult?.(tempId, true);
    } catch {
      // Báo thất bại, truyền hàm retry
      onSendResult?.(tempId, false, async () => {
        try {
          await executeRequest();
          onSendResult?.(tempId, true);
        } catch {
          onSendResult?.(tempId, false);
        }
      });
    }
  }, [
    afterSend,
    canSend,
    conversationId,
    createTenantConversationMessageAsync,
    message,
    onBeforeSend,
    onSendResult,
    replyAttributes,
    stagedFiles,
    tenantId,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    if (!isComposerDisabled) {
      if (value.trim().length > 0) {
        if (!isTypingActiveRef.current) {
          emitTypingStatus("on");
          isTypingActiveRef.current = true;
        }
        scheduleTypingOff();
      } else if (isTypingActiveRef.current) {
        clearTypingTimeout();
        emitTypingStatus("off");
        isTypingActiveRef.current = false;
      }
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handlePickFile = useCallback(() => {
    if (isComposerDisabled) return;
    fileInputRef.current?.click();
  }, [isComposerDisabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files ? Array.from(e.target.files) : [];
      e.target.value = "";
      if (selected.length === 0) return;

      const newEntries: StagedFile[] = selected.map((file) => {
        const kind = classifyFile(file);
        const previewUrl = kind === "image" ? URL.createObjectURL(file) : null;
        return {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          kind,
          previewUrl,
        };
      });

      setStagedFiles((prev) => [...prev, ...newEntries]);
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    setStagedFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  return (
    <div className="shrink-0 border-t bg-transparent px-3 py-2">
      {/* Reply strip */}
      {replyDraft ? (
        <div className="mb-1.5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
          <Reply className="size-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-xs font-medium text-primary">
              {replyDraft.senderLabel}
            </span>
            <span className="mx-1 text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground truncate">
              {replyDraft.preview || "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onClearReply?.()}
            className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Hủy trích dẫn"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Staged attachments preview */}
      {stagedFiles.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-1.5">
          {stagedFiles.map(({ id, file, kind, previewUrl }) => {
            const Icon = KIND_ICON[kind];
            return (
              <div
                key={id}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-md border border-border/50 bg-background px-2 py-1 text-xs",
                  "max-w-[180px] min-w-0",
                )}
              >
                {/* Thumbnail or icon */}
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="size-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded",
                      KIND_COLOR[kind],
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                )}

                {/* Name + size */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="truncate font-medium leading-tight text-foreground"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {readableSize(file.size)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(id)}
                  className="ml-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                  aria-label={`Xóa ${file.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2 transition-colors",
          "focus-within:border-primary/40 focus-within:bg-background",
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        {/* Attach button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isComposerDisabled}
          onClick={handlePickFile}
          className="mb-0.5 size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Đính kèm tệp"
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isComposerDisabled}
          rows={1}
          className="min-h-0 flex-1 resize-none border-0 bg-transparent py-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        />

        {/* Emoji picker */}
        <div ref={emojiContainerRef} className="relative shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isComposerDisabled}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="mb-0.5 size-7 text-muted-foreground hover:text-foreground"
            aria-expanded={showEmojiPicker}
            aria-haspopup="dialog"
            aria-label="Mở bảng emoji"
          >
            <Smile className="size-4" />
          </Button>

          {showEmojiPicker && (
            <div className="absolute bottom-9 right-0 z-50">
              <EmojiPicker
                onEmojiClick={(emoji) =>
                  setMessage((prev) => prev + emoji.emoji)
                }
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          disabled={!canSend}
          onClick={() => {
            void handleSendMessage();
          }}
          className={cn(
            "mb-0.5 size-7 shrink-0 rounded-lg transition-all",
            canSend ? "opacity-100" : "opacity-40",
          )}
          aria-label="Gửi (Enter)"
        >
          <Send className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
