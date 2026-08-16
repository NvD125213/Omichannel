"use client";

import { Home, ListFilter } from "lucide-react";
import { IconUser } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  NavigationRailFilter,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import { LeadDataTable } from "@/features/chatbot-kg-core/lead/components/lead-data-table";
import { useListAgentLeads } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { useMe } from "@/hooks/user/use-me";

const STATUS_ALL = "all";

const statusOptions = [
  { value: STATUS_ALL, label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "closed", label: "Đã đóng" },
];

const columnOptions: ColumnOption[] = [
  { id: "phone", label: "Số điện thoại" },
  { id: "channel", label: "Kênh" },
  { id: "need", label: "Nhu cầu" },
  { id: "stage", label: "Stage" },
  { id: "status", label: "Trạng thái" },
  { id: "created_at", label: "Ngày tạo" },
];

export default function LeadPage() {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  const { data: currentUser, isLoading: isMeLoading } = useMe();
  const myAgentId = currentUser?.agent_id?.trim() || undefined;

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    status: withDefault(StringParam, STATUS_ALL),
  });

  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 10;
  const statusValue = query.status ?? STATUS_ALL;

  const listParams = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      status: statusValue !== STATUS_ALL ? statusValue : undefined,
    }),
    [page, pageSize, statusValue],
  );

  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    isFetching: isLeadsFetching,
    refetch: refetchLeads,
  } = useListAgentLeads(myAgentId ?? "", listParams);

  const leads = leadsData?.items ?? [];
  const total = leadsData?.total ?? 0;
  const totalPages = Math.max(1, total > 0 ? Math.ceil(total / pageSize) : 1);

  const pagination = useMemo(
    () => ({
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    }),
    [total, page, pageSize, totalPages],
  );

  useEffect(() => {
    if (isLeadsFetching || total === 0) return;
    if (page > totalPages) {
      setQuery({ page: totalPages });
    }
  }, [isLeadsFetching, total, page, totalPages, setQuery]);

  const handleStatusChange = (value: string) => {
    setQuery({ status: value || STATUS_ALL, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({ status: STATUS_ALL, page: 1 });
  };

  const handleRefresh = () => {
    if (myAgentId) {
      refetchLeads();
    }
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  const hasAgent = Boolean(myAgentId);
  const isLoading = isMeLoading || (hasAgent && isLeadsLoading);

  return (
    <div className="flex h-full bg-transparent">
      <NavigationRailFilter
        showSearch={false}
        onRefresh={handleRefresh}
        isRefreshing={hasAgent && isLeadsFetching}
        selectLabel="Trạng thái"
        selectPlaceholder="Tất cả"
        selectOptions={statusOptions}
        selectValue={statusValue !== STATUS_ALL ? statusValue : undefined}
        onSelectChange={handleStatusChange}
        selectIcon={<ListFilter className="size-4" />}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        columnOptions={columnOptions}
        className="ml-4"
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      <div className="flex-1 space-y-8 overflow-auto text-foreground animate-in fade-in duration-500">
        <div className="@container/main space-y-6 px-4 py-4 lg:px-6">
          <AppBreadcrumb
            items={[
              {
                label: "Trang chủ",
                href: "/dashboard",
                icon: <Home className="size-4" />,
              },
              {
                label: "Lead",
                href: "/lead",
                icon: <IconUser className="size-4" />,
              },
            ]}
          />

          <LeadDataTable
            leads={leads}
            pagination={pagination}
            isLoading={isLoading}
            currentPage={page}
            currentPageSize={pageSize}
            onPageChange={(newPage) => setQuery({ page: newPage })}
            onPageSizeChange={(newPageSize) =>
              setQuery({ page: 1, page_size: newPageSize })
            }
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            emptyTitle={hasAgent ? "Chưa có lead" : "Tài khoản chưa gắn agent"}
            emptyDescription={
              hasAgent
                ? "Chưa có lead nào theo bộ lọc hiện tại. Hãy thử đổi trạng thái."
                : "Tài khoản hiện tại chưa có agent_id. Liên hệ quản trị viên để gắn agent."
            }
          />
        </div>
      </div>
    </div>
  );
}
