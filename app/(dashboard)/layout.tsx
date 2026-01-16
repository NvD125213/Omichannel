import AppSidebar from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
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
      <SidebarConfigProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Suspense>
              <DashboardHeader />
            </Suspense>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SidebarConfigProvider>
    </ProtectedRoute>
  );
}
