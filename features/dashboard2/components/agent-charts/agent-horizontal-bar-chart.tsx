"use client";

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
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDefaultLast7DaysRange,
  StartAndEndDateTimePicker,
  toStartEndDateTimeFormats,
  type StartEndDateTimeValue,
} from "@/components/start-and-end-datetime-picker";
import { useAuth } from "@/contexts/auth-context";
import { useGetReportsGroupedSummary } from "@/hooks/reports/use-reports";
import {
  useListChatwootAgents,
  useListTenantInboxes,
  useListTenantTeams,
} from "@/hooks/chatwoot/use-chatwoot";
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
import type {
  AgentReportSummary,
  ReportGroupedKind,
} from "@/services/reports/service";

export type GroupedSummaryKind = Extract<
  ReportGroupedKind,
  "agent" | "label" | "inbox" | "team"
>;

export type GroupedSummaryBarChartProps = {
  className?: string;
  kind?: GroupedSummaryKind;
  since?: number;
  until?: number;
  hideDatePicker?: boolean;
};

type SortKey = keyof Pick<
  AgentReportSummary,
  | "id"
  | "conversations_count"
  | "resolved_conversations_count"
  | "avg_resolution_time"
  | "avg_first_response_time"
  | "avg_reply_time"
>;

type AgentChartRow = {
  id: string;
  label: string;
  name: string;
  email: string;
  conversations_count: number | null;
  resolved_conversations_count: number | null;
  avg_resolution_time: number | null;
  avg_first_response_time: number | null;
  avg_reply_time: number | null;
  resolutionVisual: number | null;
  firstResponseVisual: number | null;
  replyVisual: number | null;
};

const COUNT_NA = "N/A";
const MIN_VISIBLE_BAR = 8;

const timeChartConfig = {
  resolutionVisual: {
    label: "Thời gian giải quyết",
    color: "#F97316",
  },
  firstResponseVisual: {
    label: "Phản hồi đầu tiên",
    color: "#10B981",
  },
  replyVisual: {
    label: "Thời gian trả lời",
    color: "#3B82F6",
  },
} satisfies ChartConfig;

const countChartConfig = {
  conversations_count: {
    label: "Hội thoại",
    color: "#8B5CF6",
  },
  resolved_conversations_count: {
    label: "Đã giải quyết",
    color: "#06B6D4",
  },
} satisfies ChartConfig;

const KIND_COPY: Record<
  GroupedSummaryKind,
  {
    title: string;
    description: string;
    fallback: string;
    empty: string;
    error: string;
  }
> = {
  agent: {
    title: "Hiệu suất agent",
    description:
      "Thời gian xử lý theo agent (ms → phút/giây). Null hiển thị N/A, không quy về 0. Độ dài thanh thời gian là tương đối từng metric.",
    fallback: "Agent",
    empty: "Không có dữ liệu agent trong khoảng thời gian đã chọn.",
    error: "Không thể tải dữ liệu hiệu suất agent.",
  },
  label: {
    title: "Hiệu suất label",
    description:
      "Thời gian xử lý theo label (ms → phút/giây). Null hiển thị N/A, không quy về 0. Độ dài thanh thời gian là tương đối từng metric.",
    fallback: "Label",
    empty: "Không có dữ liệu label trong khoảng thời gian đã chọn.",
    error: "Không thể tải dữ liệu hiệu suất label.",
  },
  inbox: {
    title: "Hiệu suất inbox",
    description:
      "Thời gian xử lý theo inbox (ms → phút/giây). Null hiển thị N/A, không quy về 0. Độ dài thanh thời gian là tương đối từng metric.",
    fallback: "Inbox",
    empty: "Không có dữ liệu inbox trong khoảng thời gian đã chọn.",
    error: "Không thể tải dữ liệu hiệu suất inbox.",
  },
  team: {
    title: "Hiệu suất team",
    description:
      "Thời gian xử lý theo team (ms → phút/giây). Null hiển thị N/A, không quy về 0. Độ dài thanh thời gian là tương đối từng metric.",
    fallback: "Team",
    empty: "Không có dữ liệu team trong khoảng thời gian đã chọn.",
    error: "Không thể tải dữ liệu hiệu suất team.",
  },
};

