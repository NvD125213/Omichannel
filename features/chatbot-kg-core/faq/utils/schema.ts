import { z } from "zod";

export const faqFormSchema = z.object({
  question: z.string().min(1, "Vui lòng nhập câu hỏi").trim(),
  answer: z.string().min(1, "Vui lòng nhập câu trả lời").trim(),
  enabled: z.boolean(),
  variantCount: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Tối thiểu 1 biến thể")
    .max(20, "Tối đa 20 biến thể"),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const faqFormDefaultValues: FaqFormValues = {
  question: "",
  answer: "",
  enabled: true,
  variantCount: 10,
};
