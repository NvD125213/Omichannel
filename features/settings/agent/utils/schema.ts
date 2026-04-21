import { z } from "zod";

export const addAgentFormSchema = z.object({
  supplier_name: z.string().min(1, "Vui lòng nhập tên nhà cung cấp").trim(),
  supplier_type: z.enum(["supplier", "admin"]),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
});

export type AddAgentFormValues = z.infer<typeof addAgentFormSchema>;

export const addAgentDefaultValues: AddAgentFormValues = {
  supplier_name: "",
  supplier_type: "supplier",
  email: "",
};