function toUnixRange(value: StartEndDateTimeValue) {
  const formats = toStartEndDateTimeFormats(value);
  return {
    since: formats.since ?? 0,
    until: formats.until ?? 0,
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractSummaryList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of [
    "data",
    "messaging",
    "agents",
    "labels",
    "inboxes",
    "channels",
    "teams",
    "summary",
    "items",
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  return [];
}

function parseAgentSummaries(payload: unknown): AgentReportSummary[] {
  return extractSummaryList(payload).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (row.id == null || row.id === "") return [];

    const name =
      typeof row.name === "string" && row.name.trim()
        ? row.name.trim()
        : typeof row.available_name === "string" && row.available_name.trim()
          ? row.available_name.trim()
          : typeof row.inbox_name === "string" && row.inbox_name.trim()
            ? row.inbox_name.trim()
            : typeof row.team_name === "string" && row.team_name.trim()
              ? row.team_name.trim()
              : typeof row.channel_name === "string" && row.channel_name.trim()
                ? row.channel_name.trim()
                : null;

    return [
      {
        id: row.id as number | string,
        name,
        conversations_count: toNullableNumber(row.conversations_count),
        resolved_conversations_count: toNullableNumber(
          row.resolved_conversations_count,
        ),
        avg_resolution_time: toNullableNumber(row.avg_resolution_time),
        avg_first_response_time: toNullableNumber(row.avg_first_response_time),
        avg_reply_time: toNullableNumber(row.avg_reply_time),
      },
    ];
  });
}

/** ms → 38m 35s / 7m 9s / 1m 10s / 4.5ms. null → N/A, không đổi thành 0 */
export function formatDurationFromMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return COUNT_NA;
  if (ms < 1000) {
    const rounded = Math.round(ms * 10) / 10;
    return `${rounded}ms`;
  }

  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return COUNT_NA;
  return new Intl.NumberFormat("vi-VN").format(value);
}

function maxFinite(values: Array<number | null>): number {
  return values.reduce<number>((max, value) => {
    if (value == null || !Number.isFinite(value)) return max;
    return Math.max(max, value);
  }, 0);
}

/** Scale riêng từng metric (sqrt + sàn) để metric nhỏ không bị ép sát 0 */
function toRelativeVisual(value: number | null, max: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value <= 0) return 0;
  if (max <= 0) return 100;
  return Math.max(MIN_VISIBLE_BAR, Math.sqrt(value / max) * 100);
}

function extractChatwootAgentRecords(
  response: unknown,
): Record<string, unknown>[] {
  const asRecords = (value: unknown): Record<string, unknown>[] | null => {
    if (!Array.isArray(value)) return null;
    const records = value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
    return records.length > 0 ? records : null;
  };

  const direct = asRecords(response);
  if (direct) return direct;
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  const messaging = data?.messaging as Record<string, unknown> | undefined;

  return (
    asRecords(root.data) ??
    asRecords(data?.payload) ??
    asRecords(data?.agents) ??
    asRecords(data?.inboxes) ??
    asRecords(data?.data) ??
    asRecords(messaging?.payload) ??
    asRecords(
      (messaging?.data as Record<string, unknown> | undefined)?.payload,
    ) ??
    []
  );
}

type AgentIdentity = {
  name: string;
  email: string;
};

