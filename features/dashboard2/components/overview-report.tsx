"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HintTooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import {
  useGetCsatResponses,
  useGetReportsOverview,
} from "@/hooks/reports/use-reports";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  CircleHelp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Frown,
  Laugh,
  Meh,
  MessageSquare,
  MessageSquareText,
  MessagesSquare,
  Angry,
  Smile,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import type { ReportsOverviewCsat } from "@/services/reports/service";

export type OverviewReportProps = {
  since: number;
  until: number;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d} ngày ${h} giờ` : `${d} ngày`;
};

const liveChartConfig = {
  count: { label: "Hội thoại" },
  open: { label: "Đang mở", color: "var(--chart-1)" },
  unattended: { label: "Chưa xử lý", color: "var(--chart-3)" },
  unassigned: { label: "Chưa gán", color: "var(--chart-5)" },
  pending: { label: "Đang chờ", color: "var(--chart-4)" },
} satisfies ChartConfig;

const CSAT_LEVELS: {
  rating: number;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  barClass: string;
  trackClass: string;
}[] = [
  {
    rating: 5,
    label: "Xuất sắc",
    icon: Laugh,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    barClass: "bg-emerald-600/80",
    trackClass: "bg-emerald-600/15",
  },
  {
    rating: 4,
    label: "Tốt",
    icon: Smile,
    iconClass: "text-teal-600 dark:text-teal-400",
    barClass: "bg-teal-600/75",
    trackClass: "bg-teal-600/15",
  },
  {
    rating: 3,
    label: "Trung bình",
    icon: Meh,
    iconClass: "text-stone-500 dark:text-stone-400",
    barClass: "bg-stone-500/70",
    trackClass: "bg-stone-500/15",
  },
  {
    rating: 2,
    label: "Kém",
    icon: Frown,
    iconClass: "text-orange-600 dark:text-orange-400",
    barClass: "bg-orange-600/70",
    trackClass: "bg-orange-600/15",
  },
  {
    rating: 1,
    label: "Rất kém",
    icon: Angry,
    iconClass: "text-rose-700 dark:text-rose-400",
    barClass: "bg-rose-700/75",
    trackClass: "bg-rose-700/15",
  },
];

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;

type MetricItem = {
  label: string;
  helpText?: string;
  value: string;
  unit?: string;
  previousLabel: string;
  growth: number | null;
  lowerIsBetter?: boolean;
  icon: typeof MessagesSquare;
  iconBg: string;
  iconColor: string;
};

type MetricsGridItem =
  | { type: "single"; metric: MetricItem }
  | { type: "double"; metrics: [MetricItem, MetricItem] }
  | { type: "triple"; metrics: [MetricItem, MetricItem, MetricItem] };

const calcGrowth = (current: number, previous: number | undefined) => {
  if (previous == null || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
};

function GrowthBadge({
  growth,
  lowerIsBetter,
}: {
  growth: number;
  lowerIsBetter?: boolean;
}) {
  const isPositive = lowerIsBetter ? growth <= 0 : growth >= 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto shrink-0 px-1.5 py-0.5 text-[11px] leading-none @min-[13rem]/metric:px-2 @min-[13rem]/metric:py-0.5 @min-[13rem]/metric:text-xs",
        isPositive
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400",
      )}
    >
      {growth >= 0 ? (
        <TrendingUp
          className="me-0.5 size-2.5 @min-[13rem]/metric:me-1 @min-[13rem]/metric:size-3"
          aria-hidden="true"
        />
      ) : (
        <TrendingDown
          className="me-0.5 size-2.5 @min-[13rem]/metric:me-1 @min-[13rem]/metric:size-3"
          aria-hidden="true"
        />
      )}
      <span translate="no">
        {growth >= 0 ? "+" : ""}
        {growth.toFixed(1)}%
      </span>
    </Badge>
  );
}

function MetricBody({ metric }: { metric: MetricItem }) {
  const Icon = metric.icon;

  return (
    <div className="@container/metric flex min-w-0 flex-1 flex-col gap-2.5 @min-[13rem]/metric:gap-3 @min-[18rem]/metric:gap-4">
      <div className="flex items-start justify-between gap-2 @min-[13rem]/metric:items-center">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-muted-foreground min-w-0 text-pretty text-sm font-medium leading-snug @min-[13rem]/metric:text-base @min-[18rem]/metric:text-[18px]">
            {metric.label}
          </p>
          {metric.helpText ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground/80 hover:text-foreground inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors @min-[13rem]/metric:size-4.5"
                    aria-label={`Giải thích ${metric.label}`}
                  >
                    <CircleHelp className="size-3.5 @min-[13rem]/metric:size-4" />
                  </button>
                </TooltipTrigger>
                <HintTooltipContent side="top" align="start" sideOffset={6}>
                  {metric.helpText}
                </HintTooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {metric.growth != null && (
          <GrowthBadge
            growth={metric.growth}
            lowerIsBetter={metric.lowerIsBetter}
          />
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2 @min-[13rem]/metric:gap-2.5 @min-[18rem]/metric:gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg @min-[13rem]/metric:size-9 @min-[18rem]/metric:size-10 @min-[18rem]/metric:rounded-xl",
            metric.iconBg,
          )}
        >
          <Icon
            className={cn(
              "size-4 @min-[13rem]/metric:size-4.5 @min-[18rem]/metric:size-5",
              metric.iconColor,
            )}
            aria-hidden="true"
          />
        </div>
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5 leading-tight @min-[13rem]/metric:gap-x-1.5">
          <span
            className="text-[clamp(1.15rem,7.8cqi,1.9rem)] font-bold tabular-nums tracking-tight"
            translate="no"
          >
            {metric.value}
          </span>
          {metric.unit ? (
            <span className="text-muted-foreground text-[clamp(0.7rem,2.7cqi,0.95rem)] font-medium">
              {metric.unit}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex items-center justify-end">
        <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[11px] leading-snug @min-[13rem]/metric:gap-1.5 @min-[13rem]/metric:px-2.5 @min-[13rem]/metric:py-1 @min-[13rem]/metric:text-xs dark:bg-muted/40">
          <span className="text-muted-foreground">Kỳ trước</span>
          <span className="font-semibold tabular-nums" translate="no">
            {metric.previousLabel}
          </span>
          {metric.unit ? (
            <span className="text-muted-foreground">{metric.unit}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function MetricCell({ metric }: { metric: MetricItem }) {
  return (
    <Card className="@container/card h-full min-w-0 border-border/50 bg-card py-0 shadow-sm">
      <CardContent className="p-3 @min-[16rem]/card:p-4 @min-[24rem]/card:p-5">
        <MetricBody metric={metric} />
      </CardContent>
    </Card>
  );
}

function StreamConnector() {
  return (
    <>
      {/* Mobile: nối ngang */}
      <div
        className="flex h-6 w-full items-center @min-[28rem]/card:h-8 sm:hidden"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="mx-1.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm @min-[28rem]/card:mx-2 @min-[28rem]/card:size-6">
          <ChevronDown className="size-3 @min-[28rem]/card:size-3.5" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* Desktop: nối dọc giữa 2 cột */}
      <div
        className="hidden w-4 shrink-0 flex-col items-center self-stretch sm:flex @min-[28rem]/card:w-6 @min-[40rem]/card:w-8"
        aria-hidden="true"
      >
        <span className="w-px flex-1 bg-gradient-to-b from-transparent to-border" />
        <span className="my-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm @min-[28rem]/card:size-6">
          <ChevronRight className="size-3 @min-[28rem]/card:size-3.5" />
        </span>
        <span className="w-px flex-1 bg-gradient-to-b from-border to-transparent" />
      </div>
    </>
  );
}

function TripleMetricCard({
  metrics,
}: {
  metrics: [MetricItem, MetricItem, MetricItem];
}) {
  return (
    <Card className="@container/card h-full min-w-0 border-border/50 bg-card py-0 shadow-sm">
      <CardContent className="flex flex-col p-3 @min-[16rem]/card:p-4 @min-[24rem]/card:p-5 sm:flex-row sm:items-stretch sm:gap-0">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="contents">
            <MetricBody metric={metric} />
            {index < metrics.length - 1 && <StreamConnector />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DoubleMetricCard({ metrics }: { metrics: [MetricItem, MetricItem] }) {
  return (
    <Card className="@container/card h-full min-w-0 border-border/50 bg-card py-0 shadow-sm">
      <CardContent className="flex flex-col p-3 @min-[16rem]/card:p-4 @min-[24rem]/card:p-5 sm:flex-row sm:items-stretch sm:gap-0">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="contents">
            <MetricBody metric={metric} />
            {index < metrics.length - 1 && <StreamConnector />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const METRIC_SPAN_CLASS = {
  single: "min-w-0 xl:col-span-1",
  double: "min-w-0 xl:col-span-2",
  triple: "min-w-0 xl:col-span-3",
} as const;

function MetricsGrid({ items }: { items: MetricsGridItem[] }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-6"
      role="list"
      aria-label="Chỉ số tổng quan"
    >
      {items.map((item) =>
        item.type === "single" ? (
          <div
            key={item.metric.label}
            role="listitem"
            className={METRIC_SPAN_CLASS.single}
          >
            <MetricCell metric={item.metric} />
          </div>
        ) : item.type === "double" ? (
          <div
            key={item.metrics.map((m) => m.label).join("-")}
            role="listitem"
            className={METRIC_SPAN_CLASS.double}
          >
            <DoubleMetricCard metrics={item.metrics} />
          </div>
        ) : item.type === "triple" ? (
          <div
            key={item.metrics.map((m) => m.label).join("-")}
            role="listitem"
            className={METRIC_SPAN_CLASS.triple}
          >
            <TripleMetricCard metrics={item.metrics} />
          </div>
        ) : null,
      )}
    </div>
  );
}

function CsatOverview({
  csat,
  onShowDetail,
}: {
  csat: ReportsOverviewCsat;
  onShowDetail: () => void;
}) {
  const distribution = CSAT_LEVELS.map((level) => {
    const count = csat.ratings_count[String(level.rating)] ?? 0;
    const percentage =
      csat.total_count > 0 ? (count / csat.total_count) * 100 : 0;

    return {
      ...level,
      count,
      percentage,
    };
  });

  const positiveCount =
    (csat.ratings_count["4"] ?? 0) + (csat.ratings_count["5"] ?? 0);
  const satisfactionScore =
    csat.total_count > 0 ? (positiveCount / csat.total_count) * 100 : 0;
  const responseRate =
    csat.total_sent_messages_count > 0
      ? (csat.total_count / csat.total_sent_messages_count) * 100
      : 0;
  const averageScore =
    csat.total_count > 0
      ? Object.entries(csat.ratings_count).reduce(
          (sum, [rating, count]) => sum + Number(rating) * count,
          0,
        ) / csat.total_count
      : null;

  return (
    <section
      className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-10"
      aria-label="Tổng quan CSAT"
    >
      {/* Cột trái — điểm lớn + meta */}
      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
              Điểm CSAT
            </p>
            <button
              type="button"
              onClick={onShowDetail}
              className="text-primary inline-flex items-center gap-0.5 text-[11px] font-medium tracking-[0.14em] uppercase hover:underline"
            >
              Chi tiết
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <p
              className="text-6xl font-bold leading-none tracking-tighter tabular-nums sm:text-7xl"
              translate="no"
            >
              {averageScore != null ? averageScore.toFixed(1) : "—"}
            </p>
            <span className="text-muted-foreground mb-1.5 text-lg font-medium tabular-nums">
              / 5
            </span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-[18rem] text-sm text-pretty">
            Trung bình từ {formatNumber(csat.total_count)} phản hồi khách hàng
            trong kỳ.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
          <div className="min-w-0">
            <dt
              className="text-muted-foreground truncate text-[11px] font-medium tracking-wide"
              title="Số lượt khách hàng đã đánh giá"
            >
              Phản hồi
            </dt>
            <dd
              className="mt-1 text-xl font-semibold tabular-nums tracking-tight"
              translate="no"
            >
              {formatNumber(csat.total_count)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt
              className="text-muted-foreground truncate text-[11px] font-medium tracking-wide"
              title="Tỷ lệ đánh giá 4–5 sao"
            >
              Hài lòng
            </dt>
            <dd
              className="mt-1 text-xl font-semibold tabular-nums tracking-tight"
              translate="no"
            >
              {formatPercent(satisfactionScore)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt
              className="text-muted-foreground truncate text-[11px] font-medium tracking-wide"
              title="Phản hồi / khảo sát đã gửi"
            >
              Tỷ lệ PH
            </dt>
            <dd
              className="mt-1 text-xl font-semibold tabular-nums tracking-tight"
              translate="no"
            >
              {formatPercent(responseRate)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Cột phải — phân bố dạng hàng */}
      <div className="min-w-0">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
            Phân bố
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            Gửi {formatNumber(csat.total_sent_messages_count)} khảo sát
          </p>
        </div>

        <ul className="space-y-3.5" aria-label="Phân bố điểm đánh giá">
          {distribution.map((item) => {
            const LevelIcon = item.icon;

            return (
              <li key={item.rating} className="min-w-0 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <LevelIcon
                      className={cn("size-4 shrink-0", item.iconClass)}
                      aria-hidden="true"
                    />
                    <span
                      className="text-muted-foreground w-4 shrink-0 text-sm font-semibold tabular-nums"
                      translate="no"
                    >
                      {item.rating}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="text-sm font-semibold" translate="no">
                      {formatPercent(item.percentage)}
                    </span>
                    <span
                      className="text-muted-foreground w-6 text-right text-xs"
                      translate="no"
                    >
                      {formatNumber(item.count)}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "h-1.5 overflow-hidden rounded-full",
                    item.trackClass,
                  )}
                  role="img"
                  aria-label={`${item.label}: ${formatPercent(item.percentage)}`}
                >
                  <div
                    className={cn("h-full rounded-full", item.barClass)}
                    style={{ width: `${Math.max(item.percentage, 0)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

type CsatResponseRow = {
  id: string;
  rating: number | null;
  feedback: string;
  conversationId: string;
  createdAt: number | null;
  contactName: string;
  contactEmail: string;
  agentName: string;
  agentEmail: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractCsatResponseList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of ["messaging", "payload", "data", "responses", "csat"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    if (nested && Array.isArray(nested.payload)) return nested.payload;
    if (nested && Array.isArray(nested.data)) return nested.data;
  }

  return [];
}

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function parseCsatPagination(
  payload: unknown,
  requestedPage: number,
  rowCount: number,
) {
  const root = asRecord(payload);
  const messaging = asRecord(root?.messaging);
  const meta =
    asRecord(root?.meta) ??
    asRecord(root?.pagination) ??
    asRecord(messaging?.meta) ??
    asRecord(messaging?.pagination);

  const page =
    toPositiveInt(meta?.current_page) ??
    toPositiveInt(meta?.page) ??
    requestedPage;
  const total =
    toPositiveInt(meta?.count) ??
    toPositiveInt(meta?.total) ??
    toPositiveInt(meta?.total_count);
  const pageSize =
    toPositiveInt(meta?.per_page) ??
    toPositiveInt(meta?.page_size) ??
    toPositiveInt(meta?.limit);
  const totalPages =
    toPositiveInt(meta?.total_pages) ??
    (total != null
      ? Math.max(1, Math.ceil(total / (pageSize || rowCount || 25)))
      : null);
  const inferredSize = pageSize ?? 25;

  return {
    page,
    total,
    totalPages,
    canPrev: page > 1,
    canNext: totalPages != null ? page < totalPages : rowCount >= inferredSize,
  };
}

function parseCsatResponses(payload: unknown): CsatResponseRow[] {
  return extractCsatResponseList(payload).flatMap((item) => {
    const row = asRecord(item);
    if (!row || row.id == null || row.id === "") return [];

    const contact = asRecord(row.contact);
    const agent = asRecord(row.assigned_agent);
    const ratingRaw =
      typeof row.rating === "number" ? row.rating : Number(row.rating);
    const createdRaw =
      typeof row.created_at === "number"
        ? row.created_at
        : Number(row.created_at);

    const contactName = String(contact?.name ?? "").trim();
    const contactEmail = String(contact?.email ?? "").trim();
    const agentName = String(agent?.available_name ?? agent?.name ?? "").trim();
    const agentEmail = String(agent?.email ?? "").trim();
    const feedback = String(row.feedback_message ?? "").trim();

    return [
      {
        id: String(row.id),
        rating: Number.isFinite(ratingRaw) ? ratingRaw : null,
        feedback,
        conversationId:
          row.conversation_id == null ? "" : String(row.conversation_id),
        createdAt: Number.isFinite(createdRaw) ? createdRaw : null,
        contactName,
        contactEmail,
        agentName,
        agentEmail,
      },
    ];
  });
}

function formatCsatTimestamp(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const ms = value < 1e12 ? value * 1000 : value;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
}

function CsatRatingCell({ rating }: { rating: number | null }) {
  const level = CSAT_LEVELS.find((item) => item.rating === rating);
  if (rating == null || !level)
    return <span className="text-muted-foreground">—</span>;

  const Icon = level.icon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={cn("size-4 shrink-0", level.iconClass)} aria-hidden />
      <span className="font-semibold tabular-nums" translate="no">
        {rating}
      </span>
    </span>
  );
}

