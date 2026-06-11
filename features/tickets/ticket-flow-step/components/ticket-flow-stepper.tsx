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
  X,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Timeline,
  TimelineBody,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { EmptyData } from "@/components/empty-data";
import { IconFilter, IconMoodEmpty } from "@tabler/icons-react";
import TicketFlowInstanceDetail from "./ticket-flow-instance-detail";
import { cn } from "@/lib/utils";

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
      return <Check className="h-3.5 w-3.5 text-white" />;

    case "running":
    case "active":
      return <CircleDot className="h-3.5 w-3.5 text-white" />;

    case "pending":
      return (
        <Clock className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
      );

    case "paused":
      return (
        <PauseCircle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
      );

    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-700 dark:text-red-300" />;

    case "cancelled":
      return (
        <AlertCircle className="h-3.5 w-3.5 text-rose-700 dark:text-rose-300" />
      );

    default:
      return (
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      );
  }
};

const getStepBadgeStyles = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "running":
    case "active":
      return "border-primary/25 bg-primary/10 text-primary dark:border-primary/35 dark:bg-primary/15 dark:text-primary";
    case "pending":
      return "border-border bg-muted/50 text-muted-foreground dark:bg-muted/30";

    case "paused":
      return "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300";

    case "failed":
      return "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

    case "cancelled":
      return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";

    default:
      return "border-border bg-muted/40 text-muted-foreground dark:bg-muted/25";
  }
};

const getStepIconBackground = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "bg-emerald-500 shadow-sm shadow-emerald-500/30";

    case "running":
    case "active":
      return "bg-primary shadow-sm shadow-primary/30";

    case "pending":
      return "bg-muted ring-1 ring-border";

    case "paused":
      return "bg-amber-200 ring-1 ring-amber-300/80 dark:bg-amber-900/50 dark:ring-amber-700/60";

    case "failed":
      return "bg-red-100 ring-1 ring-red-200 dark:bg-red-950/50 dark:ring-red-800/60";

    case "cancelled":
      return "bg-rose-100 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:ring-rose-800/60";

    default:
      return "bg-muted ring-1 ring-border";
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

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    status: statusFilter !== "all" ? statusFilter : undefined,
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

  // Filter steps based on status filter - hide steps without matching instances
  const filteredStepsData =
    statusFilter !== "all"
      ? stepsData.filter((step) => {
          // Check if this step has at least one instance with the filtered status
          return instances.some(
            (inst: any) =>
              inst.current_step_id === step.id &&
              normalizeStatus(inst.status) === normalizeStatus(statusFilter),
          );
        })
      : stepsData;

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
    if (filteredStepsData.length > 0 && !selectedStep) {
      const activeStep = filteredStepsData.find((s) => s.status === "active");
      setSelectedStep(activeStep?.id || filteredStepsData[0].id);
    }
  }, [filteredStepsData, selectedStep]);

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải luồng xử lý...
          </p>
        </div>
      </div>
    );
  }

  // Only show full empty state when there's no data at all
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

  const selectedStepData = filteredStepsData.find((s) => s.id === selectedStep);

  return (
    <div className="grid h-full grid-cols-10 gap-4 rounded-lg bg-transparent">
      {/* Left Column - Steps List (60% - 6 cols) */}
      <div className="col-span-6 border-r border-border/60 pr-4">
        {/* Filter Bar */}
        <div className="mb-3 flex items-center gap-2 justify-between border-b border-border/60 pb-3">
          {/* Status Filter */}
          <p className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm font-medium text-foreground dark:bg-muted/25">
            <IconFilter className="size-4 text-muted-foreground" />
            Bộ lọc
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-48 border-border/70 bg-transparent text-xs dark:bg-transparent dark:hover:bg-muted/30">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="running">Đang xử lý</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="paused">Tạm dừng</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
              <SelectItem value="cancelled">Hủy bỏ</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Filter Summary */}
          {statusFilter !== "all" && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Đang lọc:</span>
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 h-5"
                >
                  {getTranslateStatus(statusFilter)}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setStatusFilter("all")}
              >
                <X className="h-3 w-3 mr-0.5" />
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>

        {filteredStepsData.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <IconMoodEmpty className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Không tìm thấy kết quả
              </p>
              <p className="text-xs text-muted-foreground">
                Thử thay đổi bộ lọc để xem kết quả khác
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="max-h-[calc(100vh-18rem)] overflow-y-auto pr-2 pt-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          >
            <Timeline
              color="secondary"
              orientation="vertical"
              className="w-full"
            >
              {filteredStepsData.map((step, index) => (
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
                      className={cn(
                        "flex cursor-pointer flex-col gap-1.5 rounded-lg border border-transparent p-2.5 transition-all",
                        selectedStep === step.id
                          ? "border-primary/25 bg-primary/8 dark:border-primary/30 dark:bg-primary/10"
                          : "hover:border-border/50 hover:bg-muted/35 dark:hover:bg-muted/20",
                      )}
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
                          className="h-5 border-border/70 bg-background/80 px-1.5 py-1 text-xs font-medium text-foreground dark:bg-muted/30"
                        >
                          Bước {step.step_order}
                        </Badge>
                      </div>

                      <h3 className="text-sm leading-tight font-medium text-foreground">
                        {step.name}
                      </h3>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
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
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </TimelineIcon>
                  </TimelineHeader>
                  <TimelineBody className="pt-0 pb-2">
                    <span className="text-xs italic text-muted-foreground">
                      Đang tải...
                    </span>
                  </TimelineBody>
                </TimelineItem>
              )}

              {/* End indicator - Không còn sự kiện */}
              {!hasNextStepsPage && filteredStepsData.length > 0 && (
                <TimelineItem className="min-h-0">
                  <TimelineHeader>
                    <TimelineIcon>
                      <div className="h-1.5 w-1.5 rounded-sm bg-muted-foreground/40" />
                    </TimelineIcon>
                  </TimelineHeader>
                  <TimelineBody className="pt-0 pb-2">
                    <span className="text-xs italic text-muted-foreground">
                      Không còn sự kiện
                    </span>
                  </TimelineBody>
                </TimelineItem>
              )}
            </Timeline>
          </div>
        )}
      </div>

      {/* Right Column - Step Details (40% - 4 cols) */}
      <div className="col-span-4 pl-2">
        <div className="pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
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
