"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useListTenantInboxes } from "@/hooks/chatwoot/use-chatwoot";
import { useGetReportsOverview } from "@/hooks/reports/use-reports";
import {
  useGetTenantRatingsMetrics,
  useListTenantRatings,
} from "@/hooks/ratings/use-conversation-rating";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleHelp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
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
  Zap,
  Globe,
  Mail,
  Phone,
  Send,
  Code2,
  Camera,
  MessageCircle,
  type LucideIcon,
  Combine,
  SmilePlusIcon,
} from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import type {
  TenantRatingItem,
  TenantRatingsMetricsData,
} from "@/services/ratings/conversation-rating";
import { EmptyData } from "@/components/empty-data";

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
    barClass:
      "bg-linear-to-r from-emerald-500 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] dark:from-emerald-500 dark:to-emerald-400",
    trackClass: "bg-emerald-500/12 ring-1 ring-inset ring-emerald-500/10",
  },
  {
    rating: 4,
    label: "Tốt",
    icon: Smile,
    iconClass: "text-teal-600 dark:text-teal-400",
    barClass:
      "bg-linear-to-r from-teal-500 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] dark:from-teal-500 dark:to-teal-400",
    trackClass: "bg-teal-500/12 ring-1 ring-inset ring-teal-500/10",
  },
  {
    rating: 3,
    label: "Trung bình",
    icon: Meh,
    iconClass: "text-stone-500 dark:text-stone-400",
    barClass:
      "bg-linear-to-r from-stone-400 to-stone-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] dark:from-stone-400 dark:to-stone-300",
    trackClass: "bg-stone-500/12 ring-1 ring-inset ring-stone-500/10",
  },
  {
    rating: 2,
    label: "Kém",
    icon: Frown,
    iconClass: "text-orange-600 dark:text-orange-400",
    barClass:
      "bg-linear-to-r from-orange-500 to-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:from-orange-500 dark:to-orange-400",
    trackClass: "bg-orange-500/12 ring-1 ring-inset ring-orange-500/10",
  },
  {
    rating: 1,
    label: "Rất kém",
    icon: Angry,
    iconClass: "text-rose-700 dark:text-rose-400",
    barClass:
      "bg-linear-to-r from-rose-500 to-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] dark:from-rose-500 dark:to-rose-400",
    trackClass: "bg-rose-500/12 ring-1 ring-inset ring-rose-500/10",
  },
];

