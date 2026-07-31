import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Loader2,
  FileText,
  Calendar,
  Hash,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertDateTime } from "@/utils/convert-time";
import { IconReportMoney } from "@tabler/icons-react";
import {
  useUpdateTicketFlowInstance,
  useCreateTicketFlowInstance,
} from "@/hooks/ticket/ticket-flows/use-ticket-flow-instance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "running", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "paused", label: "Tạm dừng" },
  { value: "failed", label: "Thất bại" },
  { value: "cancelled", label: "Hủy bỏ" },
];

interface FlowInstance {
  id: string;
  ticket_id: string;
  flow_id: string;
  current_step_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  ticket: { id: string; code: string; title: string; status: string };
  flow: { id: string; name: string; description?: string };
}

interface StepData {
  id: string;
  step_order: number;
  name: string;
  created_at: string;
  assignee?: string;
  assignee_user_id?: string;
  assignee_group_id?: string;
  status:
    | "completed"
    | "active"
    | "pending"
    | "paused"
    | "failed"
    | "cancelled"
    | "unknown";
  description?: string;
}

interface TicketFlowInstanceDetailProps {
  instance?: FlowInstance;
  stepData?: StepData;
  isLoading: boolean;
  ticket_id: string;
  flow_id: string;
  getStepIcon: (status?: string) => React.ReactNode;
  getStepIconBackground: (status?: string) => string;
  getStepBadgeStyles: (status?: string) => string;
  getTranslateStatus: (status?: string) => string;
  showActionBar?: boolean;
}

export function TicketFlowInstanceActionBar({
  instance,
  stepData,
  ticket_id,
  flow_id,
  getStepBadgeStyles,
}: {
  instance?: FlowInstance;
  stepData?: StepData;
  ticket_id: string;
  flow_id: string;
  getStepBadgeStyles: (status?: string) => string;
}) {
  const updateInstanceMutation = useUpdateTicketFlowInstance();
  const createInstanceMutation = useCreateTicketFlowInstance();

  const [selectedStatus, setSelectedStatus] = useState<string>(
    instance?.status || "running",
  );

  useEffect(() => {
    if (instance?.status) {
      setSelectedStatus(instance.status);
    }
  }, [instance?.status, instance?.id]);

  const handleAction = () => {
    if (!stepData) return;

    if (instance?.id) {
      updateInstanceMutation.mutate({
        id: instance.id,
        data: {
          current_step_id: stepData.id,
          status: selectedStatus,
        },
      });
    } else {
      createInstanceMutation.mutate({
        ticket_id: ticket_id,
        flow_id: flow_id,
        current_step_id: stepData.id,
      });
    }
  };

  const isActionLoading =
    updateInstanceMutation.isPending || createInstanceMutation.isPending;

  if (!stepData) return null;

  if (!instance) {
    return (
      <Button
        onClick={handleAction}
        disabled={isActionLoading}
        className="h-7 gap-1.5 text-xs"
        size="sm"
      >
        {isActionLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        Thực hiện bước
      </Button>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-1.5">
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger
          className={`${getStepBadgeStyles(selectedStatus)} h-7 w-full border px-2 text-xs font-medium`}
        >
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleAction}
        disabled={isActionLoading}
        className="h-9 w-full text-xs"
        variant="outline"
        size="sm"
      >
        {isActionLoading ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-3 w-3" />
        )}
        Cập nhật
      </Button>
    </div>
  );
}

