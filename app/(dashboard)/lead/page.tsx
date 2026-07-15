"use client";

import { Bot, Home, ListFilter } from "lucide-react";
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
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { LeadDataTable } from "@/features/chatbot-kg-core/lead/components/lead-data-table";
import {
  useListAgents,
  useListAgentLeads,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";

const STATUS_ALL = "all";

const statusOptions: FilterOption[] = [
  { value: STATUS_ALL, label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "closed", label: "Đã đóng" },
];

const columnOptions: ColumnOption[] = [
  { id: "phone", label: "Số điện thoại" },
  { id: "channel", label: "Kênh" },
  { id: "need", label: "Nhu cầu" },
  { id: "status", label: "Trạng thái" },
  { id: "created_at", label: "Ngày tạo" },
];

export default function LeadPage() {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    agent_id: StringParam,
    status: withDefault(StringParam, STATUS_ALL),
  });

  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 10;
  const statusValue = query.status ?? STATUS_ALL;

  // Danh sách agent để chọn (lead luôn thuộc về một agent cụ thể)
  const { data: agentsData, isLoading: isAgentsLoading } = useListAgents({
    limit: 100,
    offset: 0,
  });

  const agents = useMemo(() => agentsData?.items ?? [], [agentsData?.items]);

  const agentOptions: FilterOption[] = useMemo(
    () =>
      agents.map((agent) => ({
        value: agent.id,
        label: agent.name?.trim() || agent.key || agent.id,
      })),
    [agents],
  );

  const activeAgentId = query.agent_id ?? undefined;

  // Tự chọn agent đầu tiên khi chưa có agent nào được chọn trên URL
  useEffect(() => {
    if (!activeAgentId && agents.length > 0) {
      setQuery({ agent_id: agents[0].id }, "replaceIn");
    }
  }, [activeAgentId, agents, setQuery]);

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
  } = useListAgentLeads(activeAgentId ?? "", listParams);

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

  // Đưa về trang hợp lệ khi vượt quá tổng số trang
  useEffect(() => {
    if (isLeadsFetching || total === 0) return;
    if (page > totalPages) {
      setQuery({ page: totalPages });
    }
  }, [isLeadsFetching, total, page, totalPages, setQuery]);

  const handleStatusChange = (value: string) => {
    setQuery({ status: value || STATUS_ALL, page: 1 });
  };

  const handleAgentChange = (value: string) => {
    setQuery({ agent_id: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({ status: STATUS_ALL, page: 1 });
  };

  const handleRefresh = () => {
    if (activeAgentId) {
      refetchLeads();
    }
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  const hasAgent = Boolean(activeAgentId);
  const isLoading = hasAgent ? isLeadsLoading : isAgentsLoading;

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
        select2Label="Agent"
        select2Placeholder="Chọn agent"
        select2Options={agentOptions}
        select2Value={activeAgentId}
        onSelect2Change={handleAgentChange}
        select2Icon={<Bot className="size-4" />}
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
                href: "/ai/dashboard",
                icon: <Home className="size-4" />,
              },
              {
                label: "Lead",
                href: "/ai/lead",
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
            emptyTitle={hasAgent ? "Chưa có lead" : "Chưa chọn agent"}
            emptyDescription={
              hasAgent
                ? "Chưa có lead nào theo bộ lọc hiện tại. Hãy thử đổi agent hoặc trạng thái."
                : "Vui lòng chọn một agent ở bộ lọc bên trái để xem danh sách lead."
            }
          />
        </div>
      </div>
    </div>
  );
}