const formatPercentCompact = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.05;
  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: isWhole ? 0 : 1,
    maximumFractionDigits: isWhole ? 0 : 1,
  }).format(rounded)}%`;
};

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
        "h-auto shrink-0 px-1.5 py-0.5 text-sm leading-none @min-[13rem]/metric:px-2 @min-[13rem]/metric:py-0.5 @min-[13rem]/metric:text-xs",
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
        <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-sm leading-snug @min-[13rem]/metric:gap-1.5 @min-[13rem]/metric:px-2.5 @min-[13rem]/metric:py-1 @min-[13rem]/metric:text-xs dark:bg-muted/40">
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

function toRatingsDateParam(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

type CsatChannelCardTheme = {
  bgClass: string;
  iconClass: string;
  icon: LucideIcon;
};

function getCsatChannelCardTheme(
  channelKind: string,
  channelType: string,
  label: string,
  index: number,
): CsatChannelCardTheme {
  const haystack = `${channelKind} ${channelType} ${label}`.toLowerCase();

  if (haystack.includes("whatsapp")) {
    return {
      bgClass: "bg-[#25D366]",
      iconClass: "text-[#128C7E]",
      icon: MessageCircle,
    };
  }
  if (haystack.includes("telegram")) {
    return {
      bgClass: "bg-[#2AABEE]",
      iconClass: "text-[#229ED9]",
      icon: Send,
    };
  }
  if (haystack.includes("facebook") || haystack.includes("fb")) {
    return {
      bgClass: "bg-[#1877F2]",
      iconClass: "text-[#1877F2]",
      icon: Users,
    };
  }
  if (haystack.includes("instagram") || haystack.includes("ig")) {
    return {
      bgClass: "bg-[#E4405F]",
      iconClass: "text-[#C13584]",
      icon: Camera,
    };
  }
  if (haystack.includes("line") && !haystack.includes("online")) {
    return {
      bgClass: "bg-[#06C755]",
      iconClass: "text-[#06C755]",
      icon: MessageSquare,
    };
  }
  if (haystack.includes("zalo")) {
    return {
      bgClass: "bg-[#0068FF]",
      iconClass: "text-[#0068FF]",
      icon: MessageCircle,
    };
  }
  if (
    haystack.includes("email") ||
    haystack.includes("mail") ||
    haystack.includes("channel::email")
  ) {
    return {
      bgClass: "bg-[#E11D48]",
      iconClass: "text-[#BE123C]",
      icon: Mail,
    };
  }
  if (
    haystack.includes("sms") ||
    haystack.includes("twilio") ||
    haystack.includes("phone")
  ) {
    return {
      bgClass: "bg-[#F59E0B]",
      iconClass: "text-[#D97706]",
      icon: Phone,
    };
  }
  if (
    haystack.includes("web_widget") ||
    haystack.includes("webwidget") ||
    haystack.includes("website") ||
    haystack.includes("widget")
  ) {
    return {
      bgClass: "bg-[#7C3AED]",
      iconClass: "text-[#6D28D9]",
      icon: Globe,
    };
  }
  if (haystack.includes("api")) {
    return {
      bgClass: "bg-[#2563EB]",
      iconClass: "text-[#1D4ED8]",
      icon: Code2,
    };
  }

  const fallbacks: CsatChannelCardTheme[] = [
    { bgClass: "bg-[#4F46E5]", iconClass: "text-[#4338CA]", icon: Zap },
    {
      bgClass: "bg-[#0D9488]",
      iconClass: "text-[#0F766E]",
      icon: MessageSquare,
    },
    { bgClass: "bg-[#EA580C]", iconClass: "text-[#C2410C]", icon: Phone },
  ];
  return fallbacks[index % fallbacks.length]!;
}

const CSAT_INBOX_ALL = "all";

type CsatInboxOption = {
  value: string;
  label: string;
};

function extractInboxSelectOptions(payload: unknown): CsatInboxOption[] {
  const root = asRecord(payload);
  const messaging = asRecord(root?.messaging);
  const list = Array.isArray(messaging?.payload)
    ? messaging.payload
    : Array.isArray(root?.payload)
      ? root.payload
      : Array.isArray(root?.data)
        ? root.data
        : Array.isArray(payload)
          ? payload
          : [];

  const options: CsatInboxOption[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    const row = asRecord(item);
    if (!row) continue;
    const idRaw = row.id ?? row.inbox_id;
    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string"
          ? Number(idRaw)
          : Number.NaN;
    if (!Number.isFinite(id)) continue;
    const value = String(id);
    if (seen.has(value)) continue;
    seen.add(value);
    const name = String(row.name ?? row.inbox_name ?? "").trim();
    options.push({
      value,
      label: name || `Inbox #${id}`,
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, "vi"));
}

