"use client";

import TicketDetailLiveChatContext from "../../ticket-context/components/ticket-context-board-data";
import { TicketEventTimelineData } from "@/features/tickets/ticket-event/components/ticket-event-timeline-data";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home } from "lucide-react";
import { IconReportMoney } from "@tabler/icons-react";
import TicketFlowStepper from "../../ticket-flow-step/components/ticket-flow-stepper";

import { useParams } from "next/navigation";
import { useGetTicketById } from "@/hooks/ticket/ticket-list/use-ticket-list";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Section = ({
  title,
  children,
  className = "",
  contentClassName = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) => {
  return (
    <Card
      className={cn(
        "bg-white dark:bg-transparent rounded-xl overflow-hidden flex flex-col gap-0 py-0 shadow-sm border-border/60",
        className,
      )}
    >
      {title && (
        <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            {title}
          </h3>
        </div>
      )}
      <div
        className={cn("p-2 flex-1 min-h-0 overflow-hidden", contentClassName)}
      >
        {children}
      </div>
    </Card>
  );
};

const TicketDetailGrid = () => {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const { data: ticketData } = useGetTicketById(ticketId);
  const ticket = ticketData?.data;

  return (
    <div className="w-full bg-transparent px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 py-4">
        <AppBreadcrumb
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "Tickets",
              href: "/tickets",
              icon: <IconReportMoney className="size-4" />,
            },
            { label: "Chi tiết ticket", href: "/tickets/:ticketId" },
          ]}
        />
      </div>

      {/* 2 cột 7:3 — trái: Flow + Context (mỗi 50% chiều cao), phải: Timeline (100% chiều cao) */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 max-w-full md:h-screen">
        {/* Cột trái 70% — Flow + Context xếp dọc, Flow 60% và Context 40% */}
        <div className="md:col-span-7 flex flex-col gap-4 min-h-screen md:h-full">
          <Section
            title="Luồng hoạt động ticket"
            className="flex-6 min-h-0"
            contentClassName="p-3"
          >
            <TicketFlowStepper
              ticket_id={ticketId}
              flow_id={ticket?.flow_id || ""}
            />
          </Section>
          <Section title="Bối cảnh ticket" className="flex-4 min-h-0">
            <TicketDetailLiveChatContext ticketId={ticketId} />
          </Section>
        </div>

        {/* Cột phải 30% — Timeline full height */}
        <Section
          title="Luồng sự kiện"
          className="md:col-span-3 min-h-0 h-[50vh] md:h-full"
        >
          <TicketEventTimelineData />
        </Section>
      </div>
    </div>
  );
};

export default TicketDetailGrid;
