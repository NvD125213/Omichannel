"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCreateTicketFlowSteps,
  useUpdateTicketFlowStep,
  useDeleteTicketFlowStep,
  useGetTicketFlowSteps,
} from "@/hooks/ticket/ticket-flows/use-ticket-flow-step";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TicketFlowStepFormValues,
  ticketFlowStepDefaultValues,
  ticketFlowStepFormSchema,
} from "../utils/ticket-flow-step";
import { useGetGroups } from "@/hooks/group/use-get-group";
import { useListUser } from "@/hooks/user/use-list-user";
import { convertDateTime } from "@/utils/convert-time";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateFlowStepApi } from "@/services/ticket/ticket-flows/ticket-flow-step/services";
import { useQueryClient } from "@tanstack/react-query";

function createClientKey() {
  return `step-${crypto.randomUUID()}`;
}

function getNextStepOrder(steps: { step_order: number }[]) {
  if (steps.length === 0) return 1;
  return Math.max(...steps.map((step) => step.step_order)) + 1;
}

// Stepper Preview Component
interface StepPreview {
  clientKey: string;
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

interface SortableStepItemProps {
  step: StepPreview;
  index: number;
  onRemoveStep: (index: number) => void;
  onEditStep: (index: number) => void;
}

function SortableStepItem({
  step,
  index,
  onRemoveStep,
  onEditStep,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.clientKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayOrder = index + 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative flex gap-3", isDragging && "z-20")}
    >
      {/* Số thứ tự theo vị trí hiện tại trong list */}
      <div
        className={cn(
          "relative z-10 flex w-6 shrink-0 justify-center",
          isDragging && "opacity-0",
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-sm">
          <span className="text-xs font-semibold text-white">
            {displayOrder}
          </span>
        </div>
      </div>

      <motion.div
        className={cn(
          "flex min-w-0 flex-1 gap-2 rounded-lg bg-transparent px-1 py-1",
          isDragging && "opacity-60",
        )}
        initial="rest"
        whileHover="hover"
        animate="rest"
        transition={{ duration: 0.2 }}
      >
        <button
          type="button"
          className="mt-0.5 shrink-0 touch-none cursor-grab self-start rounded p-0.5 text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="Kéo để đổi thứ tự"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium text-sm text-gray-900">
              {step.step_name}
            </div>

            <motion.div
              className="flex shrink-0 items-center gap-1"
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
                    type="button"
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
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Pencil className="h-3 w-3" />
                    Sửa
                  </motion.button>
                )}
              </AnimatePresence>
              <motion.button
                type="button"
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
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                Xóa
              </motion.button>
            </motion.div>
          </div>

          {step.id && step.created_at && (
            <div className="my-[0.2rem] flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
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
                    className="my-1.5 inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700"
                  >
                    <User className="h-3 w-3" />
                    {step.assignee_user.username || "Không xác định"}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 inline-flex items-center gap-1.5 border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700"
                  >
                    <Users className="h-3 w-3" />
                    {step.assignee_group?.name || "Không xác định"}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface StepperPreviewProps {
  steps: StepPreview[];
  onRemoveStep: (index: number) => void;
  onEditStep: (index: number) => void;
  onReorderSteps: (reordered: StepPreview[]) => void;
  onSaveAllSteps: () => void;
  isPending: boolean;
  isEditMode: boolean;
}

function StepperPreview({
  steps,
  onRemoveStep,
  onEditStep,
  onReorderSteps,
  onSaveAllSteps,
  isPending,
  isEditMode,
}: StepperPreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = steps.findIndex((step) => step.clientKey === activeId);
    const newIndex = steps.findIndex((step) => step.clientKey === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    onReorderSteps(
      arrayMove(steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        step_order: index + 1,
      })),
    );
  };

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Chưa có bước nào.</div>
          <div className="text-xs text-muted-foreground">
            Hãy điền form bên trái và nhấn &quot;Thêm bước&quot;
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
          <p className="text-xs text-muted-foreground -mt-4">
            Kéo biểu tượng ⋮⋮ để thay đổi thứ tự bước
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((step) => step.clientKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative space-y-4">
                {/* Đường nối cố định: từ tâm bước đầu → tâm chấm kết thúc */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-0 bottom-0 z-0 w-0.5 -translate-x-1/2 bg-gray-200"
                />
                {steps.map((step, index) => (
                  <SortableStepItem
                    key={step.clientKey}
                    step={step}
                    index={index}
                    onRemoveStep={onRemoveStep}
                    onEditStep={onEditStep}
                  />
                ))}
                {/* Điểm kết thúc luồng — cùng hàng/cột với số bước */}
                <div className="relative flex gap-3">
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full border-2 border-gray-300 bg-background" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center px-1">
                    <span className="text-xs text-muted-foreground">
                      Kết thúc luồng
                    </span>
                  </div>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

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
  const queryClient = useQueryClient();
  const hasInitializedRef = useRef(false);

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

  // Load existing steps once when sheet opens
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false;
      return;
    }

    if (!existingStepsData?.data.data.steps || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const formattedSteps = existingStepsData.data.data.steps.map(
      (step: any) => {
        let assigneeName = "";
        if (step.assignee_user) {
          assigneeName = `Người thực hiện: ${step.assignee_user.username}`;
        } else if (step.assignee_group) {
          assigneeName = `Nhóm thực hiện: ${step.assignee_group.name}`;
        }

        return {
          clientKey: createClientKey(),
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
    setSteps([...formattedSteps].sort((a, b) => a.step_order - b.step_order));
    form.setValue("step_order", getNextStepOrder(formattedSteps));
  }, [existingStepsData, open, form]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
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
      setEditingIndex(null);
      setSteps([]);
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
            step_order: getNextStepOrder(updatedSteps),
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
      // Add new step — order always appends to the end; reorder via drag
      const nextOrder = getNextStepOrder(steps);
      const newStep: StepPreview = {
        clientKey: createClientKey(),
        step_name: values.step_name,
        step_order: nextOrder,
        ...(values.assignee === "user"
          ? { assignee_user_id: values.assignee_user_id }
          : { assignee_group_id: values.assignee_group_id }),
        assignee_user: mappedUser,
        assignee_group: selectedGroup,
        assignee: assigneeName,
      };

      const nextSteps = [...steps, newStep];
      setSteps(nextSteps);

      form.reset(
        {
          step_name: "",
          step_order: getNextStepOrder(nextSteps),
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

  const handleReorderSteps = async (reordered: StepPreview[]) => {
    const previousSteps = steps;
    const editingKey =
      editingIndex !== null ? previousSteps[editingIndex]?.clientKey : null;

    // Luôn cập nhật local ngay — step_order = vị trí mới 1..n
    const nextSteps = reordered.map((step, index) => ({
      ...step,
      step_order: index + 1,
    }));
    setSteps(nextSteps);

    if (editingKey) {
      const nextEditingIndex = nextSteps.findIndex(
        (step) => step.clientKey === editingKey,
      );
      setEditingIndex(nextEditingIndex >= 0 ? nextEditingIndex : null);
      if (nextEditingIndex >= 0) {
        form.setValue("step_order", nextSteps[nextEditingIndex].step_order);
      }
    } else {
      form.setValue("step_order", getNextStepOrder(nextSteps));
    }

    const changedSavedSteps = nextSteps.filter((step) => {
      if (!step.id) return false;
      const previous = previousSteps.find(
        (s) => s.clientKey === step.clientKey,
      );
      return previous && previous.step_order !== step.step_order;
    });

    if (changedSavedSteps.length === 0) return;

    try {
      await Promise.all(
        changedSavedSteps.map((step) =>
          updateFlowStepApi(step.id!, {
            flow_id: flowId,
            step_name: step.step_name,
            step_order: step.step_order,
            ...(step.assignee_user_id
              ? { assignee_user_id: step.assignee_user_id }
              : { assignee_group_id: step.assignee_group_id }),
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
      toast.success("Đã cập nhật thứ tự bước");
    } catch (error) {
      // Giữ thứ tự local đã đổi; chỉ báo lỗi persist
      toast.error("Đã đổi thứ tự trên giao diện, nhưng lưu server thất bại");
      console.error(error);
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
            step_order: getNextStepOrder(reorderedSteps),
            assignee: "group",
            assignee_user_id: "",
            assignee_group_id: "",
          });
        } else if (editingIndex !== null && editingIndex > index) {
          // Adjust editing index if we removed a step before it
          setEditingIndex(editingIndex - 1);
        }

        // Update form step_order
        form.setValue("step_order", getNextStepOrder(reorderedSteps));
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
          step_order: getNextStepOrder(reorderedSteps),
          assignee: "group",
          assignee_user_id: "",
          assignee_group_id: "",
        });
      } else if (editingIndex !== null && editingIndex > index) {
        // Adjust editing index if we removed a step before it
        setEditingIndex(editingIndex - 1);
      }

      // Update form step_order
      form.setValue("step_order", getNextStepOrder(reorderedSteps));
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    form.reset(
      {
        step_name: "",
        step_order: getNextStepOrder(steps),
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
                  <form
                    onSubmit={form.handleSubmit(handleAddOrUpdateStep)}
                    className="space-y-6"
                  >
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">
                          Thông tin cơ bản
                        </h4>
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                          <FormField
                            control={form.control}
                            name="step_order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thứ tự</FormLabel>
                                <FormControl>
                                  <div className="flex h-9 min-w-[5.5rem] items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                                    #{field.value || "—"}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="step_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tên bước</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nhập tên bước"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="assignee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phân công cho</FormLabel>
                                <FormControl>
                                  <div
                                    role="radiogroup"
                                    aria-label="Loại phân công"
                                    className="flex h-9 items-center gap-5"
                                  >
                                    {(
                                      [
                                        { value: "user", label: "Cá nhân" },
                                        { value: "group", label: "Nhóm" },
                                      ] as const
                                    ).map((option) => {
                                      const isSelected =
                                        field.value === option.value;
                                      return (
                                        <button
                                          key={option.value}
                                          type="button"
                                          role="radio"
                                          aria-checked={isSelected}
                                          onClick={() =>
                                            form.setValue(
                                              "assignee",
                                              option.value,
                                              {
                                                shouldValidate: false,
                                                shouldDirty: false,
                                                shouldTouch: false,
                                              },
                                            )
                                          }
                                          className="flex items-center gap-2 text-sm whitespace-nowrap"
                                        >
                                          <span
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                              isSelected
                                                ? "border-primary"
                                                : "border-muted-foreground/40"
                                            }`}
                                            aria-hidden
                                          >
                                            {isSelected && (
                                              <span className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                          </span>
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch("assignee") === "user" ? (
                            <FormField
                              control={form.control}
                              name="assignee_user_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Người được giao</FormLabel>
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
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                      <Command>
                                        <CommandInput placeholder="Tìm người..." />
                                        <CommandEmpty>
                                          Không tìm thấy.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {users.map((user) => {
                                            const isSelected =
                                              field.value === user.id;
                                            return (
                                              <CommandItem
                                                key={user.id}
                                                value={user.username}
                                                className="gap-2 py-2.5"
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
                                                <span
                                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                    isSelected
                                                      ? "border-primary"
                                                      : "border-muted-foreground/40"
                                                  }`}
                                                  aria-hidden
                                                >
                                                  {isSelected && (
                                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                                  )}
                                                </span>
                                                <span className="truncate">
                                                  {user.username}
                                                </span>
                                              </CommandItem>
                                            );
                                          })}
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
                                <FormItem>
                                  <FormLabel>Nhóm được giao</FormLabel>
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
                                            }) => {
                                              const isSelected =
                                                field.value === group.id;
                                              return (
                                                <CommandItem
                                                  key={group.id}
                                                  value={group.name}
                                                  className="gap-2 py-2.5"
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
                                                  <span
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                      isSelected
                                                        ? "border-primary"
                                                        : "border-muted-foreground/40"
                                                    }`}
                                                    aria-hidden
                                                  >
                                                    {isSelected && (
                                                      <span className="h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                  </span>
                                                  <span className="truncate">
                                                    {group.name}
                                                  </span>
                                                </CommandItem>
                                              );
                                            },
                                          )}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      {isEditMode && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Hủy
                        </Button>
                      )}
                      <Button type="submit" disabled={isPending}>
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
              onReorderSteps={handleReorderSteps}
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
