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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  EllipsisVertical,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Circle,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  PauseCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import type { Ticket } from "../utils/ticket-schema";
import { DataTablePagination } from "./ticket-list-data-pagination";
import { DataTableToolbar } from "./ticket-list-data-toolbar";
import { cn } from "@/lib/utils";
import {
  useQueryParam,
  NumberParam,
  StringParam,
  ArrayParam,
  withDefault,
} from "use-query-params";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";
import { convertDateTime } from "@/utils/convert-time";
import Link from "next/link";

interface DataTableProps {
  tickets: Ticket[];
  onDeleteTicket: (id: string) => void;
  onEditTicket: (ticket: Ticket) => void;
  totalPages: number;
  totalRecords: number;
  isLoading?: boolean;
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
    case "thấp":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100/80";
    case "medium":
    case "trung bình":
      return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100/80";
    case "high":
    case "cao":
      return "bg-orange-100 text-orange-700 hover:bg-orange-100/80";
    case "urgent":
    case "khẩn cấp":
      return "bg-red-100 text-red-700 hover:bg-red-100/80";
    case "critical":
    case "nghiêm trọng":
      return "bg-red-600 text-white hover:bg-red-600/80";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-100/80";
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":
    case "mở":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100/80";
    case "pending":
    case "đang chờ":
      return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80";
    case "in_progress":
    case "đang xử lý":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100/80";
    case "resolved":
    case "đã giải quyết":
      return "bg-green-100 text-green-700 hover:bg-green-100/80";
    case "closed":
    case "đóng":
      return "bg-gray-100 text-gray-700 hover:bg-gray-100/80";
    case "cancelled":
    case "đã hủy":
      return "bg-red-50 text-red-700 hover:bg-red-50/80";
    case "on_hold":
    case "tạm hoãn":
      return "bg-orange-50 text-orange-700 hover:bg-orange-50/80";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-100/80";
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "Mở";
    case "pending":
      return "Đang chờ";
    case "in_progress":
      return "Đang xử lý";
    case "resolved":
      return "Đã giải quyết";
    case "closed":
      return "Đóng";
    case "cancelled":
      return "Đã hủy";
    case "on_hold":
      return "Tạm hoãn";
    default:
      return status;
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
      return "Thấp";
    case "medium":
      return "Trung bình";
    case "high":
      return "Cao";
    case "urgent":
      return "Khẩn cấp";
    case "critical":
      return "Nghiêm trọng";
    default:
      return priority;
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":
    case "mở":
      return Circle;
    case "pending":
    case "đang chờ":
      return Clock;
    case "in_progress":
    case "đang xử lý":
      return Loader2;
    case "resolved":
    case "đã giải quyết":
      return CheckCircle2;
    case "closed":
    case "đóng":
      return XCircle;
    case "cancelled":
    case "đã hủy":
      return Ban;
    case "on_hold":
    case "tạm hoãn":
      return PauseCircle;
    default:
      return HelpCircle;
  }
};

const getPriorityDotColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
    case "thấp":
      return "bg-blue-500";
    case "medium":
    case "trung bình":
      return "bg-cyan-500";
    case "high":
    case "cao":
      return "bg-orange-500";
    case "urgent":
    case "khẩn cấp":
      return "bg-red-500";
    case "critical":
    case "nghiêm trọng":
      return "bg-red-600";
    default:
      return "bg-gray-500";
  }
};

