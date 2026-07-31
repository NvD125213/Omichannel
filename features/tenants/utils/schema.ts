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
