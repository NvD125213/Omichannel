"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type MessagesReceivedBarChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function MessagesReceivedBarChart({
  since,
  until,
  className,
}: MessagesReceivedBarChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="incoming_messages_count"
      title="Tin nhắn đến"
      description="Số tin nhắn nhận vào theo thời gian"
      seriesLabel="Tin nhắn đến"
      emptyLabel="Chưa có tin nhắn đến trong khoảng thời gian này."
      className={className}
      color="var(--chart-3)"
    />
  );
}
