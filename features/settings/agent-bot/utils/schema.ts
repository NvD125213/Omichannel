import { z } from "zod";

export const addAgentBotFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên bot").trim(),
  description: z.string().trim(),
  avatar_url: z.string().trim(),
  outgoing_url: z.string().trim(),
});

export type AddAgentBotFormValues = z.infer<typeof addAgentBotFormSchema>;

export const addAgentBotDefaultValues: AddAgentBotFormValues = {
  name: "",
  description: "",
  avatar_url: "",
  outgoing_url: "",
};
