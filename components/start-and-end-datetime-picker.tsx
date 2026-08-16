"use client";

import * as React from "react";
import {
  endOfDay,
  format,
  isSameDay,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type StartEndDateTimeValue = {
  start: Date | null;
  end: Date | null;
};

/** Nhiều định dạng thường dùng khi gọi API / hiển thị. */
export type DateTimeFormats = {
  /** Đối tượng Date gốc */
  date: Date | null;
  /** ISO 8601: `2026-08-13T00:00:00.000Z` */
  iso: string | null;
  /** Datetime local: `2026-08-13 00:00:00` */
  datetime: string | null;
  /** Chỉ ngày: `2026-08-13` */
  dateOnly: string | null;
  /** Hiển thị VN: `13/08/2026 00:00` */
  display: string | null;
  /** Unix timestamp (giây) */
  timestamp: number | null;
  /** Unix timestamp (milliseconds) */
  timestampMs: number | null;
};

export type StartEndDateTimeFormats = {
  start: DateTimeFormats;
  end: DateTimeFormats;
  /** Convenience cho API report kiểu `since` / `until` (giây) */
  since: number | null;
  until: number | null;
};

export type StartAndEndDateTimePickerProps = {
  value?: StartEndDateTimeValue;
  defaultValue?: StartEndDateTimeValue;
  onChange?: (value: StartEndDateTimeValue) => void;
  /** Hiện ô chọn giờ (HH:mm). Mặc định false — start = 00:00, end = 23:59:59.999 */
  showTime?: boolean;
  numberOfMonths?: 1 | 2;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
};

/* -------------------------------------------------------------------------- */
/* Convert helpers                                                            */
/* -------------------------------------------------------------------------- */

function asValidDate(
  input: Date | string | number | null | undefined,
): Date | null {
  if (input == null || input === "") return null;

  let date: Date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "number") {
    // Heuristic: < 1e12 → giây, còn lại → ms
    date = new Date(input < 1e12 ? input * 1000 : input);
  } else {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Hỗ trợ `yyyy-MM-dd HH:mm:ss` bằng cách thay space → T
    date = parseISO(
      trimmed.includes(" ") ? trimmed.replace(" ", "T") : trimmed,
    );
    if (!isValid(date)) {
      date = new Date(trimmed);
    }
  }

  return isValid(date) ? date : null;
}

/** Parse từ timestamp / ISO / Date → Date. */
export function parseToDate(
  input: Date | string | number | null | undefined,
): Date | null {
  return asValidDate(input);
}

/** Convert 1 mốc thời gian ra nhiều định dạng. */
export function toDateTimeFormats(
  input: Date | string | number | null | undefined,
): DateTimeFormats {
  const date = asValidDate(input);
  if (!date) {
    return {
      date: null,
      iso: null,
      datetime: null,
      dateOnly: null,
      display: null,
      timestamp: null,
      timestampMs: null,
    };
  }

  return {
    date,
    iso: date.toISOString(),
    datetime: format(date, "yyyy-MM-dd HH:mm:ss"),
    dateOnly: format(date, "yyyy-MM-dd"),
    display: format(date, "dd/MM/yyyy HH:mm", { locale: vi }),
    timestamp: Math.floor(date.getTime() / 1000),
    timestampMs: date.getTime(),
  };
}

/** Convert cả khoảng start–end. */
export function toStartEndDateTimeFormats(
  value: StartEndDateTimeValue | null | undefined,
): StartEndDateTimeFormats {
  const start = toDateTimeFormats(value?.start ?? null);
  const end = toDateTimeFormats(value?.end ?? null);
  return {
    start,
    end,
    since: start.timestamp,
    until: end.timestamp,
  };
}

/** Gắn giờ:phút vào ngày (giữ nguyên ngày local). */
export function applyTimeToDate(
  date: Date,
  time: string,
  fallback: "start" | "end" = "start",
): Date {
  const next = new Date(date);
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return fallback === "start" ? startOfDay(next) : endOfDay(next);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback === "start" ? startOfDay(next) : endOfDay(next);
  }
  next.setHours(
    hours,
    minutes,
    fallback === "end" ? 59 : 0,
    fallback === "end" ? 999 : 0,
  );
  return next;
}

export function getTimeInputValue(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, "HH:mm");
}

export function getDateInputValue(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, "dd/MM/yyyy");
}

const MANUAL_DATE_FORMATS = [
  "dd/MM/yyyy",
  "d/M/yyyy",
  "dd-MM-yyyy",
  "d-M-yyyy",
  "yyyy-MM-dd",
  "dd/MM/yy",
  "d/M/yy",
] as const;

