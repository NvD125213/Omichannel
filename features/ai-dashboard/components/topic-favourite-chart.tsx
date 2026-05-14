"use client";

import { topicFavouritesChartConstants } from "@/constants/dashboard/topic-favourites-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

type PeriodValue =
  (typeof topicFavouritesChartConstants.filters.periods)[number]["value"];
type RankingKey = "top5" | "top10" | "top20";

const BAR_GREEN = "#23a464";

const BAR_MOTION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 900,
  animationEasing: "ease-out" as const,
};

const chartConfig = {
  sessions: {
    label: "Số phiên",
    color: BAR_GREEN,
  },
};

function truncateTopic(label: string, max = 26) {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function sumTop20Sessions(periodKey: "month" | "year") {
  return topicFavouritesChartConstants[periodKey].top20.reduce(
    (acc, row) => acc + row.sessions,
    0,
  );
}

function formatAxisTick(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function SessionsEndLabel(props: {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  value?: number | string;
}) {
  const x = Number.parseFloat(String(props.x ?? ""));
  const y = Number.parseFloat(String(props.y ?? ""));
  const wBar = Number.parseFloat(String(props.width ?? ""));
  const h = Number.parseFloat(String(props.height ?? ""));
  const value =
    typeof props.value === "number"
      ? props.value
      : Number.parseFloat(String(props.value ?? ""));
  if (
    Number.isNaN(x) ||
    Number.isNaN(y) ||
    Number.isNaN(h) ||
    Number.isNaN(value)
  ) {
    return null;
  }
  const textX = Number.isNaN(wBar) || wBar <= 0 ? x + 8 : x + wBar + 8;
  const text = value.toLocaleString("vi-VN");
  return (
    <text
      x={textX}
      y={y + h / 2}
      dy="0.35em"
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      textAnchor="start"
    >
      {text}
    </text>
  );
}

export function TopicFavouriteChart({ className }: { className?: string }) {
  const [periodValue, setPeriodValue] = useState<PeriodValue>("2026-05");
  const [ranking, setRanking] = useState<RankingKey>("top10");

  const periodKey: "month" | "year" = useMemo(() => {
    const meta = topicFavouritesChartConstants.filters.periods.find(
      (p) => p.value === periodValue,
    );
    return meta?.type === "year" ? "year" : "month";
  }, [periodValue]);

  const rankingCount = useMemo(() => {
    if (ranking === "top5") return 5;
    if (ranking === "top10") return 10;
    return 20;
  }, [ranking]);

  const totalResults = useMemo(() => sumTop20Sessions(periodKey), [periodKey]);

  const { data, domainMax } = useMemo(() => {
    const rows = topicFavouritesChartConstants[periodKey][ranking];
    const ordered = [...rows].sort((a, b) => b.rank - a.rank);
    const maxSessions = Math.max(...ordered.map((r) => r.sessions), 0);
    const step =
      maxSessions <= 2500 ? 500 : Math.ceil(maxSessions / 5 / 1000) * 1000;
    const niceMax = Math.max(step * 5, Math.ceil(maxSessions / step) * step);
    return {
      data: ordered.map((r) => ({
        topicShort: truncateTopic(r.topic),
        topic: r.topic,
        sessions: r.sessions,
      })),
      domainMax: niceMax || 1000,
    };
  }, [periodKey, ranking]);

  const periodLabel = useMemo(
    () =>
      topicFavouritesChartConstants.filters.periods.find(
        (p) => p.value === periodValue,
      )?.label ?? "",
    [periodValue],
  );

  const chartHeight = useMemo(() => {
    const padding = 88;
    const perBar = 42;
    return Math.min(720, Math.max(300, padding + rankingCount * perBar));
  }, [rankingCount]);

  return (
    <Card
      className={cn(
        "border-border/50 bg-linear-to-br from-violet-500/5 via-background to-background shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Biểu đồ chủ đề</p>
          <CardTitle className="text-xl leading-tight sm:text-2xl">
            Thống kê top {rankingCount} theo chủ đề yêu thích
          </CardTitle>
          <CardDescription className="text-sm">
            {periodLabel} · Tổng chủ đề{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {totalResults.toLocaleString("vi-VN")}
            </span>{" "}
            kết quả
          </CardDescription>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px] sm:items-end">
          <Select
            value={periodValue}
            onValueChange={(v) => setPeriodValue(v as PeriodValue)}
          >
            <SelectTrigger
              size="sm"
              className="rounded-full border-border/60 bg-background/80 sm:w-[200px]"
            >
              <SelectValue placeholder="Chọn kỳ" />
            </SelectTrigger>
            <SelectContent>
              {topicFavouritesChartConstants.filters.periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ranking}
            onValueChange={(v) => setRanking(v as RankingKey)}
          >
            <SelectTrigger
              size="sm"
              className="rounded-full border-border/60 bg-muted/60 dark:bg-muted/30 sm:w-[200px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="top5">Top 5 chủ đề</SelectItem>
              <SelectItem value="top10">Top 10 chủ đề</SelectItem>
              <SelectItem value="top20">Top 20 chủ đề</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full [&_.recharts-surface]:outline-none"
          style={{ height: chartHeight }}
        >
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 56, left: 4, bottom: 28 }}
            barCategoryGap="18%"
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="4 4"
              className="stroke-muted/50"
            />
            <XAxis
              type="number"
              dataKey="sessions"
              domain={[0, domainMax]}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="topicShort"
              width={148}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-48 rounded-xl border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80"
                  formatter={(value) => [
                    typeof value === "number"
                      ? value.toLocaleString("vi-VN")
                      : String(value ?? ""),
                    " Phiên chat",
                  ]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { topic?: string };
                    return row?.topic ?? "";
                  }}
                />
              }
            />
            <Bar
              dataKey="sessions"
              name={chartConfig.sessions.label}
              fill="var(--color-sessions)"
              radius={[0, 10, 10, 0]}
              barSize={22}
              maxBarSize={28}
              {...BAR_MOTION}
            >
              <LabelList
                dataKey="sessions"
                content={(props) => <SessionsEndLabel {...props} />}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
