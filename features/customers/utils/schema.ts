import z from "zod";

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  tenant_id: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  meta_data: z.record(z.string(), z.unknown()),
  is_active: z.boolean(),
  tag_ids: z.array(z.string()),
});

export const customerFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên khách hàng là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  tenant_id: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
});

export const customerDefaultValues: CustomerFormValues = {
  id: undefined,
  name: "",
  email: "",
  phone: "",
  tenant_id: "",
  tag_ids: [],
};

export type Customer = z.infer<typeof customerSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
