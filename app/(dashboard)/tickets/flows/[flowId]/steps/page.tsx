"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, Workflow, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import TicketFlowStepDataList from "@/features/tickets/ticket-flow-step/components/ticket-flow-step-data-list";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import {
  NavigationRailFilter,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { useQueryParams, StringParam, withDefault } from "use-query-params";

// Sort options
const sortOptions: FilterOption[] = [
  {
    value: "name_asc",
    label: "Tên A-Z",
    icon: <ArrowUpAZ className="size-4" />,
  },
  {
    value: "name_desc",
    label: "Tên Z-A",
    icon: <ArrowDownAZ className="size-4" />,
  },
  {
    value: "created_at_desc",
    label: "Mới nhất",
    icon: <Clock className="size-4" />,
  },
  {
    value: "created_at_asc",
    label: "Cũ nhất",
    icon: <Clock className="size-4" />,
  },
];

function TicketFlowStepsPageContent() {
  const params = useParams();
  const flowId = params.flowId as string;

  // Sync query params with URL
  const [query, setQuery] = useQueryParams({
    search: StringParam,
    sort_by: StringParam,
  });

  // Fetch flow info to display in breadcrumb
  const { data: flowsData, isLoading } = useGetTicketFlows({
    page: 1,
    page_size: 100,
  });

  const currentFlow = flowsData?.data.data.flows.find((f) => f.id === flowId);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setQuery({ search: value || undefined });
  };

  const handleSortChange = (value: string) => {
    setQuery({ sort_by: value || undefined });
  };

  const handleClearFilters = () => {
    setQuery({ search: undefined, sort_by: undefined });
  };

  return (
    <div className="flex h-full bg-background animate-in fade-in duration-500">
      {/* Navigation Rail Filter */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm bước..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        selectLabel="Sắp xếp"
        selectOptions={sortOptions}
        selectValue={query.sort_by || undefined}
        onSelectChange={handleSortChange}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          {/* Breadcrumb */}
          <div className="space-y-2 flex gap-4 items-center justify-between">
            {isLoading ? (
              <Skeleton className="h-8 w-96" />
            ) : (
              <AppBreadcrumb
                items={[
                  {
                    label: "Home",
                    href: "/dashboard",
                    icon: <Home className="size-4" />,
                  },
                  {
                    label: "Tickets",
                    href: "/tickets",
                    icon: <IconBuilding className="size-4" />,
                  },
                  {
                    label: "Danh sách luồng xử lý",
                    href: "/tickets/flows",
                    icon: <Workflow className="size-4" />,
                  },
                  {
                    label: currentFlow?.name || "Chi tiết bước",
                    href: `/tickets/flows/${flowId}/steps`,
                    icon: <Workflow className="size-4" />,
                  },
                ]}
              />
            )}
          </div>

          {/* Main Content */}
          <TicketFlowStepDataList initialFlowId={flowId} />
        </div>
      </div>
    </div>
  );
}

export default function TicketFlowStepsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TICKET_FLOW_STEPS]}>
      <TicketFlowStepsPageContent />
    </ProtectedRoute>
  );
}
