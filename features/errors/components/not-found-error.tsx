"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export function NotFoundError() {
  const router = useRouter();

  return (
    <div className="h-svh w-full">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <FileQuestion className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-4 text-[7rem] leading-tight font-bold">404</h1>
        <span className="font-medium">Không tìm thấy trang!</span>
        <p className="text-muted-foreground text-center">
          Trang bạn đang tìm kiếm không tồn tại hoặc <br />
          bạn cần đăng nhập để truy cập.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button onClick={() => router.push("/sign-in")}>
            <LogIn className="mr-2 h-4 w-4" />
            Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
}
