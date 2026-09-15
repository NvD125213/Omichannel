import type {
  ContactCaptureConfig,
  ContactCaptureField,
  ContactCaptureFieldKey,
  ContactCaptureMode,
} from "./interface";

export const CONTACT_CAPTURE_MODES: {
  value: ContactCaptureMode;
  label: string;
  hint: string;
}[] = [
  {
    value: "off",
    label: "Tắt",
    hint: "Không thu thập name / email / SĐT.",
  },
  {
    value: "pre_chat",
    label: "Pre-chat widget",
    hint: "Form native Chatwoot trước khi chat.",
  },
  {
    value: "bot",
    label: "Overlay / bot",
    hint: "Overlay hoặc bot hỏi trong hội thoại. Pre-chat native tắt.",
  },
  {
    value: "pre_chat_or_bot",
    label: "Pre-chat, thiếu thì overlay/bot",
    hint: "Bật pre-chat; field còn thiếu thì overlay hoặc bot bổ sung.",
  },
];

export const CONTACT_CAPTURE_FIELD_DEFS: {
  key: ContactCaptureFieldKey;
  label: string;
}[] = [
  { key: "name", label: "Họ và tên" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email" },
];

const CONTACT_CAPTURE_MODE_SET = new Set<string>(
  CONTACT_CAPTURE_MODES.map((item) => item.value),
);

export const DEFAULT_CONTACT_CAPTURE_MESSAGE =
  "Vui lòng để lại thông tin để chúng tôi hỗ trợ bạn tốt hơn.";

export function createDefaultContactCapture(): ContactCaptureConfig {
  return {
    enabled: true,
    mode: "pre_chat_or_bot",
    message: DEFAULT_CONTACT_CAPTURE_MESSAGE,
    fields: CONTACT_CAPTURE_FIELD_DEFS.map((item) => ({
      key: item.key,
      label: item.label,
      enabled: true,
      required: item.key !== "email",
    })),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeField(
  key: ContactCaptureFieldKey,
  fallbackLabel: string,
  raw: Record<string, unknown> | undefined,
): ContactCaptureField {
  const enabled = typeof raw?.enabled === "boolean" ? raw.enabled : false;
  const required = typeof raw?.required === "boolean" ? raw.required : false;
  const label =
    typeof raw?.label === "string" && raw.label.trim()
      ? raw.label.trim()
      : fallbackLabel;
  return {
    key,
    label,
    enabled,
    required,
  };
}

export function normalizeContactCapture(raw: unknown): ContactCaptureConfig {
  const fallback = createDefaultContactCapture();
  const rec = asRecord(raw);
  if (!rec) return fallback;

  const modeRaw = String(rec.mode ?? "").trim();
  const fieldsRaw = Array.isArray(rec.fields) ? rec.fields : [];
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of fieldsRaw) {
    const row = asRecord(item);
    if (!row) continue;
    const key = String(row.key ?? "").trim();
    if (key) byKey.set(key, row);
  }

  return {
    enabled: typeof rec.enabled === "boolean" ? rec.enabled : fallback.enabled,
    mode: CONTACT_CAPTURE_MODE_SET.has(modeRaw)
      ? (modeRaw as ContactCaptureMode)
      : fallback.mode,
    message: typeof rec.message === "string" ? rec.message : fallback.message,
    fields: CONTACT_CAPTURE_FIELD_DEFS.map((item) =>
      normalizeField(item.key, item.label, byKey.get(item.key)),
    ),
  };
}

const CONTACT_CAPTURE_ENVELOPE_KEYS = [
  "messaging",
  "data",
  "payload",
  "inbox",
  "channel",
] as const;

function collectContactCaptureNodes(
  value: unknown,
  depth: number,
  explicit: unknown[],
  meta: unknown[],
) {
  if (depth > 6) return;
  const rec = asRecord(value);
  if (!rec) return;

  if (asRecord(rec.contact_capture)) {
    explicit.push(rec.contact_capture);
  }

  const options = asRecord(rec.pre_chat_form_options);
  if (asRecord(options?.omnihub_contact_capture)) {
    meta.push(options?.omnihub_contact_capture);
  }

  for (const key of CONTACT_CAPTURE_ENVELOPE_KEYS) {
    collectContactCaptureNodes(rec[key], depth + 1, explicit, meta);
  }
}

/** Lấy `contact_capture` từ GET inbox / GET personas (nhiều envelope). */
export function pickContactCapture(
  ...sources: unknown[]
): ContactCaptureConfig {
  for (const source of sources) {
    const rec = asRecord(source);
    if (!rec) continue;
    const direct = asRecord(rec.contact_capture);
    if (direct) return normalizeContactCapture(direct);

    const messaging =
      asRecord(rec.messaging) ?? asRecord(asRecord(rec.data)?.messaging);
    const fromMessaging = asRecord(messaging?.contact_capture);
    if (fromMessaging) return normalizeContactCapture(fromMessaging);

    const fromData = asRecord(asRecord(rec.data)?.contact_capture);
    if (fromData) return normalizeContactCapture(fromData);
  }

  const explicit: unknown[] = [];
  const meta: unknown[] = [];
  for (const source of sources) {
    collectContactCaptureNodes(source, 0, explicit, meta);
  }
  const found = explicit[0] ?? meta[0];
  if (found) return normalizeContactCapture(found);
  return createDefaultContactCapture();
}

export function toContactCapturePayload(
  config: ContactCaptureConfig,
): ContactCaptureConfig {
  const normalized = normalizeContactCapture(config);
  return {
    ...normalized,
    message: normalized.message.trim(),
    fields: normalized.fields.map((field) => ({
      ...field,
      label: field.label.trim() || field.key,
    })),
  };
}
