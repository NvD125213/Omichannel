"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type ConversationBarChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function ConversationBarChart({
  since,
  until,
  className,
}: ConversationBarChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="conversations_count"
      title="Hội thoại"
      description="Số hội thoại theo thời gian"
      seriesLabel="Hội thoại"
      emptyLabel="Chưa có hội thoại trong khoảng thời gian này."
      className={className}
      color="var(--chart-1)"
    />
  );
}
