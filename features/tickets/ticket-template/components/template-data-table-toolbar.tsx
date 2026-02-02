"use client";

import { Download, Plus, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Table } from "@tanstack/react-table";
import { TemplateFormDialog } from "./template-form-modal";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
  description?: string;
}

const columnLabels: Record<string, string> = {
  name: "Tên",
  description: "Mô tả",
  flow_name: "Luồng xử lý",
  sla_name: "SLA",
  is_active: "Trạng thái",
  created_at: "Ngày tạo",
};

function DataTableViewOptions<TData>({ table }: { table: Table<TData> }) {
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 cursor-pointer">
          <Settings2 className="size-4" />
          Hiển thị
          {columns.filter((column) => !column.getIsVisible()).length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-full px-1.5 py-0 text-[10px]"
            >
              {columns.filter((column) => !column.getIsVisible()).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Chọn cột hiển thị
          </p>
          <Separator className="my-2" />
          {columns.map((column) => {
            const isVisible = column.getIsVisible();
            const label =
              columnLabels[column.id] ||
              (typeof column.columnDef.header === "string"
                ? column.columnDef.header
                : column.id);

            return (
              <div
                key={column.id}
                className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent cursor-pointer"
                onClick={() => column.toggleVisibility(!isVisible)}
              >
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                />
                <span className="text-sm">{label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DataTableToolbar<TData>({
  table,
  title = "Quản lý Template",
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
        <TemplateFormDialog />
      </div>
    </div>
  );
}