/** Parse chuỗi nhập tay → Date (ưu tiên dd/MM/yyyy). */
export function parseManualDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const pattern of MANUAL_DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date(), { locale: vi });
    if (isValid(parsed)) return parsed;
  }

  return asValidDate(trimmed);
}

export type DigitDateParts = {
  day: string;
  month: string;
  year: string;
};

export const EMPTY_DIGIT_DATE_PARTS: DigitDateParts = {
  day: "",
  month: "",
  year: "",
};

export function dateToDigitParts(
  date: Date | null | undefined,
): DigitDateParts {
  if (!date || !isValid(date)) return { ...EMPTY_DIGIT_DATE_PARTS };
  return {
    day: format(date, "dd"),
    month: format(date, "MM"),
    year: format(date, "yyyy"),
  };
}

/** Parse 3 ô số dd / MM / yyyy khi đủ. */
export function parseDigitDateParts(parts: DigitDateParts): Date | null {
  const day = parts.day.trim();
  const month = parts.month.trim();
  const year = parts.year.trim();
  if (!day || !month || year.length < 4) return null;

  const normalized = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  return parseManualDateInput(normalized);
}

export function isDigitDatePartsComplete(parts: DigitDateParts): boolean {
  return (
    parts.day.length === 2 &&
    parts.month.length === 2 &&
    parts.year.length === 4
  );
}

export function isDigitDatePartsEmpty(parts: DigitDateParts): boolean {
  return !parts.day && !parts.month && !parts.year;
}

/** Khoảng N ngày gần nhất, bao gồm hôm nay. */
function lastNDaysInclusive(days: number): StartEndDateTimeValue {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, days - 1));
  return { start, end };
}

type DateRangePreset = {
  id: string;
  label: string;
  getRange: () => StartEndDateTimeValue;
};

const DATE_RANGE_PRESET_GROUPS: DateRangePreset[][] = [
  [
    {
      id: "today",
      label: "Hôm nay",
      getRange: () => {
        const now = new Date();
        return { start: startOfDay(now), end: endOfDay(now) };
      },
    },
    {
      id: "yesterday",
      label: "Hôm qua",
      getRange: () => {
        const day = subDays(new Date(), 1);
        return { start: startOfDay(day), end: endOfDay(day) };
      },
    },
    {
      id: "last7",
      label: "7 ngày qua",
      getRange: () => lastNDaysInclusive(7),
    },
    {
      id: "last14",
      label: "14 ngày qua",
      getRange: () => lastNDaysInclusive(14),
    },
    {
      id: "last30",
      label: "30 ngày qua",
      getRange: () => lastNDaysInclusive(30),
    },
  ],
  [
    {
      id: "thisWeek",
      label: "Tuần này",
      getRange: () => {
        const now = new Date();
        return {
          start: startOfDay(startOfWeek(now, { weekStartsOn: 1 })),
          end: endOfDay(now),
        };
      },
    },
    {
      id: "thisMonth",
      label: "Tháng này",
      getRange: () => {
        const now = new Date();
        return { start: startOfMonth(now), end: endOfDay(now) };
      },
    },
    {
      id: "last3months",
      label: "3 tháng qua",
      getRange: () => {
        const end = endOfDay(new Date());
        return { start: startOfDay(subMonths(end, 3)), end };
      },
    },
    {
      id: "last6months",
      label: "6 tháng qua",
      getRange: () => {
        const end = endOfDay(new Date());
        return { start: startOfDay(subMonths(end, 6)), end };
      },
    },
    {
      id: "lastYear",
      label: "Năm qua",
      getRange: () => {
        const end = endOfDay(new Date());
        return { start: startOfDay(subYears(end, 1)), end };
      },
    },
  ],
];

function isPresetActive(
  preset: DateRangePreset,
  value: StartEndDateTimeValue,
): boolean {
  if (!value.start || !value.end) return false;
  const range = preset.getRange();
  if (!range.start || !range.end) return false;
  return isSameDay(value.start, range.start) && isSameDay(value.end, range.end);
}

/** Mặc định 7 ngày gần nhất (bao gồm hôm nay). */
export function getDefaultLast7DaysRange(): StartEndDateTimeValue {
  return lastNDaysInclusive(7);
}

