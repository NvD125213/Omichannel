"use client";

import {
  GroupedSummaryBarChart,
  type GroupedSummaryBarChartProps,
} from "@/features/dashboard2/components/agent-charts/agent-horizontal-bar-chart";

export type TeamHorizontalBarChartProps = Omit<
  GroupedSummaryBarChartProps,
  "kind"
>;

export function TeamHorizontalBarChart(props: TeamHorizontalBarChartProps) {
  return <GroupedSummaryBarChart kind="team" {...props} />;
}
