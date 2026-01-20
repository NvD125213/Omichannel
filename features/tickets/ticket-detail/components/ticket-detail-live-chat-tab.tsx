import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowLeft } from "lucide-react";
import { IconMoodEmpty } from "@tabler/icons-react";
import TicketMessageInput, {
  TicketContextFormData,
} from "./ticket-message-input";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useCreateTicketContext,
  useGetTicketContextWithTicketId,
} from "@/hooks/ticket/ticket-contexts/use-ticket-context";
import { EmptyData } from "@/components/empty-data";
import { useMe } from "@/hooks/user/use-me";
import { toast } from "sonner";
import TicketContextDisplay from "./context-live-chat-list";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

interface TicketDetailLiveChatProps {
  ticketId?: string;
}

export default function TicketDetailLiveChatContext({
  ticketId,
}: TicketDetailLiveChatProps) {
  const params = useParams();
  const id = ticketId || (params?.ticketId as string);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: contextData } = useGetTicketContextWithTicketId(id, {
    page,
    page_size: pageSize,
  });

  const ticketContexts = contextData?.data?.data?.contexts || [];
  const pagination = contextData?.data?.data?.pagination;

  const { data: meData } = useMe();
  const { mutate: createTicketContext } = useCreateTicketContext();

  const handleCreateContext = (data: TicketContextFormData) => {
    if (!id) {
      toast.error("Không tìm thấy Ticket ID");
      return;
    }

    createTicketContext({
      ...data,
      ticket_id: id,
    });
  };

  const table = useReactTable({
    data: ticketContexts,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages || 0,
  });

  const mappedTicketContexts = ticketContexts.map((context) => ({
    id: context.id,
    context_type: context.context_type,
    source_type: context.source_type || "",
    context_id: context.context_id,
    context_metadata: context.context_metadata || {},
    tenant_id: context.tenant_id,
    created_at: context.created_at || new Date().toISOString(),
  }));

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] border rounded-lg bg-background overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Link href="/tickets/ticket-list">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                Danh sách bối cảnh của ticket
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-slate-50/50 dark:bg-transparent overflow-y-auto p-4 space-y-4">
          {mappedTicketContexts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyData
                className="w-full h-full"
                icon={IconMoodEmpty}
                title="Ticket chưa có context"
                description="Hãy thêm context mới hoặc thay đổi thông tin tìm kiếm"
              />
            </div>
          ) : (
            mappedTicketContexts.map((context, index) => (
              <TicketContextDisplay key={index} context={context} />
            ))
          )}
        </div>

        <div className="bg-background border-t">
          <TicketMessageInput
            onSubmit={handleCreateContext}
            tenantId={meData?.tenant_id}
            disabled={!meData?.tenant_id}
            table={table}
            pagination={{
              total: pagination?.total_count || 0,
              page: page,
              page_size: pageSize,
              total_pages: pagination?.total_pages || 0,
            }}
            currentPage={page}
            currentPageSize={pageSize}
            onPageChange={(p: number | null | undefined) => setPage(p || 1)}
            onPageSizeChange={(s: number | null | undefined) =>
              setPageSize(s || 10)
            }
          />
        </div>
      </div>
    </div>
  );
}
