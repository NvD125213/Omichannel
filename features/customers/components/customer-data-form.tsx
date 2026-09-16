"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
  metadataEntriesToRecord,
  metadataRecordToEntries,
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

const FIELD_CLASS =
  "h-9 rounded-md border-neutral-300 bg-background text-foreground shadow-none placeholder:text-neutral-400";

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

  const { data: currentUser } = useMe();

  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadata_entries",
  });

  useEffect(() => {
    if (currentUser?.tenant_id && !isEditMode && open) {
      form.setValue("tenant_id", currentUser.tenant_id);
    }
  }, [currentUser, form, isEditMode, open]);

  useEffect(() => {
    if (customer && open) {
      const formData: CustomerFormValues = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        tenant_id: customer.tenant_id,
        tag_ids: customer.tag_ids ?? [],
        metadata_entries: metadataRecordToEntries(customer.meta_data),
      };
      form.reset(formData);
      setInitialTagIds(customer.tag_ids ?? []);
    } else if (!customer && open) {
      form.reset({
        ...customerDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
        metadata_entries: [{ key: "", value: "" }],
      });
      setInitialTagIds([]);
    }
  }, [customer, open, form, currentUser]);

  function onSubmit(data: CustomerFormValues) {
    const { id, metadata_entries, ...rest } = data;
    const payload = removeEmptyFields({
      ...rest,
      meta_data: metadataEntriesToRecord(metadata_entries),
    }) as Omit<CustomerFormValues, "id" | "metadata_entries"> & {
      meta_data: Record<string, string>;
    };

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

  const { data: tagCustomerData } = useGetTags({
    tag_type: "customer",
  });
  const availableTags = tagCustomerData?.data.tags ?? [];
  const isPending = isEditMode
    ? updateCustomerMutation.isPending
    : createCustomerMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            Thêm khách hàng
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="gap-0 bg-background p-0 shadow-none sm:max-w-xl"
      >
        <SheetHeader className="border-b border-neutral-200 px-4 py-4 text-left">
          <SheetTitle className="text-foreground">
            {isEditMode ? "Sửa khách hàng" : "Thêm khách hàng"}
          </SheetTitle>
          <SheetDescription className="text-neutral-600">
            {isEditMode
              ? "Cập nhật thông tin và metadata khách hàng."
              : "Tạo khách hàng mới kèm các trường chi tiết (key / value)."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Tên khách hàng
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên khách hàng"
                        className={FIELD_CLASS}
                        {...field}
                      />
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
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập email khách hàng"
                        className={FIELD_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Số điện thoại
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập số điện thoại"
                        className={FIELD_CLASS}
                        {...field}
                      />
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
                      <FormLabel className="text-foreground">Tags</FormLabel>

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
                                className="w-full justify-between border-neutral-300 bg-background font-normal text-foreground shadow-none"
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
                          className="w-(--radix-popover-trigger-width) p-0"
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

              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-foreground">
                    Thông tin chi tiết
                  </h3>
                  <p className="text-xs text-neutral-600">
                    Lưu customer detail vào metadata (chỉ key và value). Không
                    thêm thông tin nhạy cảm.
                  </p>
                </div>
                <div className="grid grid-cols-[3fr_7fr_auto] items-center gap-2 text-xs font-medium text-neutral-600">
                  <span>Trường thông tin</span>
                  <span>Giá trị</span>
                  <span className="w-8" />
                </div>
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[3fr_7fr_auto] items-start gap-2"
                  >
                    <FormField
                      control={form.control}
                      name={`metadata_entries.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ví dụ: Nghể nghiệp"
                              className={FIELD_CLASS}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`metadata_entries.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ví dụ: Lập trình viên"
                              className={FIELD_CLASS}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-neutral-500 hover:text-destructive"
                      onClick={() => {
                        if (fields.length === 1) {
                          form.setValue("metadata_entries", [
                            { key: "", value: "" },
                          ]);
                          return;
                        }
                        remove(index);
                      }}
                      aria-label="Xóa trường"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-neutral-300 bg-background shadow-none"
                  onClick={() => append({ key: "", value: "" })}
                >
                  <Plus className="size-4" />
                  Thêm trường
                </Button>
                {form.formState.errors.metadata_entries?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.metadata_entries.message}
                  </p>
                ) : null}
              </section>
            </div>

            <SheetFooter className="mt-0 flex-row justify-end border-t border-neutral-200">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-neutral-300 bg-background shadow-none"
                >
                  Hủy
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isPending}>
                {isEditMode
                  ? isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật"
                  : isPending
                    ? "Đang lưu..."
                    : "Lưu"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
