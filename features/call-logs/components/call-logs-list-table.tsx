"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  EllipsisVertical,
  Eye,
  ListTree,
  Phone,
  PhoneCall,
  TimerReset,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";
import { IconMoodEmpty } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyData } from "@/components/empty-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CallLog, Pagination } from "@/services/call-logs/service";
import { convertDateTime } from "@/utils/convert-time";
import { CallLogDetail } from "./call-log-detail";
import { CallLogsListPagination } from "./call-logs-list-pagination";

interface CallLogsListTableProps {
  callLogs: CallLog[];
  pagination?: Pagination;
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return null;
  }
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getDirectionMeta(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") {
    return {
      label: "Gọi vào",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
      icon: ArrowDownLeft,
    };
  }
  if (value === "outbound") {
    return {
      label: "Gọi ra",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
      icon: ArrowUpRight,
    };
  }
  return {
    label: direction || "Không rõ",
    className: "bg-muted text-muted-foreground",
    icon: Phone,
  };
}

function getStatusClassName(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "completed", "success", "ended"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (["ringing", "in_progress", "busy", "calling"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (
    ["missed", "failed", "no_answer", "cancelled", "canceled"].includes(value)
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-muted text-muted-foreground";
}

/** Ticket ưu tiên hơn customer; không có cả hai = cuộc gọi tự do */
function getCallSourceMeta(log: CallLog) {
  if (log.ticket_id) {
    return {
      label: "Ticket",
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
      icon: ClipboardList,
    };
  }
  if (log.customer_id) {
    return {
      label: "Khách hàng",
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
      icon: UserRound,
    };
  }
  return {
    label: "Tự do",
    className:
      "border-border bg-muted/60 text-muted-foreground dark:bg-muted/30",
    icon: PhoneCall,
  };
}

function getCallSourceChannel(source: string | null | undefined) {
  const value = String(source ?? "").trim().toLowerCase();
  if (!value) return "—";
  if (value === "web") return "Web";
  return value;
}

function formatDateTimeCell(value: string | null | undefined) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  try {
    const { date, time } = convertDateTime(value, "short");
    return (
      <div className="flex flex-col text-sm">
        <span>{date}</span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    );
  } catch {
    return <span className="text-sm">{value}</span>;
  }
}

function formatEventTime(value: string | null | undefined) {
  if (!value) return null;
  try {
    return convertDateTime(value, "short").datetime;
  } catch {
    return value;
  }
}

/** Timeline event suy ra từ dữ liệu call log hiện có */
function getCallEvents(log: CallLog) {
  const events: { label: string; time: string | null; detail?: string }[] = [];

  if (log.started_at) {
    events.push({
      label: "Bắt đầu cuộc gọi",
      time: formatEventTime(log.started_at),
    });
  }
  if (log.answered_at) {
    events.push({
      label: "Nghe máy",
      time: formatEventTime(log.answered_at),
    });
  }
  if (log.ended_at) {
    events.push({
      label: "Kết thúc cuộc gọi",
      time: formatEventTime(log.ended_at),
      detail: log.status ? `Trạng thái: ${log.status}` : undefined,
    });
  }

  const hangup = log.meta_data?.sip_hangup_disposition;
  if (typeof hangup === "string" && hangup.trim()) {
    events.push({
      label: "Hangup disposition",
      time: null,
      detail: hangup,
    });
  }

  const metaStatus = log.meta_data?.status;
  if (typeof metaStatus === "string" && metaStatus.trim()) {
    events.push({
      label: "Trạng thái SIP",
      time: null,
      detail: metaStatus,
    });
  }

  return events;
}

export function CallLogsListTable({
  callLogs,
  pagination,
  isLoading,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
}: CallLogsListTableProps) {
  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 1));
  const [pageSize, setPageSize] = useQueryParam(
    "page_size",
    withDefault(NumberParam, 10),
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  const openDetail = (log: CallLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => {
    const next =
      typeof updater === "function" ? updater(columnVisibility) : updater;
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(next);
    } else {
      setInternalColumnVisibility(next);
    }
  };

  const columns = useMemo<ColumnDef<CallLog>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center px-2">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Chọn tất cả"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center px-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Chọn hàng"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 48,
      },
      {
        accessorKey: "phone_number",
        header: "Số điện thoại",
        cell: ({ row }) => (
          <div className="flex min-w-40 flex-col gap-1">
            <span className="font-medium tabular-nums">
              {row.original.phone_number || "—"}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{getCallSourceChannel(row.original.source)}</span>
              {row.original.hotline ? (
                <>
                  <span className="text-border">•</span>
                  <span className="tabular-nums">{row.original.hotline}</span>
                </>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "source",
        header: "Nguồn gọi",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = getCallSourceMeta(row.original);
          const Icon = meta.icon;
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", meta.className)}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "tenant_name",
        header: "Doanh nghiệp",
        cell: ({ row }) => {
          const name = row.original.tenant_name?.trim();
          return name ? (
            <span className="text-sm">{name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "username_action_call",
        header: "Người thực hiện",
        cell: ({ row }) => {
          const name = row.original.username_action_call?.trim();
          return name ? (
            <span className="text-sm">{name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "direction",
        header: "Chiều gọi",
        cell: ({ row }) => {
          const meta = getDirectionMeta(row.original.direction);
          const Icon = meta.icon;
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", meta.className)}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant="outline"
              className={cn(
                "font-medium capitalize",
                getStatusClassName(status),
              )}
            >
              {status || "Không rõ"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "duration",
        header: "Thời lượng",
        cell: ({ row }) => {
          const label = formatDuration(row.original.duration);
          if (!label) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className="inline-flex min-w-22 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-sm font-medium tabular-nums text-foreground">
              <TimerReset className="size-3.5 text-muted-foreground" />
              {label}
            </div>
          );
        },
      },
      {
        accessorKey: "started_at",
        header: "Bắt đầu",
        cell: ({ row }) => formatDateTimeCell(row.original.started_at),
      },
      {
        accessorKey: "ended_at",
        header: "Kết thúc",
        cell: ({ row }) => formatDateTimeCell(row.original.ended_at),
      },
      {
        accessorKey: "recording_url",
        header: "Ghi âm",
        enableSorting: false,
        cell: ({ row }) => {
          const url = row.original.recording_url?.trim();
          if (!url) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <audio
              controls
              preload="none"
              className="h-9 w-80 max-w-full"
              src={url}
            >
              Trình duyệt không hỗ trợ phát audio.
            </audio>
          );
        },
      },
      {
        id: "actions",
        header: "Hành động",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const events = getCallEvents(row.original);
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => openDetail(row.original)}
                title="Xem chi tiết"
              >
                <Eye className="size-4" />
                <span className="sr-only">Xem chi tiết</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                  >
                    <EllipsisVertical className="size-4" />
                    <span className="sr-only">Hành động</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <ListTree className="size-3.5" />
                    Danh sách event
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {events.length === 0 ? (
                    <DropdownMenuItem disabled>
                      Chưa có event
                    </DropdownMenuItem>
                  ) : (
                    events.map((event, index) => (
                      <DropdownMenuItem
                        key={`${event.label}-${index}`}
                        className="cursor-default flex-col items-start gap-0.5 py-2"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {event.label}
                        </span>
                        {event.time ? (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {event.time}
                          </span>
                        ) : null}
                        {event.detail ? (
                          <span className="text-xs text-muted-foreground">
                            {event.detail}
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: callLogs,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages ?? -1,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Lịch sử cuộc gọi
          </h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi các cuộc gọi theo số điện thoại, chiều gọi và trạng thái.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<CallLog>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyData
                    icon={IconMoodEmpty}
                    title="Chưa có lịch sử cuộc gọi."
                    description="Hãy thử đổi bộ lọc hoặc tìm theo số điện thoại."
                    showButton={false}
                    buttonText=""
                    onButtonClick={() => null}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CallLogsListPagination
        table={table}
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <CallLogDetail
        callLog={selectedLog}
        open={detailOpen}
        onOpenChange={(next) => {
          setDetailOpen(next);
          if (!next) setSelectedLog(null);
        }}
      />
    </div>
  );
}
