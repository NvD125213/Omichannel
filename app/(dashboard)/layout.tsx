import AppSidebar from "@/components/app-sidebar";
import { ChatUnreadSync } from "@/components/chat-unread-sync";
import { CGVCallSDKProvider } from "@/components/cgv-call-sdk-provider";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardPermissionGate } from "@/components/dashboard-permission-gate";
import { ProtectedRoute } from "@/components/protected-route";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <CGVCallSDKProvider>
        <SidebarConfigProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Suspense>
                <ChatUnreadSync />
                <DashboardHeader />
              </Suspense>
              <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 has-data-dashboard-inset-flush:p-0">
                <DashboardPermissionGate>{children}</DashboardPermissionGate>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </SidebarConfigProvider>
      </CGVCallSDKProvider>
    </ProtectedRoute>
  );
}
