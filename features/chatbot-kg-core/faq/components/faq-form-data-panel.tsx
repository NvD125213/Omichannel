"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MessageCircleQuestion,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SidebarDetailField } from "@/components/sidebar-detail";
import {
  useCreateFaq,
  usePatchFaq,
  useSuggestFaqVariants,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type { KgFaq } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";
import {
  faqFormDefaultValues,
  faqFormSchema,
  type FaqFormValues,
} from "../utils/schema";

interface FaqFormDataPanelProps {
  graphId: string;
  faq?: KgFaq | null;
  onSuccess?: () => void;
  onFormStateChange?: (state: FaqFormPanelState) => void;
}

export interface FaqFormPanelState {
  isEditMode: boolean;
  isSaving: boolean;
  isFormValid: boolean;
}

export const faqFormPanelStateDefault: FaqFormPanelState = {
  isEditMode: false,
  isSaving: false,
  isFormValid: false,
};

interface FaqFormPanelFooterProps {
  state: FaqFormPanelState;
  onDelete?: () => void;
}

export function FaqFormPanelFooter({
  state,
  onDelete,
}: FaqFormPanelFooterProps) {
  const { isEditMode, isSaving, isFormValid } = state;

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      {isEditMode ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Xóa FAQ
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="submit"
        form="faq-form"
        size="sm"
        className="h-9 rounded-lg sm:min-w-[120px]"
        disabled={isSaving || !isFormValid}
      >
        {isSaving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang lưu...
          </>
        ) : isEditMode ? (
          "Cập nhật"
        ) : (
          "Thêm FAQ"
        )}
      </Button>
    </div>
  );
}

