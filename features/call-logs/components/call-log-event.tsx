"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  IconMoodEmpty,
  IconPhoneCall,
  IconChevronDown,
  IconListTree,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { EmptyData } from "@/components/empty-data";
import { TimelineCallLog } from "@/components/timeline-call-log";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetCallLogEvents } from "@/hooks/call-logs/use-call-logs";
import { cn } from "@/lib/utils";
import type {
  CallLogEvent as CallLogEventItem,
  CallLogEventPayload,
} from "@/services/call-logs/service";
import { convertDateTime } from "@/utils/convert-time";

interface CallLogEventProps {
  sipCallId: string | null;
  phoneNumber?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYLOAD_LABELS: Record<string, string> = {
  code: "Mã phản hồi",
  state: "State",
  status: "Trạng thái",
  domain: "Domain",
  domain_name: "Domain",
  domain_uuid: "Domain UUID",
  billsec: "Billsec",
  duration: "Thời lượng",
  call_id: "Call ID",
  sip_call_id: "SIP Call ID",
  hotline: "Hotline",
  direction: "Chiều gọi",
  from_number: "Từ số",
  to_number: "Đến số",
  application: "Ứng dụng",
  lead_uuid: "Lead UUID",
  campaign_uuid: "Campaign UUID",
  recording_url: "Ghi âm",
  time_started: "Bắt đầu",
  time_answered: "Nghe máy",
  time_ended: "Kết thúc",
  press_key: "Phím bấm",
  receive_dest: "Receive dest",
  ref_id: "Ref ID",
  sip_hangup_disposition: "Hangup",
};

/** 3 nhóm: Cuộc gọi | Thời lượng; Kết quả (gồm field id, không còn section riêng) */
const PAYLOAD_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: "Cuộc gọi",
    keys: ["from_number", "to_number", "hotline", "direction", "application"],
  },
  {
    title: "Thời lượng & thời điểm",
    keys: [
      "duration",
      "billsec",
      "time_started",
      "time_answered",
      "time_ended",
    ],
  },
  {
    title: "Kết quả",
    keys: [
      "status",
      "state",
      "code",
      "sip_hangup_disposition",
      "press_key",
      "recording_url",
    ],
  },
];

/** Field định danh — không hiển thị */
const HIDDEN_PAYLOAD_KEYS = new Set([
  "call_id",
  "sip_call_id",
  "lead_uuid",
  "campaign_uuid",
  "domain",
  "domain_name",
  "domain_uuid",
  "receive_dest",
  "ref_id",
]);

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return convertDateTime(value, "short").datetime;
  } catch {
    return value;
  }
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function stateTone(state: string | null | undefined) {
  const value = String(state ?? "").toLowerCase();
  if (["answered", "completed", "success"].includes(value)) {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-700";
  }
  if (["ringing", "calling", "in_progress", "dial"].includes(value)) {
    return "border-amber-200/80 bg-amber-50 text-amber-700";
  }
  if (
    ["hangup", "missed", "failed", "no_answer", "cancelled"].includes(value)
  ) {
    return "border-red-200/80 bg-red-50 text-red-700";
  }
  if (value === "cdr") {
    return "border-violet-200/80 bg-violet-50 text-violet-700";
  }
  return "border-border bg-transparent text-muted-foreground";
}

function directionTone(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-700";
  }
  if (value === "outbound") {
    return "border-sky-200/80 bg-sky-50 text-sky-700";
  }
  return "border-border bg-transparent text-muted-foreground";
}

function directionLabel(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") return "Gọi vào";
  if (value === "outbound") return "Gọi ra";
  return direction || "—";
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === "";
}