function normalizeRange(
  start: Date | null,
  end: Date | null,
  showTime: boolean,
  startTime: string,
  endTime: string,
): StartEndDateTimeValue {
  if (!start && !end) return { start: null, end: null };

  let nextStart = start ? new Date(start) : null;
  let nextEnd = end ? new Date(end) : null;

  if (nextStart && nextEnd && nextStart > nextEnd) {
    const swap = nextStart;
    nextStart = nextEnd;
    nextEnd = swap;
  }

  if (!showTime) {
    if (nextStart) nextStart = startOfDay(nextStart);
    if (nextEnd) nextEnd = endOfDay(nextEnd);
  } else {
    if (nextStart)
      nextStart = applyTimeToDate(nextStart, startTime || "00:00", "start");
    if (nextEnd) nextEnd = applyTimeToDate(nextEnd, endTime || "23:59", "end");
  }

  return { start: nextStart, end: nextEnd };
}

function formatRangeLabel(
  value: StartEndDateTimeValue,
  showTime: boolean,
): string {
  const { start, end } = value;
  if (!start && !end) return "";

  const pattern = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
  if (start && end) {
    return `${format(start, pattern, { locale: vi })} – ${format(end, pattern, { locale: vi })}`;
  }
  if (start) return format(start, pattern, { locale: vi });
  if (end) return format(end, pattern, { locale: vi });
  return "";
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

type DigitDateSegmentedInputProps = {
  value: DigitDateParts;
  onChange: (next: DigitDateParts) => void;
  onComplete?: (date: Date) => void;
  onClear?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
};

/** 3 ô số dd · MM · yyyy — chỉ nhập số, tự nhảy ô tiếp theo. */
function DigitDateSegmentedInput({
  value,
  onChange,
  onComplete,
  onClear,
  disabled = false,
  invalid = false,
  id,
}: DigitDateSegmentedInputProps) {
  const dayRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);

  const emitChange = (next: DigitDateParts) => {
    onChange(next);
    if (isDigitDatePartsEmpty(next)) {
      onClear?.();
      return;
    }
    if (!isDigitDatePartsComplete(next)) return;
    const parsed = parseDigitDateParts(next);
    if (parsed) onComplete?.(parsed);
  };

  const handleDayChange = (raw: string) => {
    let day = onlyDigits(raw, 2);
    // 4–9 → tự thành 04–09 và nhảy sang tháng
    if (day.length === 1 && Number(day) > 3) {
      day = day.padStart(2, "0");
    }
    emitChange({ ...value, day });
    if (day.length === 2) monthRef.current?.focus();
  };

  const handleMonthChange = (raw: string) => {
    let month = onlyDigits(raw, 2);
    // 2–9 → tự thành 02–09 và nhảy sang năm
    if (month.length === 1 && Number(month) > 1) {
      month = month.padStart(2, "0");
    }
    emitChange({ ...value, month });
    if (month.length === 2) yearRef.current?.focus();
  };

  const handleYearChange = (raw: string) => {
    const year = onlyDigits(raw, 4);
    emitChange({ ...value, year });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    segment: "day" | "month" | "year",
  ) => {
    const target = event.currentTarget;
    if (event.key === "Backspace" && target.value.length === 0) {
      if (segment === "month") {
        event.preventDefault();
        dayRef.current?.focus();
      } else if (segment === "year") {
        event.preventDefault();
        monthRef.current?.focus();
      }
    }
  };

  const segmentClass = cn(
    "h-8 w-10 rounded-md bg-transparent px-1 text-center text-sm tabular-nums outline-none",
    "placeholder:text-muted-foreground",
    invalid && "text-destructive",
  );

  return (
    <div
      className={cn(
        "border-input bg-transparent flex h-8 items-center gap-1 rounded-md border px-1.5 shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        invalid && "border-destructive",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        id={id}
        ref={dayRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd"
        aria-label="Ngày"
        maxLength={2}
        disabled={disabled}
        value={value.day}
        onChange={(event) => handleDayChange(event.target.value)}
        onKeyDown={(event) => handleKeyDown(event, "day")}
        className={segmentClass}
      />
      <span className="text-muted-foreground text-xs" aria-hidden>
        /
      </span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM"
        aria-label="Tháng"
        maxLength={2}
        disabled={disabled}
        value={value.month}
        onChange={(event) => handleMonthChange(event.target.value)}
        onKeyDown={(event) => handleKeyDown(event, "month")}
        className={segmentClass}
      />
      <span className="text-muted-foreground text-xs" aria-hidden>
        /
      </span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="yyyy"
        aria-label="Năm"
        maxLength={4}
        disabled={disabled}
        value={value.year}
        onChange={(event) => handleYearChange(event.target.value)}
        onKeyDown={(event) => handleKeyDown(event, "year")}
        className={cn(segmentClass, "w-14")}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function StartAndEndDateTimePicker({
  value,
  defaultValue,
  onChange,
  showTime = false,
  numberOfMonths = 2,
  placeholder = "Chọn khoảng thời gian",
  className,
  buttonClassName,
  disabled = false,
  align = "end",
}: StartAndEndDateTimePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] =
    React.useState<StartEndDateTimeValue>(
      defaultValue ?? { start: null, end: null },
    );
  /** Giá trị đã commit (hiển thị trên trigger + dùng để gọi API). */
  const committed = isControlled ? value : internalValue;

  const [open, setOpen] = React.useState(false);
  /** Draft chỉ tồn tại trong popover — chưa gọi onChange. */
  const [draft, setDraft] = React.useState<StartEndDateTimeValue>(committed);
  const [startParts, setStartParts] = React.useState<DigitDateParts>(() =>
    dateToDigitParts(committed.start),
  );
  const [endParts, setEndParts] = React.useState<DigitDateParts>(() =>
    dateToDigitParts(committed.end),
  );
  const [startTime, setStartTime] = React.useState(
    () => getTimeInputValue(committed.start) || "00:00",
  );
  const [endTime, setEndTime] = React.useState(
    () => getTimeInputValue(committed.end) || "23:59",
  );
  const [startDateError, setStartDateError] = React.useState(false);
  const [endDateError, setEndDateError] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    () => committed.start ?? committed.end ?? new Date(),
  );

  const syncDraftFromCommitted = React.useCallback(() => {
    setDraft(committed);
    setStartParts(dateToDigitParts(committed.start));
    setEndParts(dateToDigitParts(committed.end));
    setStartTime(getTimeInputValue(committed.start) || "00:00");
    setEndTime(getTimeInputValue(committed.end) || "23:59");
    setStartDateError(false);
    setEndDateError(false);
    setCalendarMonth(committed.start ?? committed.end ?? new Date());
  }, [committed]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      syncDraftFromCommitted();
      setOpen(true);
      return;
    }
    // Đóng mà không Áp dụng → hủy draft
    syncDraftFromCommitted();
    setOpen(false);
  };

  const commit = React.useCallback(
    (next: StartEndDateTimeValue) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const selected: DateRange | undefined =
    draft.start || draft.end
      ? { from: draft.start ?? undefined, to: draft.end ?? undefined }
      : undefined;

  const applyDraftDates = (
    nextStart: Date | null,
    nextEnd: Date | null,
    nextStartTime = startTime,
    nextEndTime = endTime,
  ) => {
    const next = normalizeRange(
      nextStart,
      nextEnd,
      showTime,
      nextStartTime,
      nextEndTime,
    );
    setDraft(next);
    setStartParts(dateToDigitParts(next.start));
    setEndParts(dateToDigitParts(next.end));
    if (next.start) setCalendarMonth(next.start);
    else if (next.end) setCalendarMonth(next.end);
  };

  const handleSelect = (range: DateRange | undefined) => {
    setStartDateError(false);
    setEndDateError(false);
    applyDraftDates(range?.from ?? null, range?.to ?? null);
  };

  const handlePreset = (preset: DateRangePreset) => {
    const range = preset.getRange();
    setStartDateError(false);
    setEndDateError(false);
    setStartTime("00:00");
    setEndTime("23:59");
    applyDraftDates(range.start, range.end, "00:00", "23:59");
  };

  const handleStartPartsChange = (parts: DigitDateParts) => {
    setStartParts(parts);
    setStartDateError(false);
    if (isDigitDatePartsEmpty(parts)) {
      applyDraftDates(null, draft.end);
      return;
    }
    if (!isDigitDatePartsComplete(parts)) return;
    const parsed = parseDigitDateParts(parts);
    if (!parsed) {
      setStartDateError(true);
      return;
    }
    applyDraftDates(parsed, draft.end);
  };

  const handleEndPartsChange = (parts: DigitDateParts) => {
    setEndParts(parts);
    setEndDateError(false);
    if (isDigitDatePartsEmpty(parts)) {
      applyDraftDates(draft.start, null);
      return;
    }
    if (!isDigitDatePartsComplete(parts)) return;
    const parsed = parseDigitDateParts(parts);
    if (!parsed) {
      setEndDateError(true);
      return;
    }
    applyDraftDates(draft.start, parsed);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (!draft.start) return;
    applyDraftDates(draft.start, draft.end, time, endTime);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    if (!draft.end) return;
    applyDraftDates(draft.start, draft.end, startTime, time);
  };

  const handleClearDraft = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDraft({ start: null, end: null });
    setStartParts({ ...EMPTY_DIGIT_DATE_PARTS });
    setEndParts({ ...EMPTY_DIGIT_DATE_PARTS });
    setStartTime("00:00");
    setEndTime("23:59");
    setStartDateError(false);
    setEndDateError(false);
  };

  const handleApply = () => {
    const parsedStart =
      draft.start ??
      (isDigitDatePartsComplete(startParts)
        ? parseDigitDateParts(startParts)
        : null);
    const parsedEnd =
      draft.end ??
      (isDigitDatePartsComplete(endParts)
        ? parseDigitDateParts(endParts)
        : null);

    if (!isDigitDatePartsEmpty(startParts) && !parsedStart) {
      setStartDateError(true);
      return;
    }
    if (!isDigitDatePartsEmpty(endParts) && !parsedEnd) {
      setEndDateError(true);
      return;
    }
    if (!parsedStart || !parsedEnd) return;

    const next = normalizeRange(
      parsedStart,
      parsedEnd,
      showTime,
      startTime,
      endTime,
    );
    commit(next);
    setOpen(false);
  };

  const label = formatRangeLabel(committed, showTime);
  const hasCommittedValue = Boolean(committed.start || committed.end);
  const hasDraftValue = Boolean(
    draft.start ||
    draft.end ||
    !isDigitDatePartsEmpty(startParts) ||
    !isDigitDatePartsEmpty(endParts),
  );
  const canApply =
    !disabled &&
    !startDateError &&
    !endDateError &&
    Boolean(
      (draft.start || parseDigitDateParts(startParts)) &&
      (draft.end || parseDigitDateParts(endParts)),
    );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 min-w-60 justify-start text-left font-normal",
              !hasCommittedValue && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <CalendarIcon className="size-4 opacity-70" aria-hidden />
            <span className="truncate">
              {hasCommittedValue ? label : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align={align}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="flex">
            <div className="w-40 shrink-0 border-r py-2">
              <p className="text-muted-foreground px-3 pb-1 text-xs font-bold tracking-wide uppercase">
                Khoảng thời gian
              </p>
              {DATE_RANGE_PRESET_GROUPS.map((group, groupIndex) => (
                <div
                  key={group[0]?.id ?? groupIndex}
                  className={cn(groupIndex > 0 && "mt-1 border-t pt-1")}
                >
                  {group.map((preset) => {
                    const active = isPresetActive(preset, draft);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handlePreset(preset)}
                        className={cn(
                          "flex w-full items-center rounded-none px-3 py-1.5 text-left text-sm",
                          "hover:bg-muted/80",
                          active && "bg-muted font-medium",
                          disabled && "pointer-events-none opacity-50",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div>
              <Calendar
                mode="range"
                numberOfMonths={numberOfMonths}
                selected={selected}
                onSelect={handleSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
              />

              <div className="space-y-3 border-t p-3">
                <p className="text-muted-foreground text-xs">
                  Hoặc nhập số lần lượt: ngày → tháng → năm
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Ngày bắt đầu</label>
                    <DigitDateSegmentedInput
                      value={startParts}
                      disabled={disabled}
                      invalid={startDateError}
                      onChange={handleStartPartsChange}
                    />
                    {startDateError ? (
                      <p className="text-destructive text-[11px]">
                        Ngày không hợp lệ
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Ngày kết thúc</label>
                    <DigitDateSegmentedInput
                      value={endParts}
                      disabled={disabled}
                      invalid={endDateError}
                      onChange={handleEndPartsChange}
                    />
                    {endDateError ? (
                      <p className="text-destructive text-[11px]">
                        Ngày không hợp lệ
                      </p>
                    ) : null}
                  </div>
                </div>

                {showTime ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground text-xs font-medium">
                        Giờ bắt đầu
                      </label>
                      <Input
                        type="time"
                        value={startTime}
                        disabled={!draft.start || disabled}
                        onChange={(event) =>
                          handleStartTimeChange(event.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground text-xs font-medium">
                        Giờ kết thúc
                      </label>
                      <Input
                        type="time"
                        value={endTime}
                        disabled={!draft.end || disabled}
                        onChange={(event) =>
                          handleEndTimeChange(event.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2 border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  disabled={!hasDraftValue || disabled}
                  onClick={handleClearDraft}
                >
                  <X className="size-3.5" />
                  Xóa
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={!canApply}
                  onClick={handleApply}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default StartAndEndDateTimePicker;
