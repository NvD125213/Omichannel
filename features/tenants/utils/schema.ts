import { z } from "zod";

export const tenantMetaSchema = z.object({
  chatbot_enabled: z.boolean(),
  default_responder: z.enum(["bot", "agent"]),
});

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  is_active: z.number(),
  meta: tenantMetaSchema.optional().nullable(),
  /** Một số endpoint trả `meta_data` thay vì `meta` */
  meta_data: tenantMetaSchema.optional().nullable(),
});

export const tenantDefaultValues = {
  id: "",
  name: "",
  description: "",
  is_active: 1,
  chatbot_enabled: true,
  default_responder: "bot" as const,
};

export const tenantFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên doanh nghiệp không được để trống"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.number().min(0).max(1),
  chatbot_enabled: z.boolean(),
  default_responder: z.enum(["bot", "agent"]),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantFormValues = z.infer<typeof tenantFormSchema>;
export type TenantMeta = z.infer<typeof tenantMetaSchema>;

/** Chuẩn hóa meta từ `meta` hoặc `meta_data` (API hay trả lệch field). */
export function getTenantMeta(
  tenant?:
    | Pick<Tenant, "meta" | "meta_data">
    | {
        meta?: Partial<TenantMeta> | null;
        meta_data?: Partial<TenantMeta> | null;
      }
    | null,
): TenantMeta {
  const raw = tenant?.meta ?? tenant?.meta_data ?? null;
  return {
    chatbot_enabled: Boolean(raw?.chatbot_enabled ?? true),
    default_responder: raw?.default_responder === "agent" ? "agent" : "bot",
  };
}
