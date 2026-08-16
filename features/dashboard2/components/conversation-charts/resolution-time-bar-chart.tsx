"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type ResolutionTimeBarChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function ResolutionTimeBarChart({
  since,
  until,
  className,
}: ResolutionTimeBarChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="avg_resolution_time"
      title="Thời gian giải quyết"
      description="ATTD trung bình theo thời gian"
      seriesLabel="ATTD"
      valueKind="duration"
      emptyLabel="Chưa có dữ liệu thời gian giải quyết."
      className={className}
      color="var(--chart-5)"
    />
  );
}
