"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
import TicketFlowStepper from "./ticket-flow-stepper";
import TicketSidebarFilter from "./ticket-sidebar-filter";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";

interface TicketFlowStepDataListProps {
  initialFlowId?: string;
}

export default function TicketFlowStepDataList({
  initialFlowId,
}: TicketFlowStepDataListProps) {
  const [selectedFlowId, setSelectedFlowId] = useState<string>(
    initialFlowId || "",
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch ticket flows for the filter
  const { data: flowsData, isLoading: isLoadingFlows } = useGetTicketFlows({
    page: 1,
    page_size: 100,
  });

  const ticketFlows = flowsData?.data.data.flows || [];

  // Auto-select flow when initialFlowId is provided or changes
  useEffect(() => {
    if (initialFlowId) {
      setSelectedFlowId(initialFlowId);
    }
  }, [initialFlowId]);

  // Filter flows based on search
  const filteredFlows = ticketFlows.filter((flow) =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddStep = () => {
    console.log("Add new step for flow:", selectedFlowId);
    // TODO: Implement add step functionality
  };

  return (
    <div className="grid grid-cols-10 gap-6 h-full">
      {/* Left Side - Filter Section (3/10) */}
      {/* <div className="col-span-3 space-y-4">
        <TicketSidebarFilter
          selectedFlowId={selectedFlowId}
          setSelectedFlowId={setSelectedFlowId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          ticketFlows={ticketFlows}
          filteredFlows={filteredFlows}
          isLoadingFlows={isLoadingFlows}
          onAddStep={handleAddStep}
        />
      </div> */}

      {/* Right Side - Stepper Section (7/10) */}
      <div className="col-span-7">
        <Card className="h-full">
          <CardContent>
            {!selectedFlowId ? (
              <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                <div className="rounded-full bg-muted p-6">
                  <Filter className="size-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Chưa chọn luồng xử lý
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vui lòng chọn một luồng xử lý từ bộ lọc bên trái để xem các
                    bước
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Here will be the actual stepper with flow steps */}
                <TicketFlowStepper />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
