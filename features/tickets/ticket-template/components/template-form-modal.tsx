"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  templateDefaultValues,
  templateFormSchema,
  type TemplateFormValues,
  type TicketTemplate,
} from "../utils/schema";
import {
  useCreateTicketTemplate,
  useUpdateTicketTemplate,
} from "@/hooks/ticket/ticket-templates/use-ticket-templates";
import { useUpdateTicket } from "@/hooks/ticket/ticket-list/use-ticket-list";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { useMe } from "@/hooks/user/use-me";

interface TemplateFormDialogProps {
  template?: TicketTemplate | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ticketId?: string;
}

export function TemplateFormDialog({
  template,
  open: controlledOpen,
  onOpenChange,
  ticketId,
}: TemplateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!template;

  const createMutation = useCreateTicketTemplate();
  const updateMutation = useUpdateTicketTemplate();
  const updateTicketMutation = useUpdateTicket();

  // Fetch flows từ API
  const { data: flowsData, isLoading: isLoadingFlows } = useGetTicketFlows({
    page: 1,
    page_size: 100,
  });

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser } = useMe();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: templateDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  useEffect(() => {
    if (currentUser?.tenant_id && !isEditMode) {
      form.setValue("tenant_id", currentUser.tenant_id);
    }
  }, [currentUser, form, isEditMode]);

  // Populate form khi edit mode
  useEffect(() => {
    if (template && open) {
      form.reset({
        id: template.id,
        name: template.name,
        description: template.description || "",
        flow_id: template.flow_id,
        sla_id: template.sla_id,
        extension_schema: template.extension_schema || {},
        is_active: template.is_active,
        tenant_id: template.tenant_id || currentUser?.tenant_id || "",
      });
    } else if (!template && open) {
      form.reset({
        ...templateDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [template, open, form, currentUser]);

  function onSubmit(data: TemplateFormValues) {
    const payload = {
      name: data.name,
      description: data.description,
      flow_id: data.flow_id,
      sla_id: data.sla_id,
      extension_schema: data.extension_schema || {},
      is_active: data.is_active,
      tenant_id: data.tenant_id,
    };

    if (isEditMode && template?.id) {
      updateMutation.mutate(
        { id: template.id, payload },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (response: any) => {
          // Nếu có ticketId -> update ticket với template vừa tạo và flow đã chọn
          if (ticketId) {
            const newTemplateId =
              response?.data?.data?.id || response?.data?.id;
            if (newTemplateId) {
              updateTicketMutation.mutate({
                id: ticketId,
                payload: {
                  template_id: newTemplateId,
                } as any,
              });
            }
          }
          form.reset();
          setOpen(false);
        },
      });
    }
  }

  const flows = flowsData?.data?.data?.flows || [];
  const slas = [
    { id: "019bf97b-c9cc-780a-a9be-ad7d94ba3b45", name: "SLA Standard" },
    { id: "019bf97b-c9cc-780a-a9be-ad7d94ba3b46", name: "SLA Premium" },
    { id: "019bf97b-c9cc-780a-a9be-ad7d94ba3b47", name: "SLA Urgent" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="cursor-pointer" size="sm">
            <Plus className="size-4" />
            Thêm Template
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa Template" : "Thêm Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin template. Nhấn lưu khi hoàn tất."
              : "Tạo template mới cho ticket. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên template</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên template" {...field} />
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
                      placeholder="Nhập mô tả template"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flow_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luồng xử lý</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingFlows}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue
                          placeholder={
                            isLoadingFlows ? "Đang tải..." : "Chọn luồng xử lý"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flows.map((flow: any) => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
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
              name="sla_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SLA</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={false}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Chọn SLA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {slas.map((sla: any) => (
                        <SelectItem key={sla.id} value={sla.id}>
                          {sla.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={
                  isEditMode
                    ? updateMutation.isPending
                    : createMutation.isPending
                }
              >
                {isEditMode
                  ? updateMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật template"
                  : createMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
