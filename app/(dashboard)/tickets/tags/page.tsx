 "use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { TicketTagMain } from "@/features/tickets/ticket-tag/components/ticket-tag-main";
import { IconReportMoney } from "@tabler/icons-react";
import { Home } from "lucide-react";

function TagsPageContent() {
  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 space-y-6 px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
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
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h1 className="text-base font-semibold text-foreground">
              Quản lý Tag Ticket
            </h1>
          </div>
          <div className="p-5">
            <TicketTagMain />
          </div>
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
