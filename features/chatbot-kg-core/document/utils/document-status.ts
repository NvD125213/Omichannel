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
    "border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-200 text-emerald-700 shadow-sm shadow-emerald-500/15 dark:border-emerald-500/40 dark:from-emerald-800/60 dark:via-emerald-900/50 dark:to-green-800/50 dark:text-emerald-200 dark:shadow-none",
  error:
    "border-rose-300/60 bg-gradient-to-br from-rose-50 via-rose-100 to-red-200 text-rose-700 shadow-sm shadow-rose-500/15 dark:border-rose-500/40 dark:from-rose-800/60 dark:via-rose-900/50 dark:to-red-800/50 dark:text-rose-200 dark:shadow-none",
  pending:
    "border-amber-300/60 bg-gradient-to-br from-amber-50 via-amber-100 to-orange-200 text-amber-700 shadow-sm shadow-amber-500/15 dark:border-amber-500/40 dark:from-amber-800/60 dark:via-amber-900/50 dark:to-orange-800/50 dark:text-amber-200 dark:shadow-none",
  skip: "border-sky-300/60 bg-gradient-to-br from-sky-50 via-sky-100 to-blue-200 text-sky-700 shadow-sm shadow-sky-500/15 dark:border-sky-500/40 dark:from-sky-800/60 dark:via-sky-900/50 dark:to-blue-800/50 dark:text-sky-200 dark:shadow-none",
  neutral:
    "border-border/60 bg-gradient-to-br from-background via-muted/60 to-accent/40 text-accent-foreground/80 dark:border-sidebar-border/50 dark:from-primary/18 dark:via-primary/10 dark:to-primary/5 dark:text-sidebar-foreground/80",
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
