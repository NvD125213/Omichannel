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
import { useGetTicketEvents } from "@/hooks/ticket/ticket-events/use-ticket-event";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useListUser } from "@/hooks/user/use-list-user";

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
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const { data: eventsData } = useGetTicketEvents({
    ticket_id: ticketId,
    page: 1,
    page_size: 50, // Fetch more to show history
  });

  const events: any[] = eventsData?.data.data.ticket_events || [];

  if (!ticketId) return null;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <p className="text-sm">Chưa có sự kiện nào</p>
      </div>
    );
  }

  return (
    <Timeline color="secondary" orientation="vertical" className="w-full">
      {events.map((event) => (
        <TimelineItem key={event.id}>
          <TimelineHeader>
            <TimelineSeparator />
            <TimelineIcon>{getEventIcon(event.event_type)}</TimelineIcon>
          </TimelineHeader>
          <TimelineBody className="-translate-y-1.5 pt-0 pb-8">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${getEventBadgeStyles(event.event_type)} text-[10px] px-2 py-0 h-5 font-semibold`}
                >
                  {event.event_type}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-2 py-0 h-5 font-semibold uppercase"
                >
                  {event.actor_type}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm leading-none font-bold text-slate-900">
                  {event.payload?.title || event.event_type}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px] font-medium">
                    {event.created_at
                      ? format(
                          new Date(event.created_at),
                          "hh:mm a, dd/MM/yyyy",
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Render dynamic description based on payload if available, or static fallback */}
              <div>
                {event.payload?.priority && (
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Độ ưu tiên: {event.payload.priority}
                  </p>
                )}

                {/* Generic payload display for other fields if needed, simplified for now */}
                {event.payload?.title && (
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {event.payload.title}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="bg-slate-100 p-1.5 rounded-full">
                  <User className="h-3 w-3 text-slate-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">admin</span>
              </div>
            </div>
          </TimelineBody>
        </TimelineItem>
      ))}

      <TimelineItem className="min-h-0">
        <TimelineHeader>
          <TimelineIcon>
            <div className="h-2 w-2 rounded-full bg-slate-300 ring-4 ring-slate-50" />
          </TimelineIcon>
        </TimelineHeader>
        <TimelineBody className="pt-0 pb-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Hết chuỗi sự kiện
          </span>
        </TimelineBody>
      </TimelineItem>
    </Timeline>
  );
}
