"use client";

import TicketDetailLiveChatContext from "./ticket-detail-live-chat-tab";
import { TicketEventTimelineData } from "@/features/tickets/ticket-event/components/ticket-event-timeline-data";
import KabanTicketFlow from "./ticket-flow-chart-tab";
import { TicketTagMain } from "../../ticket-tag/components/ticket-tag-main";

const Section = ({
  title,
  children,
  minHeight,
}: {
  title?: string;
  children: React.ReactNode;
  minHeight?: string;
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${minHeight ?? ""}`}
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
  return (
    <div className="w-full bg-slate-50/50 px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 max-w-[1600px] mx-auto">
        {/* Context Section */}
        <div className="md:col-span-10 bg-white rounded-xl border border-slate-100 min-h-[400px]">
          <TicketDetailLiveChatContext />
        </div>

        {/* Flow Section */}
        <div className="md:col-span-7 bg-white rounded-xl border border-slate-100 min-h-[500px]">
          <KabanTicketFlow />
        </div>

        {/* Events Section */}
        <Section title="Luồng sự kiện" minHeight="md:col-span-3 min-h-[500px]">
          <TicketEventTimelineData />
        </Section>

        {/* Notes Section */}
        <Section title="Ghi chú" minHeight="md:col-span-3 min-h-[300px]">
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="bg-slate-100 p-3 rounded-full mb-3">
              <span className="text-xl">📝</span>
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Chưa có ghi chú nào
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Nội dung xử lý sẽ được lưu trữ tại đây
            </p>
          </div>
        </Section>

        {/* Tag Section */}
        <Section title="Quản lý Tag" minHeight="md:col-span-7 min-h-[300px]">
          <TicketTagMain />
        </Section>
      </div>
    </div>
  );
};

export default TicketDetailGrid;
