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
  X,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetTicketEventsInfinite } from "@/hooks/ticket/ticket-events/use-ticket-event";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { convertDateTime } from "@/utils/convert-time";

import {
  Timeline,
  TimelineBody,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

const ActionTypeLabels: Record<string, string> = {
  CREATED: "Tạo mới",
  UPDATED: "Cập nhật",
  DELETED: "Xóa",
  CLOSED: "Đóng",
  ASSIGNED: "Phân công",
  UNASSIGNED: "Hủy phân công",
  MERGED: "Gộp",
  SPLITTED: "Tách",
  COMMENTED: "Bình luận",
  ATTACHED: "Đính kèm",
  DETACHED: "Gỡ đính kèm",
};

const FIELD_LABELS: Record<string, string> = {
  status: "Trạng thái",
  title: "Tiêu đề",
  description: "Mô tả",
  assignee: "Người xử lý",
  assignee_id: "Người xử lý",
  priority: "Ưu tiên",
  tags: "Tags",
  tag: "Tag",
  flow_id: "Luồng",
  flow: "Luồng",
  template_id: "Template",
  extension_data: "Extension Data",
  comment: "Bình luận",
  note: "Ghi chú",
  actor: "Tác nhân",
};

const getEventIcon = (type: string) => {
  const iconClass = "h-3.5 w-3.5";
  switch (type) {
    case ActionType.CREATED:
      return <PlusCircle className={iconClass} />;
    case ActionType.UPDATED:
      return <RefreshCw className={iconClass} />;
    case ActionType.DELETED:
      return <Scissors className={iconClass} />;
    case ActionType.CLOSED:
      return <CheckCircle2 className={iconClass} />;
    case ActionType.ASSIGNED:
      return <UserPlus className={iconClass} />;
    case ActionType.UNASSIGNED:
      return <UserMinus className={iconClass} />;
    case ActionType.MERGED:
      return <GitMerge className={iconClass} />;
    case ActionType.SPLITTED:
      return <GitBranch className={iconClass} />;
    case ActionType.COMMENTED:
      return <MessageSquare className={iconClass} />;
    case ActionType.ATTACHED:
      return <Paperclip className={iconClass} />;
    case ActionType.DETACHED:
      return <Scissors className={iconClass} />;
    default:
      return <HelpCircle className={iconClass} />;
  }
};

const getEventBadgeStyles = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60";
    case ActionType.UPDATED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60";
    case ActionType.DELETED:
      return "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60";
    case ActionType.CLOSED:
      return "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60";
    case ActionType.ASSIGNED:
      return "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60";
    case ActionType.COMMENTED:
      return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60";
    default:
      return "bg-muted/50 text-muted-foreground border-border dark:bg-transparent dark:text-zinc-300 dark:border-zinc-700";
  }
};

const getIconTone = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return "bg-blue-500 text-white";
    case ActionType.UPDATED:
      return "bg-emerald-500 text-white";
    case ActionType.DELETED:
      return "bg-red-500 text-white";
    case ActionType.CLOSED:
      return "bg-violet-500 text-white";
    case ActionType.ASSIGNED:
      return "bg-indigo-500 text-white";
    case ActionType.COMMENTED:
      return "bg-amber-500 text-white";
    default:
      return "bg-slate-400 text-white dark:bg-zinc-600";
  }
};

const formatFieldLabel = (key: string) =>
  FIELD_LABELS[key] ||
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isDiffValue = (value: unknown): value is { old: unknown; new: unknown } =>
  typeof value === "object" &&
  value !== null &&
  "old" in value &&
  "new" in value;

const formatPrimitive = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const DiffChip = ({
  oldValue,
  newValue,
}: {
  oldValue: unknown;
  newValue: unknown;
}) => (
  <span className="inline-flex max-w-full flex-wrap items-center gap-1 text-xs">
    <span className="truncate line-through text-red-500/80 dark:text-red-400/70">
      {formatPrimitive(oldValue)}
    </span>
    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
    <span className="truncate font-medium text-emerald-600 dark:text-emerald-400">
      {formatPrimitive(newValue)}
    </span>
  </span>
);

