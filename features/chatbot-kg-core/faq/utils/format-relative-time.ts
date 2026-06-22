import { convertDateTime, parseApiDateTime } from "@/utils/convert-time";

export function formatRelativeTime(isoString: string): string {
  const then = parseApiDateTime(isoString).getTime();
  const diffMs = Date.now() - then;

  if (Number.isNaN(then)) return "—";

  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 5) return `${diffWeeks} tuần trước`;

  return convertDateTime(isoString, "short").date;
}
