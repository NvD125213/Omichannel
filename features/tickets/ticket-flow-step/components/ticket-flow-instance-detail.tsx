import { motion } from "framer-motion";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Loader2,
  FileText,
  Calendar,
  Hash,
  User,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertDateTime } from "@/utils/convert-time";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Status options for the select
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
}

export default function TicketFlowInstanceDetail({
  instance,
  stepData,
  isLoading,
  ticket_id,
  flow_id,
  getStepBadgeStyles,
  getTranslateStatus,
}: TicketFlowInstanceDetailProps) {
  const updateInstanceMutation = useUpdateTicketFlowInstance();
  const createInstanceMutation = useCreateTicketFlowInstance();

  // Track selected status for the select dropdown
  const [selectedStatus, setSelectedStatus] = useState<string>(
    instance?.status || "running",
  );

  const handleAction = () => {
    if (!stepData) return;

    if (instance?.id) {
      // Update existing instance with new status
      updateInstanceMutation.mutate({
        id: instance.id,
        data: {
          current_step_id: stepData.id,
          status: selectedStatus,
        },
      });
    } else {
      // Create new instance for this step
      createInstanceMutation.mutate({
        ticket_id: ticket_id,
        flow_id: flow_id,
        current_step_id: stepData.id,
      });
    }
  };

  const isActionLoading =
    updateInstanceMutation.isPending || createInstanceMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!stepData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">Chưa chọn bước nào</p>
        <p className="text-xs text-slate-500 mt-1">
          Chọn một bước từ danh sách bên trái để xem chi tiết
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content Section - ScrollArea or Empty State */}
      {instance ? (
        <ScrollArea className="flex-1 pr-4">
          <motion.div
            key={stepData.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 pb-6"
          >
            {/* HEADER SECTION */}
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-bold text-lg text-slate-900 leading mb-2.5">
                  {stepData.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-white font-normal"
                  >
                    Bước {stepData.step_order}
                  </Badge>
                  <Badge
                    className={`${getStepBadgeStyles(instance.status)} text-xs border font-medium`}
                    variant="outline"
                  >
                    {getTranslateStatus(instance.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* ASSIGNEE SECTION */}
            {stepData.assignee && (
              <div className="group">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  {stepData.assignee_user_id ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {stepData.assignee_user_id
                    ? "Người thực hiện"
                    : "Nhóm thực hiện"}
                </h4>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                  {stepData.assignee_user_id ? (
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={`/avatar/${stepData.assignee_user_id}.jpg`}
                        alt={stepData.assignee}
                      />
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-bold">
                        {stepData.assignee?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                      <Users className="h-4 w-4 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {stepData.assignee}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5 font-normal bg-slate-200/50 text-slate-600 hover:bg-slate-200"
                      >
                        {stepData.assignee_user_id
                          ? "Người thực hiện"
                          : "Nhóm thực hiện"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS GRID */}
            <div className="grid gap-6">
              {/* Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Thời gian xử lý
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-white">
                  <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Bắt đầu
                      </Badge>
                    </div>
                    {instance.started_at ? (
                      <div className="space-y-0.5">
                        <div className="text-[12px]">
                          {convertDateTime(instance.started_at).time}
                        </div>
                        <div className="text-[12px] text-emerald-600/80">
                          {convertDateTime(instance.started_at).date}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        --/--
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-3 border ${instance.finished_at ? "bg-blue-50/50 border-blue-100/50" : "bg-slate-50 border-slate-100"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${instance.finished_at ? "bg-blue-500" : "bg-slate-300"}`}
                        ></div>
                        Kết thúc
                      </Badge>
                    </div>
                    {instance.finished_at ? (
                      <div className="space-y-0.5">
                        <div className="text-[12px]">
                          {convertDateTime(instance.finished_at).time}
                        </div>
                        <div className="text-[12px] text-blue-600/80 px-0.5">
                          {convertDateTime(instance.finished_at).date}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        --/--/--
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Ticket Info */}

              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <IconReportMoney className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thông tin Ticket
                  </h4>
                </div>

                {/* Card */}
                <div className="bg-white ring-1 ring-slate-100 py-4 space-y-4">
                  {/* Title */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Tiêu đề</span>
                    <div className="text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {instance.ticket.title}
                    </div>
                  </div>
                  {/* Code */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Code</span>
                    <Badge className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                      #{instance.ticket.code}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Trạng thái</span>
                    <Badge
                      className={`${getStepBadgeStyles(
                        instance.ticket.status,
                      )} text-xs font-medium px-2.5 py-0.5 rounded-full`}
                    >
                      {getTranslateStatus(instance.ticket.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Instance & Flow Info */}
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Thông tin luồng
                    </h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      className="
                    text-xs font-medium 
                    bg-indigo-50 text-indigo-600 
                    border border-indigo-100
                    px-2.5 py-0.5
                    rounded-full
                  "
                    >
                      {instance.flow.name}
                    </Badge>
                  </div>
                </div>

                {/* Card */}
                <div className="rounded-xl space-y-4">
                  {/* Description */}
                  {instance.flow.description && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                      <span className="block text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                        Mô tả
                      </span>
                      {instance.flow.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollArea>
      ) : (
        /* Empty State when no instance */
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground min-h-[calc(100vh-200px)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900">
            Chưa thực hiện đến bước này
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Nhấn nút bên dưới để bắt đầu thực hiện bước
          </p>
        </div>
      )}

      {/* Fixed Action Section at Bottom - Outside ScrollArea */}
      <div className="shrink-0 pt-4 pb-2 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          {instance?.id && (
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger
                className={`${getStepBadgeStyles(selectedStatus)} h-9 text-xs border font-medium px-3 min-w-[130px]`}
              >
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleAction}
            disabled={isActionLoading}
            className="flex-1"
            variant={instance?.id ? "outline" : "default"}
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : instance?.id ? (
              <RefreshCw className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {instance?.id ? "Cập nhật trạng thái" : "Thực hiện bước"}
          </Button>
        </div>
      </div>
    </div>
  );
}
