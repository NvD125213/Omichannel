import { z } from "zod";

export const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  level_order: z.number(),
});

export const levelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  level_order: z.number().min(1, "Level order is required"),
});

export type Level = z.infer<typeof levelSchema>;
export type LevelFormValues = z.infer<typeof levelFormSchema>;
