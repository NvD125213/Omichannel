import { z } from "zod";

export const ticketFlowSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  name: z.string(),
  description: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  steps_count: z.number().optional(),
  tickets_count: z.number().optional(),
});

export const ticketFlowDefaultValues = {
  name: "",
  description: "",
  tenant_id: "",
};

export const ticketFlowFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên luồng xử lý không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  tenant_id: z.string().optional(),
});

export type TicketFlow = z.infer<typeof ticketFlowSchema>;
export type TicketFlowFormValues = z.infer<typeof ticketFlowFormSchema>;
