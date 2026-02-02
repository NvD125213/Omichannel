"use client";

import TicketDetailLiveChatContext from "../../ticket-context/components/ticket-context-board-data";
import { TicketEventTimelineData } from "@/features/tickets/ticket-event/components/ticket-event-timeline-data";
import { TicketTagMain } from "../../ticket-tag/components/ticket-tag-main";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { IconReportMoney } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import TicketFlowStepper from "../../ticket-flow-step/components/ticket-flow-stepper";

import { useParams } from "next/navigation";
import { useGetTicketById } from "@/hooks/ticket/ticket-list/use-ticket-list";
import { TemplateDetail } from "@/features/tickets/ticket-template/components";

const Section = ({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

const TicketDetailGrid = () => {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const { data: ticketData } = useGetTicketById(ticketId);
  const ticket = ticketData?.data;

  return (
    <div className="w-full bg-slate-50/50 px-4 py-6">
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

      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 max-w-[1600px] mx-auto">
        {/* ===== Row 1: Context (6) + Event (4) ===== */}
        <div className="md:col-span-6 bg-white rounded-xl border border-slate-100 min-h-[300px]">
          <TicketDetailLiveChatContext ticketId={ticketId} />
        </div>

        <Section title="Luồng sự kiện" className="md:col-span-4">
          <TicketEventTimelineData />
        </Section>

        {/* ===== Row 2: Flow (full row) ===== */}
        <Section title="Luồng hoạt động ticket" className="md:col-span-10">
          <TicketFlowStepper
            ticket_id={ticketId}
            flow_id={ticket?.flow_id || ""}
          />
        </Section>

        {/* ===== Row 3: Template (4) + Tag (6) ===== */}
        <Section title="Thông tin template" className="md:col-span-4">
          <TemplateDetail
            templateId={ticket?.template_id || ""}
            ticketId={ticketId}
          />
        </Section>

        <Section title="Quản lý Tag" className="md:col-span-6">
          <TicketTagMain />
        </Section>
      </div>
    </div>
  );
};

export default TicketDetailGrid;
