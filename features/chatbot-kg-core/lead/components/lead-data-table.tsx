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
  EllipsisVertical,
  Loader2,
} from "lucide-react";
import { IconMoodEmpty } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";

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
import type {
  KgLead,
  LeadStatus,
} from "@/services/chatbot-kg-core/interfaces";
import { LeadDataTablePagination } from "./lead-data-table-pagination";

const LEAD_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  new: {
    label: "Mới",
    className:
      "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
  },
  contacted: {
    label: "Đã liên hệ",
    className:
      "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
  },
  closed: {
    label: "Đã đóng",
    className:
      "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
  },
};

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "closed", label: "Đã đóng" },
];

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">Không có dữ liệu</span>;
  }
  return String(value);
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
  onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
  updatingLeadId?: string | null;
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
  onUpdateStatus,
  updatingLeadId,
  title = "Danh sách Lead",
  description = "Theo dõi và quản lý danh sách khách hàng tiềm năng của agent",
  emptyTitle = "Chưa có lead",
  emptyDescription = "Chưa có lead nào theo bộ lọc hiện tại. Hãy thử đổi agent hoặc trạng thái.",
}: LeadDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});

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
          <span className="font-medium">{renderValue(row.original.name)}</span>
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
      accessorKey: "channel",
      header: "Kênh",
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {renderValue(row.original.channel)}
        </span>
      ),
    },
    {
      accessorKey: "need",
      header: "Nhu cầu",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {renderValue(row.original.need)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status;
        const meta = LEAD_STATUS_META[status];
        return (
          <Badge
            variant="secondary"
            className={cn(meta?.className, "capitalize")}
          >
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
        const { date, time } = convertDateTime(createdAt, "short");
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
        const isUpdating = updatingLeadId === lead.id;
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <EllipsisVertical className="size-4" />
                  )}
                  <span className="sr-only">Hành động</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cập nhật trạng thái</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEAD_STATUS_OPTIONS.map((option) => {
                  const isCurrent = lead.status === option.value;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      className="cursor-pointer"
                      disabled={isCurrent}
                      onClick={() => onUpdateStatus?.(lead.id, option.value)}
                    >
                      {isCurrent ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <span className="size-4" />
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

  /* eslint-disable-next-line */
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
