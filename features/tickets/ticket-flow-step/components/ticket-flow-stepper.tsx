"use client";

import {
  Check,
  Clock,
  CircleDot,
  Loader2,
  AlertCircle,
  PauseCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { convertDateTime } from "@/utils/convert-time";
import { useGetTicketFlowStepsInfinite } from "@/hooks/ticket/ticket-flows/use-ticket-flow-step";
import {
  useGetTicketFlowInstances,
  useGetTicketFlowInstance,
} from "@/hooks/ticket/ticket-flows/use-ticket-flow-instance";
import { Badge } from "@/components/ui/badge";

import {
  Timeline,
  TimelineBody,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";
import TicketFlowInstanceDetail from "./ticket-flow-instance-detail";

interface StepData {
  id: string;
  step_order: number;
  name: string;
  created_at: string;
  assignee?: string;
  assignee_user_id?: string;
  assignee_group_id?: string;
  status: "completed" | "active" | "pending" | "unknown";
  description?: string;
}

const normalizeStatus = (status?: string) => status?.toLowerCase() ?? "default";

const getStepIcon = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return <Check className="h-4 w-4 text-white" />;

    case "running":
    case "active":
      return <CircleDot className="h-4 w-4 text-white" />;

    case "pending":
      return <Clock className="h-4 w-4 text-slate-500" />;

    case "paused":
      return <PauseCircle className="h-4 w-4 text-amber-600" />;

    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;

    case "cancelled":
      return <AlertCircle className="h-4 w-4 text-rose-600" />;

    default:
      return <HelpCircle className="h-4 w-4 text-slate-400" />;
  }
};

const getStepBadgeStyles = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";

    case "running":
    case "active":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "pending":
      return "bg-zinc-50 text-zinc-500 border-zinc-200";

    case "paused":
      return "bg-amber-50 text-amber-500 border-amber-200";

    case "failed":
      return "bg-red-50 text-red-700 border-red-200";

    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";

    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

const getStepIconBackground = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "bg-green-500";

    case "running":
    case "active":
      return "bg-indigo-500";

    case "pending":
      return "bg-zinc-200";

    case "paused":
      return "bg-amber-200";

    case "failed":
      return "bg-red-500/10";

    case "cancelled":
      return "bg-rose-500/10";

    default:
      return "bg-gray-300";
  }
};

const getTranslateStatus = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "Hoàn thành";

    case "running":
    case "active":
      return "Đang xử lý";

    case "pending":
      return "Chờ xử lý";

    case "paused":
      return "Tạm dừng";

    case "failed":
      return "Thất bại";

    case "cancelled":
      return "Hủy bỏ";

    default:
      return "Chưa xác định";
  }
};

// Get step status by matching with instance's current_step_id
const getStepStatusFromInstance = (
  stepId: string,
  instances: any[],
): StepData["status"] => {
  const matchingInstance = instances.find(
    (inst: any) => inst.current_step_id === stepId,
  );

  if (!matchingInstance) {
    return "unknown";
  }

  const instanceStatus = matchingInstance.status?.toLowerCase();

  switch (instanceStatus) {
    case "completed":
    case "finished":
      return "completed";
    case "running":
    case "active":
      return "active";
    case "pending":
      return "pending";
    case "paused":
      return "paused" as any;
    case "failed":
      return "failed" as any;
    case "cancelled":
      return "cancelled" as any;
    default:
      return "unknown";
  }
};

