"use client";

import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";
import { TagFormDialog } from "./ticket-tag-form-data";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search?: string | null;
  title?: string;
  onSearchChange?: (value: string | null | undefined) => void;
  tagType?: "ticket" | "customer";
}

export function DataTableToolbar<TData>({
  table,
  title = "Quản lý Tag",
  tagType = "ticket",
}: DataTableToolbarProps<TData>) {
  // Hiện tại chưa dùng column filter cho Tag, nhưng giữ lại để sau mở rộng giống Roles
  // const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TagFormDialog tagType={tagType} />
      </div>
    </div>
  );
}

