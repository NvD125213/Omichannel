"use client";

import { PlusCircle, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  title?: string;
}

const columnLabels: Record<string, string> = {
  name: "Tên nhóm",
  description: "Mô tả",
  is_active: "Trạng thái",
};

export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 cursor-pointer">
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
  departmentId,
  title = "Danh sách nhóm",
}: DataTableToolbarProps<TData>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
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
