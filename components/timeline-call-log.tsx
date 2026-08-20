"use client";

import { Fragment, useMemo } from "react";
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";
import type { CallLogEvent } from "@/services/call-logs/service";

type EventTone = {
  bar: string;
  chip: string;
  pin: string;
  stem: string;
  text: string;
};

type Fact = {
  key: string;
  label: string;
  value: unknown;
};

type EventColumn = {
  id: string;
  state: string;
  label: string;
  at: Date | null;
  facts: Fact[];
  recordingUrl: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  direction: string | null;
  status: string | null;
};

const EASE = [0.32, 0.72, 0, 1] as const;
const CHEVRON_INSET = 14;

const PRIMARY_TONE: EventTone = {
  bar: "bg-primary",
  chip: "bg-primary/10 text-primary",
  pin: "bg-primary",
  stem: "bg-primary/35",
  text: "text-primary",
};

const BAR_BY_STATE: Record<string, string> = {
  calling: "bg-primary/65",
  started: "bg-primary/65",
  ringing: "bg-primary/75",
  answered: "bg-primary/90",
  hangup: "bg-primary",
  ended: "bg-primary",
  cdr: "bg-primary",
};

const HIDDEN_KEYS = new Set([
  "id",
  "call_log_id",
  "tenant_id",
  "sip_call_id",
  "provider_call_id",
  "call_id",
  "domain_uuid",
  "lead_uuid",
  "campaign_uuid",
  "idempotency_key",
  "ref_id",
  "receive_dest",
]);

const SKIP_IN_COLUMN = new Set([
  "from_number",
  "to_number",
  "direction",
  "state",
  "status",
  "event_at",
  "recording_url",
]);

const FIELD_LABEL: Record<string, string> = {
  hotline: "Hotline",
  application: "Ứng dụng",
  code: "Mã",
  duration: "Tổng",
  billsec: "Nói",
  domain: "Domain",
  domain_name: "Domain",
  user_agent: "User agent",
  received_at: "Nhận lúc",
  status: "Trạng thái",
  press_key: "Phím bấm",
  sip_hangup_disposition: "Hangup",
  time_started: "Bắt đầu",
  time_answered: "Nghe máy",
  time_ended: "Kết thúc",
};

const STATE_LABEL: Record<string, string> = {
  calling: "Bắt đầu",
  started: "Bắt đầu",
  ringing: "Đổ chuông",
  answered: "Nghe máy",
  hangup: "Kết thúc",
  ended: "Kết thúc",
  cdr: "CDR",
};

function eventTone(): EventTone {
  return PRIMARY_TONE;
}

function eventBarClass(state: string) {
  return BAR_BY_STATE[state] ?? "bg-primary/80";
}

function parseFlexibleDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (/T/.test(trimmed) || /Z$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
      const date = parseApiDateTime(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const local = new Date(trimmed.replace(" ", "T"));
    return Number.isNaN(local.getTime()) ? null : local;
  } catch {
    return null;
  }
}

function formatClock(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatGap(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return secs ? `${mins}p ${secs}s` : `${mins}p`;
}

function formatFullDateTime(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy} ${formatClock(date)}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  try {
    return convertDateTime(value, "short").datetime;
  } catch {
    return value;
  }
}

function directionLabel(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") return "Gọi vào";
  if (value === "outbound") return "Gọi ra";
  return null;
}

function statusLabel(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "completed", "success"].includes(value)) return "Đã nghe";
  if (["missed", "no_answer"].includes(value)) return "Nhỡ máy";
  if (["failed", "busy", "cancelled", "canceled"].includes(value)) {
    return "Không thành công";
  }
  if (value === "hangup" || value === "ended") return "Kết thúc";
  if (value === "ringing" || value === "calling") return "Đang đổ chuông";
  if (value === "cdr") return "CDR";
  return status ? status : null;
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === "";
}

