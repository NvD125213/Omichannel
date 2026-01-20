import {
  User,
  Clock,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  UserMinus,
  GitMerge,
  GitBranch,
  MessageSquare,
  Paperclip,
  Scissors,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  Timeline,
  TimelineBody,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";

const ActionType = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  CLOSED: "CLOSED",
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  MERGED: "MERGED",
  SPLITTED: "SPLITTED",
  COMMENTED: "COMMENTED",
  ATTACHED: "ATTACHED",
  DETACHED: "DETACHED",
};

const getEventIcon = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return <PlusCircle className="h-4 w-4" />;
    case ActionType.UPDATED:
      return <RefreshCw className="h-4 w-4" />;
    case ActionType.CLOSED:
      return <CheckCircle2 className="h-4 w-4" />;
    case ActionType.ASSIGNED:
      return <UserPlus className="h-4 w-4" />;
    case ActionType.UNASSIGNED:
      return <UserMinus className="h-4 w-4" />;
    case ActionType.MERGED:
      return <GitMerge className="h-4 w-4" />;
    case ActionType.SPLITTED:
      return <GitBranch className="h-4 w-4" />;
    case ActionType.COMMENTED:
      return <MessageSquare className="h-4 w-4" />;
    case ActionType.ATTACHED:
      return <Paperclip className="h-4 w-4" />;
    case ActionType.DETACHED:
      return <Scissors className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

const getEventBadgeStyles = (type: string) => {
  switch (type) {
    case ActionType.CREATED:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case ActionType.UPDATED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case ActionType.CLOSED:
      return "bg-purple-50 text-purple-700 border-purple-200";
    case ActionType.ASSIGNED:
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case ActionType.COMMENTED:
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export function TicketEventTimelineData() {
  return (
    <Timeline color="secondary" orientation="vertical" className="w-full">
      <TimelineItem>
        <TimelineHeader>
          <TimelineSeparator />
          <TimelineIcon>{getEventIcon(ActionType.CREATED)}</TimelineIcon>
        </TimelineHeader>
        <TimelineBody className="-translate-y-1.5 pt-0 pb-8">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getEventBadgeStyles(ActionType.CREATED)} text-[10px] px-2 py-0 h-5 font-semibold`}
              >
                CREATED
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0 h-5 font-semibold"
              >
                ADMIN
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm leading-none font-bold text-slate-900">
                Khởi tạo Ticket hỗ trợ
              </h3>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3 w-3" />
                <span className="text-[11px] font-medium">
                  12:30 PM, 20/01/2026
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Hệ thống đã tự động tạo ticket từ cuộc hội thoại Facebook
              Messenger của khách hàng Nguyễn Văn A.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="bg-slate-100 p-1.5 rounded-full">
                <User className="h-3 w-3 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Nguyễn Văn A
              </span>
            </div>
          </div>
        </TimelineBody>
      </TimelineItem>

      <TimelineItem>
        <TimelineHeader>
          <TimelineSeparator />
          <TimelineIcon>{getEventIcon(ActionType.UPDATED)}</TimelineIcon>
        </TimelineHeader>
        <TimelineBody className="-translate-y-1.5 pt-0 pb-8">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getEventBadgeStyles(ActionType.UPDATED)} text-[10px] px-2 py-0 h-5 font-semibold`}
              >
                UPDATED
              </Badge>
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-2 py-0 h-5 font-semibold"
              >
                SYSTEM
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm leading-none font-bold text-slate-900">
                Gán người phụ trách
              </h3>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3 w-3" />
                <span className="text-[11px] font-medium">
                  12:45 PM, 20/01/2026
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Ticket được gán cho Admin Trần Thị B để xử lý.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="bg-slate-100 p-1.5 rounded-full">
                <User className="h-3 w-3 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                System Bot
              </span>
            </div>
          </div>
        </TimelineBody>
      </TimelineItem>

      <TimelineItem>
        <TimelineHeader>
          <TimelineIcon>{getEventIcon(ActionType.CLOSED)}</TimelineIcon>
        </TimelineHeader>
        <TimelineBody className="-translate-y-1.5 pt-0">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getEventBadgeStyles(ActionType.CLOSED)} text-[10px] px-2 py-0 h-5 font-semibold`}
              >
                CLOSED
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm leading-none font-bold text-slate-900">
                Đóng Ticket
              </h3>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3 w-3" />
                <span className="text-[11px] font-medium">
                  01:15 PM, 20/01/2026
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Ticket đã hoàn thành và được đóng lại sau khi khách hàng xác nhận
              hài lòng.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="bg-slate-100 p-1.5 rounded-full">
                <User className="h-3 w-3 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Trần Thị B
              </span>
            </div>
          </div>
        </TimelineBody>
      </TimelineItem>
    </Timeline>
  );
}
