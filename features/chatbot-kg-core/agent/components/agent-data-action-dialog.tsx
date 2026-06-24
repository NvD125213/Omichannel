"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDeleteAgentById } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type { KgAgent } from "@/services/chatbot-kg-core/interfaces";

interface AgentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: KgAgent | null;
  onDeleted?: () => void;
}

export function AgentDeleteDialog({
  open,
  onOpenChange,
  agent,
  onDeleted,
}: AgentDeleteDialogProps) {
  const { mutateAsync: deleteAgent, isPending } = useDeleteAgentById();

  const handleConfirm = async () => {
    if (!agent?.id) return;

    await deleteAgent(agent.id);
    toast.success("Đã xóa agent");
    onDeleted?.();
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xóa agent này?"
      description={
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground/90">
            {agent?.name ?? agent?.key}
          </span>{" "}
          sẽ bị xóa vĩnh viễn. Thao tác này không hoàn tác được.
        </span>
      }
      confirmText="Xóa"
      cancelText="Giữ lại"
      loading={isPending}
      onConfirm={handleConfirm}
      confirmVariant="destructive"
    />
  );
}
