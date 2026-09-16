import z from "zod";

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  tenant_id: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  meta_data: z.record(z.string(), z.unknown()),
  is_active: z.boolean(),
  tag_ids: z.array(z.string()),
});

export const customerFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Tên khách hàng là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(1, "Số điện thoại là bắt buộc"),
    tenant_id: z.string().optional(),
    tag_ids: z.array(z.string()).optional(),
    metadata_entries: z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const keys = (data.metadata_entries ?? [])
      .map((entry) => entry.key.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    for (const key of keys) {
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata_entries"],
          message: `Key metadata bị trùng: ${key}`,
        });
        return;
      }
      seen.add(key);
    }
  });

export const customerDefaultValues: CustomerFormValues = {
  id: undefined,
  name: "",
  email: "",
  phone: "",
  tenant_id: "",
  tag_ids: [],
  metadata_entries: [{ key: "", value: "" }],
};

export type Customer = z.infer<typeof customerSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type CustomerMetadataEntry = {
  key: string;
  value: string;
};

function formatMetadataValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function metadataRecordToEntries(
  meta: Record<string, unknown> | null | undefined,
): CustomerMetadataEntry[] {
  const entries = Object.entries(meta ?? {}).map(([key, value]) => ({
    key,
    value: formatMetadataValue(value),
  }));
  return entries.length ? entries : [{ key: "", value: "" }];
}

export function metadataEntriesToRecord(
  entries: CustomerMetadataEntry[] | undefined,
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of entries ?? []) {
    const key = entry.key.trim();
    if (!key) continue;
    record[key] = entry.value;
  }
  return record;
}
