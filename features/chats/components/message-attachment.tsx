"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  Eye,
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  Headphones,
  Pause,
  Play,
} from "lucide-react";
import { useState } from "react";
import type { MessageAttachment } from "../utils/types";

interface MessageAttachmentProps {
  attachment: MessageAttachment;
  isOwnMessage: boolean;
}

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
  "ico",
  "heic",
  "avif",
]);

const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"]);

const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);

const SPREADSHEET_EXTS = new Set(["xls", "xlsx", "csv", "ods"]);

const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"]);

const CODE_EXTS = new Set([
  "js",
  "ts",
  "tsx",
  "jsx",
  "json",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "css",
  "html",
  "md",
]);

const DOC_EXTS = new Set(["doc", "docx", "odt", "rtf", "txt"]);

type AttachmentKind =
  | "image"
  | "pdf"
  | "audio"
  | "video"
  | "spreadsheet"
  | "archive"
  | "document"
  | "code"
  | "generic";

function inferExtension(att: MessageAttachment): string {
  const raw = (att.extension ?? "").trim().toLowerCase().replace(/^\./, "");
  if (raw) return raw;
  const url = att.data_url ?? att.thumb_url ?? "";
  const path = (url.split("?")[0] ?? "").trim();
  const seg = path.split("/").pop() ?? "";
  const dot = seg.lastIndexOf(".");
  if (dot >= 0 && dot < seg.length - 1) {
    try {
      return decodeURIComponent(seg.slice(dot + 1)).toLowerCase();
    } catch {
      return seg.slice(dot + 1).toLowerCase();
    }
  }
  return "";
}

function displayFileName(att: MessageAttachment, ext: string): string {
  const url = att.data_url ?? att.thumb_url ?? "";
  const path = (url.split("?")[0] ?? "").trim();
  const seg = path.split("/").pop();
  if (seg) {
    try {
      const name = decodeURIComponent(seg);
      if (name.includes(".")) return name;
    } catch {
      /* ignore */
    }
  }
  return ext ? `Tệp .${ext}` : "Tệp đính kèm";
}

function classifyAttachment(att: MessageAttachment): AttachmentKind {
  const ft = (att.file_type ?? "").toLowerCase();
  const ext = inferExtension(att);

  if (ft === "image" || ft.startsWith("image/")) return "image";
  if (IMAGE_EXTS.has(ext)) return "image";

  if (ft === "audio" || ft.startsWith("audio/")) return "audio";
  if (AUDIO_EXTS.has(ext)) return "audio";

  if (ft === "video" || ft.startsWith("video/")) return "video";
  if (VIDEO_EXTS.has(ext)) return "video";

  if (ft.includes("pdf") || ext === "pdf") return "pdf";

  if (SPREADSHEET_EXTS.has(ext)) return "spreadsheet";
  if (ARCHIVE_EXTS.has(ext)) return "archive";
  if (CODE_EXTS.has(ext)) return "code";
  if (DOC_EXTS.has(ext)) return "document";

  return "generic";
}

