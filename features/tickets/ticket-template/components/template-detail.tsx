"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Plus,
  Workflow,
  ShieldCheck,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { useGetTicketTemplateById } from "@/hooks/ticket/ticket-templates/use-ticket-templates";
import { TemplateFormDialog } from "./template-form-modal";
import { convertDateTime } from "@/utils/convert-time";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { cn } from "@/lib/utils";

interface TemplateDetailProps {
  templateId: string;
  ticketId?: string;
}

const getStatusColor = (isActive: boolean) =>
  isActive
    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

const infoCardClass =
  "flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/30";

export function TemplateDetail({ templateId, ticketId }: TemplateDetailProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const {
    data: templateResponse,
    isLoading,
    isError,
  } = useGetTicketTemplateById(templateId);

  const template = templateResponse?.data;

  const { data: flowsResponse } = useGetTicketFlows({
    page: 1,
    page_size: 1,
    id: template?.flow_id,
  });

  let flowName = "Chưa có";
  if (
    flowsResponse?.data.status_code === 200 &&
    flowsResponse?.data.data.flows.length > 0
  ) {
    flowName = flowsResponse.data.data.flows[0].name;
  }

  const slaName = template?.sla_name || "Chưa có";

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="space-y-2 pb-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="flex w-full flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border bg-muted/20 p-8 dark:bg-muted/10">
        <div className="rounded-full bg-muted p-2.5">
          <AlertCircle className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="mb-2 text-base font-medium text-foreground">
            Không tìm thấy Template
          </h3>
          <p className="text-xs text-muted-foreground">
            Dữ liệu template chưa có dành cho ticket này. Hãy tạo template mới.
          </p>
        </div>
        <TemplateFormDialog ticketId={ticketId} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-lg font-bold tracking-tight text-foreground">
            {template.name}
          </h3>
          <Badge
            variant="outline"
            className={cn("shrink-0", getStatusColor(template.is_active))}
          >
            {template.is_active ? "Hoạt động" : "Ngừng hoạt động"}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenEdit(true)}
            className="h-8 cursor-pointer gap-1.5 border-border/70 bg-background hover:bg-muted/60"
          >
            <Pencil className="size-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Sửa
            </span>
          </Button>
          <TemplateFormDialog
            template={template}
            ticketId={ticketId}
            open={openEdit}
            onOpenChange={setOpenEdit}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 dark:bg-muted/10">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Plus className="size-3.5 text-primary" />
            Mô tả
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground italic">
            {template.description || "Không có mô tả"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={infoCardClass}>
            <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-500/20 dark:bg-blue-500/15 dark:ring-blue-400/25">
              <Workflow className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Luồng xử lý
              </p>
              <p className="truncate text-xs font-semibold text-foreground uppercase">
                {flowName}
              </p>
            </div>
          </div>

          <div className={infoCardClass}>
            <div className="rounded-lg bg-amber-500/10 p-2 ring-1 ring-amber-500/20 dark:bg-amber-500/15 dark:ring-amber-400/25">
              <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                SLA
              </p>
              <p className="truncate text-xs font-semibold text-foreground uppercase">
                {slaName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-6 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>
              Tạo ngày: {convertDateTime(template.created_at, "short").datetime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