function buildAgentIdentityMap(response: unknown): Map<string, AgentIdentity> {
  const map = new Map<string, AgentIdentity>();

  const remember = (key: unknown, identity: AgentIdentity) => {
    if (key == null || key === "") return;
    const id = String(key).trim();
    if (!id) return;
    map.set(id, identity);
    map.set(id.toLowerCase(), identity);
  };

  extractChatwootAgentRecords(response).forEach((record) => {
    const email = String(record.email ?? "").trim();
    const name = String(record.available_name ?? record.name ?? "").trim();
    if (!name && !email) return;

    const identity = { name: name || email, email };
    remember(record.id, identity);
    remember(record.uuid, identity);
    remember(record.user_id, identity);
    remember(record.agent_id, identity);
    remember(record.account_id, identity);
  });

  return map;
}

function extractInboxRecords(response: unknown): Record<string, unknown>[] {
  const asRecords = (value: unknown): Record<string, unknown>[] | null => {
    if (!Array.isArray(value)) return null;
    const records = value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
    return records.length > 0 ? records : null;
  };

  if (!response || typeof response !== "object") {
    return asRecords(response) ?? [];
  }

  const root = response as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const messaging = data.messaging;

  return (
    asRecords(data.teams) ??
    asRecords(messaging) ??
    asRecords(
      messaging && typeof messaging === "object"
        ? (messaging as Record<string, unknown>).payload
        : null,
    ) ??
    asRecords(data.payload) ??
    asRecords(root.payload) ??
    []
  );
}

function buildInboxIdentityMap(response: unknown): Map<string, AgentIdentity> {
  const map = new Map<string, AgentIdentity>();

  extractInboxRecords(response).forEach((record) => {
    const inboxId = record.id;
    if (inboxId == null || inboxId === "") return;

    const name = String(record.name ?? "").trim();
    if (!name) return;

    const identity = { name, email: "" };
    const key = String(inboxId).trim();
    map.set(key, identity);
    map.set(key.toLowerCase(), identity);
  });

  return map;
}

function buildTeamIdentityMap(response: unknown): Map<string, AgentIdentity> {
  const map = new Map<string, AgentIdentity>();

  extractInboxRecords(response).forEach((record) => {
    const teamId = record.id;
    if (teamId == null || teamId === "") return;

    const name = String(record.name ?? "").trim();
    if (!name) return;

    const identity = { name, email: "" };
    const key = String(teamId).trim();
    map.set(key, identity);
    map.set(key.toLowerCase(), identity);
  });

  return map;
}

function resolveAgentIdentity(
  id: string,
  identityById: Map<string, AgentIdentity>,
  fallbackName?: string | null,
): AgentIdentity {
  return (
    identityById.get(id) ||
    identityById.get(id.toLowerCase()) || {
      name: fallbackName?.trim() || "",
      email: "",
    }
  );
}

function resolveEntityLabels(
  rows: AgentReportSummary[],
  kind: GroupedSummaryKind,
  identityById: Map<string, AgentIdentity>,
) {
  return rows.map((row) => {
    const id = String(row.id);
    if (kind === "label" || kind === "inbox" || kind === "team") {
      const identity = resolveAgentIdentity(id, identityById, row.name);
      const name =
        row.name?.trim() ||
        identity.name ||
        `${KIND_COPY[kind].fallback} ${id}`;
      return { id, label: name, name, email: identity.email };
    }
    const identity = resolveAgentIdentity(id, identityById, row.name);
    const name = identity.name;
    const email = identity.email;
    const label = name || email || KIND_COPY.agent.fallback;
    return { id, label, name, email };
  });
}

function wrapAxisLabel(text: string): string[] {
  if (text.length <= 14) return [text];
  return [`${text.slice(0, 13)}…`];
}

