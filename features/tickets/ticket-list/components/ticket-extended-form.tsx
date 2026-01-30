"use client";

import { useState, useEffect } from "react";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { useGetTicketFlowSteps } from "@/hooks/ticket/ticket-flows/use-ticket-flow-step";
import { useGetTicketFlowInstance } from "@/hooks/ticket/ticket-flows/use-ticket-flow-instance";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TicketFlowStepperPreview } from "@/features/tickets/ticket-list/components/ticket-flow-step-preview";
import type { Ticket } from "../utils/ticket-schema";

interface TicketExtendedFormProps {
  ticket?: Ticket | null;
  selectedFlowId: string;
  selectedStepId: string;
  onFlowChange: (flowId: string) => void;
  onStepChange: (stepId: string) => void;
}

export default function TicketExtendedForm({
  ticket,
  selectedFlowId,
  selectedStepId,
  onFlowChange,
  onStepChange,
}: TicketExtendedFormProps) {
  const [openFlowCombobox, setOpenFlowCombobox] = useState(false);

  const isEditMode = !!ticket;

  const handleFlowSelect = (flowId: string) => {
    onFlowChange(flowId);
    onStepChange("");
    setOpenFlowCombobox(false);
  };

  const { data: ticketFlowsData, isLoading: isLoadingTicketFlows } =
    useGetTicketFlows(
      { page: 1, page_size: 10 },
      { enabled: openFlowCombobox || !!selectedFlowId },
    );

  const ticketFlows = ticketFlowsData?.data.data.flows || [];

  const { data: ticketFlowStepsData, isLoading: isLoadingTicketFlowSteps } =
    useGetTicketFlowSteps({ flow_id: selectedFlowId });

  const ticketFlowSteps = ticketFlowStepsData?.data.data.steps || [];

  // Fetch flow instance when in edit mode
  const shouldFetchFlowInstance =
    isEditMode && !!ticket?.id && !!selectedFlowId;

  const { data: flowInstanceData, isLoading: isLoadingFlowInstance } =
    useGetTicketFlowInstance(
      {
        ticket_id: ticket?.id || "",
        page: 1,
        page_size: 1,
      },
      {
        enabled: shouldFetchFlowInstance,
      },
    );

  const flowInstance = shouldFetchFlowInstance
    ? flowInstanceData?.data?.data?.instances?.[0]
    : undefined;

  // Auto-select current step from flow instance in edit mode
  useEffect(() => {
    if (isEditMode && flowInstance?.current_step_id && !selectedStepId) {
      onStepChange(flowInstance.current_step_id);
    }
  }, [flowInstance, isEditMode, selectedStepId, onStepChange]);

  // Map steps to match StepPreview interface
  const mappedSteps = ticketFlowSteps.map((step) => ({
    ...step,
    // StepPreview expects step_name, ensure it's mapped if the API uses 'name'
    step_name: (step as any).step_name || (step as any).name,
    // Property 'assignee' is required (user or group)
    assignee: step.assignee_user_id ? "user" : "group",
    assignee_user_id: step.assignee_user_id || undefined,
    assignee_group_id: step.assignee_group_id || undefined,
    // Mapping assignee objects and handling potential nulls
    assignee_user: step.assignee_user
      ? {
          id: step.assignee_user.id,
          username: step.assignee_user.username,
          name:
            (step.assignee_user as any).fullname || step.assignee_user.username,
        }
      : undefined,
    assignee_group: step.assignee_group || undefined,
  })) as any[];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Chọn luồng</Label>
        <Popover open={openFlowCombobox} onOpenChange={setOpenFlowCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openFlowCombobox}
              className="w-full justify-between"
              disabled={isLoadingTicketFlows || isEditMode}
            >
              {isLoadingTicketFlows ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </span>
              ) : selectedFlowId ? (
                ticketFlows.find((flow) => flow.id === selectedFlowId)?.name ||
                "Chọn luồng..."
              ) : (
                "Chọn luồng..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-primary/20">
            <Command>
              <CommandInput placeholder="Tìm kiếm luồng..." className="h-9" />
              <CommandEmpty>Không tìm thấy luồng.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto p-1">
                {ticketFlows.map((flow) => (
                  <CommandItem
                    key={flow.id}
                    value={flow.name}
                    className="flex cursor-pointer items-center justify-between py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    onSelect={() => handleFlowSelect(flow.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{flow.name}</span>
                      {flow.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1 italic">
                          {flow.description}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        selectedFlowId === flow.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedFlowId && (
        <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-2 duration-300">
          {isLoadingTicketFlowSteps ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              <span className="text-sm text-muted-foreground italic">
                Đang tải danh sách các bước...
              </span>
            </div>
          ) : (
            <TicketFlowStepperPreview
              steps={mappedSteps}
              selectedStepId={selectedStepId}
              onSelectStep={(step) => onStepChange(step.id || "")}
              isEditMode={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
