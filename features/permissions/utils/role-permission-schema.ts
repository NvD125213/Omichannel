import { z } from "zod";

export const rolePermissionSchema = z.object({
  id: z.string(),
  role_id: z.string(),
  permission_id: z.string(),
});

export const rolePermissionDefaultValues = {
  role_id: "",
  permission_id: "",
};

export const rolePermissionFormSchema = z.object({
  id: z.string().optional(),
  role_id: z.string().min(1, "Vai trò không được để trống"),
  permission_id: z.string().min(1, "Quyền không được để trống"),
});

export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type RolePermissionFormValues = z.infer<typeof rolePermissionFormSchema>;