export default function TicketFlowInstanceDetail({
  instance,
  stepData,
  isLoading,
  ticket_id,
  flow_id,
  getStepBadgeStyles,
  getTranslateStatus,
  showActionBar = true,
}: TicketFlowInstanceDetailProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!stepData) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-2 py-8 text-center text-muted-foreground">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
          <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
        </div>
        <p className="text-xs font-medium text-slate-900 dark:text-zinc-100">
          Chưa chọn bước nào
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          Chọn một bước bên trái để xem chi tiết
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showActionBar && instance && (
        <div className="sticky top-0 z-10 shrink-0 bg-white pb-2 dark:bg-zinc-900">
          <TicketFlowInstanceActionBar
            instance={instance}
            stepData={stepData}
            ticket_id={ticket_id}
            flow_id={flow_id}
            getStepBadgeStyles={getStepBadgeStyles}
          />
        </div>
      )}

      {instance ? (
        <div className="min-h-0 flex-1 overflow-y-auto pt-2 pr-1">
          <motion.div
            key={stepData.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
            className="space-y-3 pb-3"
          >
            {/* Header — badges + tên cùng hàng */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="h-5 border-slate-200 bg-transparent px-1.5 text-xs font-normal text-slate-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Bước {stepData.step_order}
                </Badge>
                <Badge
                  className={`${getStepBadgeStyles(instance.status)} h-5 border px-1.5 text-xs font-medium`}
                  variant="outline"
                >
                  {getTranslateStatus(instance.status)}
                </Badge>
              </div>
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {stepData.name}
              </h3>
            </div>

            {/* Bảng thông tin — label | value */}
            <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-zinc-800">
              {stepData.assignee && (
                <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                  <span className="w-24 shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                    {stepData.assignee_user_id
                      ? "Người thực hiện"
                      : "Nhóm thực hiện"}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {stepData.assignee_user_id ? (
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage
                          src={`/avatar/${stepData.assignee_user_id}.jpg`}
                          alt={stepData.assignee}
                        />
                        <AvatarFallback className="bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {stepData.assignee?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-700">
                        <Users className="h-3 w-3 text-slate-500 dark:text-zinc-400" />
                      </div>
                    )}
                    <span className="truncate text-xs font-medium text-slate-900 dark:text-zinc-100">
                      {stepData.assignee}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="flex w-24 shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <Calendar className="h-3 w-3" />
                  Bắt đầu
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-900 dark:text-zinc-100">
                  {instance.started_at
                    ? convertDateTime(instance.started_at, "short").datetime
                    : "--/--"}
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="flex w-24 shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <Calendar className="h-3 w-3" />
                  Kết thúc
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-900 dark:text-zinc-100">
                  {instance.finished_at
                    ? convertDateTime(instance.finished_at, "short").datetime
                    : "--/--"}
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="flex w-24 shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <IconReportMoney className="h-3 w-3" />
                  Tiêu đề
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-900 dark:text-zinc-100">
                  {instance.ticket.title}
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="w-24 shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                  Code
                </span>
                <Badge className="h-5 rounded-full border border-slate-200 bg-slate-100 px-1.5 text-xs font-medium text-slate-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  #{instance.ticket.code}
                </Badge>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="w-24 shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                  Trạng thái
                </span>
                <Badge
                  className={`${getStepBadgeStyles(instance.ticket.status)} h-5 rounded-full px-1.5 text-xs font-medium`}
                >
                  {getTranslateStatus(instance.ticket.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 px-2.5 py-2 dark:border-zinc-800">
                <span className="flex w-24 shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <Hash className="h-3 w-3" />
                  Luồng
                </span>
                <Badge className="h-5 max-w-[70%] truncate rounded-full border border-indigo-100 bg-indigo-50 px-1.5 text-xs font-medium text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {instance.flow.name}
                </Badge>
              </div>

              {instance.flow.description && (
                <div className="flex items-start gap-3 px-2.5 py-2">
                  <span className="w-24 shrink-0 pt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    Mô tả
                  </span>
                  <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                    {instance.flow.description}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center text-muted-foreground">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
            <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-xs font-medium text-slate-900 dark:text-zinc-100">
            Chưa thực hiện đến bước này
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            {showActionBar
              ? "Nhấn nút bên dưới để bắt đầu"
              : "Dùng nút phía trên để bắt đầu"}
          </p>
          {showActionBar && (
            <TicketFlowInstanceActionBar
              instance={instance}
              stepData={stepData}
              ticket_id={ticket_id}
              flow_id={flow_id}
              getStepBadgeStyles={getStepBadgeStyles}
            />
          )}
        </div>
      )}
    </div>
  );
}
