"use client";

import { Building2, Loader2, Mail, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCallLogById } from "@/hooks/call-logs/use-call-logs";
import { useGetCustomerById } from "@/hooks/customer/use-customer";
import { useGetTicketById } from "@/hooks/ticket/ticket-list/use-ticket-list";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { cn } from "@/lib/utils";
import type { CallLog } from "@/services/call-logs/service";
import { getUserByIdApi } from "@/services/user/get-user-by-id";
import { convertDateTime } from "@/utils/convert-time";

interface CallLogDetailProps {
  callLog: CallLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
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
  return direction || "Không rõ";
}

function sourceLabel(source: string | null | undefined) {
  const value = String(source ?? "")
    .trim()
    .toLowerCase();
  if (!value) return "—";
  if (value === "web") return "Web";
  return value;
}

function statusTone(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "completed", "success", "ended"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (["ringing", "in_progress", "busy", "calling"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (
    ["missed", "failed", "no_answer", "cancelled", "canceled"].includes(value)
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}

function directionTone(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "outbound") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}

function sourceTone(source: string | null | undefined) {
  const value = String(source ?? "")
    .trim()
    .toLowerCase();
  if (value === "web") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (!value) return "border-border bg-muted/60 text-muted-foreground";
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300";
}

function priorityTone(priority: string | null | undefined) {
  const value = String(priority ?? "").toLowerCase();
  if (["urgent", "critical", "high", "cao", "khẩn cấp"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  if (["medium", "normal", "trung bình"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (["low", "thấp"].includes(value)) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (!value) return "border-border bg-muted/60 text-muted-foreground";
  return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300";
}

function activeTone(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
}

const RESPONSE_CODE_META: Record<string, { label: string; className: string }> =
  {
    "200": {
      label: "OK",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    "201": {
      label: "Created",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    "202": {
      label: "Accepted",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    "204": {
      label: "No Content",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    "400": {
      label: "Bad Request",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "401": {
      label: "Unauthorized",
      className:
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300",
    },
    "403": {
      label: "Forbidden",
      className:
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300",
    },
    "404": {
      label: "Not Found",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "408": {
      label: "Timeout",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "422": {
      label: "Unprocessable",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "429": {
      label: "Too Many Requests",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "480": {
      label: "Temporarily Unavailable",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "486": {
      label: "Busy Here",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    "487": {
      label: "Request Terminated",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
    "500": {
      label: "Server Error",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
    "502": {
      label: "Bad Gateway",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
    "503": {
      label: "Service Unavailable",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
    "504": {
      label: "Gateway Timeout",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
  };

function responseCodeMeta(code: unknown) {
  if (code === null || code === undefined || code === "") {
    return {
      code: "—",
      label: null as string | null,
      className: "border-border bg-muted/60 text-muted-foreground",
    };
  }

  const codeStr = String(code).trim();
  const known = RESPONSE_CODE_META[codeStr];
  if (known) {
    return { code: codeStr, label: known.label, className: known.className };
  }

  const numeric = Number(codeStr);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 200 && numeric < 300) {
      return {
        code: codeStr,
        label: "Success",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
      };
    }
    if (numeric >= 300 && numeric < 400) {
      return {
        code: codeStr,
        label: "Redirect",
        className:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
      };
    }
    if (numeric >= 400 && numeric < 500) {
      return {
        code: codeStr,
        label: "Client Error",
        className:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
      };
    }
    if (numeric >= 500) {
      return {
        code: codeStr,
        label: "Server Error",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
      };
    }
  }

  return {
    code: codeStr,
    label: null as string | null,
    className: "border-border bg-muted/60 text-muted-foreground",
  };
}

function SoftBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-semibold capitalize", className)}
    >
      {children}
    </Badge>
  );
}

function EmphValue({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "duration" | "phone" | "muted";
}) {
  const toneClass =
    tone === "phone"
      ? "font-semibold tabular-nums tracking-tight"
      : tone === "duration"
        ? "font-semibold tabular-nums tracking-tight text-violet-700 dark:text-violet-300"
        : tone === "muted"
          ? "text-muted-foreground"
          : "font-semibold tracking-tight text-foreground";

  return <span className={toneClass}>{children ?? "—"}</span>;
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <div className="flex min-h-9 items-center rounded-md border border-border bg-background px-3 py-2 text-sm leading-snug text-foreground">
        {value ?? "—"}
      </div>
    </div>
  );
}

function Section({
  title,
  loading,
  empty,
  emptyText,
  children,
}: {
  title: string;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3.5 w-0.5 rounded-sm bg-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">
          {emptyText || "Không có thông tin"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
      )}
    </section>
  );
}

export function CallLogDetail({
  callLog,
  open,
  onOpenChange,
}: CallLogDetailProps) {
  const sipCallId = open ? (callLog?.sip_call_id ?? "") : "";

  const { data: detailRes, isLoading: isLoadingCall } = useGetCallLogById(
    sipCallId,
    open && !!sipCallId,
  );
  const log = detailRes?.data ?? callLog;

  const ticketId = open ? (log?.ticket_id ?? callLog?.ticket_id ?? "") : "";
  const customerId = open
    ? (log?.customer_id ?? callLog?.customer_id ?? "")
    : "";
  const userId = open ? (log?.user_id ?? callLog?.user_id ?? "") : "";
  const tenantId = open ? (log?.tenant_id ?? callLog?.tenant_id ?? "") : "";

  const { data: ticketRes, isLoading: isLoadingTicket } = useGetTicketById(
    ticketId || "",
  );
  const { data: customerRes, isLoading: isLoadingCustomer } =
    useGetCustomerById(customerId || "");
  const { data: tenant, isLoading: isLoadingTenant } = useGetTenants(
    { id: tenantId || "__skip__" },
    { enabled: open && !!tenantId },
  );
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isUserError,
  } = useQuery({
    queryKey: ["user-by-id", userId],
    queryFn: () => getUserByIdApi(userId),
    enabled: open && !!userId,
  });

  const ticket = ticketRes?.data;
  const customer = customerRes?.data;
  const recordingUrl = log?.recording_url?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,860px)] w-full flex-col gap-0 overflow-hidden rounded-lg border border-border bg-background p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-0 border-b border-border px-5 py-3.5 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Chi tiết cuộc gọi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mr-8">
            Xem thông tin chi tiết của cuộc gọi bao gồm thời gian, trạng thái,
            số điện thoại và các dữ liệu liên quan.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isLoadingCall && !log ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : log ? (
            <>
              <Section title="Cuộc gọi">
                <Field
                  label="Số điện thoại"
                  value={
                    <EmphValue tone="phone">
                      {log.phone_number || "—"}
                    </EmphValue>
                  }
                />
                <Field
                  label="Hotline"
                  value={
                    <EmphValue tone="phone">{log.hotline || "—"}</EmphValue>
                  }
                />
                <Field
                  label="Từ số"
                  value={
                    <EmphValue tone="phone">{log.from_number || "—"}</EmphValue>
                  }
                />
                <Field
                  label="Đến số"
                  value={
                    <EmphValue tone="phone">{log.to_number || "—"}</EmphValue>
                  }
                />
                <Field
                  label="Chiều gọi"
                  value={
                    <SoftBadge className={directionTone(log.direction)}>
                      {directionLabel(log.direction)}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Trạng thái"
                  value={
                    <SoftBadge className={statusTone(log.status)}>
                      {log.status || "Không rõ"}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Thời lượng"
                  value={
                    <EmphValue tone="duration">
                      {formatDuration(log.duration)}
                    </EmphValue>
                  }
                />
                <Field
                  label="Billsec"
                  value={
                    <EmphValue tone="duration">
                      {formatDuration(log.billsec)}
                    </EmphValue>
                  }
                />
                <Field label="Bắt đầu" value={formatDateTime(log.started_at)} />
                <Field
                  label="Nghe máy"
                  value={formatDateTime(log.answered_at)}
                />
                <Field label="Kết thúc" value={formatDateTime(log.ended_at)} />
                <Field
                  label="Người thực hiện"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <User className="size-3.5 text-muted-foreground" />
                      {log.username_action_call?.trim() || "—"}
                    </span>
                  }
                />
                <Field
                  label="Kênh"
                  value={
                    <SoftBadge className={sourceTone(log.source)}>
                      {sourceLabel(log.source)}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Doanh nghiệp"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      {log.tenant_name?.trim() || "—"}
                    </span>
                  }
                />
                <Field
                  label="Ghi âm"
                  className="sm:col-span-2"
                  value={
                    recordingUrl ? (
                      <audio
                        controls
                        preload="metadata" // Đổi từ "none" thành "metadata"
                        className="h-9 w-full"
                        src={recordingUrl}
                      >
                        Trình duyệt không hỗ trợ phát audio.
                      </audio>
                    ) : (
                      "—"
                    )
                  }
                />
              </Section>

              <Section
                title="Ticket"
                loading={!!ticketId && isLoadingTicket}
                empty={!ticketId || !ticket}
                emptyText={
                  ticketId
                    ? "Không tải được thông tin ticket"
                    : "Không liên kết ticket"
                }
              >
                <Field
                  label="Mã"
                  value={<EmphValue>{ticket?.code || "—"}</EmphValue>}
                />
                <Field
                  label="Trạng thái"
                  value={
                    <SoftBadge className={statusTone(ticket?.status)}>
                      {ticket?.status || "—"}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Tiêu đề"
                  value={ticket?.title || "—"}
                  className="sm:col-span-2"
                />
                <Field
                  label="Ưu tiên"
                  value={
                    <SoftBadge className={priorityTone(ticket?.priority)}>
                      {ticket?.priority || "—"}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Người tạo"
                  value={ticket?.created_by_name || "—"}
                />
                <Field
                  label="Người xử lý"
                  value={
                    <EmphValue>{ticket?.assigned_to_name || "—"}</EmphValue>
                  }
                  className="sm:col-span-2"
                />
              </Section>

              <Section
                title="Khách hàng"
                loading={!!customerId && isLoadingCustomer}
                empty={!customerId || !customer}
                emptyText={
                  customerId
                    ? "Không tải được thông tin khách hàng"
                    : "Không liên kết khách hàng"
                }
              >
                <Field
                  label="Tên"
                  value={<EmphValue>{customer?.name || "—"}</EmphValue>}
                />
                <Field
                  label="Số điện thoại"
                  value={
                    <EmphValue tone="phone">{customer?.phone || "—"}</EmphValue>
                  }
                />
                <Field
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {customer?.email || "—"}
                    </span>
                  }
                />
                <Field
                  label="Trạng thái"
                  value={
                    customer ? (
                      <SoftBadge className={activeTone(!!customer.is_active)}>
                        {customer.is_active ? "Hoạt động" : "Không hoạt động"}
                      </SoftBadge>
                    ) : (
                      "—"
                    )
                  }
                />
              </Section>

              <Section
                title="Người dùng"
                loading={!!userId && isLoadingUser}
                empty={!userId || !user}
                emptyText={
                  !userId
                    ? "Không có người dùng gắn với cuộc gọi"
                    : isUserError
                      ? "Lỗi khi tải thông tin người dùng"
                      : "Không tải được thông tin người dùng"
                }
              >
                <Field
                  label="Username"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <User className="size-3.5 text-muted-foreground" />
                      {user?.username || "—"}
                    </span>
                  }
                />
                <Field
                  label="Họ tên"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <User className="size-3.5 text-muted-foreground" />
                      {user?.fullname || "—"}
                    </span>
                  }
                />
                <Field
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {user?.email || "—"}
                    </span>
                  }
                />
                <Field
                  label="Vai trò"
                  value={
                    <SoftBadge className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
                      {user?.role || "—"}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Cấp bậc"
                  value={
                    <SoftBadge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
                      {user?.level || "—"}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Trạng thái"
                  value={
                    user ? (
                      <SoftBadge className={activeTone(user.is_active === 1)}>
                        {user.is_active === 1 ? "Hoạt động" : "Không hoạt động"}
                      </SoftBadge>
                    ) : (
                      "—"
                    )
                  }
                />
              </Section>

              <Section
                title="Doanh nghiệp"
                loading={!!tenantId && isLoadingTenant}
                empty={!isLoadingTenant && !tenant && !log.tenant_name?.trim()}
                emptyText={
                  tenantId
                    ? "Không tải được thông tin doanh nghiệp"
                    : "Không có doanh nghiệp"
                }
              >
                {tenant ? (
                  <>
                    <Field
                      label="Tên"
                      value={<EmphValue>{tenant.name || "—"}</EmphValue>}
                    />
                    <Field
                      label="Trạng thái"
                      value={
                        <SoftBadge
                          className={activeTone(tenant.is_active === 1)}
                        >
                          {tenant.is_active === 1
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </SoftBadge>
                      }
                    />
                    <Field
                      label="Mô tả"
                      value={tenant.description || "—"}
                      className="sm:col-span-2"
                    />
                  </>
                ) : log.tenant_name?.trim() ? (
                  <Field
                    label="Tên"
                    value={<EmphValue>{log.tenant_name}</EmphValue>}
                    className="sm:col-span-2"
                  />
                ) : null}
              </Section>

              <Section
                title="Metadata"
                empty={
                  !log.meta_data || Object.keys(log.meta_data).length === 0
                }
                emptyText="Không có metadata"
              >
                <Field
                  label="Trạng thái SIP"
                  value={
                    <SoftBadge
                      className={statusTone(
                        String(log.meta_data?.status ?? ""),
                      )}
                    >
                      {String(log.meta_data?.status ?? "—")}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Ứng dụng"
                  value={
                    <SoftBadge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                      {String(log.meta_data?.application ?? "—")}
                    </SoftBadge>
                  }
                />
                <Field
                  label="Domain"
                  value={
                    <EmphValue>
                      {String(log.meta_data?.domain ?? "—")}
                    </EmphValue>
                  }
                />
                <Field
                  label="Mã phản hồi"
                  value={(() => {
                    const meta = responseCodeMeta(log.meta_data?.code);
                    return (
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <SoftBadge
                          className={cn(
                            "tabular-nums normal-case",
                            meta.className,
                          )}
                        >
                          {meta.code}
                        </SoftBadge>
                        {meta.label ? (
                          <SoftBadge
                            className={cn("normal-case", meta.className)}
                          >
                            {meta.label}
                          </SoftBadge>
                        ) : null}
                      </span>
                    );
                  })()}
                />
                <Field
                  label="Hangup disposition"
                  value={
                    <SoftBadge className="border-border bg-muted/60 text-foreground">
                      {String(log.meta_data?.sip_hangup_disposition ?? "—")}
                    </SoftBadge>
                  }
                  className="sm:col-span-2"
                />
              </Section>
            </>
          ) : (
            <p className="py-14 text-center text-sm text-muted-foreground">
              Không có dữ liệu cuộc gọi
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3 sm:justify-end">
          <Button
            className="rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
