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
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
  EllipsisVertical,
  Home,
  Pencil,
  Trash2,
  UserStar,
  Users,
} from "lucide-react";
import { IconMoodEmpty, IconUsersGroup } from "@tabler/icons-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyData } from "@/components/empty-data";
import {
  NavigationRailFilter,
  type ColumnOption,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteCustomerProvidedInfo,
  useGetCustomerProvidedInfos,
} from "@/hooks/customer/leads/use-leads-customer";
import type {
  CustomerProvidedInfo,
  CustomerProvidedInfoSortBy,
} from "@/services/customer/leads/service";
import { convertDateTime } from "@/utils/convert-time";
import { LeadsDataPagination } from "./leads-pagination";
import { LeadsDataToolbar } from "./leads-data-toolbar";
import { LeadsFormDialog } from "./leads-data-form";

const sortOptions: FilterOption[] = [
  {
    value: "name_asc",
    label: "Tên A-Z",
    icon: <ArrowUpAZ className="size-4" />,
  },
  {
    value: "name_desc",
    label: "Tên Z-A",
    icon: <ArrowDownAZ className="size-4" />,
  },
  {
    value: "created_at_desc",
    label: "Mới nhất",
    icon: <Clock className="size-4" />,
  },
  {
    value: "created_at_asc",
    label: "Cũ nhất",
    icon: <Clock className="size-4" />,
  },
];

const columnOptions: ColumnOption[] = [
  { id: "name", label: "Thông tin liên hệ" },
  { id: "phone", label: "Số điện thoại" },
  { id: "description", label: "Mô tả" },
  { id: "created_at", label: "Ngày tạo" },
];

function parseLeadsSort(sortValue?: string | null) {
  if (!sortValue) {
    return {
      sort_by: undefined,
      sort_order: undefined as "asc" | "desc" | undefined,
    };
  }

  const lastUnderscore = sortValue.lastIndexOf("_");
  if (lastUnderscore <= 0) {
    return {
      sort_by: undefined,
      sort_order: undefined as "asc" | "desc" | undefined,
    };
  }

  const field = sortValue.slice(
    0,
    lastUnderscore,
  ) as CustomerProvidedInfoSortBy;
  const order = sortValue.slice(lastUnderscore + 1);

  if (order !== "asc" && order !== "desc") {
    return {
      sort_by: undefined,
      sort_order: undefined as "asc" | "desc" | undefined,
    };
  }

  return { sort_by: field, sort_order: order as "asc" | "desc" };
}

interface LeadsDataTableProps {
  leads: CustomerProvidedInfo[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onEditLead: (lead: CustomerProvidedInfo) => void;
  onDeleteLead: (id: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number | null | undefined) => void;
  onPageSizeChange: (pageSize: number | null | undefined) => void;
}

function LeadsDataTable({
  leads,
  pagination,
  isLoading,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  onEditLead,
  onDeleteLead,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: LeadsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => {
    const newVisibility =
      typeof updater === "function" ? updater(columnVisibility) : updater;
    onColumnVisibilityChange?.(newVisibility);
    if (!onColumnVisibilityChange) {
      setInternalColumnVisibility(newVisibility);
    }
  };

  const renderValue = (value: unknown): ReactNode => {
    if (value === null || value === undefined || value === "") {
      return (
        <span className="text-muted-foreground text-xs italic">
          Không có dữ liệu
        </span>
      );
    }

    return String(value);
  };

  const columns: ColumnDef<CustomerProvidedInfo>[] = [
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
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm">
          {renderValue(row.original.description)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        if (!createdAt) {
          return renderValue(createdAt);
        }
        const { date, time } = convertDateTime(createdAt);
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
      header: "Hành động",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onEditLead(lead)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Sửa</span>
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onDeleteLead(lead.id)}
                >
                  <Trash2 className="size-4" />
                  Xóa
                </DropdownMenuItem>
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <LeadsDataToolbar table={table} />
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
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<CustomerProvidedInfo>) => (
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
                    title="Chưa có khách hàng tiềm năng."
                    description="Thêm mới hoặc thử đổi từ khóa tìm kiếm."
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
      <LeadsDataPagination
        table={table}
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

export function LeadsCustomerFeature() {
  const [editingLead, setEditingLead] = useState<CustomerProvidedInfo | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<CustomerProvidedInfo | null>(
    null,
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    sort_by: StringParam,
  });

  const parsedSort = useMemo(
    () => parseLeadsSort(query.sort_by),
    [query.sort_by],
  );

  const { data, isLoading } = useGetCustomerProvidedInfos({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: parsedSort.sort_by,
    sort_order: parsedSort.sort_order,
  });

  const leads = data?.data.items ?? [];
  const { mutateAsync: deleteLead } = useDeleteCustomerProvidedInfo();

  const handleDeleteLead = (id: string) => {
    const lead = leads.find((item) => item.id === id);
    if (lead) {
      setDeletingLead(lead);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLead?.id) return;
    await deleteLead(deletingLead.id);
    setDeleteDialogOpen(false);
    setDeletingLead(null);
  };

  const handleEditLead = (lead: CustomerProvidedInfo) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingLead(null), 150);
    }
  };

  return (
    <div
      className="flex h-full"
      style={{ backgroundImage: "var(--background-image)" }}
    >
      <NavigationRailFilter
        searchPlaceholder="Tìm theo tên, email, SĐT, mô tả..."
        onSearchChange={(value) =>
          setQuery({ search: value || undefined, page: 1 })
        }
        searchDebounceMs={500}
        selectLabel="Sắp xếp"
        selectOptions={sortOptions}
        selectValue={query.sort_by || undefined}
        onSelectChange={(value) =>
          setQuery({ sort_by: value || undefined, page: 1 })
        }
        onClearAll={() =>
          setQuery({ search: undefined, sort_by: undefined, page: 1 })
        }
        onApplyFilters={() => {}}
        columnOptions={columnOptions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={(columnId, visible) => {
          setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: visible,
          }));
        }}
      />

      <div className="flex-1 space-y-8 overflow-auto text-foreground animate-in fade-in duration-500">
        <div className="@container/main space-y-6 px-4 py-4 lg:px-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý khách hàng",
                href: "/customers",
                icon: <Users className="size-4" />,
              },
              {
                label: "Khách hàng tiềm năng",
                href: "/customers/leads",
                icon: <UserStar className="size-4" />,
              },
            ]}
          />

          <LeadsDataTable
            leads={leads}
            pagination={data?.data.pagination}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            page={query.page ?? 1}
            pageSize={query.page_size ?? 10}
            onPageChange={(value) => setQuery({ page: value ?? 1 })}
            onPageSizeChange={(value) =>
              setQuery({ page_size: value ?? 10, page: 1 })
            }
          />
        </div>

        <LeadsFormDialog
          lead={editingLead}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa khách hàng tiềm năng"
          description={
            <span>
              Bạn có chắc chắn muốn xóa{" "}
              <span className="font-semibold">{deletingLead?.name}</span>?
            </span>
          }
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          confirmVariant="destructive"
        />
      </div>
    </div>
  );
}