function formatPayloadValue(key: string, value: unknown): ReactNode {
  if (isEmptyValue(value)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (key === "direction" && typeof value === "string") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-6 rounded-sm px-1.5 text-[12px] font-semibold",
          directionTone(value),
        )}
      >
        {directionLabel(value)}
      </Badge>
    );
  }

  if (key === "state" || key === "status") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-6 rounded-sm px-1.5 text-[12px] font-semibold capitalize",
          stateTone(String(value)),
        )}
      >
        {String(value)}
      </Badge>
    );
  }

  if ((key === "duration" || key === "billsec") && typeof value === "number") {
    return (
      <span className="text-[14px] font-semibold tabular-nums text-foreground">
        {formatDuration(value)}
      </span>
    );
  }

  if (
    (key === "from_number" || key === "to_number" || key === "hotline") &&
    (typeof value === "string" || typeof value === "number")
  ) {
    return (
      <span className="text-[14px] font-semibold tabular-nums tracking-tight text-foreground">
        {String(value)}
      </span>
    );
  }

  if (key === "recording_url" && typeof value === "string") {
    return (
      <audio
        controls
        preload="none"
        className="h-8 w-full max-w-xs"
        src={value}
      >
        Audio không hỗ trợ.
      </audio>
    );
  }

  if (typeof value === "object") {
    return (
      <span className="font-mono text-[12px] text-muted-foreground">
        {JSON.stringify(value)}
      </span>
    );
  }

  const text = String(value);
  const isUuidLike = text.length > 28;
  return (
    <span
      className={cn(
        "break-all text-[14px] leading-snug text-foreground",
        isUuidLike && "font-mono text-[12px] text-muted-foreground",
      )}
      title={text}
    >
      {isUuidLike ? `${text.slice(0, 8)}…${text.slice(-6)}` : text}
    </span>
  );
}

function PayloadField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-x-2 border-b border-border/50 py-1.5 last:border-b-0">
      <dt className="truncate text-[13px] font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function PayloadGrid({ payload }: { payload: CallLogEventPayload | null }) {
  const { sections, leftover } = useMemo(() => {
    if (!payload) return { sections: [], leftover: [] as [string, unknown][] };

    const used = new Set<string>(HIDDEN_PAYLOAD_KEYS);
    const built = PAYLOAD_SECTIONS.map((section) => {
      const fields = section.keys
        .map((key) => {
          if (
            HIDDEN_PAYLOAD_KEYS.has(key) ||
            !(key in payload) ||
            isEmptyValue(payload[key])
          ) {
            return null;
          }
          used.add(key);
          return [key, payload[key]] as [string, unknown];
        })
        .filter(Boolean) as [string, unknown][];

      return { title: section.title, fields };
    });

    const extra = Object.entries(payload).filter(
      ([key, value]) => !used.has(key) && !isEmptyValue(value),
    );

    return { sections: built, leftover: extra };
  }, [payload]);

  const hasAnyField =
    sections.some((s) => s.fields.length > 0) || leftover.length > 0;

  if (!hasAnyField) {
    return <p className="text-sm text-muted-foreground">Không có payload</p>;
  }

  const [callSection, timeSection, resultSection] = sections;

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <section className="min-w-0 py-2 sm:border-r sm:border-border sm:pr-3">
          <h4 className="mb-1 text-[13px] font-semibold tracking-tight text-foreground">
            {callSection?.title}
          </h4>
          {callSection && callSection.fields.length > 0 ? (
            <dl>
              {callSection.fields.map(([key, value]) => (
                <PayloadField key={key} label={PAYLOAD_LABELS[key] || key}>
                  {formatPayloadValue(key, value)}
                </PayloadField>
              ))}
            </dl>
          ) : (
            <p className="py-1 text-[13px] text-muted-foreground">—</p>
          )}
        </section>

        <section className="min-w-0 border-t border-border py-2 sm:border-t-0 sm:pl-3">
          <h4 className="mb-1 text-[13px] font-semibold tracking-tight text-foreground">
            {timeSection?.title}
          </h4>
          {timeSection && timeSection.fields.length > 0 ? (
            <dl>
              {timeSection.fields.map(([key, value]) => (
                <PayloadField key={key} label={PAYLOAD_LABELS[key] || key}>
                  {formatPayloadValue(key, value)}
                </PayloadField>
              ))}
            </dl>
          ) : (
            <p className="py-1 text-[13px] text-muted-foreground">—</p>
          )}
        </section>
      </div>

      <section className="min-w-0 border-t border-border py-2">
        <h4 className="mb-1 text-[13px] font-semibold tracking-tight text-foreground">
          {resultSection?.title}
        </h4>
        {resultSection && resultSection.fields.length > 0 ? (
          <dl>
            {resultSection.fields.map(([key, value]) => (
              <PayloadField key={key} label={PAYLOAD_LABELS[key] || key}>
                {formatPayloadValue(key, value)}
              </PayloadField>
            ))}
          </dl>
        ) : (
          <p className="py-1 text-[13px] text-muted-foreground">—</p>
        )}
      </section>

      {leftover.length > 0 ? (
        <section className="min-w-0 border-t border-border py-2">
          <h4 className="mb-1 text-[13px] font-semibold text-foreground">
            Khác
          </h4>
          <dl>
            {leftover.map(([key, value]) => (
              <PayloadField key={key} label={PAYLOAD_LABELS[key] || key}>
                {formatPayloadValue(key, value)}
              </PayloadField>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function EventSummary({ event }: { event: CallLogEventItem }) {
  const direction = event.payload?.direction;
  const from = event.payload?.from_number;
  const to = event.payload?.to_number;
  const duration = event.payload?.duration;
  const billsec = event.payload?.billsec;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "h-6 rounded-sm px-1.5 text-[12px] font-semibold capitalize",
            stateTone(event.state),
          )}
        >
          {event.state || "—"}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "h-6 rounded-sm px-1.5 text-[12px] font-semibold",
            directionTone(direction),
          )}
        >
          {directionLabel(direction)}
        </Badge>
        <span className="text-[12px] font-medium text-muted-foreground">
          {event.application || "—"}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-[14px] font-semibold tabular-nums tracking-tight text-foreground">
          {from || "—"}
          <span className="mx-1.5 font-normal text-muted-foreground">→</span>
          {to || "—"}
        </span>
        <span className="text-[13px] tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatDuration(duration)}
          </span>
          <span className="mx-1 text-border">·</span>
          bill {formatDuration(billsec)}
        </span>
        <span className="ml-auto text-[12px] whitespace-nowrap text-muted-foreground">
          {formatDateTime(event.event_at)}
        </span>
      </div>
    </div>
  );
}