function AgentAxisTick({
  x = 0,
  y = 0,
  payload,
  identities,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  identities?: Record<string, { name: string; email: string }>;
}) {
  const id = String(payload?.value ?? "");
  const identity = identities?.[id];
  const text = identity?.name || identity?.email || "—";
  const hint = [identity?.name, identity?.email].filter(Boolean).join(" · ");
  const lines = wrapAxisLabel(text);
  const offset = ((lines.length - 1) * 12) / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{hint || text}</title>
      <text textAnchor="end" className="fill-foreground">
        {lines.map((line, index) => (
          <tspan
            key={`${line}-${index}`}
            x={0}
            dy={index === 0 ? -offset : 12}
            fontSize={11}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function compareNullable(
  a: number | string | null,
  b: number | string | null,
  direction: "asc" | "desc",
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "string" || typeof b === "string") {
    const diff = String(a).localeCompare(String(b), undefined, {
      numeric: true,
    });
    return direction === "asc" ? diff : -diff;
  }

  const diff = a - b;
  return direction === "asc" ? diff : -diff;
}

function sortAgents(
  rows: AgentReportSummary[],
  sortKey: SortKey,
): AgentReportSummary[] {
  const direction: "asc" | "desc" =
    sortKey === "conversations_count" ||
    sortKey === "resolved_conversations_count"
      ? "desc"
      : "asc";

  return [...rows].sort((left, right) =>
    compareNullable(left[sortKey], right[sortKey], direction),
  );
}

function Legend({ config }: { config: ChartConfig }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {Object.entries(config).map(([key, item]) => (
        <div key={key} className="flex items-center gap-1.5 text-xs">
          <span
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AgentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: AgentChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const lines = [
    {
      label: "Hội thoại",
      value: formatCount(row.conversations_count),
      color: countChartConfig.conversations_count.color,
    },
    {
      label: "Đã giải quyết",
      value: formatCount(row.resolved_conversations_count),
      color: countChartConfig.resolved_conversations_count.color,
    },
    {
      label: "Thời gian giải quyết",
      value: formatDurationFromMs(row.avg_resolution_time),
      color: timeChartConfig.resolutionVisual.color,
    },
    {
      label: "Phản hồi đầu tiên",
      value: formatDurationFromMs(row.avg_first_response_time),
      color: timeChartConfig.firstResponseVisual.color,
    },
    {
      label: "Thời gian trả lời",
      value: formatDurationFromMs(row.avg_reply_time),
      color: timeChartConfig.replyVisual.color,
    },
  ];

  return (
    <div className="border-border/50 bg-background grid min-w-52 gap-1.5 rounded-lg border px-2.5 py-2 text-xs shadow-xl">
      <div className="space-y-0.5">
        <p className="font-medium">{row.name || row.label}</p>
        {row.email ? (
          <p className="text-muted-foreground break-all">{row.email}</p>
        ) : null}
      </div>
      {lines.map((line) => (
        <div
          key={line.label}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-muted-foreground flex items-center gap-1.5">
            {line.color ? (
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: line.color }}
              />
            ) : null}
            {line.label}
          </span>
          <span className="font-medium tabular-nums">{line.value}</span>
        </div>
      ))}
    </div>
  );
}

type TimeRawKey =
  | "avg_resolution_time"
  | "avg_first_response_time"
  | "avg_reply_time";

const TIME_BAR_COLORS: Record<TimeRawKey, string> = {
  avg_resolution_time: timeChartConfig.resolutionVisual.color as string,
  avg_first_response_time: timeChartConfig.firstResponseVisual.color as string,
  avg_reply_time: timeChartConfig.replyVisual.color as string,
};

function TimeBarShape(rawKey: TimeRawKey) {
  return function Shape({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    payload,
  }: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    payload?: AgentChartRow;
  }) {
    const raw = payload?.[rawKey];
    const barFill = TIME_BAR_COLORS[rawKey] || fill;
    if (raw == null) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={56}
            height={height}
            rx={4}
            fill="transparent"
            stroke="var(--border)"
            strokeDasharray="4 3"
          />
          <text
            x={x + 10}
            y={y + height / 2}
            dy={4}
            className="fill-muted-foreground text-[10px]"
          >
            {COUNT_NA}
          </text>
        </g>
      );
    }

    const barWidth = raw === 0 ? Math.max(width, 16) : Math.max(width, 0);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={barWidth}
          height={height}
          rx={4}
          fill={barFill}
          opacity={raw === 0 ? 0.45 : 1}
        />
        {raw === 0 ? (
          <text
            x={x + barWidth + 6}
            y={y + height / 2}
            dy={4}
            className="fill-muted-foreground text-[10px] tabular-nums"
          >
            {formatDurationFromMs(raw)}
          </text>
        ) : null}
      </g>
    );
  };
}

