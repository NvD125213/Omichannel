export interface ConversationTrafficTimeseriesPoint {
  value: number;
  timestamp: number;
}

export interface ConversationTrafficRawData {
  tenant_id?: string;
  messaging?: ConversationTrafficTimeseriesPoint[] | string;
}

export interface ConversationTrafficSeries {
  /** ISO date, ví dụ 2026-08-07 */
  date: string;
  /** Nhãn hiển thị, ví dụ 07/08 */
  label: string;
  /** Key dùng cho Recharts / heatmap */
  key: string;
}

export interface ConversationTrafficChartRow {
  /** Nhãn hàng: "07:00" hoặc "6–12h" */
  hour: string;
  [dateKey: string]: string | number;
}

export interface ConversationTrafficParsed {
  timezone: string | null;
  dates: ConversationTrafficSeries[];
  chartData: ConversationTrafficChartRow[];
  totalByDate: Record<string, number>;
  hasData: boolean;
}

/** all = từng giờ; half = 4 khung 6h; quarter = 8 khung 3h */
export type ConversationTrafficHourMode = "all" | "half" | "quarter";

type HourBucket = {
  label: string;
  startHour: number;
  endHour: number;
};

const EMPTY_RESULT: ConversationTrafficParsed = {
  timezone: null,
  dates: [],
  chartData: [],
  totalByDate: {},
  hasData: false,
};

const HOUR_PATTERN = /^(\d{1,2}):(\d{2})$/;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const HALF_DAY_BUCKETS: HourBucket[] = [
  { label: "0–6h", startHour: 0, endHour: 6 },
  { label: "6–12h", startHour: 6, endHour: 12 },
  { label: "12–18h", startHour: 12, endHour: 18 },
  { label: "18–24h", startHour: 18, endHour: 24 },
];

