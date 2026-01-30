import { z } from "zod";

export const ticketFlowStepSchema = z.object({
  id: z.string(),
  flow_id: z.string(),
  tenant_id: z.string(),
  step_name: z.string(),
  step_order: z.number(),
  assignee: z.string(),
  assignee_user_id: z.string(),
  assignee_group_id: z.string(),
  created_at: z.string(),
});

export const ticketFlowStepDefaultValues = {
  assignee_group_id: "",
  flow_id: "",
  step_name: "",
  step_order: 0,
};

export const ticketFlowStepFormSchema = z
  .object({
    id: z.string().optional(),
    flow_id: z.string().optional(),
    step_name: z.string().min(1, "Tên luồng xử lý không được để trống"),
    step_order: z.number().min(1, "Thứ tự không được để trống"),
    assignee: z.string().optional(),
    assignee_user_id: z.string().optional(),
    assignee_group_id: z.string().optional(),
    tenant_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.assignee === "user") {
      if (!data.assignee_user_id || data.assignee_user_id.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn người được phân công",
          path: ["assignee_user_id"],
        });
      }
    }
    if (data.assignee === "group") {
      if (!data.assignee_group_id || data.assignee_group_id.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn nhóm được phân công",
          path: ["assignee_group_id"],
        });
      }
    }
  });

export type TicketFlowStep = z.infer<typeof ticketFlowStepSchema>;
export type TicketFlowStepFormValues = z.infer<typeof ticketFlowStepFormSchema>;
