import { z } from "zod";

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  flow_id: z.string(),
  sla_id: z.string().optional(),
  extension_schema: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean(),
  tenant_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Additional fields from API response
  flow_name: z.string().optional(),
  sla_name: z.string().optional(),
});

export const templateDefaultValues = {
  id: "",
  name: "",
  description: "",
  flow_id: "",
  sla_id: "",
  extension_schema: {},
  is_active: true,
  tenant_id: "",
};

export const templateFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên template không được để trống"),
  description: z.string().optional(),
  flow_id: z.string().min(1, "Vui lòng chọn luồng xử lý"),
  sla_id: z.string().optional(),
  extension_schema: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean(),
  tenant_id: z.string().optional(),
});

export type TicketTemplate = z.infer<typeof templateSchema>;
export type TemplateFormValues = z.infer<typeof templateFormSchema>;
