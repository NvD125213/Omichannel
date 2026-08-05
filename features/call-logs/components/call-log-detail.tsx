"use client";

import {
  Building2,
  ClipboardList,
  ExternalLink,
  Loader2,
  Phone,
  User,
  UserRound,
} from "lucide-react";
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

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="break-words text-sm text-foreground">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  loading,
  empty,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">
          {emptyText || "Không có thông tin"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
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

  // Ưu tiên user_id từ API chi tiết, rồi tới bản ghi list
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
  const tenant = tenantData?.items?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-primary" />
            Chi tiết cuộc gọi
          </DialogTitle>
          <DialogDescription className="font-mono text-xs tabular-nums">
            {log?.sip_call_id || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {isLoadingCall && !log ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : log ? (
            <>
              <SectionCard title="Cuộc gọi" icon={Phone}>
                <DetailRow
                  label="Số điện thoại"
                  value={log.phone_number || "—"}
                />
                <DetailRow
                  label="Chiều gọi"
                  value={directionLabel(log.direction)}
                />
                <DetailRow
                  label="Trạng thái"
                  value={
                    <Badge variant="outline" className="capitalize">
                      {log.status || "Không rõ"}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Thời lượng"
                  value={
                    <span className="tabular-nums">
                      {formatDuration(log.duration)}
                    </span>
                  }
                />
                <DetailRow
                  label="Bắt đầu"
                  value={formatDateTime(log.started_at)}
                />
                <DetailRow
                  label="Kết thúc"
                  value={formatDateTime(log.ended_at)}
                />
                <DetailRow
                  label="Người thực hiện"
                  value={log.username_action_call?.trim() || "—"}
                />
                <DetailRow
                  label="Ghi âm"
                  value={
                    log.recording_url?.trim() ? (
                      <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 text-sm"
                      >
                        <a
                          href={log.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-3.5" />
                          Nghe ghi âm
                        </a>
                      </Button>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailRow
                  label="SIP Call ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {log.sip_call_id}
                    </span>
                  }
                  className="sm:col-span-2"
                />
              </SectionCard>

              <SectionCard
                title="Ticket"
                icon={ClipboardList}
                loading={!!ticketId && isLoadingTicket}
                empty={!ticketId || !ticket}
                emptyText={
                  ticketId
                    ? "Không tải được thông tin ticket"
                    : "Không liên kết ticket"
                }
              >
                <DetailRow label="Mã" value={ticket?.code || "—"} />
                <DetailRow label="Tiêu đề" value={ticket?.title || "—"} />
                <DetailRow label="Trạng thái" value={ticket?.status || "—"} />
                <DetailRow label="Ưu tiên" value={ticket?.priority || "—"} />
                <DetailRow
                  label="Người tạo"
                  value={ticket?.created_by_name || "—"}
                />
                <DetailRow
                  label="Người xử lý"
                  value={ticket?.assigned_to_name || "—"}
                />
              </SectionCard>

              <SectionCard
                title="Khách hàng"
                icon={UserRound}
                loading={!!customerId && isLoadingCustomer}
                empty={!customerId || !customer}
                emptyText={
                  customerId
                    ? "Không tải được thông tin khách hàng"
                    : "Không liên kết khách hàng"
                }
              >
                <DetailRow label="Tên" value={customer?.name || "—"} />
                <DetailRow label="Số điện thoại" value={customer?.phone || "—"} />
                <DetailRow label="Email" value={customer?.email || "—"} />
                <DetailRow
                  label="Trạng thái"
                  value={
                    customer
                      ? customer.is_active
                        ? "Hoạt động"
                        : "Không hoạt động"
                      : "—"
                  }
                />
              </SectionCard>

              <SectionCard
                title="Người dùng"
                icon={User}
                loading={!!userId && isLoadingUser}
                empty={!userId || !user}
                emptyText={
                  !userId
                    ? "Không có user_id gắn với cuộc gọi"
                    : isUserError
                      ? "Lỗi khi tải thông tin người dùng"
                      : "Không tải được thông tin người dùng"
                }
              >
                <DetailRow label="Username" value={user?.username || "—"} />
                <DetailRow label="Họ tên" value={user?.fullname || "—"} />
                <DetailRow label="Email" value={user?.email || "—"} />
                <DetailRow label="Vai trò" value={user?.role || "—"} />
                <DetailRow
                  label="Cấp bậc"
                  value={user?.level || "—"}
                />
                <DetailRow
                  label="Trạng thái"
                  value={
                    user
                      ? user.is_active === 1
                        ? "Hoạt động"
                        : "Không hoạt động"
                      : "—"
                  }
                />
              </SectionCard>

              <SectionCard
                title="Doanh nghiệp"
                icon={Building2}
                loading={!!tenantId && isLoadingTenant}
                empty={
                  !isLoadingTenant && !tenant && !log.tenant_name?.trim()
                }
                emptyText={
                  tenantId
                    ? "Không tải được thông tin doanh nghiệp"
                    : "Không có doanh nghiệp"
                }
              >
                {tenant ? (
                  <>
                    <DetailRow label="Tên" value={tenant.name || "—"} />
                    <DetailRow
                      label="Mô tả"
                      value={tenant.description || "—"}
                    />
                    <DetailRow
                      label="Trạng thái"
                      value={
                        tenant.is_active === 1
                          ? "Hoạt động"
                          : "Không hoạt động"
                      }
                    />
                  </>
                ) : log.tenant_name?.trim() ? (
                  <DetailRow label="Tên" value={log.tenant_name} />
                ) : null}
              </SectionCard>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Không có dữ liệu cuộc gọi
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
