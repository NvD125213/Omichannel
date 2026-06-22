"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, Gauge, Loader2 } from "lucide-react";
import { SidebarDetailField } from "@/components/sidebar-detail";
import {
  useGetDocument,
  usePreviewDocument,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type { KgDocument } from "@/services/chatbot-kg-core/interfaces";
import { convertDateTime } from "@/utils/convert-time";
import { cn } from "@/lib/utils";
import {
  DocumentContentTypeBadge,
  DocumentSourceTypeBadge,
} from "./document-type-badge";
import {
  getStatusLabel,
  getStatusTone,
  isTerminalStatus,
  statusToneClass,
} from "../utils/document-status";

const readOnlyInputClass =
  "min-h-9 rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-3 py-2 text-sm text-foreground/88 shadow-none read-only:cursor-default read-only:opacity-100 focus-visible:ring-0";

const previewTextClass =
  "min-h-40 resize-none rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground/88 shadow-none read-only:cursor-default read-only:opacity-100 focus-visible:ring-0";

interface DocumentDataDetailPanelProps {
  graphId: string;
  document: KgDocument;
}

function hasDisplayValue(value: unknown) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function ReadOnlyValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return <div className={cn(readOnlyInputClass, className)}>{value}</div>;
}

function OverviewBadgeCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2.5 px-4 py-3.5">
      <Label className="block text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
        {label}
      </Label>
      <div className="flex min-h-7 items-center">{children}</div>
    </div>
  );
}

