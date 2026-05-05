import { z } from "zod";

export const addLabelFormSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên label").trim(),
  description: z.string().trim(),
  color: z.string().min(1, "Vui lòng chọn màu sắc").trim(),
  show_on_sidebar: z.boolean(),
});

export type AddLabelFormValues = z.infer<typeof addLabelFormSchema>;

export const addLabelDefaultValues: AddLabelFormValues = {
  title: "",
  description: "",
  color: "",
  show_on_sidebar: true,
};