function isUuidLike(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isHiddenKey(key: string) {
  if (HIDDEN_KEYS.has(key)) return true;
  if (key === "press_key") return false;
  return /(_id|_uuid|_key)$/.test(key);
}

function eventLabel(state: string) {
  return STATE_LABEL[state] || state || "Sự kiện";
}

function collectEventFacts(event: CallLogEvent): Fact[] {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const bag: Record<string, unknown> = { ...payload };

  if (event.application && bag.application == null) {
    bag.application = event.application;
  }
  if (event.received_at && bag.received_at == null) {
    bag.received_at = event.received_at;
  }
  if (event.event_at && bag.received_at === event.event_at) {
    delete bag.received_at;
  }
  if (typeof bag.domain === "string" && bag.domain_name === bag.domain) {
    delete bag.domain_name;
  }

  const preferred = [
    "hotline",
    "application",
    "code",
    "billsec",
    "duration",
    "status",
    "time_started",
    "time_answered",
    "time_ended",
    "domain",
    "domain_name",
    "user_agent",
    "press_key",
    "sip_hangup_disposition",
    "received_at",
  ];

  const seen = new Set<string>();
  const facts: Fact[] = [];

  const push = (key: string, value: unknown) => {
    if (seen.has(key) || SKIP_IN_COLUMN.has(key) || isHiddenKey(key)) return;
    if (isEmptyValue(value) || isUuidLike(value)) return;
    seen.add(key);
    facts.push({
      key,
      label: FIELD_LABEL[key] || key.replace(/_/g, " "),
      value,
    });
  };

  for (const key of preferred) push(key, bag[key]);
  for (const [key, value] of Object.entries(bag)) push(key, value);

  return facts;
}

function buildColumns(events: CallLogEvent[]): EventColumn[] {
  const sorted = [...events].sort((a, b) => {
    const aTime = parseFlexibleDate(a.event_at)?.getTime() ?? 0;
    const bTime = parseFlexibleDate(b.event_at)?.getTime() ?? 0;
    return aTime - bTime;
  });

  return sorted.map((event) => {
    const payload = event.payload;
    const state = String(event.state ?? payload?.state ?? "").toLowerCase();

    return {
      id: event.id,
      state,
      label: eventLabel(state),
      at:
        parseFlexibleDate(event.event_at) ??
        parseFlexibleDate(event.received_at),
      facts: collectEventFacts(event),
      recordingUrl: payload?.recording_url
        ? String(payload.recording_url)
        : null,
      fromNumber: payload?.from_number ? String(payload.from_number) : null,
      toNumber: payload?.to_number ? String(payload.to_number) : null,
      direction: payload?.direction ? String(payload.direction) : null,
      status: payload?.status ? String(payload.status) : event.state,
    };
  });
}

function chevronClip() {
  return `polygon(0 0, calc(100% - ${CHEVRON_INSET}px) 0, 100% 50%, calc(100% - ${CHEVRON_INSET}px) 100%, 0 100%)`;
}

function statusTextClass(status: string | null) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "completed", "success"].includes(value)) {
    return "text-primary";
  }
  if (
    [
      "missed",
      "no_answer",
      "failed",
      "busy",
      "cancelled",
      "canceled",
    ].includes(value)
  ) {
    return "text-destructive";
  }
  return "text-foreground";
}

function formatFactClock(value: unknown) {
  const date = parseFlexibleDate(String(value ?? ""));
  return date ? formatClock(date) : String(value ?? "");
}

function formatFactValue(fact: Fact) {
  const { key, value } = fact;

  if (key === "billsec" || key === "duration") {
    const text = formatDuration(
      typeof value === "number" ? value : Number(value),
    );
    return (
      <span
        className={cn(
          "tabular-nums",
          key === "billsec" ? "text-primary" : "text-foreground",
        )}
      >
        {text}
      </span>
    );
  }

  if (key === "code") {
    const code = Number(value);
    return (
      <span
        className={cn(
          "tabular-nums",
          code >= 200 && code < 300
            ? "text-primary"
            : code >= 400
              ? "text-destructive"
              : "text-muted-foreground",
        )}
      >
        {String(value)}
      </span>
    );
  }

  if (key === "status") {
    return (
      <span className={statusTextClass(String(value))}>
        {statusLabel(String(value)) ?? String(value)}
      </span>
    );
  }

  if (
    key === "time_started" ||
    key === "time_answered" ||
    key === "time_ended" ||
    key === "received_at"
  ) {
    return (
      <span className="tabular-nums" title={formatDateTime(String(value))}>
        {formatFactClock(value)}
      </span>
    );
  }

  if (key === "hotline" || key === "press_key") {
    return <span className="tabular-nums">{String(value)}</span>;
  }

  return <span title={String(value)}>{String(value)}</span>;
}

