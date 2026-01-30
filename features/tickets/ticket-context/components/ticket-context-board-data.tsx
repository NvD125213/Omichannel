import { IconMoodEmpty } from "@tabler/icons-react";
import TicketMessageInput, {
  TicketContextFormData,
} from "./ticket-context-message-input";
import { useParams } from "next/navigation";
import {
  useCreateTicketContext,
  useGetTicketContextWithTicketIdInfinite,
} from "@/hooks/ticket/ticket-contexts/use-ticket-context";
import { EmptyData } from "@/components/empty-data";
import { useMe } from "@/hooks/user/use-me";
import { toast } from "sonner";
import TicketContextDisplay from "./ticket-context-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface TicketDetailLiveChatProps {
  ticketId?: string;
}

export default function TicketDetailLiveChatContext({
  ticketId,
}: TicketDetailLiveChatProps) {
  const params = useParams();
  const id = ticketId || (params?.ticketId as string);

  const {
    data: contextInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    isFetching,
  } = useGetTicketContextWithTicketIdInfinite(id);

  // Flatten và reverse để mới nhất ở trên
  const ticketContexts =
    contextInfiniteData?.pages
      ?.flatMap((page) => page?.data?.data?.contexts || [])
      ?.reverse() ?? [];

  const observerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);

  // Lưu scroll position khi bắt đầu fetch
  useEffect(() => {
    if (isFetchingNextPage && containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollTop;
    }
  }, [isFetchingNextPage]);

  // Restore scroll position sau khi dữ liệu được load
  useEffect(() => {
    if (
      !isFetchingNextPage &&
      containerRef.current &&
      scrollPosRef.current > 0
    ) {
      containerRef.current.scrollTop = scrollPosRef.current;
    }
  }, [isFetchingNextPage, ticketContexts.length]);

  // Auto load more khi scroll đến sentinel
  useEffect(() => {
    if (!observerRef.current || !hasNextPage || isFetchingNextPage || isLoading)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 200px 0px" },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading]);

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
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] rounded-lg bg-white overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div
          ref={containerRef}
          className="flex-1 relative min-h-0 dark:bg-transparent overflow-y-auto space-y-4"
        >
          {isLoading || (isFetching && mappedTicketContexts.length === 0) ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="relative rounded-lg p-4 bg-white border"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pl-13">
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <EmptyData
                className="w-full h-full"
                icon={IconMoodEmpty}
                title="Lỗi tải dữ liệu"
                description="Không thể tải danh sách context"
              />
            </div>
          ) : mappedTicketContexts.length === 0 ? (
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

          {/* Sentinel element for infinite scroll */}
          {hasNextPage && (
            <div
              ref={observerRef}
              className="h-10 flex items-center justify-center"
            >
              {isFetchingNextPage && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Đang tải...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white">
          <TicketMessageInput
            onSubmit={handleCreateContext}
            tenantId={meData?.tenant_id}
            disabled={!meData?.tenant_id}
          />
        </div>
      </div>
    </div>
  );
}
