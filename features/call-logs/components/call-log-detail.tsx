"use client";

import { Loader2 } from "lucide-react";

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
import { useListUser } from "@/hooks/user/use-list-user";
import { cn } from "@/lib/utils";
import type { CallLog } from "@/services/call-logs/service";
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
    return "bg-primary/10 text-primary";
  }
  if (["ringing", "in_progress", "busy", "calling"].includes(value)) {
    return "bg-secondary text-secondary-foreground";
  }
  if (
    ["missed", "failed", "no_answer", "cancelled", "canceled"].includes(value)
  ) {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
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
      <div className="min-h-9 rounded-md border border-border bg-background px-3 py-2 text-sm leading-snug text-foreground">
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
  const { data: tenantData, isLoading: isLoadingTenant } = useGetTenants(
    { id: tenantId || undefined, page: 1, page_size: 1 },
    { enabled: open && !!tenantId },
  );
  const {
    data: usersData,
    isLoading: isLoadingUser,
    isError: isUserError,
  } = useListUser(
    { id: userId || undefined, page: 1, page_size: 1 },
    { enabled: open && !!userId },
  );

  const ticket = ticketRes?.data;
  const customer = customerRes?.data;
  const tenant = tenantData?.items?.[0];
  const user = usersData?.data?.items?.[0];
  const recordingUrl = log?.recording_url?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,860px)] w-full flex-col gap-0 overflow-hidden rounded-lg border border-border bg-background p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-0 border-b border-border px-5 py-3.5 text-left">
          <DialogDescription className="sr-only">
            Thông tin cuộc gọi và dữ liệu liên quan.
          </DialogDescription>

          {log ? (
            <div className="space-y-2.5 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  {log.phone_number || "Chi tiết cuộc gọi"}
                </DialogTitle>
                <Tag className="bg-primary/10 text-primary">
                  {directionLabel(log.direction)}
                </Tag>
                <Tag className={statusTone(log.status)}>
                  {log.status || "Không rõ"}
                </Tag>
                <Tag className="bg-muted text-muted-foreground">
                  {sourceLabel(log.source)}
                </Tag>
              </div>

              <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-baseline gap-1.5">
                  <dt>Thời lượng</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatDuration(log.duration)}
                  </dd>
                </div>
                <div className="hidden h-3 w-px bg-border sm:block" />
                <div className="flex items-baseline gap-1.5">
                  <dt>Billsec</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatDuration(log.billsec)}
                  </dd>
                </div>
                <div className="hidden h-3 w-px bg-border sm:block" />
                <div className="flex items-baseline gap-1.5">
                  <dt>Nghe máy</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatDateTime(log.answered_at)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Chi tiết cuộc gọi
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isLoadingCall && !log ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : log ? (
            <>
              <Section title="Cuộc gọi">
                <Field label="Số điện thoại" value={log.phone_number || "—"} />
                <Field label="Hotline" value={log.hotline || "—"} />
                <Field label="Từ số" value={log.from_number || "—"} />
                <Field label="Đến số" value={log.to_number || "—"} />
                <Field
                  label="Chiều gọi"
                  value={directionLabel(log.direction)}
                />
                <Field
                  label="Trạng thái"
                  value={
                    <Tag className={statusTone(log.status)}>
                      {log.status || "Không rõ"}
                    </Tag>
                  }
                />
                <Field
                  label="Thời lượng"
                  value={formatDuration(log.duration)}
                />
                <Field label="Billsec" value={formatDuration(log.billsec)} />
                <Field label="Bắt đầu" value={formatDateTime(log.started_at)} />
                <Field
                  label="Nghe máy"
                  value={formatDateTime(log.answered_at)}
                />
                <Field label="Kết thúc" value={formatDateTime(log.ended_at)} />
                <Field
                  label="Người thực hiện"
                  value={log.username_action_call?.trim() || "—"}
                />
                <Field label="Kênh" value={sourceLabel(log.source)} />
                <Field
                  label="Doanh nghiệp"
                  value={log.tenant_name?.trim() || "—"}
                />
                <Field
                  label="Ghi âm"
                  className="sm:col-span-2"
                  value={
                    recordingUrl ? (
                      <audio
                        controls
                        preload="none"
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
                <Field label="Mã" value={ticket?.code || "—"} />
                <Field label="Trạng thái" value={ticket?.status || "—"} />
                <Field
                  label="Tiêu đề"
                  value={ticket?.title || "—"}
                  className="sm:col-span-2"
                />
                <Field label="Ưu tiên" value={ticket?.priority || "—"} />
                <Field
                  label="Người tạo"
                  value={ticket?.created_by_name || "—"}
                />
                <Field
                  label="Người xử lý"
                  value={ticket?.assigned_to_name || "—"}
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
                <Field label="Tên" value={customer?.name || "—"} />
                <Field label="Số điện thoại" value={customer?.phone || "—"} />
                <Field label="Email" value={customer?.email || "—"} />
                <Field
                  label="Trạng thái"
                  value={
                    customer
                      ? customer.is_active
                        ? "Hoạt động"
                        : "Không hoạt động"
                      : "—"
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
                <Field label="Username" value={user?.username || "—"} />
                <Field label="Họ tên" value={user?.fullname || "—"} />
                <Field label="Email" value={user?.email || "—"} />
                <Field label="Vai trò" value={user?.role || "—"} />
                <Field label="Cấp bậc" value={user?.level || "—"} />
                <Field
                  label="Trạng thái"
                  value={
                    user
                      ? user.is_active === 1
                        ? "Hoạt động"
                        : "Không hoạt động"
                      : "—"
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
                    <Field label="Tên" value={tenant.name || "—"} />
                    <Field
                      label="Trạng thái"
                      value={
                        tenant.is_active === 1 ? "Hoạt động" : "Không hoạt động"
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
                    value={log.tenant_name}
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
                  value={String(log.meta_data?.status ?? "—")}
                />
                <Field
                  label="Ứng dụng"
                  value={String(log.meta_data?.application ?? "—")}
                />
                <Field
                  label="Domain"
                  value={String(log.meta_data?.domain ?? "—")}
                />
                <Field
                  label="Mã phản hồi"
                  value={String(log.meta_data?.code ?? "—")}
                />
                <Field
                  label="Hangup disposition"
                  value={String(log.meta_data?.sip_hangup_disposition ?? "—")}
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