const ResolutionBarShape = TimeBarShape("avg_resolution_time");
const FirstResponseBarShape = TimeBarShape("avg_first_response_time");
const ReplyBarShape = TimeBarShape("avg_reply_time");

function TimeEndLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string | null;
}) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n === 0) return null;

  return (
    <text
      x={Number(x) + Number(width) + 6}
      y={Number(y) + Number(height) / 2}
      dy={4}
      className="fill-muted-foreground text-[10px] tabular-nums"
    >
      {formatDurationFromMs(n)}
    </text>
  );
}

function CountBarShape(props: unknown) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    payload,
    dataKey,
  } = (props ?? {}) as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    payload?: AgentChartRow;
    dataKey?: string;
  };
  const key =
    dataKey === "resolved_conversations_count"
      ? "resolved_conversations_count"
      : "conversations_count";
  const raw = payload?.[key] ?? null;
  const barFill =
    (key === "resolved_conversations_count"
      ? countChartConfig.resolved_conversations_count.color
      : countChartConfig.conversations_count.color) || fill;

  if (raw == null) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={56}
          height={height}
          rx={4}
          fill="transparent"
          stroke="var(--border)"
          strokeDasharray="4 3"
        />
        <text
          x={x + 10}
          y={y + height / 2}
          dy={4}
          className="fill-muted-foreground text-[10px]"
        >
          {COUNT_NA}
        </text>
      </g>
    );
  }

  const barWidth = raw === 0 ? Math.max(width, 16) : Math.max(width, 0);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={height}
        rx={4}
        fill={barFill}
        opacity={raw === 0 ? 0.45 : 1}
      />
      {raw === 0 ? (
        <text
          x={x + barWidth + 6}
          y={y + height / 2}
          dy={4}
          className="fill-muted-foreground text-[10px] tabular-nums"
        >
          {formatCount(raw)}
        </text>
      ) : null}
    </g>
  );
}

function CountEndLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string | null;
}) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n === 0) return null;

  return (
    <text
      x={Number(x) + Number(width) + 6}
      y={Number(y) + Number(height) / 2}
      dy={4}
      className="fill-muted-foreground text-[10px] tabular-nums"
    >
      {formatCount(n)}
    </text>
  );
}

