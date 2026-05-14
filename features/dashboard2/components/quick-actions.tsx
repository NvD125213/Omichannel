"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Plus, Settings } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex items-center space-x-2">
      <Button className="cursor-pointer">
        <Plus className="size-4" />
        Tạo đơn mới
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="cursor-pointer">
            <Settings className="size-4" />
            Thao tác
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer">
            <FileText className="size-4" />
            Tạo báo cáo
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Download className="size-4" />
            Xuất dữ liệu
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="size-4" />
            Cài đặt bảng điều khiển
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
