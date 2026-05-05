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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateChatwootAgent,
  useUpdateChatwootAgent,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import {
  addAgentDefaultValues,
  addAgentFormSchema,
  type AddAgentFormValues,
} from "../utils/schema";

const SUPPLIER_TYPE_LABEL = {
  supplier: "Nhà cung cấp",
  admin: "Quản trị viên",
} as const;

export type AddedAgentPayload = {
  id?: string;
  name: string;
  email: string;
  role: keyof typeof SUPPLIER_TYPE_LABEL;
};

interface AddAgentDialogProps {
  /** Khi submit hợp lệ — thêm vào danh sách hoặc gọi API */
  onAgentAdded?: (agent: AddedAgentPayload) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editAgent?: AddedAgentPayload | null;
}

export function AddAgentDialog({
  onAgentAdded,
  open: controlledOpen,
  onOpenChange,
  editAgent = null,
}: AddAgentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<AddAgentFormValues>({
    resolver: zodResolver(addAgentFormSchema),
    defaultValues: addAgentDefaultValues,
    mode: "onChange",
  });
  const createChatwootAgentMutation = useCreateChatwootAgent();
  const updateChatwootAgentMutation = useUpdateChatwootAgent();
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const isEditMode = Boolean(editAgent?.id);

  useEffect(() => {
    if (open) {
      if (isEditMode && editAgent) {
        form.reset({
          supplier_name: editAgent.name,
          email: editAgent.email,
          supplier_type: editAgent.role,
        });
      } else {
        form.reset(addAgentDefaultValues);
      }
    }
  }, [open, form, editAgent, isEditMode]);

  function handleSubmit(values: AddAgentFormValues) {
    if (!tenantId) return;

    const mappedRole: "administrator" | "agent" =
      values.supplier_type === "admin" ? "administrator" : "agent";
    const payload = {
      name: values.supplier_name,
      email: values.email,
      role: mappedRole,
      availability_status: "available" as const,
      auto_offline: false,
    };

    const onSuccess = () => {
      onAgentAdded?.({
        id: editAgent?.id,
        name: values.supplier_name,
        email: values.email,
        role: values.supplier_type,
      });
      form.reset(addAgentDefaultValues);
      setOpen(false);
    };

    if (isEditMode && editAgent?.id) {
      updateChatwootAgentMutation.mutate(
        {
          tenantId,
          agentId: editAgent.id,
          data: payload,
        },
        { onSuccess },
      );
      return;
    }

    createChatwootAgentMutation.mutate(
      {
        tenantId,
        data: payload,
      },
      { onSuccess },
    );
  }

  const inputMutedClass =
    "h-11 rounded-lg border-0 bg-muted/60 shadow-none focus-visible:ring-2";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button type="button">Thêm đại lý</Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="gap-6 rounded-xl sm:max-w-md" showCloseButton>
        <DialogHeader className="gap-2 space-y-0">
          <DialogTitle>
            {isEditMode ? "Cập nhật đại lý" : "Thêm đại lý vào nhóm của bạn"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Chỉnh sửa thông tin đại lý trong hệ thống."
              : "Bạn có thể thêm những người có thể xử lý hỗ trợ cho hộp thư đến của bạn."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="supplier_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhà cung cấp</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Vui lòng nhập tên nhà cung cấp"
                      autoComplete="organization"
                      className={inputMutedClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại nhà cung cấp</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-lg border-primary/40 bg-background">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(SUPPLIER_TYPE_LABEL) as Array<
                          keyof typeof SUPPLIER_TYPE_LABEL
                        >
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {SUPPLIER_TYPE_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="Vui lòng nhập email"
                      autoComplete="email"
                      spellCheck={false}
                      className={inputMutedClass}
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
                disabled={
                  !tenantId ||
                  createChatwootAgentMutation.isPending ||
                  updateChatwootAgentMutation.isPending ||
                  !form.formState.isValid
                }
              >
                {isEditMode
                  ? updateChatwootAgentMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật"
                  : createChatwootAgentMutation.isPending
                    ? "Đang thêm..."
                    : "Thêm nhà cung cấp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