function OverviewMetaItem({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 px-4 py-3.5">
      {Icon && (
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30">
          <Icon className="size-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
          {label}
        </p>
        <p
          className={cn(
            "text-sm leading-relaxed text-foreground/90",
            className,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

interface DocumentOverviewSectionProps {
  document: KgDocument;
  createdAt: { date: string; time: string } | null;
  showQualityScore: boolean;
  isProcessing: boolean;
}

function DocumentOverviewSection({
  document,
  createdAt,
  showQualityScore,
  isProcessing,
}: DocumentOverviewSectionProps) {
  const showContentType = hasDisplayValue(document.content_type);
  const showSourceType = hasDisplayValue(document.source_type);
  const showStatus = hasDisplayValue(document.status);
  const badgeCount = [showContentType, showSourceType, showStatus].filter(
    Boolean,
  ).length;
  const hasMeta = createdAt || showQualityScore;

  if (badgeCount === 0 && !hasMeta) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-background">
      <div className="border-b border-border/50 bg-muted/15 px-4 py-3.5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-foreground/75 uppercase">
          Tổng quan
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
          {isProcessing
            ? "Tài liệu đang xử lý — thông tin sẽ cập nhật khi hoàn tất"
            : "Định dạng, nguồn và trạng thái xử lý"}
        </p>
      </div>

      {badgeCount > 0 && (
        <div
          className={cn(
            "grid divide-border/50 border-b border-border/50",
            badgeCount === 1 && "grid-cols-1",
            badgeCount === 2 && "grid-cols-2 divide-x",
            badgeCount >= 3 && "grid-cols-3 divide-x",
          )}
        >
          {showContentType && (
            <OverviewBadgeCell label="Định dạng">
              <DocumentContentTypeBadge contentType={document.content_type} />
            </OverviewBadgeCell>
          )}

          {showSourceType && (
            <OverviewBadgeCell label="Nguồn">
              <DocumentSourceTypeBadge sourceType={document.source_type} />
            </OverviewBadgeCell>
          )}

          {showStatus && (
            <OverviewBadgeCell label="Trạng thái">
              <Badge
                variant="outline"
                className={cn(
                  "w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
                  statusToneClass[getStatusTone(document.status)],
                )}
              >
                {getStatusLabel(document.status)}
              </Badge>
            </OverviewBadgeCell>
          )}
        </div>
      )}

      {hasMeta && (
        <div
          className={cn(
            "grid divide-border/50",
            createdAt && showQualityScore && "grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0",
          )}
        >
          {createdAt && (
            <OverviewMetaItem
              label="Thêm lúc"
              value={`${createdAt.date}, lúc ${createdAt.time}`}
              icon={CalendarClock}
              className="tabular-nums"
            />
          )}

          {showQualityScore && (
            <OverviewMetaItem
              label="Chất lượng"
              value={document.quality_score!.toFixed(1)}
              icon={Gauge}
              className="tabular-nums"
            />
          )}
        </div>
      )}
    </section>
  );
}

export function DocumentDataDetailPanel({
  graphId,
  document,
}: DocumentDataDetailPanelProps) {
  const { data: liveDocument, isLoading: isDocumentLoading } = useGetDocument(
    graphId,
    document.id,
  );

  const doc = liveDocument ?? document;
  const isProcessing = hasDisplayValue(doc.status) && !isTerminalStatus(doc.status);
  const canPreview =
    hasDisplayValue(doc.status) &&
    isTerminalStatus(doc.status) &&
    getStatusTone(doc.status) === "success";

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isFetching: isPreviewFetching,
  } = usePreviewDocument(
    graphId,
    document.id,
    undefined,
    { enabled: canPreview },
  );

  const createdAt = doc.created_at
    ? {
        ...convertDateTime(doc.created_at),
        time: convertDateTime(doc.created_at, "short").time,
      }
    : null;

  const showTitle = hasDisplayValue(doc.title);
  const showQualityScore = doc.quality_score != null;
  const showSourceUrl = hasDisplayValue(doc.source_url);
  const showCanonicalUrl = hasDisplayValue(doc.canonical_url);
  const showErrorMessage = hasDisplayValue(doc.error_message);

  const showPreviewSource = hasDisplayValue(preview?.source);
  const showPreviewText = hasDisplayValue(preview?.text);
  const showPreviewMessage = hasDisplayValue(preview?.message);

  return (
    <div className="space-y-5">
      {isDocumentLoading && !liveDocument && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Đang tải thông tin tài liệu...
        </div>
      )}

      {hasDisplayValue(doc.filename) && (
        <SidebarDetailField label="Tên tệp">
          <ReadOnlyValue value={doc.filename} />
        </SidebarDetailField>
      )}

      {showTitle && (
        <SidebarDetailField label="Tiêu đề">
          <ReadOnlyValue value={doc.title!} />
        </SidebarDetailField>
      )}

      <DocumentOverviewSection
        document={doc}
        createdAt={createdAt}
        showQualityScore={showQualityScore}
        isProcessing={isProcessing}
      />

      {showSourceUrl && (
        <SidebarDetailField label="URL nguồn">
          <ReadOnlyValue value={doc.source_url!} />
        </SidebarDetailField>
      )}

      {showCanonicalUrl && (
        <SidebarDetailField label="URL chuẩn hóa">
          <ReadOnlyValue value={doc.canonical_url!} />
        </SidebarDetailField>
      )}

      {showErrorMessage && (
        <SidebarDetailField label="Lỗi xử lý">
          <ReadOnlyValue
            value={doc.error_message!}
            className="text-rose-600 dark:text-rose-400"
          />
        </SidebarDetailField>
      )}

      <div className="space-y-4 border-t border-border/50 pt-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Xem trước nội dung
          </p>
          <p className="text-xs text-muted-foreground/80">
            Nội dung trích xuất từ tài liệu
          </p>
        </div>

        {isProcessing ? (
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Tài liệu đang được xử lý
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
              Nội dung xem trước sẽ khả dụng sau khi trạng thái chuyển sang sẵn
              sàng.
            </p>
          </div>
        ) : isPreviewLoading || isPreviewFetching ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {showPreviewSource && (
              <SidebarDetailField label="Nguồn preview">
                <ReadOnlyValue value={preview!.source} />
              </SidebarDetailField>
            )}

            {showPreviewText && (
              <SidebarDetailField
                label="Nội dung"
                description={
                  preview?.truncated
                    ? "Nội dung đã được rút gọn so với bản gốc"
                    : undefined
                }
              >
                <Textarea
                  readOnly
                  value={preview!.text}
                  className={previewTextClass}
                />
              </SidebarDetailField>
            )}

            {showPreviewMessage && (
              <SidebarDetailField label="Ghi chú preview">
                <ReadOnlyValue value={preview!.message!} />
              </SidebarDetailField>
            )}

            {!showPreviewSource && !showPreviewText && !showPreviewMessage && (
              <p className="text-xs italic text-muted-foreground/65">
                không có dữ liệu preview
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
