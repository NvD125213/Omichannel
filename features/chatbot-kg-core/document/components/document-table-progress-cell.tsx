"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentTableEmptyValue } from "./document-table-empty-value";
import {
  getStatusProgress,
  getStatusTone,
  isTerminalStatus,
  type StatusTone,
} from "../utils/document-status";

const toneBarClass: Record<StatusTone, string> = {
  pending:
    "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 shadow-[0_0_12px_-2px_rgba(245,158,11,0.55)]",
  success:
    "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 shadow-[0_0_10px_-2px_rgba(16,185,129,0.45)]",
  error:
    "bg-gradient-to-r from-rose-400 via-rose-500 to-red-400 shadow-[0_0_10px_-2px_rgba(244,63,94,0.45)]",
  neutral: "bg-gradient-to-r from-primary/70 to-primary",
};

const toneTrackClass: Record<StatusTone, string> = {
  pending: "bg-amber-100/80 ring-amber-200/60 dark:bg-amber-950/30 dark:ring-amber-800/40",
  success:
    "bg-emerald-100/70 ring-emerald-200/50 dark:bg-emerald-950/25 dark:ring-emerald-800/35",
  error: "bg-rose-100/70 ring-rose-200/50 dark:bg-rose-950/25 dark:ring-rose-800/35",
  neutral: "bg-muted/50 ring-border/50",
};

interface DocumentTableProgressCellProps {
  status: string;
  highlighted?: boolean;
  compact?: boolean;
  className?: string;
}

export function DocumentTableProgressCell({
  status,
  highlighted = false,
  compact = false,
  className,
}: DocumentTableProgressCellProps) {
  const tone = getStatusTone(status);
  const processing = highlighted || !isTerminalStatus(status);
  const isSuccess = tone === "success" && !processing;
  const barWidth = processing ? "42%" : isSuccess ? "100%" : `${getStatusProgress(status)}%`;

  if (!processing && tone === "neutral") {
    return <DocumentTableEmptyValue className={className} />;
  }

  const StatusIcon = isSuccess
    ? CheckCircle2
    : tone === "error"
      ? XCircle
      : processing
        ? Loader2
        : null;

  return (
    <div
      className={cn(
        "flex flex-col",
        compact ? "min-w-28 gap-1" : "min-w-36 gap-1.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {StatusIcon && (
          <StatusIcon
            className={cn(
              "size-3.5 shrink-0",
              isSuccess && "text-emerald-500",
              tone === "error" && "text-rose-500",
              processing && "animate-spin text-amber-500",
            )}
          />
        )}
        <span
          className={cn(
            "text-[11px] font-medium",
            processing && "text-amber-700 dark:text-amber-400",
            isSuccess && "tabular-nums text-emerald-700 dark:text-emerald-400",
            tone === "error" && "text-rose-700 dark:text-rose-400",
          )}
        >
          {processing ? "Đang chạy" : isSuccess ? "100%" : "Lỗi"}
        </span>
      </div>

      <div
        className={cn(
          "relative h-2 overflow-hidden rounded-full ring-1 ring-inset",
          toneTrackClass[tone],
        )}
      >
        <motion.div
          className={cn(
            "relative h-full overflow-hidden rounded-full",
            toneBarClass[tone],
          )}
          initial={false}
          animate={{ width: barWidth }}
          transition={{
            duration: processing ? 1.4 : 0.85,
            ease: processing ? "easeInOut" : [0.22, 1, 0.36, 1],
            repeat: processing ? Infinity : 0,
            repeatType: processing ? "reverse" : undefined,
          }}
        >
          {processing && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              animate={{ x: ["-120%", "220%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>

        {processing && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-amber-400/10"
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
