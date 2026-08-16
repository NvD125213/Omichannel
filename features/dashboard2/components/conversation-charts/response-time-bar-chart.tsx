"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type ResponseTimeBarChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function ResponseTimeBarChart({
  since,
  until,
  className,
}: ResponseTimeBarChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="avg_first_response_time"
      title="Thời gian phản hồi đầu tiên"
      description="RTT trung bình theo thời gian"
      seriesLabel="RTT"
      valueKind="duration"
      emptyLabel="Chưa có dữ liệu thời gian phản hồi."
      className={className}
      color="var(--chart-4)"
    />
  );
}
