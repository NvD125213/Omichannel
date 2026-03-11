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
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Customer } from "@/services/customer/service";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useRemoveCustomerTag,
} from "@/hooks/customer/use-customer";
import { useMe } from "@/hooks/user/use-me";
import { removeEmptyFields } from "@/utils/remove-field-empty";
import {
  CustomerFormValues,
  customerDefaultValues,
  customerFormSchema,
} from "../utils/schema";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGetTags } from "@/hooks/tag/use-tag-ticket";

interface CustomerFormDialogProps {
  customer?: Customer | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerFormDialog({
  customer,
  open: controlledOpen,
  onOpenChange,
}: CustomerFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!customer;

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const removeCustomerTagMutation = useRemoveCustomerTag();

  // Lấy thông tin user hiện tại để auto-fill tenant_id
  const { data: currentUser } = useMe();

  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerDefaultValues,
  });

  // Auto-populate tenant_id khi tạo mới
  useEffect(() => {
    if (currentUser?.tenant_id && !isEditMode && open) {
      form.setValue("tenant_id", currentUser.tenant_id);
    }
  }, [currentUser, form, isEditMode, open]);

  // Populate form khi edit
  useEffect(() => {
    if (customer && open) {
      const formData: CustomerFormValues = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        tenant_id: customer.tenant_id,
        tag_ids: customer.tag_ids ?? [],
      };
      form.reset(formData);
      setInitialTagIds(customer.tag_ids ?? []);
    } else if (!customer && open) {
      form.reset({
        ...customerDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
      setInitialTagIds([]);
    }
  }, [customer, open, form, currentUser]);

  function onSubmit(data: CustomerFormValues) {
    const cleaned = removeEmptyFields(data) as CustomerFormValues;
    const { id, ...payload } = cleaned;

    if (isEditMode && (customer?.id || id)) {
      const targetId = customer?.id || id!;
      updateCustomerMutation.mutate(
        {
          id: targetId,
          data: payload,
        },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
          },
        },
      );
    } else {
      createCustomerMutation.mutate(payload, {
        onSuccess: () => {
          form.reset({
            ...customerDefaultValues,
            tenant_id: currentUser?.tenant_id || "",
          });
          setOpen(false);
        },
      });
    }
  }

  // Get tags
  const { data: tagCustomerData } = useGetTags({
    tag_type: "customer",
  });
  const availableTags = tagCustomerData?.data.tags ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only show trigger button when not controlled */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            Thêm khách hàng
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa khách hàng" : "Thêm khách hàng"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin khách hàng. Nhấn lưu khi hoàn tất."
              : "Tạo khách hàng mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên khách hàng</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên khách hàng" {...field} />
                    </FormControl>
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
                      <Input placeholder="Nhập email khách hàng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập số điện thoại" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tag_ids"
                render={({ field }) => {
                  const selectedIds: string[] = field.value ?? [];

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Tags</FormLabel>

                      <Popover
                        open={tagPopoverOpen}
                        onOpenChange={setTagPopoverOpen}
                      >
                        <div className="w-full">
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                type="button"
                                className="w-full justify-between font-normal"
                              >
                                {selectedIds.length === 0
                                  ? "Chọn tags"
                                  : `${selectedIds.length} tag đã chọn`}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                        </div>

                        <PopoverContent
                          align="start"
                          sideOffset={4}
                          className="w-full p-0"
                        >
                          <Command>
                            <CommandInput placeholder="Tìm tag..." />

                            <CommandList className="max-h-[250px] overflow-y-auto">
                              <CommandEmpty>Không tìm thấy tag.</CommandEmpty>

                              <CommandGroup>
                                {availableTags.map((tag) => {
                                  const isSelected = selectedIds.includes(
                                    tag.id,
                                  );

                                  return (
                                    <CommandItem
                                      key={tag.id}
                                      value={tag.name}
                                      onSelect={() => {
                                        if (
                                          isEditMode &&
                                          customer?.id &&
                                          isSelected &&
                                          initialTagIds.includes(tag.id)
                                        ) {
                                          removeCustomerTagMutation.mutate(
                                            {
                                              customerId: customer.id,
                                              tagIds: [tag.id],
                                            },
                                            {
                                              onSuccess: () => {
                                                setInitialTagIds((prev) =>
                                                  prev.filter(
                                                    (id) => id !== tag.id,
                                                  ),
                                                );
                                              },
                                            },
                                          );
                                        }

                                        const next = isSelected
                                          ? selectedIds.filter(
                                              (id) => id !== tag.id,
                                            )
                                          : [...selectedIds, tag.id];

                                        field.onChange(next);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          isSelected
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                      {tag.name}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {/* selected tags */}
                      {selectedIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedIds.map((tagId) => {
                            const tag = availableTags.find(
                              (t) => t.id === tagId,
                            );
                            if (!tag) return null;

                            const handleRemove = () => {
                              const next = selectedIds.filter(
                                (id) => id !== tagId,
                              );

                              // Chỉ gọi API xóa tag khi đang edit và tag tồn tại ban đầu
                              if (
                                isEditMode &&
                                customer?.id &&
                                initialTagIds.includes(tagId)
                              ) {
                                removeCustomerTagMutation.mutate(
                                  {
                                    customerId: customer.id,
                                    tagIds: [tagId],
                                  },
                                  {
                                    onSuccess: () => {
                                      setInitialTagIds((prev) =>
                                        prev.filter((id) => id !== tagId),
                                      );
                                    },
                                  },
                                );
                              }

                              field.onChange(next);
                            };

                            return (
                              <Badge
                                key={tagId}
                                variant="secondary"
                                style={
                                  tag.color
                                    ? {
                                        backgroundColor: tag.color,
                                        borderColor: tag.color,
                                        color: "#ffffff",
                                      }
                                    : undefined
                                }
                                className="flex items-center gap-1 pr-1.5"
                              >
                                <span>{tag.name}</span>
                                {isEditMode && (
                                  <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none hover:bg-black/30"
                                  >
                                    ×
                                  </button>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={
                  isEditMode
                    ? updateCustomerMutation.isPending
                    : createCustomerMutation.isPending
                }
              >
                {isEditMode
                  ? updateCustomerMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật khách hàng"
                  : createCustomerMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu khách hàng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
