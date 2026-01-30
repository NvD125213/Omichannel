"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
} from "@/components/ui/command";
import {
  Plus,
  Trash2,
  Save,
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  User,
  Users,
  Clock,
  Workflow,
} from "lucide-react";
import {
  useCreateTicketFlowSteps,
  useUpdateTicketFlowStep,
  useDeleteTicketFlowStep,
  useGetTicketFlowSteps,
} from "@/hooks/ticket/ticket-flows/use-ticket-flow-step";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Counter } from "@/components/ui/counter";
import {
  TicketFlowStepFormValues,
  ticketFlowStepDefaultValues,
  ticketFlowStepFormSchema,
} from "../utils/ticket-flow-step";
import { useGetGroups } from "@/hooks/group/use-get-group";
import { useListUser } from "@/hooks/user/use-list-user";
import { convertDateTime } from "@/utils/convert-time";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Stepper Preview Component
interface StepPreview {
  id?: string;
  step_name: string;
  step_order: number;
  assignee: string;
  assignee_user?: {
    id: string;
    username: string;
    name: string;
  };
  assignee_group?: {
    id: string;
    name: string;
    description: string;
  };
  assignee_user_id?: string;
  assignee_group_id?: string;
  created_at?: string;
}

interface StepperPreviewProps {
  steps: StepPreview[];
  onRemoveStep: (index: number) => void;
  onEditStep: (index: number) => void;
  onSaveAllSteps: () => void;
  isPending: boolean;
  isEditMode: boolean;
}

