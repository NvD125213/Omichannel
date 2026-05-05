"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ImagePlus } from "lucide-react";
import {
  useCreateChatwootAgentBot,
  useUpdateChatwootAgentBot,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import {
  addAgentBotDefaultValues,
  addAgentBotFormSchema,
  type AddAgentBotFormValues,
} from "../utils/schema";

export type AddedAgentBotPayload = {
  id?: string;
  name: string;
  description?: string;
  avatar_url?: string;
  outgoing_url?: string;
};

interface AddAgentBotDialogProps {
  onAgentBotAdded?: (bot: AddedAgentBotPayload) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editAgentBot?: AddedAgentBotPayload | null;
}

export function AddAgentBotDialog({
  onAgentBotAdded,
  open: controlledOpen,
  onOpenChange,
  editAgentBot = null,
}: AddAgentBotDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<AddAgentBotFormValues>({
    resolver: zodResolver(addAgentBotFormSchema),
    defaultValues: addAgentBotDefaultValues,
    mode: "onChange",
  });

  const createAgentBotMutation = useCreateChatwootAgentBot();
  const updateAgentBotMutation = useUpdateChatwootAgentBot();
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const isEditMode = Boolean(editAgentBot?.id);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedAvatarUrl = useWatch({
    control: form.control,
    name: "avatar_url",
  });

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editAgentBot) {
      form.reset({
        name: editAgentBot.name,
        description: editAgentBot.description ?? "",
        avatar_url: editAgentBot.avatar_url ?? "",
        outgoing_url: editAgentBot.outgoing_url ?? "",
      });
      return;
    }
    form.reset(addAgentBotDefaultValues);
  }, [open, form, isEditMode, editAgentBot]);

  function handleSubmit(values: AddAgentBotFormValues) {
    if (!tenantId) return;
    const accountId = Number(tenantId);
    const hasNumericAccountId = Number.isFinite(accountId);

    const payload = {
      name: values.name,
      description: values.description?.trim() || undefined,
      avatar_url: values.avatar_url?.trim() || undefined,
      outgoing_url: values.outgoing_url?.trim() || undefined,
      ...(hasNumericAccountId ? { account_id: accountId } : {}),
    };

    const onSuccess = () => {
      onAgentBotAdded?.({
        id: editAgentBot?.id,
        name: values.name,
        description: values.description,
        avatar_url: values.avatar_url,
        outgoing_url: values.outgoing_url,
      });
      form.reset(addAgentBotDefaultValues);
      setOpen(false);
    };

    if (isEditMode && editAgentBot?.id) {
      updateAgentBotMutation.mutate(
        {
          tenantId,
          botId: editAgentBot.id,
          data: payload,
        },
        { onSuccess },
      );
      return;
    }

    createAgentBotMutation.mutate(
      {
        tenantId,
        data: payload,
      },
      { onSuccess },
    );
  }

  const isSubmitting =
    createAgentBotMutation.isPending || updateAgentBotMutation.isPending;

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      form.setValue("avatar_url", result, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button type="button">Thêm bot</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="gap-6 rounded-xl sm:max-w-lg" showCloseButton>
        <DialogHeader className="gap-2 space-y-0">
          <DialogTitle>
            {isEditMode ? "Cập nhật agent bot" : "Thêm agent bot"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Chỉnh sửa cấu hình bot hiện có."
              : "Tạo một bot tự động xử lý hội thoại cho hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Avatar className="inline-flex w-fit h-fit border border-border">
                <AvatarImage
                  src={watchedAvatarUrl || undefined}
                  alt={watchedName || "Bot avatar"}
                  className="w-auto h-auto max-w-[80px] max-h-[80px]"
                />
                <AvatarFallback className="bg-muted text-muted-foreground px-2 py-1">
                  {(watchedName || "BT").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="agent-bot-avatar-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <ImagePlus className="size-4" />
                    Tải ảnh đại diện
                  </span>
                </Button>
              </label>
              <input
                id="agent-bot-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bot</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên bot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Mô tả ngắn về bot"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outgoing_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Huỷ
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!tenantId || isSubmitting || !form.formState.isValid}
              >
                {isEditMode
                  ? isSubmitting
                    ? "Đang cập nhật..."
                    : "Cập nhật"
                  : isSubmitting
                    ? "Đang thêm..."
                    : "Thêm bot"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
