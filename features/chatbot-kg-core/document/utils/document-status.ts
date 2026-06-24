export type StatusTone = "success" | "error" | "pending" | "skip" | "neutral";

export function getStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("success") ||
    normalized.includes("ready") ||
    normalized.includes("accepted")
  ) {
    return "success";
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("reject")
  ) {
    return "error";
  }

  if (normalized.includes("skip")) {
    return "skip";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("process") ||
    normalized.includes("ingest") ||
    normalized.includes("queue") ||
    normalized.includes("running") ||
    normalized.includes("run")
  ) {
    return "pending";
  }

  return "neutral";
}

export const statusToneClass: Record<StatusTone, string> = {
  success:
    "border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-emerald-400",
  error:
    "border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/35 dark:text-rose-400",
  pending:
    "border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/35 dark:text-amber-400",
  skip: "border border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-700/50 dark:bg-sky-950/35 dark:text-sky-400",
  neutral:
    "border border-border/70 bg-accent/40 text-accent-foreground/80 dark:border-sidebar-border/50 dark:bg-primary/10 dark:text-sidebar-foreground/80",
};

const statusLabelMap: Record<string, string> = {
  ready: "Sẵn sàng",
  done: "Hoàn tất",
  complete: "Hoàn tất",
  success: "Thành công",
  pending: "Đang chờ",
  processing: "Đang xử lý",
  ingest: "Đang nhập",
  queued: "Trong hàng đợi",
  queue: "Trong hàng đợi",
  running: "Đang chạy",
  run: "Đang chạy",
  fail: "Lỗi",
  failed: "Lỗi",
  error: "Lỗi",
  reject: "Từ chối",
  skip: "Bỏ qua",
  skipped: "Bỏ qua",
  accepted: "Chấp nhận",
};

export function getStatusLabel(status: string) {
  const key = status.toLowerCase();
  return statusLabelMap[key] ?? status;
}

export function isTerminalStatus(status: string) {
  const tone = getStatusTone(status);
  return tone === "success" || tone === "error" || tone === "skip";
}

export function getStatusProgress(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("ready") ||
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("success")
  ) {
    return 100;
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("reject") ||
    normalized.includes("skip")
  ) {
    return 100;
  }

  if (normalized.includes("process") || normalized.includes("ingest")) {
    return 65;
  }

  if (normalized.includes("running") || normalized.includes("run")) {
    return 55;
  }

  if (normalized.includes("pending")) {
    return 35;
  }

  if (normalized.includes("queue")) {
    return 15;
  }

  return 10;
}
