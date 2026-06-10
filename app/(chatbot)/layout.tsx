import AppChatbotSidebar from "@/components/app-chatbot-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { ProtectedRoute } from "@/components/protected-route";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarConfigProvider>
        <SidebarProvider>
          <AppChatbotSidebar />
          <SidebarInset>
            <Suspense>
              <DashboardHeader />
            </Suspense>
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 has-data-dashboard-inset-flush:p-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SidebarConfigProvider>
    </ProtectedRoute>
  );
}
