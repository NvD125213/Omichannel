"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  CircleCheck,
  CircleX,
  Home,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
} from "lucide-react";
import { IconPhoneCall } from "@tabler/icons-react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  NavigationRailFilter,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallLogsListTable } from "@/features/call-logs/components/call-logs-list-table";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/constants/permission";
import { useGetCallLogs } from "@/hooks/call-logs/use-call-logs";
import { useGetCustomers } from "@/hooks/customer/use-customer";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { useGetTickets } from "@/hooks/ticket/ticket-list/use-ticket-list";
import { cn } from "@/lib/utils";
import type { CallLog } from "@/services/call-logs/service";

const ALL_VALUE = "__all__";

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

const statusOptions: FilterOption[] = [
  {
    value: "created",
    label: "Đã tạo",
    icon: <PhoneOutgoing className="size-4" />,
  },
  {
    value: "ringing",
    label: "Đang đổ chuông",
    icon: <PhoneIncoming className="size-4" />,
  },
  {
    value: "answered",
    label: "Đã nghe",
    icon: <CircleCheck className="size-4" />,
  },
  {
    value: "ended",
    label: "Kết thúc",
    icon: <CircleCheck className="size-4" />,
  },
  {
    value: "missed",
    label: "Nhỡ máy",
    icon: <PhoneMissed className="size-4" />,
  },
  {
    value: "busy",
    label: "Máy bận",
    icon: <PhoneMissed className="size-4" />,
  },
  {
    value: "no_answer",
    label: "Không trả lời",
    icon: <PhoneMissed className="size-4" />,
  },
  {
    value: "failed",
    label: "Thất bại",
    icon: <CircleX className="size-4" />,
  },
];

function isSuperAdminRole(role?: string | null) {
  const value = (role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  return value === "super_admin" || value.includes("super_admin");
}

type SelectOption = { value: string; label: string };

function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  emptyText = "Không tìm thấy kết quả.",
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <label className="text-foreground text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between bg-transparent font-normal"
          >
            <span className="truncate">
              {selected?.label || placeholder}
            </span>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={`${placeholder} ${ALL_VALUE}`}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {placeholder}
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function CallLogsPage() {
  const { user, hasPermission } = useAuth();
  const canFilterByTenant =
    isSuperAdminRole(user?.role) || hasPermission(PERMISSIONS.VIEW_TENANTS);

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    direction: StringParam,
    status: StringParam,
    tenant_id: StringParam,
    ticket_id: StringParam,
    customer_id: StringParam,
  });

  useEffect(() => {
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: tenantsData } = useGetTenants(
    { page: 1, page_size: 100 },
    { enabled: canFilterByTenant },
  );
  const { data: ticketsData } = useGetTickets({ page: 1, page_size: 100 });
  const { data: customersData } = useGetCustomers({ page: 1, page_size: 100 });

  const tenantOptions = useMemo(
    () =>
      (tenantsData && "items" in tenantsData ? tenantsData.items : []).map(
        (tenant) => ({
          value: tenant.id,
          label: tenant.name || tenant.id,
        }),
      ),
    [tenantsData],
  );
  const ticketOptions = useMemo(
    () =>
      (ticketsData?.data?.items ?? []).flatMap((ticket) => {
        if (!ticket.id) return [];
        const code = ticket.code?.trim();
        const title = ticket.title?.trim();
        return [
          {
            value: ticket.id,
            label: [code, title].filter(Boolean).join(" — ") || ticket.id,
          },
        ];
      }),
    [ticketsData],
  );
  const customerOptions = useMemo(
    () =>
      (customersData?.data?.items ?? []).flatMap((customer) => {
        if (!customer.id) return [];
        const name = customer.name?.trim();
        const phone = customer.phone?.trim();
        return [
          {
            value: customer.id,
            label: [name, phone].filter(Boolean).join(" · ") || customer.id,
          },
        ];
      }),
    [customersData],
  );

  const { data, isLoading } = useGetCallLogs({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    direction: query.direction || undefined,
    status: query.status || undefined,
    tenant_id: canFilterByTenant ? query.tenant_id || undefined : undefined,
    ticket_id: query.ticket_id || undefined,
    customer_id: query.customer_id || undefined,
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
    setQuery({
      direction: !value || value === ALL_VALUE ? undefined : value,
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    setQuery({
      status: !value || value === ALL_VALUE ? undefined : value,
      page: 1,
    });
  };

  const handleTenantChange = (value: string) => {
    setQuery({
      tenant_id: !value || value === ALL_VALUE ? undefined : value,
      page: 1,
    });
  };

  const handleTicketChange = (value: string) => {
    setQuery({ ticket_id: value || undefined, page: 1 });
  };

  const handleCustomerChange = (value: string) => {
    setQuery({ customer_id: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({
      search: undefined,
      direction: undefined,
      status: undefined,
      tenant_id: undefined,
      ticket_id: undefined,
      customer_id: undefined,
      page: 1,
    });
  };

  const extraActiveFilterCount =
    (canFilterByTenant && query.tenant_id ? 1 : 0) +
    (query.ticket_id ? 1 : 0) +
    (query.customer_id ? 1 : 0);

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
        select2Label="Trạng thái"
        select2Placeholder="Tất cả trạng thái"
        select2Options={statusOptions}
        select2Value={query.status || undefined}
        onSelect2Change={handleStatusChange}
        onClearAll={handleClearFilters}
        extraActiveFilterCount={extraActiveFilterCount}
        extraPanelContent={
          <div className="space-y-5">
            {canFilterByTenant ? (
              <div className="space-y-2">
                <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <Building2 className="size-4" />
                  Tenant
                </label>
                <Select
                  value={query.tenant_id || ALL_VALUE}
                  onValueChange={handleTenantChange}
                >
                  <SelectTrigger className="h-10 w-full bg-transparent">
                    <SelectValue placeholder="Tất cả tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Tất cả tenant</SelectItem>
                    {tenantOptions.map((tenant) => (
                      <SelectItem key={tenant.value} value={tenant.value}>
                        {tenant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-[11px]">
                  Chỉ Super Admin mới lọc theo tenant.
                </p>
              </div>
            ) : null}

            <SearchableSelect
              label="Ticket"
              placeholder="Tất cả ticket"
              searchPlaceholder="Tìm mã hoặc tiêu đề ticket..."
              value={query.ticket_id ?? ""}
              options={ticketOptions}
              onChange={handleTicketChange}
            />
            <SearchableSelect
              label="Khách hàng"
              placeholder="Tất cả khách hàng"
              searchPlaceholder="Tìm tên hoặc SĐT khách hàng..."
              value={query.customer_id ?? ""}
              options={customerOptions}
              onChange={handleCustomerChange}
            />
          </div>
        }
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
          />
        </div>
      </div>
    </div>
  );
}
