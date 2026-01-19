"use client";

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Expand, Pencil, Trash2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Group } from "../utils/schema";
import { DataTablePagination } from "./group-data-table-pagination";
import { GroupDataTableToolbar } from "./group-data-table-toobar";
import { EmptyData } from "@/components/empty-data";
import {
  useQueryParam,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { IconMoodEmpty } from "@tabler/icons-react";
import { GroupUserDetail } from "./group-user-detail";

interface DataTableProps {
  groups: Group[];
  onDeleteGroup: (id: string) => void;
  onEditGroup: (group: Group) => void;
  totalPages: number;
  totalRecords: number;
  isLoading?: boolean;
  departmentId?: string;
}

export function GroupDataTable({
  groups,
  onDeleteGroup,
  onEditGroup,
  totalPages,
  totalRecords,
  isLoading,
  departmentId,
}: DataTableProps) {
  // Danh sách các query params của api
  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 1));
  const [pageSize, setPageSize] = useQueryParam(
    "page_size",
    withDefault(NumberParam, 10),
  );
  const [search, setSearch] = useQueryParam("search", StringParam);
  const [sortBy, setSortBy] = useQueryParam("sort_by", StringParam);
  const [sortOrder, setSortOrder] = useQueryParam("sort_order", StringParam);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Sorting theo group
  useEffect(() => {
    if (sortBy && sortOrder) {
      setSorting([{ id: sortBy, desc: sortOrder === "desc" }]);
    } else {
      setSorting([]);
    }
  }, [sortBy, sortOrder]);

  // Update URL params when sorting changes
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

  const getStatusColor = (isActive: number) => {
    return isActive === 1
      ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
  };

  // Define minimal columns even if valid rendering is custom, for state management of sorting/filtering if needed
  const columns: any[] = [
    { accessorKey: "name" },
    { accessorKey: "is_active" },
  ];

  const table = useReactTable({
    data: groups,
    columns, // Minimal columns for internal logic
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // Tạo pagination object từ props
  const pagination = {
    total: totalRecords,
    page: page,
    page_size: pageSize,
    total_pages: totalPages,
  };

  return (
    <div className="space-y-4">
      <GroupDataTableToolbar
        table={table}
        search={search}
        onSearchChange={(value) => setSearch(value ?? undefined)}
        departmentId={departmentId}
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[200px]" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <Card key={group.id} className="p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">
                      {group.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 gap-1 font-medium text-[10px] text-muted-foreground border-muted-foreground/20"
                    >
                      <Users className="size-3" />
                      {group.member_count || 0}
                    </Badge>
                  </div>
                  {group.description && (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {group.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(group.is_active || 0)}
                  >
                    {group.is_active === 1 ? "Hoạt động" : "Không hoạt động"}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onEditGroup) onEditGroup(group);
                      }}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Sửa</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedGroup(group);
                        setUserDetailOpen(true);
                      }}
                    >
                      <Expand className="size-4" />
                      <span className="sr-only">Mở rộng</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => onDeleteGroup(group.id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="min-h-[200px] flex items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <EmptyData
              icon={IconMoodEmpty}
              title="Dữ liệu nhóm trống."
              description="Hãy thử thêm mới thông tin nhóm hoặc thay đổi thông tin tìm kiếm"
              buttonText=""
              showButton={false}
              onButtonClick={() => {}}
            />
          </div>
        )}
      </div>

      <DataTablePagination
        table={table}
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <GroupUserDetail
        group={selectedGroup}
        open={userDetailOpen}
        onOpenChange={setUserDetailOpen}
      />
    </div>
  );
}