export function DataTable({
  tickets,
  onDeleteTicket,
  onEditTicket,
  totalPages,
  totalRecords,
  isLoading,
}: DataTableProps) {
  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 1));
  const [pageSize, setPageSize] = useQueryParam(
    "page_size",
    withDefault(NumberParam, 10),
  );
  const [search, setSearch] = useQueryParam("search", StringParam);
  const [sortBy, setSortBy] = useQueryParam("sort_by", StringParam);
  const [sortOrder, setSortOrder] = useQueryParam("sort_order", StringParam);

  const [statusParam, setStatusParam] = useQueryParam("status", StringParam);
  const [priorityParam, setPriorityParam] = useQueryParam(
    "priority",
    StringParam,
  );
  const [tagIdsParam, setTagIdsParam] = useQueryParam("tag_ids", ArrayParam);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (statusParam) filters.push({ id: "status", value: [statusParam] });
    if (priorityParam) {
      filters.push({ id: "priority", value: [priorityParam] });
    }
    if (tagIdsParam && tagIdsParam.length > 0) {
      filters.push({ id: "tag_ids", value: tagIdsParam });
    }
    return filters;
  }, [statusParam, priorityParam, tagIdsParam]);

  const handleColumnFiltersChange = (updater: any) => {
    const newFilters =
      typeof updater === "function" ? updater(columnFilters) : updater;

    const statusFilter = newFilters.find((f: any) => f.id === "status");
    const priorityFilter = newFilters.find((f: any) => f.id === "priority");
    const tagsFilter = newFilters.find((f: any) => f.id === "tag_ids");

    const newStatus = statusFilter?.value?.[0] ?? undefined;
    const newPriority = priorityFilter?.value?.[0] ?? undefined;
    const newTags = tagsFilter?.value ?? undefined;

    if (newStatus !== statusParam) setStatusParam(newStatus);
    if (newPriority !== priorityParam) setPriorityParam(newPriority);
    // use-query-params handles array comparison mostly fine, or allows unnecessary updates which is OK
    setTagIdsParam(newTags);
  };

  useEffect(() => {
    if (sortBy && sortOrder) {
      setSorting([{ id: sortBy, desc: sortOrder === "desc" }]);
    } else {
      setSorting([]);
    }
  }, [sortBy, sortOrder]);

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);

    if (newSorting.length > 0) {
      const sort = newSorting[0];
      setSortBy(sort.id);
      setSortOrder(sort.desc ? "desc" : "asc");
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
  };

  const columns: ColumnDef<Ticket>[] = [
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
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã Ticket
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">#{row.original.code}</span>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tiêu đề
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span
            className="font-medium truncate max-w-[250px]"
            title={row.original.title}
          >
            {row.original.title}
          </span>
          {row.original.description && (
            <span
              className="text-xs text-muted-foreground truncate max-w-[250px]"
              title={row.original.description}
            >
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Độ ưu tiên
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const priority = row.original.priority;
        const dotColor = getPriorityDotColor(priority);

        return (
          <Badge
            variant="secondary"
            className={cn(
              "uppercase text-[10px] pl-1.5",
              getPriorityBadgeColor(priority),
            )}
          >
            <div className="relative flex h-2 w-2 mr-1.5">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  dotColor,
                )}
              ></span>
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  dotColor,
                )}
              ></span>
            </div>
            {getPriorityLabel(priority)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Trạng thái
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.original.status;
        const Icon = getStatusIcon(status);

        return (
          <Badge
            variant="secondary"
            className={cn(
              "uppercase text-[10px] pl-1.5 gap-1",
              getStatusBadgeColor(status),
            )}
          >
            <Icon className="h-3 w-3" />
            {getStatusLabel(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "created_by_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Người tạo
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {row.original.created_by_name || "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_to_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Người xử lý
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {row.original.assigned_to_name || "Chưa có"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
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
        );
      },
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        if (!createdAt) return <span className="text-muted-foreground">-</span>;

        const [dateText, timeText] = convertDateTime(createdAt);
        return (
          <div className="flex flex-col text-sm">
            <span>{dateText}</span>
            <span className="text-muted-foreground text-xs">{timeText}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: "",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Hành động</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => onEditTicket(ticket)}
                >
                  <Pencil className="mr-2 size-4" />
                  Sửa
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  className="flex items-center cursor-pointer"
                  href={`/tickets/ticket-list/${ticket.id}`}
                >
                  <Eye className="mr-2 size-4" />
                  Xem chi tiết
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => onDeleteTicket(ticket.code)}
              >
                <Trash2 className="mr-2 size-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  /* eslint-disable-next-line */
  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const pagination = {
    total: totalRecords,
    page: page,
    page_size: pageSize,
    total_pages: totalPages,
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        search={search}
        onSearchChange={(value) => setSearch(value ?? undefined)}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column, cellIndex) => (
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
                    title="Không có vé nào."
                    description="Hiện tại chưa có vé nào được tạo. Vui lòng tạo vé mới ở trên."
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
      <DataTablePagination
        table={table}
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
