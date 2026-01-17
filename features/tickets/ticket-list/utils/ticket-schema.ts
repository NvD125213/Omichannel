import { z } from "zod";

export const ticketSchema = z.object({
  id: z.string().optional(),
  tenant_id: z.string().optional(),
  code: z.string().min(1, "Code không được để trống"),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  status: z.string().min(1, "Vui lòng chọn trạng thái"),
  priority: z.string().min(1, "Vui lòng chọn mức độ ưu tiên"),
  template_id: z.string().optional(),
  flow_id: z.string().optional(),
  sla_id: z.string().optional(),
  created_by: z.string().optional(),
  assigned_to: z.string().optional(),
  created_by_name: z.string().optional(),
  assigned_to_name: z.string().optional(),
  created_at: z.string().optional(),
  extension_data: z.array(
    z.object({
      key: z.string().optional(),
      value: z.string().optional(),
    }),
  ),
  closed_at: z.string().optional(),
  tags: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
    }),
  ),
});

export const ticketDefaultValues = {
  assigned_to: "",
  description: "",
  extension_data: {
    customer_name: "",
    phone: "",
  },
  priority: "",
  tag_ids: [""],
  template_id: "",
  title: "",
};

export const ticketFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Mã không được để trống"),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  priority: z.string().optional(),
  template_id: z.string().optional(),
  flow_id: z.string().optional(),
  sla_id: z.string().optional(),
  created_by: z.string().optional(),
  assigned_to: z.string().optional(),
  created_at: z.string().optional(),
  closed_at: z.string().optional(),
  tags: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
    }),
  ),
});

export type Ticket = z.infer<typeof ticketSchema>;
export type TicketFormValues = z.infer<typeof ticketFormSchema>;
