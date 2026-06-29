"use client";

import type { Table } from "@tanstack/react-table";
import { LeadsFormDialog } from "./leads-data-form";

interface LeadsDataToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
  description?: string;
}

export function LeadsDataToolbar<TData>({
  table,
  title = "Khách hàng tiềm năng",
  description = "Danh sách thông tin khách hàng cung cấp qua form và kênh tiếp nhận.",
}: LeadsDataToolbarProps<TData>) {
  void table;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <LeadsFormDialog />
      </div>
    </div>
  );
}
