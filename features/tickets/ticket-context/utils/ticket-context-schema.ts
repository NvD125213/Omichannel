import { z } from "zod";

export const ticketContextSchema = z.object({
  id: z.string().optional(),
  tenant_id: z.string().optional(),
  context_type: z.string().min(1, "Bối cảnh không được để trống"),
  context_id: z.string().min(1, "Mã bối cảnh không được để trống"),
  source_type: z.string().optional(),
  created_at: z.string().optional(),
  context_metadata: z.object().optional(),
});

export const ticketDefaultValues = {
  context_type: "",
  context_id: "",
  source_type: "",
  context_metadata: {},
};

export const ticketFormSchema = z.object({
  id: z.string().optional(),
  tenant_id: z.string().optional(),
  context_type: z.string().min(1, "Bối cảnh không được để trống"),
  context_id: z.string().min(1, "Mã bối cảnh không được để trống"),
  source_type: z.string().optional(),
  created_at: z.string().optional(),
  context_metadata: z.object().optional(),
});

export type TicketContext = z.infer<typeof ticketContextSchema>;
export type TicketContextFormValues = z.infer<typeof ticketContextSchema>;
