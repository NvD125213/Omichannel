"use client";

import { Download, PlusCircle, Search, Settings2, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import debounce from "lodash/debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Table } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupFormDialog } from "./group-form-modal";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search?: string | null;
  onSearchChange?: (value: string | null | undefined) => void;
  departmentId?: string;
  // onAdd?: () => void; // Optional: Handler for adding new group
}

const columnLabels: Record<string, string> = {
  name: "Tên nhóm",
  description: "Mô tả",
  is_active: "Trạng thái",
};

function DataTableViewOptions<TData>({ table }: { table: Table<TData> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 cursor-pointer lg:flex"
        >
          <Settings2 className="size-4" />
          Hiển thị
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide(),
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="cursor-pointer"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnLabels[column.id] || column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GroupDataTableToolbar<TData>({
  table,
  search = "",
  onSearchChange,
  departmentId,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [open, setOpen] = useState(false);

  // Local state để nhập liệu không bị lag
  const [localSearch, setLocalSearch] = useState(search ?? "");

  // Đồng bộ local state khi URL params thay đổi
  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        onSearchChange?.(value || undefined);
      }, 500),
    [onSearchChange],
  );

  // Dọn dẹp debounce khi unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nhóm..."
            value={localSearch}
            onChange={(event) => {
              const value = event.target.value;
              setLocalSearch(value);
              debouncedSearch(value);
            }}
            className="h-8 w-[200px] pl-8 lg:w-[280px]"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 cursor-pointer px-3"
          >
            Reset
            <X className="ml-1 size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        <Button variant="outline" size="sm" className="h-8 cursor-pointer">
          <Download className="size-4" />
          Export
        </Button>
        <Button
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <PlusCircle className="mr-2 size-4" />
          Thêm mới
        </Button>
        <GroupFormDialog
          open={open}
          onOpenChange={setOpen}
          departmentId={departmentId}
        />
      </div>
    </div>
  );
}
