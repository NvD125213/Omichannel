"use client";

import { statisticOnUserChartConstants } from "@/constants/dashboard/statistic-on-user-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type PeriodKey = "6m" | "q1" | "q2";

const chartConfig = {
  students: { label: "Học sinh", color: "#8B2CF5" },
  teachers: { label: "Giáo viên", color: "#A97AE8" },
  parents: { label: "Phụ huynh", color: "#BFA6E6" },
  others: { label: "Khác", color: "#D8C7EE" },
};

const MONTH_SHORT: Record<string, string> = {
  "Tháng 1": "JAN",
  "Tháng 2": "FEB",
  "Tháng 3": "MAR",
  "Tháng 4": "APR",
  "Tháng 5": "MAY",
  "Tháng 6": "JUN",
  "Tháng 7": "JUL",
  "Tháng 8": "AUG",
  "Tháng 9": "SEP",
  "Tháng 10": "OCT",
  "Tháng 11": "NOV",
  "Tháng 12": "DEC",
};

const BAR_MOTION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 900,
  animationEasing: "ease-out" as const,
};

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return `${value}`;
}

function getYAxisMax(values: number[]) {
  const rawMax = Math.max(...values, 0);
  const step = 125_000;
  return Math.max(step, Math.ceil(rawMax / step) * step);
}

export function StatisticOnUserChart() {
  const [period, setPeriod] = useState<PeriodKey>("6m");

  const data = useMemo(() => {
    const source = statisticOnUserChartConstants.last6Months;
    const filtered =
      period === "q1"
        ? source.filter((item) => item.quarter === "Q1-2026")
        : period === "q2"
          ? source.filter((item) => item.quarter === "Q2-2026")
          : source;

    return filtered.map((item) => ({
      ...item,
      shortMonth: MONTH_SHORT[item.month] ?? item.month,
    }));
  }, [period]);

  const yAxisMax = useMemo(
    () => getYAxisMax(data.map((item) => item.total)),
    [data],
  );

  return (
    <Card className="border-border/50 bg-linear-to-br from-violet-500/5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Thống kê</p>
            <CardTitle className="text-2xl leading-tight lg:text-2xl">
              Đối tượng sử dụng
            </CardTitle>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {statisticOnUserChartConstants.legend.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-foreground sm:text-sm">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as PeriodKey)}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="q1">Q1 2026</SelectItem>
                <SelectItem value="q2">Q2 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 sm:pt-4">
        <ChartContainer
          config={chartConfig}
          className="h-[280px] w-full sm:h-[330px] lg:h-[380px]"
        >
          <BarChart
            data={data}
            margin={{ top: 8, right: 0, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              className="stroke-muted/40"
            />
            <XAxis
              dataKey="shortMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              minTickGap={12}
            />
            <YAxis
              width={44}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              domain={[0, yAxisMax]}
              tickFormatter={formatYAxis}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-52 rounded-xl border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80"
                  indicator="dot"
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.periodLabel
                      ? `Kỳ: ${payload[0].payload.periodLabel}`
                      : undefined
                  }
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground text-xs font-medium">
                        {name}
                      </span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {Number(value).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="students"
              stackId="usage"
              fill="var(--color-students)"
              {...BAR_MOTION}
            />
            <Bar
              dataKey="teachers"
              stackId="usage"
              fill="var(--color-teachers)"
              {...BAR_MOTION}
            />
            <Bar
              dataKey="parents"
              stackId="usage"
              fill="var(--color-parents)"
              {...BAR_MOTION}
            />
            <Bar
              dataKey="others"
              stackId="usage"
              fill="var(--color-others)"
              {...BAR_MOTION}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
