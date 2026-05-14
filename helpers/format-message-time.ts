import {
  isThisWeek,
  isThisYear,
  isToday,
  isYesterday,
  isValid,
} from "date-fns";

const vietnameseTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const vietnameseWeekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
});

const vietnameseMonthDayFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "short",
});

const vietnameseDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

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
    return vietnameseTimeFormatter.format(date);
  }

  if (isYesterday(date)) {
    return "Hôm qua";
  }

  if (isThisWeek(date)) {
    const formattedWeekday = vietnameseWeekdayFormatter.format(date).trim();
    return formattedWeekday.charAt(0).toUpperCase() + formattedWeekday.slice(1);
  }

  if (isThisYear(date)) {
    return vietnameseMonthDayFormatter.format(date);
  }

  return vietnameseDateFormatter.format(date);
}

export function formatConversationTimeParts(timestamp: unknown): string {
  const date = coerceToDate(timestamp);

  if (!date) {
    return "--";
  }

  if (isToday(date)) {
    return vietnameseTimeFormatter.format(date);
  }

  if (isYesterday(date)) {
    return "Hôm qua";
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;

  if (isThisYear(date)) {
    return `${day} thg ${month}`;
  }

  return `${day} thg ${month}, ${date.getFullYear()}`;
}
