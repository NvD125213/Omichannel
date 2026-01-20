import { z } from "zod";

export const ticketEventSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  event_type: z.string(),
  payload: z.string(),
  actor_type: z.string(),
  actor_id: z.string(),
  created_at: z.string(),
  tenant_id: z.string(),
});

export const ticketEventDefaultValues = {
  id: "",
  ticket_id: "",
  event_type: "",
  payload: "",
  actor_type: "",
  actor_id: "",
  created_at: "",
  tenant_id: "",
};

export const ticketEventFormSchema = z.object({
  id: z.string().optional(),
  ticket_id: z.string().min(1, "Ticket ID không được để trống"),
  event_type: z.string().min(1, "Event type không được để trống"),
  payload: z.string().min(1, "Payload không được để trống"),
  actor_type: z.string().min(1, "Actor type không được để trống"),
  actor_id: z.string().min(1, "Actor ID không được để trống"),
  created_at: z.string().min(1, "Created at không được để trống"),
  tenant_id: z.string().min(1, "Tenant ID không được để trống"),
});

export type TicketEvent = z.infer<typeof ticketEventSchema>;
export type TicketEventFormValues = z.infer<typeof ticketEventFormSchema>;