export function GroupedSummaryBarChart({
  className,
  kind = "agent",
  since,
  until,
  hideDatePicker = false,
}: GroupedSummaryBarChartProps) {
  const copy = KIND_COPY[kind];
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const [sortKey] = useState<SortKey>("avg_resolution_time");
  const [rangeValue, setRangeValue] = useState<StartEndDateTimeValue>(
    getDefaultLast7DaysRange,
  );
  const internalRange = useMemo(() => toUnixRange(rangeValue), [rangeValue]);
  const range = {
    since: since && since > 0 ? since : internalRange.since,
    until: until && until > 0 ? until : internalRange.until,
  };

  const params = useMemo(
    () => ({
      since: range.since,
      until: range.until,
      business_hours: false,
    }),
    [range.since, range.until],
  );

  const enabled = !!tenantId && range.since > 0 && range.until >= range.since;

  const { data, isLoading, isFetching, isError } = useGetReportsGroupedSummary(
    tenantId,
    kind,
    params,
    enabled,
  );
  const { data: chatwootAgentsResponse } = useListChatwootAgents(
    kind === "agent" ? tenantId : "",
  );
  const { data: chatwootInboxesResponse } = useListTenantInboxes(
    kind === "inbox" ? tenantId : "",
  );
  const { data: chatwootTeamsResponse } = useListTenantTeams(
    kind === "team" ? tenantId : "",
  );

  const identityById = useMemo(() => {
    if (kind === "agent") return buildAgentIdentityMap(chatwootAgentsResponse);
    if (kind === "inbox") return buildInboxIdentityMap(chatwootInboxesResponse);
    if (kind === "team") return buildTeamIdentityMap(chatwootTeamsResponse);
    return new Map<string, AgentIdentity>();
  }, [
    chatwootAgentsResponse,
    chatwootInboxesResponse,
    chatwootTeamsResponse,
    kind,
  ]);

  const entities = useMemo(
    () => sortAgents(parseAgentSummaries(data?.data), sortKey),
    [data, sortKey],
  );

  const chartRows = useMemo(() => {
    const resolutionMax = maxFinite(
      entities.map((row) => row.avg_resolution_time),
    );
    const firstResponseMax = maxFinite(
      entities.map((row) => row.avg_first_response_time),
    );
    const replyMax = maxFinite(entities.map((row) => row.avg_reply_time));
    const labels = resolveEntityLabels(entities, kind, identityById);

    return entities.map((row, index) => ({
      id: labels[index]?.id ?? String(row.id),
      label: labels[index]?.label ?? copy.fallback,
      name: labels[index]?.name ?? "",
      email: labels[index]?.email ?? "",
      conversations_count: row.conversations_count,
      resolved_conversations_count: row.resolved_conversations_count,
      avg_resolution_time: row.avg_resolution_time,
      avg_first_response_time: row.avg_first_response_time,
      avg_reply_time: row.avg_reply_time,
      resolutionVisual:
        toRelativeVisual(row.avg_resolution_time, resolutionMax) ?? 0,
      firstResponseVisual:
        toRelativeVisual(row.avg_first_response_time, firstResponseMax) ?? 0,
      replyVisual: toRelativeVisual(row.avg_reply_time, replyMax) ?? 0,
    })) satisfies AgentChartRow[];
  }, [copy.fallback, entities, identityById, kind]);

  const axisIdentities = useMemo(
    () =>
      Object.fromEntries(
        chartRows.map((row) => [
          row.id,
          { name: row.name || row.label, email: row.email },
        ]),
      ),
    [chartRows],
  );

  const showInitialLoading = isLoading && !data;
  const showRefreshing = isFetching && !!data;
  const chartHeight = Math.max(240, chartRows.length * 92);

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/50 bg-card py-0 shadow-sm gap-0",
        className,
      )}
    >
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            {hideDatePicker ? null : (
              <StartAndEndDateTimePicker
                value={rangeValue}
                onChange={setRangeValue}
                numberOfMonths={2}
                placeholder="Chọn khoảng thời gian"
                align="end"
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-5 pt-4 sm:px-5">
        {showInitialLoading ? (
          <div className="flex flex-col lg:flex-row">
            <Skeleton className="h-64 w-full rounded-lg lg:mr-6 lg:flex-1" />
            <div className="bg-border my-5 h-px w-full lg:mx-0 lg:my-0 lg:h-auto lg:w-px" />
            <Skeleton className="h-64 w-full rounded-lg lg:ml-6 lg:flex-1" />
          </div>
        ) : isError && !data ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            {copy.error}
          </p>
        ) : chartRows.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            {copy.empty}
          </p>
        ) : (
          <div
            className={cn(
              "flex flex-col lg:flex-row lg:items-stretch",
              showRefreshing && "opacity-60 transition-opacity",
            )}
          >
            <div className="min-w-0 flex-1 space-y-3 lg:pr-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-tight">
                  Thời gian xử lý
                </p>
                <Legend config={timeChartConfig} />
              </div>
              <ChartContainer
                config={timeChartConfig}
                className="aspect-auto w-full justify-start [&_.recharts-wrapper]:w-full"
                style={{ height: chartHeight }}
              >
                <BarChart
                  layout="vertical"
                  data={chartRows}
                  margin={{ top: 12, right: 88, left: 0, bottom: 24 }}
                  barCategoryGap="18%"
                  barGap={6}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 100]}
                    padding={{ left: 0, right: 0 }}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => (value === 0 ? "0" : "Max")}
                  />
                  <YAxis
                    type="category"
                    dataKey="id"
                    width={96}
                    tickMargin={4}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    padding={{ top: 0, bottom: 0 }}
                    tick={(props) => (
                      <AgentAxisTick {...props} identities={axisIdentities} />
                    )}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                    content={<AgentTooltip />}
                  />
                  <Bar
                    dataKey="resolutionVisual"
                    name={timeChartConfig.resolutionVisual.label}
                    fill="var(--color-resolutionVisual)"
                    maxBarSize={18}
                    isAnimationActive={chartRows.length <= 16}
                    shape={ResolutionBarShape}
                  >
                    <LabelList
                      dataKey="avg_resolution_time"
                      content={<TimeEndLabel />}
                    />
                  </Bar>
                  <Bar
                    dataKey="firstResponseVisual"
                    name={timeChartConfig.firstResponseVisual.label}
                    fill="var(--color-firstResponseVisual)"
                    maxBarSize={18}
                    isAnimationActive={chartRows.length <= 16}
                    shape={FirstResponseBarShape}
                  >
                    <LabelList
                      dataKey="avg_first_response_time"
                      content={<TimeEndLabel />}
                    />
                  </Bar>
                  <Bar
                    dataKey="replyVisual"
                    name={timeChartConfig.replyVisual.label}
                    fill="var(--color-replyVisual)"
                    maxBarSize={18}
                    isAnimationActive={chartRows.length <= 16}
                    shape={ReplyBarShape}
                  >
                    <LabelList
                      dataKey="avg_reply_time"
                      content={<TimeEndLabel />}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            <div
              className="bg-border my-5 h-px w-full shrink-0 lg:mx-0 lg:my-0 lg:h-auto lg:w-px"
              aria-hidden
            />

            <div className="min-w-0 flex-1 space-y-3 lg:pl-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-tight">
                  Khối lượng hội thoại
                </p>
                <Legend config={countChartConfig} />
              </div>
              <ChartContainer
                config={countChartConfig}
                className="aspect-auto w-full justify-start [&_.recharts-wrapper]:w-full"
                style={{ height: chartHeight }}
              >
                <BarChart
                  layout="vertical"
                  data={chartRows}
                  margin={{ top: 12, right: 56, left: 0, bottom: 8 }}
                  barCategoryGap="20%"
                  barGap={6}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                    padding={{ left: 0, right: 0 }}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => formatCount(Number(value))}
                  />
                  <YAxis
                    type="category"
                    dataKey="id"
                    width={96}
                    tickMargin={4}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    padding={{ top: 0, bottom: 0 }}
                    tick={(props) => (
                      <AgentAxisTick {...props} identities={axisIdentities} />
                    )}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                    content={<AgentTooltip />}
                  />
                  <Bar
                    dataKey="conversations_count"
                    name={countChartConfig.conversations_count.label}
                    fill="var(--color-conversations_count)"
                    maxBarSize={20}
                    isAnimationActive={chartRows.length <= 16}
                    shape={CountBarShape as never}
                  >
                    <LabelList
                      dataKey="conversations_count"
                      content={<CountEndLabel />}
                    />
                  </Bar>
                  <Bar
                    dataKey="resolved_conversations_count"
                    name={countChartConfig.resolved_conversations_count.label}
                    fill="var(--color-resolved_conversations_count)"
                    maxBarSize={20}
                    isAnimationActive={chartRows.length <= 16}
                    shape={CountBarShape as never}
                  >
                    <LabelList
                      dataKey="resolved_conversations_count"
                      content={<CountEndLabel />}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentHorizontalBarChart(
  props: Omit<GroupedSummaryBarChartProps, "kind">,
) {
  return <GroupedSummaryBarChart kind="agent" {...props} />;
}
