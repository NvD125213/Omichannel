import { z } from "zod";

export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  belong_to: z.string(),
});

export const permissionDefaultValues = {
  name: "",
  description: "",
};

export const permissionFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên vai trò không được để trống"),
  description: z.string().optional(),
  belong_to: z.string().optional(),
});

export type Permission = z.infer<typeof permissionSchema>;
export type PermissionFormValues = z.infer<typeof permissionFormSchema>;
