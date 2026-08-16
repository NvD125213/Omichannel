"use client";

import { TimeseriesBarChart } from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";

export type ResolutionCountChartProps = {
  since: number;
  until: number;
  className?: string;
};

export function ResolutionCountChart({
  since,
  until,
  className,
}: ResolutionCountChartProps) {
  return (
    <TimeseriesBarChart
      since={since}
      until={until}
      metric="resolutions_count"
      title="Hội thoại đã giải quyết"
      description="Số hội thoại được đánh dấu đã giải quyết"
      seriesLabel="Đã giải quyết"
      emptyLabel="Chưa có hội thoại nào được giải quyết."
      className={className}
      color="var(--chart-2)"
    />
  );
}
