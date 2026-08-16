"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type MessagesSentBarChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function MessagesSentBarChart({
  since,
  until,
  className,
}: MessagesSentBarChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="outgoing_messages_count"
      title="Tin nhắn đi"
      description="Số tin nhắn gửi đi theo thời gian"
      seriesLabel="Tin nhắn đi"
      emptyLabel="Chưa có tin nhắn đi trong khoảng thời gian này."
      className={className}
      color="var(--chart-2)"
    />
  );
}
