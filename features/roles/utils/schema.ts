import { z } from "zod";

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tenant_id: z.string(),
  role_order: z.number(),
  is_active: z.number(),
});

export const roleDefaultValues = {
  name: "",
  description: "",
};

export const roleFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên vai trò không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  tenant_id: z.string().optional(),
  role_order: z.number().min(1, "Cần có thứ tự cho vai trò"),
  is_active: z.number().optional(),
});

export type Role = z.infer<typeof roleSchema>;
export type RoleFormValues = z.infer<typeof roleFormSchema>;