function readableSize(size?: number): string {
  if (typeof size !== "number" || !Number.isFinite(size)) {
    return "Không rõ dung lượng";
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function MessageAttachment({
  attachment,
  isOwnMessage,
}: MessageAttachmentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const ext = inferExtension(attachment);
  const kind = classifyAttachment(attachment);
  const dataUrl = attachment.data_url ?? attachment.thumb_url ?? "";
  const thumbUrl = attachment.thumb_url ?? attachment.data_url ?? "";
  const displayName = displayFileName(attachment, ext);
  const sizeLabel = readableSize(attachment.file_size);

  const imageSrc = kind === "image" ? dataUrl || thumbUrl : "";

  const effectiveKind: AttachmentKind =
    kind === "image" && !imageSrc ? "generic" : kind;

  if (effectiveKind === "image" && imageSrc) {
    const iw =
      typeof attachment.width === "number" && attachment.width > 0
        ? attachment.width
        : null;
    const ih =
      typeof attachment.height === "number" && attachment.height > 0
        ? attachment.height
        : null;
    const aspectRatio = iw && ih ? `${iw} / ${ih}` : undefined;

    return (
      <a
        href={dataUrl || thumbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[min(100%,280px)] shrink-0 overflow-hidden rounded-lg bg-muted/40 ring-1 ring-black/5 dark:ring-white/10"
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          src={thumbUrl || imageSrc}
          alt={displayName}
          className="max-h-72w-full cursor-pointer object-contain transition-opacity hover:opacity-95"
          loading="lazy"
        />
      </a>
    );
  }

  if (effectiveKind === "pdf") {
    return (
      <FileAttachmentCard
        icon={
          <FileText
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-red-500",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-red-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (effectiveKind === "audio") {
    return (
      <div
        className={cn(
          "mt-2 flex items-center gap-3 rounded-xl p-3",
          isOwnMessage
            ? "bg-primary-foreground/10"
            : "border border-border bg-muted/80",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-full",
            isOwnMessage
              ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
              : "bg-foreground text-background hover:bg-foreground/90",
          )}
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="ml-0.5 size-4" />
          )}
        </Button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              isOwnMessage ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {displayName}
          </p>
          <div className="mt-1 flex h-6 items-center gap-[2px]">
            {[
              35, 55, 25, 70, 45, 60, 30, 80, 40, 65, 35, 75, 50, 60, 28, 85,
              42, 55, 32, 68,
            ].map((height, i) => (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full",
                  isOwnMessage
                    ? "bg-primary-foreground/50"
                    : "bg-foreground/40",
                  isPlaying &&
                    i < 7 &&
                    (isOwnMessage ? "bg-primary-foreground" : "bg-foreground"),
                )}
                style={{ height: `${height}%`, minHeight: "3px" }}
              />
            ))}
          </div>

          <div className="mt-1 flex items-center justify-between">
            <span
              className={cn(
                "text-xs",
                isOwnMessage
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {sizeLabel}
            </span>
            <Headphones
              className={cn(
                "size-3",
                isOwnMessage
                  ? "text-primary-foreground/50"
                  : "text-muted-foreground",
              )}
            />
          </div>
        </div>

        {dataUrl ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            asChild
          >
            <a href={dataUrl} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
            </a>
          </Button>
        ) : null}
      </div>
    );
  }

  if (effectiveKind === "video") {
    return (
      <FileAttachmentCard
        icon={
          <Film
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-violet-500",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-violet-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (effectiveKind === "spreadsheet") {
    return (
      <FileAttachmentCard
        icon={
          <FileSpreadsheet
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-emerald-600",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-emerald-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (effectiveKind === "archive") {
    return (
      <FileAttachmentCard
        icon={
          <FileArchive
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-amber-600",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-amber-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (kind === "code") {
    return (
      <FileAttachmentCard
        icon={
          <FileCode
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-sky-600",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-sky-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (effectiveKind === "document") {
    return (
      <FileAttachmentCard
        icon={
          <FileText
            className={cn(
              "size-5",
              isOwnMessage ? "text-primary-foreground" : "text-blue-600",
            )}
          />
        }
        iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-blue-500/10"}
        title={displayName}
        subtitle={sizeLabel}
        dataUrl={dataUrl}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  return (
    <FileAttachmentCard
      icon={
        <File
          className={cn(
            "size-5",
            isOwnMessage ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
      }
      iconBg={isOwnMessage ? "bg-primary-foreground/20" : "bg-muted"}
      title={displayName}
      subtitle={sizeLabel}
      dataUrl={dataUrl}
      isOwnMessage={isOwnMessage}
    />
  );
}

function FileAttachmentCard({
  icon,
  iconBg,
  title,
  subtitle,
  dataUrl,
  isOwnMessage,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  dataUrl: string;
  isOwnMessage: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex min-w-0 max-w-full items-center gap-3 rounded-lg border p-3",
        isOwnMessage
          ? "border-primary-foreground/20 bg-primary-foreground/10"
          : "border-border bg-muted/50",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            isOwnMessage ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "text-xs",
            isOwnMessage
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={!dataUrl}
          className={cn(
            "size-8",
            !dataUrl && "cursor-not-allowed opacity-50",
            isOwnMessage && "hover:bg-primary-foreground/20",
          )}
          asChild={Boolean(dataUrl)}
        >
          {dataUrl ? (
            <a href={dataUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="size-4" />
            </a>
          ) : (
            <span>
              <Eye className="size-4" />
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!dataUrl}
          className={cn(
            "size-8",
            !dataUrl && "cursor-not-allowed opacity-50",
            isOwnMessage && "hover:bg-primary-foreground/20",
          )}
          asChild={Boolean(dataUrl)}
        >
          {dataUrl ? (
            <a href={dataUrl} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
            </a>
          ) : (
            <span>
              <Download className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
