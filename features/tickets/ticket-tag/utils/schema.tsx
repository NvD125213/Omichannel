import { z } from "zod";

export const ticketTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tenant_id: z.string(),
  color: z.string(),
  type: z.enum(["ticket", "customer"]),
});

export const ticketTagDefaultValues = {
  id: undefined as string | undefined,
  name: "",
  description: "",
  tenant_id: "",
  color: "",
  type: "ticket" as "ticket" | "customer",
};

export const ticketTagFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên tag không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  tenant_id: z.string().optional(),
  color: z.string().min(1, "Vui lòng chọn màu sắc"),
  type: z.enum(["ticket", "customer"]),
});

export type TicketTag = z.infer<typeof ticketTagSchema>;
export type TicketTagFormValues = z.infer<typeof ticketTagFormSchema>;
