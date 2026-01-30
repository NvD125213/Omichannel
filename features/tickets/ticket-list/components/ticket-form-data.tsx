"use client";

import React, { useEffect } from "react";
import { Check, ChevronsUpDown, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useListUser } from "@/hooks/user/use-list-user";
import { useGetTicketTemplates } from "@/hooks/ticket/ticket-templates/use-ticket-templates";
import { useCreateTicketFlowInstance } from "@/hooks/ticket/ticket-flows/use-ticket-flow-instance";
import { useGetTags } from "@/hooks/tag/use-tag-ticket";
import {
  useCreateTicket,
  useUpdateTicket,
} from "@/hooks/ticket/ticket-list/use-ticket-list";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ticketDefaultValues,
  ticketFormSchema,
  type Ticket,
  type TicketFormValues,
} from "../utils/ticket-schema";

const priorities = [
  { value: "low", label: "Thấp", color: "bg-gray-400" },
  { value: "medium", label: "Trung bình", color: "bg-blue-400" },
  { value: "high", label: "Cao", color: "bg-yellow-400" },
  { value: "urgent", label: "Khẩn cấp", color: "bg-orange-500" },
  { value: "critical", label: "Nghiêm trọng", color: "bg-red-500" },
];

interface TicketFormProps {
  ticket?: Ticket | null;
  selectedFlowId?: string;
  selectedStepId?: string;
  originalFlowId?: string; // Not used anymore - flow is locked in edit mode
  onSuccess?: () => void;
}

