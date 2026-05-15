"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { TicketTagMain } from "@/features/tickets/ticket-tag/components/ticket-tag-main";
import { IconReportMoney } from "@tabler/icons-react";
import { Home } from "lucide-react";
import {
  NavigationRailFilter,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";

// (Tạm thời chưa dùng nhưng để sẵn nếu cần sort/filter nâng cao sau này)
const sortOptions: FilterOption[] = [];

function TagsPageContent() {
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  const handleSearchChange = (value: string) => {
    setQuery({ search: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({ search: undefined, page: 1 });
  };

  return (
    <div className="flex h-full bg-transparent">
      {/* Navigation Rail Filter (giống Users) */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm tag..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        // Có thể dùng sortOptions trong tương lai
        selectLabel="Sắp xếp"
        selectOptions={sortOptions}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý ticket",
                href: "/tickets",
                icon: <IconReportMoney className="size-4" />,
              },
              { label: "Quản lý Tag", href: "/tickets/tags" },
            ]}
          />

          <TicketTagMain />
        </div>
      </div>
    </div>
  );
}

export default function TagsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TAGS]}>
      <TagsPageContent />
    </ProtectedRoute>
  );
}
