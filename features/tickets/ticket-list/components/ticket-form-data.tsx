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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useGetTags } from "@/hooks/tag/use-tag-ticket";
import {
  useCreateTicket,
  useUpdateTicket,
} from "@/hooks/ticket/ticket-list/use-ticket-list";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Ticket } from "../utils/ticket-schema";

const ticketFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  assigned_to: z.string().optional(),
  template_id: z.string().optional(),
  priority: z.string().min(1, "Vui lòng chọn mức độ ưu tiên"),
  tag_ids: z.array(z.string()).optional(),
  extension_data: z.record(z.string(), z.string()).optional(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

const priorities = [
  { value: "low", label: "Thấp", color: "bg-gray-400" },
  { value: "medium", label: "Trung bình", color: "bg-blue-400" },
  { value: "high", label: "Cao", color: "bg-yellow-400" },
  { value: "urgent", label: "Khẩn cấp", color: "bg-orange-500" },
  { value: "critical", label: "Nghiêm trọng", color: "bg-red-500" },
];

interface TicketFormProps {
  ticket?: Ticket | null;
  onSuccess?: () => void;
}

export default function TicketForm({ ticket, onSuccess }: TicketFormProps) {
  const isEditMode = !!ticket;

  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();

  const [openAssignee, setOpenAssignee] = React.useState(false);
  const [openTemplate, setOpenTemplate] = React.useState(false);
  const [openTags, setOpenTags] = React.useState(false);
  const [extensionFields, setExtensionFields] = React.useState<
    Array<{ key: string; value: string }>
  >([]);

  // Fetch data using hooks
  const { data: usersData, isLoading: isLoadingUsers } = useListUser({
    page: 1,
    page_size: 100,
  });
  const { data: templatesData, isLoading: isLoadingTemplates } =
    useGetTicketTemplates({ page: 1, page_size: 100 });
  const { data: tagsData, isLoading: isLoadingTags } = useGetTags({
    page: 1,
    page_size: 100,
  });

  const users = usersData?.data.items || [];
  const templates = templatesData?.data.templates || [];
  const availableTags = tagsData?.data.tags || [];

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assigned_to: "",
      template_id: "",
      priority: "",
      tag_ids: [],
      extension_data: {},
    },
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
      form.reset({
        title: "",
        description: "",
        assigned_to: "",
        template_id: "",
        priority: "",
        tag_ids: [],
        extension_data: {},
      });
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
    if (isEditMode && ticket?.id) {
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
      createTicketMutation.mutate(data as any, {
        onSuccess: () => {
          form.reset();
          setExtensionFields([]);
          onSuccess?.();
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mức độ ưu tiên</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức độ ưu tiên" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
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
                <PopoverContent className="w-full p-0">
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