function CsatResponsesDetail({
  tenantId,
  since,
  until,
  onBack,
}: {
  tenantId: string;
  since: number;
  until: number;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError } = useGetCsatResponses(
    tenantId,
    { since, until, page },
    !!tenantId && Number.isFinite(since) && Number.isFinite(until),
  );
  const rows = parseCsatResponses(data?.data);
  const pagination = parseCsatPagination(data?.data, page, rows.length);

  useEffect(() => {
    setPage(1);
  }, [since, until]);

  const showPager =
    pagination.canPrev || pagination.canNext || pagination.totalPages != null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
          Phản hồi CSAT
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-primary text-[11px] font-medium tracking-[0.14em] uppercase hover:underline"
        >
          Tổng quan
        </button>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          Không thể tải danh sách phản hồi CSAT.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Chưa có phản hồi trong khoảng đã chọn.
        </p>
      ) : (
        <Table
          containerClassName={cn(
            "max-h-72 overflow-auto rounded-md border border-border/60",
            isFetching && "opacity-70",
          )}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Phản hồi</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="min-w-36">
                    <p className="font-medium">{row.contactName || "—"}</p>
                    {row.contactEmail ? (
                      <p className="text-muted-foreground text-xs">
                        {row.contactEmail}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <CsatRatingCell rating={row.rating} />
                </TableCell>
                <TableCell className="max-w-56 whitespace-normal">
                  {row.feedback || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="min-w-32">
                    <p className="font-medium">{row.agentName || "—"}</p>
                    {row.agentEmail ? (
                      <p className="text-muted-foreground text-xs">
                        {row.agentEmail}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className="text-right tabular-nums whitespace-nowrap"
                  translate="no"
                >
                  {formatCsatTimestamp(row.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showPager ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs tabular-nums">
            {pagination.total != null
              ? `${formatNumber(pagination.total)} phản hồi`
              : `Trang ${pagination.page}`}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              disabled={!pagination.canPrev || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-14 text-center text-xs font-medium tabular-nums">
              {pagination.page}
              {pagination.totalPages != null
                ? ` / ${pagination.totalPages}`
                : ""}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              disabled={!pagination.canNext || isFetching}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CsatPanel({
  csat,
  tenantId,
  since,
  until,
}: {
  csat: ReportsOverviewCsat | null;
  tenantId: string;
  since: number;
  until: number;
}) {
  const [showDetail, setShowDetail] = useState(false);

  if (showDetail) {
    return (
      <CsatResponsesDetail
        tenantId={tenantId}
        since={since}
        until={until}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  if (!csat || csat.total_count === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-center text-sm">
          Chưa có phản hồi CSAT.
        </p>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => setShowDetail(true)}
        >
          Chi tiết
        </Button>
      </div>
    );
  }

  return <CsatOverview csat={csat} onShowDetail={() => setShowDetail(true)} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <Skeleton className="h-40 rounded-xl xl:col-span-1" />
        <Skeleton className="h-40 rounded-xl xl:col-span-3" />
        <Skeleton className="h-40 rounded-xl xl:col-span-2" />
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-64 rounded-xl lg:col-span-4" />
        <Skeleton className="h-64 rounded-xl lg:col-span-8" />
      </div>
    </div>
  );
}

export function OverviewReport({ since, until }: OverviewReportProps) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useGetReportsOverview(
    tenantId,
    { since, until },
    !!tenantId && Number.isFinite(since) && Number.isFinite(until),
  );

  const overview = response?.data;
  const summary = overview?.summary?.ok ? overview.summary.data : null;
  const live = overview?.live_conversations?.ok
    ? overview.live_conversations.data
    : null;
  const csat = overview?.csat?.ok ? overview.csat.data : null;

  const liveChartData = live
    ? [
        {
          key: "open" as const,
          label: "Đang mở",
          count: live.open,
          fill: liveChartConfig.open.color,
        },
        {
          key: "unattended" as const,
          label: "Chưa xử lý",
          count: live.unattended,
          fill: liveChartConfig.unattended.color,
        },
        {
          key: "unassigned" as const,
          label: "Chưa gán",
          count: live.unassigned,
          fill: liveChartConfig.unassigned.color,
        },
        {
          key: "pending" as const,
          label: "Đang chờ",
          count: live.pending,
          fill: liveChartConfig.pending.color,
        },
      ]
    : [];

  const liveTotal = liveChartData.reduce((sum, item) => sum + item.count, 0);

  const previous = summary?.previous ?? {};

  if (!tenantId || isLoading) {
    return (
      <div aria-busy="true" aria-label="Đang tải báo cáo…">
        <OverviewSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/40" role="alert">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-pretty">
            Không tải được báo cáo
          </CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-pretty">
            Chưa có dữ liệu overview
          </CardTitle>
          <CardDescription>
            API không trả về summary cho khoảng thời gian đã chọn.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const conversationMetric: MetricItem = {
    label: "Hội thoại",
    value: formatNumber(summary.conversations_count),
    unit: "hội thoại",
    previousLabel: formatNumber(previous.conversations_count ?? 0),
    growth: calcGrowth(
      summary.conversations_count,
      previous.conversations_count,
    ),
    icon: MessagesSquare,
    iconBg: "bg-blue-100 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  };

  const messageGroupMetrics: [MetricItem, MetricItem, MetricItem] = [
    {
      label: "Tin nhắn đến",
      value: formatNumber(summary.incoming_messages_count),
      unit: "tin nhắn",
      previousLabel: formatNumber(previous.incoming_messages_count ?? 0),
      growth: calcGrowth(
        summary.incoming_messages_count,
        previous.incoming_messages_count,
      ),
      icon: MessageSquare,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Tin nhắn đi",
      value: formatNumber(summary.outgoing_messages_count),
      unit: "tin nhắn",
      previousLabel: formatNumber(previous.outgoing_messages_count ?? 0),
      growth: calcGrowth(
        summary.outgoing_messages_count,
        previous.outgoing_messages_count,
      ),
      icon: MessageSquareText,
      iconBg: "bg-violet-100 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Đã giải quyết",
      value: formatNumber(summary.resolutions_count),
      unit: "hội thoại",
      previousLabel: formatNumber(previous.resolutions_count ?? 0),
      growth: calcGrowth(summary.resolutions_count, previous.resolutions_count),
      icon: Users,
      iconBg: "bg-teal-100 dark:bg-teal-950/40",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
  ];

  const firstResponseMetric: MetricItem = {
    label: "RTT",
    helpText:
      "RTT là thời gian phản hồi đầu tiên trung bình kể từ khi khách gửi tin nhắn đến lúc nhận được phản hồi đầu tiên.",
    value: formatDuration(summary.avg_first_response_time),
    previousLabel: formatDuration(previous.avg_first_response_time ?? 0),
    growth: calcGrowth(
      summary.avg_first_response_time,
      previous.avg_first_response_time,
    ),
    lowerIsBetter: true,
    icon: Timer,
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  };

  const resolutionTimeMetric: MetricItem = {
    label: "ATTD",
    helpText:
      "ATTD là thời gian xử lý trung bình từ lúc hội thoại được tạo đến khi được đánh dấu đã giải quyết.",
    value: formatDuration(summary.avg_resolution_time),
    previousLabel: formatDuration(previous.avg_resolution_time ?? 0),
    growth: calcGrowth(
      summary.avg_resolution_time,
      previous.avg_resolution_time,
    ),
    lowerIsBetter: true,
    icon: Clock3,
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  };

  const timeGroupMetrics: [MetricItem, MetricItem] = [
    firstResponseMetric,
    resolutionTimeMetric,
  ];

  const overviewItems: MetricsGridItem[] = [
    { type: "single", metric: conversationMetric },
    { type: "triple", metrics: messageGroupMetrics },
    { type: "double", metrics: timeGroupMetrics },
  ];

  return (
    <div className="space-y-5">
      <MetricsGrid items={overviewItems} />

      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        <Card className="flex flex-col border-border/50 bg-card py-0 shadow-sm lg:col-span-4">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base font-bold">
              Hội thoại realtime
            </CardTitle>
            <CardDescription>
              Tổng {formatNumber(liveTotal)} hội thoại đang hoạt động
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center px-5 pb-5 pt-2">
            {!live || liveTotal === 0 ? (
              <p className="text-muted-foreground text-center text-sm">
                Không có hội thoại realtime.
              </p>
            ) : (
              <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                <ChartContainer
                  config={liveChartConfig}
                  className="mx-auto aspect-square w-full max-w-48 shrink-0 sm:mx-0 sm:size-44 lg:size-48"
                  aria-label="Biểu đồ phân bố hội thoại realtime"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent nameKey="label" hideLabel />
                      }
                    />
                    <Pie
                      data={liveChartData}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      strokeWidth={2}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius: iR,
                        outerRadius: oR,
                        percent,
                      }) => {
                        if (percent < 0.05) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = ((iR as number) + (oR as number)) / 2;
                        const x =
                          (cx as number) +
                          radius * Math.cos(-midAngle * RADIAN);
                        const y =
                          (cy as number) +
                          radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-white text-sm font-bold"
                            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {liveChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <ul className="grid w-full grid-cols-[12px_1fr_auto] gap-x-3 gap-y-2.5 sm:w-auto sm:grid-cols-[12px_auto_auto]">
                  {liveChartData.map((item) => (
                    <li
                      key={item.key}
                      className="col-span-full grid grid-cols-subgrid items-center text-sm sm:text-xs"
                    >
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-right font-semibold tabular-nums">
                        {formatNumber(item.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col border-border/50 bg-card py-0 shadow-sm lg:col-span-8">
          <CardContent className="flex flex-1 flex-col px-5 py-6 sm:px-6 sm:py-7">
            <CsatPanel
              csat={csat}
              tenantId={tenantId}
              since={since}
              until={until}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
