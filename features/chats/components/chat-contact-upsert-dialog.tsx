"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertTenantContact } from "@/hooks/chatwoot/use-chatwoot";
import type { ChatConversation } from "../utils/types";

type ChatContactUpsertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  conversation: ChatConversation;
};

export function ChatContactUpsertDialog({
  open,
  onOpenChange,
  tenantId,
  conversation,
}: ChatContactUpsertDialogProps) {
  const upsertContact = useUpsertTenantContact();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(conversation.meta?.sender?.name?.trim() || "");
    setEmail(conversation.meta?.sender?.email?.trim() || "");
    setPhone(conversation.meta?.sender?.phoneNumber?.trim() || "");
  }, [
    conversation.meta?.sender?.email,
    conversation.meta?.sender?.name,
    conversation.meta?.sender?.phoneNumber,
    open,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId || upsertContact.isPending) return;

    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextPhone = phone.trim();
    if (!nextName && !nextEmail && !nextPhone) return;

    upsertContact.mutate(
      {
        tenantId,
        data: {
          conversation_id: conversation.id,
          ...(nextName ? { name: nextName } : {}),
          ...(nextEmail ? { email: nextEmail } : {}),
          ...(nextPhone ? { phone: nextPhone } : {}),
          source: "agent_manual",
        },
      },
      {
        onSuccess: (res) => {
          if (res.status_code === 200 || res.status_code === 201) {
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin liên hệ</DialogTitle>
          <DialogDescription>
            Ghi name / email / SĐT lên Contact Chatwoot. List chat đọc tên
            thật từ Contact, không lưu nhãn giả phía FE.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact-upsert-name">Họ và tên</Label>
            <Input
              id="contact-upsert-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={upsertContact.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-upsert-phone">Số điện thoại</Label>
            <Input
              id="contact-upsert-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0901234567"
              disabled={upsertContact.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-upsert-email">Email</Label>
            <Input
              id="contact-upsert-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              disabled={upsertContact.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={upsertContact.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={upsertContact.isPending || !tenantId}>
              {upsertContact.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu liên hệ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
