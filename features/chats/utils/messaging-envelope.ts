/**
 * Envelope body API messaging: `data.messaging`
 * (legacy: `data.chatwoot` — fallback trong thời gian chuyển đổi).
 */
export function getMessagingEnvelope(
  data: unknown,
): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }
  const root = data as Record<string, unknown>;
  for (const key of ["messaging", "chatwoot"] as const) {
    const value = root[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return undefined;
}

/** Ghi envelope vào `data.messaging` (không còn ghi `chatwoot`). */
export function setMessagingEnvelope(
  data: Record<string, unknown>,
  messaging: Record<string, unknown>,
): Record<string, unknown> {
  const { chatwoot: _legacy, messaging: _oldMessaging, ...rest } = data;
  return { ...rest, messaging };
}
