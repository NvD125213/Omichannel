"use client";

import { Plus, Settings2 } from "lucide-react";
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

interface DocumentDataTableToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
  description?: string;
  onAdd?: () => void;
}

const columnLabels: Record<string, string> = {
  filename: "Tài liệu",
  content_type: "Định dạng",
  status: "Trạng thái",
  processing_progress: "Tiến trình",
  source_type: "Nguồn",
  created_at: "Thêm lúc",
  quality_score: "Chất lượng",
};

export function DocumentDataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground/80"
        >
          <Settings2 className="size-4" />
          Cột hiển thị
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Chọn cột
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
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
                className="cursor-pointer rounded-lg"
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

export function DocumentDataTableToolbar<TData>({
  table,
  title = "Tài liệu",
  description,
  onAdd,
}: DocumentDataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
          {title}
        </h2>
        {description && (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 cursor-pointer rounded-lg px-3"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Thêm
        </Button>
        <DocumentDataTableViewOptions table={table} />
      </div>
    </div>
  );
}
