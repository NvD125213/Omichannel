import { Button } from "@/components/ui/button";
import { Save, User, Users, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { convertDateTime } from "@/utils/convert-time";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Stepper Preview Component
export interface StepPreview {
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
  selectedStepId?: string;
  onSelectStep?: (step: StepPreview) => void;
  onSaveAllSteps?: () => void;
  isPending?: boolean;
  isEditMode?: boolean;
}

export function TicketFlowStepperPreview({
  steps,
  selectedStepId,
  onSelectStep,
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
              {isEditMode
                ? "Các bước trong flow hiện tại"
                : "Lựa chọn bước cần xử lý"}
            </h3>
            <Badge variant="outline">{steps.length} bước</Badge>
          </div>

          <div className="relative">
            {/* Steps */}
            <div className="space-y-4 relative">
              {steps.map((step, index) => {
                const isSelected = selectedStepId === step.id;

                return (
                  <div key={step.id || index} className="relative">
                    {/* Connector Line - chỉ hiển thị nếu không phải bước cuối */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200 z-0" />
                    )}

                    <motion.div
                      className={cn(
                        "flex gap-4 relative pl-[0.1rem] py-2 rounded-lg transition-all",
                        !isEditMode && "cursor-pointer",
                        isSelected ? "bg-indigo-50/50" : "",
                      )}
                      initial="rest"
                      whileHover={!isEditMode ? "hover" : undefined}
                      animate={isSelected ? "selected" : "rest"}
                      variants={{
                        rest: { backgroundColor: "rgba(249, 250, 251, 0)" },
                        hover: { backgroundColor: "rgba(249, 250, 251, 0.5)" },
                        selected: {
                          backgroundColor: "rgba(238, 242, 255, 0.8)",
                        },
                      }}
                      transition={{ duration: 0.2 }}
                      onClick={() => !isEditMode && onSelectStep?.(step)}
                    >
                      {/* Circle */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 relative z-10 transition-colors",
                          isSelected
                            ? "bg-indigo-600 scale-110"
                            : "bg-indigo-600",
                        )}
                      >
                        <span className="text-white text-xs font-semibold">
                          {step.step_order}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={cn(
                              "font-medium text-sm transition-colors max-w-[80%]",
                              isSelected
                                ? "text-indigo-700 font-bold"
                                : "text-gray-900",
                            )}
                          >
                            {step.step_name}
                          </div>

                          {/* Verified Icon Animation */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 15,
                                }}
                                className="mr-2"
                              >
                                <CheckCircle2 className="size-5 text-indigo-600" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {step.id && step.created_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 my-[0.2rem]">
                            <Clock className="w-3 h-3" />
                            <span>
                              {
                                convertDateTime(step.created_at, "short")
                                  .datetime
                              }
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          {(step.assignee_user_id ||
                            step.assignee_group_id) && (
                            <div>
                              {step.assignee_user_id && step.assignee_user ? (
                                <Badge
                                  variant="secondary"
                                  className="
                                    inline-flex items-center gap-1.5
                                    bg-blue-50 text-blue-700
                                    border border-blue-200
                                    text-[10px] font-medium my-2 uppercase tracking-tight
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
                                    text-[10px] font-medium mt-2 uppercase tracking-tight
                                  "
                                >
                                  <Users className="w-3 h-3" />
                                  {step.assignee_group?.name ||
                                    "Không xác định"}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Only show for new steps */}
      {!isEditMode && steps.some((s) => !s.id) && (
        <div className="pt-4 border-t mt-4">
          <Button
            onClick={onSaveAllSteps}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "Đang lưu..." : "Lưu các bước mới"}
          </Button>
        </div>
      )}
    </div>
  );
}
