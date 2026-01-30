"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, Workflow, ArrowLeft } from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import TicketFlowStepDataList from "@/features/tickets/ticket-flow-step/components/ticket-flow-step-data-list";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function TicketFlowStepsPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.flowId as string;

  // Fetch flow info to display in breadcrumb
  const { data: flowsData, isLoading } = useGetTicketFlows({
    page: 1,
    page_size: 100,
  });

  const currentFlow = flowsData?.data.data.flows.find((f) => f.id === flowId);

  return (
    <div className="p-4 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/tickets/flows")}
            className="cursor-pointer -ml-2"
          >
            <ArrowLeft className="size-4 mr-2" />
            Quay lại
          </Button>
        </div>

        {/* Main Content */}
        <TicketFlowStepDataList initialFlowId={flowId} />
      </div>
    </div>
  );
}
