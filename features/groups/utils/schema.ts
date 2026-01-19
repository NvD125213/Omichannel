import { z } from "zod";

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  department_id: z.string(),
  description: z.string(),
  tenant_id: z.string(),
  is_active: z.number(),
  member_count: z.number().optional(),
});

export const groupDefaultValues = {
  name: "",
  department_id: "",
  description: "",
  tenant_id: "",
};

export const groupFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên vai trò không được để trống"),
  department_id: z.string().min(1, "Cần có phòng ban"),
  tenant_id: z.string().optional(),
  description: z.string().optional(),
  is_active: z.number().optional(),
});

export type Group = z.infer<typeof groupSchema>;
export type GroupFormValues = z.infer<typeof groupFormSchema>;