function StepperPreview({
  steps,
  onRemoveStep,
  onEditStep,
  onSaveAllSteps,
  isPending,
  isEditMode,
}: StepperPreviewProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Chưa có bước nào.</div>
          <div className="text-xs text-muted-foreground">
            Hãy điền form bên trái và nhấn "Thêm bước"
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-sm text-gray-900">
              Xem trước danh sách các bước
            </h3>
            <Badge variant="outline">{steps.length} bước</Badge>
          </div>

          <div className="relative">
            {/* Steps */}
            <div className="space-y-4 relative">
              {steps.map((step, index) => (
                <div key={step.id || index} className="relative">
                  {/* Connector Line - chỉ hiển thị nếu không phải bước cuối */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200 z-0" />
                  )}

                  <motion.div
                    className="flex gap-4 relative pl-[0.1rem] py-2 rounded-lg"
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    variants={{
                      rest: { backgroundColor: "rgba(249, 250, 251, 0)" },
                      hover: { backgroundColor: "rgba(249, 250, 251, 0.5)" },
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Circle */}
                    <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center shrink-0 relative z-10">
                      <span className="text-white text-xs font-semibold">
                        {step.step_order}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm text-gray-900">
                          {step.step_name}
                        </div>

                        <motion.div
                          className="flex items-center gap-1 shrink-0"
                          variants={{
                            rest: { opacity: 0, x: 10 },
                            hover: { opacity: 1, x: 0 },
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut",
                          }}
                        >
                          <AnimatePresence>
                            {step.id && (
                              <motion.button
                                initial={{ scale: 0.8, x: 5 }}
                                animate={{ scale: 1, x: 0 }}
                                exit={{ scale: 0.8 }}
                                transition={{
                                  duration: 0.15,
                                  delay: 0.05,
                                  ease: "easeOut",
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onEditStep(index)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                Sửa
                              </motion.button>
                            )}
                          </AnimatePresence>
                          <motion.button
                            initial={{ scale: 0.8, x: 5 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{
                              duration: 0.15,
                              delay: step.id ? 0.1 : 0.05,
                              ease: "easeOut",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRemoveStep(index)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </motion.button>
                        </motion.div>
                      </div>

                      {step.id && step.created_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 my-[0.2rem]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const { datetime } = convertDateTime(
                                step.created_at,
                                "short",
                              );

                              return `${datetime}`;
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {(step.assignee_user_id || step.assignee_group_id) && (
                          <div>
                            {step.assignee_user_id && step.assignee_user ? (
                              <Badge
                                variant="secondary"
                                className="
                                  inline-flex items-center gap-1.5
                                  bg-blue-50 text-blue-700
                                  border border-blue-200
                                  text-xs font-medium my-2
                                "
                              >
                                <User className="w-3 h-3" />
                                {step.assignee_user.username ||
                                  "Không xác định"}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="
                                  inline-flex items-center gap-1.5
                                  bg-purple-50 text-purple-700
                                  border border-purple-200
                                  text-xs font-medium mt-2
                                "
                              >
                                <Users className="w-3 h-3" />
                                {step.assignee_group?.name || "Không xác định"}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Only show for new steps */}
      {!isEditMode && (
        <div className="pt-4 border-t mt-4">
          <Button
            onClick={onSaveAllSteps}
            disabled={steps.filter((s) => !s.id).length === 0 || isPending}
            className="w-full"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending
              ? "Đang lưu..."
              : `Lưu ${steps.filter((s) => !s.id).length} bước mới`}
          </Button>
        </div>
      )}
    </div>
  );
}

interface TicketFlowStepFormSheetProps {
  flowId: string;
  flowName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TicketFlowStepFormSheet({
  flowId,
  flowName,
  open,
  onOpenChange,
  onSuccess,
}: TicketFlowStepFormSheetProps) {
  const [steps, setSteps] = useState<StepPreview[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const [openGroupSelect, setOpenGroupSelect] = useState(false);

  const { mutateAsync: createSteps, isPending: isCreating } =
    useCreateTicketFlowSteps();
  const { mutateAsync: updateStep, isPending: isUpdating } =
    useUpdateTicketFlowStep();
  const { mutateAsync: deleteStep, isPending: isDeleting } =
    useDeleteTicketFlowStep();

  // Fetch existing steps
  const { data: existingStepsData, isLoading: isLoadingSteps } =
    useGetTicketFlowSteps({
      flow_id: flowId,
    });

  // Fetch users and groups
  const { data: usersData, isLoading: isLoadingUsers } = useListUser({
    page: 1,
    page_size: 10,
  });
  const { data: groupsData, isLoading: isLoadingGroups } = useGetGroups({
    page: 1,
    page_size: 10,
  });

  const users = usersData?.data.items || [];
  const groups = groupsData?.groups || [];

  const form = useForm<TicketFlowStepFormValues>({
    resolver: zodResolver(ticketFlowStepFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: ticketFlowStepDefaultValues,
  });

  const isPending = isCreating || isUpdating || isDeleting;
  const isEditMode = editingIndex !== null;

  // Load existing steps when data is available
  useEffect(() => {
    if (existingStepsData?.data.data.steps && open) {
      const formattedSteps = existingStepsData.data.data.steps.map(
        (step: any) => {
          let assigneeName = "";
          if (step.assignee_user) {
            assigneeName = `Người thực hiện: ${step.assignee_user.username}`;
          } else if (step.assignee_group) {
            assigneeName = `Nhóm thực hiện: ${step.assignee_group.name}`;
          }

          return {
            id: step.id,
            step_name: step.step_name,
            step_order: step.step_order,
            assignee_user_id: step.assignee_user_id || undefined,
            assignee_group_id: step.assignee_group_id || undefined,
            flow: step.flow,
            assignee_user: step.assignee_user,
            assignee_group: step.assignee_group,
            assignee: assigneeName,
            created_at: step.created_at,
          };
        },
      );
      setSteps(formattedSteps);
      form.setValue("step_order", formattedSteps.length + 1);
    }
  }, [existingStepsData, open, form]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      // Reset form to default values
      form.reset(
        {
          step_name: "",
          step_order: 1,
          assignee: "group",
          assignee_user_id: "",
          assignee_group_id: "",
        },
        {
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false,
        },
      );
      // Clear editing state
      setEditingIndex(null);
      // Clear steps preview (only new steps, keep existing ones)
      setSteps((prev) => prev.filter((s) => s.id));
    }
  }, [open, form]);

  const handleEditStep = (index: number) => {
    const step = steps[index];
    setEditingIndex(index);

    // Populate form with step data
    const assigneeType = step.assignee_user_id ? "user" : "group";
    form.reset(
      {
        step_name: step.step_name,
        step_order: step.step_order,
        assignee: assigneeType,
        assignee_user_id: step.assignee_user_id || "",
        assignee_group_id: step.assignee_group_id || "",
      },
      {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      },
    );
  };

  const handleAddOrUpdateStep = async (values: TicketFlowStepFormValues) => {
    let assigneeName = "";

    const selectedUser =
      values.assignee === "user"
        ? users.find((u) => u.id === values.assignee_user_id)
        : undefined;
    const selectedGroup =
      values.assignee === "group"
        ? groups.find((g: any) => g.id === values.assignee_group_id)
        : undefined;

    // Map user to match StepPreview interface (fullname -> name)
    const mappedUser = selectedUser
      ? {
          id: selectedUser.id,
          username: selectedUser.username,
          name: selectedUser.fullname || selectedUser.username,
        }
      : undefined;

    if (values.assignee === "user") {
      assigneeName = selectedUser
        ? `Người thực hiện: ${selectedUser.username}`
        : "Không xác định";
    } else {
      assigneeName = selectedGroup
        ? `Nhóm thực hiện: ${selectedGroup.name}`
        : "Không xác định";
    }

    if (isEditMode) {
      // Update existing step
      const stepToUpdate = steps[editingIndex];
      if (!stepToUpdate.id) {
        toast.error("Không thể cập nhật bước chưa được lưu");
        return;
      }

      try {
        await updateStep({
          id: stepToUpdate.id,
          data: {
            flow_id: flowId,
            step_name: values.step_name,
            step_order: values.step_order,
            ...(values.assignee === "user"
              ? { assignee_user_id: values.assignee_user_id }
              : { assignee_group_id: values.assignee_group_id }),
          },
        });

        // Update local state
        const updatedSteps = [...steps];
        updatedSteps[editingIndex] = {
          ...stepToUpdate,
          step_name: values.step_name,
          step_order: values.step_order,
          assignee_user_id:
            values.assignee === "user" ? values.assignee_user_id : undefined,
          assignee_group_id:
            values.assignee === "group" ? values.assignee_group_id : undefined,
          assignee_user: mappedUser,
          assignee_group: selectedGroup,
          assignee: assigneeName,
        };
        setSteps(updatedSteps);
        setEditingIndex(null);

        // Reset form
        form.reset(
          {
            step_name: "",
            step_order: steps.length + 1,
            assignee: "group",
            assignee_user_id: "",
            assignee_group_id: "",
          },
          {
            keepErrors: false,
            keepDirty: false,
            keepIsSubmitted: false,
            keepTouched: false,
            keepIsValid: false,
            keepSubmitCount: false,
          },
        );
      } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật bước");
        console.error(error);
      }
    } else {
      // Add new step
      const newStep: StepPreview = {
        step_name: values.step_name,
        step_order: values.step_order,
        ...(values.assignee === "user"
          ? { assignee_user_id: values.assignee_user_id }
          : { assignee_group_id: values.assignee_group_id }),
        assignee_user: mappedUser,
        assignee_group: selectedGroup,
        assignee: assigneeName,
      };

      setSteps([...steps, newStep]);

      // Reset form with incremented step_order
      form.reset(
        {
          step_name: "",
          step_order: steps.length + 2,
          assignee: "group",
          assignee_user_id: "",
          assignee_group_id: "",
        },
        {
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false,
        },
      );
    }
  };

  const handleRemoveStep = async (index: number) => {
    const stepToRemove = steps[index];

    // If step has ID, it's saved in database - need to delete via API
    if (stepToRemove.id) {
      try {
        await deleteStep(stepToRemove.id);
        // Remove from local state after successful API call
        const newSteps = steps.filter((_, i) => i !== index);
        const reorderedSteps = newSteps.map((step, i) => ({
          ...step,
          step_order: i + 1,
        }));
        setSteps(reorderedSteps);

        // If we're editing this step, cancel edit mode
        if (editingIndex === index) {
          setEditingIndex(null);
          form.reset({
            step_name: "",
            step_order: reorderedSteps.length + 1,
            assignee: "group",
            assignee_user_id: "",
            assignee_group_id: "",
          });
        } else if (editingIndex !== null && editingIndex > index) {
          // Adjust editing index if we removed a step before it
          setEditingIndex(editingIndex - 1);
        }

        // Update form step_order
        form.setValue("step_order", reorderedSteps.length + 1);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa bước");
        console.error(error);
      }
    } else {
      // New step (not saved yet) - just remove from local state
      const newSteps = steps.filter((_, i) => i !== index);
      const reorderedSteps = newSteps.map((step, i) => ({
        ...step,
        step_order: i + 1,
      }));
      setSteps(reorderedSteps);

      // If we're editing this step, cancel edit mode
      if (editingIndex === index) {
        setEditingIndex(null);
        form.reset({
          step_name: "",
          step_order: reorderedSteps.length + 1,
          assignee: "group",
          assignee_user_id: "",
          assignee_group_id: "",
        });
      } else if (editingIndex !== null && editingIndex > index) {
        // Adjust editing index if we removed a step before it
        setEditingIndex(editingIndex - 1);
      }

      // Update form step_order
      form.setValue("step_order", reorderedSteps.length + 1);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    form.reset(
      {
        step_name: "",
        step_order: steps.length + 1,
        assignee: "group",
        assignee_user_id: "",
        assignee_group_id: "",
      },
      {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      },
    );
  };

  const handleSaveAllSteps = async () => {
    // Only save new steps (without ID)
    const newSteps = steps.filter((step) => !step.id);

    if (newSteps.length === 0) {
      toast.error("Vui lòng thêm ít nhất một bước mới");
      return;
    }

    try {
      const stepsToCreate = newSteps.map((step) => ({
        flow_id: flowId,
        step_name: step.step_name,
        step_order: step.step_order,
        ...(step.assignee_user_id
          ? { assignee_user_id: step.assignee_user_id }
          : { assignee_group_id: step.assignee_group_id }),
      }));

      await createSteps(stepsToCreate);

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo các bước");
      console.error(error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0">
        <div className="grid grid-cols-2 h-full">
          {/* Left - Form */}
          <div className="border-r flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <SheetHeader className="space-y-1 text-left">
                  <SheetTitle className="flex items-center justify-start gap-2">
                    <span>
                      {isEditMode ? "Chỉnh sửa bước" : "Tạo bước mới"}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      <Workflow />
                      {flowName}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription>
                    {isEditMode
                      ? "Chỉnh sửa thông tin và nhấn 'Cập nhật bước'"
                      : "Điền thông tin và nhấn 'Thêm bước' để thêm vào preview"}
                  </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddOrUpdateStep)}>
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">
                          Thông tin cơ bản
                        </h4>
                        <div className="flex items-start gap-4 w-full">
                          <div className="w-fit">
                            <FormField
                              control={form.control}
                              name="step_order"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Counter
                                      number={field.value}
                                      min={1}
                                      max={100}
                                      setNumber={(value) =>
                                        form.setValue("step_order", value, {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                          shouldTouch: false,
                                        })
                                      }
                                      className="h-9 px-2 py-1.5"
                                      buttonProps={{
                                        className: "size-6",
                                      }}
                                      slidingNumberProps={{
                                        className:
                                          "min-w-[3ch] text-center font-medium tabular-nums text-sm",
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex-1 items-center">
                            <FormField
                              control={form.control}
                              name="step_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Nhập tên bước"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="mb-[-15px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Phân công</h4>
                        <div className="flex items-start gap-4 w-full">
                          <div className="w-fit">
                            <FormField
                              control={form.control}
                              name="assignee"
                              render={({ field }) => (
                                <FormItem className="min-h-[62px]">
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) =>
                                      form.setValue("assignee", value, {
                                        shouldValidate: false,
                                        shouldDirty: false,
                                        shouldTouch: false,
                                      })
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="user">
                                        Cá nhân
                                      </SelectItem>
                                      <SelectItem value="group">
                                        Nhóm
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex-[2]">
                            {form.watch("assignee") === "user" ? (
                              <FormField
                                control={form.control}
                                name="assignee_user_id"
                                render={({ field }) => (
                                  <FormItem className="min-h-[62px]">
                                    <Popover
                                      open={openUserSelect}
                                      onOpenChange={setOpenUserSelect}
                                    >
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
                                              users.find(
                                                (u) => u.id === field.value,
                                              )?.username || "Chọn người..."
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
                                          <CommandEmpty>
                                            Không tìm thấy.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {users.map((user) => (
                                              <CommandItem
                                                key={user.id}
                                                value={user.username}
                                                className="py-2.5"
                                                onSelect={() => {
                                                  form.setValue(
                                                    "assignee_user_id",
                                                    user.id,
                                                    {
                                                      shouldValidate: false,
                                                      shouldDirty: false,
                                                      shouldTouch: false,
                                                    },
                                                  );
                                                  setOpenUserSelect(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    field.value === user.id
                                                      ? "opacity-100"
                                                      : "opacity-0",
                                                  )}
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
                            ) : (
                              <FormField
                                control={form.control}
                                name="assignee_group_id"
                                render={({ field }) => (
                                  <FormItem className="min-h-[62px]">
                                    <Popover
                                      open={openGroupSelect}
                                      onOpenChange={setOpenGroupSelect}
                                    >
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                            disabled={isLoadingGroups}
                                          >
                                            {isLoadingGroups ? (
                                              <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Đang tải...
                                              </span>
                                            ) : field.value ? (
                                              groups.find(
                                                (g: {
                                                  id: string;
                                                  name: string;
                                                }) => g.id === field.value,
                                              )?.name || "Chọn nhóm..."
                                            ) : (
                                              "Chọn nhóm..."
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                          <CommandInput placeholder="Tìm nhóm..." />
                                          <CommandEmpty>
                                            Không tìm thấy.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {groups.map(
                                              (group: {
                                                id: string;
                                                name: string;
                                              }) => (
                                                <CommandItem
                                                  key={group.id}
                                                  value={group.name}
                                                  className="py-2.5"
                                                  onSelect={() => {
                                                    form.setValue(
                                                      "assignee_group_id",
                                                      group.id,
                                                      {
                                                        shouldValidate: false,
                                                        shouldDirty: false,
                                                        shouldTouch: false,
                                                      },
                                                    );
                                                    setOpenGroupSelect(false);
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      field.value === group.id
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                    )}
                                                  />
                                                  {group.name}
                                                </CommandItem>
                                              ),
                                            )}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage className="mb-2" />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {isEditMode && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-[30%]"
                          onClick={handleCancelEdit}
                        >
                          Hủy
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="w-[40%]"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isEditMode ? "Đang cập nhật..." : "Đang thêm..."}
                          </>
                        ) : isEditMode ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Cập nhật bước
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm bước
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </div>

          {/* Right - Preview */}
          <div className="bg-gray-50/50 p-6 flex flex-col">
            <StepperPreview
              steps={steps}
              onRemoveStep={handleRemoveStep}
              onEditStep={handleEditStep}
              onSaveAllSteps={handleSaveAllSteps}
              isPending={isPending}
              isEditMode={isEditMode}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
