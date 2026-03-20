import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  is_active: z.number(),
});

export const tenantDefaultValues = {
  id: "",
  name: "",
  description: "",
  is_active: 1,
};

export const tenantFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên doanh nghiệp không được để trống"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.number().min(0).max(1),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantFormValues = z.infer<typeof tenantFormSchema>;