export function CallLogEvent({
  sipCallId,
  phoneNumber,
  open,
  onOpenChange,
}: CallLogEventProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useGetCallLogEvents(
    sipCallId ?? "",
    { page: 1, page_size: 50 },
    open && !!sipCallId,
  );

  const events = data?.data?.items ?? [];
  const meta = data?.data;

  const handleOpenChange = (next: boolean) => {
    if (!next) setExpandedIds([]);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-screen flex-col gap-0 overflow-hidden border-l border-border bg-background p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 space-y-1.5 border-b border-border bg-background px-5 py-4 text-left">
          <p className="text-[12px] font-medium text-muted-foreground">
            Call timeline
          </p>
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <IconListTree className="size-5 shrink-0" stroke={1.5} />
            Sự kiện cuộc gọi
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-[13px] text-muted-foreground">
              {phoneNumber ? (
                <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground">
                  <IconPhoneCall className="size-3.5 shrink-0" stroke={1.5} />
                  {phoneNumber}
                </span>
              ) : null}
              {phoneNumber && meta?.total != null ? (
                <span className="text-border">·</span>
              ) : null}
              {meta?.total != null ? <span>{meta.total} event</span> : null}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!sipCallId ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Không có sip_call_id
            </p>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
              <div className="flex items-center justify-center gap-2 pt-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải…
              </div>
            </div>
          ) : isError ? (
            <p className="py-16 text-center text-sm text-red-600">
              Không tải được danh sách sự kiện
            </p>
          ) : events.length === 0 ? (
            <EmptyData
              icon={IconMoodEmpty}
              title="Chưa có sự kiện"
              description="Cuộc gọi này chưa ghi nhận call event nào."
              showButton={false}
              buttonText=""
              onButtonClick={() => null}
            />
          ) : (
            <div className="space-y-5">
              <TimelineCallLog events={events} />
              <Accordion
                type="multiple"
                value={expandedIds}
                onValueChange={setExpandedIds}
                className="w-full border-border"
              >
              {events.map((event, index) => {
                const isOpen = expandedIds.includes(event.id);
                const isLast = index === events.length - 1;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.03, 0.18),
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  >
                    <AccordionItem value={event.id} className="border-0">
                      <AccordionTrigger
                        className={cn(
                          "gap-3 px-1 py-3 hover:no-underline [&>svg]:hidden",
                          "transition-colors duration-200 hover:bg-muted/40",
                        )}
                      >
                        <EventSummary event={event} />
                        <span
                          aria-hidden
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm",
                            "transition-[transform,background-color,color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                            "hover:border-foreground/20 hover:bg-muted",
                            isOpen &&
                              "rotate-180 border-foreground bg-foreground text-background",
                          )}
                        >
                          <IconChevronDown className="size-4" stroke={1.75} />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-4">
                        <PayloadGrid payload={event.payload} />
                      </AccordionContent>
                    </AccordionItem>

                    {!isLast ? (
                      <div
                        aria-hidden
                        className="mx-1 flex items-center gap-2 py-1"
                      >
                        <span className="h-px flex-1 bg-border" />
                        <span className="size-1 shrink-0 rounded-full bg-muted-foreground/40" />
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
              </Accordion>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
