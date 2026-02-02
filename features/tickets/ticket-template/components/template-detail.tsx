"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  FileJson,
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

interface TemplateDetailProps {
  templateId: string;
  ticketId?: string;
}

export function TemplateDetail({ templateId, ticketId }: TemplateDetailProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const {
    data: templateResponse,
    isLoading,
    isError,
  } = useGetTicketTemplateById(templateId);

  const template = templateResponse?.data;

  // Fetch flow để lấy tên luồng
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
        <div className="pb-4 space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="w-full border-dashed border-2 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
        <div className="bg-muted p-2 rounded-full">
          <AlertCircle className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium text-md text-slate-700 mb-2">
            Không tìm thấy Template
          </h3>
          <p className="text-xs text-slate-500">
            Dữ liệu template chưa có dành cho ticket này. Hãy tạo template mới.
          </p>
        </div>
        <TemplateFormDialog ticketId={ticketId} />
      </div>
    );
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {template.name}
            </h3>
            <Badge
              variant="secondary"
              className={getStatusColor(template.is_active)}
            >
              {template.is_active ? "Hoạt động" : "Ngừng hoạt động"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenEdit(true)}
              className="h-8 gap-1.5 cursor-pointer"
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
      </div>

      <div className="space-y-6">
        {/* Description Section */}
        <div className="rounded-lg bg-slate-50/50 p-4 border border-slate-100">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-2 text-slate-700">
            <Plus className="size-3.5 text-primary" />
            Mô tả
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {template.description || "Không có mô tả"}
          </p>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Workflow className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Luồng xử lý
              </p>
              <p className="text-xs font-semibold uppercase text-slate-700">
                {flowName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ShieldCheck className="size-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                SLA
              </p>
              <p className="text-xs font-semibold uppercase text-slate-700">
                {slaName}
              </p>
            </div>
          </div>
        </div>

        {/* Extension Schema Section */}
        {/* {template.extension_schema && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-2 text-slate-700">
              <FileJson className="size-3.5 text-purple-500" />
              Cấu hình mở rộng
            </h4>
            <pre className="text-[11px] p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto border-l-4 border-purple-500 shadow-inner">
              {JSON.stringify(template.extension_schema, null, 2)}
            </pre>
          </div>
        )} */}

        {/* Metadata section */}
        <div className="flex flex-wrap items-center gap-6 justify-end pt-4 border-t border-slate-100">
          <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
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
