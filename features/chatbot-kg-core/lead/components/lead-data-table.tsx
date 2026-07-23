"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  CircleDot,
  EllipsisVertical,
  Globe2,
  Handshake,
  Link2Off,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { IconMoodEmpty } from "@tabler/icons-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { usePatchLead } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyData } from "@/components/empty-data";
import { cn } from "@/lib/utils";
import { convertDateTime } from "@/utils/convert-time";
import type { KgLead, LeadStatus } from "@/services/chatbot-kg-core/interfaces";
import { LeadDataTablePagination } from "./lead-data-table-pagination";

const LEAD_STATUS_META: Record<
  string,
  { label: string; className: string; icon: LucideIcon }
> = {
  new: {
    label: "Mới",
    icon: Sparkles,
    className:
      "border-blue-200 bg-blue-100 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
  contacted: {
    label: "Đã liên hệ",
    icon: Handshake,
    className:
      "border-amber-200 bg-amber-100 text-amber-800 shadow-sm shadow-amber-500/10 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  closed: {
    label: "Đã đóng",
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-500/10 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
};

const LEAD_CHANNEL_META: Record<
  string,
  { label: string; className: string; icon: LucideIcon }
> = {
  web: {
    label: "Web",
    icon: Globe2,
    className:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  },
  webchat: {
    label: "Webchat",
    icon: MessageCircle,
    className:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  },
  preview: {
    label: "Preview",
    icon: CircleDot,
    className:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
  },
  facebook: {
    label: "Facebook",
    icon: MessageCircle,
    className:
      "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  messenger: {
    label: "Messenger",
    icon: MessageCircle,
    className:
      "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  zaloapp: {
    label: "WhatsApp",
    icon: Phone,
    className:
      "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300",
  },
  zalo: {
    label: "Zalo",
    icon: MessageCircle,
    className:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    className:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  },
  email: {
    label: "Email",
    icon: Send,
    className:
      "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  },
};

const LEAD_ACTION_OPTIONS: {
  value: LeadStatus;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "contacted", label: "Kết nối", icon: Handshake },
  { value: "closed", label: "Đóng kết nối", icon: Link2Off },
];

function getChannelMeta(channel: string | null | undefined) {
  if (!channel) return null;
  const key = channel.trim().toLowerCase();
  return (
    LEAD_CHANNEL_META[key] ?? {
      label: channel,
      icon: Globe2,
      className: "border-border bg-muted text-foreground dark:bg-muted/60",
    }
  );
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-muted-foreground text-xs italic">
        Không có dữ liệu
      </span>
    );
  }
  return String(value);
}

function LeadNeedCell({ need }: { need: string | null | undefined }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  const hasNeed = need !== null && need !== undefined && need !== "";

  useEffect(() => {
    const el = textRef.current;
    if (!el || !hasNeed) {
      setIsTruncated(false);
      return;
    }

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [need, hasNeed]);

  if (!hasNeed) {
    return renderValue(need);
  }

  return (
    <>
      <div className="max-w-xs">
        <div className="flex items-end gap-1">
          <p
            ref={textRef}
            className="min-w-0 flex-1 whitespace-normal break-words text-xs italic text-muted-foreground line-clamp-3"
          >
            {need}
          </p>

          {isTruncated && (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              onClick={() => setOpen(true)}
            >
              xem thêm
            </button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhu cầu</DialogTitle>
            <DialogDescription className="sr-only">
              Nội dung nhu cầu đầy đủ của lead
            </DialogDescription>
          </DialogHeader>
          <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground">
            {need}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface LeadDataTableProps {
  leads: KgLead[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  isLoading?: boolean;
  currentPage: number;
  currentPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function LeadDataTable({
  leads,
  pagination,
  isLoading,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  title = "Danh sách Lead",
  description = "Theo dõi và quản lý danh sách khách hàng tiềm năng của agent",
  emptyTitle = "Chưa có lead",
  emptyDescription = "Chưa có lead nào theo bộ lọc hiện tại. Hãy thử đổi agent hoặc trạng thái.",
}: LeadDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const { mutateAsync: patchLead } = usePatchLead();

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await patchLead({ leadId, data: { status } });
      toast.success(
        status === "contacted"
          ? "Đã kết nối lead thành công"
          : "Đã đóng kết nối lead thành công",
      );
    } catch {
      // Error toast đã được xử lý trong usePatchLead
    }
  };

  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => {
    const newVisibility =
      typeof updater === "function" ? updater(columnVisibility) : updater;
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility);
    } else {
      setInternalColumnVisibility(newVisibility);
    }
  };

  const columns: ColumnDef<KgLead>[] = [
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
            aria-label="Chọn dòng"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Thông tin liên hệ
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{renderValue(row.original.name)}</span>
          <span className="text-sm text-muted-foreground">
            {renderValue(row.original.email)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => (
        <span className="text-sm">{renderValue(row.original.phone)}</span>
      ),
    },
    {
      accessorKey: "stage",
      header: "Giai đoạn",
      cell: ({ row }) => {
        const stage = row.original.stage;
        if (!stage) {
          return renderValue(stage);
        }
        return (
          <span className="font-semibold capitalize text-xs">{stage}</span>
        );
      },
    },

    {
      accessorKey: "need",
      header: "Nhu cầu",
      cell: ({ row }) => <LeadNeedCell need={row.original.need} />,
    },

    {
      accessorKey: "channel",
      header: "Kênh",
      cell: ({ row }) => {
        const channel = row.original.channel;
        const meta = getChannelMeta(channel);
        if (!meta) {
          return renderValue(channel);
        }
        const Icon = meta.icon;
        return (
          <Badge
            variant="outline"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
              meta.className,
            )}
          >
            <Icon className="size-3.5 shrink-0" />
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
        const meta = LEAD_STATUS_META[status];
        const Icon = meta?.icon ?? CircleDot;
        return (
          <Badge
            variant="outline"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
              meta?.className ?? "border-border bg-muted text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {meta?.label ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ngày tạo
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        if (!createdAt) {
          return renderValue(createdAt);
        }
        const { date, time } = convertDateTime(createdAt, "text");
        return (
          <div className="flex flex-col text-sm">
            <span>{date}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: "Hành động",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2">
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
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cập nhật trạng thái</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEAD_ACTION_OPTIONS.map((option) => {
                  const isCurrent = lead.status === option.value;
                  const ActionIcon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      className="cursor-pointer"
                      disabled={isCurrent}
                      onClick={() =>
                        void handleUpdateStatus(lead.id, option.value)
                      }
                    >
                      {isCurrent ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <ActionIcon className="size-4" />
                      )}
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {pagination ? (
              <Badge variant="secondary" className="rounded-full font-normal">
                {pagination.total}
              </Badge>
            ) : null}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border">
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
                  {columns.map((_column, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                    title={emptyTitle}
                    description={emptyDescription}
                    showButton={false}
                    buttonText=""
                    onButtonClick={() => {}}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <LeadDataTablePagination
        table={table}
        pagination={pagination}
        currentPage={currentPage}
        currentPageSize={currentPageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
