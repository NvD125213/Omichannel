"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type CustomerWaitingTimeChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function CustomerWaitingTimeChart({
  since,
  until,
  className,
}: CustomerWaitingTimeChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="reply_time"
      title="Thời gian chờ của khách"
      description="Thời gian phản hồi trung bình (reply time)"
      seriesLabel="Thời gian chờ"
      valueKind="duration"
      emptyLabel="Chưa có dữ liệu thời gian chờ."
      className={className}
      color="var(--chart-1)"
    />
  );
}