function EventFacts({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;

  return (
    <dl className="mt-1.5 grid w-full grid-cols-2 gap-x-3 gap-y-1.5 text-left @min-[28rem]:grid-cols-3 @min-[40rem]:mt-2 @min-[40rem]:grid-cols-4 @min-[40rem]:gap-x-4 @min-[40rem]:gap-y-2 @min-[56rem]:grid-cols-5">
      {facts.map((fact) => (
        <div key={fact.key} className="min-w-0">
          <dt className="text-xs text-muted-foreground @min-[40rem]:text-sm">
            {fact.label}
          </dt>
          <dd className="truncate text-xs font-medium text-foreground @min-[40rem]:text-sm">
            {formatFactValue(fact)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface TimelineCallLogProps {
  events: CallLogEvent[];
  className?: string;
}

export function TimelineCallLog({ events, className }: TimelineCallLogProps) {
  const reduceMotion = useReducedMotion();
  const columns = useMemo(() => buildColumns(events), [events]);

  const headerSource = [...columns]
    .reverse()
    .find((column) => column.fromNumber || column.toNumber || column.direction);
  const fromNumber = headerSource?.fromNumber ?? null;
  const toNumber = headerSource?.toNumber ?? null;
  const direction = directionLabel(headerSource?.direction);
  const status = statusLabel(headerSource?.status);
  const DirectionIcon =
    String(headerSource?.direction ?? "").toLowerCase() === "inbound"
      ? IconArrowDownLeft
      : IconArrowUpRight;

  if (events.length === 0) {
    return (
      <div className="rounded-xl bg-muted/40 p-1">
        <p className="rounded-[calc(0.75rem-2px)] bg-background px-3 py-4 text-center text-sm text-muted-foreground">
          Chưa có sự kiện để vẽ timeline.
        </p>
      </div>
    );
  }

  return (
    <motion.section
      className={cn("@container rounded-xl bg-muted/40 p-0.5 sm:p-1", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="rounded-[calc(0.75rem-2px)] bg-background px-2.5 py-2.5 @min-[40rem]:px-4 @min-[40rem]:py-3.5">
        <header className="mb-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 @min-[40rem]:mb-4 @min-[40rem]:gap-x-4 @min-[40rem]:gap-y-3">
          <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2 @min-[40rem]:gap-x-4">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Số gọi đi</p>
              <p className="mt-0.5 text-sm font-semibold tracking-tight tabular-nums text-foreground @min-[40rem]:text-[15px]">
                {fromNumber || "—"}
              </p>
            </div>
            <IconArrowRight
              className="mb-1 size-3.5 shrink-0 text-muted-foreground @min-[40rem]:mb-1.5"
              stroke={1.5}
            />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Số gọi đến</p>
              <p className="mt-0.5 text-sm font-semibold tracking-tight tabular-nums text-foreground @min-[40rem]:text-[15px]">
                {toNumber || "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            {direction ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium text-primary",
                )}
              >
                <DirectionIcon className="size-3.5" stroke={1.75} />
                {direction}
              </span>
            ) : null}
            {status ? (
              <span
                className={cn(
                  "font-medium",
                  statusTextClass(headerSource?.status ?? null),
                )}
              >
                {status}
              </span>
            ) : null}
          </div>
        </header>

        <motion.ol
          className="flex min-w-0 flex-col @min-[40rem]:flex-row @min-[40rem]:overflow-x-auto @min-[40rem]:pb-1"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.08,
                delayChildren: reduceMotion ? 0 : 0.05,
              },
            },
          }}
        >
          {columns.map((column, index) => {
            const next = columns[index + 1];
            const gapMs =
              next?.at && column.at
                ? Math.max(0, next.at.getTime() - column.at.getTime())
                : null;

            return (
              <Fragment key={column.id}>
                <EventStage
                  column={column}
                  reduceMotion={!!reduceMotion}
                />
                {gapMs != null ? (
                  <EventConnector
                    gapMs={gapMs}
                    reduceMotion={!!reduceMotion}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </motion.ol>
      </div>
    </motion.section>
  );
}

function EventConnector({
  gapMs,
  reduceMotion,
}: {
  gapMs: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.li
      className="flex h-8 w-full shrink-0 flex-row items-center justify-center @min-[40rem]:h-auto @min-[40rem]:w-14 @min-[40rem]:flex-col @min-[52rem]:w-16"
      aria-label={`Khoảng ${formatGap(gapMs)}`}
      variants={{
        hidden: reduceMotion
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.86 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.35, ease: EASE },
        },
      }}
    >
      <div className="hidden h-10 @min-[40rem]:block" aria-hidden />
      <div className="flex h-full w-8 flex-col items-center @min-[40rem]:h-12 @min-[40rem]:w-full @min-[40rem]:flex-row">
        <span className="w-px flex-1 bg-primary/25 @min-[40rem]:h-px @min-[40rem]:w-auto" />
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-[10px] font-semibold tabular-nums text-primary @min-[40rem]:size-9">
          {formatGap(gapMs)}
        </span>
        <span className="w-px flex-1 bg-primary/25 @min-[40rem]:h-px @min-[40rem]:w-auto" />
      </div>
    </motion.li>
  );
}

function EventStage({
  column,
  reduceMotion,
}: {
  column: EventColumn;
  reduceMotion: boolean;
}) {
  const tone = eventTone();

  return (
    <motion.li
      className="flex w-full min-w-0 flex-col @min-[40rem]:min-w-40 @min-[40rem]:flex-1"
      variants={{
        hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: EASE },
        },
      }}
    >
      <div className="hidden h-10 flex-col items-center justify-end px-3 @min-[40rem]:flex">
        <span
          className={cn(
            "max-w-full truncate rounded-md px-2 py-0.5 text-center text-[11px] font-semibold",
            tone.chip,
          )}
        >
          {column.label}
        </span>
        <span className={cn("h-2.5 w-px", tone.stem)} aria-hidden />
      </div>

      <div
        className={cn(
          "flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-l-md px-3 py-1 text-primary-foreground @min-[40rem]:min-h-12 @min-[40rem]:px-4 @min-[40rem]:py-1.5",
          eventBarClass(column.state),
        )}
        style={{ clipPath: chevronClip() }}
      >
        <span className="text-[11px] font-semibold tracking-wide @min-[40rem]:text-xs">
          {column.label}
        </span>
        <time
          dateTime={column.at?.toISOString()}
          className="text-[10px] tabular-nums opacity-90 @min-[40rem]:text-[11px]"
        >
          {column.at ? formatFullDateTime(column.at) : "—"}
        </time>
      </div>

      <div className="flex min-w-0 flex-col px-1.5 @min-[40rem]:px-2.5">
        <span className={cn("mx-auto h-2.5 w-px", tone.stem)} aria-hidden />
        <span
          className="relative mx-auto flex size-5 items-center justify-center"
          aria-hidden
        >
          <span
            className={cn(
              "absolute inset-0.5 rotate-45 rounded-[3px]",
              tone.pin,
            )}
          />
          <span className="relative size-1.5 rounded-full bg-background" />
        </span>

        <EventFacts facts={column.facts} />

        {column.recordingUrl ? (
          <audio
            controls
            preload="none"
            className="mt-2 h-8 w-full min-w-0"
            src={column.recordingUrl}
          >
            Trình duyệt không hỗ trợ ghi âm.
          </audio>
        ) : null}
      </div>
    </motion.li>
  );
}
