"use client";

import { Download, Settings2 } from "lucide-react";
import { TicketCreateSheet } from "./ticket-sheet-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Table } from "@tanstack/react-table";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
}

const columnLabels: Record<string, string> = {
  code: "Mã Ticket",
  title: "Tiêu đề",
  priority: "Độ ưu tiên",
  status: "Trạng thái",
  created_at: "Ngày tạo",
  created_by_name: "Người tạo",
  assigned_to_name: "Người xử lý",
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

export function DataTableToolbar<TData>({
  table,
  title = "Quản lý Ticket",
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-1 items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <DataTableViewOptions table={table} />
        <Button variant="outline" size="sm" className="h-8 cursor-pointer">
          <Download className="size-4" />
          Export
        </Button>
        <TicketCreateSheet />
      </div>
    </div>
  );
}
