"use client";

import {
  Lock,
  FileText,
  Maximize2,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Paperclip,
  Sparkles,
  Send,
  Smile,
} from "lucide-react";
import { useRef, useState } from "react";
// import { SendMessageRequest } from "../utils/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {} from "@/hooks/chatwoot/use-chatwoot";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "private-note">(
    "reply",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleFileUpload = (type: "image" | "file") => {
    console.log(`Upload ${type}`);
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="rounded-2xl border bg-muted/20 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-md bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={composerMode === "reply" ? "secondary" : "ghost"}
              onClick={() => setComposerMode("reply")}
              className="h-7 rounded-md px-2 text-xs"
            >
              Trả lời
            </Button>
            <Button
              type="button"
              size="sm"
              variant={composerMode === "private-note" ? "secondary" : "ghost"}
              onClick={() => setComposerMode("private-note")}
              className="h-7 rounded-md px-2 text-xs"
            >
              <Lock className="size-3.5" />
              Lưu ý riêng
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={disabled}
            >
              <Sparkles className="size-4 text-violet-500" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={disabled}
            >
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>

        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          className={cn(
            "max-h-[150px] resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0",
            "cursor-text disabled:cursor-not-allowed",
          )}
          rows={3}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      className="size-8 cursor-pointer rounded-md disabled:cursor-not-allowed"
                    >
                      <Paperclip className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đính kèm file</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem
                  onClick={() => handleFileUpload("image")}
                  className="cursor-pointer"
                >
                  <ImageIcon className="mr-2 size-4" />
                  Gửi ảnh hoặc video
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileUpload("file")}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 size-4" />
                  Gửi tài liệu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="size-8 rounded-md"
                >
                  <Smile className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Thêm cảm xúc</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="size-8 rounded-md"
                >
                  <Mic className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ghi âm</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="size-8 rounded-md"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Thêm tùy chọn</TooltipContent>
            </Tooltip>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-medium",
              message.trim() ? "opacity-100" : "opacity-70",
            )}
          >
            Gửi (Nhấn Enter)
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
