import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high"]);
export const columnStatusEnum = z.enum(["todo", "in_progress", "done"]);

export const kanbanTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignee: z
    .object({
      name: z.string(),
      avatar: z.string().optional(),
    })
    .optional(),
  priority: priorityEnum,
  status: columnStatusEnum,
});

export const kanbanColumnSchema = z.object({
  id: columnStatusEnum,
  title: z.string(),
  tasks: z.array(kanbanTaskSchema),
});

export type Priority = z.infer<typeof priorityEnum>;
export type ColumnStatus = z.infer<typeof columnStatusEnum>;
export type KanbanTask = z.infer<typeof kanbanTaskSchema>;
export type KanbanColumn = z.infer<typeof kanbanColumnSchema>;

export const taskFormSchema = kanbanTaskSchema.omit({ id: true, status: true });
export type TaskFormData = z.infer<typeof taskFormSchema>;

export const statusConfig: Record<
  ColumnStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  todo: {
    label: "To Do",
    color: "bg-slate-400",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-600",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  done: {
    label: "Done",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
  },
};
