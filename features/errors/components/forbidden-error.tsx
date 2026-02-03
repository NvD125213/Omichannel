"use client";

import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";

export function ForbiddenError() {
  const router = useRouter();
  return (
    <div className="h-svh w-full">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <ShieldX className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-4 text-[7rem] leading-tight font-bold">403</h1>
        <span className="font-medium">Truy cập bị từ chối</span>
        <p className="text-muted-foreground text-center">
          Bạn không có quyền truy cập tài nguyên này. <br />
          Liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