function CsatOverview({
  metrics,
  showByInbox,
}: {
  metrics: TenantRatingsMetricsData;
  showByInbox: boolean;
}) {
  const ratingsCount = metrics.ratings_count ?? {};
  const totalCount = metrics.total_count ?? 0;
  const sentCount = metrics.total_sent_messages_count ?? 0;
  const pendingCount = metrics.pending_count ?? 0;
  const expiredCount = metrics.expired_count ?? 0;
  const byInbox = Array.isArray(metrics.by_inbox) ? metrics.by_inbox : [];

  const distribution = CSAT_LEVELS.map((level) => {
    const count = ratingsCount[String(level.rating)] ?? 0;
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { ...level, count, percentage };
  });

  const positiveCount = (ratingsCount["4"] ?? 0) + (ratingsCount["5"] ?? 0);
  const satisfactionScore =
    totalCount > 0 ? (positiveCount / totalCount) * 100 : 0;
  const responseRate = sentCount > 0 ? (totalCount / sentCount) * 100 : 0;
  const averageScore =
    metrics.average_score != null && Number.isFinite(metrics.average_score)
      ? metrics.average_score
      : totalCount > 0
        ? Object.entries(ratingsCount).reduce(
            (sum, [rating, count]) => sum + Number(rating) * count,
            0,
          ) / totalCount
        : null;

  const stats = [
    {
      label: "Phản hồi",
      value: formatNumber(totalCount),
      title: "Số lượt khách đã đánh giá",
    },
    {
      label: "Hài lòng",
      value: formatPercentCompact(satisfactionScore),
      title: "Tỷ lệ đánh giá 4–5 sao",
    },
    {
      label: "Tỷ lệ PH",
      value: formatPercentCompact(responseRate),
      title: "Phản hồi / khảo sát đã gửi",
    },
    {
      label: "Đang chờ",
      value: formatNumber(pendingCount),
      title: "Khảo sát đã gửi nhưng chưa có phản hồi",
    },
    {
      label: "Hết hạn",
      value: formatNumber(expiredCount),
      title: "Khảo sát hết hạn chưa phản hồi",
    },
  ] as const;

  const showInboxColumn = showByInbox && byInbox.length > 0;

  return (
    <section
      className={cn(
        "grid w-full items-start gap-5",
        showInboxColumn && "lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]",
      )}
      aria-label="Tổng quan CSAT"
    >
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="min-w-0 shrink-0">
            <div className="flex items-end gap-1.5">
              <p
                className="text-4xl font-bold leading-none tracking-tighter tabular-nums"
                translate="no"
              >
                {averageScore != null ? averageScore.toFixed(1) : "—"}
              </p>
              <span className="text-muted-foreground mb-0.5 text-sm font-medium tabular-nums">
                / 5
              </span>
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs">
              {formatNumber(totalCount)} phản hồi · {formatNumber(sentCount)} đã
              gửi
            </p>
          </div>

          <dl className="flex min-w-0 flex-1 flex-wrap items-stretch gap-y-2">
            {stats.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "min-w-16 px-2.5 py-0.5 sm:min-w-0 sm:flex-1 sm:px-3",
                  index > 0 && "border-l border-border/60",
                )}
                title={item.title}
              >
                <dt className="text-muted-foreground text-xs font-medium">
                  {item.label}
                </dt>
                <dd
                  className="mt-0.5 text-base font-semibold tracking-tight tabular-nums"
                  translate="no"
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0">
          <p className="text-muted-foreground mb-3 text-xs font-medium">
            Phân bố
          </p>
          <ul className="space-y-3" aria-label="Phân bố điểm đánh giá">
            {distribution.map((item) => {
              const LevelIcon = item.icon;
              const barWidth = Math.max(item.percentage, 0);
              return (
                <li key={item.rating} className="min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md bg-black/3 dark:bg-white/6",
                        )}
                      >
                        <LevelIcon
                          className={cn("size-3.5", item.iconClass)}
                          aria-hidden="true"
                        />
                      </span>
                      <span
                        className="w-3 shrink-0 text-xs font-semibold tabular-nums"
                        translate="no"
                      >
                        {item.rating}
                      </span>
                      <span className="truncate text-xs font-medium">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1.5 text-xs tabular-nums">
                      <span className="font-semibold" translate="no">
                        {formatPercentCompact(item.percentage)}
                      </span>
                      <span
                        className="text-muted-foreground w-4 text-right"
                        translate="no"
                      >
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative h-2.5 overflow-hidden rounded-full",
                      item.trackClass,
                    )}
                    role="img"
                    aria-label={`${item.label}: ${formatPercentCompact(item.percentage)}`}
                  >
                    <div
                      className={cn(
                        "relative h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        item.barClass,
                      )}
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 0 ? (
                        <span
                          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-full bg-linear-to-l from-white/25 to-transparent"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {showInboxColumn ? (
        <div className="min-w-0">
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <p className="text-muted-foreground text-xs font-medium">
              Theo từng kênh
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatNumber(byInbox.length)}
            </p>
          </div>
          <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-0.5">
            {byInbox.map((inbox, index) => {
              const label =
                String(inbox.source_label || inbox.inbox_name || "").trim() ||
                `Inbox #${inbox.inbox_id}`;
              const inboxAvg =
                inbox.average_score != null &&
                Number.isFinite(inbox.average_score)
                  ? inbox.average_score.toFixed(1)
                  : "—";
              const channel = String(inbox.channel_kind || "")
                .trim()
                .toLowerCase();
              const channelType = String(inbox.channel_type || "").trim();
              const inboxResponses = inbox.total_count ?? 0;
              const inboxSent = inbox.total_sent_messages_count ?? 0;
              const theme = getCsatChannelCardTheme(
                channel,
                channelType,
                label,
                index,
              );
              const ChannelIcon = theme.icon;

              return (
                <li key={`${inbox.inbox_id}-${label}`}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-white shadow-sm",
                      theme.bgClass,
                    )}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <ChannelIcon
                        className={cn("size-5", theme.iconClass)}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {label}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-white/80">
                        Điểm{" "}
                        <span className="tabular-nums" translate="no">
                          {inboxAvg}
                        </span>
                        /5 · {formatNumber(inboxResponses)}/
                        {formatNumber(inboxSent)} PH
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const CSAT_STATUS_ALL = "all";
const CSAT_PAGE_SIZE_DEFAULT = "20";

const CSAT_STATUS_OPTIONS = [
  { value: CSAT_STATUS_ALL, label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ đánh giá" },
  { value: "submitted", label: "Đã gửi" },
  { value: "expired", label: "Hết hạn" },
] as const;

const CSAT_PAGE_SIZE_OPTIONS = ["10", "20", "50"] as const;

function formatCsatIsoTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
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

function CsatStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "submitted") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      >
        Đã gửi
      </Badge>
    );
  }
  if (normalized === "pending") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        Chờ đánh giá
      </Badge>
    );
  }
  if (normalized === "expired") {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        Hết hạn
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="capitalize">
      {status || "—"}
    </Badge>
  );
}