export function FaqFormDataPanel({
  graphId,
  faq = null,
  onSuccess,
  onFormStateChange,
}: FaqFormDataPanelProps) {
  const isEditMode = Boolean(faq?.id);
  const [variants, setVariants] = useState<string[]>([]);
  const [manualVariant, setManualVariant] = useState("");

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: faqFormDefaultValues,
    mode: "onChange",
  });

  const { mutateAsync: createFaq, isPending: isCreating } = useCreateFaq();
  const { mutateAsync: patchFaq, isPending: isPatching } = usePatchFaq();
  const { mutateAsync: suggestVariants, isPending: isSuggesting } =
    useSuggestFaqVariants();

  const isSaving = isCreating || isPatching;
  const question = form.watch("question");
  const answer = form.watch("answer");
  const variantCount = form.watch("variantCount");
  const canSuggest =
    question.trim().length > 0 &&
    answer.trim().length > 0 &&
    variantCount >= 1 &&
    variantCount <= 20;

  const isFormValid = form.formState.isValid;
  const formStateRef = useRef<FaqFormPanelState>(faqFormPanelStateDefault);

  useEffect(() => {
    if (!onFormStateChange) return;

    const nextState: FaqFormPanelState = {
      isEditMode,
      isSaving,
      isFormValid,
    };

    const prevState = formStateRef.current;
    if (
      prevState.isEditMode === nextState.isEditMode &&
      prevState.isSaving === nextState.isSaving &&
      prevState.isFormValid === nextState.isFormValid
    ) {
      return;
    }

    formStateRef.current = nextState;
    onFormStateChange(nextState);
  }, [isEditMode, isSaving, isFormValid, onFormStateChange]);

  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        enabled: faq.enabled,
        variantCount: 10,
      });
      setVariants(faq.question_variants ?? []);
      return;
    }

    form.reset(faqFormDefaultValues);
    setVariants([]);
    setManualVariant("");
  }, [faq, form]);

  const handleSuggestVariants = async () => {
    const values = form.getValues();
    if (!graphId) return;

    const trimmedQuestion = values.question.trim();
    const trimmedAnswer = values.answer.trim();
    if (!trimmedQuestion || !trimmedAnswer) {
      toast.error("Vui lòng nhập đủ câu hỏi và câu trả lời trước khi gợi ý");
      return;
    }

    const result = await suggestVariants({
      graphId,
      data: {
        question: trimmedQuestion,
        answer: trimmedAnswer,
        count: values.variantCount,
      },
    });

    const incoming = result.variants ?? [];
    if (incoming.length === 0) {
      toast.message("Không có gợi ý mới");
      return;
    }

    setVariants((prev) => {
      const merged = new Set([...prev, ...incoming]);
      return Array.from(merged);
    });
    toast.success(`Đã thêm ${incoming.length} gợi ý câu hỏi tương đương`);
  };

  const handleAddManualVariant = () => {
    const value = manualVariant.trim();
    if (!value) return;
    setVariants((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setManualVariant("");
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: FaqFormValues) => {
    if (!graphId) return;

    const payload = {
      question: values.question.trim(),
      answer: values.answer.trim(),
      enabled: values.enabled,
      question_variants: variants.length > 0 ? variants : undefined,
    };

    if (isEditMode && faq?.id) {
      await patchFaq({
        graphId,
        faqId: faq.id,
        data: {
          ...payload,
          question_variants: variants,
        },
      });
      toast.success("Đã cập nhật FAQ");
    } else {
      await createFaq({ graphId, data: payload });
      toast.success("Đã thêm FAQ mới");
    }

    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form
        id="faq-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <SidebarDetailField
                label="Câu hỏi"
                description="Câu hỏi chính mà agent sẽ nhận diện"
              >
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="VD: Trường có bao nhiêu ngành?"
                    className="min-h-[88px] resize-none rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed shadow-none focus-visible:ring-0"
                  />
                </FormControl>
              </SidebarDetailField>
              <FormMessage className="px-0.5 text-xs leading-relaxed" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <SidebarDetailField
                label="Câu trả lời"
                description="Nội dung agent sẽ trả lời khi khớp câu hỏi"
              >
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="VD: Có 20 ngành"
                    className="min-h-[108px] resize-none rounded-[calc(0.75rem-0.125rem)] border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed shadow-none focus-visible:ring-0"
                  />
                </FormControl>
              </SidebarDetailField>
              <FormMessage className="px-0.5 text-xs leading-relaxed" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium text-foreground/90">
                  Kích hoạt FAQ
                </FormLabel>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                  Agent chỉ sử dụng FAQ khi được bật
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          )}
        />

        <div className="space-y-4 border-t border-border/50 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground/90">
                  Câu hỏi tương đương
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                  AI gợi ý các cách hỏi khác để agent nhận diện chính xác hơn
                </p>
              </div>
            </div>
            {variants.length > 0 && (
              <Badge
                variant="secondary"
                className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium tabular-nums"
              >
                {variants.length}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField
              control={form.control}
              name="variantCount"
              render={({ field }) => (
                <FormItem className="w-full gap-1.5 sm:max-w-[120px]">
                  <FormLabel className="text-xs text-muted-foreground">
                    Số lượng gợi ý
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      className="h-9 rounded-lg"
                      value={field.value}
                      onChange={(event) => {
                        const next = event.target.valueAsNumber;
                        field.onChange(Number.isNaN(next) ? 0 : next);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage className="text-xs leading-relaxed" />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-lg border-primary/20 bg-primary/[0.04] text-primary hover:bg-primary/10 hover:text-primary"
              disabled={!canSuggest || isSuggesting}
              onClick={handleSuggestVariants}
            >
              {isSuggesting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Gợi ý biến thể
            </Button>
          </div>

          {variants.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 via-background to-background p-3.5">
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, index) => (
                  <span
                    key={`${variant}-${index}`}
                    className={cn(
                      "group inline-flex max-w-full items-start gap-2 rounded-xl border border-border/70 bg-background/90 px-3 py-2 text-sm leading-snug text-foreground/88 shadow-sm transition-colors",
                      "hover:border-primary/25 hover:bg-primary/[0.03]",
                    )}
                  >
                    <MessageCircleQuestion className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
                    <span className="min-w-0 flex-1 break-words">
                      {variant}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Xóa biến thể"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
              <Sparkles className="mx-auto size-5 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground/80">
                Chưa có biến thể nào
              </p>
              <p className="mt-1 text-xs text-muted-foreground/65">
                Nhập câu hỏi và câu trả lời, sau đó bấm gợi ý hoặc thêm thủ công
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={manualVariant}
              onChange={(event) => setManualVariant(event.target.value)}
              placeholder="Thêm biến thể thủ công..."
              className="h-9 rounded-lg"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddManualVariant();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              disabled={!manualVariant.trim()}
              onClick={handleAddManualVariant}
              aria-label="Thêm biến thể"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