const renderPayloadValue = (value: unknown) => {
  if (value === null || value === undefined) return null;

  if (isDiffValue(value)) {
    return <DiffChip oldValue={value.old} newValue={value.new} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, idx) => (
          <Badge
            key={idx}
            variant="outline"
            className="h-5 max-w-[140px] truncate border-border/70 bg-transparent px-1.5 text-[10px] font-normal"
          >
            {formatPrimitive(item)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== "",
    );
    if (entries.length === 0)
      return <span className="text-muted-foreground">—</span>;

    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-2">
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatFieldLabel(k)}
            </span>
            <div className="min-w-0 text-right text-xs">
              {isDiffValue(v) ? (
                <DiffChip oldValue={v.old} newValue={v.new} />
              ) : (
                <span className="break-words font-medium text-foreground">
                  {formatPrimitive(v)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className="break-words font-medium text-foreground">
      {formatPrimitive(value)}
    </span>
  );
};

const EventPayloadMeta = ({
  payload,
}: {
  payload: Record<string, unknown>;
}) => {
  const entries = Object.entries(payload).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  if (entries.length === 0) return null;

  return (
    <div className="mt-1">
      <div className="space-y-1 text-xs">
        {entries.map(([key, value]) => {
          const isBlockValue =
            isDiffValue(value) ||
            (typeof value === "object" &&
              value !== null &&
              !Array.isArray(value));

          return (
            <div
              key={key}
              className={cn(
                "min-w-0",
                isBlockValue ? "space-y-0.5" : "flex items-start gap-1",
              )}
            >
              <div className="shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                {formatFieldLabel(key)}:
              </div>
              <div
                className={cn(
                  "min-w-0 text-foreground",
                  isBlockValue ? "pl-0" : "flex items-center",
                )}
              >
                {renderPayloadValue(value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function TicketEventTimelineData() {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
    event_type: eventTypeFilter !== "all" ? eventTypeFilter : undefined,
    from_date: dateFrom ? dateFrom.toISOString() : undefined,
    to_date: dateTo ? dateTo.toISOString() : undefined,
  } as any);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Filter Bar */}
      {/* Filter Bar — Select 1 hàng, 2 date Popover 1 hàng */}
      <div className="mb-2 flex shrink-0 flex-col gap-1.5 border-b border-dashed border-border/70 pb-2.5 dark:border-zinc-700">
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger
            className={cn(
              "h-7 w-full bg-transparent text-xs",
              "border border-border dark:border-zinc-700 dark:bg-transparent",
            )}
          >
            <SelectValue placeholder="Loại sự kiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả sự kiện</SelectItem>
            <SelectItem value="CREATED">Tạo mới</SelectItem>
            <SelectItem value="UPDATED">Cập nhật</SelectItem>
            <SelectItem value="COMMENTED">Bình luận</SelectItem>
            <SelectItem value="ASSIGNED">Giao việc</SelectItem>
            <SelectItem value="CLOSED">Đóng ticket</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-7 min-w-0 w-full justify-start overflow-hidden px-2 text-left text-xs font-normal",
                  "border border-border dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800/50",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <Clock className="mr-1 h-3 w-3 shrink-0" />
                <span className="truncate">
                  {dateFrom
                    ? format(dateFrom, "dd/MM/yy", { locale: vi })
                    : "Từ ngày"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
              {dateFrom && (
                <div className="border-t p-2 dark:border-zinc-700">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full border-border text-xs dark:border-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFrom(undefined);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Xóa
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-7 min-w-0 w-full justify-start overflow-hidden px-2 text-left text-xs font-normal",
                  "border border-border dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800/50",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <Clock className="mr-1 h-3 w-3 shrink-0" />
                <span className="truncate">
                  {dateTo
                    ? format(dateTo, "dd/MM/yy", { locale: vi })
                    : "Đến ngày"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
              {dateTo && (
                <div className="border-t p-2 dark:border-zinc-700">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full border-border text-xs dark:border-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateTo(undefined);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Xóa
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading || (isFetching && events.length === 0) ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <p className="text-xs">Đang tải lịch sử sự kiện...</p>
        </div>
      ) : isError ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-red-500 dark:text-red-400">
          <p className="text-xs">Không thể tải dữ liệu sự kiện</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center text-muted-foreground">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 dark:bg-transparent dark:border dark:border-zinc-700">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-foreground">
            Chưa có sự kiện nào cho ticket này
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Các hành vi sẽ được hệ thống tự động ghi lại
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
        >
          <Timeline
            color="secondary"
            orientation="vertical"
            className="w-full p-1"
          >
            {events.map((event) => (
              <TimelineItem key={event.id}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineIcon>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        getIconTone(event.event_type),
                      )}
                    >
                      {getEventIcon(event.event_type)}
                    </div>
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="-translate-y-1 pt-0 pb-3">
                  <div className="flex flex-col gap-1.5">
                    {/* Row 1: type + actor + time */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          getEventBadgeStyles(event.event_type),
                          "h-5 px-1.5 text-[10px] font-semibold",
                        )}
                      >
                        {ActionTypeLabels[event.event_type] || event.event_type}
                      </Badge>
                      {event.actor_type && (
                        <Badge
                          variant="outline"
                          className="h-5 border-border/70 bg-transparent px-1.5 text-[10px] font-medium uppercase text-muted-foreground dark:border-zinc-700"
                        >
                          {event.actor_type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/60 dark:bg-zinc-800">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span className="truncate text-xs font-medium text-foreground">
                        {event.actor_username || "Hệ thống"}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {event.created_at
                          ? convertDateTime(event.created_at, "short").datetime
                          : "N/A"}
                      </span>
                    </div>

                    {/* Smart metadata */}
                    {event.payload &&
                      typeof event.payload === "object" &&
                      !Array.isArray(event.payload) && (
                        <EventPayloadMeta
                          payload={event.payload as Record<string, unknown>}
                        />
                      )}
                  </div>
                </TimelineBody>
              </TimelineItem>
            ))}

            {hasNextPage && (
              <TimelineItem className="min-h-0">
                <TimelineHeader>
                  <TimelineIcon>
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="pt-0 pb-0">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground"
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
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="pt-0 pb-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Hết chuỗi sự kiện
                  </span>
                </TimelineBody>
              </TimelineItem>
            )}

            {hasNextPage && (
              <div
                ref={observerRef}
                className="flex h-8 items-center justify-center"
              >
                {isFetchingNextPage && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Đang tải...
                    </span>
                  </div>
                )}
              </div>
            )}
          </Timeline>
        </div>
      )}
    </div>
  );
}
