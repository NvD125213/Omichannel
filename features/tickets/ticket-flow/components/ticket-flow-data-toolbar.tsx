"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { Table } from "@tanstack/react-table";
import { TicketFlowFormDialog } from "./ticket-flow-form";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
  description?: string;
}

export function TicketFlowDataTableToolbar<TData>({
  table,
  title = "Danh sách luồng xử lý",
  description,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Add form dialog */}
          <TicketFlowFormDialog />
        </div>
      </div>

      {/* Filters Section */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 cursor-pointer px-3"
          >
            Reset
            <X className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
