"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import {
  NavigationRailFilter,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { IconUsers } from "@tabler/icons-react";
import { Home } from "lucide-react";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { TicketTagMain } from "@/features/tickets/ticket-tag/components/ticket-tag-main";

// (Tạm thời chưa dùng nhưng để sẵn nếu cần sort/filter nâng cao sau này)
const sortOptions: FilterOption[] = [];

function CustomersTagsPageContent() {
  const [, setQuery] = useQueryParams({
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
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm tag khách hàng..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        selectLabel="Sắp xếp"
        selectOptions={sortOptions}
      />

      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý khách hàng",
                href: "/customers",
                icon: <IconUsers className="size-4" />,
              },
              { label: "Quản lý tag cho khách hàng", href: "/customers/tags" },
            ]}
          />

          <TicketTagMain tagType="customer" />
        </div>
      </div>
    </div>
  );
}

export default function CustomersTagsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TAGS]}>
      <CustomersTagsPageContent />
    </ProtectedRoute>
  );
}