export default function TicketForm({
  ticket,
  selectedFlowId,
  selectedStepId,
  onSuccess,
}: TicketFormProps) {
  const isEditMode = !!ticket;

  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();
  const createFlowInstanceMutation = useCreateTicketFlowInstance();

  const [openAssignee, setOpenAssignee] = React.useState(false);
  const [openTemplate, setOpenTemplate] = React.useState(false);
  const [openTags, setOpenTags] = React.useState(false);
  const [extensionFields, setExtensionFields] = React.useState<
    Array<{ key: string; value: string }>
  >([]);

  // Fetch data using hooks
  const { data: usersData, isLoading: isLoadingUsers } = useListUser({
    page: 1,
    page_size: 10,
  });
  const { data: templatesData, isLoading: isLoadingTemplates } =
    useGetTicketTemplates({ page: 1, page_size: 100 });
  const { data: tagsData, isLoading: isLoadingTags } = useGetTags({
    page: 1,
    page_size: 10,
  });

  const users = usersData?.data.items || [];
  const templates = templatesData?.data.templates || [];
  const availableTags = tagsData?.data.tags || [];

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: ticketDefaultValues,
  });

  // Populate form when in edit mode
  useEffect(() => {
    if (ticket && isEditMode) {
      // Convert extension_data array to object for form
      const extensionDataObj: Record<string, string> = {};
      if (Array.isArray(ticket.extension_data)) {
        ticket.extension_data.forEach((item) => {
          if (item.key) {
            extensionDataObj[item.key] = item.value || "";
          }
        });
      }

      // Set extension fields for UI
      const fields = Object.entries(extensionDataObj).map(([key, value]) => ({
        key,
        value,
      }));
      setExtensionFields(fields);

      // Extract tag IDs from tags array
      const tagIds = ticket.tags?.map((tag) => tag.id || "") || [];

      const formData = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || "",
        assigned_to: ticket.assigned_to || "",
        template_id: ticket.template_id || "",
        priority: ticket.priority || "",
        tag_ids: tagIds,
        extension_data: extensionDataObj,
      };

      form.reset(formData);

      // Explicitly set priority value after reset to ensure it's applied
      setTimeout(() => {
        if (ticket.priority) {
          form.setValue("priority", ticket.priority, { shouldValidate: true });
        }
      }, 0);
    } else if (!ticket) {
      form.reset(ticketDefaultValues);
      setExtensionFields([]);
    }
  }, [ticket, isEditMode, form]);

  const addExtensionField = () => {
    setExtensionFields([...extensionFields, { key: "", value: "" }]);
  };

  const removeExtensionField = (index: number) => {
    const newFields = extensionFields.filter((_, i) => i !== index);
    setExtensionFields(newFields);

    // Update form data
    const extensionDataObj: Record<string, string> = {};
    newFields.forEach((field) => {
      if (field.key) {
        extensionDataObj[field.key] = field.value;
      }
    });
    form.setValue("extension_data", extensionDataObj);
  };

  const updateExtensionField = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newFields = [...extensionFields];
    newFields[index] = {
      ...newFields[index],
      [field]: value,
    };
    setExtensionFields(newFields);

    // Update form data
    const extensionDataObj: Record<string, string> = {};
    newFields.forEach((f) => {
      if (f.key) {
        extensionDataObj[f.key] = f.value;
      }
    });
    form.setValue("extension_data", extensionDataObj);
  };

  const toggleTag = (tagId: string) => {
    const currentTags = form.getValues("tag_ids") || [];
    const isSelected = currentTags.includes(tagId);
    const newTags = isSelected
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];
    form.setValue("tag_ids", newTags);
  };

  function onSubmit(data: TicketFormValues) {
    console.log("🎯 Form submitted with data:", data);
    console.log("📊 Current state:", {
      isEditMode,
      selectedFlowId,
      selectedStepId,
      ticketId: ticket?.id,
    });

    if (isEditMode && ticket?.id) {
      // Flow is locked in edit mode, just update ticket data
      updateTicketMutation.mutate(
        {
          id: ticket.id,
          payload: data as any,
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      // ✨ Inject flow_id into payload if selectedFlowId is provided
      const createPayload = {
        ...data,
        ...(selectedFlowId && { flow_id: selectedFlowId }),
      };

      console.log("📦 Create ticket payload:", createPayload);

      createTicketMutation.mutate(createPayload as any, {
        onSuccess: (response: any) => {
          console.log("✅ Ticket created! Full response:", response);
          console.log("🔍 Response structure check:");
          console.log(
            "  - response?.data?.ticket?.id:",
            response?.data?.ticket?.id,
          );
          console.log(
            "  - response?.data?.data?.ticket?.id:",
            response?.data?.data?.ticket?.id,
          );
          console.log("  - response?.data?.id:", response?.data?.id);
          console.log("  - response?.id:", response?.id);

          form.reset();
          setExtensionFields([]);

          // Enhanced ticket ID extraction to handle various response structures
          // Case 1: Standard ActionTicketResponse -> response.data.ticket.id
          // Case 2: Deeply nested (potential interceptor issue) -> response.data.data.ticket.id
          // Case 3: Flat ticket object -> response.id
          // Case 4: Maybe directly in data -> response.data.id
          const ticketId =
            response?.data?.ticket?.id ||
            response?.data?.data?.ticket?.id ||
            response?.data?.id ||
            response?.id;

          console.log("🎫 Extracted ticketId:", ticketId);
          console.log("🔄 Flow instance creation check:");
          console.log(
            "  - selectedFlowId:",
            selectedFlowId,
            selectedFlowId ? "✓" : "❌",
          );
          console.log(
            "  - selectedStepId:",
            selectedStepId,
            selectedStepId ? "✓" : "❌",
          );
          console.log("  - ticketId:", ticketId, ticketId ? "✓" : "❌");

          // Create flow instance if flow and step are selected
          if (selectedFlowId && selectedStepId && ticketId) {
            console.log("✨ Creating flow instance with:", {
              ticket_id: ticketId,
              flow_id: selectedFlowId,
              current_step_id: selectedStepId,
            });
            createFlowInstanceMutation.mutate(
              {
                ticket_id: ticketId,
                flow_id: selectedFlowId,
                current_step_id: selectedStepId,
              },
              {
                onSuccess: () => {
                  console.log("✅ Flow instance created successfully!");
                  onSuccess?.();
                },
                onError: (err) => {
                  console.error("❌ Flow instance creation failed:", err);
                  onSuccess?.();
                },
              },
            );
          } else {
            console.warn(
              "⚠️ Skipping flow instance creation. Missing requirements:",
              {
                selectedFlowId: selectedFlowId || "MISSING",
                selectedStepId: selectedStepId || "MISSING",
                ticketId: ticketId || "MISSING",
              },
            );
            onSuccess?.();
          }
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("❌ Form validation failed:", errors);
          console.log("📋 Current form values:", form.getValues());
        })}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tiêu đề ticket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mức độ ưu tiên</FormLabel>

              <FormControl>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
                  {priorities.map((p) => {
                    const isActive = field.value === p.value;

                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => field.onChange(p.value)}
                        className={`
                  h-10 w-full rounded-md border
                  flex items-center justify-center gap-2
                  text-sm font-medium
                  transition
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-primary hover:text-primary-foreground"
                  }
                `}
                      >
                        <span
                          className={`
                          relative
                          w-2 h-2 rounded-full
                          ${p.color}
                          transition
                          ${isActive ? "ring-2 ring-offset-2 ring-primary" : ""}
                        `}
                        />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
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
                  placeholder="Mô tả chi tiết vấn đề"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Người được giao</FormLabel>
                <Popover open={openAssignee} onOpenChange={setOpenAssignee}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={isLoadingUsers}
                      >
                        {isLoadingUsers ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </span>
                        ) : field.value ? (
                          users.find((user) => user.id === field.value)
                            ?.username || "Chọn người..."
                        ) : (
                          "Chọn người..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Tìm người..." />
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.username}
                            onSelect={() => {
                              field.onChange(user.id);
                              setOpenAssignee(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                field.value === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {user.username}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <Popover open={openTemplate} onOpenChange={setOpenTemplate}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={isLoadingTemplates}
                      >
                        {isLoadingTemplates ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </span>
                        ) : field.value ? (
                          templates.find((t) => t.id === field.value)?.name ||
                          "Chọn template..."
                        ) : (
                          "Chọn template..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Tìm template..." />
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandGroup>
                        {templates.map((template) => (
                          <CommandItem
                            key={template.id}
                            value={template.name}
                            onSelect={() => {
                              field.onChange(template.id);
                              setOpenTemplate(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                field.value === template.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {template.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tag_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <Popover open={openTags} onOpenChange={setOpenTags}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full justify-start min-h-10"
                      disabled={isLoadingTags}
                    >
                      {isLoadingTags ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải...
                        </span>
                      ) : field.value && field.value.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {field.value.map((tagId) => {
                            const tag = availableTags.find(
                              (t) => t.id === tagId,
                            );
                            return (
                              <Badge
                                key={tagId}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: tag?.color || undefined,
                                  color: tag?.color ? "#fff" : undefined,
                                }}
                              >
                                {tag?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Chọn tags...
                        </span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm tag..." />
                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                    <CommandGroup>
                      {availableTags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => toggleTag(tag.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              field.value?.includes(tag.id)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div
                            className="mr-2 h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color || "gray" }}
                          />
                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Thông tin mở rộng</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addExtensionField}
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm trường
            </Button>
          </div>
          <div className="space-y-2">
            {extensionFields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Key"
                  value={field.key}
                  onChange={(e) =>
                    updateExtensionField(index, "key", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) =>
                    updateExtensionField(index, "value", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtensionField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            className="flex-1"
            onClick={() => {
              console.log("🔘 Submit button clicked!");
              console.log("🔍 Form state:", {
                isValid: form.formState.isValid,
                errors: form.formState.errors,
                isDirty: form.formState.isDirty,
                isSubmitting: form.formState.isSubmitting,
              });
            }}
            disabled={
              isEditMode
                ? updateTicketMutation.isPending
                : createTicketMutation.isPending
            }
          >
            {isEditMode
              ? updateTicketMutation.isPending
                ? "Đang cập nhật..."
                : "Cập nhật Ticket"
              : createTicketMutation.isPending
                ? "Đang tạo..."
                : "Tạo Ticket"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
