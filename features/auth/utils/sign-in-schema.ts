import { z } from "zod";

export const signInSchema = z.object({
  tenant_name: z.string().min(1, { message: "Vui lòng nhập tên doanh nghiệp" }),
  username: z
    .string()
    .min(1, { message: "Vui lòng nhập tên đăng nhập" })
    .min(3, { message: "Tên đăng nhập phải có ít nhất 3 ký tự" }),
  password: z
    .string()
    .min(1, { message: "Vui lòng nhập mật khẩu" })
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export type SignInSchema = z.infer<typeof signInSchema>;