const QUARTER_DAY_BUCKETS: HourBucket[] = [
  { label: "0–3h", startHour: 0, endHour: 3 },
  { label: "3–6h", startHour: 3, endHour: 6 },
  { label: "6–9h", startHour: 6, endHour: 9 },
  { label: "9–12h", startHour: 9, endHour: 12 },
  { label: "12–15h", startHour: 12, endHour: 15 },
  { label: "15–18h", startHour: 15, endHour: 18 },
  { label: "18–21h", startHour: 18, endHour: 21 },
  { label: "21–24h", startHour: 21, endHour: 24 },
];

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}`;
}

function toChartKey(dateStr: string): string {
  return `d_${dateStr.replace(/-/g, "_")}`;
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatTimezoneLabel(offset: number): string {
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = String(Math.floor(abs)).padStart(2, "0");
  const minutes = String(Math.round((abs % 1) * 60)).padStart(2, "0");
  return `(GMT${sign}${hours}:${minutes})`;
}

function toUnixSeconds(timestamp: number): number {
  return timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
}

function toOffsetParts(timestamp: number, timezoneOffset: number) {
  const shifted = new Date(
    toUnixSeconds(timestamp) * 1000 + timezoneOffset * 60 * 60 * 1000,
  );
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    hour: shifted.getUTCHours(),
  };
}

function parseHourLabel(hour: string): number | null {
  const match = HOUR_PATTERN.exec(hour.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value >= 0 && value <= 23 ? value : null;
}

function extractTimeseriesPoints(
  raw:
    | ConversationTrafficRawData
    | ConversationTrafficTimeseriesPoint[]
    | null
    | undefined,
): ConversationTrafficTimeseriesPoint[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  const messaging = raw.messaging;
  if (!Array.isArray(messaging)) return [];
  return messaging;
}

function buildHeatmap(
  dates: ConversationTrafficSeries[],
  valuesByDateHour: Map<string, number>,
  timezone: string | null,
): ConversationTrafficParsed {
  if (dates.length === 0) return { ...EMPTY_RESULT, timezone };

  const totalByDate: Record<string, number> = Object.fromEntries(
    dates.map((series) => [series.key, 0]),
  );

  const chartData: ConversationTrafficChartRow[] = HOURS.map((hour) => {
    const row: ConversationTrafficChartRow = { hour: formatHourLabel(hour) };
    for (const series of dates) {
      const value = valuesByDateHour.get(`${series.date}-${hour}`) ?? 0;
      row[series.key] = value;
      totalByDate[series.key] = (totalByDate[series.key] ?? 0) + value;
    }
    return row;
  });

  return {
    timezone,
    dates,
    chartData,
    totalByDate,
    hasData: Object.values(totalByDate).some((value) => value > 0),
  };
}

/**
 * Parse timeseries `{ value, timestamp }[]` thành ma trận giờ × ngày cho heatmap.
 */
export function parseConversationTrafficData(
  raw:
    | ConversationTrafficRawData
    | ConversationTrafficTimeseriesPoint[]
    | null
    | undefined,
  timezoneOffset: string | number = 7,
): ConversationTrafficParsed {
  const points = extractTimeseriesPoints(raw);
  if (points.length === 0) return EMPTY_RESULT;

  const offset = Number(timezoneOffset);
  const safeOffset = Number.isFinite(offset) ? offset : 7;
  const valuesByDateHour = new Map<string, number>();
  const dateSet = new Set<string>();

  for (const point of points) {
    const timestamp = Number(point.timestamp);
    if (!Number.isFinite(timestamp)) continue;

    const { date, hour } = toOffsetParts(timestamp, safeOffset);
    const value = Number(point.value) || 0;
    const key = `${date}-${hour}`;
    valuesByDateHour.set(key, (valuesByDateHour.get(key) ?? 0) + value);
    dateSet.add(date);
  }

  const dates: ConversationTrafficSeries[] = [...dateSet]
    .sort()
    .map((date) => ({
      date,
      label: formatDateLabel(date),
      key: toChartKey(date),
    }));

  return buildHeatmap(dates, valuesByDateHour, formatTimezoneLabel(safeOffset));
}

/**
 * Gộp các hàng giờ thành bucket (4 khung 6h hoặc 8 khung 3h).
 * mode `all` trả về bản gốc.
 */
export function groupConversationTrafficByHourMode(
  parsed: ConversationTrafficParsed,
  mode: ConversationTrafficHourMode,
): ConversationTrafficParsed {
  if (mode === "all" || parsed.chartData.length === 0) return parsed;

  const buckets = mode === "half" ? HALF_DAY_BUCKETS : QUARTER_DAY_BUCKETS;
  const chartData: ConversationTrafficChartRow[] = buckets.map((bucket) => {
    const row: ConversationTrafficChartRow = { hour: bucket.label };
    for (const series of parsed.dates) {
      row[series.key] = 0;
    }
    return row;
  });

  for (const sourceRow of parsed.chartData) {
    const hourValue = parseHourLabel(String(sourceRow.hour));
    if (hourValue === null) continue;

    const bucketIndex = buckets.findIndex(
      (bucket) => hourValue >= bucket.startHour && hourValue < bucket.endHour,
    );
    if (bucketIndex === -1) continue;

    for (const series of parsed.dates) {
      const current = Number(chartData[bucketIndex][series.key] ?? 0);
      const add = Number(sourceRow[series.key] ?? 0);
      chartData[bucketIndex][series.key] = current + add;
    }
  }

  return {
    ...parsed,
    chartData,
  };
}

export interface TimeseriesBarPoint {
  timestamp: number;
  label: string;
  value: number;
}

export type TimeseriesGroupBy = "hour" | "day" | "week" | "month";

/** Chọn group_by theo độ dài khoảng thời gian. */
export function pickTimeseriesGroupBy(
  since: number,
  until: number,
): TimeseriesGroupBy {
  const span = Math.max(0, until - since);
  if (span <= 2 * 86400) return "hour";
  if (span <= 62 * 86400) return "day";
  if (span <= 180 * 86400) return "week";
  return "month";
}

/**
 * Parse timeseries `{ value, timestamp }[]` thành dữ liệu bar/line chart.
 */
export function parseTimeseriesBarData(
  raw:
    | ConversationTrafficRawData
    | ConversationTrafficTimeseriesPoint[]
    | null
    | undefined,
  timezoneOffset: string | number = 7,
  groupBy: TimeseriesGroupBy = "day",
): TimeseriesBarPoint[] {
  const points = extractTimeseriesPoints(raw);
  if (points.length === 0) return [];

  const offset = Number(timezoneOffset);
  const safeOffset = Number.isFinite(offset) ? offset : 7;

  return points
    .map((point) => {
      const timestamp = Number(point.timestamp);
      if (!Number.isFinite(timestamp)) return null;
      const { date, hour } = toOffsetParts(timestamp, safeOffset);
      const label =
        groupBy === "hour"
          ? `${formatDateLabel(date)} ${formatHourLabel(hour)}`
          : formatDateLabel(date);
      return {
        timestamp: toUnixSeconds(timestamp),
        label,
        value: Number(point.value) || 0,
      };
    })
    .filter((row): row is TimeseriesBarPoint => row !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}
