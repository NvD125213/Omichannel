"use client";

import {
  GroupedSummaryBarChart,
  type GroupedSummaryBarChartProps,
} from "@/features/dashboard2/components/agent-charts/agent-horizontal-bar-chart";

export type InboxHorizontalBarChartProps = Omit<
  GroupedSummaryBarChartProps,
  "kind"
>;

export function InboxHorizontalBarChart(props: InboxHorizontalBarChartProps) {
  return <GroupedSummaryBarChart kind="inbox" {...props} />;
}
