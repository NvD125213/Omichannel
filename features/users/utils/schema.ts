import { z } from "zod";

export const userRoles = ["Admin", "User", "Manager"] as const;

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email("Invalid email address"),
  fullname: z.string(),
  role: z.string(),
  role_id: z.string().optional(), // ID of role for editing
  level: z.string(),
  level_id: z.string().optional(), // ID of level for editing
  tenant_id: z.string(),
  is_active: z.number(), // 1: Active, 0: Inactive
  avatar: z.string().optional(), // Optional for UI
});

export const userDefaultValues = {
  id: "",
  username: "",
  email: "",
  fullname: "",
  role_id: "",
  level_id: "",
  tenant_id: "",
  is_active: 1,
  avatar: "",
};

export const userFormSchema = z.object({
  id: z.string().optional(), // ID is optional for create
  username: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .optional()
    .or(z.literal("")), // Optional for update
  role_id: z.string().min(1, "Vai trò không được để trống"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  fullname: z.string().min(1, "Họ tên không được để trống"),
  level_id: z.string().min(1, "Cấp bậc không được để trống"),
  tenant_id: z.string().min(1, "Tenant ID không được để trống"),
  is_active: z.number().min(0, "Trạng thái không hợp lệ"),
});

export type User = z.infer<typeof userSchema>;
export type UserFormValues = z.infer<typeof userFormSchema>;
