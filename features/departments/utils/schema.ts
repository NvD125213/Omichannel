import { z } from "zod";

export const departmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tenant_id: z.string(),
  is_active: z.number(),
});

export const departmentDefaultValues = {
  name: "",
  description: "",
};

export const departmentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên phòng không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  tenant_id: z.string().optional(),
  is_active: z.number().optional(),
});

export type Department = z.infer<typeof departmentSchema>;
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