function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

type CsatPageItem = number | "ellipsis";

function buildCsatPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): CsatPageItem[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (
    let page = currentPage - siblingCount;
    page <= currentPage + siblingCount;
    page += 1
  ) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: CsatPageItem[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]!;
    const prev = sorted[index - 1];
    if (prev != null && page - prev > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

const CSAT_VIEW_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

function CsatResponsesDetail({
  tenantId,
  since,
  until,
  initialInboxId,
  inboxOptions,
  onBack,
}: {
  tenantId: string;
  since: number;
  until: number;
  initialInboxId: string;
  inboxOptions: CsatInboxOption[];
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CSAT_PAGE_SIZE_DEFAULT);
  const [status, setStatus] = useState(CSAT_STATUS_ALL);
  const [inboxId, setInboxId] = useState(initialInboxId);

  useEffect(() => {
    setInboxId(initialInboxId);
  }, [initialInboxId]);

  useEffect(() => {
    if (inboxId === CSAT_INBOX_ALL) return;
    const exists = inboxOptions.some((item) => item.value === inboxId);
    if (!exists) setInboxId(CSAT_INBOX_ALL);
  }, [inboxId, inboxOptions]);

  useEffect(() => {
    setPage(1);
  }, [since, until, status, inboxId, pageSize]);

  const listParams = useMemo(() => {
    const params: {
      since: string;
      until: string;
      page: number;
      page_size: number;
      status?: string;
      inbox_id?: number;
    } = {
      since: toRatingsDateParam(since),
      until: toRatingsDateParam(until),
      page,
      page_size: Number(pageSize) || 20,
    };
    if (status !== CSAT_STATUS_ALL) params.status = status;
    if (inboxId !== CSAT_INBOX_ALL) {
      const numericId = Number(inboxId);
      if (Number.isFinite(numericId)) params.inbox_id = numericId;
    }
    return params;
  }, [since, until, page, pageSize, status, inboxId]);

  const { data, isLoading, isFetching, isError } = useListTenantRatings(
    tenantId,
    listParams,
    !!tenantId && Number.isFinite(since) && Number.isFinite(until),
  );

  const listData = data?.data ?? null;
  const rows: TenantRatingItem[] = Array.isArray(listData?.items)
    ? listData.items
    : [];
  const total = listData?.total ?? 0;
  const currentPage = listData?.page ?? page;
  const parsedPageSize = Number(pageSize);
  const fallbackPageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 20;
  const currentPageSize = listData?.page_size ?? fallbackPageSize;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize) || 1);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const showPager = total > 0;
  const pageItems = useMemo(
    () => buildCsatPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 cursor-pointer gap-1 px-2"
            onClick={onBack}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Tổng quan
          </Button>
          <span className="bg-border hidden h-4 w-px sm:block" aria-hidden />
          <p className="text-sm font-bold">Chi tiết đánh giá</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              size="sm"
              className="h-8 w-full min-w-[10rem] cursor-pointer sm:w-[11rem]"
              aria-label="Lọc theo trạng thái"
            >
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>

            <SelectContent>
              {CSAT_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={inboxId} onValueChange={setInboxId}>
            <SelectTrigger
              size="sm"
              className="h-8 w-full min-w-40 cursor-pointer sm:w-52"
              aria-label="Lọc theo inbox"
            >
              <SelectValue placeholder="Tất cả inbox" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={CSAT_INBOX_ALL}>Tất cả inbox</SelectItem>

              {inboxOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger
              size="sm"
              className="h-8 w-28 cursor-pointer"
              aria-label="Số dòng mỗi trang"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {CSAT_PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}/trang
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          Không thể tải danh sách đánh giá.
        </p>
      ) : rows.length === 0 ? (
        <EmptyData
          icon={Smile}
          title="Không có đánh giá"
          description="Thay đổi lọc để tìm kiếm đánh giá."
        />
      ) : (
        <Table
          containerClassName={cn(
            "max-h-[28rem] overflow-auto rounded-md border border-border/60",
            isFetching && "opacity-70",
          )}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Kênh</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Phản hồi</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const contact = row.meta_data?.contact;
              const contactName = String(contact?.name ?? "").trim();
              const contactEmail = String(contact?.email ?? "").trim();
              const contactPhone = String(contact?.phone_number ?? "").trim();
              const contactSub = contactEmail || contactPhone;
              const thumbnail = String(contact?.thumbnail ?? "").trim();
              const channelLabel =
                String(
                  row.source_label ??
                    row.inbox_name ??
                    row.meta_data?.source_label ??
                    row.meta_data?.inbox_name ??
                    "",
                ).trim() || "—";
              const displayTime =
                row.submitted_at || row.sent_at || row.created_at;
              const agentId = row.agent_chatwoot_id;

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex min-w-44 items-center gap-2.5">
                      <Avatar className="size-8">
                        {thumbnail ? (
                          <AvatarImage src={thumbnail} alt={contactName} />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-medium">
                          {contactInitials(contactName || "KH")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {contactName || "—"}
                        </p>
                        {contactSub ? (
                          <p className="text-muted-foreground truncate text-xs">
                            {contactSub}
                          </p>
                        ) : row.conversation_id != null ? (
                          <p className="text-muted-foreground text-xs tabular-nums">
                            Conv #{row.conversation_id}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-32">
                      <p className="truncate text-sm font-medium">
                        {channelLabel}
                      </p>
                      {row.channel_kind ? (
                        <p className="text-muted-foreground truncate text-xs capitalize">
                          {row.channel_kind}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CsatRatingCell
                      rating={
                        row.score != null && Number.isFinite(row.score)
                          ? row.score
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell className="max-w-52 whitespace-normal">
                    {row.comment?.trim() ? (
                      row.comment
                    ) : row.status === "pending" && row.rating_url ? (
                      <a
                        href={row.rating_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                      >
                        Link đánh giá
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CsatStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    {agentId != null ? (
                      <span className="tabular-nums">#{agentId}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums whitespace-nowrap"
                    translate="no"
                  >
                    {formatCsatIsoTimestamp(displayTime)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {showPager ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatNumber(total)} đánh giá
            {total > 0
              ? ` · ${(currentPage - 1) * currentPageSize + 1}–${Math.min(currentPage * currentPageSize, total)}`
              : ""}
          </p>
          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Phân trang đánh giá"
          >
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              disabled={!canPrev || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </Button>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="text-muted-foreground px-1.5 text-xs tabular-nums"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === currentPage ? "default" : "outline"}
                  size="icon-sm"
                  className="cursor-pointer tabular-nums"
                  disabled={isFetching}
                  aria-label={`Trang ${item}`}
                  aria-current={item === currentPage ? "page" : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              disabled={!canNext || isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              aria-label="Trang sau"
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function CsatPanel({
  tenantId,
  since,
  until,
}: {
  tenantId: string;
  since: number;
  until: number;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [inboxId, setInboxId] = useState(CSAT_INBOX_ALL);

  const { data: inboxesResponse } = useListTenantInboxes(tenantId);
  const inboxOptions = useMemo(
    () => extractInboxSelectOptions(inboxesResponse?.data),
    [inboxesResponse],
  );

  useEffect(() => {
    if (inboxId === CSAT_INBOX_ALL) return;
    const exists = inboxOptions.some((item) => item.value === inboxId);
    if (!exists) setInboxId(CSAT_INBOX_ALL);
  }, [inboxId, inboxOptions]);

  const metricsParams = useMemo(() => {
    const params: {
      since: string;
      until: string;
      inbox_id?: number;
    } = {
      since: toRatingsDateParam(since),
      until: toRatingsDateParam(until),
    };
    if (inboxId !== CSAT_INBOX_ALL) {
      const numericId = Number(inboxId);
      if (Number.isFinite(numericId)) params.inbox_id = numericId;
    }
    return params;
  }, [since, until, inboxId]);

  const {
    data: metricsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useGetTenantRatingsMetrics(
    tenantId,
    metricsParams,
    !!tenantId && Number.isFinite(since) && Number.isFinite(until),
  );

  const metrics = metricsResponse?.data ?? null;
  const hasActivity =
    !!metrics &&
    ((metrics.total_count ?? 0) > 0 ||
      (metrics.total_sent_messages_count ?? 0) > 0 ||
      (metrics.pending_count ?? 0) > 0);

  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xl font-bold">Điểm đánh giá</p>
      <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2">
        <Select value={inboxId} onValueChange={setInboxId}>
          <SelectTrigger
            size="sm"
            className="h-8 w-[min(100%,13rem)] cursor-pointer"
            aria-label="Lọc theo inbox"
          >
            <SelectValue placeholder="Tất cả inbox" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={CSAT_INBOX_ALL}>Tất cả inbox</SelectItem>
            {inboxOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 cursor-pointer gap-1"
          onClick={() => setShowDetail(true)}
        >
          Chi tiết
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );

  const overviewBody = (() => {
    if (isLoading && !metrics) {
      return (
        <div className="flex flex-1 flex-col" aria-busy="true">
          {toolbar}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      );
    }

    if (isError && !metrics) {
      return (
        <div className="flex flex-1 flex-col">
          {toolbar}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6">
            <p className="text-destructive text-center text-sm">
              {error instanceof Error
                ? error.message
                : "Không tải được metrics CSAT."}
            </p>
          </div>
        </div>
      );
    }

    if (!metrics || !hasActivity) {
      return (
        <div className="flex flex-1 flex-col">
          {toolbar}
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <p className="text-muted-foreground text-center text-sm">
              Chưa có dữ liệu CSAT trong khoảng đã chọn
              {inboxId !== CSAT_INBOX_ALL ? " cho inbox này" : ""}.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-1 flex-col",
          isFetching && "opacity-90 transition-opacity",
        )}
      >
        {toolbar}
        <CsatOverview
          metrics={metrics}
          showByInbox={inboxId === CSAT_INBOX_ALL}
        />
      </div>
    );
  })();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {showDetail ? (
          <motion.div
            key="csat-detail"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={CSAT_VIEW_TRANSITION}
          >
            <CsatResponsesDetail
              tenantId={tenantId}
              since={since}
              until={until}
              initialInboxId={inboxId}
              inboxOptions={inboxOptions}
              onBack={() => setShowDetail(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="csat-overview"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={CSAT_VIEW_TRANSITION}
          >
            {overviewBody}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-64 rounded-xl lg:col-span-4" />
        <Skeleton className="h-64 rounded-xl lg:col-span-8" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <Skeleton className="h-40 rounded-xl xl:col-span-1" />
        <Skeleton className="h-40 rounded-xl xl:col-span-3" />
        <Skeleton className="h-40 rounded-xl xl:col-span-2" />
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
      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        <Card className="flex flex-col border-border/50 bg-card py-0 shadow-sm lg:col-span-4">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-xl font-bold">Hội thoại</CardTitle>
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
          <CardContent className="flex flex-1 flex-col px-5 py-5 sm:px-6">
            <CsatPanel tenantId={tenantId} since={since} until={until} />
          </CardContent>
        </Card>
      </div>

      <MetricsGrid items={overviewItems} />
    </div>
  );
}
