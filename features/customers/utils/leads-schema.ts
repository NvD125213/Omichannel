import z from "zod";

export const leadFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  description: z.string().optional(),
  tenant_id: z.string().min(1, "Tenant ID là bắt buộc"),
});

export const leadDefaultValues: LeadFormValues = {
  id: undefined,
  name: "",
  email: "",
  phone: "",
  description: "",
  tenant_id: "",
};

export type LeadFormValues = z.infer<typeof leadFormSchema>;
