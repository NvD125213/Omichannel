import {
  format,
  isThisWeek,
  isThisYear,
  isToday,
  isYesterday,
  isValid,
} from "date-fns";

/**
 * Convert mọi loại timestamp về Date an toàn
 */

export function getTime(value: unknown): number {
  const d = coerceToDate(value);
  return d ? d.getTime() : 0; // fallback nhỏ nhất
}

export function coerceToDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  // Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // Number
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e11 ? value * 1000 : value; // rõ ràng hơn
    const d = new Date(ms);
    return isValid(d) ? d : null;
  }

  // String
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // numeric string
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isFinite(num)) return null;

      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isValid(d) ? d : null;
    }

    // ISO hoặc format khác
    const d = new Date(trimmed);
    return isValid(d) ? d : null;
  }

  return null;
}
export function formatMessageTime(timestamp: unknown): string {
  const date = coerceToDate(timestamp);

  if (!date) return "--";

  if (isToday(date)) {
    return format(date, "HH:mm"); // 24h cho consistent UI
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  if (isThisWeek(date)) {
    return format(date, "EEEE");
  }

  if (isThisYear(date)) {
    return format(date, "MMM d");
  }

  return format(date, "dd/MM/yyyy");
}
