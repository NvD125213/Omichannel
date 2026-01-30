import {
  User,
  Clock,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  UserMinus,
  GitMerge,
  GitBranch,
  MessageSquare,
  Paperclip,
  Scissors,
  HelpCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetTicketEventsInfinite } from "@/hooks/ticket/ticket-events/use-ticket-event";
import { useParams } from "next/navigation";
import { format } from "date-fns";

import {
  Timeline,
  TimelineBody,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { useEffect, useRef } from "react";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";

const ActionType = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  CLOSED: "CLOSED",
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  MERGED: "MERGED",
  SPLITTED: "SPLITTED",
  COMMENTED: "COMMENTED",
  ATTACHED: "ATTACHED",
  DETACHED: "DETACHED",
};

const getEventIcon = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return <PlusCircle className="h-4 w-4" />;
    case ActionType.UPDATED:
      return <RefreshCw className="h-4 w-4" />;
    case ActionType.DELETED:
      return <Scissors className="h-4 w-4" />;
    case ActionType.CLOSED:
      return <CheckCircle2 className="h-4 w-4" />;
    case ActionType.ASSIGNED:
      return <UserPlus className="h-4 w-4" />;
    case ActionType.UNASSIGNED:
      return <UserMinus className="h-4 w-4" />;
    case ActionType.MERGED:
      return <GitMerge className="h-4 w-4" />;
    case ActionType.SPLITTED:
      return <GitBranch className="h-4 w-4" />;
    case ActionType.COMMENTED:
      return <MessageSquare className="h-4 w-4" />;
    case ActionType.ATTACHED:
      return <Paperclip className="h-4 w-4" />;
    case ActionType.DETACHED:
      return <Scissors className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

const getEventBadgeStyles = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case ActionType.UPDATED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case ActionType.DELETED:
      return "bg-red-50 text-red-700 border-red-200";
    case ActionType.CLOSED:
      return "bg-purple-50 text-purple-700 border-purple-200";
    case ActionType.ASSIGNED:
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case ActionType.COMMENTED:
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const renderPayloadValue = (value: any) => {
  if (value === null || value === undefined) return null;

  if (typeof value === "object" && "old" in value && "new" in value) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="line-through text-red-400">{String(value.old)}</span>
        <span className="text-slate-400">→</span>
        <span className="font-semibold text-emerald-600">
          {String(value.new)}
        </span>
      </span>
    );
  }

  return <span>{String(value)}</span>;
};

export function TicketEventTimelineData() {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const {
    data: eventsInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    isFetching,
  } = useGetTicketEventsInfinite({
    ticket_id: ticketId,
  });

  const events =
    eventsInfiniteData?.pages
      ?.flatMap((page) => page?.data?.data?.ticket_events || [])
      ?.reverse() ?? [];

  const observerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    if (isFetchingNextPage && containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollTop;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (
      !isFetchingNextPage &&
      containerRef.current &&
      scrollPosRef.current > 0
    ) {
      containerRef.current.scrollTop = scrollPosRef.current;
    }
  }, [isFetchingNextPage, events.length]);

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

  if (!ticketId) {
    return null;
  }

  if (isLoading || (isFetching && events.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Đang tải lịch sử sự kiện...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <p className="text-sm">Không thể tải dữ liệu sự kiện</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">
          Chưa có sự kiện nào cho ticket này
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Các hành vi sẽ được hệ thống tự động ghi lại
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pr-2"
    >
      <Timeline
        color="secondary"
        orientation="vertical"
        className="w-full p-2.5"
      >
        {events.map((event) => (
          <TimelineItem key={event.id}>
            <TimelineHeader>
              <TimelineSeparator />
              <TimelineIcon>{getEventIcon(event.event_type)}</TimelineIcon>
            </TimelineHeader>
            <TimelineBody className="-translate-y-1.5 pt-0 pb-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getEventBadgeStyles(event.event_type)} text-[10px] px-2 py-0 h-5 font-semibold`}
                  >
                    {event.event_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-2 py-0 h-5 font-semibold uppercase"
                  >
                    {event.actor_type}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-full">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm leading-none font-bold text-slate-900">
                      {event.actor_username}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-[11px] font-medium">
                        {event.created_at
                          ? format(
                              new Date(event.created_at),
                              "hh:mm a, dd/MM/yyyy",
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payload content */}
                {event.payload && (
                  <div className="mt-1 space-y-1">
                    {event.payload.title && (
                      <p className="text-slate-700 text-sm">
                        <span className="font-semibold">Tiêu đề:</span>{" "}
                        {renderPayloadValue(event.payload.title)}
                      </p>
                    )}

                    {event.payload.priority && (
                      <p className="text-slate-700 text-sm">
                        <span className="font-semibold">Độ ưu tiên:</span>{" "}
                        {renderPayloadValue(event.payload.priority)}
                      </p>
                    )}
                    {event.payload.status && (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <span className="font-semibold">Trạng thái:</span>{" "}
                        {renderPayloadValue(event.payload.status)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TimelineBody>
          </TimelineItem>
        ))}

        {hasNextPage && (
          <TimelineItem className="min-h-0">
            <TimelineHeader>
              <TimelineIcon>
                <div className="h-2 w-2 rounded-full bg-slate-300 ring-4 ring-slate-50" />
              </TimelineIcon>
            </TimelineHeader>
            <TimelineBody className="pt-0 pb-0">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400"
              >
                {isFetchingNextPage ? "Đang tải..." : "Tải thêm sự kiện"}
              </button>
            </TimelineBody>
          </TimelineItem>
        )}

        {!hasNextPage && (
          <TimelineItem className="min-h-0">
            <TimelineHeader>
              <TimelineIcon>
                <div className="h-2 w-2 rounded-full bg-slate-300 ring-4 ring-slate-50" />
              </TimelineIcon>
            </TimelineHeader>
            <TimelineBody className="pt-0 pb-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hết chuỗi sự kiện
              </span>
            </TimelineBody>
          </TimelineItem>
        )}

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
      </Timeline>
    </div>
  );
}