export default function TicketFlowStepper({
  ticket_id,
  flow_id,
}: {
  ticket_id: string;
  flow_id: string;
}) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all steps for the flow (using infinite query)
  const {
    data: stepsInfiniteData,
    fetchNextPage: fetchNextStepsPage,
    hasNextPage: hasNextStepsPage,
    isFetchingNextPage: isFetchingNextStepsPage,
    isLoading: isLoadingSteps,
  } = useGetTicketFlowStepsInfinite({
    flow_id: flow_id,
    page_size: 10,
  });

  // Fetch flow instances for the ticket and specific flow (using infinite query)
  const {
    data: instanceInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInstance,
  } = useGetTicketFlowInstances({
    ticket_id: ticket_id,
    flow_id: flow_id,
    page_size: 10,
  });

  // Get steps from infinite query pages
  const rawSteps =
    stepsInfiniteData?.pages?.flatMap(
      (page) => page?.data?.data?.steps || [],
    ) ?? [];

  // Get instances from infinite query pages
  const instances =
    instanceInfiniteData?.pages?.flatMap(
      (page) => page?.data?.data?.instances || [],
    ) ?? [];

  const stepsData: StepData[] = rawSteps.map((step: any) => {
    const status = getStepStatusFromInstance(step.id, instances);

    return {
      id: step.id,
      step_order: step.step_order,
      name: step.step_name || step.name,
      created_at: step.created_at,
      assignee: step.assignee_user?.fullname || step.assignee_group?.name,
      assignee_user_id: step.assignee_user_id,
      assignee_group_id: step.assignee_group_id,
      status,
      description: step.description,
    };
  });

  // Fetch instance data for the selected step
  const {
    data: selectedStepInstanceData,
    isLoading: isLoadingSelectedInstance,
  } = useGetTicketFlowInstance(
    {
      ticket_id: ticket_id,
      current_step_id: selectedStep || "",
      page_size: 1,
    },
    {
      enabled: !!selectedStep,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );

  const selectedStepInstance =
    selectedStepInstanceData?.data?.data?.instances?.[0];

  // Auto-select active step or first step
  useEffect(() => {
    if (stepsData.length > 0 && !selectedStep) {
      const activeStep = stepsData.find((s) => s.status === "active");
      setSelectedStep(activeStep?.id || stepsData[0].id);
    }
  }, [stepsData, selectedStep]);

  // Infinite scroll: load more steps when scrolling to bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (isNearBottom && hasNextStepsPage && !isFetchingNextStepsPage) {
        fetchNextStepsPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextStepsPage, isFetchingNextStepsPage, fetchNextStepsPage]);

  if (isLoadingSteps || isLoadingInstance) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Đang tải luồng xử lý...</p>
        </div>
      </div>
    );
  }

  if (stepsData.length === 0) {
    return (
      <EmptyData
        icon={IconMoodEmpty}
        title="Không có thông tin luồng xử lý"
        description="Ticket này chưa được gán vào luồng xử lý nào"
        showButton={false}
      />
    );
  }

  const selectedStepData = stepsData.find((s) => s.id === selectedStep);

  return (
    <div className="grid grid-cols-10 gap-4 h-full">
      {/* Left Column - Steps List (60% - 6 cols) */}
      <div className="col-span-6 border-r pr-4">
        <div
          ref={containerRef}
          className="max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pr-2 pt-4"
        >
          <Timeline color="secondary" orientation="vertical" className="w-full">
            {stepsData.map((step, index) => (
              <TimelineItem key={step.id}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineIcon>
                    <div
                      className={`${getStepIconBackground(step.status)} w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => setSelectedStep(step.id)}
                    >
                      {getStepIcon(step.status)}
                    </div>
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="-translate-y-1.5 pt-0 pb-5">
                  <div
                    className={`flex flex-col gap-1.5 cursor-pointer p-2.5 rounded-md transition-all ${
                      selectedStep === step.id
                        ? "bg-indigo-50/60 border border-indigo-200/70"
                        : "hover:bg-slate-50/80"
                    }`}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`${getStepBadgeStyles(step.status)} text-xs px-1.5 py-1 h-5 font-medium`}
                      >
                        {getTranslateStatus(step.status)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-1 h-5 font-medium"
                      >
                        Bước {step.step_order}
                      </Badge>
                    </div>

                    <h3 className="font-medium text-sm text-slate-900 leading-tight">
                      {step.name}
                    </h3>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {
                          convertDateTime(step.created_at, "short").datetime
                        }{" "}
                      </span>
                    </div>
                  </div>
                </TimelineBody>
              </TimelineItem>
            ))}

            {/* Loading indicator */}
            {isFetchingNextStepsPage && (
              <TimelineItem className="min-h-0">
                <TimelineHeader>
                  <TimelineIcon>
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="pt-0 pb-2">
                  <span className="text-xs text-slate-400 italic">
                    Đang tải...
                  </span>
                </TimelineBody>
              </TimelineItem>
            )}

            {/* End indicator - Không còn sự kiện */}
            {!hasNextStepsPage && stepsData.length > 0 && (
              <TimelineItem className="min-h-0">
                <TimelineHeader>
                  <TimelineIcon>
                    <div className="h-1.5 w-1.5 rounded-sm bg-slate-300" />
                  </TimelineIcon>
                </TimelineHeader>
                <TimelineBody className="pt-0 pb-2">
                  <span className="text-xs text-slate-400 italic">
                    Không còn sự kiện
                  </span>
                </TimelineBody>
              </TimelineItem>
            )}
          </Timeline>
        </div>
      </div>

      {/* Right Column - Step Details (40% - 4 cols) */}
      <div className="col-span-4 pl-2">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pr-2">
          <AnimatePresence mode="wait">
            <TicketFlowInstanceDetail
              instance={selectedStepInstance}
              stepData={selectedStepData}
              isLoading={isLoadingSelectedInstance}
              ticket_id={ticket_id}
              flow_id={flow_id}
              getStepIcon={getStepIcon}
              getStepIconBackground={getStepIconBackground}
              getStepBadgeStyles={getStepBadgeStyles}
              getTranslateStatus={getTranslateStatus}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
