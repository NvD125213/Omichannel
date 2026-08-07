"use client";

import { useEffect, useState } from "react";
import { Home, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { IconPhoneCall } from "@tabler/icons-react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";
import type { VisibilityState } from "@tanstack/react-table";

import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  NavigationRailFilter,
  type ColumnOption,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { CallLogsListTable } from "@/features/call-logs/components/call-logs-list-table";
import { useGetCallLogs } from "@/hooks/call-logs/use-call-logs";
import type { CallLog } from "@/services/call-logs/service";

const directionOptions: FilterOption[] = [
  {
    value: "inbound",
    label: "Gọi vào",
    icon: <PhoneIncoming className="size-4" />,
  },
  {
    value: "outbound",
    label: "Gọi ra",
    icon: <PhoneOutgoing className="size-4" />,
  },
];

const columnOptions: ColumnOption[] = [
  { id: "phone_number", label: "Số điện thoại" },
  { id: "source", label: "Nguồn gọi" },
  { id: "tenant_name", label: "Doanh nghiệp" },
  { id: "username_action_call", label: "Người thực hiện" },
  { id: "direction", label: "Chiều gọi" },
  { id: "status", label: "Trạng thái" },
  { id: "duration", label: "Thời lượng" },
  { id: "started_at", label: "Bắt đầu" },
  { id: "ended_at", label: "Kết thúc" },
  { id: "recording_url", label: "Ghi âm" },
];

export default function CallLogsPage() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    direction: StringParam,
    status: StringParam,
  });

  useEffect(() => {
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = useGetCallLogs({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    direction: query.direction || undefined,
    status: query.status || undefined,
  });

  const callLogs: CallLog[] = data?.data?.items ?? [];
  const pagination = data?.data
    ? {
        total: data.data.total,
        page: data.data.page,
        page_size: data.data.page_size,
        total_pages: data.data.total_pages,
      }
    : undefined;

  const handleSearchChange = (value: string) => {
    setQuery({ search: value || undefined, page: 1 });
  };

  const handleDirectionChange = (value: string) => {
    setQuery({ direction: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({
      search: undefined,
      direction: undefined,
      status: undefined,
      page: 1,
    });
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  return (
    <div
      className="flex h-full"
      style={{ backgroundImage: "var(--background-image)" }}
    >
      <NavigationRailFilter
        searchPlaceholder="Tìm theo SĐT hoặc SIP call ID..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        selectLabel="Chiều gọi"
        selectPlaceholder="Tất cả chiều gọi"
        selectOptions={directionOptions}
        selectValue={query.direction || undefined}
        onSelectChange={handleDirectionChange}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        columnOptions={columnOptions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      <div className="flex-1 space-y-8 overflow-auto text-foreground animate-in fade-in duration-500">
        <div className="@container/main space-y-6 px-4 py-4 lg:px-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Lịch sử cuộc gọi",
                href: "/call-logs",
                icon: <IconPhoneCall className="size-4" />,
              },
            ]}
          />

          <CallLogsListTable
            callLogs={callLogs}
            pagination={pagination}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>
      </div>
    </div>
  );
}
